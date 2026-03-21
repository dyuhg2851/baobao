// 阻止双击放大
let lastTap = 0;
document.addEventListener('touchstart', function(e) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0) {
        e.preventDefault();
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

// 初始化右滑返回
function initSwipeBack() {
    let startX = 0;
    let currentX = 0;
    let isSwiping = false;
    
    document.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        // 限制滑动触发区域为屏幕左侧20%区域
        if (startX < window.innerWidth * 0.2 && settingsPage.classList.contains('show')) {
            isSwiping = true;
            // 确保设置页面有过渡效果
            settingsPage.style.transition = 'none';
        }
    });
    
    document.addEventListener('touchmove', function(e) {
        if (!isSwiping) return;
        
        currentX = e.touches[0].clientX;
        const diffX = currentX - startX;
        
        if (diffX > 0) { // 向右滑动
            // 页面跟随手指平滑移动
            settingsPage.style.transform = `translateX(${Math.min(diffX, window.innerWidth * 0.5)}px)`;
            settingsPage.style.opacity = 1 - (diffX / (window.innerWidth * 0.5)) * 0.3;
        }
    });
    
    document.addEventListener('touchend', function() {
        if (!isSwiping) return;
        
        const diffX = currentX - startX;
        
        // 恢复过渡效果
        settingsPage.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        
        if (diffX > window.innerWidth / 3) {
            // 滑动距离超过屏幕1/3，返回主屏幕
            settingsPage.style.transform = `translateX(${window.innerWidth}px)`;
            settingsPage.style.opacity = '0';
            // 延迟执行goBack，等待动画完成
            setTimeout(goBack, 300);
        } else {
            // 否则回弹复位
            settingsPage.style.transform = 'translateX(0)';
            settingsPage.style.opacity = '1';
        }
        
        isSwiping = false;
    });
}

// 页面加载时初始化
window.addEventListener('load', function() {
    loadProfileInfo();
    initSwipeBack();
});