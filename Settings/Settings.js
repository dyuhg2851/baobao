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
    const apiPresetSelect = document.getElementById('api-preset');
    const apiUrlInput = document.getElementById('api-url');
    const apiKeyInput = document.getElementById('api-key');
    const apiModelSelect = document.getElementById('api-model');
    const btnDelete = document.getElementById('btn-delete');
    const btnSave = document.getElementById('btn-save');
    const btnPull = document.getElementById('btn-pull');
    const btnAdd = document.getElementById('btn-add');
    const backBtn = document.getElementById('back-btn');
    
    // 数据卡片按钮
    const btnExport = document.getElementById('btn-export');
    const btnImport = document.getElementById('btn-import');
    const btnClear = document.getElementById('btn-clear');
    
    // 弹窗元素
    const modal = document.getElementById('modal');
    const presetNameInput = document.getElementById('preset-name');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');
    
    // 返回按钮点击事件
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.replace('../index.html');
        });
    }
    
    // 显示弹窗
    function showModal() {
        presetNameInput.value = '';
        modal.style.display = 'flex';
    }
    
    // 隐藏弹窗
    function hideModal() {
        modal.style.display = 'none';
    }
    
    // 添加新预设
    function addPreset(presetName) {
        if (presetName && presetName.trim()) {
            const presets = getPresets();
            const existingPreset = presets.find(p => p.name === presetName.trim());
            
            if (existingPreset) {
                alert('预设名称已存在');
                return false;
            }
            
            // 添加新预设
            presets.push({
                name: presetName.trim(),
                url: apiUrlInput.value,
                key: apiKeyInput.value,
                models: [],
                selectedModel: ''
            });
            
            savePresets(presets);
            loadPresets();
            apiPresetSelect.value = presetName.trim();
            return true;
        }
        return false;
    }
    
    // 存储键名
    const PRESETS_KEY = 'api_presets';
    
    // 加载预设列表
    function loadPresets() {
        const presets = getPresets();
        apiPresetSelect.innerHTML = '<option value="">选择预设</option>';
        
        presets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.name;
            option.textContent = preset.name;
            apiPresetSelect.appendChild(option);
        });
    }
    
    // 获取预设列表
    function getPresets() {
        const presets = localStorage.getItem(PRESETS_KEY);
        return presets ? JSON.parse(presets) : [];
    }
    
    // 保存预设列表
    function savePresets(presets) {
        localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    }
    
    // 加载预设配置
    function loadPresetConfig(presetName) {
        const presets = getPresets();
        const preset = presets.find(p => p.name === presetName);
        
        if (preset) {
            apiUrlInput.value = preset.url || '';
            apiKeyInput.value = preset.key || '';
            // 加载模型列表
            if (preset.models && preset.models.length > 0) {
                loadModels(preset.models);
                if (preset.selectedModel) {
                    apiModelSelect.value = preset.selectedModel;
                }
            } else {
                apiModelSelect.innerHTML = '<option value="">选择模型</option>';
                // 如果有URL和Key，自动拉取模型
                if (preset.url && preset.key) {
                    pullModels();
                }
            }
        }
    }
    
    // 加载模型列表
    function loadModels(models) {
        apiModelSelect.innerHTML = '<option value="">选择模型</option>';
        
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            apiModelSelect.appendChild(option);
        });
    }
    
    // 拉取API模型列表
    async function pullModels() {
        const url = apiUrlInput.value;
        const key = apiKeyInput.value;
        
        if (!url || !key) {
            alert('请输入API URL和API Key');
            return;
        }
        
        try {
            // 构建模型列表请求URL
            // 对于OpenAI API，模型列表端点是 /v1/models
            // 对于其他API，可能需要调整路径
            let modelsUrl = url;
            if (!modelsUrl.endsWith('/')) {
                modelsUrl += '/';
            }
            // 尝试常见的模型列表端点
            const endpoints = ['v1/models', 'models', 'api/models'];
            let response;
            let models = [];
            
            for (const endpoint of endpoints) {
                try {
                    response = await fetch(`${modelsUrl}${endpoint}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${key}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        // 处理不同API的响应格式
                        if (data.models && Array.isArray(data.models)) {
                            // OpenAI格式
                            models = data.models.map(model => model.id);
                        } else if (Array.isArray(data)) {
                            // 直接返回模型数组
                            models = data;
                        } else if (data.data && Array.isArray(data.data)) {
                            // 其他格式
                            models = data.data.map(item => item.id || item.name);
                        }
                        
                        if (models.length > 0) {
                            break;
                        }
                    }
                } catch (e) {
                    // 尝试下一个端点
                    continue;
                }
            }
            
            if (models.length === 0) {
                throw new Error('无法获取模型列表，请检查API配置');
            }
            
            loadModels(models);
            alert('模型列表拉取成功^ ^');
            
        } catch (error) {
            console.error('拉取模型失败:', error);
            alert('拉取模型失败，请检查API配置T^T');
        }
    }
    
    // 保存当前配置
    function saveCurrentConfig() {
        const url = apiUrlInput.value;
        const key = apiKeyInput.value;
        const model = apiModelSelect.value;
        const presetName = apiPresetSelect.value;
        
        if (!presetName) {
            alert('请选择或添加预设');
            return;
        }
        
        if (!url || !key) {
            alert('请填写API URL和API Key');
            return;
        }
        
        const presets = getPresets();
        const presetIndex = presets.findIndex(p => p.name === presetName);
        
        // 获取当前模型列表
        const models = Array.from(apiModelSelect.options).map(option => option.value).filter(value => value !== '');
        
        const config = {
            name: presetName,
            url: url,
            key: key,
            models: models,
            selectedModel: model
        };
        
        if (presetIndex >= 0) {
            // 更新现有预设
            presets[presetIndex] = config;
        } else {
            // 添加新预设
            presets.push(config);
        }
        
        savePresets(presets);
        
        // 保存当前预设为全局默认
        localStorage.setItem('default_api_preset', JSON.stringify(config));
        
        loadPresets(); // 重新加载预设列表
        apiPresetSelect.value = presetName; // 保持选择当前预设
        alert('配置保存成功，已设置为全局默认');
    }
    

    
    // 删除预设
    function deletePreset() {
        const presetName = apiPresetSelect.value;
        
        if (!presetName) {
            alert('请选择要删除的预设');
            return;
        }
        
        if (confirm(`确定要删除预设 "${presetName}" 吗？`)) {
            const presets = getPresets();
            const filteredPresets = presets.filter(p => p.name !== presetName);
            savePresets(filteredPresets);
            loadPresets();
            apiPresetSelect.value = '';
            apiUrlInput.value = '';
            apiKeyInput.value = '';
            apiModelSelect.innerHTML = '<option value="">选择模型</option>';
            alert('预设删除成功');
        }
    }
    
    // 事件监听器
    apiPresetSelect.addEventListener('change', function() {
        const selectedPreset = this.value;
        if (selectedPreset) {
            loadPresetConfig(selectedPreset);
        } else {
            // 清空表单
            apiUrlInput.value = '';
            apiKeyInput.value = '';
            apiModelSelect.innerHTML = '<option value="">选择模型</option>';
        }
    });
    
    btnDelete.addEventListener('click', deletePreset);
    btnSave.addEventListener('click', saveCurrentConfig);
    btnPull.addEventListener('click', pullModels);
    
    // Add按钮点击事件
    btnAdd.addEventListener('click', showModal);
    
    // 弹窗取消按钮点击事件
    if (modalCancel) {
        modalCancel.addEventListener('click', hideModal);
    }
    
    // 弹窗确认按钮点击事件
    if (modalConfirm) {
        modalConfirm.addEventListener('click', function() {
            const presetName = presetNameInput.value;
            if (addPreset(presetName)) {
                hideModal();
            }
        });
    }
    
    // 点击遮罩层关闭弹窗
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideModal();
            }
        });
    }
    
    // 数据卡片按钮事件
    if (btnExport) {
        btnExport.addEventListener('click', exportData);
    }
    if (btnImport) {
        btnImport.addEventListener('click', importData);
    }
    if (btnClear) {
        btnClear.addEventListener('click', clearData);
    }
    
    // 导出所有数据
    function exportData() {
        const presets = getPresets();
        const data = {
            presets: presets,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'api-settings.json';
        link.click();
        URL.revokeObjectURL(url);
    }
    
    // 导入数据
    function importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.presets) {
                        savePresets(data.presets);
                        loadPresets();
                        alert('数据导入成功');
                    } else {
                        alert('无效的文件格式');
                    }
                } catch (error) {
                    alert('文件解析失败');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
    
    // 清除数据
    function clearData() {
        if (confirm('确定要清除所有数据吗？')) {
            localStorage.removeItem('apiPresets');
            loadPresets();
            // 清空输入框
            apiUrlInput.value = '';
            apiKeyInput.value = '';
            apiModelSelect.innerHTML = '<option value="">选择模型</option>';
            alert('数据已清除');
        }
    }
    
    // 初始化
    loadPresets();
    
    // 加载当前默认配置
    const defaultPreset = JSON.parse(localStorage.getItem('default_api_preset') || '{}');
    if (defaultPreset.name) {
        apiPresetSelect.value = defaultPreset.name;
        apiUrlInput.value = defaultPreset.url || '';
        apiKeyInput.value = defaultPreset.key || '';
        if (defaultPreset.models && defaultPreset.models.length > 0) {
            loadModels(defaultPreset.models);
            if (defaultPreset.selectedModel) {
                apiModelSelect.value = defaultPreset.selectedModel;
            }
        }
    }
});