/**
 * 松鼠下载器 - Options Script
 */

// DOM 元素
const elements = {
  server: document.getElementById('server'),
  username: document.getElementById('username'),
  password: document.getElementById('password'),
  threadCount: document.getElementById('threadCount'),
  retryCount: document.getElementById('retryCount'),
  autoSelect: document.getElementById('autoSelect'),
  sendCredentials: document.getElementById('sendCredentials'),
  btnTest: document.getElementById('btnTest'),
  btnSave: document.getElementById('btnSave'),
  testResult: document.getElementById('testResult'),
  saveResult: document.getElementById('saveResult'),
  extGrid: document.getElementById('extGrid'),
  proxyEnable: document.getElementById('proxyEnable'),
  proxySettings: document.getElementById('proxySettings'),
  proxyType: document.getElementById('proxyType'),
  proxyHost: document.getElementById('proxyHost'),
  proxyPort: document.getElementById('proxyPort'),
  proxyAuth: document.getElementById('proxyAuth'),
  proxyAuthSettings: document.getElementById('proxyAuthSettings'),
  proxyUsername: document.getElementById('proxyUsername'),
  proxyPassword: document.getElementById('proxyPassword'),
  // AI 翻译配置
  aiTranslateEnable: document.getElementById('aiTranslateEnable'),
  aiTranslateSettings: document.getElementById('aiTranslateSettings'),
  aiBaseUrl: document.getElementById('aiBaseUrl'),
  aiBaseUrlPreview: document.getElementById('aiBaseUrlPreview'),
  aiModelId: document.getElementById('aiModelId'),
  aiApiKey: document.getElementById('aiApiKey'),
  aiPrompt: document.getElementById('aiPrompt'),
  btnTestAi: document.getElementById('btnTestAi'),
  aiTestResult: document.getElementById('aiTestResult'),
  // 底部固定保存栏与未保存状态
  saveState: document.getElementById('saveState'),
  saveBar: document.getElementById('saveBar'),
  saveBarText: document.getElementById('saveBarText'),
  btnReset: document.getElementById('btnReset')
};

// 是否有未保存的修改
let isDirty = false;

// AI 测试请求超时（毫秒）：模型通常几秒返回，但不能无限等
const AI_TIMEOUT_MS = 30000;

/**
 * AbortSignal.timeout() 触发时 reject 的是 TimeoutError，手动 abort 是 AbortError。
 */
function isTimeoutError(e) {
  return !!e && (e.name === 'TimeoutError' || e.name === 'AbortError');
}

// 默认支持的资源类型
// 默认勾选的嗅探类型。与 background.js 里的 DEFAULT_ENABLED_EXTENSIONS 保持一致
// （service worker 不是 module，无法复用，改动时请两处同步）。
// TS 默认不勾选：它是 HLS 分片，一集视频会有成百上千条，会把列表刷满。
const DEFAULT_EXTENSIONS = [
  { ext: 'm3u8', label: 'M3U8', enabled: true },
  { ext: 'mp4', label: 'MP4', enabled: true },
  { ext: 'ts', label: 'TS', enabled: false },
  { ext: 'm4s', label: 'M4S', enabled: true },
  { ext: 'm4a', label: 'M4A', enabled: true },
  { ext: 'mpd', label: 'MPD', enabled: true },
  { ext: 'flv', label: 'FLV', enabled: true },
  { ext: 'webm', label: 'WebM', enabled: true },
  { ext: 'mp3', label: 'MP3', enabled: true },
  { ext: 'wav', label: 'WAV', enabled: true },
  { ext: 'ogg', label: 'OGG', enabled: true },
  { ext: 'aac', label: 'AAC', enabled: true },
  { ext: 'mkv', label: 'MKV', enabled: true },
  { ext: 'mov', label: 'MOV', enabled: true },
  { ext: 'avi', label: 'AVI', enabled: true }
];

/**
 * 初始化 - 加载已保存的配置
 */
async function init() {
  const config = await loadConfig();

  // 填充表单
  elements.server.value = config.server || '';
  elements.username.value = config.username || '';
  elements.password.value = config.password || '';
  elements.threadCount.value = config.threadCount || DEFAULT_THREAD_COUNT;
  elements.retryCount.value = config.retryCount || DEFAULT_RETRY_COUNT;
  elements.autoSelect.checked = config.autoSelect !== false;
  elements.sendCredentials.checked = config.sendCredentials === true;

  // 代理配置
  elements.proxyEnable.checked = config.proxyEnable || false;
  elements.proxyType.value = config.proxyType || 'http';
  elements.proxyHost.value = config.proxyHost || '';
  elements.proxyPort.value = config.proxyPort || '';
  elements.proxyAuth.checked = config.proxyAuth || false;
  elements.proxyUsername.value = config.proxyUsername || '';
  elements.proxyPassword.value = config.proxyPassword || '';

  // AI 翻译配置
  elements.aiTranslateEnable.checked = config.aiTranslateEnable || false;
  elements.aiBaseUrl.value = config.aiBaseUrl || '';
  elements.aiModelId.value = config.aiModelId || '';
  elements.aiApiKey.value = config.aiApiKey || '';
  elements.aiPrompt.value = config.aiPrompt || DEFAULT_AI_PROMPT;

  // 显示/隐藏代理设置
  toggleProxySettings();
  toggleProxyAuthSettings();

  // 显示/隐藏 AI 翻译设置
  toggleAiTranslateSettings();
  updateAiBaseUrlPreview();

  // 渲染资源类型网格
  renderExtGrid(config.enabledExtensions);

  // 绑定事件
  bindEvents();

  // 初始化后再启用"未保存"监听，避免填充表单时误标记
  setDirty(false);
  elements.extGrid.addEventListener('change', function() { setDirty(true); });
  document.querySelector('.container').addEventListener('change', function(e) {
    if (e.target.matches('input, select, textarea')) setDirty(true);
  });
}

/**
 * 加载配置
 */
function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      ['server', 'username', 'password', 'threadCount', 'retryCount', 'autoSelect', 'sendCredentials', 'enabledExtensions',
       'proxyEnable', 'proxyType', 'proxyHost', 'proxyPort', 'proxyAuth', 'proxyUsername', 'proxyPassword',
       'aiTranslateEnable', 'aiBaseUrl', 'aiModelId', 'aiApiKey', 'aiPrompt'],
      function(data) {
        resolve(data);
      }
    );
  });
}

/**
 * 渲染资源类型网格
 */
function renderExtGrid(enabledExtensions) {
  // 如果没有保存过配置，使用默认值
  const enabledSet = new Set(enabledExtensions || DEFAULT_EXTENSIONS.filter(e => e.enabled).map(e => e.ext));

  const html = DEFAULT_EXTENSIONS.map(item => {
    const isChecked = enabledSet.has(item.ext);
    return `
      <label class="ext-item" for="ext_${item.ext}">
        <input type="checkbox" id="ext_${item.ext}" value="${item.ext}" ${isChecked ? 'checked' : ''}>
        <span>${item.label}</span>
      </label>
    `;
  }).join('');

  elements.extGrid.innerHTML = html;
}

/**
 * 收集当前表单配置（只读表单，不落盘）
 */
function collectConfig() {
  // 获取启用的扩展名
  const enabledExtensions = [];
  elements.extGrid.querySelectorAll('input[type="checkbox"]:checked').forEach(function(checkbox) {
    enabledExtensions.push(checkbox.value);
  });

  const config = {
    server: elements.server.value.trim().replace(/\/+$/, ''), // 移除末尾斜杠
    username: elements.username.value.trim(),
    password: elements.password.value,
    threadCount: parseInt(elements.threadCount.value) || DEFAULT_THREAD_COUNT,
    retryCount: parseInt(elements.retryCount.value) || DEFAULT_RETRY_COUNT,
    autoSelect: elements.autoSelect.checked,
    sendCredentials: elements.sendCredentials.checked,
    enabledExtensions: enabledExtensions,
    // 代理配置
    proxyEnable: elements.proxyEnable.checked,
    proxyType: elements.proxyType.value,
    proxyHost: elements.proxyHost.value.trim(),
    proxyPort: parseInt(elements.proxyPort.value) || 0,
    proxyAuth: elements.proxyAuth.checked,
    proxyUsername: elements.proxyUsername.value.trim(),
    proxyPassword: elements.proxyPassword.value,
    // AI 翻译配置
    aiTranslateEnable: elements.aiTranslateEnable.checked,
    aiBaseUrl: elements.aiBaseUrl.value.trim().replace(/\/+$/, ''),
    aiModelId: elements.aiModelId.value.trim(),
    aiApiKey: elements.aiApiKey.value,
    aiPrompt: elements.aiPrompt.value
  };

  return config;
}

/**
 * 校验配置。
 * 保存前就把明显不合法的值拦住，避免等到发送任务/测试连接时才报错。
 * @returns {{fieldId: string, message: string}|null} 校验失败返回字段 id 与提示，通过返回 null
 */
function validateConfig(config) {
  if (config.server) {
    if (!/^https?:\/\//i.test(config.server)) {
      return { fieldId: 'server', message: '服务器地址必须以 http:// 或 https:// 开头' };
    }
    try {
      const url = new URL(config.server);
      if (!url.hostname) throw new Error('no host');
    } catch (e) {
      return { fieldId: 'server', message: '服务器地址格式不正确，例如 http://192.168.1.100:21808' };
    }
  }

  if (config.proxyEnable) {
    if (!config.proxyHost) {
      return { fieldId: 'proxyHost', message: '启用代理后必须填写代理地址' };
    }
    if (config.proxyHost.includes('://')) {
      return { fieldId: 'proxyHost', message: '代理地址只填主机名或 IP，不要带 http:// 前缀' };
    }
    if (!Number.isInteger(config.proxyPort) || config.proxyPort < 1 || config.proxyPort > 65535) {
      return { fieldId: 'proxyPort', message: '代理端口需为 1-65535 之间的整数' };
    }
  }

  if (!Number.isInteger(config.threadCount) || config.threadCount < 1 || config.threadCount > 128) {
    return { fieldId: 'threadCount', message: '线程数需为 1-128 之间的整数' };
  }

  if (!Number.isInteger(config.retryCount) || config.retryCount < 0 || config.retryCount > 100) {
    return { fieldId: 'retryCount', message: '重试次数需为 0-100 之间的整数' };
  }

  if (config.aiTranslateEnable) {
    if (!config.aiBaseUrl) {
      return { fieldId: 'aiBaseUrl', message: '启用 AI 翻译后必须填写 API Base URL' };
    }
    if (!/^https?:\/\//i.test(config.aiBaseUrl)) {
      return { fieldId: 'aiBaseUrl', message: 'API Base URL 必须以 http:// 或 https:// 开头' };
    }
  }

  return null;
}

/**
 * 保存配置（调用前应先通过 validateConfig）
 * @param {object} [config] 已收集/校验过的配置，省略时重新读表单
 */
function saveConfig(config) {
  const data = config || collectConfig();
  return new Promise((resolve) => {
    chrome.storage.sync.set(data, function() {
      setDirty(false);
      resolve(data);
    });
  });
}

/**
 * 更新"未保存"状态显示
 * @param {boolean} dirty 是否存在未保存的修改
 */
function setDirty(dirty) {
  isDirty = dirty;

  elements.saveState.textContent = dirty ? '有未保存的修改' : '已保存';
  elements.saveState.classList.toggle('dirty', dirty);

  elements.saveBar.classList.toggle('dirty', dirty);
  elements.saveBarText.textContent = dirty
    ? '有未保存的修改，记得点右侧「保存配置」'
    : '修改设置后记得保存';
}

/**
 * 把表单恢复为默认值（不会自动写入存储，仍需点保存）
 */
function resetToDefaults() {
  if (!window.confirm('确定要把所有设置恢复为默认值吗？（AI Key、代理密码等也会被清空，恢复后需点击保存）')) {
    return;
  }

  elements.server.value = '';
  elements.username.value = '';
  elements.password.value = '';
  elements.threadCount.value = DEFAULT_THREAD_COUNT;
  elements.retryCount.value = DEFAULT_RETRY_COUNT;
  elements.autoSelect.checked = DEFAULT_AUTO_SELECT;
  elements.sendCredentials.checked = DEFAULT_SEND_CREDENTIALS;

  elements.proxyEnable.checked = false;
  elements.proxyType.value = 'http';
  elements.proxyHost.value = '';
  elements.proxyPort.value = '';
  elements.proxyAuth.checked = false;
  elements.proxyUsername.value = '';
  elements.proxyPassword.value = '';

  elements.aiTranslateEnable.checked = false;
  elements.aiBaseUrl.value = '';
  elements.aiModelId.value = '';
  elements.aiApiKey.value = '';
  elements.aiPrompt.value = DEFAULT_AI_PROMPT;

  // 资源类型恢复各自的默认勾选状态（TS 默认不勾选，不能一律全选）
  elements.extGrid.querySelectorAll('input[type="checkbox"]').forEach(function(checkbox) {
    const item = DEFAULT_EXTENSIONS.find(function(entry) { return entry.ext === checkbox.value; });
    checkbox.checked = item ? item.enabled : true;
  });

  toggleProxySettings();
  toggleProxyAuthSettings();
  toggleAiTranslateSettings();
  updateAiBaseUrlPreview();
  setDirty(true);
  showSaveResult('已恢复默认值，点击「保存配置」生效', 'error');
}

/**
 * 切换代理设置显示
 */
function toggleProxySettings() {
  if (elements.proxyEnable.checked) {
    elements.proxySettings.classList.remove('hide');
  } else {
    elements.proxySettings.classList.add('hide');
  }
}

/**
 * 切换代理认证设置显示
 */
function toggleProxyAuthSettings() {
  if (elements.proxyAuth.checked) {
    elements.proxyAuthSettings.classList.remove('hide');
  } else {
    elements.proxyAuthSettings.classList.add('hide');
  }
}

/**
 * 切换 AI 翻译设置显示
 */
function toggleAiTranslateSettings() {
  if (elements.aiTranslateEnable.checked) {
    elements.aiTranslateSettings.classList.remove('hide');
  } else {
    elements.aiTranslateSettings.classList.add('hide');
  }
}

/**
 * 绑定事件
 */
function bindEvents() {
  // 测试连接按钮
  elements.btnTest.addEventListener('click', handleTest);

  // 代理启用切换
  elements.proxyEnable.addEventListener('change', toggleProxySettings);

  // 代理认证切换
  elements.proxyAuth.addEventListener('change', toggleProxyAuthSettings);

  // AI 翻译启用切换
  elements.aiTranslateEnable.addEventListener('change', toggleAiTranslateSettings);

  // AI Base URL 变化时实时刷新“实际请求地址”预览
  elements.aiBaseUrl.addEventListener('input', updateAiBaseUrlPreview);

  // 测试 AI 翻译按钮
  elements.btnTestAi.addEventListener('click', handleTestAiTranslate);

  // 底部保存栏
  elements.btnSave.addEventListener('click', handleSave);
  elements.btnReset.addEventListener('click', resetToDefaults);
}

/**
 * 测试服务器连接
 */
async function handleTest() {
  const server = elements.server.value.trim();
  const username = elements.username.value.trim();
  const password = elements.password.value;

  if (!server) {
    showTestResult('请输入服务器地址', 'error');
    return;
  }

  // 没有协议头时 fetch 只会抛 "Failed to fetch"，这里提前给出明确提示
  if (!/^https?:\/\//i.test(server)) {
    showTestResult('服务器地址必须以 http:// 或 https:// 开头', 'error');
    elements.server.focus();
    return;
  }

  if (!username || !password) {
    showTestResult('请输入用户名和密码', 'error');
    return;
  }

  // 禁用按钮
  elements.btnTest.disabled = true;
  elements.btnTest.querySelector('.btn-label').textContent = '测试中...';

  try {
    const result = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: 'testConnection',
          server: server,
          username: username,
          password: password
        },
        resolve
      );
    });

    if (result.success) {
      showTestResult(`连接成功！用户: ${result.user.username || username}`, 'success');
    } else {
      showTestResult(`连接失败: ${result.error}`, 'error');
    }
  } catch (e) {
    showTestResult(`连接错误: ${e.message}`, 'error');
  } finally {
    elements.btnTest.disabled = false;
    elements.btnTest.querySelector('.btn-label').textContent = '测试连接';
  }
}

/**
 * 保存配置
 */
async function handleSave() {
  const config = collectConfig();
  const invalid = validateConfig(config);
  if (invalid) {
    showSaveResult(invalid.message, 'error');
    const field = document.getElementById(invalid.fieldId);
    if (field) {
      field.focus();
      if (field.scrollIntoView) field.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    return;
  }

  await saveConfig(config);
  showSaveResult('配置已保存', 'success');
}

/**
 * 显示测试结果
 */
function showTestResult(message, type) {
  elements.testResult.textContent = message;
  elements.testResult.className = 'test-result ' + type;
}

/**
 * 显示保存提示
 */
function showSaveResult(message, type = 'success') {
  elements.saveResult.textContent = message;
  elements.saveResult.className = 'save-result show ' + type;
  setTimeout(() => {
    elements.saveResult.className = 'save-result';
  }, type === 'error' ? 5000 : 2000);
}

/**
 * 测试 AI 翻译
 */
async function handleTestAiTranslate() {
  const baseUrl = elements.aiBaseUrl.value.trim();
  const modelId = elements.aiModelId.value.trim();
  const apiKey = elements.aiApiKey.value;
  const prompt = elements.aiPrompt.value;

  if (!baseUrl || !modelId || !apiKey) {
    showAiTestResult('请填写完整的 AI 配置', 'error');
    return;
  }

  // 同服务器地址：缺少协议头时 fetch 只会报 "Failed to fetch"
  if (!/^https?:\/\//i.test(baseUrl)) {
    showAiTestResult('API Base URL 必须以 http:// 或 https:// 开头', 'error');
    elements.aiBaseUrl.focus();
    return;
  }

  // 禁用按钮
  elements.btnTestAi.disabled = true;
  elements.btnTestAi.querySelector('.btn-label').textContent = '测试中...';

  try {
    const testText = 'Hello, World!';
    const translatedText = await callAiTranslate(testText, baseUrl, modelId, apiKey, prompt);
    showAiTestResult(`翻译成功！"${testText}" → "${translatedText}"`, 'success');
  } catch (e) {
    const message = isTimeoutError(e) ? '请求超时（30 秒），请检查 AI 服务' : e.message;
    showAiTestResult(`翻译失败: ${message}`, 'error');
  } finally {
    elements.btnTestAi.disabled = false;
    elements.btnTestAi.querySelector('.btn-label').textContent = '测试翻译';
  }
}

/**
 * 拼接 chat/completions 地址。
 * 用户经常把完整 endpoint 粘进 Base URL，这里兼容去掉末尾的 /v1/chat/completions，
 * 避免拼成 .../v1/chat/completions/v1/chat/completions。
 */
function buildChatCompletionsUrl(baseUrl) {
  const base = (baseUrl || '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/v1\/chat\/completions$/i, '')
    .replace(/\/+$/, '');
  return base + '/v1/chat/completions';
}

/**
 * 实时显示实际请求地址，提醒 Base URL 不需要包含 /v1/chat/completions
 */
function updateAiBaseUrlPreview() {
  const preview = elements.aiBaseUrlPreview;
  if (!preview) return;

  const raw = elements.aiBaseUrl.value.trim();
  if (!raw) {
    preview.textContent = '实际请求地址：https://你的域名/v1/chat/completions';
    preview.classList.remove('warn');
    return;
  }

  const trimmed = raw.replace(/\/+$/, '');
  const hadEndpoint = /\/v1\/chat\/completions$/i.test(trimmed);
  preview.textContent = '实际请求地址：' + buildChatCompletionsUrl(raw)
    + (hadEndpoint ? '（已自动去掉多余的 /v1/chat/completions）' : '');
  preview.classList.toggle('warn', hadEndpoint);
}

/**
 * 调用 AI 翻译 API
 */
async function callAiTranslate(text, baseUrl, modelId, apiKey, prompt) {
  const url = buildChatCompletionsUrl(baseUrl);

  const systemPrompt = applyPromptTemplate(prompt, text);

  const response = await fetch(url, {
    method: 'POST',
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        {
          role: 'user',
          content: systemPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('无效的 API 响应');
  }

  return data.choices[0].message.content.trim();
}

/**
 * 把标题填进提示词模板。
 * 用函数式替换：字符串替换会把标题里的 $& / $' 当成特殊替换模式。
 * 模板里没有 {text} 时把标题追加到末尾，避免模型收到没有内容的指令。
 */
function applyPromptTemplate(template, text) {
  const tpl = template || DEFAULT_AI_PROMPT;
  if (!tpl.includes('{text}')) return `${tpl}\n\n${text}`;
  return tpl.replace('{text}', () => text);
}

/**
 * 显示 AI 测试结果
 */
function showAiTestResult(message, type) {
  elements.aiTestResult.textContent = message;
  elements.aiTestResult.className = 'test-result ' + type;
}

// 初始化
init();
