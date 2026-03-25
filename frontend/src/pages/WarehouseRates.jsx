import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { Loading } from '../components/Spinner.jsx';

export default function WarehouseRates({ token }) {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selWH, setSelWH] = useState(null);
  const [rates, setRates] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const { t } = useLang();

  useEffect(() => {
    api('/api/warehouses', { token }).then(whs => {
      setWarehouses(whs);
    }).finally(() => setLoading(false));
  }, [token]);

  const selectWH = async (code) => {
    setSelWH(code);
    setEditing(false);
    const r = await api(`/api/warehouses/${code}/rates`, { token }).catch(() => null);
    setRates(r);
    setForm(r || {});
  };

  const saveRates = async () => {
    await api(`/api/warehouses/${selWH}`, { method:'PUT', body:form, token });
    setEditing(false);
    const r = await api(`/api/warehouses/${selWH}/rates`, { token }).catch(() => null);
    setRates(r);
  };

  if (loading) return <Loading />;

  return (
    <div style={{ display:'flex', gap:12 }}>
      {/* WH list */}
      <div style={{ width:200, flexShrink:0 }}>
        <div style={{ fontSize:10,color:'var(--tx3)',marginBottom:8 }}>{t('wh.select')}</div>
        {warehouses.map(wh => (
          <div key={wh.code}
            onClick={() => selectWH(wh.code)}
            style={{
              padding:'10px 12px', borderRadius:'var(--R2)', cursor:'pointer', marginBottom:4,
              border: `1px solid ${selWH===wh.code?'var(--ac)':'var(--bd)'}`,
              background: selWH===wh.code?'var(--ac)10':'var(--bg2)',
            }}
          >
            <div style={{ fontWeight:600, fontSize:12 }}>{wh.code}</div>
            <div style={{ fontSize:10,color:'var(--tx3)' }}>{wh.name}</div>
          </div>
        ))}
      </div>

      {/* Rates panel */}
      <div style={{ flex:1 }}>
        {selWH && rates && (
          <div className="cd">
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:12 }}>
              <div className="ct-t">🏭 {selWH} — 价格配置</div>
              {!editing
                ? <button className="b bgh" onClick={() => setEditing(true)}>{t('wh.edit')}</button>
                : <div style={{ display:'flex',gap:6 }}>
                    <button className="b bgh" onClick={() => setEditing(false)}>{t('c.cancel')}</button>
                    <button className="b bga" onClick={saveRates}>{t('wh.f_save')}</button>
                  </div>
              }
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              {Object.entries(editing ? form : rates)
                .filter(([k]) => !['warehouse_code','name','id'].includes(k))
                .map(([key, val]) => (
                  <div key={key} className="fg">
                    <label className="fl">{key.replace(/_/g,' ')}</label>
                    {editing
                      ? <input className="fi" type="number" step="0.01" value={form[key]||0}
                          onChange={e => setForm({...form,[key]:+e.target.value})} />
                      : <div style={{ fontFamily:'monospace',color:'var(--gn)',fontWeight:600 }}>€{val}</div>
                    }
                  </div>
                ))}
            </div>
          </div>
        )}
        {selWH && !rates && (
          <div style={{ textAlign:'center',padding:40,color:'var(--tx3)' }}>该仓库暂无价格配置</div>
        )}
        {!selWH && (
          <div style={{ textAlign:'center',padding:40,color:'var(--tx3)' }}>{t('wh.select')}</div>
        )}
      </div>
    </div>
  );
}
