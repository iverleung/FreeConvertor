// ===== 全局变量 =====
let currentConfig = null;
let currentFormat = 'clash';

// ===== DOM 元素 =====
const elements = {
  inputMethodRadios: document.querySelectorAll('input[name="input-method"]'),
  urlInputGroup: document.getElementById('url-input-group'),
  textInputGroup: document.getElementById('text-input-group'),
  yamlUrl: document.getElementById('yaml-url'),
  yamlText: document.getElementById('yaml-text'),
  formatRadios: document.querySelectorAll('input[name="format"]'),
  convertBtn: document.getElementById('convert-btn'),
  loading: document.getElementById('loading'),
  alertContainer: document.getElementById('alert-container'),
  resultSection: document.getElementById('result-section'),
  resultContent: document.getElementById('result-content'),
  copyBtn: document.getElementById('copy-btn'),
  downloadBtn: document.getElementById('download-btn'),
  subscriptionUrlSection: document.getElementById('subscription-url-section'),
  subscriptionUrl: document.getElementById('subscription-url'),
  copyUrlBtn: document.getElementById('copy-url-btn')
};

// ===== 事件监听 =====
document.addEventListener('DOMContentLoaded', () => {
  // 输入方式切换
  elements.inputMethodRadios.forEach(radio => {
    radio.addEventListener('change', handleInputMethodChange);
  });

  // 格式选择
  elements.formatRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      currentFormat = e.target.value;
    });
  });

  // 转换按钮
  elements.convertBtn.addEventListener('click', handleConvert);

  // 复制和下载按钮
  elements.copyBtn.addEventListener('click', handleCopy);
  elements.downloadBtn.addEventListener('click', handleDownload);
  elements.copyUrlBtn.addEventListener('click', handleCopyUrl);
});

// ===== 输入方式切换 =====
function handleInputMethodChange(e) {
  const method = e.target.value;
  if (method === 'url') {
    elements.urlInputGroup.style.display = 'block';
    elements.textInputGroup.style.display = 'none';
  } else {
    elements.urlInputGroup.style.display = 'none';
    elements.textInputGroup.style.display = 'block';
  }
}

// ===== 转换处理 =====
async function handleConvert() {
  try {
    // 清除之前的提示
    elements.alertContainer.innerHTML = '';
    elements.resultSection.classList.remove('show');

    // 获取输入方式
    const inputMethod = document.querySelector('input[name="input-method"]:checked').value;
    let yamlContent = '';

    // 显示加载状态
    showLoading(true);
    elements.convertBtn.disabled = true;

    if (inputMethod === 'url') {
      const url = elements.yamlUrl.value.trim();
      if (!url) {
        throw new Error('请输入 YAML 配置 URL');
      }

      // 尝试使用后端 API 获取（推荐方式，可以绕过 CORS）
      try {
        yamlContent = await fetchViaBackend(url);
      } catch (backendError) {
        // 如果后端失败，提示用户使用直接粘贴方式
        throw new Error(`无法通过 URL 获取配置。${backendError.message}\n\n💡 建议：请先用浏览器或 wget 下载配置文件，然后选择"直接粘贴"方式。`);
      }
    } else {
      yamlContent = elements.yamlText.value.trim();
      if (!yamlContent) {
        throw new Error('请粘贴 YAML 配置内容');
      }
    }

    // 解析 YAML
    const config = jsyaml.load(yamlContent);
    if (!config || !config.proxies) {
      throw new Error('无效的 YAML 配置：未找到 proxies 字段');
    }

    currentConfig = config;

    // 执行转换
    const result = convertConfig(config, currentFormat);

    // 显示结果
    displayResult(result);

    // 生成订阅 URL（如果是URL输入）
    if (inputMethod === 'url') {
      generateSubscriptionUrl(elements.yamlUrl.value.trim(), currentFormat);
    } else {
      elements.subscriptionUrlSection.style.display = 'none';
    }

    showAlert('success', '✅ 转换成功！');

  } catch (error) {
    console.error('转换错误:', error);
    showAlert('error', `❌ ${error.message}`);
  } finally {
    showLoading(false);
    elements.convertBtn.disabled = false;
  }
}

// ===== 通过后端 API 获取 YAML =====
async function fetchViaBackend(url) {
  try {
    const apiUrl = `/api/fetch-yaml?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    throw error;
  }
}

// ===== 从 URL 获取 YAML (备用方法 - 可能受 CORS 限制) =====
async function fetchYamlFromUrl(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`无法获取配置文件: HTTP ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    throw new Error(`获取配置文件失败: ${error.message}`);
  }
}

// ===== 配置转换 =====
function convertConfig(config, format) {
  switch (format) {
    case 'clash':
      return convertToClash(config);
    case 'v2ray':
      return convertToV2Ray(config);
    case 'shadowrocket':
      return convertToShadowrocket(config);
    default:
      throw new Error('不支持的格式');
  }
}

// ===== Clash 格式转换 =====
function convertToClash(config) {
  // Clash 配置模板
  const clashConfig = {
    port: 7890,
    'socks-port': 7891,
    'allow-lan': false,
    mode: 'Rule',
    'log-level': 'info',
    'external-controller': '127.0.0.1:9090',
    proxies: config.proxies || [],
    'proxy-groups': [
      {
        name: '🚀 节点选择',
        type: 'select',
        proxies: ['♻️ 自动选择', 'DIRECT'].concat((config.proxies || []).map(p => p.name))
      },
      {
        name: '♻️ 自动选择',
        type: 'url-test',
        proxies: (config.proxies || []).map(p => p.name),
        url: 'http://www.gstatic.com/generate_204',
        interval: 300
      }
    ],
    rules: [
      'DOMAIN-SUFFIX,google.com,🚀 节点选择',
      'DOMAIN-KEYWORD,google,🚀 节点选择',
      'DOMAIN,google.com,🚀 节点选择',
      'DOMAIN-SUFFIX,ad.com,REJECT',
      'GEOIP,CN,DIRECT',
      'MATCH,🚀 节点选择'
    ]
  };

  // 合并原配置中的其他字段
  if (config['proxy-groups']) {
    clashConfig['proxy-groups'] = config['proxy-groups'];
  }
  if (config.rules) {
    clashConfig.rules = config.rules;
  }

  return jsyaml.dump(clashConfig, { lineWidth: -1 });
}

// ===== V2Ray 格式转换 =====
function convertToV2Ray(config) {
  const proxies = config.proxies || [];
  const links = [];

  proxies.forEach(proxy => {
    try {
      let link = '';

      if (proxy.type === 'vmess') {
        // VMess 格式
        const vmessConfig = {
          v: '2',
          ps: proxy.name,
          add: proxy.server,
          port: proxy.port.toString(),
          id: proxy.uuid,
          aid: (proxy.alterId || 0).toString(),
          net: proxy.network || 'tcp',
          type: 'none',
          host: proxy.ws?.headers?.Host || '',
          path: proxy.ws?.path || '',
          tls: proxy.tls ? 'tls' : ''
        };
        link = 'vmess://' + btoa(JSON.stringify(vmessConfig));
      } else if (proxy.type === 'ss') {
        // Shadowsocks 格式
        const ssInfo = `${proxy.cipher}:${proxy.password}@${proxy.server}:${proxy.port}`;
        link = 'ss://' + btoa(ssInfo) + '#' + encodeURIComponent(proxy.name);
      } else if (proxy.type === 'ssr') {
        // ShadowsocksR 格式
        const ssrInfo = `${proxy.server}:${proxy.port}:${proxy.protocol}:${proxy.cipher}:${proxy.obfs}:${btoa(proxy.password)}`;
        link = 'ssr://' + btoa(ssrInfo);
      } else if (proxy.type === 'trojan') {
        // Trojan 格式
        link = `trojan://${proxy.password}@${proxy.server}:${proxy.port}?sni=${proxy.sni || ''}&allowInsecure=${proxy.skipCertVerify ? '1' : '0'}#${encodeURIComponent(proxy.name)}`;
      }

      if (link) {
        links.push(link);
      }
    } catch (error) {
      console.error(`转换节点 ${proxy.name} 失败:`, error);
    }
  });

  // Base64 编码
  return btoa(links.join('\n'));
}

// ===== Shadowrocket 格式转换 =====
function convertToShadowrocket(config) {
  // Shadowrocket 使用类似 V2Ray 的订阅格式
  return convertToV2Ray(config);
}

// ===== 显示结果 =====
function displayResult(result) {
  elements.resultContent.textContent = result;
  elements.resultSection.classList.add('show');

  // 滚动到结果区域
  setTimeout(() => {
    elements.resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

// ===== 生成订阅 URL =====
function generateSubscriptionUrl(sourceUrl, format) {
  const baseUrl = window.location.origin;
  const subscriptionUrl = `${baseUrl}/api/convert?source_url=${encodeURIComponent(sourceUrl)}&target_format=${format}`;

  elements.subscriptionUrl.textContent = subscriptionUrl;
  elements.subscriptionUrlSection.style.display = 'block';
}

// ===== 复制到剪贴板 =====
async function handleCopy() {
  try {
    await navigator.clipboard.writeText(elements.resultContent.textContent);
    showAlert('success', '✅ 已复制到剪贴板');
  } catch (error) {
    showAlert('error', '❌ 复制失败，请手动复制');
  }
}

// ===== 复制订阅 URL =====
async function handleCopyUrl() {
  try {
    await navigator.clipboard.writeText(elements.subscriptionUrl.textContent);
    showAlert('success', '✅ 订阅链接已复制到剪贴板');
  } catch (error) {
    showAlert('error', '❌ 复制失败，请手动复制');
  }
}

// ===== 下载配置文件 =====
function handleDownload() {
  const content = elements.resultContent.textContent;
  const format = currentFormat;

  let filename = 'config';
  let mimeType = 'text/plain';

  if (format === 'clash') {
    filename = 'clash_config.yaml';
    mimeType = 'text/yaml';
  } else if (format === 'v2ray' || format === 'shadowrocket') {
    filename = `${format}_subscription.txt`;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showAlert('success', '✅ 文件下载成功');
}

// ===== 显示提示信息 =====
function showAlert(type, message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;

  // 处理多行消息
  const lines = message.split('\n');
  lines.forEach((line, index) => {
    if (index > 0) {
      alertDiv.appendChild(document.createElement('br'));
    }
    alertDiv.appendChild(document.createTextNode(line));
  });

  elements.alertContainer.innerHTML = '';
  elements.alertContainer.appendChild(alertDiv);

  // 5秒后自动消失（错误消息显示更久）
  const timeout = type === 'error' ? 8000 : 3000;
  setTimeout(() => {
    alertDiv.style.transition = 'opacity 0.3s';
    alertDiv.style.opacity = '0';
    setTimeout(() => {
      alertDiv.remove();
    }, 300);
  }, timeout);
}

// ===== 显示/隐藏加载状态 =====
function showLoading(show) {
  if (show) {
    elements.loading.classList.add('show');
  } else {
    elements.loading.classList.remove('show');
  }
}
