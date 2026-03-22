// 阻止双击放大和双击导致的图标位置移动
let lastTap = 0;
document.addEventListener('touchstart', function(e) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0) {
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
}, { passive: false });

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
        // 重置设置页面的transform和opacity
        settingsPage.style.transform = 'translateX(0)';
        settingsPage.style.opacity = '1';
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
    // 复位设置页面的样式
    setTimeout(function() {
        settingsPage.style.transform = 'translateX(0)';
        settingsPage.style.opacity = '1';
    }, 100);
};

// 初始化右滑返回
function initSwipeBack() {
    let startX = 0;
    let currentX = 0;
    let isSwiping = false;
    let hasMoved = false;
    
    document.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        hasMoved = false;
        // 扩大滑动触发区域为屏幕左侧30%区域
        if (startX < window.innerWidth * 0.3 && settingsPage.classList.contains('show')) {
            isSwiping = true;
            // 确保设置页面有过渡效果
            settingsPage.style.transition = 'none';
        }
    });
    
    document.addEventListener('touchmove', function(e) {
        if (!isSwiping) return;
        
        hasMoved = true;
        currentX = e.touches[0].clientX;
        const diffX = currentX - startX;
        
        if (diffX > 0) { // 向右滑动
            // 页面跟随手指平滑移动，提高灵敏度
            settingsPage.style.transform = `translateX(${Math.min(diffX * 1.2, window.innerWidth * 0.8)}px)`;
            settingsPage.style.opacity = 1 - (diffX / (window.innerWidth * 0.5)) * 0.3;
        }
    });
    
    document.addEventListener('touchend', function() {
        if (!isSwiping) return;
        
        const diffX = currentX - startX;
        
        // 恢复过渡效果，使用更短的过渡时间提高响应速度
        settingsPage.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
        
        // 只有在有移动且滑动距离超过阈值时才返回
        if (hasMoved && diffX > window.innerWidth / 5) {
            // 滑动距离超过屏幕1/5，返回主屏幕
            settingsPage.style.transform = `translateX(${window.innerWidth}px)`;
            settingsPage.style.opacity = '0';
            // 延迟执行goBack，等待动画完成
            setTimeout(goBack, 200);
        } else {
            // 否则回弹复位
            settingsPage.style.transform = 'translateX(0)';
            settingsPage.style.opacity = '1';
        }
        
        isSwiping = false;
    });
}

// 从设置页面跳转到无线局域网子页面
function goToWifiPage() {
    // 显示无线局域网子页面
    wifiPage.style.transform = 'translateX(0)';
    wifiPage.style.opacity = '1';
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
    // 复位无线局域网子页面的样式
    setTimeout(function() {
        wifiPage.style.transform = 'translateX(0)';
        wifiPage.style.opacity = '1';
    }, 100);
}

// 存储模型列表和预设列表
let models = [];
let presets = JSON.parse(localStorage.getItem('apiPresets') || '[]');

// 存储当前选择的壁纸和模糊度
let currentWallpaper = null;
let currentBlur = 0;

// 页面加载时初始化
window.addEventListener('load', function() {
    loadProfileInfo();
    initSwipeBack();
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
    wallpaperPage.style.transform = 'translateX(0)';
    wallpaperPage.style.opacity = '1';
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
    // 复位壁纸选择页面的样式
    setTimeout(function() {
        wallpaperPage.style.transform = 'translateX(0)';
        wallpaperPage.style.opacity = '1';
    }, 100);
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
        presetItem.className = 'preset-avatar';
        presetItem.innerHTML = `
            <div class="preset-avatar-icon" onclick="usePreset(${JSON.stringify(preset)})")">
            </div>
            <div class="preset-avatar-name">${preset.name}</div>
        `;
        presetList.appendChild(presetItem);
    });
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
    document.getElementById('selected-model').textContent = '请选择模型';
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