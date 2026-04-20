document.addEventListener('DOMContentLoaded', function() {
    // 元素引用
    const backBtn = document.getElementById('back-btn');
    const addBtn = document.getElementById('add-btn');
    const saveBtn = document.getElementById('save-btn');
    const songNameInput = document.getElementById('song-name');
    const artistNameInput = document.getElementById('artist-name');
    const musicUrlInput = document.getElementById('music-url');
    const lyricsFileInput = document.getElementById('lyrics-file');
    const coverUrlInput = document.getElementById('cover-url');
    const listenMinutesElement = document.getElementById('listen-minutes');
    const vinylRecord = document.getElementById('vinyl-record');
    const coverImage = document.getElementById('cover-image');
    const songTitleElement = document.getElementById('song-title');
    const artistNameDisplay = document.getElementById('artist-name-display');
    const currentLyricElement = document.getElementById('current-lyric');
    const nextLyricElement = document.getElementById('next-lyric');
    const currentTimeElement = document.getElementById('current-time');
    const totalTimeElement = document.getElementById('total-time');
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.getElementById('progress-fill');
    const progressHandle = document.getElementById('progress-handle');
    const playBtn = document.getElementById('play-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const playlistBtn = document.getElementById('playlist-btn');
    const playlistModal = document.getElementById('playlist-modal');
    const closePlaylistBtn = document.getElementById('close-playlist');
    const playlistItems = document.getElementById('playlist-items');
    const deleteModal = document.getElementById('delete-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const addSongModal = document.getElementById('add-song-modal');
    const cancelAddSongBtn = document.getElementById('cancel-add-song');

    // 音乐播放器相关变量
    let audio = new Audio();
    let isPlaying = false;
    let currentSongIndex = 0;
    let songs = [];
    let currentLyrics = [];
    let currentLyricIndex = 0;
    let listenTime = 0; // 单位：分钟
    let progressInterval;

    // 从本地存储加载数据
    function loadData() {
        // 加载歌曲列表
        const savedSongs = localStorage.getItem('music_songs');
        if (savedSongs) {
            songs = JSON.parse(savedSongs);
            if (songs.length > 0) {
                loadSong(0);
            }
        }

        // 加载听歌时间
        const savedListenTime = localStorage.getItem('music_listen_time');
        if (savedListenTime) {
            listenTime = parseInt(savedListenTime);
            updateListenTimeDisplay();
        }

        // 加载当前播放索引
        const savedCurrentIndex = localStorage.getItem('music_current_index');
        if (savedCurrentIndex && songs.length > 0) {
            currentSongIndex = parseInt(savedCurrentIndex);
            loadSong(currentSongIndex);
        }
    }

    // 保存数据到本地存储
    function saveData() {
        localStorage.setItem('music_songs', JSON.stringify(songs));
        localStorage.setItem('music_listen_time', listenTime.toString());
        localStorage.setItem('music_current_index', currentSongIndex.toString());
    }

    // 更新听歌时间显示
    function updateListenTimeDisplay() {
        listenMinutesElement.textContent = listenTime;
    }

    // 增加听歌时间
    function incrementListenTime() {
        if (isPlaying) {
            listenTime++;
            updateListenTimeDisplay();
            saveData();
        }
    }

    // 加载歌曲
    function loadSong(index) {
        if (songs.length === 0 || index < 0 || index >= songs.length) return;

        currentSongIndex = index;
        const song = songs[index];

        // 更新歌曲信息
        songTitleElement.textContent = song.name;
        artistNameDisplay.textContent = song.artist;
        coverImage.src = song.cover || 'https://via.placeholder.com/200';

        // 加载音频
        audio.src = song.musicUrl;

        // 加载歌词
        if (song.lyricsContent) {
            parseLyrics(song.lyricsContent);
        } else {
            currentLyrics = [];
            currentLyricIndex = 0;
            currentLyricElement.textContent = '暂无歌词';
            nextLyricElement.textContent = '';
        }

        // 保存当前索引
        saveData();

        // 更新播放列表
        updatePlaylist();
    }

    // 加载歌词
    function loadLyrics(url) {
        console.log('开始加载歌词:', url);
        if (!url) {
            console.error('歌词URL为空');
            currentLyrics = [];
            currentLyricIndex = 0;
            currentLyricElement.textContent = '暂无歌词';
            nextLyricElement.textContent = '';
            return;
        }
        
        fetch(url)
            .then(response => {
                console.log('歌词加载响应:', response);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(text => {
                console.log('歌词内容:', text);
                if (!text) {
                    throw new Error('歌词内容为空');
                }
                parseLyrics(text);
            })
            .catch(error => {
                console.error('加载歌词失败:', error);
                currentLyrics = [];
                currentLyricIndex = 0;
                currentLyricElement.textContent = '加载歌词失败';
                nextLyricElement.textContent = '';
            });
    }

    // 解析歌词
    function parseLyrics(text) {
        console.log('开始解析歌词');
        const lines = text.split('\n');
        const lyrics = [];

        lines.forEach(line => {
            const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const milliseconds = parseInt(match[3]);
                const time = minutes * 60 + seconds + milliseconds / 1000;
                const lyric = match[4].trim();
                if (lyric) {
                    lyrics.push({ time, lyric });
                }
            }
        });

        console.log('解析完成，歌词数量:', lyrics.length);
        currentLyrics = lyrics;
        currentLyricIndex = 0;
        
        // 初始化歌词显示
        if (lyrics.length > 0) {
            currentLyricElement.textContent = lyrics[0].lyric;
            nextLyricElement.textContent = lyrics[1] ? lyrics[1].lyric : '';
        } else {
            currentLyricElement.textContent = '暂无歌词';
            nextLyricElement.textContent = '';
        }
    }

    // 更新歌词显示
    function updateLyrics() {
        if (currentLyrics.length === 0) return;

        const currentTime = audio.currentTime;
        let index = 0;

        for (let i = 0; i < currentLyrics.length; i++) {
            if (currentLyrics[i].time <= currentTime) {
                index = i;
            } else {
                break;
            }
        }

        if (index !== currentLyricIndex) {
            currentLyricIndex = index;
            currentLyricElement.textContent = currentLyrics[index].lyric;
            nextLyricElement.textContent = currentLyrics[index + 1] ? currentLyrics[index + 1].lyric : '';
        }
    }

    // 播放/暂停歌曲
    function togglePlay() {
        if (isPlaying) {
            audio.pause();
            vinylRecord.classList.remove('playing');
            playBtn.classList.remove('playing');
            clearInterval(progressInterval);
        } else {
            audio.play();
            vinylRecord.classList.add('playing');
            playBtn.classList.add('playing');
            progressInterval = setInterval(updateProgress, 100);
        }
        isPlaying = !isPlaying;
    }

    // 上一首
    function playPrev() {
        if (songs.length === 0) return;
        currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        loadSong(currentSongIndex);
        if (isPlaying) {
            audio.play();
        }
    }

    // 下一首
    function playNext() {
        if (songs.length === 0) return;
        currentSongIndex = (currentSongIndex + 1) % songs.length;
        loadSong(currentSongIndex);
        if (isPlaying) {
            audio.play();
        }
    }

    // 更新进度条
    function updateProgress() {
        if (audio.duration) {
            const progress = (audio.currentTime / audio.duration) * 100;
            progressFill.style.width = `${progress}%`;
            progressHandle.style.left = `${progress}%`;
            updateTimeDisplay();
            updateLyrics();
        }
    }

    // 更新时间显示
    function updateTimeDisplay() {
        currentTimeElement.textContent = formatTime(audio.currentTime);
        totalTimeElement.textContent = formatTime(audio.duration || 0);
    }

    // 格式化时间
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // 拖动进度条
    let isDragging = false;

    progressBar.addEventListener('mousedown', function(e) {
        isDragging = true;
        updateProgressFromClick(e);
    });

    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            updateProgressFromClick(e);
        }
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
    });

    progressBar.addEventListener('touchstart', function(e) {
        isDragging = true;
        updateProgressFromTouch(e);
    });

    document.addEventListener('touchmove', function(e) {
        if (isDragging) {
            updateProgressFromTouch(e);
        }
    });

    document.addEventListener('touchend', function() {
        isDragging = false;
    });

    function updateProgressFromClick(e) {
        const rect = progressBar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const progress = (x / width) * 100;
        setProgress(progress);
    }

    function updateProgressFromTouch(e) {
        const rect = progressBar.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const width = rect.width;
        const progress = (x / width) * 100;
        setProgress(progress);
    }

    function setProgress(progress) {
        if (audio.duration) {
            const time = (progress / 100) * audio.duration;
            audio.currentTime = time;
            progressFill.style.width = `${progress}%`;
            progressHandle.style.left = `${progress}%`;
            updateTimeDisplay();
            updateLyrics();
        }
    }

    // 添加歌曲
    function addSong() {
        const name = songNameInput.value.trim();
        const artist = artistNameInput.value.trim();
        const musicUrl = musicUrlInput.value.trim();
        const lyricsFile = lyricsFileInput.files[0];
        const cover = coverUrlInput.value.trim();

        if (!name || !artist || !musicUrl) {
            alert('请填写歌曲名、歌手名和音乐文件URL');
            return;
        }

        const song = {
            name,
            artist,
            musicUrl,
            cover
        };

        if (lyricsFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                song.lyricsContent = e.target.result;
                songs.push(song);
                saveData();
                loadSong(songs.length - 1);

                // 清空输入框
                songNameInput.value = '';
                artistNameInput.value = '';
                musicUrlInput.value = '';
                lyricsFileInput.value = '';
                coverUrlInput.value = '';

                // 隐藏添加歌曲弹窗
                addSongModal.style.display = 'none';

                alert('歌曲添加成功');
            };
            reader.readAsText(lyricsFile);
        } else {
            songs.push(song);
            saveData();
            loadSong(songs.length - 1);

            // 清空输入框
            songNameInput.value = '';
            artistNameInput.value = '';
            musicUrlInput.value = '';
            lyricsFileInput.value = '';
            coverUrlInput.value = '';

            // 隐藏添加歌曲弹窗
            addSongModal.style.display = 'none';

            alert('歌曲添加成功');
        }
    }

    // 更新播放列表
    function updatePlaylist() {
        playlistItems.innerHTML = '';

        songs.forEach((song, index) => {
            const playlistItem = document.createElement('div');
            playlistItem.className = 'playlist-item';
            playlistItem.innerHTML = `
                <div class="playlist-item-info">
                    <div class="playlist-item-title">${song.name}</div>
                </div>
                <button class="delete-item-btn" data-index="${index}">×</button>
            `;

            // 点击播放列表项播放歌曲
            playlistItem.addEventListener('click', function(e) {
                if (!e.target.classList.contains('delete-item-btn')) {
                    loadSong(index);
                    if (isPlaying) {
                        audio.play();
                    }
                    playlistModal.style.display = 'none';
                }
            });

            playlistItems.appendChild(playlistItem);
        });

        // 添加删除按钮事件
        document.querySelectorAll('.delete-item-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const index = parseInt(this.getAttribute('data-index'));
                showDeleteModal(index);
            });
        });
    }

    // 显示删除确认弹窗
    let songToDelete = -1;

    function showDeleteModal(index) {
        songToDelete = index;
        deleteModal.style.display = 'flex';
    }

    // 隐藏删除确认弹窗
    function hideDeleteModal() {
        songToDelete = -1;
        deleteModal.style.display = 'none';
    }

    // 删除歌曲
    function deleteSong() {
        if (songToDelete === -1 || songs.length === 0) return;

        songs.splice(songToDelete, 1);
        saveData();

        if (currentSongIndex >= songs.length) {
            currentSongIndex = Math.max(0, songs.length - 1);
        }

        if (songs.length > 0) {
            loadSong(currentSongIndex);
        } else {
            // 清空歌曲信息
            songTitleElement.textContent = '歌曲标题';
            artistNameDisplay.textContent = '歌手名';
            coverImage.src = 'https://via.placeholder.com/200';
            currentLyricElement.textContent = '当前播放的歌词';
            nextLyricElement.textContent = '下一句歌词';
            currentTimeElement.textContent = '0:00';
            totalTimeElement.textContent = '0:00';
            progressFill.style.width = '0%';
            progressHandle.style.left = '0%';
            audio.pause();
            audio.src = '';
            isPlaying = false;
            vinylRecord.classList.remove('playing');
            playBtn.classList.remove('playing');
            clearInterval(progressInterval);
        }

        updatePlaylist();
        hideDeleteModal();
        alert('歌曲删除成功');
    }

    // 事件监听器
    backBtn.addEventListener('click', function() {
        window.location.href = '../index.html';
    });

    addBtn.addEventListener('click', function() {
        // 显示添加歌曲弹窗
        addSongModal.style.display = 'flex';
    });

    cancelAddSongBtn.addEventListener('click', function() {
        // 隐藏添加歌曲弹窗
        addSongModal.style.display = 'none';
    });

    saveBtn.addEventListener('click', addSong);

    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', playPrev);
    nextBtn.addEventListener('click', playNext);

    playlistBtn.addEventListener('click', function() {
        updatePlaylist();
        playlistModal.style.display = 'flex';
    });

    closePlaylistBtn.addEventListener('click', function() {
        playlistModal.style.display = 'none';
    });

    cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    confirmDeleteBtn.addEventListener('click', deleteSong);

    // 点击弹窗外部关闭
    playlistModal.addEventListener('click', function(e) {
        if (e.target === playlistModal) {
            playlistModal.style.display = 'none';
        }
    });

    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal) {
            hideDeleteModal();
        }
    });

    // 音频事件
    audio.addEventListener('loadedmetadata', function() {
        console.log('音频加载完成，时长:', audio.duration);
        updateTimeDisplay();
    });

    audio.addEventListener('ended', function() {
        console.log('音频播放结束');
        playNext();
    });

    audio.addEventListener('error', function(e) {
        console.error('音频错误:', e);
        console.error('错误代码:', e.target.error.code);
        alert('音频播放失败，请检查音频URL是否正确');
    });

    audio.addEventListener('play', function() {
        console.log('音频开始播放');
    });

    audio.addEventListener('pause', function() {
        console.log('音频暂停');
    });

    // 每分钟增加听歌时间
    setInterval(incrementListenTime, 60000);

    // 初始化
    loadData();
    updatePlaylist();
});