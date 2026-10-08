import { useState, useEffect, useRef } from 'react';
import { api, downloadCsv } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Loading } from '../components/Spinner.jsx';

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const RANGES = [['7', '近 7 天'], ['30', '近 30 天'], ['90', '近 90 天']];
const SEVERITY = { minor: '轻微', major: '严重', critical: '重大', positive: '表扬' };

const fmt = (n, d = 0) => (n == null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }));
const effColor = (v) => (v == null ? 'var(--tx3)' : v >= 100 ? 'var(--gn)' : v >= 85 ? 'var(--og)' : 'var(--rd)');

/** Hover tooltip shared by the charts. */
function useTip() {
  const [tip, setTip] = useState(null);
  const node = tip && (
    <div style={{
      position: 'absolute', left: tip.x, top: tip.y, transform: 'translate(-50%, calc(-100% - 8px))', pointerEvents: 'none',
      background: 'var(--tx)', color: 'var(--bg2)', fontSize: 11, padding: '6px 8px', borderRadius: 6, whiteSpace: 'nowrap', zIndex: 5,
    }}>{tip.content}</div>
  );
  return [setTip, node];
}

/** Single-series column chart: thin columns, rounded data end, hairline grid, hover tooltip. */
function Columns({ data, valueKey, format, height = 160 }) {
  const ref = useRef(null);
  const [w, setW] = useState(600);
  const [setTip, tipNode] = useTip();
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const padL = 36, padB = 22, padT = 8;
  const max = Math.max(1, ...data.map(d => d[valueKey] || 0));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const plotW = Math.max(10, w - padL), plotH = height - padB - padT;
  const band = plotW / Math.max(1, data.length);
  const bw = Math.min(24, Math.max(2, band - 2));
  const y = (v) => padT + plotH - (v / top) * plotH;
  const ticks = [0, top / 2, top];
  const every = Math.ceil(data.length / Math.max(1, Math.floor(plotW / 56)));
  return (
    <div ref={ref} style={{ position: 'relative' }} onMouseLeave={() => setTip(null)}>
      <svg width="100%" height={height} role="img">
        {ticks.map(t => (
          <g key={t}>
            <line x1={padL} x2={w} y1={y(t)} y2={y(t)} stroke="var(--bd)" strokeWidth="1" />
            <text x={padL - 6} y={y(t) + 3} textAnchor="end" fontSize="10" fill="var(--tx3)">{format(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const v = d[valueKey] || 0;
          const x = padL + i * band + (band - bw) / 2;
          const h = Math.max(0, y(0) - y(v));
          const r = Math.min(4, h, bw / 2);
          return (
            <g key={d.date}>
              {h > 0 && <path d={`M${x},${y(0)} V${y(0) - h + r} Q${x},${y(0) - h} ${x + r},${y(0) - h} H${x + bw - r} Q${x + bw},${y(0) - h} ${x + bw},${y(0) - h + r} V${y(0)} Z`} fill="var(--ac)" />}
              <rect x={padL + i * band} y={padT} width={band} height={plotH} fill="transparent"
                onMouseEnter={() => setTip({ x: padL + i * band + band / 2, y: y(v), content: <>{d.date}<br /><b>{format(v)}</b>{d.headcount ? ` · ${d.headcount} 人` : ''}</> })} />
              {i % every === 0 && <text x={padL + i * band + band / 2} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--tx3)">{d.date.slice(5)}</text>}
            </g>
          );
        })}
      </svg>
      {tipNode}
    </div>
  );
}

/** Single-series line with a 100% target reference line. */
function EfficiencyLine({ data, height = 160 }) {
  const ref = useRef(null);
  const [w, setW] = useState(600);
  const [setTip, tipNode] = useTip();
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const padL = 36, padB = 22, padT = 8;
  const vals = data.map(d => d.efficiency).filter(v => v != null);
  const lo = Math.min(60, ...vals), hi = Math.max(120, ...vals);
  const plotW = Math.max(10, w - padL), plotH = height - padB - padT;
  const band = plotW / Math.max(1, data.length);
  const x = (i) => padL + i * band + band / 2;
  const y = (v) => padT + plotH - ((v - lo) / (hi - lo)) * plotH;
  const segs = [];
  let cur = [];
  data.forEach((d, i) => { if (d.efficiency == null) { if (cur.length) segs.push(cur); cur = []; } else cur.push([x(i), y(d.efficiency)]); });
  if (cur.length) segs.push(cur);
  const every = Math.ceil(data.length / Math.max(1, Math.floor(plotW / 56)));
  return (
    <div ref={ref} style={{ position: 'relative' }} onMouseLeave={() => setTip(null)}>
      <svg width="100%" height={height} role="img">
        {[lo, 100, hi].map(t => (
          <g key={t}>
            <line x1={padL} x2={w} y1={y(t)} y2={y(t)} stroke={t === 100 ? 'var(--tx3)' : 'var(--bd)'} strokeWidth="1" />
            <text x={padL - 6} y={y(t) + 3} textAnchor="end" fontSize="10" fill="var(--tx3)">{Math.round(t)}%</text>
          </g>
        ))}
        {segs.map((s, k) => (
          <polyline key={k} points={s.map(p => p.join(',')).join(' ')} fill="none" stroke="var(--ac)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {data.map((d, i) => (
          <g key={d.date}>
            {d.efficiency != null && <circle cx={x(i)} cy={y(d.efficiency)} r="4" fill="var(--ac)" stroke="var(--bg2)" strokeWidth="2" />}
            <rect x={padL + i * band} y={padT} width={band} height={plotH} fill="transparent"
              onMouseEnter={() => setTip({ x: x(i), y: d.efficiency != null ? y(d.efficiency) : y(100), content: <>{d.date}<br /><b>{d.efficiency != null ? `${d.efficiency}%` : '无数据'}</b></> })} />
            {i % every === 0 && <text x={x(i)} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--tx3)">{d.date.slice(5)}</text>}
          </g>
        ))}
      </svg>
      {tipNode}
    </div>
  );
}

function niceStep(max) {
  const raw = max / 2;
  const mag = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) || raw;
}

export default function ClientBI({ token, user }) {
  const showToast = useToast();
  const isClient = user?.role === 'client';
  const [whs, setWhs] = useState([]);
  const [wh, setWh] = useState('');
  const [range, setRange] = useState('30');
  const [custom, setCustom] = useState({ from: daysAgo(29), to: today() });
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  const period = range === 'custom' ? custom : { from: daysAgo(Number(range) - 1), to: today() };
  const qs = () => new URLSearchParams({ date_from: period.from, date_to: period.to, ...(wh ? { warehouse: wh } : {}) }).toString();

  useEffect(() => {
    api('/api/v1/client-bi/warehouses', { token }).then(list => {
      setWhs(list);
      if (!isClient && list.length) setWh(list[0].code);
    }).catch(e => setErr(e.message));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isClient && !wh) return;
    setData(null); setErr('');
    api(`/api/v1/client-bi/overview?${qs()}`, { token }).then(setData).catch(e => setErr(e.message));
  }, [wh, range, custom.from, custom.to]); // eslint-disable-line react-hooks/exhaustive-deps

  const k = data?.kpi;
  const whLabel = wh ? (whs.find(w => w.code === wh)?.name || wh) : whs.map(w => w.name).join('、');

  return (
    <div className="mz">
      <div className="mz-head">
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{whLabel || '仓库运营看板'}</div>
          <div className="mz-sub" style={{ marginTop: 4 }}>
            {data ? `${data.period.from} — ${data.period.to} · 仅统计已确认的作业记录` : '作业量、工时、效率与质量'}
            {!isClient && ' · 预览：甲方账号看到的就是这个页面'}
          </div>
        </div>
        <div className="mz-actions">
          {(whs.length > 1 || !isClient) && (
            <select className="mz-select" value={wh} onChange={e => setWh(e.target.value)}>
              {isClient && <option value="">全部仓库</option>}
              {whs.map(w => <option key={w.code} value={w.code}>{w.code} · {w.name}</option>)}
            </select>
          )}
          <div className="mz-seg">
            {RANGES.map(([v, l]) => <button key={v} className={range === v ? 'on' : ''} onClick={() => setRange(v)}>{l}</button>)}
            <button className={range === 'custom' ? 'on' : ''} onClick={() => setRange('custom')}>自定义</button>
          </div>
          {range === 'custom' && <>
            <input className="mz-input" type="date" value={custom.from} onChange={e => setCustom({ ...custom, from: e.target.value })} />
            <input className="mz-input" type="date" value={custom.to} onChange={e => setCustom({ ...custom, to: e.target.value })} />
          </>}
          <button className="mz-btn" disabled={!data} onClick={() => downloadCsv(`/api/v1/client-bi/export?${qs()}`, token, 'operations.csv').catch(e => showToast(e.message, 'err'))}>导出 CSV</button>
        </div>
      </div>

      {err && <div className="mz-card mz-empty">{err}</div>}
      {!err && !data && <Loading />}

      {data && <>
        <div className="mz-grid mz-g4">
          <Tile label="作业工时" value={`${fmt(k.total_hours, 1)} h`} note={`${k.working_days} 个作业日 · ${k.headcount} 名作业人员`} />
          <Tile label="综合效率" value={k.efficiency != null ? `${k.efficiency}%` : '—'} note="实际产出 ÷ 标准工效，100% 为达标" color={effColor(k.efficiency)} />
          <Tile label="差错率" value={`${fmt(k.error_rate, 2)}%`} note={`${k.quality_events} 起质量事件`} />
          <Tile label="装卸柜" value={fmt(k.containers)} note={k.client_amount ? `预估作业结算 €${fmt(k.client_amount, 2)}` : `${fmt(k.records)} 条作业记录`} />
        </div>
        {k.pending_records > 0 && <div className="mz-hint">另有 {k.pending_records} 条作业记录正在核对，确认后计入。</div>}

        <div className="mz-grid mz-g2">
          <div className="mz-card">
            <div className="mz-card-h"><div className="mz-card-t">每日作业工时</div></div>
            <Columns data={data.daily} valueKey="hours" format={v => `${fmt(v)}h`} />
          </div>
          <div className="mz-card">
            <div className="mz-card-h"><div className="mz-card-t">每日综合效率</div><span className="mz-muted">参考线 = 100% 达标</span></div>
            <EfficiencyLine data={data.daily} />
          </div>
        </div>

        <div className="mz-card">
          <div className="mz-card-h"><div className="mz-card-t">按作业类型</div></div>
          {data.by_operation.length === 0 ? <div className="mz-empty">该期间暂无已确认的作业记录</div> : (
            <div className="mz-scroll"><table className="mz-table">
              <thead><tr><th>作业</th><th style={{ textAlign: 'right' }}>作业量</th><th style={{ textAlign: 'right' }}>工时</th><th style={{ textAlign: 'right' }}>人均时产</th><th style={{ textAlign: 'right' }}>标准</th><th style={{ width: 200 }}>效率</th><th style={{ textAlign: 'right' }}>差错率</th></tr></thead>
              <tbody>{data.by_operation.map(r => (
                <tr key={r.key}>
                  <td>{r.label}</td>
                  <td className="mz-num" style={{ textAlign: 'right' }}>{fmt(r.qty, r.unit === '柜' ? 2 : 0)} <span className="mz-muted">{r.unit}</span></td>
                  <td className="mz-num" style={{ textAlign: 'right' }}>{fmt(r.total_hours, 1)} h</td>
                  <td className="mz-num" style={{ textAlign: 'right' }}>{r.uph != null ? fmt(r.uph, 1) : '—'}</td>
                  <td className="mz-num mz-muted" style={{ textAlign: 'right' }}>{r.standard_uph ? fmt(r.standard_uph, r.standard_uph < 1 ? 2 : 0) : '—'}</td>
                  <td><Meter value={r.efficiency} /></td>
                  <td className="mz-num" style={{ textAlign: 'right' }}>{fmt(r.error_rate, 2)}%</td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>

        <div className="mz-grid mz-g2">
          <div className="mz-card">
            <div className="mz-card-h"><div className="mz-card-t">按货主 / 平台</div></div>
            {data.by_client.length === 0 ? <div className="mz-empty">暂无数据</div> : data.by_client.map(r => (
              <div key={r.key} className="mz-row">
                <span className="mz-grow">{r.label === '-' ? '未指定' : r.label}</span>
                <span className="mz-muted mz-num">{fmt(r.total_hours, 1)} h</span>
                <span className="mz-num" style={{ width: 64, textAlign: 'right', color: effColor(r.efficiency) }}>{r.efficiency != null ? `${r.efficiency}%` : '—'}</span>
              </div>
            ))}
          </div>
          <div className="mz-card">
            <div className="mz-card-h"><div className="mz-card-t">装卸柜</div></div>
            {data.containers.length === 0 ? <div className="mz-empty">该期间暂无装卸柜记录</div> : data.containers.map(r => (
              <div key={r.type} className="mz-row">
                <span className="mz-grow">{r.type}</span>
                <span className="mz-num">{r.count} 柜</span>
                <span className="mz-muted mz-num" style={{ width: 150, textAlign: 'right' }}>
                  {r.avg_minutes != null ? `平均 ${r.avg_minutes} 分钟` : '—'}{r.avg_team ? ` · ${r.avg_team} 人` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mz-card">
          <div className="mz-card-h"><div className="mz-card-t">质量事件</div><span className="mz-muted">{data.quality.length} 起</span></div>
          {data.quality.length === 0 ? <div className="mz-empty">该期间无质量事件</div> : (
            <div className="mz-scroll"><table className="mz-table">
              <thead><tr><th>日期</th><th>类型</th><th>程度</th><th>货主</th><th>单号</th><th>说明</th></tr></thead>
              <tbody>{data.quality.map((q, i) => (
                <tr key={i}>
                  <td className="mz-num">{q.date}</td><td>{q.type}</td>
                  <td><span className="mz-tag"><span className="mz-dot" style={{ background: q.severity === 'positive' ? 'var(--gn)' : q.severity === 'minor' ? 'var(--og)' : 'var(--rd)' }} />{SEVERITY[q.severity] || q.severity}</span></td>
                  <td>{q.client || '—'}</td><td className="mz-muted">{q.ref_no || '—'}</td><td>{q.description || '—'}</td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      </>}
    </div>
  );
}

function Tile({ label, value, note, color }) {
  return (
    <div className="mz-card">
      <div className="mz-kpi-l">{label}</div>
      <div className="mz-kpi-v" style={{ fontVariantNumeric: 'normal', ...(color ? { color } : {}) }}>{value}</div>
      <div className="mz-kpi-n">{note}</div>
    </div>
  );
}

function Meter({ value }) {
  if (value == null) return <span className="mz-muted">不计效率</span>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="mz-bar" style={{ flex: 1, position: 'relative' }}>
        <div style={{ width: `${Math.min(value, 150) / 1.5}%`, background: effColor(value) }} />
      </div>
      <span className="mz-num" style={{ width: 48, textAlign: 'right' }}>{value}%</span>
    </div>
  );
}
