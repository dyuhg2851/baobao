// service-worker.js

const CACHE_NAME = 'char-chat-v1';
const PUSH_VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

// URLs to cache
const CACHE_URLS = [
    '/',
    '/index.html',
    '/Chat/chat.html',
    '/Chat/chat-room.html',
    '/Chat/moments.html',
    '/Chat/me.html',
    '/Chat/profile.html'
];

// Install event - cache core files
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(CACHE_URLS);
        })
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});

// Background music playback
let audio = null;
let audioState = null;
let progressInterval = null;

self.addEventListener('message', function(event) {
    if (event.data.type === 'PLAY_MUSIC') {
        audioState = event.data.state;
        if (!audio) {
            audio = new Audio();
            audio.loop = false; // 不循环，由音乐播放器控制
        }
        audio.src = audioState.currentSong.musicUrl;
        audio.currentTime = audioState.currentTime;
        audio.play().then(() => {
            console.log('Service Worker 开始后台播放');
        }).catch(err => {
            console.error('Service Worker 播放失败:', err);
        });

        if (progressInterval) clearInterval(progressInterval);
        progressInterval = setInterval(function() {
            if (audio && !audio.paused) {
                self.clients.matchAll().then(function(clients) {
                    clients.forEach(function(client) {
                        client.postMessage({
                            type: 'UPDATE_AUDIO_STATE',
                            state: {
                                currentSong: audioState.currentSong,
                                currentTime: audio.currentTime,
                                isPlaying: true,
                                listenTime: audioState.listenTime
                            }
                        });
                    });
                });
            }
        }, 1000);
    } else if (event.data.type === 'PAUSE_MUSIC') {
        if (audio) audio.pause();
    } else if (event.data.type === 'STOP_MUSIC') {
        if (audio) {
            audio.pause();
            audio.src = '';
            audio = null;
        }
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
    } else if (event.data.type === 'PUSH_SUBSCRIBE') {
        subscribeToPush(event.data.endpoint, event.data.keys);
    }
});

// Push notification subscription
function subscribeToPush(endpoint, keys) {
    var subscriptionData = {
        endpoint: endpoint,
        keys: keys
    };
    localStorage.setItem('push_subscription', JSON.stringify(subscriptionData));
}

// Push event handler - received push notification
self.addEventListener('push', function(event) {
    console.log('Push received:', event);

    let data = {
        title: 'Char',
        body: 'You have a new message',
        icon: 'https://i.postimg.cc/vBY98wDL/IMG-9251.jpg',
        badge: 'https://i.postimg.cc/vBY98wDL/IMG-9251.jpg',
        tag: 'char-message',
        requireInteraction: true,
        data: {
            url: '/Chat/chat-room.html'
        }
    };

    try {
        if (event.data) {
            const payload = event.data.json();
            data.title = payload.title || data.title;
            data.body = payload.body || data.body;
            data.icon = payload.icon || data.icon;
            data.data = payload.data || data.data;
            if (!data.data || !data.data.url) {
                data.data = { url: '/Chat/chat-room.html' };
            }
        }
    } catch (e) {
        console.error('Push data parse error:', e);
        try {
            data.body = event.data.text();
        } catch (e2) {}
    }

    event.waitUntil(
        self.registration.showNotification(data.title, data)
    );
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
    console.log('Notification clicked:', event);

    event.notification.close();

    const urlToOpen = event.notification.data && event.notification.data.url
        ? event.notification.data.url
        : '/Chat/chat-room.html';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            // Try to focus existing window
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes('chat-room.html') && 'focus' in client) {
                    client.focus();
                    client.postMessage({
                        type: 'NOTIFICATION_CLICK',
                        data: event.notification.data
                    });
                    return;
                }
            }
            // Open new window if none found
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Notification close handler
self.addEventListener('notificationclose', function(event) {
    console.log('Notification closed:', event);
});