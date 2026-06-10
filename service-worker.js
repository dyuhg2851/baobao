// service-worker.js

const CACHE_NAME = 'char-chat-v1';

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
    });