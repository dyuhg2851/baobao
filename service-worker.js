// service-worker.js
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('music-cache').then(function(cache) {
            return cache.addAll([
                '/',
                '/index.html',
                '/style.css',
                '/Music/music.html',
                '/Music/music.css',
                '/Music/music.js'
            ]);
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});

// 后台播放逻辑
let audio = null;
let audioState = null;

self.addEventListener('message', function(event) {
    if (event.data.type === 'PLAY_MUSIC') {
        audioState = event.data.state;
        if (!audio) {
            audio = new Audio();
            audio.src = audioState.currentSong.url;
            audio.currentTime = audioState.currentTime;
            audio.loop = true;
            audio.play();
            
            // 定期保存音频状态
            setInterval(function() {
                if (audio && !audio.paused) {
                    self.clients.matchAll().then(function(clients) {
                        clients.forEach(function(client) {
                            client.postMessage({
                                type: 'UPDATE_AUDIO_STATE',
                                state: {
                                    currentSong: audioState.currentSong,
                                    currentTime: audio.currentTime,
                                    isPlaying: true,
                                    listenTime: audioState.listenTime,
                                    showFloat: true
                                }
                            });
                        });
                    });
                }
            }, 1000);
        }
    } else if (event.data.type === 'PAUSE_MUSIC') {
        if (audio) {
            audio.pause();
        }
    } else if (event.data.type === 'STOP_MUSIC') {
        if (audio) {
            audio.pause();
            audio.src = '';
            audio = null;
        }
    }
});