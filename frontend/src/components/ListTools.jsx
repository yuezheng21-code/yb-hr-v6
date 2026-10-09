/**
 * 通用列表工具栏：按日期 / 仓库 / 供应商筛选，导出 Excel / PDF（服务端渲染），可选「打包下载」。
 *
 *   const lt = useListTools(rows, { date: 'work_date', warehouse: 'warehouse_code', supplier: 'supplier_id' }, token);
 *   <ListToolbar lt={lt} title="工时记录" columns={COLS} token={token} />
 *   {lt.rows.map(...)}            // 渲染筛选后的行
 *
 * 字段可以是键名或函数 row => value。supplier 返回 ID（数字）时自动映射为供应商名称；空值归为「自有员工」。
 * 列定义：[{ label, value: row => any | 'key', type: 'text'|'num'|'int'|'money'|'date'|'pct', sum?: true }]
 */
import { useState, useEffect, useMemo } from 'react';

const OWN = '__own';
let _supplierCache = null;

const get = (row, f) => (typeof f === 'function' ? f(row) : row?.[f]);
const iso = (d) => d.toISOString().slice(0, 10);

export function presetRange(k) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  if (k === 'this_month') return [iso(new Date(Date.UTC(y, m, 1))), iso(new Date(Date.UTC(y, m + 1, 0)))];
  if (k === 'last_month') return [iso(new Date(Date.UTC(y, m - 1, 1))), iso(new Date(Date.UTC(y, m, 0)))];
  if (k === 'last_7') return [iso(new Date(Date.now() - 6 * 864e5)), iso(now)];
  if (k === 'this_year') return [`${y}-01-01`, `${y}-12-31`];
  return ['', ''];
}

export function useListTools(rows, cfg = {}, token, initial = {}) {
  const [from, setFrom] = useState(initial.from || '');
  const [to, setTo] = useState(initial.to || '');
  const [wh, setWh] = useState('');
  const [sup, setSup] = useState('');
  const [suppliers, setSuppliers] = useState(_supplierCache || []);

  useEffect(() => {
    if (!cfg.supplier || _supplierCache || !token) return;
    fetch('/api/v1/suppliers?limit=1000', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => (r.ok ? r.json() : [])).then(l => { _supplierCache = Array.isArray(l) ? l : []; setSuppliers(_supplierCache); })
      .catch(() => {});
  }, [cfg.supplier, token]);

  const list = rows || [];
  const supName = (v) => {
    if (v === null || v === undefined || v === '') return '';
    if (typeof v === 'number' || /^\d+$/.test(String(v))) {
      const s = suppliers.find(x => String(x.id) === String(v));
      return s ? s.name : `#${v}`;
    }
    return String(v);
  };

  const warehouses = useMemo(() => (cfg.warehouse
    ? [...new Set(list.map(r => get(r, cfg.warehouse)).filter(Boolean))].sort() : []), [list, cfg.warehouse]);
  const supplierOpts = useMemo(() => {
    if (!cfg.supplier) return [];
    const vals = [...new Set(list.map(r => get(r, cfg.supplier)).filter(v => v !== null && v !== undefined && v !== ''))];
    return vals.map(v => ({ value: String(v), label: supName(v) })).sort((a, b) => a.label.localeCompare(b.label));
  }, [list, cfg.supplier, suppliers]); // eslint-disable-line react-hooks/exhaustive-deps
  const hasOwn = cfg.supplier && list.some(r => { const v = get(r, cfg.supplier); return v === null || v === undefined || v === ''; });

  const filtered = useMemo(() => list.filter(r => {
    if (cfg.date && (from || to)) {
      const d = String(get(r, cfg.date) || '').slice(0, 10);
      if (!d || (from && d < from) || (to && d > to)) return false;
    }
    if (cfg.warehouse && wh && get(r, cfg.warehouse) !== wh) return false;
    if (cfg.supplier && sup) {
      const v = get(r, cfg.supplier);
      const empty = v === null || v === undefined || v === '';
      if (sup === OWN ? !empty : String(v) !== sup) return false;
    }
    return true;
  }), [list, from, to, wh, sup, cfg.date, cfg.warehouse, cfg.supplier]);

  const describe = () => [
    (from || to) && `日期 ${from || '…'} → ${to || '…'}`,
    wh && `仓库 ${wh}`,
    sup && `供应商 ${sup === OWN ? '自有员工' : supName(sup)}`,
  ].filter(Boolean).join(' · ');

  return {
    rows: filtered, total: list.length, cfg, from, to, wh, sup, setFrom, setTo, setWh, setSup,
    warehouses, supplierOpts, hasOwn, supName, describe,
    active: !!(from || to || wh || sup),
    reset: () => { setFrom(''); setTo(''); setWh(''); setSup(''); },
    /** 供服务端筛选的查询参数（日期 / 仓库） */
    query: { date_from: from || undefined, date_to: to || undefined, warehouse_code: wh || undefined },
  };
}

async function download(res, fallback) {
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.detail || res.statusText);
  }
  const blob = await res.blob();
  const cd = res.headers.get('Content-Disposition') || '';
  const m = cd.match(/filename\*=UTF-8''([^;]+)/) || cd.match(/filename="?([^";]+)"?/);
  const name = m ? decodeURIComponent(m[1]) : fallback;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function exportTable({ token, title, subtitle, columns, rows, format }) {
  const body = {
    title, subtitle,
    columns: columns.map(c => ({ label: c.label, type: c.type || 'text', sum: !!c.sum })),
    rows: rows.map(r => columns.map(c => {
      const v = typeof c.value === 'function' ? c.value(r) : r[c.value];
      return v === undefined ? null : (typeof v === 'object' && v !== null ? String(v) : v);
    })),
  };
  const res = await fetch(`/api/v1/export/table?format=${format}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(body),
  });
  await download(res, `${title}.${format}`);
}

export async function downloadUrl(path, token, fallback = 'download') {
  await download(await fetch(path, { headers: { Authorization: 'Bearer ' + token } }), fallback);
}

export function ListToolbar({ lt, title, columns, token, bundle, extra, children, dateLabel = '日期', subtitle }) {
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const run = async (key, fn) => {
    setBusy(key); setErr('');
    try { await fn(); } catch (e) { setErr(e.message); }
    setBusy('');
  };
  const doExport = (format) => run(format, () => exportTable({
    token, title, subtitle: [subtitle, lt.describe()].filter(Boolean).join(' · '), columns, rows: lt.rows, format,
  }));
  const { cfg } = lt;
  return (
    <div className="lt-bar">
      {cfg.date && (
        <div className="lt-group">
          <span className="lt-label">{dateLabel}</span>
          <input className="mz-input lt-date" type="date" value={lt.from} onChange={e => lt.setFrom(e.target.value)} aria-label="从" />
          <span className="mz-muted">→</span>
          <input className="mz-input lt-date" type="date" value={lt.to} onChange={e => lt.setTo(e.target.value)} aria-label="至" />
          <select className="mz-select lt-preset" value="" onChange={e => { const [a, b] = presetRange(e.target.value); lt.setFrom(a); lt.setTo(b); }}>
            <option value="">快捷</option>
            <option value="this_month">本月</option><option value="last_month">上月</option>
            <option value="last_7">近 7 天</option><option value="this_year">今年</option><option value="all">全部</option>
          </select>
        </div>
      )}
      {cfg.warehouse && (
        <select className="mz-select lt-sel" value={lt.wh} onChange={e => lt.setWh(e.target.value)}>
          <option value="">全部仓库</option>
          {lt.warehouses.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      )}
      {cfg.supplier && (
        <select className="mz-select lt-sel" value={lt.sup} onChange={e => lt.setSup(e.target.value)}>
          <option value="">全部供应商</option>
          {lt.hasOwn && <option value={OWN}>自有员工</option>}
          {lt.supplierOpts.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      )}
      {children}
      {lt.active && <button className="mz-link lt-reset" onClick={lt.reset}>清除筛选</button>}
      <span className="lt-count">{lt.active ? `${lt.rows.length} / ${lt.total}` : lt.total} 条</span>
      <div className="lt-actions">
        {extra}
        <button className="mz-btn mz-btn-s" disabled={!!busy || !lt.rows.length} onClick={() => doExport('xlsx')}>{busy === 'xlsx' ? '导出中…' : 'Excel'}</button>
        <button className="mz-btn mz-btn-s" disabled={!!busy || !lt.rows.length} onClick={() => doExport('pdf')}>{busy === 'pdf' ? '导出中…' : 'PDF'}</button>
        {bundle && <button className="mz-btn mz-btn-s" disabled={!!busy || bundle.disabled} title={bundle.title}
          onClick={() => run('zip', () => downloadUrl(bundle.url(), token, 'bundle.zip'))}>{busy === 'zip' ? '打包中…' : (bundle.label || '打包下载 PDF')}</button>}
      </div>
      {err && <div className="lt-err">{err}</div>}
    </div>
  );
}
