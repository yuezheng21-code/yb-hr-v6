const {useState,useEffect,useMemo,useCallback,useRef} = React;

// ── API BASE ──
const BASE = window.location.origin;
let _sessionExpired = false;

async function api(path, {method='GET', body, token} = {}) {
  const h = {'Content-Type':'application/json'};
  if (token) h['Authorization'] = 'Bearer ' + token;
  const r = await fetch(BASE + path, {method, headers:h, body: body ? JSON.stringify(body) : undefined});
  if (!r.ok) {
    // Token rejected by server (e.g. server restarted and lost in-memory session).
    // Clear stale credentials and return to the login screen.
    // Guard with _sessionExpired so concurrent 401 responses only trigger one reload.
    if (r.status === 401 && token && !_sessionExpired) {
      _sessionExpired = true;
      localStorage.removeItem('hr6_token');
      localStorage.removeItem('hr6_user');
      window.location.reload();
      return;
    }
    const e = await r.json().catch(()=>({detail:'Network error'}));
    throw new Error(e.detail || r.statusText);
  }
  return r.json();
}

// ── COLORS ──
const SC = {'已入账':'#2dd4a0','待财务确认':'#f97316','待仓库审批':'#f5a623','驳回':'#f0526c','在职':'#2dd4a0','离职':'#f0526c','自有':'#4f6ef7','供应商':'#f97316','渊博':'#4f6ef7','579':'#f97316','合作中':'#2dd4a0','有效':'#f0526c','已撤销':'#6a7498','进行中':'#f5a623','已完成':'#2dd4a0','A':'#2dd4a0','B':'#f5a623','C':'#f0526c'};
function Bg({t}) { const c=SC[t]||'#6a7498'; return <span className="bg" style={{background:c+'1a',color:c,border:`1px solid ${c}33`}}>{t}</span>; }
function fmt(n) { return typeof n==='number'?n.toFixed(2):'0.00'; }
function fmtE(n) { return (+(n||0)).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2}); }

// ── SHARED COMPONENTS ──
function Modal({title,onClose,children,footer,wide}) {
  return <div className="mo" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
    <div className="md" style={wide?{maxWidth:960}:{}}>
      <div className="md-h"><h3>{title}</h3><button className="md-x" onClick={onClose}>✕</button></div>
      <div className="md-b">{children}</div>
      {footer && <div className="md-f">{footer}</div>}
    </div>
  </div>;
}
function Spinner() { return <span className="spin">⟳</span>; }
function Loading() { return <div className="loading"><Spinner/> 加载中...</div>; }

// ── AUTH CONTEXT ──
const AuthCtx = React.createContext({});

// ── LOGIN ──
function Login({onLogin}) {
  const [mode,setMode]=useState('admin');
  const [u,su]=useState(''); const [p,sp]=useState(''); const [pin,setPin]=useState('');
  const [err,setErr]=useState(''); const [loading,setLoading]=useState(false);

  const doLogin = async () => {
    if(!u||!p){setErr('请填写用户名和密码');return;}
    setLoading(true); setErr('');
    try {
      const r = await api('/api/auth/login', {method:'POST', body:{username:u,password:p}});
      onLogin(r.token, r.user);
    } catch(e) { setErr(e.message); } finally { setLoading(false); }
  };
  const doPin = async () => {
    if(pin.length<4){setErr('请输入4位PIN');return;}
    setLoading(true); setErr('');
    try {
      const r = await api('/api/auth/pin', {method:'POST', body:{pin}});
      onLogin(r.token, r.user);
    } catch(e) { setErr(e.message); } finally { setLoading(false); }
  };

  return <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',zIndex:9999}}>
    <div style={{position:'absolute',inset:0,overflow:'hidden'}}><div style={{position:'absolute',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,#4f6ef720,transparent 70%)',top:-100,right:-100}}/></div>
    <div style={{position:'relative',width:380,background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:'var(--R3)',padding:'32px',boxShadow:'0 8px 40px #0008',animation:'fadeUp .4s ease'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <div className="sb-logo" style={{width:44,height:44,fontSize:20}}>渊</div>
        <div><div style={{fontSize:18,fontWeight:700}}>渊博+579 HR</div><div style={{fontSize:10,color:'var(--tx3)',letterSpacing:2}}>V6 · Warehouse Management</div></div>
      </div>
      <div className="tb" style={{marginBottom:20,width:'100%'}}>
        <button className={`tbn ${mode==='admin'?'on':''}`} style={{flex:1}} onClick={()=>setMode('admin')}>👔 管理员登录</button>
        <button className={`tbn ${mode==='worker'?'on':''}`} style={{flex:1}} onClick={()=>setMode('worker')}>👷 工人PIN</button>
      </div>
      {mode==='admin' ? <>
        <div style={{marginBottom:12}}><label className="fl">用户名</label><input className="fi" value={u} onChange={e=>{su(e.target.value);setErr('')}} onKeyDown={e=>e.key==='Enter'&&doLogin()} autoFocus/></div>
        <div style={{marginBottom:16}}><label className="fl">密码</label><input className="fi" type="password" value={p} onChange={e=>{sp(e.target.value);setErr('')}} onKeyDown={e=>e.key==='Enter'&&doLogin()}/></div>
        <button className="b bga bl" style={{width:'100%'}} onClick={doLogin} disabled={loading}>{loading?<Spinner/>:'登 录'}</button>
        <div style={{marginTop:10,fontSize:9,color:'var(--tx3)',textAlign:'center'}}>admin/admin123 · hr/hr123 · finance/fin123 · wh_una/una123 · sup001/sup123</div>
      </> : <>
        <div style={{marginBottom:16}}><label className="fl">工人PIN（4位）</label><input className="fi" type="tel" maxLength={4} style={{fontSize:24,textAlign:'center',letterSpacing:12}} value={pin} onChange={e=>{setPin(e.target.value.replace(/\D/g,''));setErr('')}} onKeyDown={e=>e.key==='Enter'&&doPin()} placeholder="••••"/></div>
        <button className="b bga bl" style={{width:'100%'}} onClick={doPin} disabled={loading}>{loading?<Spinner/>:'打卡入口'}</button>
        <div style={{marginTop:10,fontSize:9,color:'var(--tx3)',textAlign:'center'}}>测试PIN: 1001(张三) 1002(李四) 1003(王五)</div>
      </>}
      {err && <div style={{marginTop:8,fontSize:11,color:'var(--rd)',textAlign:'center'}}>{err}</div>}
    </div>
  </div>;
}

// ── DASHBOARD ──
function Dashboard({token}) {
  const [data,setData]=useState(null); const [loading,setLoading]=useState(true);
  useEffect(()=>{ api('/api/analytics/dashboard',{token}).then(setData).catch(()=>{}).finally(()=>setLoading(false)); },[]);
  if(loading) return <Loading/>;
  if(!data) return <div className="tm">加载失败</div>;
  const mx = Math.max(...(data.daily_hours||[]).map(d=>d.total_hours),1);
  return <div>
    <div className="sr">
      {[[data.employee_count,'在职员工','var(--cy)','👥'],[data.ts_pending,'待审批工时','var(--og)','⏳'],[data.ts_total_hours+'h','本期总工时','var(--pp)','⏱️'],[data.abmahnung_active,'有效Abmahnung','var(--rd)','⚠️'],[data.zeitkonto_alerts,'Zeitkonto预警','var(--og)','📊'],[data.wv_active_projects,'WV项目进行中','var(--gn)','📋']].map(([v,l,c,i],idx)=>
        <div key={idx} className="sc"><div className="sl">{i} {l}</div><div className="sv" style={{color:c}}>{v}</div></div>
      )}
    </div>
    {data.zeitkonto_alerts>0 && <div className="alert alert-og">⚠ <b>{data.zeitkonto_alerts}</b> 名员工 Zeitkonto 超过+150h，请安排 Freizeitausgleich（§4 ArbZG）</div>}
    {data.abmahnung_active>0 && <div className="alert alert-rd">⚠ <b>{data.abmahnung_active}</b> 份 Abmahnung 有效中，请检查是否有员工达到 Kündigung 条件</div>}
    <div className="cd"><div className="ct-t">📊 近7日工时分布</div>
      <div style={{display:'flex',alignItems:'flex-end',gap:8,height:100}}>
        {(data.daily_hours||[]).map((d,i)=><div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center'}}>
          <div style={{fontSize:9,color:'var(--tx3)',marginBottom:3}}>{d.total_hours}h</div>
          <div style={{width:'100%',background:'linear-gradient(180deg,var(--ac),var(--ac3))',borderRadius:'4px 4px 2px 2px',height:Math.max(4,(d.total_hours/mx)*88)}}/>
          <div style={{fontSize:8,color:'var(--tx3)',marginTop:3}}>{d.work_date?.slice(5)}</div>
        </div>)}
        {(data.daily_hours||[]).length===0 && <div style={{color:'var(--tx3)',fontSize:11,padding:'20px 0'}}>暂无工时数据</div>}
      </div>
    </div>
  </div>;
}

// ── EMPLOYEES ──
function Employees({token,user}) {
  const [emps,setEmps]=useState([]); const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState(''); const [fSt,setFSt]=useState('在职');
  const [editM,setEM]=useState(null); const [form,setForm]=useState({});

  const load = useCallback(()=>{
    setLoading(true);
    api(`/api/employees?search=${search}&status=${fSt}`,{token}).then(setEmps).finally(()=>setLoading(false));
  },[token,search,fSt]);
  useEffect(()=>{load();},[load]);

  const canEdit = ['admin','hr','mgr'].includes(user.role);
  const GRADES = ['P1','P2','P3','P4','P5','P6','P7','P8','P9'];
  const WHS = ['UNA','DHL','W579','AMZ','TEMU'];

  const openNew = () => { setForm({biz_line:'渊博',source:'自有',grade:'P1',settlement_type:'按小时',hourly_rate:13,status:'在职',contract_hours:8}); setEM('new'); };
  const openEdit = (e) => { setForm({...e}); setEM(e.id); };
  const save = async () => {
    try {
      if(editM==='new') await api('/api/employees',{method:'POST',body:form,token});
      else await api(`/api/employees/${editM}`,{method:'PUT',body:form,token});
      setEM(null); load();
    } catch(e) { alert(e.message); }
  };

  return <div>
    <div className="ab">
      <input className="si" placeholder="搜索姓名/ID/电话..." value={search} onChange={e=>setSearch(e.target.value)}/>
      {['','在职','离职'].map(s=><button key={s} className={`fb ${fSt===s?'on':''}`} onClick={()=>setFSt(s)}>{s||'全部'}</button>)}
      <div className="ml" style={{display:'flex',gap:6}}>
        {canEdit && <button className="b bga" onClick={openNew}>+ 新增员工</button>}
      </div>
    </div>
    {loading ? <Loading/> : <div className="tw"><div className="ts"><table>
      <thead><tr><th>ID</th><th>姓名</th><th>业务线</th><th>仓库</th><th>职位</th><th>级别</th><th>来源</th><th>时薪</th><th>状态</th><th>入职</th>{canEdit&&<th></th>}</tr></thead>
      <tbody>{emps.map(e=><tr key={e.id}>
        <td className="mn gn">{e.id}</td>
        <td className="fw6">{e.name}</td>
        <td><Bg t={e.biz_line}/></td>
        <td>{e.warehouse_code}</td>
        <td>{e.position}</td>
        <td><span style={{color:'var(--pp)',fontWeight:600}}>{e.grade}</span></td>
        <td><Bg t={e.source}/></td>
        <td className="mn">€{fmt(e.hourly_rate)}/h</td>
        <td><Bg t={e.status}/></td>
        <td className="tm">{e.join_date}</td>
        {canEdit && <td><button className="b bgh" onClick={()=>openEdit(e)}>编辑</button></td>}
      </tr>)}</tbody>
    </table></div></div>}

    {editM && <Modal title={editM==='new'?'新增员工':'编辑员工'} onClose={()=>setEM(null)}
      footer={<><button className="b bgh" onClick={()=>setEM(null)}>取消</button><button className="b bga" onClick={save}>保存</button></>}>
      <div className="fr">
        <div className="fg"><label className="fl">姓名 *</label><input className="fi" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/></div>
        <div className="fg"><label className="fl">电话</label><input className="fi" value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
        <div className="fg"><label className="fl">业务线</label><select className="fsl" value={form.biz_line||'渊博'} onChange={e=>setForm({...form,biz_line:e.target.value})}><option>渊博</option><option>579</option></select></div>
        <div className="fg"><label className="fl">仓库</label><select className="fsl" value={form.warehouse_code||''} onChange={e=>setForm({...form,warehouse_code:e.target.value})}><option value="">-</option>{WHS.map(w=><option key={w}>{w}</option>)}</select></div>
        <div className="fg"><label className="fl">职位</label><input className="fi" value={form.position||''} onChange={e=>setForm({...form,position:e.target.value})}/></div>
        <div className="fg"><label className="fl">职级</label><select className="fsl" value={form.grade||'P1'} onChange={e=>setForm({...form,grade:e.target.value})}>{GRADES.map(g=><option key={g}>{g}</option>)}</select></div>
        <div className="fg"><label className="fl">来源</label><select className="fsl" value={form.source||'自有'} onChange={e=>setForm({...form,source:e.target.value})}><option>自有</option><option>供应商</option></select></div>
        <div className="fg"><label className="fl">时薪 (€/h)</label><input className="fi" type="number" step="0.5" value={form.hourly_rate||13} onChange={e=>setForm({...form,hourly_rate:+e.target.value})}/></div>
        <div className="fg"><label className="fl">结算方式</label><select className="fsl" value={form.settlement_type||'按小时'} onChange={e=>setForm({...form,settlement_type:e.target.value})}><option>按小时</option><option>按件</option><option>按柜</option></select></div>
        <div className="fg"><label className="fl">合同工时/日</label><input className="fi" type="number" value={form.contract_hours||8} onChange={e=>setForm({...form,contract_hours:+e.target.value})}/></div>
        <div className="fg"><label className="fl">国籍</label><input className="fi" value={form.nationality||''} onChange={e=>setForm({...form,nationality:e.target.value})}/></div>
        <div className="fg"><label className="fl">入职日期</label><input className="fi" type="date" value={form.join_date||''} onChange={e=>setForm({...form,join_date:e.target.value})}/></div>
        <div className="fg"><label className="fl">报税方式</label><select className="fsl" value={form.tax_mode||'我方报税'} onChange={e=>setForm({...form,tax_mode:e.target.value})}><option>我方报税</option><option>供应商报税</option></select></div>
        <div className="fg"><label className="fl">PIN (4位)</label><input className="fi" maxLength={4} value={form.pin||''} onChange={e=>setForm({...form,pin:e.target.value.replace(/\D/g,'')})}/></div>
        <div className="fg ful"><label className="fl">备注</label><textarea className="fta" value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
      </div>
    </Modal>}
  </div>;
}

// ── TIMESHEETS ──
function Timesheets({token,user}) {
  const [ts,setTS]=useState([]); const [loading,setLoading]=useState(true);
  const [fSt,setFSt]=useState(''); const [addM,setAddM]=useState(false);
  const [form,setForm]=useState({work_date:new Date().toISOString().slice(0,10),start_time:'08:00',end_time:'16:00'});
  const [emps,setEmps]=useState([]);

  const load = () => { setLoading(true); api(`/api/timesheets?status=${fSt}`,{token}).then(setTS).finally(()=>setLoading(false)); };
  useEffect(()=>{ load(); api('/api/employees?status=在职',{token}).then(setEmps); },[fSt]);

  const canApproveWH = ['admin','wh','mgr'].includes(user.role);
  const canApproveFin = ['admin','fin'].includes(user.role);

  const approve = async (id) => {
    try { await api(`/api/timesheets/${id}/approve`,{method:'PUT',token}); load(); } catch(e) { alert(e.message); }
  };
  const addTS = async () => {
    try { await api('/api/timesheets',{method:'POST',body:form,token}); setAddM(false); load(); } catch(e) { alert(e.message); }
  };
  const batchApprove = async (ids) => {
    await api('/api/timesheets/batch-approve',{method:'PUT',body:{ids},token}); load();
  };

  const pending = ts.filter(t=>t.status==='待仓库审批'||t.status==='待财务确认');

  return <div>
    <div className="ab">
      {['','待仓库审批','待财务确认','已入账','驳回'].map(s=><button key={s} className={`fb ${fSt===s?'on':''}`} onClick={()=>setFSt(s)}>{s||'全部'}</button>)}
      <div className="ml" style={{display:'flex',gap:6}}>
        {pending.length>0 && canApproveWH && <button className="b bgn" onClick={()=>batchApprove(pending.map(t=>t.id))}>✓ 批量审批 ({pending.length})</button>}
        <button className="b bga" onClick={()=>setAddM(true)}>+ 录入工时</button>
      </div>
    </div>
    {loading ? <Loading/> : <div className="tw"><div className="ts"><table>
      <thead><tr><th>ID</th><th>员工</th><th>级别</th><th>仓库</th><th>日期</th><th>班次</th><th>工时</th><th>基础薪</th><th>班次+</th><th>实际率</th><th>Brutto</th><th>绩效</th><th>Net</th><th>状态</th><th>操作</th></tr></thead>
      <tbody>{ts.map(t=><tr key={t.id}>
        <td className="mn tm">{t.id?.slice(-10)}</td>
        <td className="fw6">{t.employee_name}</td>
        <td style={{color:'var(--pp)',fontWeight:600}}>{t.grade||'—'}</td>
        <td>{t.warehouse_code}</td>
        <td>{t.work_date}</td>
        <td><span style={{color:t.shift==='夜班'?'var(--pp)':t.shift==='周末'?'var(--og)':t.shift==='节假日'?'var(--rd)':'var(--tx3)',fontSize:10}}>{t.shift||'白班'}</span></td>
        <td className="mn fw6">{t.hours}h</td>
        <td className="mn tm">€{fmt(t.base_rate)}</td>
        <td className="mn" style={{color:t.shift_bonus>0?'var(--og)':'var(--tx3)'}}>+€{fmt(t.shift_bonus)}</td>
        <td className="mn fw6" style={{color:'var(--ac2)'}}>€{fmt(t.effective_rate)}</td>
        <td className="mn">€{fmt(t.gross_pay)}</td>
        <td className="mn" style={{color:t.perf_bonus>0?'var(--gn)':'var(--tx3)'}}>+€{fmt(t.perf_bonus)}</td>
        <td className="mn gn">€{fmt(t.net_pay)}</td>
        <td><Bg t={t.status}/></td>
        <td>{t.status==='待仓库审批'&&canApproveWH?<button className="b bgn" style={{fontSize:9}} onClick={()=>approve(t.id)}>✓仓库</button>:t.status==='待财务确认'&&canApproveFin?<button className="b bga" style={{fontSize:9}} onClick={()=>approve(t.id)}>✓财务</button>:<span className="tm" style={{fontSize:9}}>—</span>}</td>
      </tr>)}</tbody>
    </table></div></div>}

    {addM && <Modal title="录入工时" onClose={()=>setAddM(false)}
      footer={<><button className="b bgh" onClick={()=>setAddM(false)}>取消</button><button className="b bga" onClick={addTS}>提交</button></>}>
      <div className="fr">
        <div className="fg"><label className="fl">员工 *</label><select className="fsl" value={form.employee_id||''} onChange={e=>setForm({...form,employee_id:e.target.value})}><option value="">—选择员工—</option>{emps.map(e=><option key={e.id} value={e.id}>{e.name}（{e.id}）</option>)}</select></div>
        <div className="fg"><label className="fl">工作日期</label><input className="fi" type="date" value={form.work_date} onChange={e=>setForm({...form,work_date:e.target.value})}/></div>
        <div className="fg"><label className="fl">开始时间</label><input className="fi" type="time" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})}/></div>
        <div className="fg"><label className="fl">结束时间</label><input className="fi" type="time" value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})}/></div>
        <div className="fg"><label className="fl">仓库（留空=员工默认仓库）</label><input className="fi" value={form.warehouse_code||''} onChange={e=>setForm({...form,warehouse_code:e.target.value})}/></div>
        <div className="fg"><label className="fl">班次</label><select className="fsl" value={form.shift||'白班'} onChange={e=>setForm({...form,shift:e.target.value})}><option>白班</option><option>夜班</option><option>周末</option><option>节假日</option></select></div>
        <div className="fg"><label className="fl">备注</label><input className="fi" value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
      </div>
      <div className="alert alert-ac">工时、Brutto、SSI、Net 由系统根据员工时薪自动计算</div>
    </Modal>}
  </div>;
}

// ── ZEITKONTO ──
function Zeitkonto({token,user}) {
  const [zk,setZK]=useState([]); const [loading,setLoading]=useState(true);
  const [sel,setSel]=useState(null); const [logs,setLogs]=useState([]);
  const [addM,setAddM]=useState(false);
  const [form,setForm]=useState({employee_id:'',log_date:new Date().toISOString().slice(0,10),entry_type:'plus',hours:'',reason:''});

  const load = () => { setLoading(true); api('/api/zeitkonto',{token}).then(setZK).finally(()=>setLoading(false)); };
  useEffect(()=>{ load(); },[]);

  const selRow = zk.find(z=>z.employee_id===sel);
  const openLogs = (id) => { setSel(id); api(`/api/zeitkonto/${id}/logs`,{token}).then(setLogs); };
  const addLog = async () => {
    try { await api(`/api/zeitkonto/${form.employee_id}/log`,{method:'POST',body:{...form,hours:+form.hours},token}); setAddM(false); load(); } catch(e) { alert(e.message); }
  };
  const doFreizeitausgleich = async (id,hrs) => {
    const h = prompt(`为 ${id} 安排 Freizeitausgleich，输入消化工时（h）：`);
    if(!h) return;
    await api(`/api/zeitkonto/${id}/freizeitausgleich`,{method:'PUT',body:{hours:+h},token});
    load();
  };

  const canEdit = ['admin','hr','mgr'].includes(user.role);
  const getStatus = (z) => {
    if(z.plus_hours>200||z.daily_max>10) return {c:'var(--rd)',t:'⛔ 违规'};
    if(z.plus_hours>150) return {c:'var(--og)',t:'⚠ 预警'};
    if(z.minus_hours>20) return {c:'var(--pp)',t:'⚠ 亏时'};
    return {c:'var(--gn)',t:'✓ 合规'};
  };

  const alerts = zk.filter(z=>z.plus_hours>150||z.daily_max>10);

  return <div>
    {alerts.length>0 && <div style={{marginBottom:12}}>
      {alerts.map((z,i)=><div key={i} className={`alert ${z.daily_max>10||z.plus_hours>200?'alert-rd':'alert-og'}`}>
        {z.daily_max>10?'⛔':'⚠️'} <b>{z.employee_name}</b>: {z.plus_hours>200?`Zeitkonto超上限 +${z.plus_hours}h`:z.daily_max>10?`日工时超法定上限 ${z.daily_max}h (§4 ArbZG)`:z.plus_hours>150?`需安排Freizeitausgleich +${z.plus_hours}h`:''}
      </div>)}
    </div>}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
      <div className="tm" style={{fontSize:10}}>§4 ArbZG: 10h/日上限 · Zeitkonto上限+200h · MTV DGB/GVP 2026</div>
      {canEdit && <button className="b bga" onClick={()=>setAddM(true)}>+ 手动录入</button>}
    </div>
    {loading ? <Loading/> : <div className="tw"><div className="ts"><table>
      <thead><tr><th>员工</th><th>仓库</th><th>级别</th><th>Plusstunden</th><th>Minusstunden</th><th>日最高工时</th><th>合规状态</th><th></th></tr></thead>
      <tbody>{zk.map(z=>{const s=getStatus(z);return<tr key={z.employee_id} onClick={()=>openLogs(z.employee_id)} style={{cursor:'pointer',background:sel===z.employee_id?'#4f6ef710':''}}>
        <td className="fw6">{z.employee_name}<br/><span className="mn tm">{z.employee_id}</span></td>
        <td>{z.warehouse_code}</td>
        <td style={{color:'var(--pp)'}}>{z.grade}</td>
        <td style={{color:z.plus_hours>150?'var(--rd)':z.plus_hours>80?'var(--og)':'var(--gn)',fontFamily:'monospace',fontWeight:700}}>+{z.plus_hours}h</td>
        <td style={{color:z.minus_hours>0?'var(--pp)':'var(--tx3)',fontFamily:'monospace'}}>-{z.minus_hours}h</td>
        <td style={{color:z.daily_max>10?'var(--rd)':z.daily_max>9?'var(--og)':'var(--tx)',fontFamily:'monospace'}}>{z.daily_max||'—'}h</td>
        <td><span className="bg" style={{background:s.c+'22',color:s.c,border:`1px solid ${s.c}44`}}>{s.t}</span></td>
        <td>{z.plus_hours>150&&canEdit&&<button className="b bgo" style={{fontSize:9}} onClick={e=>{e.stopPropagation();doFreizeitausgleich(z.employee_id,z.plus_hours)}}>安排休息</button>}</td>
      </tr>;})}
      </tbody>
    </table></div></div>}

    {sel && selRow && <div className="cd" style={{marginTop:12}}>
      <div className="ct-t">📊 {selRow.employee_name} — Zeitkonto 明细</div>
      <div className="g4" style={{marginBottom:12}}>
        {[['Plusstunden','+'+selRow.plus_hours+'h','var(--gn)'],['Minusstunden','-'+selRow.minus_hours+'h','var(--pp)'],['日最高',selRow.daily_max+'h',selRow.daily_max>10?'var(--rd)':'var(--tx)'],['超10h天数',(selRow.over10_days||0)+'天',selRow.over10_days>0?'var(--rd)':'var(--tx3)']].map(([l,v,c])=>
          <div key={l} style={{padding:12,background:'var(--bg3)',borderRadius:8,border:'1px solid var(--bd)'}}><div className="sl">{l}</div><div className="sv" style={{color:c,fontSize:18}}>{v}</div></div>
        )}
      </div>
      {selRow.plus_hours>200 && <div className="alert alert-rd">⛔ 违规：超过+200h上限。须立即安排强制休息，否则违反 MTV DGB/GVP 规定。</div>}
      {selRow.plus_hours>150 && selRow.plus_hours<=200 && <div className="alert alert-og">⚠ 预警：超过+150h，须主动安排 Freizeitausgleich，不可等员工申请。</div>}
      {selRow.daily_max>10 && <div className="alert alert-rd">⛔ 发现日工时 {selRow.daily_max}h 超过法定10h（§4 ArbZG），雇主须主动阻止，违规罚款最高€30,000。</div>}
      <div className="tw"><table>
        <thead><tr><th>日期</th><th>类型</th><th>工时</th><th>原因</th><th>录入人</th></tr></thead>
        <tbody>{logs.map((l,i)=><tr key={i}>
          <td>{l.log_date}</td>
          <td style={{color:l.entry_type==='plus'?'var(--gn)':l.entry_type==='freizeitausgleich'?'var(--pp)':'var(--rd)'}}>{l.entry_type==='plus'?'+ Plusstunden':l.entry_type==='freizeitausgleich'?'↓ Freizeitausgleich':'- Minusstunden'}</td>
          <td className="mn">{l.hours}h</td>
          <td>{l.reason}</td>
          <td className="tm">{l.approved_by}</td>
        </tr>)}
        {logs.length===0 && <tr><td colSpan={5} style={{textAlign:'center',color:'var(--tx3)',padding:16}}>暂无手动记录</td></tr>}
        </tbody>
      </table></div>
    </div>}

    {addM && <Modal title="手动录入 Zeitkonto" onClose={()=>setAddM(false)}
      footer={<><button className="b bgh" onClick={()=>setAddM(false)}>取消</button><button className="b bga" onClick={addLog}>保存</button></>}>
      <div className="fr">
        <div className="fg"><label className="fl">员工</label><select className="fsl" value={form.employee_id} onChange={e=>setForm({...form,employee_id:e.target.value})}><option value="">—选择—</option>{zk.map(z=><option key={z.employee_id} value={z.employee_id}>{z.employee_name}（{z.employee_id}）</option>)}</select></div>
        <div className="fg"><label className="fl">日期</label><input className="fi" type="date" value={form.log_date} onChange={e=>setForm({...form,log_date:e.target.value})}/></div>
        <div className="fg"><label className="fl">类型</label><select className="fsl" value={form.entry_type} onChange={e=>setForm({...form,entry_type:e.target.value})}><option value="plus">+ Plusstunden（加班）</option><option value="minus">- Minusstunden（短时）</option></select></div>
        <div className="fg"><label className="fl">工时（h）</label><input className="fi" type="number" step="0.5" value={form.hours} onChange={e=>setForm({...form,hours:e.target.value})}/></div>
        <div className="fg ful"><label className="fl">原因说明</label><input className="fi" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}/></div>
      </div>
    </Modal>}
  </div>;
}

// ── ABMAHNUNG ──
function Abmahnung({token,user}) {
  const [abms,setAbms]=useState([]); const [loading,setLoading]=useState(true);
  const [addM,setAddM]=useState(false); const [previewM,setPreviewM]=useState(null);
  const [emps,setEmps]=useState([]);
  const today = new Date().toISOString().slice(0,10);
  const [form,setForm]=useState({employee_id:'',abmahnung_type:'旷工（Unentschuldigtes Fehlen）',incident_date:today,issued_date:today,incident_description:'',internal_notes:'',delivery_method:'面交'});

  const TYPES = ['旷工（Unentschuldigtes Fehlen）','擅自超时（Eigenmächtige Arbeitszeitverlängerung）','多次迟到（Wiederholte Verspätung）','工时违规（ArbZG Verstoß）','其他违约行为'];

  const load = () => { setLoading(true); api('/api/abmahnungen',{token}).then(setAbms).finally(()=>setLoading(false)); };
  useEffect(()=>{ load(); api('/api/employees?status=在职',{token}).then(setEmps); },[]);

  const save = async () => {
    if(!form.employee_id||!form.incident_description){alert('请填写员工和违约事实');return;}
    try { await api('/api/abmahnungen',{method:'POST',body:form,token}); setAddM(false); load(); } catch(e) { alert(e.message); }
  };
  const revoke = async (id) => {
    const reason = prompt('撤销原因：');
    if(!reason) return;
    await api(`/api/abmahnungen/${id}/revoke`,{method:'PUT',body:{reason},token}); load();
  };

  // Group by employee to find Kündigung candidates
  const empCounts = {};
  abms.forEach(a=>{ if(a.status==='有效') empCounts[a.employee_id]=(empCounts[a.employee_id]||0)+1; });
  const kandidaten = Object.entries(empCounts).filter(([,c])=>c>=2).map(([id,c])=>({id,name:abms.find(a=>a.employee_id===id)?.employee_name||id,count:c}));

  const genLetter = (a) => {
    const emp = emps.find(e=>e.id===a.employee_id)||{name:a.employee_name,address:'—'};
    const isOT = a.abmahnung_type?.includes('超时');
    return `<div style="font-family:system-ui,sans-serif;padding:28px;max-width:640px;font-size:12px;line-height:1.8;color:#111">
      <div style="display:flex;justify-content:space-between;border-bottom:2px solid #1B2B4B;padding-bottom:14px;margin-bottom:18px">
        <div><div style="font-size:18px;font-weight:800;color:#1B2B4B">Yuanbo GmbH</div><div style="font-size:9px;color:#666">Personalmanagement · HR-DISZ-001</div></div>
        <div style="text-align:right;font-size:10px;color:#666">${a.issued_date}<br/>Nr.: ${a.id}</div>
      </div>
      <div style="margin-bottom:18px">An:<br/><b>${emp.name}</b><br/>${emp.address||'—'}</div>
      <div style="font-size:15px;font-weight:800;color:#DC2626;margin-bottom:14px;letter-spacing:1px">ABMAHNUNG</div>
      <div style="background:#FEF2F2;border-left:3px solid #DC2626;padding:12px;border-radius:0 6px 6px 0;margin-bottom:14px"><b>I. Sachverhaltsdarstellung（事实描述）</b><br/>${a.incident_description}</div>
      <div style="margin-bottom:12px"><b>II. Rüge（指责）</b><br/>您的上述行为违反了劳动合同义务（§611a BGB）${isOT?"及雇主基于§106 GewO发出的工时指令。本次未批准超时 [X]h 不计入 Zeitkonto。":"。"}</div>
      <div style="margin-bottom:12px"><b>III. Aufforderung zur Verhaltensänderung（改正要求）</b><br/>我方要求您立即停止上述违约行为，严格遵守合同规定。</div>
      <div style="background:#FFF7ED;border:1px solid #FED7AA;padding:12px;border-radius:6px;margin-bottom:14px"><b>IV. Warnung（警告）</b><br/>如您再次发生类似违约行为，我方将不再发出额外警告，<b>直接启动劳动合同解除程序（Kündigung des Arbeitsverhältnisses）</b>。</div>
      <div style="font-size:10px;color:#666;margin-bottom:24px">V. Hinweis: 您有权将书面反驳意见（Gegendarstellung）附入个人档案（Personalakte）。<br/>有效期2年 · 档案编号：${a.id}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:50px;margin-top:36px">
        <div><div style="border-top:1px solid #aaa;padding-top:6px;font-size:10px;color:#666">渊博 GmbH · ${a.issued_by||'HR'} · Datum/Unterschrift</div></div>
        <div><div style="border-top:1px solid #aaa;padding-top:6px;font-size:10px;color:#666">${emp.name} · Empfang bestätigt · Datum</div></div>
      </div>
    </div>`;
  };

  return <div>
    {kandidaten.length>0 && <div className="alert alert-rd">
      ⛔ <b>Kündigung-Eignung:</b> {kandidaten.map(k=>`${k.name}（${k.count}次有效Abmahnung）`).join('、')} — 已具备 verhaltensbedingte Kündigung 条件，建议咨询劳动法律顾问
    </div>}
    <div className="alert alert-ac">
      BAG GS 1/84 要求 Abmahnung 须满足：① 具体事实 ② 书面形式 ③ 改正要求 ④ 解职警告 ⑤ 可证明送达 ⑥ 14天内发出
    </div>
    <div style={{display:'flex',justifyContent:'flex-end',marginBottom:10}}>
      <button className="b bgr" onClick={()=>setAddM(true)}>⚠ 发出 Abmahnung</button>
    </div>
    {loading ? <Loading/> : <>
      {abms.length===0 && <div style={{textAlign:'center',padding:40,color:'var(--tx3)'}}>暂无 Abmahnung 记录</div>}
      <div className="tw"><table>
        <thead><tr><th>档案号</th><th>员工</th><th>类型</th><th>违约日期</th><th>发出日期</th><th>有效至</th><th>发出人</th><th>状态</th><th>次数</th><th>操作</th></tr></thead>
        <tbody>{abms.map(a=><tr key={a.id}>
          <td className="mn tm">{a.id}</td>
          <td className="fw6">{a.employee_name}</td>
          <td style={{fontSize:9,maxWidth:160}}>{a.abmahnung_type}</td>
          <td>{a.incident_date}</td>
          <td>{a.issued_date}</td>
          <td style={{color:a.status==='有效'?'var(--rd)':'var(--tx3)'}}>{a.expiry_date}</td>
          <td>{a.issued_by}</td>
          <td><Bg t={a.status}/></td>
          <td>{a._valid_count>0 && <span style={{color:a._valid_count>=2?'var(--rd)':'var(--og)',fontWeight:700}}>{a._valid_count}次</span>}</td>
          <td style={{display:'flex',gap:4}}>
            <button className="b bgh" style={{fontSize:9}} onClick={()=>setPreviewM(a)}>📄</button>
            {a.status==='有效' && <button className="b" style={{fontSize:9,background:'var(--tx3)22',color:'var(--tx3)'}} onClick={()=>revoke(a.id)}>撤销</button>}
          </td>
        </tr>)}
        </tbody>
      </table></div>
    </>}

    {addM && <Modal title="⚠️ 发出 Abmahnung" onClose={()=>setAddM(false)}
      footer={<><button className="b bgh" onClick={()=>setAddM(false)}>取消</button><button className="b bgr" onClick={save}>正式发出</button></>}>
      <div className="alert alert-og">须在发现违约后14天内发出。发出前确认事实具体、可证明送达。</div>
      <div className="fr">
        <div className="fg"><label className="fl">员工 *</label><select className="fsl" value={form.employee_id} onChange={e=>setForm({...form,employee_id:e.target.value})}><option value="">—选择—</option>{emps.map(e=><option key={e.id} value={e.id}>{e.name}（{e.id}）</option>)}</select></div>
        <div className="fg"><label className="fl">违规类型 *</label><select className="fsl" value={form.abmahnung_type} onChange={e=>setForm({...form,abmahnung_type:e.target.value})}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
        <div className="fg"><label className="fl">违约发生日期</label><input className="fi" type="date" value={form.incident_date} onChange={e=>setForm({...form,incident_date:e.target.value})}/></div>
        <div className="fg"><label className="fl">Abmahnung发出日期</label><input className="fi" type="date" value={form.issued_date} onChange={e=>setForm({...form,issued_date:e.target.value})}/></div>
        <div className="fg"><label className="fl">送达方式</label><select className="fsl" value={form.delivery_method} onChange={e=>setForm({...form,delivery_method:e.target.value})}><option>面交（员工签收）</option><option>挂号信（Einschreiben）</option></select></div>
        <div className="fg ful"><label className="fl">I. 违约事实描述 * （须具体：日期/时间/行为/我方应对记录）</label><textarea className="fta" rows={4} value={form.incident_description} onChange={e=>setForm({...form,incident_description:e.target.value})} placeholder="例：员工于2026年3月10日（周二）未通知我方，未到UNA仓库工作。我方于08:15、10:30两次电话联系，均无人接听。截至2026年3月12日，员工未提交任何请假申请或AU-Bescheinigung。"/></div>
        <div className="fg ful"><label className="fl">内部备注（不写入正式Abmahnung）</label><textarea className="fta" value={form.internal_notes} onChange={e=>setForm({...form,internal_notes:e.target.value})}/></div>
      </div>
    </Modal>}

    {previewM && <Modal title={`Abmahnung 预览 — ${previewM.employee_name}`} onClose={()=>setPreviewM(null)} wide
      footer={<><button className="b bga" onClick={()=>window.print()}>⎙ 打印</button><button className="b bgh" onClick={()=>setPreviewM(null)}>关闭</button></>}>
      <div dangerouslySetInnerHTML={{__html:genLetter(previewM)}} style={{background:'white',borderRadius:8,padding:16}}/>
    </Modal>}
  </div>;
}

// ── WERKVERTRAG ──
const WV_PHASES=['立项','测算','报价','合规','备人','培训','运营','撤离'];
const WV_COMP_ITEMS=[
  {id:'wv1',cat:'Werkvertrag',lbl:'Werkerfolg清晰定义（§631 BGB），非劳动时间',crit:true},
  {id:'wv2',cat:'Werkvertrag',lbl:'工人仅接受渊博方指令，不受客户直接指挥',crit:true},
  {id:'wv3',cat:'Werkvertrag',lbl:'渊博提供自有PPE和作业器具',crit:true},
  {id:'aug1',cat:'AÜG边界',lbl:'无 Arbeitnehmerüberlassung 认定风险',crit:true},
  {id:'aug2',cat:'AÜG边界',lbl:'工人未纳入客户组织架构',crit:true},
  {id:'mw1',cat:'Mindestlohn',lbl:'所有人员时薪 ≥ €13.00（MiLoG）',crit:true},
  {id:'mw2',cat:'Mindestlohn',lbl:'Arbeitszeitaufzeichnung 完整留存',crit:true},
  {id:'ap1',cat:'工作许可',lbl:'EU公民：Freizügigkeit 已确认',crit:true},
  {id:'ap2',cat:'工作许可',lbl:'非EU：Arbeitserlaubnis 有效核查',crit:true},
  {id:'as1',cat:'安全/BG',lbl:'BG Unfallversicherung 登记，Gefährdungsbeurteilung 完成',crit:true},
  {id:'as2',cat:'安全/BG',lbl:'安全 Unterweisung 已记录签字',crit:true},
  {id:'dsgvo',cat:'DSGVO',lbl:'员工数据仅存EU合规服务器',crit:false},
];

function Werkvertrag({token,user}) {
  const [projs,setProjs]=useState([]); const [loading,setLoading]=useState(true);
  const [selId,setSelId]=useState(null); const [ph,setPh]=useState(0);
  const [newM,setNewM]=useState(false);
  const [form,setForm]=useState({name:'',client:'',service_type:'',region:'',project_manager:''});
  const SERVICES=['卸柜承包','装卸承包','入库承包','出库承包','区域承包','快转/分拣承包','综合承包'];
  const REGIONS=['南部大区 (Köln/Düsseldorf)','鲁尔西大区 (Duisburg/Essen)','鲁尔东大区 (Dortmund/Unna)'];

  const load = ()=>{ setLoading(true); api('/api/werkvertrag',{token}).then(setProjs).finally(()=>setLoading(false)); };
  useEffect(()=>{ load(); },[]);

  const selP = projs.find(p=>p.id===selId);
  const canEdit = ['admin','hr','mgr'].includes(user.role);

  const createProj = async ()=>{
    if(!form.name){alert('请填写项目名称');return;}
    try{ const r=await api('/api/werkvertrag',{method:'POST',body:form,token}); setSelId(r.id); setPh(0); setNewM(false); load(); }catch(e){alert(e.message);}
  };
  const updateProj = async (upd)=>{
    if(!selId) return;
    try{ await api(`/api/werkvertrag/${selId}`,{method:'PUT',body:upd,token}); load(); }catch(e){alert(e.message);}
  };

  const calcCost=(c={})=>{
    const workers=c.workers||[];
    const lb=workers.reduce((s,w)=>s+(w.count||0)*(w.hoursDay||0)*(w.days||0)*(w.rate||13),0);
    const soc=lb*((c.soc||21)/100), hol=lb*((c.hol||8)/100), mgmt=lb*((c.mgmt||18)/100);
    const sub=lb+soc+hol+mgmt+(+c.equip||0)+(+c.travel||0);
    const tot=sub+sub*((c.overhead||5)/100);
    const price=tot/(1-((c.margin||15)/100));
    return {lb,soc,hol,mgmt,tot,price,margin:price-tot};
  };

  const compOk = selP ? WV_COMP_ITEMS.filter(i=>selP.comp_data?.[i.id]==='ok').length : 0;
  const compCritFail = selP ? WV_COMP_ITEMS.filter(i=>i.crit&&selP.comp_data?.[i.id]==='fail').length : 0;

  return <div style={{display:'flex',gap:12,height:'calc(100vh - 120px)'}}>
    {/* Project list */}
    <div style={{width:210,flexShrink:0,display:'flex',flexDirection:'column',gap:8}}>
      {canEdit && <button className="b bga" style={{width:'100%'}} onClick={()=>setNewM(true)}>+ 新建项目</button>}
      <div style={{flex:1,overflowY:'auto'}}>
        {loading ? <Loading/> : projs.length===0 ? <div className="tm" style={{textAlign:'center',padding:20,fontSize:11}}>暂无项目</div> :
          projs.map(p=><div key={p.id} className={`proj-card ${selId===p.id?'sel':''}`} onClick={()=>{setSelId(p.id);setPh(p.phase);}}>
            <div style={{fontWeight:700,fontSize:12,marginBottom:3}}>{p.name}</div>
            <div className="tm" style={{fontSize:9,marginBottom:6}}>{p.client||'—'}</div>
            <div style={{fontSize:9,color:'var(--tx3)',display:'flex',justifyContent:'space-between',marginBottom:3}}><span>{WV_PHASES[p.phase]}</span><span>{Math.round((p.phase/7)*100)}%</span></div>
            <div className="prog-wrap"><div className="prog-fill" style={{width:Math.round((p.phase/7)*100)+'%',background:'var(--ac)'}}/></div>
            {p.closed && <div style={{fontSize:9,color:'var(--gn)',marginTop:4}}>✓ 已归档</div>}
          </div>)
        }
      </div>
    </div>

    {/* Detail */}
    <div style={{flex:1,overflowY:'auto'}}>
      {!selP ? <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--tx3)'}}>← 选择项目或新建</div> : <>
        <div style={{display:'flex',gap:3,flexWrap:'wrap',marginBottom:12,background:'var(--bg3)',padding:3,borderRadius:10}}>
          {WV_PHASES.map((p2,i)=><button key={i} onClick={()=>setPh(i)} style={{padding:'5px 10px',borderRadius:7,border:'none',fontFamily:'inherit',fontSize:10,fontWeight:600,cursor:'pointer',background:ph===i?'var(--ac)':'transparent',color:ph===i?'#fff':i<selP.phase?'var(--gn)':'var(--tx3)'}}>{i<selP.phase?'✓ ':''}{p2}</button>)}
        </div>

        {/* Phase 0 */}
        {ph===0 && <div className="cd">
          <div className="ct-t">① 项目立项 · Projekteröffnung</div>
          <div className="fr">
            {[['项目名称','name'],['客户/仓库','client'],['地址','address'],['服务类型','service_type'],['大区','region'],['项目负责人','project_manager']].map(([l,k])=>
              <div key={k} className="fg"><label className="fl">{l}</label>
                {k==='service_type'?<select className="fsl" value={selP[k]||''} onChange={e=>updateProj({[k]:e.target.value})}><option value="">—</option>{SERVICES.map(s=><option key={s}>{s}</option>)}</select>:k==='region'?<select className="fsl" value={selP[k]||''} onChange={e=>updateProj({[k]:e.target.value})}><option value="">—</option>{REGIONS.map(s=><option key={s}>{s}</option>)}</select>:<input className="fi" defaultValue={selP[k]||''} onBlur={e=>updateProj({[k]:e.target.value})}/>}
              </div>)}
            <div className="fg"><label className="fl">开始</label><input className="fi" type="date" defaultValue={selP.start_date||''} onBlur={e=>updateProj({start_date:e.target.value})}/></div>
            <div className="fg"><label className="fl">结束（留空=长期）</label><input className="fi" type="date" defaultValue={selP.end_date||''} onBlur={e=>updateProj({end_date:e.target.value})}/></div>
            <div className="fg ful"><label className="fl">Werkerfolg 描述（合同核心：成果而非工时）</label><textarea className="fta" defaultValue={selP.description||''} onBlur={e=>updateProj({description:e.target.value})} placeholder="描述约定的成果：X个柜/X件货物处理、质量标准、交付方式..."/></div>
          </div>
          <button className="b bga" onClick={()=>updateProj({phase:Math.max(selP.phase,1)})}>确认 → 成本测算</button>
        </div>}

        {/* Phase 1 */}
        {ph===1 && (()=>{
          const c=selP.cost_data||{workers:[{label:'P1-P2',rate:13,count:5,hoursDay:8,days:20}],soc:21,hol:8,mgmt:18,equip:0,travel:0,overhead:5,margin:15};
          const cv=calcCost(c);
          const updW=(idx,k,v)=>{const ws=[...c.workers];ws[idx]={...ws[idx],[k]:v};updateProj({cost_data:{...c,workers:ws}});};
          return <div className="cd">
            <div className="ct-t">② 成本测算 · Kostenkalkulation</div>
            <div style={{overflowX:'auto'}}><table style={{fontSize:11}}>
              <thead><tr><th>人员组</th><th>时薪(€)</th><th>人数</th><th>h/日</th><th>天数</th><th>小计(€)</th><th></th></tr></thead>
              <tbody>{c.workers.map((w,i)=><tr key={i}>
                <td><input className="fi" value={w.label} style={{width:110}} onBlur={e=>updW(i,'label',e.target.value)}/></td>
                <td><input className="fi" type="number" value={w.rate} step="0.5" style={{width:70}} onChange={e=>updW(i,'rate',+e.target.value)}/></td>
                <td><input className="fi" type="number" value={w.count} style={{width:60}} onChange={e=>updW(i,'count',+e.target.value)}/></td>
                <td><input className="fi" type="number" value={w.hoursDay} step="0.5" style={{width:60}} onChange={e=>updW(i,'hoursDay',+e.target.value)}/></td>
                <td><input className="fi" type="number" value={w.days} style={{width:60}} onChange={e=>updW(i,'days',+e.target.value)}/></td>
                <td className="mn">€{fmtE((w.count||0)*(w.hoursDay||0)*(w.days||0)*(w.rate||13))}</td>
                <td><button className="b bgr" style={{fontSize:9}} onClick={()=>updateProj({cost_data:{...c,workers:c.workers.filter((_,j)=>j!==i)}})}>✕</button></td>
              </tr>)}</tbody>
            </table></div>
            <button className="b bgh" style={{fontSize:10,margin:'8px 0 14px'}} onClick={()=>updateProj({cost_data:{...c,workers:[...c.workers,{label:'P1',rate:13,count:3,hoursDay:8,days:10}]}})}>+ 人员组</button>
            <div className="fr3">
              {[['SV %',c.soc,'soc'],['假期 %',c.hol,'hol'],['管理 %',c.mgmt,'mgmt'],['设备 €',c.equip,'equip'],['差旅 €',c.travel,'travel'],['Overhead %',c.overhead,'overhead'],['利润率 %',c.margin,'margin']].map(([l,v,k])=>
                <div key={k} className="fg"><label className="fl">{l}</label><input className="fi" type="number" value={v} step="0.5" onChange={e=>updateProj({cost_data:{...c,[k]:+e.target.value}})}/></div>
              )}
            </div>
            <div style={{background:'#11141d',borderRadius:10,padding:16,color:'#fff',marginTop:4}}>
              {[['Bruttoarbeitslohn','var(--tx2)',fmtE(cv.lb)],[`SV (${c.soc||21}%)`,'var(--tx2)',fmtE(cv.soc)],[`假期 (${c.hol||8}%)`,'var(--tx2)',fmtE(cv.hol)],[`管理 (${c.mgmt||18}%)`,'var(--tx2)',fmtE(cv.mgmt)],['设备+差旅','var(--tx2)',fmtE((+c.equip||0)+(+c.travel||0))],[`Overhead (${c.overhead||5}%)`,'var(--tx2)',fmtE(cv.tot-cv.lb-cv.soc-cv.hol-cv.mgmt)],['总成本','#fff',fmtE(cv.tot)]].map(([l,tc,v])=>
                <div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 0',borderBottom:'1px solid #ffffff12',color:tc}}><span>{l}</span><span style={{fontFamily:'monospace'}}>€{v}</span></div>
              )}
              <div style={{display:'flex',justifyContent:'space-between',fontSize:15,fontWeight:800,padding:'10px 0 0',color:'var(--og)'}}><span>建议报价 (Marge {c.margin||15}%)</span><span style={{fontFamily:'monospace'}}>€{fmtE(cv.price)}</span></div>
              <div style={{fontSize:9,color:'rgba(255,255,255,.4)',marginTop:4}}>净利润: €{fmtE(cv.margin)} · 实际Marge: {cv.price>0?(cv.margin/cv.price*100).toFixed(1):0}%</div>
            </div>
            <button className="b bga" style={{marginTop:12}} onClick={()=>updateProj({phase:Math.max(selP.phase,2)})}>成本确认 → 报价</button>
          </div>;
        })()}

        {/* Phase 2 */}
        {ph===2 && (()=>{
          const c=selP.cost_data||{};const cv=calcCost(c);
          return <div className="cd">
            <div className="ct-t">③ 报价预览 · Angebotserstellung</div>
            <div style={{background:'white',borderRadius:10,padding:24,marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
                <div><div style={{fontSize:18,fontWeight:800,color:'#1B2B4B'}}>Yuanbo GmbH</div><div style={{fontSize:9,color:'#666'}}>Werkvertrag · §631 BGB</div></div>
                <div style={{textAlign:'right',fontSize:10,color:'#F59E0B',fontWeight:700}}>ANGEBOT</div>
              </div>
              <div style={{fontSize:11,color:'#111',marginBottom:12}}>An: <b>{selP.client||'[Kunde]'}</b><br/>{selP.address}<br/><br/>Betreff: {selP.name}<br/>Leistungsart: {selP.service_type}<br/>Zeitraum: {selP.start_date||'—'} bis {selP.end_date||'offen'}</div>
              <div style={{borderTop:'2px solid #1B2B4B',paddingTop:12}}>
                {[['Nettobetrag','#111',fmtE(cv.price)],['zzgl. 19% MwSt.','#666',fmtE(cv.price*0.19)],['Gesamt inkl. MwSt.','#1B2B4B',fmtE(cv.price*1.19)]].map(([l,c2,v])=>
                  <div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:l.includes('Gesamt')?14:11,fontWeight:l.includes('Gesamt')?800:400,color:c2,padding:'4px 0'}}><span>{l}</span><span style={{fontFamily:'monospace'}}>€{v}</span></div>
                )}
              </div>
            </div>
            <button className="b bga" onClick={()=>updateProj({phase:Math.max(selP.phase,3),quote_approved:1})}>报价确认 → 合规审查</button>
          </div>;
        })()}

        {/* Phase 3 */}
        {ph===3 && <div className="cd">
          <div className="ct-t">④ 合规审查 · Compliance-Prüfung</div>
          {compCritFail>0 && <div className="alert alert-rd">⛔ {compCritFail}项关键合规不通过 — 禁止上岗</div>}
          <div style={{fontSize:10,color:'var(--tx3)',marginBottom:10}}>已通过 {compOk}/{WV_COMP_ITEMS.length} · 关键项未通过: {compCritFail}</div>
          {['Werkvertrag','AÜG边界','Mindestlohn','工作许可','安全/BG','DSGVO'].map(cat=><div key={cat} style={{marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:700,color:'var(--ac2)',marginBottom:6}}>▸ {cat}</div>
            {WV_COMP_ITEMS.filter(i=>i.cat===cat).map(item=><div key={item.id} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderBottom:'1px solid var(--bd)30'}}>
              <div style={{display:'flex',gap:5}}>
                {['ok','fail'].map(v=><div key={v} onClick={()=>{const nd={...selP.comp_data};nd[item.id]===v?delete nd[item.id]:nd[item.id]=v;updateProj({comp_data:nd});}} style={{width:16,height:16,borderRadius:4,cursor:'pointer',border:`2px solid ${selP.comp_data?.[item.id]===v?(v==='ok'?'var(--gn)':'var(--rd)'):'var(--bd)'}`,background:selP.comp_data?.[item.id]===v?(v==='ok'?'var(--gn)':'var(--rd)'):'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'#fff',flexShrink:0}}>{selP.comp_data?.[item.id]===v?(v==='ok'?'✓':'✕'):''}</div>)}
              </div>
              <span style={{fontSize:11}}>{item.lbl} {item.crit&&<span style={{fontSize:8,padding:'1px 5px',borderRadius:3,background:'#f0526c22',color:'var(--rd)',border:'1px solid #f0526c44'}}>必须</span>}</span>
            </div>)}
          </div>)}
          <button className="b bga" disabled={compCritFail>0} style={{opacity:compCritFail>0?.4:1,marginTop:4}} onClick={()=>updateProj({phase:Math.max(selP.phase,4),comp_approved:1})}>合规通过 → 备人</button>
        </div>}

        {/* Phase 4-6 */}
        {ph>=4 && ph<=6 && <div className="cd">
          <div className="ct-t">{ph===4?'⑤ 岗前备人':ph===5?'⑥ 培训管理':'⑦ 上岗运营'}</div>
          {ph===4 && <><div className="alert alert-ac">确认所有参与本项目的人员：工作许可有效、PPE配置完毕、已录入员工花名册。</div><div style={{fontSize:11,color:'var(--tx2)'}}>所需人数: <b>{(selP.cost_data?.workers||[]).reduce((s,w)=>s+(w.count||0),0)}</b> 人 · 仓库: {selP.client}</div></>}
          {ph===5 && <div style={{fontSize:11,color:'var(--tx2)',lineHeight:2}}><div>✓ 安全Unterweisung（签到表）</div><div>✓ PPE规范使用</div><div>✓ 开柜六步法+视频记录规范（HGB §438）</div><div>✓ Arbeitszeitnachweis 填写规范</div><div>✓ 工人仅接受渊博方指令（Werkvertrag合规核心）</div></div>}
          {ph===6 && <div style={{fontSize:11,color:'var(--tx2)',lineHeight:2}}><div>→ 每日工时录入：工时记录页</div><div>→ 开柜记录：卸柜记录页</div><div>→ 异常事件：Abmahnung页</div><div>→ Zeitkonto超时预警：Zeitkonto页</div></div>}
          <button className="b bga" style={{marginTop:12}} onClick={()=>updateProj({phase:Math.max(selP.phase,ph+1)})}>确认 → {WV_PHASES[ph+1]}</button>
        </div>}

        {/* Phase 7 */}
        {ph===7 && <div className="cd">
          <div className="ct-t">⑧ 项目撤离 · Projektabschluss</div>
          {[['client_signed_off','客户 Leistungsabnahme 签字（§640 BGB）'],['staff_returned','人员重新分配/离场'],['equip_returned','PPE和器具回收'],['final_billed','最终结算账单已发送']].map(([k,lbl])=><div key={k} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:'1px solid var(--bd)30'}}>
            <div onClick={()=>updateProj({[k]:selP[k]?0:1})} style={{width:18,height:18,borderRadius:4,cursor:'pointer',border:`2px solid ${selP[k]?'var(--gn)':'var(--bd)'}`,background:selP[k]?'var(--gn)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:11,flexShrink:0}}>{selP[k]?'✓':''}</div>
            <span style={{fontSize:12}}>{lbl}</span>
          </div>)}
          <div className="fg" style={{marginTop:12}}><label className="fl">Debrief / Lessons Learned</label><textarea className="fta" defaultValue={selP.debrief||''} onBlur={e=>updateProj({debrief:e.target.value})} placeholder="经验总结、改进建议、续约评估..."/></div>
          <button className="b bgn" style={{marginTop:12}} disabled={!!selP.closed} onClick={()=>{if(window.confirm('确认归档此项目？'))updateProj({closed:1});}}>
            {selP.closed?'✅ 已归档':'项目完成归档'}
          </button>
        </div>}
      </>}
    </div>

    {newM && <Modal title="新建 Werkvertrag 项目" onClose={()=>setNewM(false)}
      footer={<><button className="b bgh" onClick={()=>setNewM(false)}>取消</button><button className="b bga" onClick={createProj}>创建</button></>}>
      <div className="alert alert-og">Werkvertrag 须约定 Werkerfolg（成果），非劳动时间。</div>
      <div className="fr">
        <div className="fg ful"><label className="fl">项目名称 *</label><input className="fi" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
        <div className="fg"><label className="fl">客户/仓库</label><input className="fi" value={form.client} onChange={e=>setForm({...form,client:e.target.value})}/></div>
        <div className="fg"><label className="fl">服务类型</label><select className="fsl" value={form.service_type} onChange={e=>setForm({...form,service_type:e.target.value})}><option value="">—</option>{SERVICES.map(s=><option key={s}>{s}</option>)}</select></div>
        <div className="fg"><label className="fl">大区</label><select className="fsl" value={form.region} onChange={e=>setForm({...form,region:e.target.value})}><option value="">—</option>{REGIONS.map(r=><option key={r}>{r}</option>)}</select></div>
        <div className="fg"><label className="fl">项目负责人</label><input className="fi" value={form.project_manager} onChange={e=>setForm({...form,project_manager:e.target.value})}/></div>
      </div>
    </Modal>}
  </div>;
}

// ── CONTAINERS ──
function Containers({token,user}) {
  const [cts,setCts]=useState([]); const [loading,setLoading]=useState(true);
  const [addM,setAddM]=useState(false);
  const [emps,setEmps]=useState([]);
  const [form,setForm]=useState({container_no:'',container_type:'40GP',work_date:new Date().toISOString().slice(0,10),start_time:'08:00',seal_no:'',worker_ids:[],client_revenue:0,team_pay:0,notes:''});

  const load = ()=>{ setLoading(true); api('/api/containers',{token}).then(setCts).finally(()=>setLoading(false)); };
  useEffect(()=>{ load(); api('/api/employees?status=在职',{token}).then(setEmps); },[]);

  const addCt = async ()=>{
    if(!form.container_no){alert('请输入柜号');return;}
    await api('/api/containers',{method:'POST',body:form,token}); setAddM(false); load();
  };
  const complete = async (id)=>{
    const et = prompt('结束时间 (HH:MM):','16:00');
    if(!et) return;
    await api(`/api/containers/${id}/complete`,{method:'PUT',body:{end_time:et,video_recorded:1},token}); load();
  };

  const TYPES=['20GP','40GP','40HQ','45HC'];

  return <div>
    <div style={{display:'flex',justifyContent:'flex-end',marginBottom:10}}>
      <button className="b bga" onClick={()=>setAddM(true)}>+ 新增卸柜记录</button>
    </div>
    {loading ? <Loading/> : <div className="tw"><div className="ts"><table>
      <thead><tr><th>柜号</th><th>类型</th><th>仓库</th><th>日期</th><th>开始</th><th>结束</th><th>工时</th><th>人数</th><th>视频</th><th>状态</th><th></th></tr></thead>
      <tbody>{cts.map(c=><tr key={c.id}>
        <td className="mn fw6 gn">{c.container_no}</td>
        <td>{c.container_type}</td>
        <td>{c.warehouse_code}</td>
        <td>{c.work_date}</td>
        <td className="mn">{c.start_time}</td>
        <td className="mn">{c.end_time||'—'}</td>
        <td className="mn">{c.duration_hours?c.duration_hours+'h':'—'}</td>
        <td>{c.worker_count}</td>
        <td>{c.video_recorded?<span className="gn">✓</span>:<span className="rd">✗</span>}</td>
        <td><Bg t={c.status}/></td>
        <td>{c.status==='进行中'&&<button className="b bgn" style={{fontSize:9}} onClick={()=>complete(c.id)}>完成</button>}</td>
      </tr>)}</tbody>
    </table></div></div>}

    {addM && <Modal title="新增卸柜记录" onClose={()=>setAddM(false)}
      footer={<><button className="b bgh" onClick={()=>setAddM(false)}>取消</button><button className="b bga" onClick={addCt}>提交</button></>}>
      <div className="alert alert-og">⚠ 开柜前必须录制视频（HGB §438），记录铅封号、货物初始状态（一镜到底，禁止中断）</div>
      <div className="fr">
        <div className="fg"><label className="fl">柜号 *</label><input className="fi" value={form.container_no} onChange={e=>setForm({...form,container_no:e.target.value})} placeholder="TCKU1234567"/></div>
        <div className="fg"><label className="fl">柜型</label><select className="fsl" value={form.container_type} onChange={e=>setForm({...form,container_type:e.target.value})}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
        <div className="fg"><label className="fl">作业日期</label><input className="fi" type="date" value={form.work_date} onChange={e=>setForm({...form,work_date:e.target.value})}/></div>
        <div className="fg"><label className="fl">铅封号</label><input className="fi" value={form.seal_no} onChange={e=>setForm({...form,seal_no:e.target.value})}/></div>
        <div className="fg"><label className="fl">开始时间</label><input className="fi" type="time" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})}/></div>
        <div className="fg"><label className="fl">客户结算(€)</label><input className="fi" type="number" value={form.client_revenue} onChange={e=>setForm({...form,client_revenue:+e.target.value})}/></div>
        <div className="fg ful"><label className="fl">参与工人</label>
          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>{emps.map(e=>{const sel=form.worker_ids.includes(e.id);return<button key={e.id} onClick={()=>setForm(f=>({...f,worker_ids:sel?f.worker_ids.filter(x=>x!==e.id):[...f.worker_ids,e.id]}))} style={{padding:'4px 8px',borderRadius:6,border:`1px solid ${sel?'var(--ac)':'var(--bd)'}`,background:sel?'#4f6ef722':'transparent',color:sel?'var(--ac2)':'var(--tx3)',fontSize:10,cursor:'pointer'}}>{e.name}</button>})}
          </div>
        </div>
        <div className="fg ful"><label className="fl">备注</label><input className="fi" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
      </div>
    </Modal>}
  </div>;
}

// ── SETTLEMENT ──
function Settlement({token}) {
  const [data,setData]=useState(null); const [loading,setLoading]=useState(true);
  const [month,setMonth]=useState(new Date().toISOString().slice(0,7));
  const load = ()=>{ setLoading(true); api(`/api/settlement/monthly?month=${month}`,{token}).then(setData).finally(()=>setLoading(false)); };
  useEffect(()=>{ load(); },[month]);
  return <div>
    <div className="ab">
      <input type="month" className="fs" value={month} onChange={e=>setMonth(e.target.value)}/>
    </div>
    {data && <div className="sr">
      {[['员工数',data.summary.employee_count,'var(--cy)'],[`总工时 ${data.summary.total_hours}h`,'','var(--pp)'],['总Brutto','€'+fmtE(data.summary.total_gross),'var(--og)'],['总Net','€'+fmtE(data.summary.total_net),'var(--gn)']].map(([l,v,c],i)=><div key={i} className="sc"><div className="sl">{l}</div><div className="sv" style={{color:c}}>{v||l.split('总')[1]||data.summary.employee_count}</div></div>)}
    </div>}
    {loading ? <Loading/> : data && <div className="tw"><table>
      <thead><tr><th>员工</th><th>仓库</th><th>业务线</th><th>来源</th><th>工时</th><th>Brutto</th><th>SSI</th><th>Tax</th><th>Net</th><th>记录数</th></tr></thead>
      <tbody>{data.rows.map((r,i)=><tr key={i}>
        <td className="fw6">{r.employee_name}</td>
        <td>{r.warehouse_code}</td>
        <td><Bg t={r.biz_line}/></td>
        <td><Bg t={r.source}/></td>
        <td className="mn">{r.total_hours}h</td>
        <td className="mn">€{fmtE(r.gross_total)}</td>
        <td className="mn tm">€{fmtE(r.ssi_total)}</td>
        <td className="mn tm">€{fmtE(r.tax_total)}</td>
        <td className="mn gn fw6">€{fmtE(r.net_total)}</td>
        <td className="tm">{r.record_count}</td>
      </tr>)}
      </tbody>
    </table></div>}
  </div>;
}

// ── CLOCK ──
function Clock({token,user}) {
  const [now,setNow]=useState(new Date());
  const [logs,setLogs]=useState([]);
  useEffect(()=>{ const i=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(i); },[]);
  useEffect(()=>{ api('/api/clock/today',{token}).then(setLogs).catch(()=>{}); },[]);
  const last=logs[logs.length-1];
  const isIn=last?.clock_type==='in';
  const punch=async(t)=>{ await api('/api/clock',{method:'POST',body:{clock_type:t},token}); const r=await api('/api/clock/today',{token}); setLogs(r); };
  return <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'40px 0'}}>
    <div style={{fontSize:64,fontWeight:800,color:'var(--ac2)',letterSpacing:-2}}>{now.toTimeString().slice(0,8)}</div>
    <div style={{color:'var(--tx3)',marginBottom:24}}>{now.toLocaleDateString('de-DE')} · {user.display_name}</div>
    <div onClick={()=>punch(isIn?'out':'in')} style={{width:160,height:160,borderRadius:'50%',border:`4px solid ${isIn?'var(--rd)':'var(--gn)'}`,background:isIn?'#f0526c10':'#2dd4a010',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .3s',userSelect:'none'}}
      onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.05)';}} onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';}}>
      <div style={{fontSize:36,marginBottom:4}}>{isIn?'👋':'👆'}</div>
      <div style={{fontSize:14,fontWeight:700}}>{isIn?'下班打卡':'上班打卡'}</div>
    </div>
    <div style={{marginTop:20,fontSize:12,color:isIn?'var(--gn)':'var(--og)'}}>{isIn?`✓ 已上班打卡 ${last.clock_time}`:'○ 尚未打卡'}</div>
    {logs.length>0 && <div style={{marginTop:16,width:'100%',maxWidth:400}}>
      {logs.map((l,i)=><div key={i} style={{display:'flex',gap:12,padding:'10px 14px',background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:10,marginBottom:6}}>
        <span style={{fontSize:20}}>{l.clock_type==='in'?'🟢':'🔴'}</span>
        <div><div style={{fontWeight:600,fontSize:12}}>{l.clock_type==='in'?'上班打卡':'下班打卡'}</div><div className="tm" style={{fontSize:10}}>{l.clock_time}</div></div>
      </div>)}
    </div>}
  </div>;
}

// ── AUDIT LOGS ──
function AuditLogs({token}) {
  const [logs,setLogs]=useState([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{ api('/api/logs',{token}).then(setLogs).finally(()=>setLoading(false)); },[]);
  return <div>
    {loading ? <Loading/> : <div className="tw"><div className="ts"><table>
      <thead><tr><th>时间</th><th>用户</th><th>操作</th><th>对象</th><th>ID</th><th>详情</th></tr></thead>
      <tbody>{logs.map((l,i)=><tr key={i}>
        <td className="mn tm">{l.created_at?.slice(5,19)}</td>
        <td className="fw6">{l.user_display}</td>
        <td><span style={{color:'var(--ac2)'}}>{l.action}</span></td>
        <td className="tm">{l.target_table}</td>
        <td className="mn">{l.target_id}</td>
        <td>{l.detail}</td>
      </tr>)}</tbody>
    </table></div></div>}
  </div>;
}


// ══════════════════════════════════════════════════════════════════════
// 企业文档知识库 — 完整内容数据
// ══════════════════════════════════════════════════════════════════════

const DOCS_DB = {

// ─── P级职责 ────────────────────────────────────────────────────────
"p1-duties": {
  id:"p1-duties", cat:"职级职责", tag:"P1", title:"P1 操作员 — 岗位职责与行为准则",
  icon:"👷", audience:"P1", lang:"zh",
  content:`
<h3>一、岗位定位</h3>
<p>职级：<strong>P1 操作员（Operator）</strong><br/>汇报对象：P3/P4 组长 / 班组长<br/>定位："执行之本"，仓库运营最基础、最重要的力量。</p>
<h3>二、核心职责</h3>
<ul>
<li><strong>基础仓储操作：</strong>搬运、分拣、扫描、贴标、码托、缠膜、卸柜/装柜</li>
<li><strong>设备使用：</strong>正确使用扫描枪、手推车、叉车（持证者）</li>
<li><strong>质量执行：</strong>按组长指示操作，不确定时立即问，不猜测</li>
<li><strong>安全执行：</strong>全程穿戴PPE（安全鞋+背心），遵守区域限速和叉车安全规则</li>
<li><strong>工时记录：</strong>准时到岗，每日签署工时确认单（Arbeitszeitnachweis）</li>
</ul>
<h3>三、每日工作流程</h3>
<table>
<tr><th>时间</th><th>动作</th></tr>
<tr><td>到岗前5分钟</td><td>换工装、穿安全鞋、戴背心，到指定工位集合</td></tr>
<tr><td>班前会（5min）</td><td>听班组长任务说明，有不明白立即举手提问</td></tr>
<tr><td>作业中</td><td>按指示操作；每15-20件核查一次目的地是否正确；发现问题叫停报告</td></tr>
<tr><td>休息时间</td><td>完全离开作业区，不在货架/叉车道休息</td></tr>
<tr><td>下班前</td><td>清理工位；交还工具设备；签工时确认单</td></tr>
</table>
<h3>四、P1 绝对红线</h3>
<div class="alert-block danger">
<strong>以下行为导致立即Abmahnung，再犯解职：</strong><br/>
❌ 不穿安全鞋 / 不戴背心进入作业区<br/>
❌ 站在叉车工作半径3米内<br/>
❌ 代他人签署工时确认单（Unterschriftenfälschung = 刑事欺诈）<br/>
❌ 无故不到岗且不通知（旷工）<br/>
❌ 擅自操作未经培训的设备
</div>
<h3>五、P1 → P2 晋升要求</h3>
<ul>
<li>在至少2个不同工位独立上岗，错误率 ≤3%</li>
<li>出勤率 ≥97%，无无故旷工记录</li>
<li>WMS/扫描系统操作正确率 ≥98%</li>
<li>连续3个月无安全违规</li>
</ul>`
},

"p2-p3-duties": {
  id:"p2-p3-duties", cat:"职级职责", tag:"P2/P3", title:"P2 资深操作员 / P3 技能工 — 岗位职责",
  icon:"⚙️", audience:"P2,P3", lang:"zh",
  content:`
<h3>P2 资深操作员</h3>
<p>汇报对象：P4 班组长 &nbsp;|&nbsp; 可带：新入职P1员工</p>
<ul>
<li>熟练操作本仓库至少2个工位，可独立完成全流程</li>
<li>对新P1员工进行1对1示范和现场纠错（Einarbeitung）</li>
<li>产量稳定达团队平均水平90%以上</li>
<li>5S执行标杆：个人工位长期整洁、无安全隐患</li>
<li>排班服从度高，可配合临时加班和调班</li>
</ul>
<h3>P3 技能工（叉车/设备/关键工序）</h3>
<p>前提条件：持有效叉车证（Gabelstaplerschein）或设备操作资格证，并通过公司内部实操认证。</p>
<ul>
<li>独立承担高风险或关键节点工序（叉车作业、高货位存取、重型货物）</li>
<li>设备日常点检：每日开始前执行叉车5点检查（油液、轮胎、叉臂、报警、安全带）</li>
<li>年度重大操作失误为0；最近12个月内无设备/车辆安全事故</li>
<li>综合效率 ≥ 团队平均水平100%，质量达标率 ≥98%</li>
<li>可承担简单带教任务</li>
</ul>
<h3>叉车作业安全强制规定（P3适用）</h3>
<table>
<tr><th>检查项目</th><th>标准</th></tr>
<tr><td>操作前</td><td>检查场地、清场通道、确认无行人</td></tr>
<tr><td>速度</td><td>室内 ≤6km/h；斜坡 ≤3km/h；转弯减速至步行速度</td></tr>
<tr><td>货物固定</td><td>起升前确认货物稳固，超高货物用绑带</td></tr>
<tr><td>倒车</td><td>必须鸣笛；有人员时停车等待</td></tr>
<tr><td>下车</td><td>叉臂落地、熄火、上手刹，方可离开</td></tr>
</table>`
},

"p4-duties": {
  id:"p4-duties", cat:"职级职责", tag:"P4", title:"P4 班组长（Team Leader）— 岗位职责与SOP",
  icon:"👑", audience:"P4", lang:"zh",
  content:`
<h3>一、定位："一线执行官"</h3>
<p>直接管理5-10名操作员，负责具体工位的操作执行，既要带头干活，又要管理人。</p>
<h3>二、核心职责</h3>
<ul>
<li><strong>工位执行第一负责人：</strong>确保本工位任务按时、高质量完成</li>
<li><strong>操作员直接管理：</strong>考勤、纪律、培训第一负责人</li>
<li><strong>执行P5/P6指令：</strong>无条件执行上级工作安排，确保100%落实</li>
</ul>
<h3>三、每日工作流程 SOP</h3>
<h4>06:30 班前检查（5分钟）</h4>
<div class="checklist">
□ 点名：全员到齐？缺员立即报告P5<br/>
□ 工具检查：叉车、扫描枪、标签机正常<br/>
□ 工位检查：清洁、安全、物料齐备<br/>
□ 安全装备：全员穿安全鞋、戴背心<br/>
□ 任务确认：本组今日任务明确
</div>
<h4>每小时巡查5点</h4>
<div class="checklist">
□ 进度：是否按计划推进<br/>
□ 质量：操作是否规范（抽检比例：拣货10%，装车20%，卸柜100%）<br/>
□ 安全：防护到位、无隐患<br/>
□ 员工：精神状态正常、无疲劳迹象<br/>
□ 设备：正常运行、无故障
</div>
<h4>16:30 日报汇报</h4>
<p>口头或书面汇报P5：出勤 / 产量 / 错误 / 安全 / 设备 / 明日计划</p>
<h3>四、权力边界</h3>
<table>
<tr><th>✅ 可以独立决定</th><th>❌ 必须请示</th></tr>
<tr><td>工位内人员临时调配</td><td>加班安排</td></tr>
<tr><td>操作顺序调整</td><td>客户直接接触</td></tr>
<tr><td>口头表扬/提醒操作员</td><td>任何处罚</td></tr>
<tr><td>现场质量纠正</td><td>跨工位协调</td></tr>
<tr><td>安全隐患排除</td><td>任何支出</td></tr>
</table>
<h3>五、员工问题处理步骤</h3>
<table>
<tr><th>情况</th><th>处理流程</th></tr>
<tr><td>工作慢/懒散</td><td>①私下提醒明确要求 → ②第二次当众指出 → ③第三次报告P5</td></tr>
<tr><td>迟到</td><td>记录时间，立即报告P5，书面存档</td></tr>
<tr><td>不戴安全装备</td><td>立即叫停，纠正后方可继续；屡犯报告P5</td></tr>
<tr><td>打架/冲突</td><td>立即隔离双方，立即报告P5/P6，不得自行处置</td></tr>
</table>`
},

"p5-p6-duties": {
  id:"p5-p6-duties", cat:"职级职责", tag:"P5/P6", title:"P5 高级班组长 / P6 副驻仓经理 — 岗位职责",
  icon:"🎖️", audience:"P5,P6", lang:"zh",
  content:`
<h3>P5 高级班组长（Senior Team Leader）</h3>
<p>定位："一线黄金岗位" — 管理层与操作层的关键桥梁，负责8-15名操作员。</p>
<h4>核心职责</h4>
<ul>
<li>每日班组KPI（出勤、产量、质量、安全）第一责任人</li>
<li>根据订单波峰波谷合理调配2-3组人力，达标率 ≥95%</li>
<li>在经理不在岗时可独立负责所在班次整体运营</li>
<li>接班/交班信息完整清晰，重大事项有书面记录可追溯</li>
<li>每季度至少完成1次对下属的正式面谈记录</li>
</ul>
<h4>每日工作节奏</h4>
<table>
<tr><th>时间</th><th>内容</th></tr>
<tr><td>06:30</td><td>点名(3min)→任务传达(5min)→任务分配(5min)→安全提醒(2min)→士气动员(2min)</td></tr>
<tr><td>每2小时</td><td>巡视所有班组：进度/质量/安全/人员状态</td></tr>
<tr><td>16:30</td><td>汇总日报，向P6/P7报告；填写班组工时记录并签字</td></tr>
</table>

<h3>P6 副驻仓经理（Deputy Site Manager）</h3>
<p>定位：P7驻仓经理的直接副手，可在经理缺席时独立管理整个仓库。</p>
<h4>核心职责</h4>
<ul>
<li>熟悉客户SLA/KPI指标，跟踪日、周数据并提出具体改善行动</li>
<li>排班草案与人力需求测算，人力缺口预警提前 ≥2周</li>
<li>每年至少孵化1名合格P4及以上人才</li>
<li>负责日常安全巡检与整改跟进</li>
<li>完成P7交办的专项任务（流程优化、成本控制、小项目）并按期交付</li>
</ul>
<h4>P6 特别权限</h4>
<ul>
<li>可代P7签署日常工时确认单</li>
<li>紧急情况下可授权加班（须次日补报P7审批）</li>
<li>可直接与客户方现场负责人沟通日常事宜</li>
</ul>`
},

"p7-duties": {
  id:"p7-duties", cat:"职级职责", tag:"P7", title:"P7 驻仓经理（Site Manager）— 岗位职责",
  icon:"🏭", audience:"P7", lang:"zh",
  content:`
<h3>一、岗位定位</h3>
<p>职级：P7 &nbsp;|&nbsp; 驻仓经理（Site Manager）<br/>
汇报对象：P8 区域经理<br/>
管理范围：指定仓库全部运营（10-50人，取决于项目规模）<br/>
工作制：驻仓制，每周基本在场，周末轮班</p>

<h3>二、六大核心职责</h3>
<ul>
<li><strong>日常运营指挥：</strong>制定每日工作计划，监督现场质量和安全，处理突发状况</li>
<li><strong>人员管理与激励：</strong>对P1-P6进行日常管理考核，处理员工纪律问题</li>
<li><strong>KPI管理：</strong>每日追踪出勤率、产量、错误率、安全事件，与客户沟通进度</li>
<li><strong>客户关系维护：</strong>作为渊博方现场代表与客户日常对接，维护长期合作关系</li>
<li><strong>成本控制：</strong>监控人工成本，优化人员配置，提出效率改善方案</li>
<li><strong>安全管理：</strong>每日安全巡查，确保BGW合规，处理安全事故</li>
</ul>

<h3>三、每日工作标准流程</h3>
<table>
<tr><th>时段</th><th>任务</th><th>输出物</th></tr>
<tr><td>07:00前</td><td>查看昨日收尾数据 + 确认今日客户需求</td><td>当日任务清单</td></tr>
<tr><td>07:00-07:15</td><td>早会：向班组长传达任务、重点、注意事项</td><td>全员任务明确</td></tr>
<tr><td>全天</td><td>每2小时现场巡查；异常30分钟内上报P8</td><td>巡查记录</td></tr>
<tr><td>17:00-17:30</td><td>日报：工时确认、当日KPI、问题及处理</td><td>发给P8的日报</td></tr>
<tr><td>每周</td><td>周报（KPI+成本+人员+下周计划）；与P8周会</td><td>书面周报</td></tr>
</table>

<h3>四、P7 考核标准（必须项）</h3>
<ul>
<li>仓库核心KPI全年保持目标值或以上</li>
<li>安全事故0，或仅轻微事件且全部有完整报告与改进闭环</li>
<li>员工流失率控制在公司目标以内</li>
<li>仓库年度审计无重大缺陷项</li>
<li>每年至少推动1项可量化的效率提升或成本改善</li>
</ul>`
},

"p8-p9-duties": {
  id:"p8-p9-duties", cat:"职级职责", tag:"P8/P9", title:"P8 区域经理 / P9 运营总监 — 岗位职责",
  icon:"🎯", audience:"P8,P9", lang:"zh",
  content:`
<h3>P8 区域经理（Regional Manager）</h3>
<p>管理范围：一个大区（3-6个仓库）&nbsp;|&nbsp; 汇报对象：P9 运营总监</p>
<h4>核心职责</h4>
<ul>
<li>统领整个区域内所有仓库，与仓库方直接业务对接沟通</li>
<li>根据业务类型制定计划，协调各仓业务同步，制定具体方向</li>
<li>所负责区域所有仓库KPI整体无明显下滑，关键指标波动不超过±5%</li>
<li>区域内客户满意度或NPS较上一年整体不下降</li>
<li>年度成本预算控制在批准额度内</li>
<li>有计划培养后备P7/P8，每年至少输出1名可接班人选</li>
</ul>
<h4>三大区域</h4>
<table>
<tr><th>大区</th><th>仓库</th></tr>
<tr><td>南部大区</td><td>Köln (KLN), Düsseldorf (DUS), Wuppertal (WPT), Mönchengladbach (MGL)</td></tr>
<tr><td>鲁尔西大区</td><td>Duisburg (DBG), Bochum (BOC), Essen (ESN)</td></tr>
<tr><td>鲁尔东大区</td><td>Dortmund, Unna (UNA), Bergkamen (BGK)</td></tr>
</table>

<h3>P9 运营总监（Operations Director）</h3>
<p>统筹三大区域，直接对接财务总监和人事部门。</p>
<h4>核心职责</h4>
<ul>
<li>制定公司整体发展战略和年度运营目标</li>
<li>设计派遣模式、项目承包模式的业务组合</li>
<li>参与重点客户开发和合同谈判（合同>50万欧元须签字）</li>
<li>与财务总监制定成本控制目标，审核区域成本预算</li>
<li>审批大区经理、关键驻仓经理的任免</li>
</ul>
<h4>P9 KPI（必须项）</h4>
<ul>
<li>三大区域整体营收目标达成率 ≥90%</li>
<li>年度核心KPI相较上一财年有明确提升（毛利率/效率/人均产出）</li>
<li>重大安全、质量、合规事件得到有效防控，无系统性管理失职</li>
<li>管理团队（P8及关键P7）稳定度 ≥80%</li>
</ul>`
},

// ─── 安全须知 ────────────────────────────────────────────────────────
"safety-ppe": {
  id:"safety-ppe", cat:"安全须知", tag:"PPE", title:"个人防护装备（PPE）强制规定",
  icon:"🦺", audience:"全员", lang:"zh",
  content:`
<div class="alert-block danger">⚠ PPE不到位 = 立即停工。任何人在任何时候进入作业区，必须穿戴强制PPE。</div>

<h3>强制PPE清单</h3>
<table>
<tr><th>装备</th><th>标准</th><th>适用场景</th></tr>
<tr><td><strong>S3安全工鞋</strong></td><td>钢头+防刺穿鞋底+防滑，全天穿戴</td><td>所有仓库作业</td></tr>
<tr><td><strong>高可见度背心</strong></td><td>EN 471标准，橙色或黄色反光条</td><td>所有仓库作业</td></tr>
<tr><td>安全帽</td><td>EN 397标准</td><td>仓库方要求时 / 货物堆高有坠落风险时</td></tr>
<tr><td>防割手套</td><td>EN 388标准</td><td>搬运锋利边角货物时（不强制但建议）</td></tr>
<tr><td>便携LED灯</td><td>防爆型</td><td>进入集装箱内作业时</td></tr>
</table>

<h3>作业区域安全规则</h3>
<ul>
<li>叉车工作半径 <strong>3米</strong>为危险区，所有人员禁止进入</li>
<li>叉车道禁止步行，必须走人行通道</li>
<li>货架下方禁止坐卧休息</li>
<li>连续作业不超过4小时，必须安排休息</li>
<li>湿滑地面立即上报，放置警示标志</li>
<li>紧急出口和消防设备前严禁堆放货物</li>
</ul>

<h3>紧急情况处理</h3>
<table>
<tr><th>情况</th><th>立即行动</th><th>报告对象</th></tr>
<tr><td>人员受伤</td><td>立即停工，叫救护车(112)，不移动伤者（脊椎伤除外）</td><td>班组长→驻仓经理</td></tr>
<tr><td>货物坠落</td><td>STOP！全员后退10米，确认无人受伤</td><td>班组长立即</td></tr>
<tr><td>火灾</td><td>启动警报，按紧急疏散路线撤离，不乘电梯</td><td>消防(112)→班组长</td></tr>
<tr><td>熏蒸货物</td><td>立即清场10米，通风30分钟，无Freigabe不得进入</td><td>安全负责人</td></tr>
<tr><td>叉车事故</td><td>停机、不移动车辆、控制现场、等待检查</td><td>驻仓经理+仓库方</td></tr>
</table>`
},

"safety-container": {
  id:"safety-container", cat:"安全须知", tag:"开柜安全", title:"集装箱开柜安全操作规程（六步法）",
  icon:"📦", audience:"全员", lang:"zh",
  content:`
<div class="alert-block danger">⚠ 电商货柜（FBA/TEMU/京东）散装货物固定质量差。开门瞬间货物可能以极大冲击力坠出，可致重伤或死亡。必须严格执行六步法。</div>

<h3>开柜六步法（强制执行）</h3>
<table>
<tr><th>步骤</th><th>操作</th><th>关键要点</th></tr>
<tr><td><strong>① 信息核查</strong></td><td>了解货物类型、装载方式、有无熏蒸标识</td><td>不确定时按最坏情况处理</td></tr>
<tr><td><strong>② 外部目视</strong></td><td>检查柜体鼓胀变形；门铰链/锁杆；熏蒸标识</td><td>接触柜门之前必须完成</td></tr>
<tr><td><strong>③ 安装约束带</strong></td><td>横跨柜门安装 Sicherungsgurt（安全约束带）</td><td><strong>必须在松开锁杆之前安装</strong></td></tr>
<tr><td><strong>④ 侧面站位</strong></td><td>全员站至柜门侧面，门前方3米为危险区</td><td>确认站位后才能进行下步操作</td></tr>
<tr><td><strong>⑤ 缓慢开门</strong></td><td>先开右门至10cm暂停3秒；在约束带控制下缓慢打开</td><td>全开后在门外观察30秒，再靠近</td></tr>
<tr><td><strong>⑥ 熏蒸处理</strong></td><td>若发现熏蒸标识：全员清场10米 → 通风30分钟 → 通知安全负责人</td><td>无书面 Freigabe 不得进入</td></tr>
</table>

<h3>开柜视频记录（HGB §438 要求）</h3>
<p>每次开柜必须全程录像，一镜到底，严禁中断。</p>
<table>
<tr><th>阶段</th><th>内容</th><th>时长</th></tr>
<tr><td>铅封验证</td><td>拍铅封号码特写 + 柜号</td><td>约30秒</td></tr>
<tr><td>开封过程</td><td>铅封切断完整动作</td><td>约25秒</td></tr>
<tr><td>货物初始状态</td><td>广角展示柜内全貌（任何人接触货物之前）</td><td>约40秒</td></tr>
<tr><td>损坏发现</td><td>停止卸货，远景+特写，放卷尺作参照</td><td>视情况</td></tr>
<tr><td>空柜收尾</td><td>拍空柜内部 + 地面残留物</td><td>约15秒</td></tr>
</table>
<p><strong>文件命名：</strong>YYYY-MM-DD_HHMMSS_仓库代码_柜号_开柜.mp4<br/>
<strong>保存期限：</strong>最低6年（HGB §257），建议10年</p>`
},

"safety-forklift": {
  id:"safety-forklift", cat:"安全须知", tag:"叉车安全", title:"叉车安全规程 — 人车共处规则",
  icon:"🚜", audience:"全员", lang:"zh",
  content:`
<div class="alert-block danger">叉车是仓库最危险的设备。德国每年约有20人死于叉车事故，数百人重伤。</div>

<h3>所有人员（无论是否操作叉车）</h3>
<ul>
<li>只走划定的行人通道（黄线区域），不走叉车道</li>
<li>叉车作业半径3米内立即远离，不等叉车停下</li>
<li>与叉车司机保持眼神接触，确认被看见后才通过</li>
<li>背对叉车道时，先转身确认再行走</li>
<li>绝对禁止：在叉车旁边休息、玩手机、突然横穿叉车道</li>
</ul>

<h3>叉车司机（P3及以上，持证上岗）</h3>
<table>
<tr><th>操作前</th><th>操作中</th><th>停车时</th></tr>
<tr><td>5点检查（油液/轮胎/叉臂/报警/安全带）</td><td>室内限速6km/h</td><td>叉臂落地</td></tr>
<tr><td>确认作业区域无行人</td><td>有人时减速至步行速度</td><td>熄火</td></tr>
<tr><td>系好安全带</td><td>倒车必须鸣笛</td><td>上手刹</td></tr>
<tr><td>确认视线清晰</td><td>转弯减速</td><td>钥匙取出</td></tr>
</table>

<h3>STOP规则（人员优先）</h3>
<p>在以下情况，叉车必须完全停止，等待人员通过后方可继续：</p>
<ul>
<li>任何人出现在叉车10米范围内且未注意到叉车</li>
<li>视线受阻（货架/大件货物遮挡）</li>
<li>通道宽度不足双向通行</li>
<li>行人区域边界不清晰</li>
</ul>`
},

"safety-fire": {
  id:"safety-fire", cat:"安全须知", tag:"消防应急", title:"消防与紧急疏散规程",
  icon:"🔥", audience:"全员", lang:"zh",
  content:`
<h3>火灾时（三步法）</h3>
<div class="alert-block">
<strong>① 发现火情：立即大声呼喊「FEUER!」并按下最近的火灾报警按钮</strong><br/>
<strong>② 通知全员：确保周围同事知道，不要恋战救物</strong><br/>
<strong>③ 按指定路线撤离：不乘电梯，到达集合点，清点人数</strong>
</div>

<h3>疏散规则</h3>
<ul>
<li>疏散路线图张贴在仓库各出入口，到岗第一天必须确认</li>
<li>集合点：[由驻仓经理在入职时告知具体位置]</li>
<li>清点人数后向负责人汇报，等待消防队指令</li>
<li>确认全员撤离前，不得返回仓库取物</li>
</ul>

<h3>灭火器使用（PASS法则）</h3>
<table>
<tr><td><strong>P</strong>ull</td><td>拔出保险销</td></tr>
<tr><td><strong>A</strong>im</td><td>对准火焰根部</td></tr>
<tr><td><strong>S</strong>queeze</td><td>按下手柄</td></tr>
<tr><td><strong>S</strong>weep</td><td>左右扫射</td></tr>
</table>
<p><strong>注意：</strong>灭火器只适用于初期小火（直径不超过1平方米）。火势已扩大时立即撤离，等待专业消防队。</p>

<h3>紧急联系</h3>
<table>
<tr><td>消防/救护</td><td><strong>112</strong></td></tr>
<tr><td>警察</td><td><strong>110</strong></td></tr>
<tr><td>驻仓经理</td><td>[见公告栏]</td></tr>
<tr><td>渊博公司总部</td><td>[见劳动合同首页]</td></tr>
</table>`
},

// ─── 法规法条 ────────────────────────────────────────────────────────
"law-arbzg": {
  id:"law-arbzg", cat:"法规法条", tag:"ArbZG", title:"德国劳动时间法（ArbZG）要点 — 员工须知",
  icon:"⚖️", audience:"全员", lang:"zh",
  content:`
<h3>Arbeitszeitgesetz — 关键规定速查</h3>

<table>
<tr><th>条款</th><th>规定</th><th>对你意味着什么</th></tr>
<tr><td><strong>§3 日工时上限</strong></td><td>每工作日最多8小时，特殊情况可延至10小时</td><td>超过10小时/日是违法的，公司不得要求，你也不应自行延长</td></tr>
<tr><td><strong>§3 6个月均值</strong></td><td>6个月内日均不超过8小时</td><td>即使某天上了10小时，其他天必须相应减少</td></tr>
<tr><td><strong>§4 休息时间</strong></td><td>工作6小时以上须有30分钟休息；9小时以上须有45分钟</td><td>休息时间是权利，不是奖励，公司不能取消</td></tr>
<tr><td><strong>§5 每日休息</strong></td><td>两班次之间最少11小时连续休息</td><td>昨晚23点下班，最早今早10点上班</td></tr>
<tr><td><strong>§6 夜班规定</strong></td><td>夜班工时不超过8小时/日（特殊情况10小时）</td><td>夜班有额外补偿权利，见你的劳动合同</td></tr>
<tr><td><strong>§17 记录义务</strong></td><td>雇主必须记录超过8小时的工作时间</td><td>你有权查看你的工时记录</td></tr>
</table>

<h3>Zeitkonto（时间账户）规则</h3>
<ul>
<li>超过合同工时的部分计入 <strong>Plusstunden</strong>（加时账户）</li>
<li>Plusstunden上限：<strong>+200小时</strong>（MTV DGB/GVP 2026）</li>
<li>超过+150小时：公司须主动安排 <strong>Freizeitausgleich</strong>（补休）</li>
<li>未经书面批准的自行超时：<strong>不计入Zeitkonto，也不支付</strong></li>
</ul>

<h3>违规后果</h3>
<ul>
<li>雇主违反ArbZG：最高 <strong>€30,000</strong> 罚款（§22 ArbZG）</li>
<li>员工自行超时（未经批准）：属违反工时指令，可收到Abmahnung</li>
</ul>`
},

"law-milo": {
  id:"law-milo", cat:"法规法条", tag:"Mindestlohn", title:"德国最低工资法（MiLoG）— 员工权利",
  icon:"💶", audience:"全员", lang:"zh",
  content:`
<h3>你的最低薪资权利</h3>
<div class="alert-block info">
<strong>2026年德国法定最低工资：€13.00/小时（brutto）</strong><br/>
渊博+579所有仓库基础时薪均高于法定最低工资。
</div>

<h3>MiLoG 核心规定</h3>
<table>
<tr><th>规定</th><th>说明</th></tr>
<tr><td>适用范围</td><td>所有在德国工作的人，包括外籍劳工、派遣工、兼职</td></tr>
<tr><td>支付方式</td><td>最迟在次月最后工作日支付上月工资</td></tr>
<tr><td>记录义务（§17）</td><td>雇主须记录开始/结束/总时长，员工须在工时记录上签字</td></tr>
<tr><td>保存期限</td><td>工时记录须保存2年以备检查</td></tr>
</table>

<h3>如果你认为工资计算有误</h3>
<ol>
<li>查看你的工时确认单（Arbeitszeitnachweis）— 你签字的那份</li>
<li>与你的驻仓经理（P7）沟通，要求书面说明</li>
<li>如无法解决，联系渊博HR部门</li>
<li>可向 <strong>Zoll（海关劳工监察）</strong> 投诉，匿名也可接受</li>
</ol>
<p>投诉热线：<strong>0800 1234 567</strong>（免费，德语/英语）</p>

<h3>Minijob 特殊规定</h3>
<ul>
<li>月收入上限：€538（超过将转为正常就业关系）</li>
<li>时薪同样不得低于€13.00</li>
<li>员工社保免缴，但公司须支付约30%固定缴费</li>
</ul>`
},

"law-kuendigung": {
  id:"law-kuendigung", cat:"法规法条", tag:"KSchG/BGB", title:"解雇保护法与劳动合同解除 — 你的权利",
  icon:"📋", audience:"全员", lang:"zh",
  content:`
<h3>Kündigungsschutz（解雇保护）</h3>
<table>
<tr><th>条件</th><th>规定</th></tr>
<tr><td>适用条件</td><td>入职满6个月且用人单位规模>10人（§1 KSchG）</td></tr>
<tr><td>保护内容</td><td>解雇须有"社会正当性"，否则可申请法院撤销</td></tr>
<tr><td>三种合法解雇理由</td><td>①经营原因（裁员）②人员原因（长期病假等）③行为原因（违约）</td></tr>
</table>

<h3>通知期（§622 BGB）</h3>
<table>
<tr><th>在职时长</th><th>最短通知期</th></tr>
<tr><td>试用期（最多6个月）</td><td>2周</td></tr>
<tr><td>2年以内</td><td>4周（至每月月中或月底）</td></tr>
<tr><td>2-5年</td><td>1个月（至月底）</td></tr>
<tr><td>5-8年</td><td>2个月（至月底）</td></tr>
</table>

<h3>什么是 Abmahnung（书面警告）</h3>
<p>Abmahnung 是正式的书面警告，记录你的违约行为，警告再犯将解雇。</p>
<ul>
<li>你有权在收到后将<strong>书面反驳意见（Gegendarstellung）</strong>附入你的个人档案</li>
<li>Abmahnung 有效期通常<strong>2年</strong>，之后失去法律效力</li>
<li>Abmahnung不等于立即解雇，通常需要2次同类违规才会解雇</li>
</ul>

<h3>如果你收到 Kündigung（解雇通知）</h3>
<ol>
<li>不要立即签字"接受解雇"，签字只确认收到</li>
<li>立即咨询 <strong>Arbeitsgericht（劳动法院）</strong>，时效：收到解雇后3周内提起 <strong>Kündigungsschutzklage</strong></li>
<li>申请 <strong>Arbeitslosen­geld（失业金）</strong>（须向 Arbeitsagentur 登记）</li>
</ol>`
},

"law-dsgvo": {
  id:"law-dsgvo", cat:"法规法条", tag:"DSGVO", title:"DSGVO（欧盟数据保护条例）— 员工须知",
  icon:"🔒", audience:"全员", lang:"zh",
  content:`
<h3>你的个人数据如何被使用</h3>
<p>渊博+579处理你的个人数据的法律依据是 <strong>Art. 6(1)(b) DSGVO</strong>（履行劳动合同所必需）和 <strong>Art. 6(1)(c)</strong>（法律义务，如税务/社保记录）。</p>

<h3>我们收集哪些数据</h3>
<ul>
<li>姓名、地址、出生日期、联系方式</li>
<li>身份证件/护照信息（核实工作许可）</li>
<li>银行账户信息（IBAN，工资支付）</li>
<li>Steuer-ID、Steuerklasse（税务申报）</li>
<li>工时记录、考勤记录</li>
</ul>

<h3>你的权利（DSGVO Art. 15-22）</h3>
<table>
<tr><th>权利</th><th>说明</th></tr>
<tr><td>查阅权（Art. 15）</td><td>可要求查看公司储存的关于你的所有数据</td></tr>
<tr><td>更正权（Art. 16）</td><td>如数据有误，有权要求更正</td></tr>
<tr><td>删除权（Art. 17）</td><td>离职后，超过法定保存期限的数据须删除</td></tr>
<tr><td>数据可移植（Art. 20）</td><td>可要求以通用格式导出你的数据</td></tr>
</table>

<h3>数据存储位置</h3>
<p>所有员工数据仅存储在<strong>EU境内服务器</strong>（德国/欧洲数据中心），不转移至EU以外地区（包括中国），符合GDPR要求。</p>

<h3>如有数据相关问题</h3>
<p>联系渊博HR部门，或向德国数据保护监管机构（<strong>Datenschutzbehörde</strong>）投诉。</p>`
},

"law-aug": {
  id:"law-aug", cat:"法规法条", tag:"AÜG/BetrVG", title:"派遣法（AÜG）与企业组织法（BetrVG）要点",
  icon:"📑", audience:"全员", lang:"zh",
  content:`
<h3>Arbeitnehmerüberlassungsgesetz（AÜG）— 派遣工权利</h3>
<h4>作为渊博派遣到仓库工作的员工，你有以下权利：</h4>
<table>
<tr><th>权利</th><th>内容</th></tr>
<tr><td>Equal Pay（§10 AÜG）</td><td>派遣满9个月后，薪资不得低于同岗位正式员工（Stammarbeitnehmer）</td></tr>
<tr><td>最长派遣期限</td><td>同一用工单位最长18个月，超期须转正或结束（有Tarifvertrag可例外）</td></tr>
<tr><td>用工单位告知义务</td><td>用工单位须在你到岗前告知派遣条件</td></tr>
<tr><td>社保连续</td><td>在渊博就职期间的社保缴纳连续计算，不因换仓库中断</td></tr>
</table>

<h3>你的劳动合同是与渊博签订的</h3>
<ul>
<li>你的雇主是<strong>渊博GmbH</strong>，不是你工作的仓库（如Amazon、TEMU、DHL等）</li>
<li>薪资由渊博支付，仓库方不能直接要求你延长工时、改变你的岗位</li>
<li>如仓库方的指令超出你的合同范围，可向渊博驻仓经理反映</li>
</ul>

<h3>Werkvertrag（承揽合同）重要区别</h3>
<p>如果你参与的是Werkvertrag项目：</p>
<ul>
<li>你只接受<strong>渊博方</strong>（驻仓经理/班组长）的工作指示</li>
<li>仓库客户方<strong>不能</strong>直接指挥你的具体操作方法（这是法律要求）</li>
<li>如仓库方尝试直接指挥你，请告知你的驻仓经理</li>
</ul>`
},

// ─── 模板库 ────────────────────────────────────────────────────────
"tpl-timesheet": {
  id:"tpl-timesheet", cat:"模板库", tag:"工时", title:"Arbeitszeitnachweis — 工时确认单（可打印模板）",
  icon:"📋", audience:"全员", lang:"zh+de", printable: true,
  content:`
<div class="print-doc">
<div class="print-header">
  <div class="print-logo">Yuanbo GmbH</div>
  <div>
    <div class="print-title">ARBEITSZEITNACHWEIS / 工时确认单</div>
    <div class="print-meta">Datum / 日期: _______________ &nbsp;|&nbsp; Lager / 仓库: _______________</div>
    <div class="print-meta">Manager Unterschrift / 仓库主管签字: ___________________</div>
  </div>
</div>
<table class="print-table">
<tr><th>Nr.</th><th>Name / 姓名</th><th>Start / 开始</th><th>End / 结束</th><th>Pause / 休息</th><th>Total / 合计</th><th>Unterschrift / 签字</th></tr>
${Array.from({length:20},(_,i)=>`<tr><td>${i+1}</td><td style="min-width:120px"></td><td></td><td></td><td>0:30</td><td></td><td style="min-width:140px"></td></tr>`).join('')}
</table>
<div class="print-footer">
<p>Hinweis / 注意：通过签字，员工确认所填工时真实准确。代他人签字属欺诈行为（Unterschriftenfälschung），可导致刑事追诉。<br/>
Die Unterschrift bestätigt die Richtigkeit der Arbeitszeitangaben. Das stellvertretende Unterzeichnen ist eine Straftat.</p>
<p>文件保存：原件至少保存6个月（Aufbewahrungspflicht nach MiLoG §17）</p>
</div>
</div>`
},

"tpl-container": {
  id:"tpl-container", cat:"模板库", tag:"卸柜", title:"货柜分货清点表 Tally Sheet（可打印模板）",
  icon:"📦", audience:"P4+", lang:"zh+de", printable: true,
  content:`
<div class="print-doc">
<div class="print-header">
  <div class="print-logo">Yuanbo GmbH</div>
  <div>
    <div class="print-title">TALLY SHEET / 货柜分货清点表</div>
    <div class="print-meta">Container Nr. / 柜号: _______________ &nbsp;|&nbsp; Seal Nr. / 铅封号: _______________</div>
    <div class="print-meta">Datum / 日期: _______________ &nbsp;|&nbsp; Lager / 仓库: _______________ &nbsp;|&nbsp; Typ / 柜型: _______________</div>
    <div class="print-meta">Teilnehmer / 作业人员: _____________________________________________</div>
  </div>
</div>
<p style="font-size:11px;margin-bottom:6px"><strong>箱唛参考图区</strong>（粘贴或手绘标签示意，标注关键字段位置）：</p>
<div style="border:1px dashed #aaa;height:80px;margin-bottom:12px;display:flex;align-items:center;justify-content:center;color:#999;font-size:11px">粘贴标签照片 / 手绘示意图</div>
<table class="print-table">
<tr><th>目的仓 Destination</th><th>托盘1</th><th>托盘2</th><th>托盘3</th><th>托盘4</th><th>托盘5</th><th>托盘6</th><th>小计 Subtotal</th></tr>
${Array.from({length:8},()=>`<tr><td style="min-width:100px"></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`).join('')}
<tr><td><strong>总计 Total</strong></td><td></td><td></td><td></td><td></td><td></td><td></td><td style="font-weight:700"></td></tr>
</table>
<table style="width:100%;font-size:11px;margin-top:8px;border-collapse:collapse">
<tr><td style="width:50%;padding:4px;border:0.5px solid #ccc">预报件数 Voranmeldung: ________</td><td style="padding:4px;border:0.5px solid #ccc">实到件数 Ist: ________</td></tr>
<tr><td style="padding:4px;border:0.5px solid #ccc">差异说明 Differenz-Erläuterung:</td><td style="padding:4px;border:0.5px solid #ccc"></td></tr>
</table>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:14px;font-size:11px">
<div>清点人 / Zähler:<br/><div style="border-bottom:1px solid #333;margin-top:20px"></div></div>
<div>组长确认 / Teamleiter:<br/><div style="border-bottom:1px solid #333;margin-top:20px"></div></div>
<div>客户仓库确认 / Lager:<br/><div style="border-bottom:1px solid #333;margin-top:20px"></div></div>
</div>
</div>`
},

"tpl-abmahnung-absent": {
  id:"tpl-abmahnung-absent", cat:"模板库", tag:"Abmahnung", title:"Abmahnung 模板 B — 无故旷工（HR专用）",
  icon:"⚠️", audience:"HR,P7,P8,P9", lang:"de",
  content:`
<div class="print-doc">
<div style="display:flex;justify-content:space-between;margin-bottom:16px">
<div><strong>Yuanbo GmbH</strong><br/><span style="font-size:10px;color:#666">Personalmanagement · Deutschland</span></div>
<div style="text-align:right;font-size:10px;color:#666">[Stadt], den [Datum]<br/>HR-DISZ-001 · ABM-[ID]-[Jahr]-[Nr.]</div>
</div>
<p>[Mitarbeiter Vor- und Nachname]<br/>[Straße Nr.]<br/>[PLZ Stadt]</p>
<br/>
<p style="font-size:15px;font-weight:800;letter-spacing:1px">ABMAHNUNG</p>
<p><strong>Betreff: Abmahnung wegen unentschuldigten Fehlens am [Datum]</strong></p>
<br/>
<p><strong>I. Sachverhaltsdarstellung（事实描述）</strong><br/>
Sie sind am <u>[具体日期，如：2026年3月5日，星期三]</u> nicht zu Ihrer vertraglich vereinbarten Arbeitszeit (<u>[班次开始时间]</u>) am Arbeitsort erschienen.</p>
<p>Wir haben Sie am selben Tag um <u>[时间1]</u> und um <u>[时间2]</u> telefonisch kontaktiert. <u>[Sie haben abgenommen / Sie haben nicht abgenommen]</u>.<br/>
Bis zum <u>[日期]</u> haben Sie weder einen Urlaubsantrag eingereicht noch eine Arbeitsunfähigkeitsbescheinigung (AU) vorgelegt.<br/>
Ihre Abwesenheit von insgesamt <u>[X]</u> Stunden gilt daher als unentschuldigtes Fehlen (旷工).</p>
<p><strong>II. Rüge（指责）</strong><br/>
Ihr Verhalten stellt eine Verletzung Ihrer Hauptleistungspflicht aus dem Arbeitsvertrag dar (§ 611a BGB i.V.m. Ihrem Arbeitsvertrag § [X]).</p>
<p><strong>III. Aufforderung zur Verhaltensänderung（改正要求）</strong><br/>
Wir fordern Sie auf, künftig Ihre Arbeitspflicht pünktlich und vollständig zu erfüllen sowie Abwesenheiten unverzüglich und rechtzeitig zu melden und zu belegen.</p>
<p><strong>IV. Warnung（警告）</strong><br/>
Wir weisen Sie hiermit ausdrücklich darauf hin: Sollten Sie erneut unentschuldigt fehlen oder ähnliche Pflichtverletzungen begehen, werden wir <u>ohne weitere Abmahnung</u> die Kündigung des Arbeitsverhältnisses aussprechen.</p>
<p><strong>V. Hinweis auf Gegendarstellungsrecht</strong><br/>
Sie haben das Recht, eine schriftliche Gegendarstellung zu dieser Abmahnung zu verfassen und in Ihre Personalakte aufnehmen zu lassen.</p>
<br/>
<p>Mit freundlichen Grüßen<br/><strong>Yuanbo GmbH</strong><br/>[HR Manager Name], HR Management</p>
<br/>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;font-size:11px">
<div style="border-top:1px solid #333;padding-top:4px">Unterschrift Arbeitgeber · Datum</div>
<div style="border-top:1px solid #333;padding-top:4px">Empfang bestätigt (≠ Einverständnis) · Datum · Unterschrift Arbeitnehmer</div>
</div>
<div style="margin-top:12px;font-size:9px;color:#666">
□ 面交签收 · □ 挂号信 Einschreiben (Sendungsnummer: ___________)<br/>
Aufbewahrung: mind. 2 Jahre in der Personalakte · Ablauf: [Datum+2 Jahre]
</div>
</div>`
},

"tpl-aufforderung": {
  id:"tpl-aufforderung", cat:"模板库", tag:"到岗催告", title:"到岗催告通知 — Aufforderungsschreiben（HR专用）",
  icon:"📄", audience:"HR,P7,P8", lang:"de",
  content:`
<div class="print-doc">
<div style="display:flex;justify-content:space-between;margin-bottom:16px">
<div><strong>Yuanbo GmbH</strong></div>
<div style="font-size:10px;color:#666;text-align:right">[Stadt], den [Datum]</div>
</div>
<p>[Mitarbeiter Name]<br/>[Adresse]</p><br/>
<p><strong>Betreff: Aufforderung zur Arbeitsaufnahme / Klärung Ihrer Abwesenheit</strong></p>
<p>Sehr geehrte/r Herr/Frau [Name],</p>
<p>wir stellen fest, dass Sie seit dem <u>[Datum]</u> nicht an Ihrem Arbeitsplatz erschienen sind, ohne dass uns hierfür ein triftiger Grund mitgeteilt wurde.</p>
<p>Wir fordern Sie hiermit auf, <strong>innerhalb von [2] Werktagen</strong> nach Erhalt dieses Schreibens:</p>
<ol>
<li>unsere HR-Abteilung zu kontaktieren und Ihre Abwesenheit zu begründen;</li>
<li>falls Sie erkrankt sind, umgehend eine Arbeitsunfähigkeitsbescheinigung (AU-Bescheinigung) einzureichen.</li>
</ol>
<p>Sollten Sie dieser Aufforderung nicht nachkommen, müssen wir Ihre Abwesenheit als unentschuldigtes Fehlen werten und entsprechende arbeitsrechtliche Maßnahmen einleiten.</p>
<p>Mit freundlichen Grüßen<br/><strong>Yuanbo GmbH</strong> · [HR Manager]</p>
<div style="margin-top:12px;font-size:10px;color:#666">📌 Bitte Einschreiben mit Rückschein verwenden / 请用挂号信发送，保留回执</div>
</div>`
},

"tpl-safety-sign": {
  id:"tpl-safety-sign", cat:"模板库", tag:"安全", title:"安全Unterweisung签到表（可打印）",
  icon:"✅", audience:"全员", lang:"zh+de", printable: true,
  content:`
<div class="print-doc">
<div class="print-header">
  <div class="print-logo">Yuanbo GmbH</div>
  <div>
    <div class="print-title">SICHERHEITSUNTERWEISUNG / 安全培训签到表</div>
    <div class="print-meta">Datum / 日期: _______________ &nbsp;|&nbsp; Lager / 仓库: _______________</div>
    <div class="print-meta">Schulungsleiter / 培训人: _______________ &nbsp;|&nbsp; Dauer / 时长: _______________ min</div>
  </div>
</div>
<p style="font-size:11px;margin-bottom:6px"><strong>培训内容 / Schulungsinhalt（请勾选完成的内容）：</strong></p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;margin-bottom:12px">
${["□ PPE强制要求（安全鞋/背心）","□ 叉车安全规则 / Gabelstapler","□ 集装箱开柜六步法","□ 火灾疏散路线 / Brandschutz","□ 工时记录与签字规定","□ Arbeitszeitnachweis签字","□ Werkvertrag指令渠道说明","□ 紧急联系人信息"].map(i=>`<span>${i}</span>`).join('')}
</div>
<table class="print-table">
<tr><th>Nr.</th><th>Name / 姓名</th><th>Unterschrift / 签名</th><th>Datum / 日期</th></tr>
${Array.from({length:20},(_,i)=>`<tr><td>${i+1}</td><td style="min-width:140px"></td><td style="min-width:140px"></td><td></td></tr>`).join('')}
</table>
<div class="print-footer">
Durch die Unterschrift bestätigt der/die Mitarbeiter/in, die Sicherheitsunterweisung erhalten und verstanden zu haben.<br/>
签字表示员工已接受并理解本次安全培训内容。<br/>
Aufbewahrung: mind. 2 Jahre / 保存期：至少2年
</div>
</div>`
},

"tpl-incident": {
  id:"tpl-incident", cat:"模板库", tag:"事故记录", title:"违规/事故事件记录表（HR存档用）",
  icon:"📝", audience:"P5+", lang:"zh",
  content:`
<div class="print-doc">
<div class="print-header">
  <div class="print-logo">Yuanbo GmbH</div>
  <div><div class="print-title">违规事件记录表 / Verstoßprotokoll</div>
  <div class="print-meta">HR-DISZ-001 配套文件 · 填写后存入员工档案</div></div>
</div>
<table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:12px">
<tr><td style="width:30%;padding:6px;border:0.5px solid #ccc;font-weight:700">员工姓名 / Name:</td><td style="padding:6px;border:0.5px solid #ccc"></td><td style="width:30%;padding:6px;border:0.5px solid #ccc;font-weight:700">员工ID / ID:</td><td style="padding:6px;border:0.5px solid #ccc"></td></tr>
<tr><td style="padding:6px;border:0.5px solid #ccc;font-weight:700">事件日期 / Datum:</td><td style="padding:6px;border:0.5px solid #ccc"></td><td style="padding:6px;border:0.5px solid #ccc;font-weight:700">仓库 / Lager:</td><td style="padding:6px;border:0.5px solid #ccc"></td></tr>
<tr><td style="padding:6px;border:0.5px solid #ccc;font-weight:700">记录人 / Ersteller:</td><td style="padding:6px;border:0.5px solid #ccc"></td><td style="padding:6px;border:0.5px solid #ccc;font-weight:700">记录日期:</td><td style="padding:6px;border:0.5px solid #ccc"></td></tr>
</table>
<p style="font-weight:700;font-size:12px;margin-bottom:4px">违规类型 / Art des Verstoßes：</p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;margin-bottom:10px">
${["□ 无故旷工 (unentschuldigtes Fehlen)","□ 迟到/早退","□ 擅自超时","□ 安全违规（不戴PPE等）","□ 拒绝执行合理指令","□ 设备违规操作","□ 工时记录不实","□ 其他: ___________"].map(i=>`<span>${i}</span>`).join('')}
</div>
<p style="font-weight:700;font-size:12px;margin-bottom:4px">事实描述（精确到时间、地点、行为）/ Sachverhaltsdarstellung：</p>
<div style="border:0.5px solid #ccc;min-height:60px;margin-bottom:10px;padding:6px;font-size:11px"></div>
<p style="font-weight:700;font-size:12px;margin-bottom:4px">联系记录 / Kontaktprotokoll：</p>
<div style="border:0.5px solid #ccc;min-height:40px;margin-bottom:10px;padding:6px;font-size:11px">电话1: ___:___ □接通 □未接 &nbsp; 电话2: ___:___ □接通 □未接 &nbsp; WhatsApp: □已发</div>
<p style="font-weight:700;font-size:12px;margin-bottom:4px">员工说明 / Mitarbeiter-Erklärung：</p>
<div style="border:0.5px solid #ccc;min-height:50px;margin-bottom:10px;padding:6px;font-size:11px"></div>
<p style="font-weight:700;font-size:12px;margin-bottom:4px">处理措施 / Maßnahme：</p>
<div style="font-size:11px;display:grid;grid-template-columns:1fr 1fr;gap:4px">
${["□ 口头提醒（非正式）","□ 书面提醒","□ Abmahnung 第一份","□ Abmahnung 第二份","□ 扣薪（旷工时段）","□ 报告区域经理"].map(i=>`<span>${i}</span>`).join('')}
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:20px;font-size:11px">
<div style="border-top:1px solid #333;padding-top:4px">HR Manager · Datum · Unterschrift</div>
<div style="border-top:1px solid #333;padding-top:4px">Vorgesetzter (P5+) · Datum · Unterschrift</div>
</div>
</div>`
},

"handbook-onboarding": {
  id:"handbook-onboarding", cat:"员工手册", tag:"入职", title:"新员工入职指南 — 第一天你需要知道的",
  icon:"🎉", audience:"P1", lang:"zh",
  content:`
<h3>欢迎加入渊博+579！</h3>
<p>你正式成为我们仓储操作团队的一员。本指南帮助你快速了解工作中最重要的事项。</p>

<h3>第一天工作流程</h3>
<ol>
<li>准时到达指定仓库，找到你的<strong>班组长（P4）</strong>报到</li>
<li>领取安全装备：<strong>安全鞋 + 高可见度背心</strong>（这两样是强制的，没有就不能进入作业区）</li>
<li>参加15分钟安全介绍，在<strong>安全培训签到表</strong>上签字</li>
<li>班组长带你熟悉：紧急出口位置、洗手间、休息区、叉车道位置</li>
<li>开始在班组长/老员工指导下操作</li>
</ol>

<h3>工时和工资</h3>
<ul>
<li>每天下班前，你的<strong>Arbeitszeitnachweis（工时确认单）</strong>上必须有你的亲笔签名</li>
<li>只能自己签，不能让别人代签——代签是违法行为</li>
<li>如果你觉得工时记录有误，当场说出来，不要先签字后投诉</li>
<li>工资最迟在次月最后一个工作日打入你的银行账户（IBAN）</li>
</ul>

<h3>请假规定</h3>
<table>
<tr><th>请假类型</th><th>如何申请</th><th>截止时间</th></tr>
<tr><td>年假（Urlaub）</td><td>提前向班组长/驻仓经理申请，书面确认</td><td>至少提前1周</td></tr>
<tr><td>病假（Krankmeldung）</td><td>当天上班前通知班组长，3天内提交AU证明</td><td>当天早上</td></tr>
<tr><td>事假</td><td>提前申请，特殊情况事后补办</td><td>尽早</td></tr>
</table>

<h3>谁是你的联系人</h3>
<table>
<tr><th>问题类型</th><th>找谁</th></tr>
<tr><td>今天干什么 / 现场问题</td><td>你的班组长 P4</td></tr>
<tr><td>工资 / 合同 / 排班</td><td>驻仓经理 P7</td></tr>
<tr><td>安全事故 / 受伤</td><td>驻仓经理 P7 → 拨打112</td></tr>
<tr><td>对管理层有意见</td><td>先找P7，再联系HR部门</td></tr>
</table>

<h3>记住这3条最重要的规则</h3>
<div class="alert-block">
<strong>1. 进作业区必须穿安全鞋 + 戴背心，无例外</strong><br/>
<strong>2. 叉车道 = 危险区，永远走人行通道</strong><br/>
<strong>3. 不确定就问，宁可多问也不要猜测操作</strong>
</div>`
},

"handbook-rights": {
  id:"handbook-rights", cat:"员工手册", tag:"权利", title:"员工权利手册 — 在德国工作你受法律保护",
  icon:"🛡️", audience:"全员", lang:"zh",
  content:`
<h3>你在德国工作享有以下基本权利</h3>

<table>
<tr><th>权利</th><th>具体内容</th><th>相关法律</th></tr>
<tr><td><strong>最低工资</strong></td><td>€13.00/h brutto，无论国籍</td><td>MiLoG</td></tr>
<tr><td><strong>最低假期</strong></td><td>每年24个工作日（全职），兼职按比例</td><td>BUrlG</td></tr>
<tr><td><strong>病假带薪</strong></td><td>病假前6周由雇主全额支付（Entgeltfortzahlung）</td><td>EFZG §3</td></tr>
<tr><td><strong>工时上限</strong></td><td>最多10h/日，6个月内均值≤8h/日</td><td>ArbZG §3</td></tr>
<tr><td><strong>解雇保护</strong></td><td>入职6个月后，解雇须有正当理由</td><td>KSchG §1</td></tr>
<tr><td><strong>数据保护</strong></td><td>个人数据仅用于合同履行，不得滥用</td><td>DSGVO</td></tr>
</table>

<h3>如果你认为权利受到侵犯</h3>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
<div style="padding:12px;background:#f8f9fb;border-radius:8px;border:1px solid #e0e4ef;font-size:12px">
<strong>工资相关</strong><br/>
Zoll Finanzkontrolle Schwarzarbeit<br/>
热线：<strong>0800 1234 567</strong>（免费）<br/>
可匿名投诉
</div>
<div style="padding:12px;background:#f8f9fb;border-radius:8px;border:1px solid #e0e4ef;font-size:12px">
<strong>劳动条件相关</strong><br/>
Arbeitsschutzbehörde（各州劳动保护局）<br/>
可网上匿名举报
</div>
<div style="padding:12px;background:#f8f9fb;border-radius:8px;border:1px solid #e0e4ef;font-size:12px">
<strong>解雇争议</strong><br/>
Arbeitsgericht（劳动法院）<br/>
收到解雇起<strong>3周内</strong>提起诉讼<br/>
可申请法律援助（Prozesskostenhilfe）
</div>
<div style="padding:12px;background:#f8f9fb;border-radius:8px;border:1px solid #e0e4ef;font-size:12px">
<strong>公司内部渠道</strong><br/>
班组长P4 → 驻仓经理P7 → HR部门<br/>
任何投诉受到打击报复是违法的
</div>
</div>`
},

};

// ─── DOCS STYLES ────────────────────────────────────────────────────
const DOCS_STYLE = `
.doc-body h3{font-size:13px;font-weight:700;color:var(--ac2);margin:16px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--bd)}
.doc-body h4{font-size:12px;font-weight:600;color:var(--tx2);margin:12px 0 6px}
.doc-body p{font-size:12px;color:var(--tx2);line-height:1.7;margin-bottom:8px}
.doc-body ul,.doc-body ol{font-size:12px;color:var(--tx2);line-height:1.9;padding-left:18px;margin-bottom:10px}
.doc-body table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:12px}
.doc-body th{background:var(--bg3);padding:7px 10px;text-align:left;font-weight:600;color:var(--tx2);border-bottom:1px solid var(--bd);font-size:10px;text-transform:uppercase}
.doc-body td{padding:7px 10px;border-bottom:1px solid var(--bd)33;color:var(--tx2)}
.doc-body tr:hover td{background:var(--sf)}
.alert-block{padding:10px 14px;border-radius:8px;font-size:11px;line-height:1.7;margin:12px 0}
.alert-block.danger,.alert-block{background:#f0526c14;border:1px solid #f0526c44;color:#f0526c}
.alert-block.info{background:#4f6ef714;border:1px solid #4f6ef744;color:var(--ac2)}
.checklist{background:var(--bg3);border:1px solid var(--bd);border-radius:8px;padding:12px;font-size:12px;color:var(--tx2);line-height:2.0;font-family:'Outfit',monospace}
/* Print styles */
@media print{
  .sidebar,.hdr,.mob-hdr,.ab,.no-print{display:none!important}
  .doc-body{color:#111!important}
  .doc-body h3{color:#1B2B4B!important;border-color:#ccc!important}
  .doc-body p,.doc-body li,.doc-body td{color:#333!important}
  .doc-body th{background:#f0f0f0!important;color:#333!important;border-color:#ccc!important}
  .doc-body td{border-color:#ccc!important}
  .alert-block{background:#fff8f8!important;border-color:#f0526c!important;color:#c00!important}
  .print-doc{color:#111;font-family:Arial,sans-serif;font-size:11px}
  .print-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #1B2B4B}
  .print-logo{font-size:16px;font-weight:800;color:#1B2B4B}
  .print-title{font-size:14px;font-weight:700;color:#1B2B4B}
  .print-meta{font-size:10px;color:#555}
  .print-table{width:100%;border-collapse:collapse}
  .print-table th{background:#1B2B4B;color:#fff;padding:6px 8px;font-size:10px}
  .print-table td{padding:5px 8px;border:0.5px solid #ccc;min-height:22px}
  .print-footer{margin-top:12px;font-size:9px;color:#555;border-top:1px solid #ccc;padding-top:8px}
}`;


// ─── DOCS COMPONENT ─────────────────────────────────────────────────
function KnowledgeBase({token,user}) {
  const [selId,setSelId]=React.useState(null);
  const [search,setSearch]=React.useState('');
  const [cat,setCat]=React.useState('');
  const [printing,setPrinting]=React.useState(false);

  const CATS=['职级职责','安全须知','法规法条','模板库','员工手册'];
  const CAT_ICONS={'职级职责':'🏅','安全须知':'🦺','法规法条':'⚖️','模板库':'📋','员工手册':'📖'};

  const docs = Object.values(DOCS_DB);
  const filtered = docs.filter(d=>{
    if(cat && d.cat!==cat) return false;
    if(search && !d.title.includes(search) && !d.content.includes(search)) return false;
    return true;
  });
  const selDoc = selId ? DOCS_DB[selId] : null;

  const printDoc = () => {
    window.print();
  };

  // Inject CSS once
  React.useEffect(()=>{
    if(!document.getElementById('docs-style')){
      const s=document.createElement('style');
      s.id='docs-style';
      s.textContent=DOCS_STYLE;
      document.head.appendChild(s);
    }
  },[]);

  return <div style={{display:'flex',gap:12,height:'calc(100vh - 120px)'}}>
    {/* LEFT PANEL */}
    <div style={{width:260,flexShrink:0,display:'flex',flexDirection:'column',gap:8}}>
      <input className="si" placeholder="搜索文档..." value={search} onChange={e=>setSearch(e.target.value)} style={{fontSize:12}}/>
      <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
        <button className={`fb ${!cat?'on':''}`} onClick={()=>setCat('')} style={{fontSize:10}}>全部</button>
        {CATS.map(c=><button key={c} className={`fb ${cat===c?'on':''}`} onClick={()=>setCat(c)} style={{fontSize:10}}>{CAT_ICONS[c]} {c}</button>)}
      </div>
      <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:4}}>
        {CATS.filter(c=>!cat||c===cat).map(c=>{
          const catDocs=filtered.filter(d=>d.cat===c);
          if(catDocs.length===0) return null;
          return <div key={c}>
            <div style={{fontSize:10,fontWeight:700,color:'var(--tx3)',padding:'8px 6px 4px',textTransform:'uppercase',letterSpacing:'.06em'}}>{CAT_ICONS[c]} {c}</div>
            {catDocs.map(d=><div key={d.id} onClick={()=>setSelId(d.id)} style={{padding:'8px 10px',borderRadius:8,cursor:'pointer',background:selId===d.id?'#4f6ef718':'transparent',border:`1px solid ${selId===d.id?'var(--ac)':'transparent'}`,marginBottom:2,transition:'all .1s'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                <span style={{fontSize:14}}>{d.icon}</span>
                <span style={{fontSize:11,fontWeight:600,color:selId===d.id?'var(--ac2)':'var(--tx)',lineHeight:1.3}}>{d.title.length>36?d.title.slice(0,36)+'…':d.title}</span>
              </div>
              <div style={{display:'flex',gap:4,paddingLeft:20}}>
                <span style={{fontSize:9,padding:'1px 6px',borderRadius:10,background:'var(--sf)',color:'var(--tx3)'}}>{d.tag}</span>
                {d.printable && <span style={{fontSize:9,padding:'1px 6px',borderRadius:10,background:'#2dd4a014',color:'var(--gn)'}}>可打印</span>}
              </div>
            </div>)}
          </div>;
        })}
        {filtered.length===0 && <div style={{textAlign:'center',padding:20,color:'var(--tx3)',fontSize:12}}>无匹配文档</div>}
      </div>
      <div style={{fontSize:10,color:'var(--tx3)',textAlign:'center'}}>{docs.length} 份文档 · 随时更新</div>
    </div>

    {/* RIGHT PANEL — DOCUMENT VIEWER */}
    <div style={{flex:1,background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:14,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {!selDoc ? <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--tx3)',gap:12}}>
        <div style={{fontSize:48,opacity:.3}}>📚</div>
        <div style={{fontSize:14}}>选择左侧文档开始阅读</div>
        <div style={{fontSize:11,color:'var(--tx3)',maxWidth:300,textAlign:'center'}}>共 {docs.length} 份文档，涵盖职级职责、安全须知、法规法条、模板和员工手册</div>
      </div> : <>
        {/* Doc Header */}
        <div style={{padding:'14px 20px',borderBottom:'1px solid var(--bd)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:22}}>{selDoc.icon}</span>
            <div>
              <div style={{fontSize:14,fontWeight:700}}>{selDoc.title}</div>
              <div style={{fontSize:10,color:'var(--tx3)',marginTop:2,display:'flex',gap:8}}>
                <span>{selDoc.cat}</span>
                <span>·</span>
                <span>适用: {selDoc.audience}</span>
                <span>·</span>
                <span style={{color:selDoc.lang.includes('de')?'var(--og)':'var(--tx3)'}}>
                  {selDoc.lang.includes('de')?'🇩🇪 含德文':'🇨🇳 中文'}
                </span>
              </div>
            </div>
          </div>
          <div style={{display:'flex',gap:6}} className="no-print">
            {selDoc.printable && <button className="b bgn" style={{fontSize:10}} onClick={printDoc}>⎙ 打印表单</button>}
            <button className="b bgh" style={{fontSize:10}} onClick={printDoc}>⎙ 打印页面</button>
            <button className="b bgh" style={{fontSize:10}} onClick={()=>setSelId(null)}>✕</button>
          </div>
        </div>
        {/* Doc Content */}
        <div style={{flex:1,overflowY:'auto',padding:'20px 24px'}} className="doc-body"
          dangerouslySetInnerHTML={{__html:selDoc.content}}/>
      </>}
    </div>
  </div>;
}


// ── GRADE SALARIES ──
function GradeSalaries({token}) {
  const [grades,setGrades]=useState([]); const [kpi,setKpi]=useState([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{
    Promise.all([api('/api/grades',{token}),api('/api/kpi-levels',{token})]).then(([g,k])=>{setGrades(g);setKpi(k);}).finally(()=>setLoading(false));
  },[]);
  if(loading) return <Loading/>;
  return <div>
    <div className="cd">
      <div className="ct-t">🏅 P1-P9 职级薪资体系</div>
      <div style={{fontSize:10,color:'var(--tx3)',marginBottom:10}}>基准工资 €2,400 × 倍率 + 管理津贴 + 超时工资 = 月实际成本</div>
      <div className="tw"><table>
        <thead><tr><th>职级</th><th>岗位</th><th>基础工资</th><th>倍率</th><th>月Brutto</th><th>管理津贴</th><th>超时h</th><th>月实际成本</th><th>时薪等价</th></tr></thead>
        <tbody>{grades.map(g=><tr key={g.grade}>
          <td style={{color:'var(--pp)',fontWeight:800,fontSize:13}}>{g.grade}</td>
          <td>{g.description}</td>
          <td className="mn">€{(g.base_salary||0).toLocaleString('de-DE')}</td>
          <td className="mn" style={{color:'var(--og)'}}>×{g.multiplier}</td>
          <td className="mn fw6">€{(g.gross_salary||0).toLocaleString('de-DE')}</td>
          <td className="mn">€{(g.mgmt_allowance||0).toLocaleString('de-DE')}</td>
          <td className="mn">{g.overtime_hours}h</td>
          <td className="mn" style={{color:'var(--rd)',fontWeight:700}}>€{(g.real_cost||0).toLocaleString('de-DE')}</td>
          <td className="mn" style={{color:'var(--gn)',fontWeight:700}}>€{(g.hourly_equiv||0).toFixed(2)}/h</td>
        </tr>)}</tbody>
      </table></div>
    </div>
    <div className="cd" style={{marginTop:12}}>
      <div className="ct-t">🎯 KPI 绩效等级与奖金</div>
      <div className="tw"><table>
        <thead><tr><th>等级</th><th>基础工资</th><th>奖金比例</th><th>KPI奖金</th><th>最终收入</th></tr></thead>
        <tbody>{kpi.map(k=><tr key={k.level}>
          <td style={{fontWeight:700,color:'var(--ac2)'}}>{k.level}</td>
          <td className="mn">€{(k.base_salary||0).toLocaleString('de-DE')}</td>
          <td className="mn" style={{color:'var(--og)'}}>{((k.bonus_rate||0)*100).toFixed(0)}%</td>
          <td className="mn gn">€{(k.kpi_bonus||0).toFixed(0)}</td>
          <td className="mn fw6" style={{color:'var(--gn)'}}>€{(k.total_income||0).toLocaleString('de-DE')}</td>
        </tr>)}</tbody>
      </table></div>
    </div>
  </div>;
}

// ── WAREHOUSE RATES ──
function WarehouseRates({token,user}) {
  const [whs,setWhs]=useState([]); const [sel,setSel]=useState(null); const [loading,setLoading]=useState(true);
  const [editing,setEditing]=useState(false); const [form,setForm]=useState({});
  useEffect(()=>{ api('/api/warehouses',{token}).then(setWhs).finally(()=>setLoading(false)); },[]);
  const selWh=whs.find(w=>w.code===sel);
  const loadRates=(code)=>{ setSel(code); api(`/api/warehouses/${code}/rates`,{token}).then(w=>{setForm(w);}); };
  const canEdit=['admin','mgr'].includes(user.role);
  const saveRates=async()=>{
    await api(`/api/warehouses/${sel}`,{method:'PUT',body:form,token}); setEditing(false);
    api('/api/warehouses',{token}).then(setWhs);
  };
  const GRADES=['P1','P2','P3','P4','P5'];
  const RATE_KEYS=[['rate_p1','P1'],['rate_p2','P2'],['rate_p3','P3'],['rate_p4','P4'],['rate_p5','P5']];
  return <div style={{display:'flex',gap:12}}>
    <div style={{width:180,flexShrink:0}}>
      {loading?<Loading/>:whs.map(w=><div key={w.code} onClick={()=>loadRates(w.code)} style={{padding:'10px 12px',background:sel===w.code?'#4f6ef718':'var(--bg2)',border:`1px solid ${sel===w.code?'var(--ac)':'var(--bd)'}`,borderRadius:10,cursor:'pointer',marginBottom:6}}>
        <div style={{fontWeight:700,fontSize:12}}>{w.code}</div>
        <div className="tm" style={{fontSize:9}}>{w.name}</div>
        <div style={{fontSize:9,color:'var(--tx3)',marginTop:2}}>{w.region}</div>
      </div>)}
    </div>
    <div style={{flex:1}}>
      {!selWh?<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,color:'var(--tx3)'}}>← 选择仓库</div>:<>
        <div className="cd">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div className="ct-t">{selWh.name} · {selWh.region}</div>
            {canEdit&&<button className="b bga" onClick={()=>setEditing(!editing)}>{editing?'取消':'✏ 编辑价格'}</button>}
          </div>
          <div className="section-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>
            <div style={{background:'var(--bg3)',borderRadius:8,border:'1px solid var(--bd)',padding:12}}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--ac2)',marginBottom:8}}>时薪（€/h） by 职级</div>
              {RATE_KEYS.map(([k,g])=><div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'3px 0',borderBottom:'1px solid var(--bd)30'}}>
                <span style={{color:'var(--pp)',fontWeight:600}}>{g}</span>
                {editing?<input type="number" step="0.10" value={form[k]||''} onChange={e=>setForm({...form,[k]:+e.target.value})} style={{width:70,padding:'2px 6px',background:'var(--bg2)',border:'1px solid var(--ac)',borderRadius:4,color:'var(--tx)',fontFamily:'monospace',fontSize:11}}/>:<span className="mn" style={{color:'var(--gn)',fontWeight:700}}>€{(selWh[k]||0).toFixed(2)}</span>}
              </div>)}
            </div>
            <div style={{background:'var(--bg3)',borderRadius:8,border:'1px solid var(--bd)',padding:12}}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--og)',marginBottom:8}}>班次附加（€/h）</div>
              {[['night_bonus','夜班'],['weekend_bonus','周末'],['holiday_bonus','节假日']].map(([k,l])=><div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'3px 0',borderBottom:'1px solid var(--bd)30'}}>
                <span style={{color:'var(--og)'}}>{l}</span>
                {editing?<input type="number" step="0.10" value={form[k]||''} onChange={e=>setForm({...form,[k]:+e.target.value})} style={{width:70,padding:'2px 6px',background:'var(--bg2)',border:'1px solid var(--ac)',borderRadius:4,color:'var(--tx)',fontFamily:'monospace',fontSize:11}}/>:<span className="mn" style={{fontWeight:700}}>+€{(selWh[k]||0).toFixed(2)}</span>}
              </div>)}
            </div>
            <div style={{background:'var(--bg3)',borderRadius:8,border:'1px solid var(--bd)',padding:12}}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--cy)',marginBottom:8}}>装卸柜价格（€/柜）</div>
              {[['load_20gp','20GP 装'],['unload_20gp','20GP 卸'],['load_40gp','40GP 装'],['unload_40gp','40GP 卸'],['price_45hc','45HC 装/卸']].map(([k,l])=><div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'3px 0',borderBottom:'1px solid var(--bd)30'}}>
                <span className="tm">{l}</span>
                {editing?<input type="number" step="5" value={form[k]||''} onChange={e=>setForm({...form,[k]:+e.target.value})} style={{width:70,padding:'2px 6px',background:'var(--bg2)',border:'1px solid var(--ac)',borderRadius:4,color:'var(--tx)',fontFamily:'monospace',fontSize:11}}/>:<span className="mn" style={{fontWeight:700}}>€{selWh[k]||0}</span>}
              </div>)}
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:editing?12:0}}>
            <div style={{background:'var(--bg3)',borderRadius:8,border:'1px solid var(--bd)',padding:12}}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--gn)',marginBottom:6}}>绩效参数</div>
              {[['perf_coeff','绩效系数'],['kpi_bonus_rate','KPI奖金率']].map(([k,l])=><div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'3px 0'}}>
                <span className="tm">{l}</span>
                {editing?<input type="number" step="0.01" value={form[k]||''} onChange={e=>setForm({...form,[k]:+e.target.value})} style={{width:70,padding:'2px 6px',background:'var(--bg2)',border:'1px solid var(--ac)',borderRadius:4,color:'var(--tx)',fontFamily:'monospace',fontSize:11}}/>:<span className="mn gn">{((selWh[k]||0)*100).toFixed(0)}%</span>}
              </div>)}
            </div>
            <div style={{background:'var(--bg3)',borderRadius:8,border:'1px solid var(--bd)',padding:12}}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--tx2)',marginBottom:6}}>负责人 / 客户</div>
              <div style={{fontSize:11,color:'var(--tx2)'}}>{selWh.manager}</div>
              <div style={{fontSize:10,color:'var(--tx3)',marginTop:4}}>{selWh.client}</div>
              <div style={{fontSize:10,color:'var(--tx3)'}}>{selWh.address}</div>
            </div>
          </div>
          {editing&&<div style={{display:'flex',gap:8}}><button className="b bga" onClick={saveRates}>保存价格</button><button className="b bgh" onClick={()=>setEditing(false)}>取消</button></div>}
        </div>
        <div className="cd" style={{marginTop:12}}>
          <div className="ct-t">📊 10仓库薪资对比（P2时薪）</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:6,height:80}}>
            {whs.map(w=>{const v=w.rate_p2||14;const mx=Math.max(...whs.map(x=>x.rate_p2||14));return<div key={w.code} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center'}}>
              <div style={{fontSize:8,color:'var(--tx3)',marginBottom:2}}>{v.toFixed(2)}</div>
              <div style={{width:'100%',background:w.code===sel?'var(--ac)':'var(--bd2)',borderRadius:'3px 3px 0 0',height:Math.max(4,(v/mx)*70)}}/>
              <div style={{fontSize:8,color:w.code===sel?'var(--ac2)':'var(--tx3)',marginTop:2,fontWeight:w.code===sel?700:400}}>{w.code}</div>
            </div>;})}
          </div>
        </div>
      </>}
    </div>
  </div>;
}

// ── COST CALCULATOR ──
function CostCalculator({token}) {
  const [form,setForm]=useState({brutto_rate:14.0,weekly_hours:40,emp_type:'正常雇用'});
  const [result,setResult]=useState(null); const [loading,setLoading]=useState(false);
  const calc=async()=>{ setLoading(true); try{ const r=await api('/api/cost-calc',{method:'POST',body:form,token}); setResult(r); }catch(e){alert(e.message);} finally{setLoading(false);} };
  useEffect(()=>{ calc(); },[form.brutto_rate,form.weekly_hours,form.emp_type]);
  return <div className="g2">
    <div className="cd">
      <div className="ct-t">🧮 岗位成本测算</div>
      <div style={{fontSize:10,color:'var(--tx3)',marginBottom:14}}>计算公司真实用人成本 = Brutto + 雇主社保 + 假期准备金 + 管理成本</div>
      <div className="fr3">
        <div className="fg"><label className="fl">Brutto时薪 (€/h)</label>
          <input className="fi" type="number" step="0.10" value={form.brutto_rate} onChange={e=>setForm({...form,brutto_rate:+e.target.value})}/>
          <span style={{fontSize:9,color:form.brutto_rate<13?'var(--rd)':'var(--tx3)'}}>最低工资 €13.00/h</span>
        </div>
        <div className="fg"><label className="fl">周工时</label>
          <select className="fsl" value={form.weekly_hours} onChange={e=>setForm({...form,weekly_hours:+e.target.value})}>
            {[10,15,20,25,30,35,40].map(h=><option key={h} value={h}>{h}h/周</option>)}
          </select>
        </div>
        <div className="fg"><label className="fl">雇佣类型</label>
          <select className="fsl" value={form.emp_type} onChange={e=>setForm({...form,emp_type:e.target.value})}>
            <option>正常雇用</option><option>Minijob</option>
          </select>
        </div>
      </div>
      {result && <>
        <div style={{background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:10,padding:14,marginBottom:12}}>
          {[
            ['月Brutto',`€${(result.gross_monthly||0).toFixed(2)}`,'var(--tx)'],
            [`雇主SV (~20.65%)`,`€${(result.employer_ssi||0).toFixed(2)}`,'var(--og)'],
            [`假期准备金 (8.33%)`,`€${(result.holiday_provision||0).toFixed(2)}`,'var(--og)'],
            [`管理成本 (5%)`,`€${(result.mgmt_cost||0).toFixed(2)}`,'var(--og)'],
          ].map(([l,v,c])=><div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'5px 0',borderBottom:'1px solid var(--bd)30',color:c}}><span>{l}</span><span className="mn">{v}</span></div>)}
          <div style={{display:'flex',justifyContent:'space-between',fontSize:14,fontWeight:800,padding:'10px 0 0',color:'var(--rd)'}}><span>公司月真实成本</span><span className="mn">€{(result.total_employer_cost||0).toFixed(2)}</span></div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,fontWeight:700,padding:'4px 0',color:'var(--og)'}}><span>真实时均成本</span><span className="mn">€{(result.true_hourly_cost||0).toFixed(2)}/h</span></div>
        </div>
        <div style={{background:'var(--bg3)',border:'1px solid var(--bd)',borderRadius:10,padding:14}}>
          <div style={{fontSize:10,fontWeight:700,color:'var(--ac2)',marginBottom:8}}>员工实际到手（参考）</div>
          {[
            ['月Brutto',`€${(result.gross_monthly||0).toFixed(2)}`],
            ['员工SV扣款',`-€${(result.employee_ssi||0).toFixed(2)}`],
            ['所得税预估',`-€${(result.income_tax||0).toFixed(2)}`],
          ].map(([l,v])=><div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'4px 0',borderBottom:'1px solid var(--bd)30'}}><span className="tm">{l}</span><span className="mn">{v}</span></div>)}
          <div style={{display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:700,padding:'8px 0 0',color:'var(--gn)'}}><span>月Netto（估算）</span><span className="mn">€{(result.net_pay||0).toFixed(2)}</span></div>
          {result.is_minijob&&<div style={{fontSize:9,color:'var(--og)',marginTop:6}}>⚠ Minijob: 员工免缴SV，公司支付约30%固定缴费</div>}
        </div>
      </>}
    </div>
    <div className="cd">
      <div className="ct-t">📊 Brutto 14€/h 成本速查表</div>
      <div className="tw"><table>
        <thead><tr><th>雇佣类型</th><th>周时</th><th>月时</th><th>月Brutto</th><th>真实成本</th><th>时均成本</th></tr></thead>
        <tbody>
          {[[14,"Minijob",10,43.3,603,844,19.5],[14,"正常雇用",15,65.0,909,1273,19.6],[14,"正常雇用",20,86.6,1212,1697,19.6],[14,"正常雇用",25,108.3,1516,2120,19.6],[14,"正常雇用",30,129.9,1819,2546,19.6],[14,"正常雇用",35,151.6,2122,2970,19.6],[14,"正常雇用",40,173.3,2426,3395,19.6]].map(([r,t,wh,mh,br,tc,hc],i)=><tr key={i} style={{background:form.weekly_hours===wh&&form.emp_type===t?'#4f6ef718':''}}>
            <td>{t}</td>
            <td className="mn">{wh}h</td>
            <td className="mn">{mh}h</td>
            <td className="mn">€{br}</td>
            <td className="mn" style={{color:'var(--rd)',fontWeight:700}}>€{tc}</td>
            <td className="mn" style={{color:'var(--og)',fontWeight:700}}>€{hc}/h</td>
          </tr>)}
        </tbody>
      </table></div>
      <div className="alert alert-ac" style={{marginTop:12,fontSize:10}}>计算基准: Brutto €14/h · 雇主SV ~21% · 假期8.33% · 管理5%。Minijob月收入≤€538，公司额外缴15%KV+1.3%RV+0.6%ALV≈30%。</div>
    </div>
  </div>;
}

// ── MAIN APP ──
const NAV = [
  {k:'dashboard',i:'📊',label:'仪表盘',roles:['admin','hr','wh','fin','mgr','sup']},
  {k:'employees',i:'👥',label:'员工花名册',roles:['admin','hr','wh','fin','mgr','sup']},
  {k:'timesheets',i:'⏱️',label:'工时记录',roles:['admin','hr','wh','fin','mgr','sup']},
  {k:'zeitkonto',i:'⏳',label:'Zeitkonto',roles:['admin','hr','mgr']},
  {k:'settlement',i:'💰',label:'月度结算',roles:['admin','hr','fin','sup','mgr']},
  {k:'containers',i:'📦',label:'卸柜记录',roles:['admin','hr','wh','mgr']},
  {sep:true},
  {k:'werkvertrag',i:'📋',label:'Werkvertrag项目',roles:['admin','hr','mgr']},
  {k:'abmahnung',i:'⚠️',label:'Abmahnung',roles:['admin','hr','mgr']},
  {sep:true},
  {k:'clock',i:'⏰',label:'打卡',roles:['admin','hr','wh','mgr','worker','sup']},
  {k:'grades',i:'🏅',label:'职级薪资体系',roles:['admin','hr','mgr']},
  {k:'warehouse_rates',i:'🏭',label:'仓库价格配置',roles:['admin','hr','mgr','wh']},
  {k:'cost_calc',i:'🧮',label:'岗位成本测算',roles:['admin','hr','mgr','fin']},
  {k:'docs',i:'📚',label:'企业文档库',roles:['admin','hr','wh','fin','mgr','sup','worker']},
  {k:'logs',i:'📝',label:'审计日志',roles:['admin','hr']},
];

function App() {
  const [token,setToken]=useState(()=>localStorage.getItem('hr6_token')||null);
  const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('hr6_user'))||null;}catch{return null;}});
  const [page,setPage]=useState('dashboard');
  const [toast,setToast]=useState(null);
  const [mobNav,setMN]=useState(false);

  const onLogin = (t,u) => { setToken(t); setUser(u); localStorage.setItem('hr6_token',t); localStorage.setItem('hr6_user',JSON.stringify(u)); setPage(u.role==='worker'?'clock':'dashboard'); };
  const onLogout = () => { api('/api/auth/logout',{method:'POST',token}).catch(()=>{}); setToken(null); setUser(null); localStorage.removeItem('hr6_token'); localStorage.removeItem('hr6_user'); };

  const toast_ = (m,t='ok') => { setToast({m,t}); setTimeout(()=>setToast(null),2500); };

  if(!token||!user) return <Login onLogin={onLogin}/>;

  const navItems = NAV.filter(n=>!n.k||(!n.roles||(n.roles.includes(user.role))));
  const go = (k) => { setPage(k); setMN(false); };
  const pageLabel = NAV.find(n=>n.k===page)?.label||page;

  const colors = {admin:'#4f6ef7',hr:'#a78bfa',wh:'#f5a623',fin:'#2dd4a0',mgr:'#ff6b9d',sup:'#f0526c',worker:'#38bdf8'};
  const roleColor = colors[user.role]||'#6a7498';

  const sidebar = <>
    <div className="sb-hd">
      <div className="sb-logo">渊</div>
      <div><div className="sb-t">渊博+579</div><div className="sb-s">HR V6 · LIVE</div></div>
    </div>
    <div className="nav">
      {navItems.map((n,i)=>n.sep?<div key={i} className="nsep"/>:<button key={n.k} className={`ni ${page===n.k?'on':''}`} onClick={()=>go(n.k)}><span className="ni-i">{n.i}</span><span>{n.label}</span></button>)}
    </div>
    <div className="sb-ft">
      <div className="sb-btn" style={{cursor:'default',marginBottom:6}}>
        <div className="ua" style={{background:roleColor}}>{user.display_name?.[0]||'?'}</div>
        <div><div style={{fontSize:10,fontWeight:600,color:'var(--tx)'}}>{user.display_name}</div><div style={{fontSize:8,color:'var(--tx3)'}}>{user.role}</div></div>
      </div>
      <button className="sb-btn dg" onClick={onLogout}>🚪 退出登录</button>
    </div>
  </>;

  return <div className="app">
    <div className={`sidebar ${mobNav?'open':''}`}>{sidebar}</div>
    <div className={`mob-overlay ${mobNav?'show':''}`} onClick={()=>setMN(false)}/>
    <div className="main">
      <div className="mob-hdr">
        <button className="mob-menu-btn" onClick={()=>setMN(true)}>☰</button>
        <h1 style={{fontSize:14,fontWeight:700}}>{pageLabel}</h1>
      </div>
      <div className="hdr">
        <h1>{pageLabel}</h1>
        <div className="hdr-r">
          <div className="uc">
            <div className="ua" style={{background:roleColor}}>{user.display_name?.[0]}</div>
            <div><div className="un">{user.display_name}</div><div className="ur">{user.role}</div></div>
          </div>
        </div>
      </div>
      <div className="ct">
        {page==='dashboard' && <Dashboard token={token}/>}
        {page==='employees' && <Employees token={token} user={user}/>}
        {page==='timesheets' && <Timesheets token={token} user={user}/>}
        {page==='zeitkonto' && <Zeitkonto token={token} user={user}/>}
        {page==='settlement' && <Settlement token={token}/>}
        {page==='containers' && <Containers token={token} user={user}/>}
        {page==='werkvertrag' && <Werkvertrag token={token} user={user}/>}
        {page==='abmahnung' && <Abmahnung token={token} user={user}/>}
        {page==='clock' && <Clock token={token} user={user}/>}
        {page==='logs' && <AuditLogs token={token}/>}
        {page==='docs' && <KnowledgeBase token={token} user={user}/>}
        {page==='grades' && <GradeSalaries token={token}/>}
        {page==='warehouse_rates' && <WarehouseRates token={token} user={user}/>}
        {page==='cost_calc' && <CostCalculator token={token}/>}
      </div>
    </div>
    {toast && <div className={`toast ${toast.t==='err'?'ter':toast.t==='warn'?'tow':'tok'}`}>{toast.m}</div>}
  </div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
