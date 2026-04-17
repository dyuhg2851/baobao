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
});