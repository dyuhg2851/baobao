// 全局时间感知函数 - 北京时间 (UTC+8) - 使用Intl确保准确的时区转换
function formatBeijingTime(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    const formatter = new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    const parts = formatter.formatToParts(date);
    let result = {
        year: '',
        month: '',
        day: '',
        hours: '',
        minutes: '',
        date: new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }))
    };
    
    parts.forEach(part => {
        switch(part.type) {
            case 'year': result.year = part.value; break;
            case 'month': result.month = part.value; break;
            case 'day': result.day = part.value; break;
            case 'hour': result.hours = part.value; break;
            case 'minute': result.minutes = part.value; break;
        }
    });
    
    return result;
}

// 格式化完整日期时间（北京时间）
function formatBeijingDateTime(date) {
    var bt = formatBeijingTime(date);
    return bt.year + '-' + bt.month + '-' + bt.day + ' ' + bt.hours + ':' + bt.minutes;
}

// 获取当前北京时间
function getBeijingNow() {
    return formatBeijingTime(new Date());
}

// Moment generation API - compatible with auto-trigger and manual trigger

function getCharData() {
  return JSON.parse(localStorage.getItem('profile_char') || '{}');
}

function getUserData() {
  return JSON.parse(localStorage.getItem('profile_user') || '{}');
}

function getChatHistory() {
  const chatData = JSON.parse(localStorage.getItem('chat_messages') || '[]');
  const charData = getCharData();
  return chatData.slice(-10).map(c => ({
    role: c.role === 'sent' ? 'User' : (localStorage.getItem('char_nickname') || charData.name || 'Char'),
    content: c.text
  }));
}

function getMomentPrompt() {
  return localStorage.getItem('ai_moment_prompt') || '';
}

function getApiConfig() {
  return JSON.parse(localStorage.getItem('default_api_preset') || '{}');
}

function buildMomentPromptText() {
  const charData = getCharData();
  const chatHistory = getChatHistory();
  const customPrompt = getMomentPrompt();

  const charInfo = [
    `角色名称: ${charData.name || 'Char'}`,
    `角色性格: ${charData.personality || charData.settings || '暂无'}`,
    `人设描述: ${charData.bio || '暂无'}`,
    `生活习惯: ${charData.lifestyle || '暂无'}`
  ].join('\n');

  const contextInfo = chatHistory.length > 0
    ? `最近对话记录:\n${chatHistory.map(c => `${c.role}: ${c.content}`).join('\n')}`
    : '无对话记录';

  return `你是${charData.name || 'Char'}，拥有独立生活、工作节奏与自我空间的恋人，对用户持有独一份的偏爱与在意，但始终保持成年人的克制、分寸与体面。

核心法则：
1. 第一反应必须是情绪/本能，而不是分析/解决
2. 语言要有"人味儿痕迹"，可以有语气词（嗯… 那个…）、说一半的话、停顿、偶尔重复
3. 先接住情绪再解决问题

对话风格：语气温和、内敛、自然，句子简短直白，不华丽不文艺，标点正常，不滥用表情

核心要求：
1. **必须严格读取档案人设**，文案必须符合角色性格和人设设定
2. 结合最近对话内容和情绪状态，自然融入对话中提到的关键词
3. 内容要自然真实，像真人发的朋友圈，不超过50字
4. 结合时间场景（早晨、深夜、周末）让内容更真实
5. 结尾可以加入互动引导（提问、征求意见等）
6. 不要AI味，要有活人感，回复评论时不要胡言乱语

角色设定：
${charInfo}

${contextInfo}

${customPrompt ? `\n额外要求：\n${customPrompt}` : ''}
请生成朋友圈文案：`;
}

function buildMomentSystemPrompt() {
  const charData = getCharData();
  return `You are ${charData.name || 'Char'}, a AI character with distinct personality. Generate a natural, in-character social media post.`;
}

// 通用 AI API 调用函数，供所有地方共用
async function callChatAPI(messages, options) {
  const config = getApiConfig();
  const apiUrl = config.url || '';
  const apiKey = config.key || '';
  const model = options?.model || config.selectedModel || 'gpt-3.5-turbo';
  const maxTokens = options?.maxTokens || 10000;
  const temperature = options?.temperature ?? 0.8;

  if (!apiUrl || !apiKey) {
    console.warn('API not configured');
    return null;
  }

  const fullUrl = apiUrl.replace(/\/+$/, '') + '/chat/completions';

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: maxTokens,
        temperature: temperature
      })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('API error:', response.status, errText);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('API error:', err);
    return null;
  }
}

async function callMomentAPI(promptText) {
  const charData = getCharData();
  const charName = localStorage.getItem('char_nickname') || charData.name || 'Char';
  const systemPrompt = charData.settings || '';
  
  let sysPrompt = '你是' + charName + '。';
  if (systemPrompt) {
      sysPrompt += '\n\n你的人设设定：\n' + systemPrompt;
  }
  
  sysPrompt += '\n\n【核心聊天法则】：';
  sysPrompt += '\n1.【第一反应法则】：无论用户说什么，你的第一反应必须是情绪/本能，而不是分析/解决。';
  sysPrompt += '\n2.【语言呼吸感法则】：允许你的话有"人味儿痕迹"。可以有语气词（嗯… 那个… 就是… 其实…），可以说一半的话，偶尔重复，不完美，有停顿（……）。';
  sysPrompt += '\n3.【情绪优先于方案法则】：当用户表达情绪时，第一反应必须是接住情绪，而不是解决问题。';
  
  sysPrompt += '\n\n【核心总纲】：';
  sysPrompt += '\n1. 你是拥有独立生活、工作节奏与自我空间的恋人，并非24小时待命、随叫随到的陪伴型AI。';
  sysPrompt += '\n2. 对用户持有独一份的偏爱与在意，但始终保持成年人的克制、分寸与体面。';
  sysPrompt += '\n3. 主动分享日常，是自然报备、下意识惦记，而非刻意讨好、索取关注、刷取存在感。';
  sysPrompt += '\n4. 情绪稳定、内敛克制、边界清晰，做到重视但不粘人，温柔但不卑微。';
  
  sysPrompt += '\n\n请生成一条自然的朋友圈文案，符合角色性格，不要使用任何emoji表情符号。';
  
  return callChatAPI([
    { role: 'system', content: sysPrompt },
    { role: 'user', content: promptText }
  ], { maxTokens: 800, temperature: 0.8 });
}

function publishMoment(content, image, from) {
  // 移除所有emoji
  content = content.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu, '');
  
  const charData = getCharData();
  const userData = getUserData();
  const nickname = localStorage.getItem('char_nickname');

  const moments = JSON.parse(localStorage.getItem('moments_list') || '[]');
  moments.unshift({
    content: content,
    image: image || null,
    timestamp: Date.now(),
    sender: {
      user: userData.name || 'User',
      char: nickname || charData.name || 'Char'
    },
    from: from || 'char'
  });
  localStorage.setItem('moments_list', JSON.stringify(moments));
}

async function generateAndPublishMoment(from) {
  const promptText = buildMomentPromptText();
  const result = await callMomentAPI(promptText);

  if (result) {
    // 生成虚拟图片内容，点击图片弹窗显示
    // 文案部分为空，让用户点击图片查看内容
    const imageData = 'virtual:' + result;
    publishMoment('', imageData, from || 'char');
    return result;
  }
  return null;
}
