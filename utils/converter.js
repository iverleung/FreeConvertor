const yaml = require('js-yaml');

/**
 * 将配置转换为 Clash 格式
 */
function convertToClash(config) {
    // Clash 配置模板
    const clashConfig = {
        port: 7890,
        'socks-port': 7891,
        'allow-lan': false,
        mode: 'Rule',
        'log-level': 'debug',
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

    return yaml.dump(clashConfig, { lineWidth: -1 });
}

/**
 * 将配置转换为 V2Ray 订阅格式 (Base64)
 */
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
                    host: (proxy.ws && proxy.ws.headers && proxy.ws.headers.Host) || '',
                    path: (proxy.ws && proxy.ws.path) || '',
                    tls: proxy.tls ? 'tls' : ''
                };
                link = 'vmess://' + Buffer.from(JSON.stringify(vmessConfig)).toString('base64');
            } else if (proxy.type === 'ss') {
                // Shadowsocks 格式
                const ssInfo = `${proxy.cipher}:${proxy.password}@${proxy.server}:${proxy.port}`;
                link = 'ss://' + Buffer.from(ssInfo).toString('base64') + '#' + encodeURIComponent(proxy.name);
            } else if (proxy.type === 'ssr') {
                // ShadowsocksR 格式
                const password64 = Buffer.from(proxy.password).toString('base64');
                const ssrInfo = `${proxy.server}:${proxy.port}:${proxy.protocol || 'origin'}:${proxy.cipher}:${proxy.obfs || 'plain'}:${password64}`;
                const ssrParams = [];

                if (proxy['obfs-param']) {
                    ssrParams.push(`obfsparam=${Buffer.from(proxy['obfs-param']).toString('base64')}`);
                }
                if (proxy['protocol-param']) {
                    ssrParams.push(`protoparam=${Buffer.from(proxy['protocol-param']).toString('base64')}`);
                }
                ssrParams.push(`remarks=${Buffer.from(proxy.name).toString('base64')}`);

                const ssrLink = ssrParams.length > 0 ? `${ssrInfo}/?${ssrParams.join('&')}` : ssrInfo;
                link = 'ssr://' + Buffer.from(ssrLink).toString('base64');
            } else if (proxy.type === 'trojan') {
                // Trojan 格式
                const sni = proxy.sni || proxy.server;
                const skipCertVerify = proxy['skip-cert-verify'] ? '1' : '0';
                link = `trojan://${proxy.password}@${proxy.server}:${proxy.port}?sni=${sni}&allowInsecure=${skipCertVerify}#${encodeURIComponent(proxy.name)}`;
            } else if (proxy.type === 'vless') {
                // Vless 格式
                const params = new URLSearchParams();
                params.append('encryption', proxy.encryption || 'none');
                if (proxy.network) params.append('type', proxy.network);
                if (proxy.tls) params.append('security', 'tls');
                if (proxy.sni) params.append('sni', proxy.sni);

                link = `vless://${proxy.uuid}@${proxy.server}:${proxy.port}?${params.toString()}#${encodeURIComponent(proxy.name)}`;
            }

            if (link) {
                links.push(link);
            }
        } catch (error) {
            console.error(`转换节点 ${proxy.name} 失败:`, error);
        }
    });

    // Base64 编码
    return Buffer.from(links.join('\n')).toString('base64');
}

/**
 * 将配置转换为 Shadowrocket 格式
 */
function convertToShadowrocket(config) {
    // Shadowrocket 使用类似 V2Ray 的订阅格式
    return convertToV2Ray(config);
}

/**
 * 主转换函数
 */
function convertConfig(config, targetFormat) {
    switch (targetFormat) {
        case 'clash':
            return convertToClash(config);
        case 'v2ray':
            return convertToV2Ray(config);
        case 'shadowrocket':
            return convertToShadowrocket(config);
        default:
            throw new Error(`不支持的格式: ${targetFormat}`);
    }
}

/**
 * 解析 YAML 配置
 */
function parseYaml(yamlContent) {
    try {
        const config = yaml.load(yamlContent);
        if (!config || !config.proxies) {
            throw new Error('无效的 YAML 配置：未找到 proxies 字段');
        }
        return config;
    } catch (error) {
        throw new Error(`YAML 解析失败: ${error.message}`);
    }
}

module.exports = {
    convertConfig,
    parseYaml,
    convertToClash,
    convertToV2Ray,
    convertToShadowrocket
};
