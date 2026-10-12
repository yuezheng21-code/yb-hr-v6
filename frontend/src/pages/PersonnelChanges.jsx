import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { Loading } from '../components/Spinner.jsx';
import { downloadUrl } from '../components/ListTools.jsx';
import { hasPermission } from '../services/permissions.js';

const P = '/api/v1/personnel';
const TYPE_LABELS = {
  hired: '入职', contract: '合同', amendment: '合同修订', salary: '调薪',
  leave: '请假', performance: '绩效', warning: '警告', termination: '离职',
};
const STATUS_LABELS = { pending: '待审批', requested: '待审批', approved: '已批准', executed: '已执行', rejected: '已驳回' };

function queryString(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
}

export default function PersonnelChanges({ token, user }) {
  const [filters, setFilters] = useState({
    employee_id: '', warehouse: '', supplier_id: '', biz_line: '', event_type: '', approval_status: '', date_from: '', date_to: '',
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const query = useMemo(() => queryString(filters), [filters]);

  useEffect(() => {
    if (!hasPermission(user, 'changes.read')) return;
    setLoading(true);
    api(`${P}/changes${query ? `?${query}` : ''}`, { token })
      .then(setRows)
      .catch(e => { setRows([]); setError(e.message); })
      .finally(() => setLoading(false));
  }, [token, query, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    api('/api/v1/warehouses?limit=1000', { token }).then(setWarehouses).catch(() => {});
    api('/api/v1/suppliers?limit=1000', { token }).then(setSuppliers).catch(() => {});
  }, [token]);

  if (!hasPermission(user, 'changes.read')) return <div className="mz-empty">您没有查看工人变更汇总的权限</div>;
  const set = (key, value) => setFilters(current => ({ ...current, [key]: value }));
  const download = (format) => downloadUrl(`${P}/changes/export?format=${format}${query ? `&${query}` : ''}`, token, `employee_changes.${format}`);

  return (
    <div className="mz">
      <div className="mz-head">
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>工人变更汇总</div>
          <div className="mz-sub">入职、合同、调薪、请假、绩效、警告和离职记录均由服务端按当前数据范围查询。</div>
        </div>
        {hasPermission(user, 'changes.export') && <div className="mz-actions">
          <button className="mz-btn" onClick={() => download('xlsx')}>导出 Excel</button>
          <button className="mz-btn" onClick={() => download('pdf')}>导出 PDF</button>
        </div>}
      </div>

      <div className="mz-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 14 }}>
        <input className="mz-input" inputMode="numeric" placeholder="员工 ID" value={filters.employee_id} onChange={e => set('employee_id', e.target.value.replace(/\D/g, ''))} />
        <select className="mz-select" value={filters.warehouse} onChange={e => set('warehouse', e.target.value)}>
          <option value="">全部仓库</option>{warehouses.map(w => <option key={w.code} value={w.code}>{w.code} · {w.name}</option>)}
        </select>
        <select className="mz-select" value={filters.supplier_id} onChange={e => set('supplier_id', e.target.value)}>
          <option value="">全部供应商</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}
        </select>
        <select className="mz-select" value={filters.biz_line} onChange={e => set('biz_line', e.target.value)}>
          <option value="">全部业务线</option><option value="渊博">渊博</option><option value="579">579</option>
        </select>
        <select className="mz-select" value={filters.event_type} onChange={e => set('event_type', e.target.value)}>
          <option value="">全部类别</option>{Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select className="mz-select" value={filters.approval_status} onChange={e => set('approval_status', e.target.value)}>
          <option value="">全部审批状态</option>{Object.entries(STATUS_LABELS).filter(([value]) => value !== 'requested').map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input className="mz-input" type="date" value={filters.date_from} onChange={e => set('date_from', e.target.value)} aria-label="开始日期" />
        <input className="mz-input" type="date" value={filters.date_to} onChange={e => set('date_to', e.target.value)} aria-label="结束日期" />
      </div>

      <div className="mz-card">
        {loading ? <Loading /> : error ? <div className="mz-empty">{error}</div> : !rows.length ? <div className="mz-empty">没有符合条件的变更记录</div> : (
          <div className="mz-scroll"><table className="mz-table">
            <thead><tr><th>日期</th><th>员工</th><th>类别</th><th>审批状态</th><th>变更内容</th><th>仓库</th><th>供应商</th><th>业务线</th><th>操作人</th></tr></thead>
            <tbody>{rows.map(row => <tr key={row.id}>
              <td className="mz-num">{row.date}</td><td>{row.employee}<div className="mz-muted">{row.emp_no}</div></td>
              <td>{TYPE_LABELS[row.type] || row.type}</td><td>{row.approval_status ? STATUS_LABELS[row.approval_status] || row.approval_status : '—'}</td>
              <td>{row.title}</td><td>{row.warehouse || '—'}</td><td>{row.supplier_id || '自有'}</td><td>{row.biz_line || '—'}</td><td>{row.created_by || '—'}</td>
            </tr>)}</tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}
