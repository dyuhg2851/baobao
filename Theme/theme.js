document.addEventListener('DOMContentLoaded', function() {
    // 元素引用
    const backBtn = document.getElementById('back-btn');
    const wallpaperThumbnail = document.getElementById('wallpaper-thumbnail');
    const currentWallpaper = document.getElementById('current-wallpaper');
    const blurInput = document.getElementById('blur-input');
    const btnSave = document.getElementById('btn-save');
    const btnDelete = document.getElementById('btn-delete');
    
    // 模糊度值（0-100%）
    let currentBlur = 0;
    
    // 加载当前壁纸
    loadCurrentWallpaper();
    
    // 返回按钮点击事件
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.href = '../index.html';
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
                
                // 提示用户返回主屏幕查看效果
                alert('壁纸已保存，请返回主屏幕查看效果');
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
    
    // 字体模块功能
    initFontModule();
    
    function initFontModule() {
        // 元素引用
        const fontUrlInput = document.getElementById('font-url');
        const fontPresetSelect = document.getElementById('font-preset');
        const fontDeleteBtn = document.getElementById('font-delete');
        const fontSaveBtn = document.getElementById('font-save');
        const fontAddBtn = document.getElementById('font-add');
        
        // 弹窗元素
        const fontModal = document.getElementById('font-modal');
        const fontPresetNameInput = document.getElementById('font-preset-name');
        const fontModalCancel = document.getElementById('font-modal-cancel');
        const fontModalConfirm = document.getElementById('font-modal-confirm');
        
        // 存储键名
        const FONTS_KEY = 'font_presets';
        const CURRENT_FONT_KEY = 'current_font';
        
        // 预设字体列表（空，让用户自己上传）
        const defaultFonts = [];
        
        // 初始化
        function init() {
            loadFontPresets();
            loadCurrentFont();
        }
        
        // 加载字体预设
        function loadFontPresets() {
            // 加载预设到下拉框
            const presetsToLoad = getFontPresets();
            fontPresetSelect.innerHTML = '<option value="">选择预设</option>';
            
            presetsToLoad.forEach(font => {
                const option = document.createElement('option');
                option.value = font.name;
                option.textContent = font.name;
                fontPresetSelect.appendChild(option);
            });
        }
        
        // 获取字体预设
        function getFontPresets() {
            const presets = localStorage.getItem(FONTS_KEY);
            return presets ? JSON.parse(presets) : [];
        }
        
        // 保存字体预设
        function saveFontPresets(presets) {
            localStorage.setItem(FONTS_KEY, JSON.stringify(presets));
        }
        
        // 加载当前字体
        function loadCurrentFont() {
            const savedFont = localStorage.getItem(CURRENT_FONT_KEY);
            if (savedFont) {
                const font = JSON.parse(savedFont);
                if (font.url) {
                    loadFont(font.url, font.family || font.name);
                    // 填充字体链接到输入框，保留用户输入
                    fontUrlInput.value = font.url;
                } else if (font.family) {
                    applyFontFamily(font.family);
                    // 清空输入框，因为没有URL
                    fontUrlInput.value = '';
                }
                
                // 选择对应的预设
                fontPresetSelect.value = font.name || '';
            }
        }
        
        // 保存当前字体
        function saveCurrentFont(font) {
            localStorage.setItem(CURRENT_FONT_KEY, JSON.stringify(font));
        }
        
        // 加载字体
        function loadFont(url, family) {
            if (!url) return;
            
            // 检查字体是否已经加载
            const existingFontStyle = document.getElementById('custom-font-style');
            if (existingFontStyle) {
                // 检查当前字体是否与要加载的字体相同
                if (existingFontStyle.textContent.includes(url)) {
                    // 字体已经加载，不需要重新加载
                    return;
                }
            }
            
            // 移除旧的字体样式
            const oldFontStyle = document.getElementById('custom-font-style');
            if (oldFontStyle) {
                oldFontStyle.remove();
            }
            
            // 创建新的样式标签，使用@font-face加载TTF字体
            const fontStyle = document.createElement('style');
            fontStyle.id = 'custom-font-style';
            
            // 生成唯一的字体名称
            const fontName = family || 'CustomFont' + Date.now();
            
            // 构建@font-face规则
            const fontFaceRule = `
                @font-face {
                    font-family: '${fontName}';
                    src: url('${url}') format('truetype');
                    font-weight: normal;
                    font-style: normal;
                }
            `;
            
            fontStyle.textContent = fontFaceRule;
            document.head.appendChild(fontStyle);
            
            // 测试字体是否加载成功
            const testElement = document.createElement('span');
            testElement.style.fontFamily = fontName;
            testElement.style.fontSize = '0';
            testElement.textContent = 'test';
            document.body.appendChild(testElement);
            
            // 检查字体是否加载成功
            setTimeout(function() {
                const computedFontFamily = window.getComputedStyle(testElement).fontFamily;
                if (computedFontFamily.includes(fontName)) {
                    applyFontFamily(fontName);
                }
                document.body.removeChild(testElement);
            }, 1000);
        }
        
        // 应用字体
        function applyFontFamily(family) {
            document.body.style.fontFamily = family;
        }
        

        
        // 显示弹窗
        function showFontModal() {
            fontPresetNameInput.value = '';
            fontModal.style.display = 'flex';
        }
        
        // 隐藏弹窗
        function hideFontModal() {
            fontModal.style.display = 'none';
        }
        
        // 添加新字体预设
        function addFontPreset() {
            const url = fontUrlInput.value;
            if (!url) {
                alert('请输入字体链接');
                return;
            }
            
            showFontModal();
        }
        
        // 确认添加预设
        function confirmAddFontPreset() {
            const url = fontUrlInput.value;
            const presetName = fontPresetNameInput.value;
            
            if (!presetName || !presetName.trim()) {
                return;
            }
            
            const presets = getFontPresets();
            const existingPreset = presets.find(p => p.name === presetName.trim());
            
            if (existingPreset) {
                alert('预设名称已存在');
                return;
            }
            
            // 添加新预设
            presets.push({
                name: presetName.trim(),
                url: url,
                family: presetName.trim()
            });
            
            saveFontPresets(presets);
            loadFontPresets();
            fontPresetSelect.value = presetName.trim();
            hideFontModal();
            alert('预设添加成功');
        }
        
        // 删除字体预设
        function deleteFontPreset() {
            const selectedPreset = fontPresetSelect.value;
            if (!selectedPreset) {
                alert('请选择要删除的预设');
                return;
            }
            
            if (confirm(`确定要删除预设 "${selectedPreset}" 吗？`)) {
                const presets = getFontPresets();
                const filteredPresets = presets.filter(p => p.name !== selectedPreset);
                saveFontPresets(filteredPresets);
                loadFontPresets();
                fontPresetSelect.value = '';
                fontUrlInput.value = '';
                alert('预设删除成功');
            }
        }
        
        // 事件监听器
        if (fontSaveBtn) {
            fontSaveBtn.addEventListener('click', function() {
                const url = fontUrlInput.value;
                const selectedPreset = fontPresetSelect.value;
                
                if (url) {
                    // 从输入框加载
                    loadFont(url, url);
                    saveCurrentFont({ url: url, name: '自定义字体' });
                } else if (selectedPreset) {
                    // 从预设加载
                    const presets = getFontPresets();
                    const font = presets.find(p => p.name === selectedPreset);
                    if (font) {
                        loadFont(font.url, font.family);
                        saveCurrentFont(font);
                    }
                } else {
                    alert('请输入字体链接或选择预设');
                }
            });
        }
        
        if (fontAddBtn) {
            fontAddBtn.addEventListener('click', addFontPreset);
        }
        
        if (fontDeleteBtn) {
            fontDeleteBtn.addEventListener('click', deleteFontPreset);
        }
        
        if (fontPresetSelect) {
            fontPresetSelect.addEventListener('change', function() {
                const selectedPreset = this.value;
                if (selectedPreset) {
                    const presets = getFontPresets();
                    const font = presets.find(p => p.name === selectedPreset);
                    if (font) {
                        // 不填充字体链接到输入框，保持空白
                        fontUrlInput.value = '';
                        // 自动加载字体
                        loadFont(font.url, font.family);
                        saveCurrentFont(font);
                    }
                } else {
                    fontUrlInput.value = '';
                }
            });
        }
        
        // 字体链接输入框事件 - 当输入完成后自动加载
        if (fontUrlInput) {
            fontUrlInput.addEventListener('blur', function() {
                const url = this.value.trim();
                if (url) {
                    // 自动加载字体
                    loadFont(url, url);
                    saveCurrentFont({ url: url, name: '自定义字体' });
                }
            });
        }
        
        // 弹窗事件
        if (fontModalCancel) {
            fontModalCancel.addEventListener('click', hideFontModal);
        }
        
        if (fontModalConfirm) {
            fontModalConfirm.addEventListener('click', confirmAddFontPreset);
        }
        
        // 点击遮罩层关闭弹窗
        if (fontModal) {
            fontModal.addEventListener('click', function(e) {
                if (e.target === fontModal) {
                    hideFontModal();
                }
            });
        }
        
        // 初始化
        init();
    }
});