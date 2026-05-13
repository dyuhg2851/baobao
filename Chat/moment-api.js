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

  return `你是一个性格鲜明的AI角色。请根据以下角色设定和最近的对话上下文，生成一条适合该角色发布的微信朋友圈动态。

要求：
1. 文案要符合角色性格和人设
2. 结合当前场景和情绪
3. 语言风格要与角色一致
4. 内容要自然真实，不超过100字
5. 如果有合适的图片场景也可以简单提及

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

async function callMomentAPI(promptText) {
  const config = getApiConfig();
  const apiUrl = config.url || '';
  const apiKey = config.key || '';
  const model = config.selectedModel || 'gpt-3.5-turbo';

  if (!apiUrl) {
    console.warn('API not configured');
    return null;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'Authorization': 'Bearer ' + apiKey } : {})
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: buildMomentSystemPrompt() },
          { role: 'user', content: promptText }
        ],
        max_tokens: 200,
        temperature: 0.8
      })
    });

    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('Moment API error:', err);
    return null;
  }
}

function publishMoment(content, image, from) {
  const charData = getCharData();
  const userData = getUserData();

  const moments = JSON.parse(localStorage.getItem('moments_list') || '[]');
  moments.unshift({
    content: content,
    image: image || null,
    timestamp: Date.now(),
    sender: {
      user: userData.name || 'User',
      char: charData.name || 'Char'
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
