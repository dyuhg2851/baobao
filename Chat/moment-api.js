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
    role: c.role === 'sent' ? 'User' : (charData.name || 'Char'),
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
1. 文案必须符合角色性格和人设
2. 结合最近对话内容和情绪状态，自然融入对话中提到的关键词
3. 内容要自然真实，像真人发的朋友圈，不超过100字
4. 结合时间场景（早晨、深夜、周末）让内容更真实
5. 可以适当使用emoji表情增加生动感
6. 结尾可以加入互动引导（提问、征求意见等）
7. 不要AI味，要有活人感

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
  const maxTokens = options?.maxTokens || 200;
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
  
  const systemPrompt = `You are ${charData.name || 'Char'}, an AI character with distinct personality. 
  Character Settings:
  - Personality: ${charData.personality || charData.settings || 'None'}
  - Description: ${charData.bio || 'None'}
  - Lifestyle: ${charData.lifestyle || 'None'}
  
  Generate a natural, authentic social media post that matches the character's personality and style.`;
  
  return callChatAPI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: promptText }
  ], { maxTokens: 800, temperature: 0.8 });
}

function publishMoment(content, image, from) {
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
    publishMoment(result, null, from || 'char');
    return result;
  }
  return null;
}
