(function() {
  var CHECK_INTERVAL = 2000;
  var interval = null;
  var executing = false;
  var swipeY = 0;
  var isSwiping = false;

  function init() {
    if (interval) return;
    checkPending();
    checkNotification();
    interval = setInterval(function() {
      checkPending();
      checkNotification();
    }, CHECK_INTERVAL);

    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        checkPending();
        checkNotification();
      }
    });

    window.addEventListener('focus', function() {
      checkPending();
      checkNotification();
    });

    window.addEventListener('pageshow', function(e) {
      if (e.persisted) {
        checkPending();
        checkNotification();
      }
    });
  }

  function broadcastMessage(message, from) {
    if (window.GlobalChat && window.GlobalChat.send) {
      window.GlobalChat.send({
        type: 'new_message',
        message: message,
        from: from || 'Char',
        timestamp: Date.now()
      });
    }
  }

  function isOnChatRoom() {
    return window.location.pathname.indexOf('chat-room.html') !== -1;
  }

  function checkPending() {
    var data = localStorage.getItem('pending_ai_request');
    if (!data) return;
    try {
      var req = JSON.parse(data);
      if (Date.now() - req.timestamp > 600000) {
        localStorage.removeItem('pending_ai_request');
        return;
      }
      var processed = JSON.parse(localStorage.getItem('processed_requests') || '[]');
      if (processed.includes(req.id)) return;

      var processingStamp = localStorage.getItem('processing_on_chatroom');
      if (processingStamp) {
        var elapsed = Date.now() - parseInt(processingStamp);
        if (elapsed < 30000) {
          console.log('Chatroom is processing, skipping background check');
          return;
        }
      }

      if (!isOnChatRoom()) {
        if (executing) return;
        console.log('Executing background API request:', req.id);
        execute(req);
        return;
      }

      if (executing) return;
      console.log('Executing on chatroom API request:', req.id);
      execute(req);
    } catch(e) {}
  }

  function retryOrRemove(req) {
    req.retryCount = (req.retryCount || 0) + 1;
    if (req.retryCount >= 3) {
      localStorage.removeItem('pending_ai_request');
    } else {
      req.timestamp = Date.now();
      localStorage.setItem('pending_ai_request', JSON.stringify(req));
    }
  }

  async function execute(req) {
    executing = true;
    var config = JSON.parse(localStorage.getItem('default_api_preset') || '{}');
    if (!config.url || !config.key) { executing = false; return; }
    try {
      var fullUrl = config.url.replace(/\/+$/, '') + '/chat/completions';
      var response = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + config.key },
        body: JSON.stringify({
          model: config.selectedModel || 'gpt-3.5-turbo',
          messages: req.messages,
          max_tokens: 10000,
          temperature: 0.8
        })
      });
      if (!response.ok) {
        retryOrRemove(req);
        executing = false;
        return;
      }
      var data = await response.json();
      var reply = data.choices?.[0]?.message?.content?.trim();
      if (!reply) {
        retryOrRemove(req);
        executing = false;
        return;
      }
      reply = reply.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu, '');
      
      var replyParts = reply.split('\n').filter(function(p) { return p.trim().length > 0; });
      
      if (replyParts.length === 1 && reply.length > 100) {
        replyParts = reply.split(/[。！？]+/).filter(function(p) { return p.trim().length > 0; });
      }
      
      if (replyParts.length < 2) {
        var text = replyParts[0] || reply;
        replyParts = [];
        var sentences = text.split(/([。！？]+)/).filter(function(p) { return p.trim(); });
        var current = '';
        sentences.forEach(function(s) {
          if (current.length + s.length < 50) {
            current += s;
          } else {
            if (current) replyParts.push(current);
            current = s;
          }
        });
        if (current) replyParts.push(current);
        if (replyParts.length < 2) {
          var half = Math.ceil(text.length / 2);
          replyParts = [text.slice(0, half), text.slice(half)];
        }
      } else if (replyParts.length > 5) {
        replyParts = replyParts.slice(0, 5);
      }
      
      replyParts = replyParts.map(function(p) { return p.trim(); });
      
      localStorage.removeItem('pending_ai_request');
      var processed = JSON.parse(localStorage.getItem('processed_requests') || '[]');
      if (!processed.includes(req.id)) {
        processed.push(req.id);
        localStorage.setItem('processed_requests', JSON.stringify(processed));
      }
      var existingNotif = localStorage.getItem('ai_notification');
      if (existingNotif) {
        try {
          var n = JSON.parse(existingNotif);
          if (n.id === req.id) { executing = false; return; }
        } catch(e) {}
      }
      localStorage.setItem('ai_notification', JSON.stringify({
        id: req.id, parts: replyParts, timestamp: Date.now(), shown: false
      }));
      try {
        var saved = JSON.parse(localStorage.getItem('chat_messages') || '[]');
        replyParts.forEach(function(part) {
          saved.push({ text: part.trim(), role: 'received', time: new Date().toISOString() });
        });
        localStorage.setItem('chat_messages', JSON.stringify(saved));

        var charNickname = getCharNickname();
        var fullMessage = replyParts.join(' ');
        broadcastMessage(fullMessage, charNickname);
      } catch(e) {}
    } catch(e) {
      console.error('Background AI request failed:', e);
      retryOrRemove(req);
    }
    executing = false;
  }

  function checkNotification() {
    if (isOnChatRoom()) return;
    var notifData = localStorage.getItem('ai_notification');
    if (!notifData) return;
    try {
      var notif = JSON.parse(notifData);
      if (notif.shown) return;
      if (Date.now() - notif.timestamp > 600000) {
        localStorage.removeItem('ai_notification');
        return;
      }

      // Check if user has viewed chat before this notification was created
      var chatViewedTime = localStorage.getItem('chat_viewed_time');
      if (chatViewedTime && parseInt(chatViewedTime) > notif.timestamp) {
        console.log('User already viewed chat, skipping popup');
        return;
      }

      showPopupSequence(notif);
    } catch(e) {
      localStorage.removeItem('ai_notification');
    }
  }

  function getChatRoomUrl() {
    return window.location.pathname.includes('/Chat/') ? 'chat-room.html' : 'Chat/chat-room.html';
  }

  function getCharNickname() {
    var nickname = localStorage.getItem('char_nickname');
    if (nickname) return nickname;
    try {
      var charData = JSON.parse(localStorage.getItem('profile_char') || '{}');
      return charData.name || 'Char';
    } catch(e) {
      return 'Char';
    }
  }

  function showPopupSequence(data) {
    var parts = data.parts || [data.text || ''];
    if (parts.length === 0) parts = [''];
    parts.forEach(function(part, i) {
      setTimeout(function() {
        if (document.querySelector('.ai-notif-popup')) return;
        showPopup(part.trim());
        if (i === parts.length - 1) {
          data.shown = true;
          localStorage.setItem('ai_notification', JSON.stringify(data));
        }
      }, i * 2000);
    });
  }

  function showPopup(text) {
    var existing = document.querySelector('.ai-notif-popup');
    if (existing) existing.remove();

    var nickname = getCharNickname();

    var popup = document.createElement('div');
    popup.className = 'ai-notif-popup';
    popup.innerHTML =
      '<div class="ai-notif-inner">' +
        '<div class="ai-notif-top">' +
          '<span class="ai-notif-label">New Message</span>' +
          '<span class="ai-notif-close">×</span>' +
        '</div>' +
        '<div class="ai-notif-from">' + escapeHtml(nickname) + '</div>' +
        '<div class="ai-notif-text">' + escapeHtml(text) + '</div>' +
      '</div>';

    popup.querySelector('.ai-notif-close').onclick = function(e) {
      e.stopPropagation();
      popup.classList.add('dismiss');
      setTimeout(function() { if (popup.parentNode) popup.remove(); }, 250);
    };

    popup.onclick = function(e) {
      if (e.target.closest('.ai-notif-close')) return;
      window.location.href = getChatRoomUrl();
    };

    popup.addEventListener('touchstart', function(e) {
      swipeY = e.touches[0].clientY;
      isSwiping = false;
    }, { passive: true });

    popup.addEventListener('touchmove', function(e) {
      var dy = e.touches[0].clientY - swipeY;
      if (dy < -10) {
        isSwiping = true;
        popup.style.transform = 'translateX(-50%) translateY(' + dy + 'px)';
        popup.style.transition = 'none';
      }
    }, { passive: true });

    popup.addEventListener('touchend', function(e) {
      if (!isSwiping) return;
      var dy = e.changedTouches[0].clientY - swipeY;
      if (dy < -60) {
        popup.classList.add('dismiss');
        setTimeout(function() { if (popup.parentNode) popup.remove(); }, 250);
      } else {
        popup.style.transform = '';
        popup.style.transition = '';
      }
      isSwiping = false;
    }, { passive: true });

    document.body.appendChild(popup);

    setTimeout(function() {
      if (popup.parentNode) {
        popup.classList.add('dismiss');
        setTimeout(function() { if (popup.parentNode) popup.remove(); }, 250);
      }
    }, 2000);
  }

  function escapeHtml(text) {
    var d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  var style = document.createElement('style');
  style.textContent =
    '.ai-notif-popup{' +
      'position:fixed;top:calc(80px + env(safe-area-inset-top, 0px));left:50%;transform:translateX(-50%);' +
      'width:calc(100% - 40px);max-width:400px;z-index:99999;cursor:pointer;' +
      'animation:aiNotifIn 0.3s ease' +
    '}' +
    '.ai-notif-popup.dismiss{' +
      'animation:aiNotifOut 0.25s ease forwards' +
    '}' +
    '.ai-notif-inner{' +
      'background:#fff;border-radius:16px;padding:10px 16px;' +
      'box-shadow:0 8px 40px rgba(0,0,0,0.12)' +
    '}' +
    '.ai-notif-top{' +
      'display:flex;justify-content:space-between;align-items:center;margin-bottom:4px' +
    '}' +
    '.ai-notif-label{' +
      'font-size:12px;font-weight:600;color:#333;letter-spacing:0.5px' +
    '}' +
    '.ai-notif-close{' +
      'font-size:18px;color:#bbb;line-height:1;padding:0 2px;background:none;border:none;cursor:pointer' +
    '}' +
    '.ai-notif-from{' +
      'font-size:12px;color:#666;margin-bottom:6px;font-weight:500' +
    '}' +
    '.ai-notif-text{' +
      'font-size:11px;color:#999;line-height:1.4' +
    '}' +
    '@keyframes aiNotifIn{' +
      'from{transform:translateX(-50%) translateY(-120px);opacity:0}' +
      'to{transform:translateX(-50%) translateY(0);opacity:1}' +
    '}' +
    '@keyframes aiNotifOut{' +
      'from{transform:translateX(-50%) translateY(0);opacity:1}' +
      'to{transform:translateX(-50%) translateY(-120px);opacity:0}' +
    '}';
  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();