// 阻止双击放大和双击导致的图标位置移动
let lastTap = 0;
document.addEventListener('touchstart', function(e) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0) {
        // 只在双击时阻止默认行为
        e.preventDefault();
        // 阻止双击事件冒泡，防止影响图标布局
        e.stopPropagation();
    }
    lastTap = currentTime;
});

// 阻止双指缩放
document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: true });

// 隐藏地址栏和工具栏
window.addEventListener('load', function() {
    setTimeout(function() {
        window.scrollTo(0, 1);
    }, 100);
});

// 滑动切换和页面指示器
const slideContainer = document.querySelector('.slide-container');
const indicatorDots = document.querySelectorAll('.indicator-dot');

if (slideContainer) {
    slideContainer.addEventListener('scroll', function() {
        const scrollPosition = slideContainer.scrollLeft;
        const pageWidth = slideContainer.offsetWidth;
        const currentPage = Math.round(scrollPosition / pageWidth);
        
        indicatorDots.forEach((dot, index) => {
            if (index === currentPage) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    });
}

// 从主页面跳转到设置页面
const settingsIcon = document.getElementById('settings-icon');
const settingsPage = document.getElementById('settings-page');
const wifiPage = document.getElementById('wifi-page');
const wallpaperPage = document.getElementById('wallpaper-page');
const mainScreen = document.querySelector('.main-screen');

if (settingsIcon) {
    settingsIcon.addEventListener('click', function() {
        // 显示设置页面
        settingsPage.classList.add('show');
        // 隐藏主屏幕
        mainScreen.classList.add('hidden');
    });
}

// 加载个人信息
function loadProfileInfo() {
    const avatar = localStorage.getItem('profileAvatar');
    const name = localStorage.getItem('profileName');
    const desc = localStorage.getItem('profileDesc');
    
    if (avatar) {
        document.getElementById('avatar-image').src = avatar;
    }
    
    if (name) {
        document.querySelector('.profile-name').textContent = name;
    }
    
    if (desc) {
        document.querySelector('.profile-desc').textContent = desc;
    }
}

// 编辑个人信息
window.editProfile = function() {
    // 可以添加更多编辑功能
};

// 更换头像
window.changeAvatar = function(event) {
    event.stopPropagation();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const avatarUrl = e.target.result;
                document.getElementById('avatar-image').src = avatarUrl;
                localStorage.setItem('profileAvatar', avatarUrl);
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
};

// 编辑用户名
window.editName = function(event) {
    event.stopPropagation();
    const currentName = document.querySelector('.profile-name').textContent;
    const newName = prompt('请输入新的用户名：', currentName);
    if (newName && newName.trim() !== '') {
        document.querySelector('.profile-name').textContent = newName.trim();
        localStorage.setItem('profileName', newName.trim());
    }
};

// 编辑描述
window.editDescription = function(event) {
    event.stopPropagation();
    const currentDesc = document.querySelector('.profile-desc').textContent;
    const newDesc = prompt('请输入新的描述：', currentDesc);
    if (newDesc && newDesc.trim() !== '') {
        document.querySelector('.profile-desc').textContent = newDesc.trim();
        localStorage.setItem('profileDesc', newDesc.trim());
    }
};

// 返回上一页
window.goBack = function() {
    // 隐藏设置页面
    settingsPage.classList.remove('show');
    // 显示主屏幕
    mainScreen.classList.remove('hidden');
};

// 禁用浏览器/移动端的边缘侧滑返回手势
function disableSwipeBack() {
    // 禁用触摸事件的默认行为，防止侧滑返回
    document.addEventListener('touchstart', function(e) {
        // 只在屏幕左侧边缘禁用，避免影响其他滑动操作
        if (e.touches[0].clientX < 30) {
            e.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('touchmove', function(e) {
        // 只在屏幕左侧边缘禁用，避免影响其他滑动操作
        if (e.touches[0].clientX < 30) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // 禁用浏览器的历史记录导航
    window.history.pushState(null, null, window.location.href);
    window.addEventListener('popstate', function() {
        window.history.pushState(null, null, window.location.href);
    });
}

// 从设置页面跳转到无线局域网子页面
function goToWifiPage() {
    // 显示无线局域网子页面
    wifiPage.classList.add('show');
    // 隐藏设置页面
    settingsPage.classList.remove('show');
}

// 从无线局域网子页面返回设置页面
function goBackFromWifi() {
    // 隐藏无线局域网子页面
    wifiPage.classList.remove('show');
    // 显示设置页面
    settingsPage.classList.add('show');
}

// 存储模型列表和预设列表
let models = [];
let presets = JSON.parse(localStorage.getItem('apiPresets') || '[]');
// 存储当前选中的预设
let selectedPreset = null;

// 存储当前选择的壁纸和模糊度
let currentWallpaper = null;
let currentBlur = 0;

// 页面加载时初始化
window.addEventListener('load', function() {
    loadProfileInfo();
    disableSwipeBack();
    loadPresets();
    loadAiConfig();
    applySavedWallpaper();
    
    // 添加输入框变化监听，自动保存配置
    if (document.getElementById('api-url')) {
        document.getElementById('api-url').addEventListener('input', saveAiConfig);
    }
    if (document.getElementById('api-key')) {
        document.getElementById('api-key').addEventListener('input', saveAiConfig);
    }
    
    // 添加模糊度滑块监听
    const blurSlider = document.getElementById('blur-slider');
    if (blurSlider) {
        blurSlider.addEventListener('input', function() {
            currentBlur = parseFloat(this.value);
            document.getElementById('blur-value').textContent = Math.round(currentBlur * 10) + '%';
            updateWallpaperPreview();
            // 实时保存模糊度设置
            if (localStorage.getItem('wallpaper')) {
                localStorage.setItem('wallpaperBlur', currentBlur.toString());
            }
        });
    }
});

// 打开壁纸选择页面
function openWallpaperPage() {
    // 显示壁纸选择页面
    wallpaperPage.classList.add('show');
    // 隐藏设置页面
    settingsPage.classList.remove('show');
}

// 从壁纸选择页面返回
function goBackFromWallpaper() {
    // 隐藏壁纸选择页面
    wallpaperPage.classList.remove('show');
    // 显示设置页面
    settingsPage.classList.add('show');
}

// 打开相册选择
function openPhotoLibrary() {
    // 创建一个隐藏的文件输入框
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                currentWallpaper = event.target.result;
                previewWallpaper(currentWallpaper);
                openWallpaperConfirmDialog();
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

// 预览壁纸
function previewWallpaper(wallpaperUrl) {
    const previewContainer = document.getElementById('wallpaper-preview-container');
    previewContainer.innerHTML = `<img src="${wallpaperUrl}" alt="壁纸预览">`;
    
    // 更新确认弹窗中的预览
    const confirmPreview = document.querySelector('.wallpaper-confirm-preview');
    confirmPreview.innerHTML = `<img src="${wallpaperUrl}" alt="壁纸预览">`;
    
    // 更新预览的模糊度
    updateWallpaperPreview();
}

// 更新壁纸预览的模糊度
function updateWallpaperPreview() {
    const previewContainer = document.getElementById('wallpaper-preview-container');
    if (previewContainer) {
        previewContainer.style.filter = `blur(${currentBlur}px)`;
    }
    
    // 更新确认弹窗中的预览模糊度
    const confirmPreview = document.querySelector('.wallpaper-confirm-preview');
    if (confirmPreview) {
        confirmPreview.style.filter = `blur(${currentBlur}px)`;
    }
    
    // 实时更新已应用的壁纸模糊度
    const savedWallpaper = localStorage.getItem('wallpaper');
    if (savedWallpaper) {
        const wallpaperLayer = document.getElementById('wallpaper-layer');
        if (wallpaperLayer) {
            wallpaperLayer.style.filter = `blur(${currentBlur}px)`;
        }
    }
}

// 打开壁纸确认弹窗
function openWallpaperConfirmDialog() {
    document.getElementById('wallpaper-confirm-dialog').classList.add('show');
}

// 关闭壁纸确认弹窗
function closeWallpaperConfirmDialog() {
    document.getElementById('wallpaper-confirm-dialog').classList.remove('show');
}

// 设置壁纸
function setWallpaper() {
    if (currentWallpaper) {
        // 保存壁纸和模糊度到localStorage
        localStorage.setItem('wallpaper', currentWallpaper);
        localStorage.setItem('wallpaperBlur', currentBlur.toString());
        // 应用壁纸
        applyWallpaper(currentWallpaper, currentBlur);
        // 关闭弹窗
        closeWallpaperConfirmDialog();
        // 显示成功提示
        alert('壁纸设置成功 ^ ^');
    }
}

// 应用壁纸
function applyWallpaper(wallpaperUrl, blur = 0) {
    const slideContainer = document.querySelector('.slide-container');
    if (slideContainer) {
        // 移除之前的背景和模糊效果
        slideContainer.style.backgroundImage = 'none';
        slideContainer.style.filter = 'none';
        slideContainer.style.backgroundColor = 'transparent';
        
        // 检查是否已有壁纸图层
        let wallpaperLayer = document.getElementById('wallpaper-layer');
        if (!wallpaperLayer) {
            // 创建壁纸图层
            wallpaperLayer = document.createElement('div');
            wallpaperLayer.id = 'wallpaper-layer';
            wallpaperLayer.style.position = 'absolute';
            wallpaperLayer.style.top = '0';
            wallpaperLayer.style.left = '0';
            wallpaperLayer.style.width = '100%';
            wallpaperLayer.style.height = '100%';
            wallpaperLayer.style.zIndex = '-10';
            // 确保覆盖安全区
            wallpaperLayer.style.padding = 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
            wallpaperLayer.style.boxSizing = 'border-box';
            // 确保在视口之外也能显示
            wallpaperLayer.style.minWidth = '100vw';
            wallpaperLayer.style.minHeight = '100vh';
            // 添加到main-screen而不是slide-container，这样可以覆盖所有页面
            const mainScreen = document.querySelector('.main-screen');
            if (mainScreen) {
                mainScreen.insertBefore(wallpaperLayer, mainScreen.firstChild);
            } else {
                slideContainer.insertBefore(wallpaperLayer, slideContainer.firstChild);
            }
        }
        
        // 设置壁纸和模糊效果
        wallpaperLayer.style.backgroundImage = `url('${wallpaperUrl}')`;
        wallpaperLayer.style.backgroundSize = 'cover';
        wallpaperLayer.style.backgroundPosition = 'center';
        wallpaperLayer.style.backgroundRepeat = 'no-repeat';
        wallpaperLayer.style.filter = `blur(${blur}px)`;
    }
}

// 应用保存的壁纸
function applySavedWallpaper() {
    const savedWallpaper = localStorage.getItem('wallpaper');
    const savedBlur = localStorage.getItem('wallpaperBlur');
    if (savedWallpaper) {
        const blur = savedBlur ? parseFloat(savedBlur) : 0;
        applyWallpaper(savedWallpaper, blur);
        // 更新当前模糊度值
        currentBlur = blur;
        // 更新滑块的值
        if (document.getElementById('blur-slider')) {
            document.getElementById('blur-slider').value = blur;
            document.getElementById('blur-value').textContent = Math.round(blur * 10) + '%';
        }
        // 更新预览
        if (document.getElementById('wallpaper-preview-container')) {
            document.getElementById('wallpaper-preview-container').innerHTML = `<img src="${savedWallpaper}" alt="壁纸预览">`;
            document.getElementById('wallpaper-preview-container').style.filter = `blur(${blur}px)`;
        }
    }
}

// 拉取模型列表
async function fetchModels() {
    const apiKey = document.getElementById('api-key').value;
    const apiUrl = document.getElementById('api-url').value;
    
    if (!apiKey || !apiUrl) {
        alert('请先填写API密钥和接口地址');
        return;
    }
    
    try {
        // 自动拼接接口地址为 `${baseUrl}/v1/models`，处理斜杠重复问题
        const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
        const modelsUrl = `${baseUrl}/v1/models`;
        
        // 向接口地址发送请求（参考OpenAI /v1/models接口）
        const response = await fetch(modelsUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 解析返回的JSON数据，提取data数组里的模型id
        if (data.data && Array.isArray(data.data)) {
            models = data.data.map(model => ({
                id: model.id,
                name: model.id
            }));
            
            alert('模型拉取成功 ^ ^');
            document.getElementById('selected-model').textContent = '请选择模型';
            // 保存配置到localStorage
            saveAiConfig();
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Error fetching models:', error);
        alert('模型拉取失败，请检查API配置或网络 T^T');
    }
}

// 打开模型选择弹窗
function openModelSelector() {
    if (models.length === 0) {
        alert('请先拉取模型');
        return;
    }
    
    const modelList = document.getElementById('model-list');
    modelList.innerHTML = '';
    
    models.forEach(model => {
        const modelItem = document.createElement('div');
        modelItem.className = 'model-item';
        modelItem.onclick = () => selectModel(model);
        modelItem.innerHTML = `
            <span>${model.name}</span>
        `;
        modelList.appendChild(modelItem);
    });
    
    document.getElementById('model-selector').classList.add('show');
}

// 关闭模型选择弹窗
function closeModelSelector() {
    document.getElementById('model-selector').classList.remove('show');
}

// 选择模型
function selectModel(model) {
    document.getElementById('selected-model').textContent = model.name;
    closeModelSelector();
    // 保存配置到localStorage
    saveAiConfig();
}

// 打开添加API预设弹窗
function openAddPresetDialog() {
    const apiKey = document.getElementById('api-key').value;
    const apiUrl = document.getElementById('api-url').value;
    
    if (!apiKey || !apiUrl) {
        alert('请先填写API密钥和接口地址');
        return;
    }
    
    document.getElementById('preset-name').value = '';
    document.getElementById('preset-api-key').value = apiKey;
    document.getElementById('preset-api-url').value = apiUrl;
    document.getElementById('add-preset-dialog').classList.add('show');
}

// 关闭添加API预设弹窗
function closeAddPresetDialog() {
    document.getElementById('add-preset-dialog').classList.remove('show');
}

// 保存API预设
function saveApiPreset() {
    const presetName = document.getElementById('preset-name').value;
    const presetApiKey = document.getElementById('preset-api-key').value;
    const presetApiUrl = document.getElementById('preset-api-url').value;
    
    if (!presetName || !presetApiKey || !presetApiUrl) {
        alert('请填写完整的预设信息');
        return;
    }
    
    const newPreset = {
        id: Date.now().toString(),
        name: presetName,
        apiKey: presetApiKey,
        apiUrl: presetApiUrl
    };
    
    presets.push(newPreset);
    localStorage.setItem('apiPresets', JSON.stringify(presets));
    loadPresets();
    closeAddPresetDialog();
    alert('API预设保存成功 ^ ^');
}

// 加载API预设
function loadPresets() {
    const presetList = document.getElementById('preset-list');
    presetList.innerHTML = '';
    
    presets.forEach(preset => {
        const presetItem = document.createElement('div');
        presetItem.className = 'preset-item' + (selectedPreset && selectedPreset.id === preset.id ? ' selected' : '');
        presetItem.onclick = () => selectPreset(preset);
        presetItem.innerHTML = `
            <div class="preset-info">
                <div class="preset-name">${preset.name}</div>
                <div class="preset-url">${preset.apiUrl}</div>
            </div>
            <div class="preset-checkbox">
                <svg viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
                </svg>
            </div>
        `;
        presetList.appendChild(presetItem);
    });
    
    // 添加加载按钮
    const loadButton = document.createElement('button');
    loadButton.className = 'load-preset-button';
    loadButton.textContent = '加载选中预设';
    loadButton.disabled = !selectedPreset;
    loadButton.onclick = loadSelectedPreset;
    presetList.appendChild(loadButton);
}

// 选择预设
function selectPreset(preset) {
    selectedPreset = preset;
    loadPresets();
}

// 加载选中的预设
function loadSelectedPreset() {
    if (selectedPreset) {
        document.getElementById('api-key').value = selectedPreset.apiKey;
        document.getElementById('api-url').value = selectedPreset.apiUrl;
        // 清空当前模型选择
        models = [];
        document.getElementById('selected-model').textContent = '请先拉取模型';
        alert('已加载API预设 ^ ^');
        
        // 保存配置到localStorage
        saveAiConfig();
    }
}

// 保存API配置到localStorage
function saveAiConfig() {
    const apiUrl = document.getElementById('api-url').value;
    const apiKey = document.getElementById('api-key').value;
    const selectedModel = document.getElementById('selected-model').textContent;
    
    const aiConfig = {
        apiUrl: apiUrl,
        apiKey: apiKey,
        selectedModel: selectedModel
    };
    
    localStorage.setItem('aiConfig', JSON.stringify(aiConfig));
}

// 加载API配置从localStorage
function loadAiConfig() {
    const aiConfig = localStorage.getItem('aiConfig');
    if (aiConfig) {
        const config = JSON.parse(aiConfig);
        if (document.getElementById('api-url')) {
            document.getElementById('api-url').value = config.apiUrl || '';
        }
        if (document.getElementById('api-key')) {
            document.getElementById('api-key').value = config.apiKey || '';
        }
        if (document.getElementById('selected-model')) {
            document.getElementById('selected-model').textContent = config.selectedModel || '请先拉取模型';
        }
    }
}

// 使用API预设
function usePreset(preset) {
    document.getElementById('api-key').value = preset.apiKey;
    document.getElementById('api-url').value = preset.apiUrl;
    // 清空当前模型选择
    models = [];
    document.getElementById('selected-model').textContent = '请先拉取模型';
    alert('已切换API预设 ^ ^');
    
    // 保存配置到localStorage
    saveAiConfig();
    
    // 更新预设的选中状态
    const allPresetIcons = document.querySelectorAll('.preset-avatar-icon');
    allPresetIcons.forEach(icon => {
        icon.classList.remove('active');
    });
    // 找到当前点击的预设图标并添加active类
    const currentPresetIcons = document.querySelectorAll('.preset-avatar-icon');
    currentPresetIcons.forEach(icon => {
        // 通过比较预设名称来找到当前点击的预设
        const presetName = icon.nextElementSibling.textContent;
        if (presetName === preset.name) {
            icon.classList.add('active');
        }
    });
}

// 删除API预设
function deletePreset(presetId) {
    if (confirm('确定要删除这个预设吗？')) {
        presets = presets.filter(p => p.id !== presetId);
        localStorage.setItem('apiPresets', JSON.stringify(presets));
        loadPresets();
        alert('预设已删除');
    }
}

// 通用页面相关功能
const generalPage = document.getElementById('general-page');
let worldBooks = JSON.parse(localStorage.getItem('worldBooks') || '[]');
let currentWorldBook = null;
let longPressTimer = null;

// 从设置页面跳转到通用页面
function goToGeneralPage() {
    // 显示通用页面
    generalPage.classList.add('show');
    // 隐藏设置页面
    settingsPage.classList.remove('show');
    // 加载世界书列表
    loadWorldBooks();
}

// 从通用页面返回设置页面
function goBackFromGeneral() {
    // 隐藏通用页面
    generalPage.classList.remove('show');
    // 显示设置页面
    settingsPage.classList.add('show');
}

// 加载世界书列表
function loadWorldBooks() {
    const worldBookList = document.getElementById('world-book-list');
    worldBookList.innerHTML = '';
    
    worldBooks.forEach(book => {
        const worldBookCard = document.createElement('div');
        worldBookCard.className = 'world-book-card';
        worldBookCard.onclick = () => openEditWorldBookDialog(book);
        
        // 添加长按事件
        worldBookCard.addEventListener('touchstart', function(e) {
            longPressTimer = setTimeout(() => {
                showContextMenu(e, book);
            }, 500);
        });
        
        worldBookCard.addEventListener('touchend', function() {
            clearTimeout(longPressTimer);
        });
        
        worldBookCard.addEventListener('touchmove', function() {
            clearTimeout(longPressTimer);
        });
        
        worldBookCard.innerHTML = `
            <div class="world-book-icon">📄</div>
            <div class="world-book-name">${book.name}</div>
            <div class="world-book-time">${formatTime(book.lastModified)}</div>
            ${book.isGlobal ? '<div class="world-book-global">全局使用</div>' : ''}
        `;
        worldBookList.appendChild(worldBookCard);
    });
}

// 格式化时间
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 显示长按菜单
function showContextMenu(e, book) {
    currentWorldBook = book;
    const contextMenu = document.getElementById('context-menu');
    const touch = e.touches[0];
    contextMenu.style.left = touch.clientX + 'px';
    contextMenu.style.top = touch.clientY + 'px';
    contextMenu.style.display = 'block';
    
    // 点击其他地方关闭菜单
    setTimeout(() => {
        document.addEventListener('click', closeContextMenu);
    }, 100);
}

// 关闭长按菜单
function closeContextMenu() {
    document.getElementById('context-menu').style.display = 'none';
    document.removeEventListener('click', closeContextMenu);
}

// 删除世界书
function deleteWorldBook() {
    if (currentWorldBook && confirm('确定要删除这个世界书吗？')) {
        worldBooks = worldBooks.filter(book => book.id !== currentWorldBook.id);
        localStorage.setItem('worldBooks', JSON.stringify(worldBooks));
        loadWorldBooks();
        closeContextMenu();
        alert('世界书已删除');
    }
}

// 打开添加世界书弹窗
function openAddWorldBookDialog() {
    document.getElementById('world-book-name').value = '';
    document.getElementById('world-book-global').checked = false;
    document.getElementById('add-world-book-dialog').classList.add('show');
}

// 关闭添加世界书弹窗
function closeAddWorldBookDialog() {
    document.getElementById('add-world-book-dialog').classList.remove('show');
}

// 保存世界书
function saveWorldBook() {
    const name = document.getElementById('world-book-name').value;
    const content = document.getElementById('world-book-content').value;
    const isGlobal = document.getElementById('world-book-global').checked;
    
    if (!name || name.trim() === '') {
        alert('请输入世界书名称');
        return;
    }
    
    // 如果设置为全局使用，取消其他世界书的全局状态
    if (isGlobal) {
        worldBooks.forEach(book => {
            book.isGlobal = false;
        });
    }
    
    const newWorldBook = {
        id: Date.now().toString(),
        name: name.trim(),
        content: content.trim(),
        isGlobal: isGlobal,
        lastModified: Date.now()
    };
    
    worldBooks.push(newWorldBook);
    localStorage.setItem('worldBooks', JSON.stringify(worldBooks));
    loadWorldBooks();
    closeAddWorldBookDialog();
    alert('世界书添加成功 ^ ^');
}

// 打开编辑世界书弹窗
function openEditWorldBookDialog(book) {
    currentWorldBook = book;
    document.getElementById('edit-world-book-name').value = book.name;
    document.getElementById('edit-world-book-content').value = book.content || '';
    document.getElementById('edit-world-book-global').checked = book.isGlobal;
    document.getElementById('edit-world-book-dialog').classList.add('show');
}

// 关闭编辑世界书弹窗
function closeEditWorldBookDialog() {
    document.getElementById('edit-world-book-dialog').classList.remove('show');
}

// 更新世界书
function updateWorldBook() {
    if (!currentWorldBook) return;
    
    const name = document.getElementById('edit-world-book-name').value;
    const content = document.getElementById('edit-world-book-content').value;
    const isGlobal = document.getElementById('edit-world-book-global').checked;
    
    if (!name || name.trim() === '') {
        alert('请输入世界书名称');
        return;
    }
    
    // 如果设置为全局使用，取消其他世界书的全局状态
    if (isGlobal) {
        worldBooks.forEach(book => {
            book.isGlobal = false;
        });
    }
    
    const updatedBook = {
        ...currentWorldBook,
        name: name.trim(),
        content: content.trim(),
        isGlobal: isGlobal,
        lastModified: Date.now()
    };
    
    const index = worldBooks.findIndex(book => book.id === currentWorldBook.id);
    if (index !== -1) {
        worldBooks[index] = updatedBook;
        localStorage.setItem('worldBooks', JSON.stringify(worldBooks));
        loadWorldBooks();
        closeEditWorldBookDialog();
        alert('世界书更新成功 ^ ^');
    }
}

// 打开备份弹窗
function openBackupDialog() {
    document.getElementById('backup-dialog').classList.add('show');
}

// 关闭备份弹窗
function closeBackupDialog() {
    document.getElementById('backup-dialog').classList.remove('show');
}

// 下载备份
function downloadBackup() {
    const filename = document.getElementById('backup-filename').value;
    if (!filename || filename.trim() === '') {
        alert('请输入备份文件名');
        return;
    }
    
    // 确保文件名以.json结尾
    const finalFilename = filename.endsWith('.json') ? filename : filename + '.json';
    
    // 收集所有数据
    const backupData = {
        worldBooks: worldBooks,
        apiPresets: presets,
        aiConfig: JSON.parse(localStorage.getItem('aiConfig') || '{}'),
        wallpaper: localStorage.getItem('wallpaper'),
        wallpaperBlur: localStorage.getItem('wallpaperBlur'),
        profileAvatar: localStorage.getItem('profileAvatar'),
        profileName: localStorage.getItem('profileName'),
        profileDesc: localStorage.getItem('profileDesc'),
        timestamp: Date.now()
    };
    
    // 创建JSON文件
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    a.click();
    
    // 清理
    URL.revokeObjectURL(url);
    closeBackupDialog();
    alert('备份成功 ^ ^');
}

// 打开恢复弹窗
function openRestoreDialog() {
    document.getElementById('restore-file-input').click();
}

// 处理文件选择
document.getElementById('restore-file-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const backupData = JSON.parse(event.target.result);
                // 验证数据格式
                if (typeof backupData === 'object' && backupData !== null) {
                    // 保存到全局变量以便恢复
                    window.backupData = backupData;
                    // 显示确认弹窗
                    document.getElementById('restore-confirm-dialog').classList.add('show');
                } else {
                    throw new Error('无效的备份文件格式');
                }
            } catch (error) {
                alert('备份文件格式错误，请检查文件是否正确');
            }
        };
        reader.readAsText(file);
    }
});

// 关闭恢复确认弹窗
function closeRestoreConfirmDialog() {
    document.getElementById('restore-confirm-dialog').classList.remove('show');
    // 清空文件输入
    document.getElementById('restore-file-input').value = '';
}

// 恢复数据
function restoreData() {
    if (window.backupData) {
        // 恢复所有数据
        if (window.backupData.worldBooks) {
            worldBooks = window.backupData.worldBooks;
            localStorage.setItem('worldBooks', JSON.stringify(worldBooks));
        }
        
        if (window.backupData.apiPresets) {
            presets = window.backupData.apiPresets;
            localStorage.setItem('apiPresets', JSON.stringify(presets));
        }
        
        if (window.backupData.aiConfig) {
            localStorage.setItem('aiConfig', JSON.stringify(window.backupData.aiConfig));
        }
        
        if (window.backupData.wallpaper) {
            localStorage.setItem('wallpaper', window.backupData.wallpaper);
        }
        
        if (window.backupData.wallpaperBlur) {
            localStorage.setItem('wallpaperBlur', window.backupData.wallpaperBlur);
        }
        
        if (window.backupData.profileAvatar) {
            localStorage.setItem('profileAvatar', window.backupData.profileAvatar);
        }
        
        if (window.backupData.profileName) {
            localStorage.setItem('profileName', window.backupData.profileName);
        }
        
        if (window.backupData.profileDesc) {
            localStorage.setItem('profileDesc', window.backupData.profileDesc);
        }
        
        closeRestoreConfirmDialog();
        alert('数据恢复成功，页面将刷新');
        // 刷新页面
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}