(function() {
    var ws = null;
    var reconnectAttempts = 0;
    var maxReconnectAttempts = 10;
    var reconnectDelay = 3000;
    var isConnected = false;
    var notificationPermission = false;
    var isConnecting = false;
    var pendingReconnect = null;

    var toastContainer = null;

    function getWsUrl() {
        var protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        var host = window.location.hostname || '192.168.1.198';
        var port = window.location.port || '3000';
        return protocol + '//' + host + ':' + port;
    }

    function initToast() {
        if (toastContainer) return;
        toastContainer = document.createElement('div');
        toastContainer.id = 'global-toast-container';
        toastContainer.style.cssText =
            'position:fixed;top:80px;right:20px;z-index:99999;' +
            'display:flex;flex-direction:column;gap:10px;' +
            'pointer-events:none;';
        document.body.appendChild(toastContainer);

        var style = document.createElement('style');
        style.textContent = [
            '.global-toast {',
            '  background:#fff;border-radius:12px;padding:14px 18px;',
            '  box-shadow:0 4px 20px rgba(0,0,0,0.15);',
            '  max-width:300px;animation:globalToastIn 0.3s ease;',
            '  pointer-events:auto;cursor:pointer;',
            '}',
            '.global-toast.dismiss {',
            '  animation:globalToastOut 0.25s ease forwards;',
            '}',
            '.global-toast-header {',
            '  display:flex;justify-content:space-between;align-items:center;',
            '  margin-bottom:6px;',
            '}',
            '.global-toast-from {',
            '  font-size:13px;font-weight:600;color:#333;',
            '}',
            '.global-toast-badge {',
            '  background:#ff6b9d;color:#fff;font-size:10px;padding:2px 6px;',
            '  border-radius:8px;font-weight:500;',
            '}',
            '.global-toast-close {',
            '  font-size:16px;color:#bbb;cursor:pointer;margin-left:10px;',
            '}',
            '.global-toast-text {',
            '  font-size:12px;color:#666;line-height:1.4;',
            '  overflow:hidden;text-overflow:ellipsis;',
            '  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;',
            '}',
            '.global-toast-avatar {',
            '  width:28px;height:28px;border-radius:50%;margin-right:10px;',
            '  background-size:cover;background-position:center;',
            '  background-color:#f0f0f0;flex-shrink:0;',
            '}',
            '.global-toast-content {',
            '  display:flex;align-items:flex-start;',
            '}',
            '.global-toast-body {',
            '  flex:1;min-width:0;',
            '}',
            '@keyframes globalToastIn {',
            '  from{transform:translateX(100%);opacity:0}',
            '  to{transform:translateX(0);opacity:1}',
            '}',
            '@keyframes globalToastOut {',
            '  from{transform:translateX(0);opacity:1}',
            '  to{transform:translateX(100%);opacity:0}',
            '}'
        ].join('');
        document.head.appendChild(style);
    }

    function showToast(data) {
        initToast();

        var toast = document.createElement('div');
        toast.className = 'global-toast';

        var avatarHtml = '';
        if (data.avatar) {
            avatarHtml = '<div class="global-toast-avatar" style="background-image:url(' + data.avatar + ')"></div>';
        } else {
            avatarHtml = '<div class="global-toast-avatar"></div>';
        }

        toast.innerHTML =
            '<div class="global-toast-content">' +
                avatarHtml +
                '<div class="global-toast-body">' +
                    '<div class="global-toast-header">' +
                        '<span class="global-toast-from">' + escapeHtml(data.from || 'Char') + '</span>' +
                        '<span class="global-toast-close">×</span>' +
                    '</div>' +
                    '<div class="global-toast-text">' + escapeHtml(data.message || '') + '</div>' +
                '</div>' +
            '</div>';

        var closeBtn = toast.querySelector('.global-toast-close');
        closeBtn.onclick = function(e) {
            e.stopPropagation();
            dismissToast(toast);
        };

        toast.onclick = function() {
            dismissToast(toast);
            if (data.link) {
                window.location.href = data.link;
            }
        };

        toastContainer.appendChild(toast);

        setTimeout(function() {
            if (toast.parentNode) {
                dismissToast(toast);
            }
        }, 5000);
    }

    function dismissToast(toast) {
        toast.classList.add('dismiss');
        setTimeout(function() {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 250);
    }

    async function requestNotificationPermission() {
        if (!('Notification' in window)) return false;
        if (Notification.permission === 'granted') {
            notificationPermission = true;
            return true;
        }
        if (Notification.permission !== 'denied') {
            var permission = await Notification.requestPermission();
            notificationPermission = permission === 'granted';
            return notificationPermission;
        }
        return false;
    }

    function showBrowserNotification(data) {
        if (!notificationPermission) return;

        var title = data.from || 'Char';
        var options = {
            body: data.message || '',
            icon: data.avatar || 'https://i.postimg.cc/vBY98wDL/IMG-9251.jpg',
            tag: 'char-message',
            requireInteraction: false
        };

        try {
            var notification = new Notification(title, options);
            notification.onclick = function() {
                window.focus();
                if (data.link) {
                    window.location.href = data.link;
                }
                notification.close();
            };
            setTimeout(function() {
                notification.close();
            }, 10000);
        } catch(e) {
            console.error('Notification error:', e);
        }
    }

    function connect() {
        if (isConnecting) return;
        if (ws && ws.readyState === WebSocket.OPEN) return;
        if (ws && ws.readyState === WebSocket.CONNECTING) {
            console.log('WebSocket already connecting, skipping');
            return;
        }

        isConnecting = true;

        try {
            ws = new WebSocket(getWsUrl());

            ws.onopen = function() {
                console.log('Global WebSocket connected');
                isConnected = true;
                isConnecting = false;
                reconnectAttempts = 0;
                if (pendingReconnect) {
                    clearTimeout(pendingReconnect);
                    pendingReconnect = null;
                }
            };

            ws.onmessage = function(event) {
                try {
                    var data = JSON.parse(event.data);
                    handleMessage(data);
                } catch(e) {
                    console.error('WebSocket message parse error:', e);
                }
            };

            ws.onclose = function(e) {
                console.log('Global WebSocket disconnected, code:', e.code);
                isConnected = false;
                isConnecting = false;
                ws = null;
                if (e.code !== 1000 && e.code !== 1001) {
                    attemptReconnect();
                }
            };

            ws.onerror = function(err) {
                console.error('WebSocket error:', err);
                isConnected = false;
                isConnecting = false;
            };
        } catch(e) {
            console.error('WebSocket connection error:', e);
            isConnecting = false;
            attemptReconnect();
        }
    }

    function attemptReconnect() {
        if (pendingReconnect) return;
        if (reconnectAttempts >= maxReconnectAttempts) {
            console.log('Max reconnect attempts reached');
            return;
        }
        reconnectAttempts++;
        var delay = reconnectDelay * Math.min(reconnectAttempts, 5);
        console.log('Reconnecting in ' + delay + 'ms...');
        pendingReconnect = setTimeout(function() {
            pendingReconnect = null;
            connect();
        }, delay);
    }

    function handleMessage(data) {
        console.log('Global WebSocket message received:', data);

        if (data.type === 'new_message' || data.type === 'notification') {
            // Check if user has already viewed chat before this message
            var chatViewedTime = localStorage.getItem('chat_viewed_time');
            if (chatViewedTime && parseInt(chatViewedTime) > data.timestamp) {
                console.log('User already viewed chat, skipping toast for this message');
                // Still call the handler for chatroom to reload messages
                if (window.GlobalChatHandlers && window.GlobalChatHandlers.onMessage) {
                    window.GlobalChatHandlers.onMessage(data);
                }
                return;
            }

            var chatRoomUrl = getChatRoomUrl();

            console.log('Showing toast for message from:', data.from);
            showToast({
                from: data.from,
                message: data.message,
                avatar: data.avatar,
                link: chatRoomUrl
            });

            if (!isOnChatRoom()) {
                console.log('Not on chatroom, showing browser notification');
                showBrowserNotification({
                    from: data.from,
                    message: data.message,
                    avatar: data.avatar,
                    link: chatRoomUrl
                });
            }

            if (window.GlobalChatHandlers && window.GlobalChatHandlers.onMessage) {
                console.log('Calling GlobalChatHandlers.onMessage');
                window.GlobalChatHandlers.onMessage(data);
            }
        }
    }

    function getChatRoomUrl() {
        var pathname = window.location.pathname;
        if (pathname.indexOf('/Chat/') !== -1 || pathname.indexOf('\\Chat\\') !== -1) {
            return 'chat-room.html';
        }
        return 'Chat/chat-room.html';
    }

    function isOnChatRoom() {
        return window.location.pathname.indexOf('chat-room.html') !== -1;
    }

    function send(data) {
        if (!ws) {
            console.log('WebSocket not initialized, connecting...');
            connect();
            return;
        }
        if (ws.readyState === WebSocket.CONNECTING) {
            console.log('WebSocket still connecting, message will not be sent');
            return;
        }
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        } else {
            console.log('WebSocket not open, state:', ws.readyState);
        }
    }

    function getStatus() {
        return {
            connected: isConnected,
            connecting: isConnecting,
            attempts: reconnectAttempts
        };
    }

    window.GlobalChat = {
        connect: connect,
        send: send,
        showToast: showToast,
        getWsUrl: getWsUrl,
        getStatus: getStatus
    };

    function init() {
        requestNotificationPermission();

        console.log('Initializing GlobalChat...');
        connect();

        var connectionCheckInterval = setInterval(function() {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                console.log('WebSocket not connected, attempting to connect...');
                reconnectAttempts = 0;
                connect();
            }
        }, 10000);

        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                console.log('Page visible, checking WebSocket connection');
                if (!isConnected && !isConnecting) {
                    console.log('Page visible, reconnecting WebSocket');
                    reconnectAttempts = 0;
                    connect();
                }
            }
        });

        window.addEventListener('focus', function() {
            console.log('Window focused, checking WebSocket connection');
            if (!isConnected && !isConnecting) {
                console.log('Window focused, reconnecting WebSocket');
                reconnectAttempts = 0;
                connect();
            }
        });

        window.addEventListener('pageshow', function(e) {
            if (e.persisted) {
                console.log('Page restored from cache, reconnecting WebSocket');
                reconnectAttempts = 0;
                connect();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();