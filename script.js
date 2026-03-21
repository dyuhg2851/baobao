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

// 可交互自定义小组件功能

// 打开图片上传对话框
function openImageUpload() {
    document.getElementById('imageUpload').click();
}

// 处理图片上传
function handleImageUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatarImage = document.getElementById('avatarImage');
            avatarImage.src = e.target.result;
            // 保存到localStorage
            localStorage.setItem('widgetAvatar', e.target.result);
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// 编辑文本
function editText(element, key) {
    const currentText = element.textContent;
    const newText = prompt('请输入新内容:', currentText);
    if (newText !== null) {
        element.textContent = newText;
        // 保存到localStorage
        localStorage.setItem(key, newText);
    }
}

// 编辑emoji
function editEmoji(element) {
    const currentEmoji = element.textContent;
    const newEmoji = prompt('请输入新的emoji:', currentEmoji);
    if (newEmoji !== null) {
        element.textContent = newEmoji;
        // 保存到localStorage
        localStorage.setItem('widgetEmoji', newEmoji);
    }
}

// 页面加载时从localStorage恢复数据
window.addEventListener('load', function() {
    // 恢复头像
    const savedAvatar = localStorage.getItem('widgetAvatar');
    if (savedAvatar) {
        document.getElementById('avatarImage').src = savedAvatar;
    }
    
    // 恢复标题
    const savedTitle = localStorage.getItem('cardTitle');
    if (savedTitle) {
        document.querySelector('.widget-card-title').textContent = savedTitle;
    }
    
    // 恢复副标题
    const savedSubtitle = localStorage.getItem('cardSubtitle');
    if (savedSubtitle) {
        document.querySelector('.widget-card-subtitle').textContent = savedSubtitle;
    }
    
    // 恢复小卡片文本
    const savedSmallCardText = localStorage.getItem('smallCardText');
    if (savedSmallCardText) {
        document.querySelector('.widget-small-card').textContent = savedSmallCardText;
    }
    
    // 恢复emoji
    const savedEmoji = localStorage.getItem('widgetEmoji');
    if (savedEmoji) {
        document.querySelector('.widget-emoji-button').textContent = savedEmoji;
    }
});