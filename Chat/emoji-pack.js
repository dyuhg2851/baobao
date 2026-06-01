const EMOJI_PACK_KEY = 'emoji_pack';

let emojiPack = [];
let selectedEmoji = null;
let longPressTimer = null;

document.addEventListener('DOMContentLoaded', function() {
    loadEmojiPack();
    renderEmojis();
    setupEventListeners();
});

function loadEmojiPack() {
    try {
        emojiPack = JSON.parse(localStorage.getItem(EMOJI_PACK_KEY) || '[]');
    } catch {
        emojiPack = [];
    }
}

function saveEmojiPack() {
    localStorage.setItem(EMOJI_PACK_KEY, JSON.stringify(emojiPack));
}

function renderEmojis() {
    const grid = document.getElementById('emoji-grid');
    grid.innerHTML = '';

    if (emojiPack.length === 0) {
        grid.innerHTML = '<div class="empty-state">暂无表情包<br>点击右上角 + 添加</div>';
        return;
    }

    emojiPack.forEach((emoji, index) => {
        const item = document.createElement('div');
        item.className = 'emoji-item';
        item.dataset.index = index;
        item.innerHTML = `
            <img src="${emoji.url}" alt="${emoji.name}">
            <div class="emoji-name">${emoji.name}</div>
        `;
        grid.appendChild(item);
    });
}

function setupEventListeners() {
    document.getElementById('back-btn').addEventListener('click', function() {
        window.location.href = 'me.html';
    });

    document.getElementById('add-btn').addEventListener('click', function() {
        document.getElementById('emoji-input').value = '';
        document.getElementById('add-modal').classList.add('show');
        document.getElementById('emoji-input').focus();
    });

    document.getElementById('cancel-btn').addEventListener('click', function() {
        document.getElementById('add-modal').classList.remove('show');
    });

    document.getElementById('confirm-btn').addEventListener('click', function() {
        addEmoji();
    });

    document.getElementById('add-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('show');
        }
    });

    document.getElementById('emoji-input').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            addEmoji();
        }
    });

    document.getElementById('emoji-grid').addEventListener('touchstart', function(e) {
        const item = e.target.closest('.emoji-item');
        if (!item) return;

        selectedEmoji = parseInt(item.dataset.index);
        longPressTimer = setTimeout(() => {
            showDeleteButton();
        }, 500);
    });

    document.getElementById('emoji-grid').addEventListener('touchend', function(e) {
        clearTimeout(longPressTimer);
        if (!e.target.closest('.emoji-item') && !e.target.closest('.delete-btn')) {
            hideDeleteButton();
        }
    });

    document.getElementById('emoji-grid').addEventListener('touchmove', function(e) {
        clearTimeout(longPressTimer);
    });

    document.getElementById('emoji-grid').addEventListener('mousedown', function(e) {
        const item = e.target.closest('.emoji-item');
        if (!item) return;

        selectedEmoji = parseInt(item.dataset.index);
        longPressTimer = setTimeout(() => {
            showDeleteButton();
        }, 500);
    });

    document.getElementById('emoji-grid').addEventListener('mouseup', function(e) {
        clearTimeout(longPressTimer);
    });

    document.getElementById('delete-btn').addEventListener('click', function() {
        if (selectedEmoji !== null && selectedEmoji >= 0) {
            emojiPack.splice(selectedEmoji, 1);
            saveEmojiPack();
            renderEmojis();
            hideDeleteButton();
            selectedEmoji = null;
        }
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.emoji-item') && !e.target.closest('.delete-btn')) {
            hideDeleteButton();
        }
    });
}

function showDeleteButton() {
    document.getElementById('delete-btn').classList.add('show');
}

function hideDeleteButton() {
    document.getElementById('delete-btn').classList.remove('show');
}

function addEmoji() {
    const input = document.getElementById('emoji-input').value.trim();
    
    if (!input) {
        return;
    }

    const parts = input.split('：');
    let name, url;

    if (parts.length >= 2) {
        name = parts.slice(0, -1).join('：').trim();
        url = parts[parts.length - 1].trim();
    } else {
        const colonIndex = input.indexOf(':');
        if (colonIndex !== -1) {
            name = input.substring(0, colonIndex).trim();
            url = input.substring(colonIndex + 1).trim();
        } else {
            name = '表情' + (emojiPack.length + 1);
            url = input;
        }
    }

    if (!url) {
        return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    emojiPack.push({ name, url });
    saveEmojiPack();
    renderEmojis();
    
    document.getElementById('add-modal').classList.remove('show');
}