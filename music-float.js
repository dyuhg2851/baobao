// 音乐悬浮窗公共脚本
(function() {
    const musicFloat = document.getElementById('music-float');
    const floatClose = document.getElementById('float-close');
    let audioInstance = null;

    // 关闭按钮事件
    if (floatClose) {
        floatClose.addEventListener('click', function(e) {
            e.stopPropagation();
            if (audioInstance) {
                audioInstance.pause();
                audioInstance = null;
            }
            if (musicFloat) {
                musicFloat.style.display = 'none';
            }
            localStorage.removeItem('music_audio_state');
            localStorage.removeItem('float_visible');
            
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'STOP_MUSIC'
                });
            }
        });
    }

    // 尝试播放音乐
    function tryPlayMusic(state) {
        if (!audioInstance && state.currentSong && state.currentSong.url) {
            audioInstance = new Audio();
            audioInstance.src = state.currentSong.url;
            audioInstance.currentTime = state.currentTime || 0;
            audioInstance.loop = true;
            
            audioInstance.play().then(() => {
                console.log('音乐播放成功');
            }).catch(e => {
                console.log('自动播放失败，等待用户交互:', e);
                
                const handleFirstInteraction = function(e) {
                    if (audioInstance && state.isPlaying) {
                        audioInstance.play().then(() => {
                            console.log('用户交互后播放成功');
                        }).catch(err => console.log('用户交互后播放失败:', err));
                    }
                    document.removeEventListener('click', handleFirstInteraction);
                    document.removeEventListener('touchstart', handleFirstInteraction);
                };
                
                document.addEventListener('click', handleFirstInteraction);
                document.addEventListener('touchstart', handleFirstInteraction);
            });
        }
    }

    // 初始化悬浮窗
    function initFloatWindow() {
        console.log('initFloatWindow 被调用');
        
        if (!musicFloat) return;
        
        const savedAudioState = localStorage.getItem('music_audio_state');
        const floatVisible = localStorage.getItem('float_visible');
        
        console.log('savedAudioState:', savedAudioState ? '存在' : '不存在');
        console.log('floatVisible:', floatVisible);
        
        if (savedAudioState && floatVisible === 'true') {
            try {
                const state = JSON.parse(savedAudioState);
                console.log('解析的状态:', state);
                
                if (state.currentSong) {
                    console.log('当前歌曲:', state.currentSong);
                    
                    const floatSongName = document.getElementById('float-song-name');
                    const floatLyric = document.getElementById('float-lyric');
                    const floatCover = document.getElementById('float-cover');
                    const floatVinylRecord = document.getElementById('float-vinyl-record');
                    
                    if (floatSongName) {
                        floatSongName.textContent = state.currentSong.name + ' - ' + state.currentSong.artist;
                    }
                    if (floatLyric) {
                        floatLyric.textContent = '正在播放...';
                    }
                    if (floatCover) {
                        floatCover.src = state.currentSong.cover || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"%3E%3Crect fill="%23e0e0e0" width="60" height="60"/%3E%3Ctext fill="%23999" font-family="Arial" font-size="12" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EAlbum%3C/text%3E%3C/svg%3E';
                    }
                    if (floatVinylRecord) {
                        floatVinylRecord.classList.add('playing');
                    }
                    
                    musicFloat.style.display = 'block';
                    musicFloat.style.visibility = 'visible';
                    musicFloat.style.opacity = '1';
                    
                    console.log('悬浮窗已显示');
                    
                    // 单击悬浮窗歌曲图片跳转到music页面
                    const floatVinyl = document.querySelector('.float-vinyl');
                    if (floatVinyl) {
                        floatVinyl.addEventListener('click', function() {
                            if (audioInstance) {
                                state.currentTime = audioInstance.currentTime;
                                state.isPlaying = !audioInstance.paused;
                                localStorage.setItem('music_audio_state', JSON.stringify(state));
                            }
                            window.location.href = 'Music/music.html';
                        });
                    }
                    
                    // 尝试播放音乐
                    if (state.isPlaying) {
                        tryPlayMusic(state);
                    }
                    
                    // 拖拽功能
                    let isDragging = false;
                    let startX, startY, initialX, initialY;
                    
                    const startDrag = function(e) {
                        isDragging = true;
                        const touch = e.touches ? e.touches[0] : e;
                        startX = touch.clientX;
                        startY = touch.clientY;
                        initialX = musicFloat.offsetLeft;
                        initialY = musicFloat.offsetTop;
                        musicFloat.style.cursor = 'grabbing';
                        e.preventDefault();
                    };
                    
                    const drag = function(e) {
                        if (!isDragging) return;
                        const touch = e.touches ? e.touches[0] : e;
                        const deltaX = touch.clientX - startX;
                        const deltaY = touch.clientY - startY;
                        musicFloat.style.left = (initialX + deltaX) + 'px';
                        musicFloat.style.top = (initialY + deltaY) + 'px';
                        musicFloat.style.bottom = 'auto';
                        musicFloat.style.transform = 'none';
                    };
                    
                    const endDrag = function() {
                        isDragging = false;
                        musicFloat.style.cursor = 'grab';
                    };
                    
                    // 鼠标事件
                    musicFloat.addEventListener('mousedown', startDrag);
                    document.addEventListener('mousemove', drag);
                    document.addEventListener('mouseup', endDrag);
                    
                    // 触摸事件
                    musicFloat.addEventListener('touchstart', startDrag);
                    document.addEventListener('touchmove', drag);
                    document.addEventListener('touchend', endDrag);
                    
                    // 定期保存音频状态
                    setInterval(function() {
                        if (audioInstance && !audioInstance.paused) {
                            const audioState = {
                                currentSong: state.currentSong,
                                currentTime: audioInstance.currentTime,
                                isPlaying: true,
                                listenTime: state.listenTime,
                                showFloat: true
                            };
                            localStorage.setItem('music_audio_state', JSON.stringify(audioState));
                            
                            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                                navigator.serviceWorker.controller.postMessage({
                                    type: 'PLAY_MUSIC',
                                    state: audioState
                                });
                            }
                        }
                    }, 1000);
                }
            } catch (e) {
                console.log('解析音频状态失败:', e);
                localStorage.removeItem('music_audio_state');
                localStorage.removeItem('float_visible');
            }
        }
    }

    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFloatWindow);
    } else {
        initFloatWindow();
    }
})();