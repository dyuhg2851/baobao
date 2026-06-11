document.addEventListener('DOMContentLoaded', function() {
    // 右滑返回阻止变量
    let touchStartX = 0;
    let touchStartY = 0;
    const SWIPE_THRESHOLD = 50;
    const EDGE_MARGIN = 50;
    
    // 阻止右滑返回
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
            return;
        }
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: false });
    
    document.addEventListener('touchmove', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
            return;
        }
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = currentX - touchStartX;
        const deltaY = Math.abs(currentY - touchStartY);
        
        if (touchStartX < EDGE_MARGIN && deltaX > SWIPE_THRESHOLD && deltaY < 100) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // 元素引用
    const backBtn = document.getElementById('back-btn');
    const wallpaperThumbnail = document.getElementById('wallpaper-thumbnail');
    const currentWallpaper = document.getElementById('current-wallpaper');
    const blurInput = document.getElementById('blur-input');
    const btnSave = document.getElementById('btn-save');
    const btnDelete = document.getElementById('btn-delete');
    
    // 铃声元素引用
    const ringtoneFile = document.getElementById('ringtone-file');
    const ringtoneFileName = document.getElementById('ringtone-file-name');
    const ringtoneName = document.getElementById('ringtone-name');
    const ringtonePlay = document.getElementById('ringtone-play');
    const ringtoneStop = document.getElementById('ringtone-stop');
    const ringtoneDelete = document.getElementById('ringtone-delete');
    const ringtoneSave = document.getElementById('ringtone-save');
    
    // 铃声音频
    let ringtoneAudio = null;
    let currentRingtoneData = null;
    
    // 模糊度值（0-100%）
    let currentBlur = 0;
    
    // 加载当前壁纸
    loadCurrentWallpaper();
    
    // 返回按钮点击事件
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.replace('../index.html');
        });
    }
    
    // 点击缩略图选择新壁纸
    if (wallpaperThumbnail) {
        wallpaperThumbnail.addEventListener('click', function() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = function(e) {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    currentWallpaper.src = e.target.result;
                };
                reader.readAsDataURL(file);
            };
            input.click();
        });
    }
    
    // 保存壁纸
    if (btnSave) {
        btnSave.addEventListener('click', function() {
            const wallpaperUrl = currentWallpaper.src;
            if (wallpaperUrl) {
                const wallpaperData = {
                    url: wallpaperUrl,
                    blur: currentBlur
                };
                localStorage.setItem('wallpaperData', JSON.stringify(wallpaperData));
                alert('壁纸保存成功^ ^');
            } else {
                alert('请先选择壁纸T^T');
            }
        });
    }
    
    // 删除壁纸（恢复默认）
    if (btnDelete) {
        btnDelete.addEventListener('click', function() {
            if (confirm('确定要恢复默认壁纸吗？')) {
                localStorage.removeItem('wallpaperData');
                loadCurrentWallpaper();
                alert('壁纸已恢复默认^ ^');
            }
        });
    }
    
    // 加载当前壁纸
    function loadCurrentWallpaper() {
        const savedWallpaperData = localStorage.getItem('wallpaperData');
        if (savedWallpaperData) {
            const data = JSON.parse(savedWallpaperData);
            currentWallpaper.src = data.url;
            currentBlur = data.blur || 0;
            if (blurInput) {
                blurInput.value = currentBlur;
                updateThumbnailBlur();
            }
        } else {
            // 显示默认壁纸占位图
            currentWallpaper.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="180" viewBox="0 0 100 180"><rect width="100" height="180" fill="%23f2f2f7"/><text x="50" y="90" font-family="Arial" font-size="12" text-anchor="middle" fill="%238e8e93">默认壁纸</text></svg>';
            currentBlur = 0;
            if (blurInput) {
                blurInput.value = 0;
                updateThumbnailBlur();
            }
        }
    }
    
    // 更新缩略图模糊效果
    function updateThumbnailBlur() {
        if (currentWallpaper) {
            // 将百分比转换为模糊半径（0-20px）
            const blurRadius = (currentBlur / 100) * 20;
            currentWallpaper.style.filter = `blur(${blurRadius}px)`;
        }
    }
    
    // 模糊度调节事件
    if (blurInput) {
        blurInput.addEventListener('input', function() {
            // 确保值在0-100之间
            currentBlur = Math.max(0, Math.min(100, parseInt(this.value) || 0));
            this.value = currentBlur;
            updateThumbnailBlur();
        });
    }
    
    // CSS美化模块功能
    initCSSModule();
    
    function initCSSModule() {
        // 元素引用
        const cssPresetSelect = document.getElementById('css-preset');
        const cssEditor = document.getElementById('css-editor');
        const cssCopyBtn = document.getElementById('css-copy');
        const cssSaveBtn = document.getElementById('css-save');
        const cssAddBtn = document.getElementById('css-add');
        const cssClearBtn = document.getElementById('css-clear');
        const cssDeleteBtn = document.getElementById('css-delete');
        
        // 弹窗元素
        const cssModal = document.getElementById('css-modal');
        const cssPresetNameInput = document.getElementById('css-preset-name');
        const cssModalCancel = document.getElementById('css-modal-cancel');
        const cssModalConfirm = document.getElementById('css-modal-confirm');
        
        // 存储键名
        const CSS_PRESETS_KEY = 'chat_css_presets';
        const CURRENT_CSS_KEY = 'chat_custom_css';
        
        // 初始化
        function init() {
            loadCSSPresets();
            loadCurrentCSS();
        }
        
        // 加载CSS预设
        function loadCSSPresets() {
            const presets = getCSSPresets();
            var html = '<option value="">选择预设</option>';
            Object.keys(presets).forEach(function(name) {
                html += '<option value="' + name + '">' + name + '</option>';
            });
            cssPresetSelect.innerHTML = html;
        }
        
        // 获取CSS预设
        function getCSSPresets() {
            try {
                return JSON.parse(localStorage.getItem(CSS_PRESETS_KEY) || '{}');
            } catch {
                return {};
            }
        }
        
        // 保存CSS预设
        function saveCSSPresets(presets) {
            localStorage.setItem(CSS_PRESETS_KEY, JSON.stringify(presets));
        }
        
        // 加载当前CSS
        function loadCurrentCSS() {
            const css = localStorage.getItem(CURRENT_CSS_KEY);
            if (css) {
                cssEditor.value = css;
            }
        }
        
        // 保存当前CSS
        function saveCurrentCSS(css) {
            localStorage.setItem(CURRENT_CSS_KEY, css);
        }
        
        // 复制CSS
        function copyCSS() {
            cssEditor.select();
            document.execCommand('copy');
            alert('CSS已复制到剪贴板！');
        }
        
        // 保存并应用CSS
        function saveAndApplyCSS() {
            const css = cssEditor.value;
            saveCurrentCSS(css);
            // 清除预设选择
            cssPresetSelect.value = '';
            alert('CSS已保存并应用！');
        }
        
        // 清空输入框
        function clearCSS() {
            cssEditor.value = '';
            cssPresetSelect.value = '';
        }
        
        // 删除预设
        function deleteCSSPreset() {
            const selectedPreset = cssPresetSelect.value;
            if (!selectedPreset) {
                alert('请选择要删除的预设');
                return;
            }
            
            if (confirm(`确定要删除预设 "${selectedPreset}" 吗？`)) {
                const presets = getCSSPresets();
                delete presets[selectedPreset];
                saveCSSPresets(presets);
                loadCSSPresets();
                cssPresetSelect.value = '';
                cssEditor.value = '';
                alert('预设删除成功');
            }
        }
        
        // 显示弹窗
        function showCSSModal() {
            cssPresetNameInput.value = '';
            cssModal.style.display = 'flex';
        }
        
        // 隐藏弹窗
        function hideCSSModal() {
            cssModal.style.display = 'none';
        }
        
        // 保存预设
        function saveCSSPreset() {
            const name = cssPresetNameInput.value.trim();
            const css = cssEditor.value;
            
            if (!name) {
                alert('请输入预设名称');
                return;
            }
            
            const presets = getCSSPresets();
            if (presets[name]) {
                alert('预设名称已存在');
                return;
            }
            
            presets[name] = css;
            saveCSSPresets(presets);
            loadCSSPresets();
            cssPresetSelect.value = name;
            hideCSSModal();
            alert('预设保存成功！');
        }
        
        // 加载预设
        function loadCSSPreset() {
            const name = cssPresetSelect.value;
            if (!name) {
                loadCurrentCSS();
                return;
            }
            
            const presets = getCSSPresets();
            if (presets[name]) {
                cssEditor.value = presets[name];
            }
        }
        
        // 事件监听器
        if (cssCopyBtn) {
            cssCopyBtn.addEventListener('click', copyCSS);
        }
        
        if (cssSaveBtn) {
            cssSaveBtn.addEventListener('click', saveAndApplyCSS);
        }
        
        if (cssAddBtn) {
            cssAddBtn.addEventListener('click', showCSSModal);
        }
        
        if (cssClearBtn) {
            cssClearBtn.addEventListener('click', clearCSS);
        }
        
        if (cssDeleteBtn) {
            cssDeleteBtn.addEventListener('click', deleteCSSPreset);
        }
        
        if (cssPresetSelect) {
            cssPresetSelect.addEventListener('change', loadCSSPreset);
        }
        
        if (cssModalCancel) {
            cssModalCancel.addEventListener('click', hideCSSModal);
        }
        
        if (cssModalConfirm) {
            cssModalConfirm.addEventListener('click', saveCSSPreset);
        }
        
        if (cssModal) {
            cssModal.addEventListener('click', function(e) {
                if (e.target === cssModal) {
                    hideCSSModal();
                }
            });
        }
        
        // ===== 铃声功能 =====
        const RINGTONE_KEY = 'chat_ringtone';
        
        // 加载铃声
        function loadRingtone() {
            const saved = localStorage.getItem(RINGTONE_KEY);
            if (saved) {
                try {
                    currentRingtoneData = JSON.parse(saved);
                    if (ringtoneName) {
                        ringtoneName.textContent = currentRingtoneData.name || '自定义铃声';
                    }
                } catch (e) {
                    currentRingtoneData = null;
                }
            }
        }
        
        // 上传铃声文件
        if (ringtoneFile) {
            ringtoneFile.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (!file) return;
                
                if (ringtoneFileName) {
                    ringtoneFileName.textContent = file.name;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    currentRingtoneData = {
                        name: file.name,
                        data: e.target.result
                    };
                    if (ringtoneName) {
                        ringtoneName.textContent = file.name;
                    }
                };
                reader.readAsDataURL(file);
            });
        }
        
        // 播放铃声
        if (ringtonePlay) {
            ringtonePlay.addEventListener('click', function() {
                if (!currentRingtoneData) {
                    alert('请先上传铃声');
                    return;
                }
                
                if (ringtoneAudio) {
                    ringtoneAudio.pause();
                }
                
                ringtoneAudio = new Audio(currentRingtoneData.data);
                ringtoneAudio.play().catch(function(err) {
                    console.error('播放失败:', err);
                });
            });
        }
        
        // 停止播放
        if (ringtoneStop) {
            ringtoneStop.addEventListener('click', function() {
                if (ringtoneAudio) {
                    ringtoneAudio.pause();
                    ringtoneAudio.currentTime = 0;
                }
            });
        }
        
        // 保存铃声
        if (ringtoneSave) {
            ringtoneSave.addEventListener('click', function() {
                if (!currentRingtoneData) {
                    alert('请先上传铃声');
                    return;
                }
                
                localStorage.setItem(RINGTONE_KEY, JSON.stringify(currentRingtoneData));
                alert('铃声已保存！');
            });
        }
        
        // 删除铃声
        if (ringtoneDelete) {
            ringtoneDelete.addEventListener('click', function() {
                if (!currentRingtoneData) {
                    alert('没有铃声可删除');
                    return;
                }
                
                if (confirm('确定要删除当前铃声吗？')) {
                    localStorage.removeItem(RINGTONE_KEY);
                    currentRingtoneData = null;
                    if (ringtoneName) {
                        ringtoneName.textContent = '未设置';
                    }
                    if (ringtoneFileName) {
                        ringtoneFileName.textContent = '';
                    }
                    if (ringtoneFile) {
                        ringtoneFile.value = '';
                    }
                    if (ringtoneAudio) {
                        ringtoneAudio.pause();
                        ringtoneAudio = null;
                    }
                    alert('铃声已删除');
                }
            });
        }
        
        // 加载铃声
        loadRingtone();
        
        // 初始化
        init();
    }
});