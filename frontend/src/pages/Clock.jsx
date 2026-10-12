import { useCallback, useEffect, useState } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { api } from '../services/api.js';
import { useLang } from '../context/LangContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { hasPermission } from '../services/permissions.js';

const today = () => new Date().toISOString().slice(0, 10);

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('当前浏览器不支持定位，无法进行定位打卡'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      resolve,
      error => {
        const messages = {
          1: '定位权限被拒绝，请允许浏览器访问位置后重试',
          2: '当前位置不可用，请检查定位服务后重试',
          3: '定位超时，请在信号良好的位置重试',
        };
        reject(new Error(messages[error.code] || '无法获取当前位置'));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

export default function Clock({ token, user }) {
  const [now, setNow] = useState(new Date());
  const [logs, setLogs] = useState([]);
  const [ownStatus, setOwnStatus] = useState('loading');
  const [ownError, setOwnError] = useState('');
  const [punching, setPunching] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [opTypes, setOpTypes] = useState([]);
  const [mine, setMine] = useState(null);
  const [rep, setRep] = useState({ op_type_id: '', qty: '', hours: '', ref_no: '' });
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordFilters, setRecordFilters] = useState({ date_from: today(), date_to: today(), warehouse_code: '', employee_id: '' });
  const [employees, setEmployees] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const { t } = useLang();
  const showToast = useToast();
  const canViewRecords = hasPermission(user, 'employees.read');
  const ownAvailable = ownStatus === 'ready';

  const loadOwn = useCallback(async () => {
    setOwnStatus('loading');
    setOwnError('');
    try {
      const events = await api('/api/v1/clock/today', { token });
      setLogs(events);
      setOwnStatus('ready');
    } catch (error) {
      setLogs([]);
      setOwnError(error.message);
      setOwnStatus('unlinked');
    }
  }, [token]);

  const loadRecords = useCallback(async () => {
    if (!canViewRecords) return;
    setRecordsLoading(true);
    try {
      const query = new URLSearchParams();
      Object.entries(recordFilters).forEach(([key, value]) => {
        if (value) query.set(key, value);
      });
      setRecords(await api(`/api/v1/clock/records?${query.toString()}`, { token }));
    } catch (error) {
      showToast(error.message, 'err');
    } finally {
      setRecordsLoading(false);
    }
  }, [canViewRecords, recordFilters, showToast, token]);

  useEffect(() => { loadOwn(); }, [loadOwn]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!ownAvailable) return;
    api('/api/v1/ops/my', { token }).then(setMine).catch(() => setMine(null));
    api('/api/v1/ops/types?active_only=true', { token }).then(setOpTypes).catch(() => {});
  }, [ownAvailable, token]);

  useEffect(() => {
    if (!canViewRecords) return;
    loadRecords();
  }, [canViewRecords, loadRecords]);

  useEffect(() => {
    if (!canViewRecords) return;
    api('/api/v1/employees?status=active&limit=5000', { token }).then(setEmployees).catch(() => {});
    api('/api/v1/warehouses?status=active', { token }).then(setWarehouses).catch(() => {});
  }, [canViewRecords, token]);

  const loadMine = () => api('/api/v1/ops/my', { token }).then(setMine).catch(() => setMine(null));

  const submitReport = async () => {
    if (!rep.op_type_id || !(parseFloat(rep.qty) > 0)) { showToast('请选择作业并填写数量', 'err'); return; }
    try {
      await api('/api/v1/ops/report', {
        method: 'POST', token,
        body: { op_type_id: parseInt(rep.op_type_id), qty: parseFloat(rep.qty), hours: parseFloat(rep.hours) || 0, ref_no: rep.ref_no || null },
      });
      setRep({ ...rep, qty: '', hours: '', ref_no: '' });
      showToast('报工成功');
      loadMine();
    } catch (error) { showToast(error.message, 'err'); }
  };

  const last = logs[logs.length - 1];
  const isIn = last?.clock_type === 'in';

  const punch = async (clockType) => {
    setPunching(true);
    setLocationStatus('正在获取高精度定位…');
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude, accuracy } = position.coords;
      setLocationStatus('正在验证打卡范围…');
      await api('/api/v1/clock', {
        method: 'POST',
        body: { clock_type: clockType, latitude, longitude, accuracy_m: accuracy },
        token,
      });
      await loadOwn();
      showToast(clockType === 'in' ? '上班打卡成功' : '下班打卡成功');
    } catch (error) {
      showToast(error.message, 'err');
    } finally {
      setPunching(false);
      setLocationStatus('');
    }
  };

  return (
    <div>
      {ownAvailable && (
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',padding:'40px 0' }}>
          <div style={{ fontSize:56,fontWeight:300,color:'var(--tx)',letterSpacing:-1,fontVariantNumeric:'tabular-nums' }}>
            {now.toTimeString().slice(0, 8)}
          </div>
          <div style={{ color:'var(--tx3)',marginBottom:24 }}>
            {now.toLocaleDateString('de-DE')} · {user?.display_name}
          </div>

          <button
            type="button"
            onClick={() => punch(isIn ? 'out' : 'in')}
            disabled={punching}
            style={{
              width:148, height:148, borderRadius:'50%',
              border: `1.5px solid ${isIn ? 'var(--rd)' : 'var(--ac)'}`,
              background: isIn ? 'color-mix(in srgb, var(--rd) 6%, transparent)' : 'var(--ac)',
              color: isIn ? 'var(--rd)' : '#fff',
              display:'flex', flexDirection:'column', alignItems:'center', gap:8,
              justifyContent:'center', cursor:punching ? 'wait' : 'pointer', transition:'transform .15s',
              opacity:punching ? .7 : 1,
            }}
          >
            {isIn ? <LogOut size={28} strokeWidth={1.5} /> : <LogIn size={28} strokeWidth={1.5} />}
            <div style={{ fontSize:14,fontWeight:500 }}>{punching ? '定位中…' : (isIn ? t('clock.clock_out') : t('clock.clock_in'))}</div>
          </button>

          <div style={{ marginTop:12,fontSize:12,color:'var(--tx3)' }}>
            {isIn ? `${t('clock.clocked_in')} ${last.clock_time}` : t('clock.not_clocked')}
          </div>
          <div style={{ marginTop:4,fontSize:11,color:'var(--tx3)' }}>
            {locationStatus || '打卡需开启定位，精度须在 200 米以内。'}
          </div>

          {logs.length > 0 && (
            <div style={{ marginTop:16,width:'100%',maxWidth:400 }}>
              {logs.map(log => (
                <div key={log.id} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid var(--bd)',fontSize:12 }}>
                  <span style={{ width:6,height:6,borderRadius:'50%',background:log.clock_type === 'in' ? 'var(--gn)' : 'var(--rd)' }} />
                  <span style={{ flex:1 }}>{log.clock_type === 'in' ? t('clock.clock_in') : t('clock.clock_out')}</span>
                  <span>{log.warehouse_code || '—'}</span>
                  <span className="tm mn">{log.clock_time}</span>
                </div>
              ))}
            </div>
          )}

          {mine && (
            <div style={{ marginTop:24,width:'100%',maxWidth:400 }}>
              <div className="fw6" style={{ marginBottom:8 }}>报工（产量登记）</div>
              <div style={{ display:'flex',flexDirection:'column',gap:6,padding:16,background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:12 }}>
                <select className="fsl" value={rep.op_type_id} onChange={e => setRep({ ...rep, op_type_id: e.target.value })}>
                  <option value="">选择作业 / Tätigkeit</option>
                  {opTypes.map(operation => <option key={operation.id} value={operation.id}>{operation.name}{operation.name_de ? ` · ${operation.name_de}` : ''} ({operation.unit})</option>)}
                </select>
                <div style={{ display:'flex',gap:6 }}>
                  <input className="fi" type="number" inputMode="decimal" placeholder="数量 Menge" value={rep.qty} onChange={e => setRep({ ...rep, qty: e.target.value })} />
                  <input className="fi" type="number" inputMode="decimal" step="0.25" placeholder="工时 Std." value={rep.hours} onChange={e => setRep({ ...rep, hours: e.target.value })} />
                </div>
                <input className="fi" placeholder="单号/柜号（可选）" value={rep.ref_no} onChange={e => setRep({ ...rep, ref_no: e.target.value })} />
                <button className="b bga" onClick={submitReport}>提交 / Senden</button>
              </div>
              {mine.today.length > 0 && (
                <div style={{ marginTop:8 }}>
                  {mine.today.map(log => (
                    <div key={log.id} style={{ display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:8,marginBottom:4,fontSize:12 }}>
                      <span>{log.op_name || log.op_label}</span>
                      <span className="mn">{log.qty} {log.unit}{log.hours ? ` · ${log.hours}h` : ''}</span>
                    </div>
                  ))}
                </div>
              )}
              {mine.month && (
                <div style={{ marginTop:8,padding:16,background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:12,fontSize:12,display:'flex',justifyContent:'space-around',textAlign:'center' }}>
                  <div><div className="tm" style={{ fontSize:10 }}>本月效率</div><div className="fw6">{mine.month.efficiency != null ? `${mine.month.efficiency}%` : '—'}</div></div>
                  <div><div className="tm" style={{ fontSize:10 }}>质量分</div><div className="fw6">{mine.month.quality_score}</div></div>
                  <div><div className="tm" style={{ fontSize:10 }}>等级</div><div className="fw6">{mine.month.grade}</div></div>
                  <div><div className="tm" style={{ fontSize:10 }}>计件</div><div className="fw6">€{mine.month.piece_amount}</div></div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!ownAvailable && ownStatus !== 'loading' && !canViewRecords && (
        <div style={{ maxWidth:420,margin:'60px auto',textAlign:'center' }}>
          <div style={{ fontSize:15,fontWeight:500,marginBottom:8 }}>当前账号不能打卡</div>
          <div className="tm" style={{ fontSize:12,lineHeight:1.7 }}>
            {ownError || '请联系管理员在「用户管理」中关联您的在职员工档案。'}
          </div>
        </div>
      )}

      {canViewRecords && (
        <section className="mz-card" style={{ marginTop:ownAvailable ? 8 : 32,padding:16 }}>
          <div style={{ fontSize:15,fontWeight:600,marginBottom:12 }}>考勤记录</div>
          <div style={{ display:'flex',gap:8,flexWrap:'wrap',marginBottom:14 }}>
            <input className="fi" type="date" value={recordFilters.date_from} onChange={e => setRecordFilters({...recordFilters,date_from:e.target.value})} />
            <input className="fi" type="date" value={recordFilters.date_to} onChange={e => setRecordFilters({...recordFilters,date_to:e.target.value})} />
            <select className="fsl" value={recordFilters.warehouse_code} onChange={e => setRecordFilters({...recordFilters,warehouse_code:e.target.value})}>
              <option value="">全部仓库</option>
              {warehouses.map(warehouse => <option key={warehouse.code} value={warehouse.code}>{warehouse.code} · {warehouse.name}</option>)}
            </select>
            <select className="fsl" value={recordFilters.employee_id} onChange={e => setRecordFilters({...recordFilters,employee_id:e.target.value})}>
              <option value="">全部员工</option>
              {employees.map(employee => <option key={employee.id} value={employee.id}>{employee.emp_no} · {employee.name}</option>)}
            </select>
          </div>
          <div className="tw"><div className="ts"><table>
            <thead><tr><th>日期</th><th>员工</th><th>类型</th><th>仓库</th><th>时间</th><th>距离</th><th>定位精度</th></tr></thead>
            <tbody>
              {records.map(record => (
                <tr key={record.id}>
                  <td className="mn">{record.work_date}</td>
                  <td>{record.emp_no} · {record.emp_name}</td>
                  <td>{record.clock_type === 'in' ? '上班' : '下班'}</td>
                  <td>{record.warehouse_code || '—'}</td>
                  <td className="mn">{record.clock_time}</td>
                  <td className="mn">{record.distance_m == null ? '—' : `${Math.round(record.distance_m)} m`}</td>
                  <td className="mn">{record.accuracy_m == null ? '—' : `±${Math.round(record.accuracy_m)} m`}</td>
                </tr>
              ))}
              {!recordsLoading && records.length === 0 && <tr><td colSpan="7" className="mz-empty">暂无考勤记录</td></tr>}
            </tbody>
          </table></div></div>
          {recordsLoading && <div className="mz-muted" style={{ paddingTop:10 }}>加载中…</div>}
        </section>
      )}
    </div>
  );
}
