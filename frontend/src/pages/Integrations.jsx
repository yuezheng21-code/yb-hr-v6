import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { Modal } from '../components/Modal.jsx';

const STATUS_COLORS = { ok: '#10b981', fail: '#f0526c', null: '#94a3b8' };
const STATUS_LABELS = { ok: '连接成功', fail: '连接失败', null: '未测试' };

const FIELD_DOCS = {
  wechat_work: {
    steps: [
      '1. 打开企业微信，进入需要发送通知的群聊',
      '2. 点击群名称 → 群机器人 → 添加机器人',
      '3. 命名机器人 (如 "HR系统通知")，复制 Webhook URL',
      '4. 将 URL 粘贴到下方，保存并测试连接',
    ],
  },
  whatsapp: {
    steps: [
      '1. 访问 Meta Developers (developers.facebook.com) 并创建应用',
      '2. 添加 WhatsApp 产品，完成业务验证',
      '3. 在 WhatsApp → API Setup 获取 Phone Number ID 和永久 Access Token',
      '4. 填写测试接收号码 (E.164 格式: +4917612345678)',
    ],
  },
  wps: {
    steps: [
      '1. 访问 WPS 开放平台 (open.wps.cn) 注册开发者账号',
      '2. 创建应用，获取 App ID 和 App Secret',
      '3. 申请所需 API 权限 (文档通知等)',
      '4. 填写凭据后测试连接',
    ],
  },
  tencent_docs: {
    steps: [
      '1. 访问腾讯文档开放平台 (docs.qq.com/openapi) 注册应用',
      '2. 获取 App ID 和 App Secret',
      '3. 通过 OAuth2 授权流程获取 Access Token',
      '4. 填写凭据后测试连接',
    ],
  },
  feishu: {
    steps: [
      '1. 打开飞书，进入需要接收通知的群聊',
      '2. 点击群名称 → 群机器人 → 添加机器人 → 自定义机器人',
      '3. 命名机器人，可选配置签名验证，复制 Webhook URL',
      '4. 将 URL 粘贴到下方，保存并测试连接',
    ],
  },
  google_docs: {
    steps: [
      '1. 在 Google Cloud Console 创建项目，启用 Google Docs API 和 Google Drive API',
      '2. 创建服务账号 (IAM & Admin → Service Accounts)',
      '3. 为服务账号创建 JSON 密钥，下载密钥文件',
      '4. 将 JSON 密钥文件内容粘贴到下方的 Service Account JSON 字段',
      '5. 在 Google Drive 中共享目标文件夹给服务账号邮箱',
    ],
  },
  office365: {
    steps: [
      '1. 在 Azure Portal (portal.azure.com) → Azure Active Directory → App registrations 注册应用',
      '2. 复制 Application (Client) ID 和 Tenant ID',
      '3. 创建 Client Secret (Certificates & secrets)',
      '4. 授予 Microsoft Graph API 权限 (ChannelMessage.Send, Sites.ReadWrite.All 等)',
      '5. 填写 Team ID 和 Channel ID (可从 Teams 链接中获取)',
    ],
  },
};

export default function Integrations({ token, user }) {
  const [catalogue, setCatalogue] = useState([]);
  const [configs, setConfigs] = useState({});   // platform → config dict
  const [loading, setLoading] = useState(true);
  const [selPlatform, setSelPlatform] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [testing, setTesting] = useState(null);
  const [sending, setSending] = useState(null);
  const [sendText, setSendText] = useState('');
  const [sendModal, setSendModal] = useState(null);
  const showToast = useToast();
  const isAdmin = user?.role === 'admin';

  // Hooks MUST be called before any conditional return (React Rules of Hooks).
  const load = useCallback(() => {
    if (!isAdmin) return;
    setLoading(true);
    Promise.all([
      api('/api/v1/integrations/catalogue', { token }),
      api('/api/v1/integrations', { token }),
    ]).then(([cat, cfgs]) => {
      setCatalogue(cat);
      const map = {};
      cfgs.forEach(c => { map[c.platform] = c; });
      setConfigs(map);
    }).catch(e => {
      showToast(e.message, 'err');
    }).finally(() => setLoading(false));
  }, [token, isAdmin, showToast]);

  useEffect(() => { load(); }, [load]);

  if (!isAdmin) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--tx3)' }}>⛔ 仅管理员可访问</div>;
  }

  const catMap = Object.fromEntries(catalogue.map(c => [c.platform, c]));

  const openEdit = (platform) => {
    const cfg = configs[platform] || {};
    const cat = catMap[platform] || {};
    // Build form with current values
    const form = {
      enabled: cfg.enabled || false,
      webhook_url: cfg.webhook_url || '',
      access_token: cfg.access_token || '',
      app_id: cfg.app_id || '',
      app_secret: cfg.app_secret || '',
      extra_config: { ...(cfg.extra_config || {}) },
    };
    setEditForm(form);
    setSelPlatform(platform);
  };

  const saveConfig = async () => {
    try {
      const saved = await api(`/api/v1/integrations/${selPlatform}`, {
        method: 'PUT', body: editForm, token,
      });
      setConfigs(prev => ({ ...prev, [selPlatform]: saved }));
      showToast('配置已保存');
      setSelPlatform(null);
    } catch (e) { showToast(e.message, 'err'); }
  };

  const testConnection = async (platform) => {
    const cfg = configs[platform];
    if (!cfg?.enabled) { showToast('请先启用并保存配置', 'warn'); return; }
    setTesting(platform);
    try {
      const res = await api(`/api/v1/integrations/${platform}/test`, { method: 'POST', token });
      showToast(`✅ ${cfg.label || platform} 连接成功`);
      setConfigs(prev => ({
        ...prev,
        [platform]: { ...prev[platform], last_test_status: 'ok', last_tested_at: new Date().toISOString() },
      }));
    } catch (e) {
      showToast(`❌ ${e.message}`, 'err');
      setConfigs(prev => ({
        ...prev,
        [platform]: { ...prev[platform], last_test_status: 'fail', last_tested_at: new Date().toISOString() },
      }));
    } finally { setTesting(null); }
  };

  const sendMessage = async () => {
    if (!sendText) { showToast('消息内容不能为空', 'err'); return; }
    setSending(sendModal);
    try {
      await api(`/api/v1/integrations/${sendModal}/send`, {
        method: 'POST', body: { text: sendText }, token,
      });
      showToast('消息已发送'); setSendModal(null); setSendText('');
    } catch (e) { showToast(e.message, 'err'); }
    finally { setSending(null); }
  };

  const toggleEnabled = async (platform, val) => {
    try {
      const saved = await api(`/api/v1/integrations/${platform}`, {
        method: 'PUT', body: { enabled: val }, token,
      });
      setConfigs(prev => ({ ...prev, [platform]: saved }));
      showToast(val ? '已启用' : '已禁用');
    } catch (e) { showToast(e.message, 'err'); }
  };

  if (loading) return <Loading />;

  const cat = selPlatform ? (catMap[selPlatform] || {}) : null;
  const docs = selPlatform ? (FIELD_DOCS[selPlatform] || {}) : null;

  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--tx3)' }}>
        在此配置与外部平台的集成。所有密钥保存后均以加密形式存储，界面显示 ***。
      </div>

      {/* Platform cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {catalogue.map(p => {
          const cfg = configs[p.platform] || {};
          const status = cfg.last_test_status;
          const isEnabled = cfg.enabled;
          const isTesting = testing === p.platform;
          return (
            <div key={p.platform} style={{
              background: 'var(--bg2)',
              border: `1px solid ${isEnabled ? 'var(--ac)' : 'var(--bd)'}`,
              borderRadius: 'var(--R2)', padding: 16,
              position: 'relative',
              opacity: isEnabled ? 1 : 0.75,
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 24 }}>{p.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 1 }}>{p.platform}</div>
                  </div>
                </div>
                {/* Enable toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11 }}>
                  <div
                    onClick={() => toggleEnabled(p.platform, !isEnabled)}
                    style={{
                      width: 34, height: 18, borderRadius: 9, cursor: 'pointer',
                      background: isEnabled ? 'var(--ac)' : '#cbd5e1',
                      position: 'relative', transition: 'background 0.2s',
                    }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: 7, background: '#fff',
                      position: 'absolute', top: 2, transition: 'left 0.2s',
                      left: isEnabled ? 18 : 2,
                    }} />
                  </div>
                  {isEnabled ? '已启用' : '已禁用'}
                </label>
              </div>

              <div style={{ fontSize: 11, color: 'var(--tx2)', marginBottom: 10, lineHeight: 1.5 }}>
                {p.description}
              </div>

              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: STATUS_COLORS[status] || STATUS_COLORS['null'],
                  display: 'inline-block',
                }} />
                <span style={{ fontSize: 10, color: STATUS_COLORS[status] || STATUS_COLORS['null'] }}>
                  {STATUS_LABELS[status] || STATUS_LABELS['null']}
                </span>
                {cfg.last_tested_at && (
                  <span style={{ fontSize: 9, color: 'var(--tx3)', marginLeft: 4 }}>
                    {cfg.last_tested_at.slice(0, 16)}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button className="b bgs" style={{ fontSize: 11 }} onClick={() => openEdit(p.platform)}>
                  ⚙ 配置
                </button>
                {isEnabled && (
                  <button className="b bga" style={{ fontSize: 11 }}
                    onClick={() => testConnection(p.platform)}
                    disabled={isTesting}>
                    {isTesting ? '测试中…' : '🔌 测试连接'}
                  </button>
                )}
                {isEnabled && cfg.last_test_status === 'ok' && (
                  <button className="b" style={{
                    fontSize: 11, background: '#10b98120', color: '#10b981',
                    border: '1px solid #10b981',
                  }} onClick={() => { setSendModal(p.platform); setSendText(''); }}>
                    ✉ 发送消息
                  </button>
                )}
                {p.doc_url && (
                  <a href={p.doc_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 10, color: 'var(--ac)', alignSelf: 'center', marginLeft: 'auto' }}>
                    📖 文档
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Config modal */}
      {selPlatform && cat && (
        <Modal title={`配置 ${cat.icon} ${cat.label}`} onClose={() => setSelPlatform(null)} wide>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Left: fields */}
            <div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={editForm.enabled}
                    onChange={e => setEditForm({ ...editForm, enabled: e.target.checked })} />
                  启用此集成
                </label>
              </div>

              {/* Standard fields from catalogue */}
              {(cat.fields || []).map(f => (
                <div key={f.key} style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, color: 'var(--tx3)' }}>{f.label}</label>
                  <FieldInput
                    field={f}
                    value={editForm[f.key] ?? ''}
                    onChange={v => setEditForm({ ...editForm, [f.key]: v })}
                  />
                  {f.hint && <div style={{ fontSize: 9, color: 'var(--tx3)', marginTop: 2 }}>{f.hint}</div>}
                </div>
              ))}

              {/* Extra fields */}
              {(cat.extra_fields || []).length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx2)', marginBottom: 6, marginTop: 4, borderTop: '1px solid var(--bd)', paddingTop: 8 }}>
                    额外配置
                  </div>
                  {cat.extra_fields.map(f => (
                    <div key={f.key} style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 11, color: 'var(--tx3)' }}>{f.label}</label>
                      <FieldInput
                        field={f}
                        value={editForm.extra_config?.[f.key] ?? ''}
                        onChange={v => setEditForm({
                          ...editForm,
                          extra_config: { ...editForm.extra_config, [f.key]: v },
                        })}
                      />
                      {f.hint && <div style={{ fontSize: 9, color: 'var(--tx3)', marginTop: 2 }}>{f.hint}</div>}
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Right: setup guide */}
            <div style={{ background: 'var(--bg)', borderRadius: 'var(--R2)', padding: 14 }}>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, color: 'var(--tx2)' }}>📋 配置指南</div>
              {(docs?.steps || []).map((s, i) => (
                <div key={i} style={{ fontSize: 11, lineHeight: 1.7, color: 'var(--tx2)', marginBottom: 4 }}>
                  {s}
                </div>
              ))}
              {cat.doc_url && (
                <a href={cat.doc_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: 'var(--ac)', display: 'block', marginTop: 10 }}>
                  🔗 查看官方文档
                </a>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
            <button className="b bgs" onClick={() => setSelPlatform(null)}>取消</button>
            <button className="b bga" onClick={saveConfig}>保存配置</button>
          </div>
        </Modal>
      )}

      {/* Send message modal */}
      {sendModal && (
        <Modal title={`发送消息 — ${catMap[sendModal]?.label}`} onClose={() => setSendModal(null)}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--tx3)' }}>消息内容</label>
            <textarea className="inp" rows={4} value={sendText}
              onChange={e => setSendText(e.target.value)} placeholder="输入消息内容…" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
            <button className="b bgs" onClick={() => setSendModal(null)}>取消</button>
            <button className="b bga" onClick={sendMessage} disabled={!!sending}>
              {sending ? '发送中…' : '发送'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function FieldInput({ field, value, onChange }) {
  const style = { width: '100%' };
  if (field.type === 'textarea') {
    return (
      <textarea className="inp" rows={5} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.hint || ''}
        style={{ ...style, fontFamily: 'monospace', fontSize: 10 }}
      />
    );
  }
  if (field.type === 'password') {
    return (
      <input className="inp" type="password" value={value}
        onChange={e => onChange(e.target.value)} style={style} />
    );
  }
  return (
    <input className="inp" type={field.type === 'url' ? 'url' : 'text'} value={value}
      onChange={e => onChange(e.target.value)} style={style} />
  );
}
