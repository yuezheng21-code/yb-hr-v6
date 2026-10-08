import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { openFile } from './PersonnelFile.jsx';

const P = '/api/v1/personnel';
const CAT = { safety: '安全', process: '作业流程', quality: '质量', client: '客户要求', onboarding: '入职培训', other: '其他' };
const LANG = { zh: '中文', de: 'Deutsch', en: 'English', pl: 'Polski', tr: 'Türkçe', hu: 'Magyar', vi: 'Tiếng Việt', ar: 'العربية' };
const EMPTY = { title: '', category: 'process', language: 'zh', warehouse_code: '', description: '', content: '', version: '1.0', required: false, is_active: true };

export default function Sop({ token, user }) {
  const showToast = useToast();
  const [list, setList] = useState(null);
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);     // SOP being read
  const [edit, setEdit] = useState(null);     // form object (id for update)
  const [acks, setAcks] = useState(null);
  const canEdit = ['admin', 'hr', 'mgr'].includes(user?.role);

  const load = () => api(`${P}/sop`, { token }).then(setList).catch(e => showToast(e.message, 'err'));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!list) return <Loading />;
  const shown = list.filter(s => (!cat || s.category === cat) && (!q || (s.title + (s.description || '')).toLowerCase().includes(q.toLowerCase())));
  const todo = list.filter(s => s.required && s.is_active && !s.acked).length;

  const ack = async (s) => {
    try { await api(`${P}/sop/${s.id}/ack`, { method: 'POST', token }); showToast('已确认学习'); setOpen(null); load(); }
    catch (e) { showToast(e.message, 'err'); }
  };
  const showAcks = async (s) => {
    try { setAcks({ sop: s, rows: await api(`${P}/sop/${s.id}/acks`, { token }) }); } catch (e) { showToast(e.message, 'err'); }
  };

  return (
    <div className="mz">
      <div className="mz-head">
        <div><div className="mz-title">SOP 学习资料</div>
          <div className="mz-sub">{todo > 0 ? <span style={{ color: 'var(--og)' }}>还有 {todo} 份必学资料未确认</span> : '作业规范、安全须知、客户（Amazon / TEMU）现场要求、装卸柜流程。'}</div></div>
        <div className="mz-actions">
          <input className="mz-input" placeholder="搜索…" value={q} onChange={e => setQ(e.target.value)} style={{ width: 160 }} />
          {canEdit && <button className="mz-btn mz-btn-p" onClick={() => setEdit({ ...EMPTY })}>上传资料</button>}
        </div>
      </div>

      <div className="mz-seg">
        <button className={!cat ? 'on' : ''} onClick={() => setCat('')}>全部<em>{list.length}</em></button>
        {Object.entries(CAT).filter(([k]) => list.some(s => s.category === k)).map(([k, l]) => (
          <button key={k} className={cat === k ? 'on' : ''} onClick={() => setCat(k)}>{l}<em>{list.filter(s => s.category === k).length}</em></button>
        ))}
      </div>

      {shown.length === 0 ? <div className="mz-card"><div className="mz-empty">{canEdit ? '还没有资料，点击「上传资料」添加 PDF、视频或直接写正文。' : '暂无资料'}</div></div> : (
        <div className="mz-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {shown.map(s => (
            <div key={s.id} className="mz-card" style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: s.is_active ? 1 : 0.55 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className="mz-tag">{CAT[s.category] || s.category}</span>
                <span className="mz-tag">{LANG[s.language] || s.language}</span>
                {s.warehouse_code && <span className="mz-tag">{s.warehouse_code}</span>}
                {s.required && <span className="mz-tag" style={{ color: 'var(--og)' }}>必学</span>}
                {!s.is_active && <span className="mz-tag">已停用</span>}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{s.title}</div>
              {s.description && <div className="mz-muted" style={{ lineHeight: 1.5 }}>{s.description}</div>}
              <div className="mz-muted" style={{ marginTop: 'auto' }}>v{s.version} · {String(s.updated_at).slice(0, 10)}{s.file ? ` · ${s.file.filename}` : ''}</div>
              <div className="mz-actions" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: s.acked ? 'var(--gn)' : 'var(--tx3)' }}>{s.acked ? '✓ 已学习' : '未学习'}</span>
                <div className="mz-actions" style={{ gap: 6 }}>
                  {canEdit && <button className="mz-btn mz-btn-s" onClick={() => showAcks(s)}>{s.ack_count} 人已学</button>}
                  {canEdit && <button className="mz-btn mz-btn-s" onClick={() => setEdit({ ...s, warehouse_code: s.warehouse_code || '', description: s.description || '', content: s.content || '' })}>编辑</button>}
                  <button className="mz-btn mz-btn-s mz-btn-p" onClick={() => setOpen(s)}>打开</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="mz-drawer-bg" onClick={e => { if (e.target === e.currentTarget) setOpen(null); }}>
          <div className="mz-drawer" style={{ width: 720 }}>
            <div className="mz-drawer-h">
              <div><div style={{ fontSize: 15, fontWeight: 600 }}>{open.title}</div><div className="mz-muted" style={{ marginTop: 2 }}>{CAT[open.category]} · v{open.version}</div></div>
              <button className="mz-link" style={{ fontSize: 18 }} onClick={() => setOpen(null)}>×</button>
            </div>
            <div className="mz-drawer-b">
              {open.description && <div className="mz-muted">{open.description}</div>}
              {open.file && (
                <button className="mz-btn" style={{ alignSelf: 'flex-start' }} onClick={() => openFile(`${P}/sop/${open.id}/file`, token).catch(e => showToast(e.message, 'err'))}>
                  打开附件：{open.file.filename}
                </button>
              )}
              {open.content && <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 13 }}>{open.content}</div>}
            </div>
            <div className="mz-drawer-f">
              {open.acked ? <span style={{ color: 'var(--gn)', marginRight: 'auto', fontSize: 12 }}>✓ 你已确认学习此版本</span>
                : <span className="mz-muted" style={{ marginRight: 'auto' }}>阅读完毕后请确认，系统会记录学习时间与版本</span>}
              <button className="mz-btn" onClick={() => setOpen(null)}>关闭</button>
              {!open.acked && open.is_active && <button className="mz-btn mz-btn-p" onClick={() => ack(open)}>我已阅读并理解</button>}
            </div>
          </div>
        </div>
      )}

      {edit && <SopEditor init={edit} token={token} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}

      {acks && (
        <div className="mz-drawer-bg" onClick={e => { if (e.target === e.currentTarget) setAcks(null); }}>
          <div className="mz-drawer">
            <div className="mz-drawer-h">
              <div><div style={{ fontSize: 15, fontWeight: 600 }}>学习记录</div><div className="mz-muted" style={{ marginTop: 2 }}>{acks.sop.title} · 当前 v{acks.sop.version}</div></div>
              <button className="mz-link" style={{ fontSize: 18 }} onClick={() => setAcks(null)}>×</button>
            </div>
            <div className="mz-drawer-b" style={{ gap: 0 }}>
              {acks.rows.length === 0 && <div className="mz-empty">还没有人确认</div>}
              {acks.rows.map(a => (
                <div key={a.id} className="mz-row">
                  <div className="mz-grow">{a.display_name}</div>
                  <span className="mz-muted" style={{ color: a.version === acks.sop.version ? undefined : 'var(--og)' }}>v{a.version}{a.version === acks.sop.version ? '' : '（旧版）'}</span>
                  <span className="mz-num mz-muted">{String(a.acked_at).slice(0, 16).replace('T', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SopEditor({ init, token, onClose, onSaved }) {
  const showToast = useToast();
  const [f, setF] = useState(init);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF({ ...f, [k]: v });

  const save = async () => {
    if (!f.title.trim()) { showToast('请填写标题', 'err'); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      ['title', 'category', 'language', 'warehouse_code', 'description', 'content', 'version'].forEach(k => fd.append(k, f[k] ?? ''));
      fd.append('required', f.required ? 'true' : 'false');
      if (f.id) fd.append('is_active', f.is_active ? 'true' : 'false');
      if (file) fd.append('file', file);
      const res = await fetch(f.id ? `${P}/sop/${f.id}` : `${P}/sop`, { method: f.id ? 'PUT' : 'POST', headers: { Authorization: 'Bearer ' + token }, body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || res.statusText);
      showToast('已保存'); onSaved();
    } catch (e) { showToast(e.message, 'err'); }
    setBusy(false);
  };

  return (
    <div className="mz-drawer-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mz-drawer" style={{ width: 560 }}>
        <div className="mz-drawer-h">
          <div style={{ fontSize: 15, fontWeight: 600 }}>{f.id ? '编辑资料' : '上传学习资料'}</div>
          <button className="mz-link" style={{ fontSize: 18 }} onClick={onClose}>×</button>
        </div>
        <div className="mz-drawer-b">
          <div className="mz-field"><label>标题 *</label><input className="mz-input" value={f.title} onChange={e => set('title', e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="mz-field"><label>类别</label><select className="mz-select" value={f.category} onChange={e => set('category', e.target.value)}>
              {Object.entries(CAT).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
            <div className="mz-field"><label>语言</label><select className="mz-select" value={f.language} onChange={e => set('language', e.target.value)}>
              {Object.entries(LANG).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
            <div className="mz-field"><label>适用仓库（留空 = 全部）</label><input className="mz-input" value={f.warehouse_code} onChange={e => set('warehouse_code', e.target.value.toUpperCase())} /></div>
            <div className="mz-field"><label>版本</label><input className="mz-input" value={f.version} onChange={e => set('version', e.target.value)} /></div>
          </div>
          <div className="mz-hint">修改版本号后，所有人需要重新确认学习。</div>
          <div className="mz-field"><label>简介</label><input className="mz-input" value={f.description} onChange={e => set('description', e.target.value)} /></div>
          <div className="mz-field"><label>{f.file ? `附件（已有：${f.file.filename}，选择新文件则替换）` : '附件（PDF / 图片 / Office / 短视频 MP4，单个 ≤ 15 MB）'}</label>
            <input className="mz-input" style={{ height: 'auto', padding: 8 }} type="file" onChange={e => setFile(e.target.files[0] || null)} /></div>
          <div className="mz-field"><label>正文（可选，可直接写步骤）</label>
            <textarea className="mz-input" style={{ height: 200, padding: 10, lineHeight: 1.6 }} value={f.content} onChange={e => set('content', e.target.value)} /></div>
          <label className="mz-switch">必学（员工需确认已学习）<input type="checkbox" checked={!!f.required} onChange={e => set('required', e.target.checked)} /></label>
          {f.id && <label className="mz-switch">启用<input type="checkbox" checked={!!f.is_active} onChange={e => set('is_active', e.target.checked)} /></label>}
        </div>
        <div className="mz-drawer-f">
          <button className="mz-btn" onClick={onClose}>取消</button>
          <button className="mz-btn mz-btn-p" disabled={busy} onClick={save}>{busy ? '保存中…' : '保存'}</button>
        </div>
      </div>
    </div>
  );
}
