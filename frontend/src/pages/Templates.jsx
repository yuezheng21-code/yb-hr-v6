import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { GenerateDrawer } from './PersonnelFile.jsx';

const P = '/api/v1/personnel';
const CAT = { contract: '劳动合同', amendment: '补充协议', warning: '警告 Abmahnung', termination: '解约', certificate: '证明', other: '其他' };
const EMPTY = { code: '', name: '', category: 'contract', language: 'de', description: '', body: '# Titel\n\n{{employee.name}}\n', is_active: true };

export default function Templates({ token, user }) {
  const showToast = useToast();
  const [list, setList] = useState(null);
  const [meta, setMeta] = useState(null);
  const [sel, setSel] = useState(null);       // template id or 'new'
  const [f, setF] = useState(EMPTY);
  const [dirty, setDirty] = useState(false);
  const [emps, setEmps] = useState([]);
  const [empId, setEmpId] = useState('');
  const [gen, setGen] = useState(false);
  const ta = useRef(null);

  const load = (pick) => api(`${P}/templates`, { token }).then(ts => {
    setList(ts);
    const t = ts.find(x => x.id === pick) || (sel === 'new' ? null : ts.find(x => x.id === sel)) || ts[0];
    if (t) { setSel(t.id); setF(t); setDirty(false); }
  }).catch(e => showToast(e.message, 'err'));

  useEffect(() => {
    load();
    api(`${P}/meta`, { token }).then(setMeta).catch(() => {});
    api('/api/v1/employees?status=active&limit=1000', { token }).then(setEmps).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!['admin', 'hr'].includes(user?.role)) return <div className="mz-empty">仅 HR / 管理员可管理文书模板</div>;
  if (!list) return <Loading />;

  const pick = (t) => {
    if (dirty && !window.confirm('有未保存的修改，确定切换？')) return;
    if (t === 'new') { setSel('new'); setF(EMPTY); } else { setSel(t.id); setF(t); }
    setDirty(false);
  };
  const set = (k, v) => { setF({ ...f, [k]: v }); setDirty(true); };
  const insert = (text) => {
    const el = ta.current;
    const pos = el ? el.selectionStart : f.body.length;
    const body = f.body.slice(0, pos) + text + f.body.slice(el ? el.selectionEnd : pos);
    set('body', body);
    setTimeout(() => { if (el) { el.focus(); el.selectionStart = el.selectionEnd = pos + text.length; } }, 0);
  };
  const save = async () => {
    try {
      const body = { name: f.name, category: f.category, language: f.language, description: f.description, body: f.body, is_active: f.is_active };
      const r = sel === 'new'
        ? await api(`${P}/templates`, { method: 'POST', body: { ...body, code: f.code }, token })
        : await api(`${P}/templates/${sel}`, { method: 'PUT', body, token });
      showToast(sel === 'new' ? '模板已创建' : `已保存（v${r.version}）`);
      load(r.id);
    } catch (e) { showToast(e.message, 'err'); }
  };

  const emp = emps.find(x => x.id === Number(empId));
  const manual = [...new Set([...(f.body || '').matchAll(/\{\{\s*([\w.]+)\s*(?:\|([^}]*))?\}\}/g)]
    .filter(m => !meta?.auto_fields?.[m[1]]).map(m => m[2] ? `${m[1]}（${m[2].trim()}）` : m[1]))];

  return (
    <div className="mz">
      <div className="mz-head">
        <div><div className="mz-title">文书模板</div>
          <div className="mz-sub">劳动合同、补充协议、Abmahnung、解约通知、工作证明。HR 选员工即可自动填入档案信息，只需补填少量字段。</div></div>
        <div className="mz-actions"><button className="mz-btn mz-btn-p" onClick={() => pick('new')}>新建模板</button></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 260px) minmax(0, 1fr)', gap: 16, alignItems: 'start' }} className="tpl-grid">
        <div className="mz-card" style={{ padding: 8 }}>
          {list.map(t => (
            <button key={t.id} onClick={() => pick(t)} className="mz-row"
              style={{ width: '100%', textAlign: 'left', background: sel === t.id ? 'var(--bg3)' : 'transparent', border: 'none', borderRadius: 6, padding: '10px 10px', cursor: 'pointer', color: 'var(--tx)', opacity: t.is_active ? 1 : 0.5 }}>
              <div className="mz-grow">
                <div style={{ fontSize: 13 }}>{t.name}</div>
                <div className="mz-muted">{CAT[t.category] || t.category} · {t.code} · v{t.version}{t.is_active ? '' : ' · 停用'}</div>
              </div>
            </button>
          ))}
          {sel === 'new' && <div className="mz-row" style={{ padding: 10, background: 'var(--bg3)', borderRadius: 6 }}>（新模板）</div>}
        </div>

        <div className="mz-card">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            <div className="mz-field"><label>代码（唯一，创建后不可改）</label>
              <input className="mz-input" value={f.code} disabled={sel !== 'new'} placeholder="z.B. ABMAHNUNG_2" onChange={e => set('code', e.target.value.toUpperCase())} /></div>
            <div className="mz-field" style={{ gridColumn: 'span 2' }}><label>名称</label>
              <input className="mz-input" value={f.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="mz-field"><label>类别（生成的文件归档到此类）</label>
              <select className="mz-select" value={f.category} onChange={e => set('category', e.target.value)}>
                {Object.entries(CAT).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
            <div className="mz-field"><label>语言</label>
              <select className="mz-select" value={f.language} onChange={e => set('language', e.target.value)}>
                {['de', 'en', 'zh', 'pl', 'tr', 'hu', 'vi', 'ar'].map(l => <option key={l}>{l}</option>)}</select></div>
          </div>
          <div className="mz-field" style={{ marginTop: 12 }}><label>说明</label>
            <input className="mz-input" value={f.description || ''} onChange={e => set('description', e.target.value)} /></div>

          <div className="mz-field" style={{ marginTop: 12 }}>
            <label>正文 — <code># 标题</code>　<code>## 小标题</code>　<code>**加粗**</code>　<code>---</code> 分页　<code>{'{{占位符}}'}</code> 自动填充　<code>{'{{key|标签}}'}</code> 由 HR 填写</label>
            <textarea ref={ta} className="mz-input" spellCheck={false} value={f.body} onChange={e => set('body', e.target.value)}
              style={{ height: 420, padding: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, lineHeight: 1.6 }} />
          </div>
          {meta?.auto_fields && (
            <div style={{ marginTop: 8 }}>
              <div className="mz-hint" style={{ marginBottom: 6 }}>点击插入自动字段：</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(meta.auto_fields).map(([k, l]) => (
                  <button key={k} className="mz-btn mz-btn-s" title={k} onClick={() => insert(`{{${k}}}`)}>{l}</button>
                ))}
                <button className="mz-btn mz-btn-s" onClick={() => insert('{{feld|Bezeichnung}}')}>+ 手填字段</button>
              </div>
            </div>
          )}
          {manual.length > 0 && <div className="mz-hint" style={{ marginTop: 10 }}>生成时需 HR 填写：{manual.join('、')}</div>}

          <div className="mz-actions" style={{ marginTop: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <label className="mz-switch" style={{ gap: 8 }}>启用<input type="checkbox" checked={!!f.is_active} onChange={e => set('is_active', e.target.checked)} /></label>
            <div className="mz-actions">
              {sel !== 'new' && <>
                <select className="mz-select" value={empId} onChange={e => setEmpId(e.target.value)} style={{ minWidth: 180 }}>
                  <option value="">选择员工生成…</option>
                  {emps.map(x => <option key={x.id} value={x.id}>{x.name} · {x.emp_no}</option>)}
                </select>
                <button className="mz-btn" disabled={!empId || dirty || !f.is_active} title={dirty ? '请先保存模板' : ''} onClick={() => setGen(true)}>为员工生成</button>
              </>}
              <button className="mz-btn mz-btn-p" disabled={!dirty} onClick={save}>{sel === 'new' ? '创建' : '保存'}</button>
            </div>
          </div>
          <div className="mz-hint" style={{ marginTop: 10 }}>修改正文后版本号自动 +1，已生成的文书记录生成时的模板版本。内置模板为德国劳动法通用示例（Muster），正式使用前请由劳动法律师审核。</div>
        </div>
      </div>

      {gen && emp && <GenerateDrawer init={{ templateCode: f.code }} emp={emp} templates={list} token={token}
        onClose={() => setGen(false)} onSaved={() => setGen(false)} />}
    </div>
  );
}
