import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { Modal } from '../components/Modal.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';

const ABMAHNUNG_TYPES = [
  '旷工（Unentschuldigtes Fehlen）',
  '擅自超时（Eigenmächtige Arbeitszeitverlängerung）',
  '多次迟到（Wiederholte Verspätung）',
  '工时违规（ArbZG Verstoß）',
  '其他违约行为',
];

export default function Referrals({ token, user }) {
  const [abms, setAbms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [revokeModal, setRevokeModal] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [previewModal, setPreviewModal] = useState(null);
  const [emps, setEmps] = useState([]);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    employee_id: '', abmahnung_type: ABMAHNUNG_TYPES[0],
    incident_date: today, issued_date: today,
    incident_description: '', internal_notes: '', delivery_method: '面交',
  });
  const { t } = useLang();
  const showToast = useToast();

  const canEdit = ['admin','hr','mgr'].includes(user?.role);

  const load = () => {
    setLoading(true);
    api('/api/abmahnungen', { token }).then(setAbms).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    api('/api/employees?status=在职', { token }).then(setEmps);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!form.employee_id || !form.incident_description) {
      showToast('请填写员工和违约事实', 'err'); return;
    }
    try {
      await api('/api/abmahnungen', { method:'POST', body:form, token });
      setAddModal(false); load(); showToast('Abmahnung 已发出');
    } catch (e) { showToast(e.message, 'err'); }
  };

  const confirmRevoke = async () => {
    if (!revokeReason.trim()) { showToast(t('abm.revoke_err'), 'err'); return; }
    try {
      await api(`/api/abmahnungen/${revokeModal}/revoke`, { method:'PUT', body:{ reason:revokeReason }, token });
      setRevokeModal(null); load(); showToast('已撤销');
    } catch (e) { showToast(e.message, 'err'); }
  };

  // Kündigung candidates
  const empCounts = {};
  abms.forEach(a => { if (a.status === '有效') empCounts[a.employee_id] = (empCounts[a.employee_id] || 0) + 1; });
  const kandidaten = Object.entries(empCounts)
    .filter(([, c]) => c >= 2)
    .map(([id, c]) => ({ id, name: abms.find(a => a.employee_id === id)?.employee_name || id, count: c }));

  const genLetter = (a) => {
    const emp = emps.find(e => e.id === a.employee_id) || { name: a.employee_name, address: '—' };
    const isOT = a.abmahnung_type?.includes('超时');
    return `<div style="font-family:system-ui,sans-serif;padding:28px;max-width:640px;font-size:12px;line-height:1.8;color:#111">
      <div style="display:flex;justify-content:space-between;border-bottom:2px solid #1B2B4B;padding-bottom:14px;margin-bottom:18px">
        <div><div style="font-size:18px;font-weight:800;color:#1B2B4B">Yuanbo GmbH</div><div style="font-size:9px;color:#666">Personalmanagement · HR-DISZ-001</div></div>
        <div style="text-align:right;font-size:10px;color:#666">${a.issued_date}<br/>Nr.: ${a.id}</div>
      </div>
      <div style="margin-bottom:18px">An:<br/><b>${emp.name}</b><br/>${emp.address || '—'}</div>
      <div style="font-size:15px;font-weight:800;color:#DC2626;margin-bottom:14px;letter-spacing:1px">ABMAHNUNG</div>
      <div style="background:#FEF2F2;border-left:3px solid #DC2626;padding:12px;border-radius:0 6px 6px 0;margin-bottom:14px">
        <b>I. Sachverhaltsdarstellung（事实描述）</b><br/>${a.incident_description}
      </div>
      <div style="margin-bottom:12px"><b>II. Rüge（指责）</b><br/>您的上述行为违反了劳动合同义务（§611a BGB）${isOT ? '及雇主基于§106 GewO发出的工时指令。本次未批准超时 [X]h 不计入 Zeitkonto。' : '。'}</div>
      <div style="margin-bottom:12px"><b>III. Aufforderung zur Verhaltensänderung（改正要求）</b><br/>我方要求您立即停止上述违约行为，严格遵守合同规定。</div>
      <div style="background:#FFF7ED;border:1px solid #FED7AA;padding:12px;border-radius:6px;margin-bottom:14px">
        <b>IV. Warnung（警告）</b><br/>如您再次发生类似违约行为，我方将不再发出额外警告，<b>直接启动劳动合同解除程序（Kündigung des Arbeitsverhältnisses）</b>。
      </div>
      <div style="font-size:10px;color:#666;margin-bottom:24px">V. Hinweis: 您有权将书面反驳意见（Gegendarstellung）附入个人档案（Personalakte）。<br/>有效期2年 · 档案编号：${a.id}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:50px;margin-top:36px">
        <div><div style="border-top:1px solid #aaa;padding-top:6px;font-size:10px;color:#666">渊博 GmbH · ${a.issued_by || 'HR'} · Datum/Unterschrift</div></div>
        <div><div style="border-top:1px solid #aaa;padding-top:6px;font-size:10px;color:#666">${emp.name} · Empfang bestätigt · Datum</div></div>
      </div>
    </div>`;
  };

  return (
    <div>
      {kandidaten.length > 0 && (
        <div className="alert alert-rd">
          ⛔ <b>Kündigung-Eignung:</b>{' '}
          {kandidaten.map(k => `${k.name}（${k.count}次有效Abmahnung）`).join('、')}{' '}
          — 已具备 verhaltensbedingte Kündigung 条件，建议咨询劳动法律顾问
        </div>
      )}
      <div className="alert alert-ac">
        BAG GS 1/84 要求 Abmahnung 须满足：① 具体事实 ② 书面形式 ③ 改正要求 ④ 解职警告 ⑤ 可证明送达 ⑥ 14天内发出
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:10 }}>
        {canEdit && <button className="b bgr" onClick={() => setAddModal(true)}>⚠ 发出 Abmahnung</button>}
      </div>

      {loading ? <Loading /> : (
        <>
          {abms.length === 0 && (
            <div style={{ textAlign:'center', padding:40, color:'var(--tx3)' }}>暂无 Abmahnung 记录</div>
          )}
          <div className="tw"><table>
            <thead><tr>
              <th>档案号</th><th>员工</th><th>类型</th><th>违约日期</th>
              <th>发出日期</th><th>有效至</th><th>发出人</th><th>状态</th><th>次数</th><th>操作</th>
            </tr></thead>
            <tbody>{abms.map(a => (
              <tr key={a.id}>
                <td className="mn tm">{a.id}</td>
                <td className="fw6">{a.employee_name}</td>
                <td style={{ fontSize:9, maxWidth:160 }}>{a.abmahnung_type}</td>
                <td>{a.incident_date}</td>
                <td>{a.issued_date}</td>
                <td style={{ color: a.status==='有效'?'var(--rd)':'var(--tx3)' }}>{a.expiry_date}</td>
                <td>{a.issued_by}</td>
                <td><StatusBadge value={a.status} /></td>
                <td>{a._valid_count > 0 && (
                  <span style={{ color:a._valid_count>=2?'var(--rd)':'var(--og)', fontWeight:700 }}>{a._valid_count}次</span>
                )}</td>
                <td style={{ display:'flex', gap:4 }}>
                  <button className="b bgh" style={{ fontSize:9 }} onClick={() => setPreviewModal(a)}>📄</button>
                  {a.status === '有效' && canEdit && (
                    <button className="b" style={{ fontSize:9,background:'var(--tx3)22',color:'var(--tx3)' }}
                      onClick={() => { setRevokeModal(a.id); setRevokeReason(''); }}>撤销</button>
                  )}
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        </>
      )}

      {addModal && (
        <Modal title="⚠️ 发出 Abmahnung" onClose={() => setAddModal(false)}
          footer={<>
            <button className="b bgh" onClick={() => setAddModal(false)}>取消</button>
            <button className="b bgr" onClick={save}>正式发出</button>
          </>}
        >
          <div className="alert alert-og">须在发现违约后14天内发出。发出前确认事实具体、可证明送达。</div>
          <div className="fr">
            <div className="fg"><label className="fl">员工 *</label>
              <select className="fsl" value={form.employee_id} onChange={e => setForm({...form,employee_id:e.target.value})}>
                <option value="">—选择—</option>
                {emps.map(e => <option key={e.id} value={e.id}>{e.name}（{e.id}）</option>)}
              </select></div>
            <div className="fg"><label className="fl">违规类型 *</label>
              <select className="fsl" value={form.abmahnung_type} onChange={e => setForm({...form,abmahnung_type:e.target.value})}>
                {ABMAHNUNG_TYPES.map(tp => <option key={tp}>{tp}</option>)}
              </select></div>
            <div className="fg"><label className="fl">违约发生日期</label>
              <input className="fi" type="date" value={form.incident_date} onChange={e => setForm({...form,incident_date:e.target.value})} /></div>
            <div className="fg"><label className="fl">Abmahnung发出日期</label>
              <input className="fi" type="date" value={form.issued_date} onChange={e => setForm({...form,issued_date:e.target.value})} /></div>
            <div className="fg"><label className="fl">送达方式</label>
              <select className="fsl" value={form.delivery_method} onChange={e => setForm({...form,delivery_method:e.target.value})}>
                <option>面交（员工签收）</option><option>挂号信（Einschreiben）</option>
              </select></div>
            <div className="fg ful">
              <label className="fl">I. 违约事实描述 * （须具体：日期/时间/行为/我方应对记录）</label>
              <textarea className="fta" rows={4} value={form.incident_description}
                onChange={e => setForm({...form,incident_description:e.target.value})}
                placeholder="例：员工于2026年3月10日（周二）未通知我方，未到UNA仓库工作..." /></div>
            <div className="fg ful"><label className="fl">内部备注（不写入正式Abmahnung）</label>
              <textarea className="fta" value={form.internal_notes} onChange={e => setForm({...form,internal_notes:e.target.value})} /></div>
          </div>
        </Modal>
      )}

      {previewModal && (
        <Modal title={`Abmahnung 预览 — ${previewModal.employee_name}`} onClose={() => setPreviewModal(null)} wide
          footer={<>
            <button className="b bga" onClick={() => window.print()}>⎙ 打印</button>
            <button className="b bgh" onClick={() => setPreviewModal(null)}>关闭</button>
          </>}
        >
          <div dangerouslySetInnerHTML={{ __html: genLetter(previewModal) }}
            style={{ background:'white', borderRadius:8, padding:16 }} />
        </Modal>
      )}

      {revokeModal && (
        <Modal title={t('abm.revoke_title')} onClose={() => setRevokeModal(null)}
          footer={<>
            <button className="b bgh" onClick={() => setRevokeModal(null)}>{t('c.cancel')}</button>
            <button className="b bgr" onClick={confirmRevoke}>{t('abm.revoke_btn')}</button>
          </>}
        >
          <div className="fg">
            <label className="fl">{t('abm.revoke_reason')}</label>
            <textarea className="fta" value={revokeReason}
              onChange={e => setRevokeReason(e.target.value)}
              placeholder={t('abm.revoke_placeholder')} autoFocus />
          </div>
        </Modal>
      )}
    </div>
  );
}
