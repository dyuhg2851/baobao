// API配置管理模块
const APIConfig = {
    // 获取默认预设
    getDefaultPreset: function() {
        const presets = this.getPresets();
        return presets.length > 0 ? presets[0] : null;
    },
    
    // 获取所有预设
    getPresets: function() {
        try {
            const presets = localStorage.getItem('apiPresets');
            return presets ? JSON.parse(presets) : [];
        } catch (error) {
            console.error('获取预设失败:', error);
            return [];
        }
    },
    
    // 保存预设
    savePresets: function(presets) {
        try {
            localStorage.setItem('apiPresets', JSON.stringify(presets));
            return true;
        } catch (error) {
            console.error('保存预设失败:', error);
            return false;
        }
    },
    
    // 获取当前选中的预设
    getCurrentPreset: function() {
        try {
            const currentPreset = localStorage.getItem('currentApiPreset');
            if (!currentPreset) return this.getDefaultPreset();
            
            const presets = this.getPresets();
            return presets.find(preset => preset.name === currentPreset) || this.getDefaultPreset();
        } catch (error) {
            console.error('获取当前预设失败:', error);
            return this.getDefaultPreset();
        }
    },
    
    // 设置当前选中的预设
    setCurrentPreset: function(presetName) {
        try {
            localStorage.setItem('currentApiPreset', presetName);
            return true;
        } catch (error) {
            console.error('设置当前预设失败:', error);
            return false;
        }
    },
    
    // 获取API配置
    getConfig: function() {
        const preset = this.getCurrentPreset();
        if (!preset) {
            return {
                url: '',
                key: '',
                model: ''
            };
        }
        
        return {
            url: preset.url || '',
            key: preset.key || '',
            model: preset.selectedModel || (preset.models && preset.models.length > 0 ? preset.models[0] : '')
        };
    },
    
    // 发送API请求
    async sendRequest(endpoint, data = {}, method = 'POST') {
        const config = this.getConfig();
        
        if (!config.url || !config.key) {
            throw new Error('API配置未设置');
        }
        
        try {
            let url = config.url;
            if (!url.endsWith('/')) {
                url += '/';
            }
            url += endpoint;
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${config.key}`,
                    'Content-Type': 'application/json'
                },
                body: method !== 'GET' ? JSON.stringify(data) : undefined
            });
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIConfig;
} else {
    // 浏览器环境
    window.APIConfig = APIConfig;
}
