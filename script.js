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

// 页面加载时初始化
window.addEventListener('load', function() {
    loadProfileInfo();
    initSwipeBack();
    loadPresets();
});

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
        // 生成圆形头像的首字母
        const initial = preset.name.charAt(0).toUpperCase();
        
        const presetItem = document.createElement('div');
        presetItem.className = 'preset-avatar';
        presetItem.innerHTML = `
            <div class="preset-avatar-icon" onclick="usePreset(${JSON.stringify(preset)})")">
                ${initial}
            </div>
            <div class="preset-avatar-name">${preset.name}</div>
        `;
        presetList.appendChild(presetItem);
    });
}

// 使用API预设
function usePreset(preset) {
    document.getElementById('api-key').value = preset.apiKey;
    document.getElementById('api-url').value = preset.apiUrl;
    // 清空当前模型选择
    models = [];
    document.getElementById('selected-model').textContent = '请选择模型';
    alert('已切换API预设 ^ ^');
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