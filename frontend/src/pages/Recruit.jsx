import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';
import { Modal } from '../components/Modal.jsx';

const STAGES = ['available', 'contacted', 'interviewing', 'hired', 'rejected'];

const STAGE_LABELS = {
  available:    { zh: '待联系', en: 'Available',    de: 'Verfügbar',    tr: 'Mevcut',     pl: 'Dostępny',       ar: 'متاح',       hu: 'Elérhető',  vi: 'Sẵn sàng' },
  contacted:    { zh: '已联系', en: 'Contacted',    de: 'Kontaktiert',  tr: 'İletişime Geçildi', pl: 'Skontaktowany', ar: 'تم التواصل', hu: 'Megkeresett', vi: 'Đã liên hệ' },
  interviewing: { zh: '面试中', en: 'Interviewing', de: 'Im Gespräch',  tr: 'Mülakatta',  pl: 'W rozmowie',    ar: 'في المقابلة', hu: 'Interjúban', vi: 'Phỏng vấn' },
  hired:        { zh: '已录用', en: 'Hired',        de: 'Eingestellt',  tr: 'İşe Alındı', pl: 'Zatrudniony',   ar: 'تم التوظيف', hu: 'Felvett',    vi: 'Đã tuyển' },
  rejected:     { zh: '已拒绝', en: 'Rejected',     de: 'Abgelehnt',    tr: 'Reddedildi', pl: 'Odrzucony',     ar: 'مرفوض',      hu: 'Elutasított', vi: 'Từ chối' },
};

const STAGE_COLORS = {
  available:    '#10b981',
  contacted:    '#3b82f6',
  interviewing: '#f59e0b',
  hired:        '#8b5cf6',
  rejected:     '#ef4444',
};

function stageLabel(stage, lang) {
  return (STAGE_LABELS[stage] || {})[lang] || (STAGE_LABELS[stage] || {}).en || stage;
}

export default function Recruit({ token, user }) {
  const { t, lang } = useLang();
  const showToast = useToast();
  const [talents, setTalents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState(null);
  const [moveStage, setMoveStage] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  const canEdit = ['admin', 'hr', 'mgr'].includes(user?.role);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api('/api/v1/talent', { token }),
      api('/api/v1/talent/stats', { token }).catch(() => null),
    ]).then(([t, s]) => {
      setTalents(t);
      setStats(s);
    }).catch(() => showToast(t('c.load_fail'), 'err'))
    .finally(() => setLoading(false));
  }, [token, showToast]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const filtered = searchQ
    ? talents.filter(p =>
        p.name?.toLowerCase().includes(searchQ.toLowerCase()) ||
        p.phone?.includes(searchQ) ||
        p.position?.toLowerCase().includes(searchQ.toLowerCase())
      )
    : talents;

  const byStage = STAGES.reduce((acc, s) => {
    acc[s] = filtered.filter(p => p.pool_status === s);
    return acc;
  }, {});

  const openDetail = (person) => {
    setDetailModal(person);
    setMoveStage(person.pool_status || 'available');
  };

  const handleMoveStage = async () => {
    if (!detailModal || !moveStage) return;
    setSaving(true);
    try {
      await api(`/api/v1/talent/${detailModal.id}`, {
        token,
        method: 'PUT',
        body: { pool_status: moveStage },
      });
      showToast(t('c.save') + ' ✓', 'ok');
      setDetailModal(null);
      load();
    } catch {
      showToast(t('c.load_fail'), 'err');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
          🎯 {t('nav.recruit')}
        </h2>
        <input
          type="text"
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder={t('c.search') + '…'}
          style={{
            marginLeft: 'auto', padding: '6px 12px', borderRadius: 6,
            border: '1px solid var(--bd)', background: 'var(--bg2)',
            color: 'var(--tx)', fontSize: 13, width: 200,
          }}
        />
      </div>

      {/* Stats bar */}
      {stats && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {STAGES.map(s => (
            <div key={s} style={{
              background: 'var(--bg2)', border: '1px solid var(--bd)',
              borderRadius: 8, padding: '8px 16px', display: 'flex',
              flexDirection: 'column', alignItems: 'center', minWidth: 90,
            }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: STAGE_COLORS[s] }}>
                {stats.by_status?.[s] || 0}
              </span>
              <span style={{ fontSize: 11, color: 'var(--tx3)' }}>{stageLabel(s, lang)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Kanban columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${STAGES.length}, minmax(160px, 1fr))`,
        gap: 12,
        overflowX: 'auto',
      }}>
        {STAGES.map(stage => (
          <div key={stage} style={{
            background: 'var(--bg2)', border: '1px solid var(--bd)',
            borderRadius: 10, padding: 12, minHeight: 200,
          }}>
            {/* Column header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginBottom: 10, paddingBottom: 8,
              borderBottom: `2px solid ${STAGE_COLORS[stage]}`,
            }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: STAGE_COLORS[stage], display: 'inline-block',
              }} />
              <span style={{ fontWeight: 600, fontSize: 13 }}>{stageLabel(stage, lang)}</span>
              <span style={{
                marginLeft: 'auto', background: STAGE_COLORS[stage] + '22',
                color: STAGE_COLORS[stage], borderRadius: 10,
                padding: '1px 7px', fontSize: 11, fontWeight: 700,
              }}>
                {byStage[stage].length}
              </span>
            </div>

            {/* Cards */}
            {byStage[stage].length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--tx3)', fontSize: 12, marginTop: 20 }}>
                —
              </div>
            ) : (
              byStage[stage].map(person => (
                <div
                  key={person.id}
                  onClick={() => openDetail(person)}
                  style={{
                    background: 'var(--bg)', border: '1px solid var(--bd)',
                    borderRadius: 8, padding: '10px 12px', marginBottom: 8,
                    cursor: canEdit ? 'pointer' : 'default',
                    transition: 'box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { if (canEdit) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{person.name}</div>
                  {person.position && (
                    <div style={{ fontSize: 11, color: 'var(--tx3)' }}>{person.position}</div>
                  )}
                  {person.phone && (
                    <div style={{ fontSize: 11, color: 'var(--tx3)' }}>{person.phone}</div>
                  )}
                  {person.expected_rate != null && (
                    <div style={{ fontSize: 11, color: '#10b981', marginTop: 2 }}>
                      €{Number(person.expected_rate).toFixed(2)}/h
                    </div>
                  )}
                  {person.nationality && (
                    <div style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 2 }}>{person.nationality}</div>
                  )}
                </div>
              ))
            )}
          </div>
        ))}
      </div>

      {/* Detail / Stage move modal */}
      {detailModal && (
        <Modal title={detailModal.name} onClose={() => setDetailModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 280 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
              {detailModal.phone && (
                <><span style={{ color: 'var(--tx3)' }}>{t('c.phone')}:</span><span>{detailModal.phone}</span></>
              )}
              {detailModal.nationality && (
                <><span style={{ color: 'var(--tx3)' }}>🌍</span><span>{detailModal.nationality}</span></>
              )}
              {detailModal.position && (
                <><span style={{ color: 'var(--tx3)' }}>💼</span><span>{detailModal.position}</span></>
              )}
              {detailModal.expected_rate != null && (
                <><span style={{ color: 'var(--tx3)' }}>€/h:</span>
                <span style={{ color: '#10b981' }}>{Number(detailModal.expected_rate).toFixed(2)}</span></>
              )}
              {detailModal.languages && (
                <><span style={{ color: 'var(--tx3)' }}>🗣️</span><span>{detailModal.languages}</span></>
              )}
              {detailModal.skills && (
                <><span style={{ color: 'var(--tx3)' }}>🔧</span><span>{detailModal.skills}</span></>
              )}
            </div>
            {detailModal.notes && (
              <div style={{ fontSize: 12, color: 'var(--tx3)', borderTop: '1px solid var(--bd)', paddingTop: 8 }}>
                {detailModal.notes}
              </div>
            )}
            {canEdit && (
              <>
                <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 10 }}>
                  <label style={{ fontSize: 12, color: 'var(--tx3)', display: 'block', marginBottom: 4 }}>
                    {t('c.status')}
                  </label>
                  <select
                    value={moveStage}
                    onChange={e => setMoveStage(e.target.value)}
                    style={{
                      width: '100%', padding: '6px 8px', borderRadius: 6,
                      border: '1px solid var(--bd)', background: 'var(--bg2)',
                      color: 'var(--tx)', fontSize: 13,
                    }}
                  >
                    {STAGES.map(s => (
                      <option key={s} value={s}>{stageLabel(s, lang)}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setDetailModal(null)}
                    style={{
                      padding: '6px 14px', borderRadius: 6, border: '1px solid var(--bd)',
                      background: 'var(--bg2)', color: 'var(--tx)', cursor: 'pointer', fontSize: 13,
                    }}
                  >
                    {t('c.cancel')}
                  </button>
                  <button
                    onClick={handleMoveStage}
                    disabled={saving}
                    style={{
                      padding: '6px 14px', borderRadius: 6, border: 'none',
                      background: '#4f6ef7', color: '#fff', cursor: 'pointer', fontSize: 13,
                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    {saving ? t('c.loading') : t('c.save')}
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
