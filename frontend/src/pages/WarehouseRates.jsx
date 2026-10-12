import { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { Loading } from '../components/Spinner.jsx';

const RATE_FIELDS = [
  ['rate_hourly', '时薪'],
  ['rate_load_20gp', '装柜 20GP'],
  ['rate_unload_20gp', '卸柜 20GP'],
  ['rate_load_40gp', '装柜 40GP'],
  ['rate_unload_40gp', '卸柜 40GP'],
  ['rate_45hc', '45HC'],
];

export default function WarehouseRates({ token, user }) {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selWH, setSelWH] = useState(null);
  const [rates, setRates] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const { t } = useLang();
  const canEdit = user?.role === 'admin';

  useEffect(() => {
    api('/api/v1/warehouses', { token }).then(whs => {
      setWarehouses(whs);
    }).finally(() => setLoading(false));
  }, [token]);

  const selectWH = async (code) => {
    setSelWH(code);
    setEditing(false);
    // V7 does not have a separate /rates endpoint — fetch warehouse details directly
    const r = await api(`/api/v1/warehouses/${code}`, { token }).catch(() => null);
    setRates(r);
    setForm(r || {});
  };

  const saveRates = async () => {
    await api(`/api/v1/warehouses/${selWH}`, { method:'PUT', body:form, token });
    setEditing(false);
    const r = await api(`/api/v1/warehouses/${selWH}`, { token }).catch(() => null);
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
              background: selWH===wh.code?'color-mix(in srgb, var(--ac) 6%, transparent)':'var(--bg2)',
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
              <div className="ct-t">{selWH} — 仓库与打卡配置</div>
              {canEdit && (!editing
                ? <button className="b bgh" onClick={() => setEditing(true)}>{t('wh.edit')}</button>
                : <div style={{ display:'flex',gap:6 }}>
                    <button className="b bgh" onClick={() => setEditing(false)}>{t('c.cancel')}</button>
                    <button className="b bga" onClick={saveRates}>{t('wh.f_save')}</button>
                  </div>
              )}
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:18 }}>
              <div className="fg" style={{ gridColumn:'1 / -1' }}>
                <label className="fl">仓库地址</label>
                {editing
                  ? <input className="fi" value={form.address || ''} onChange={e => setForm({...form,address:e.target.value})} />
                  : <div>{rates.address || '未填写'}</div>}
              </div>
              <div className="fg">
                <label className="fl">纬度 Latitude</label>
                {editing
                  ? <input className="fi" type="number" step="any" value={form.latitude ?? ''}
                      onChange={e => setForm({...form,latitude:e.target.value === '' ? null : Number(e.target.value)})} />
                  : <div className="mn">{rates.latitude ?? '未配置'}</div>}
              </div>
              <div className="fg">
                <label className="fl">经度 Longitude</label>
                {editing
                  ? <input className="fi" type="number" step="any" value={form.longitude ?? ''}
                      onChange={e => setForm({...form,longitude:e.target.value === '' ? null : Number(e.target.value)})} />
                  : <div className="mn">{rates.longitude ?? '未配置'}</div>}
              </div>
              <div className="fg">
                <label className="fl">打卡半径（米）</label>
                {editing
                  ? <input className="fi" type="number" min="50" max="10000" value={form.clock_radius_m ?? 1000}
                      onChange={e => setForm({...form,clock_radius_m:Number(e.target.value)})} />
                  : <div className="mn">{rates.clock_radius_m ?? 1000} m</div>}
              </div>
              <div className="fg" style={{ alignSelf:'end',fontSize:11,color:'var(--tx3)',lineHeight:1.5 }}>
                默认半径为 1000 米。员工打卡时将以此坐标和半径验证位置。
              </div>
            </div>
            {(rates.latitude == null || rates.longitude == null) && (
              <div style={{ marginBottom:16,padding:'8px 10px',fontSize:12,color:'var(--og)',background:'color-mix(in srgb, var(--og) 8%, transparent)',borderRadius:'var(--R2)' }}>
                请由管理员填写经纬度后启用该仓库的定位打卡。
              </div>
            )}
            <div style={{ fontSize:12,fontWeight:600,marginBottom:8 }}>结算价格</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              {RATE_FIELDS.map(([key, label]) => (
                <div key={key} className="fg">
                  <label className="fl">{label}</label>
                  {editing
                    ? <input className="fi" type="number" step="0.01" value={form[key] ?? ''}
                        onChange={e => setForm({...form,[key]:e.target.value === '' ? null : Number(e.target.value)})} />
                    : <div style={{ fontVariantNumeric:'tabular-nums',fontWeight:500 }}>{rates[key] == null ? '—' : `€${rates[key]}`}</div>}
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
