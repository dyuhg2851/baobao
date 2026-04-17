document.addEventListener('DOMContentLoaded', function() {
    // 头像上传功能
    const avatar = document.getElementById('avatar');
    const avatarUpload = document.getElementById('avatar-upload');
    
    avatar.addEventListener('click', function() {
        avatarUpload.click();
    });
    
    avatarUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = avatar.querySelector('img');
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // 昵称和ID编辑功能
    const nickname = document.getElementById('nickname');
    const id = document.getElementById('id');
    
    nickname.addEventListener('blur', function() {
        if (!this.textContent.trim()) {
            this.textContent = '晕了饱饱';
        }
    });
    
    id.addEventListener('blur', function() {
        if (!this.textContent.trim()) {
            this.textContent = '@Q_iian';
        }
    });
    
    // 内容编辑功能
    const content = document.getElementById('content');
    
    content.addEventListener('blur', function() {
        if (!this.textContent.trim()) {
            this.textContent = '拥有苹果时 只在意苹果';
        }
    });
    
    // 表情/图标替换功能
    const emoji = document.getElementById('emoji');
    const emojis = ['🍎', '🍏', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒'];
    let currentEmojiIndex = 0;
    
    emoji.addEventListener('click', function() {
        const newContent = prompt('请输入要显示的内容（可以是emoji、文字或其他符号）：', this.textContent);
        if (newContent !== null && newContent.trim() !== '') {
            this.textContent = newContent.trim();
        }
    });
    
    // 阻止编辑时的默认行为
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    editableElements.forEach(element => {
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur();
            }
        });
    });
});