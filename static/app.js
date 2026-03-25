"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var _React = React,
  useState = _React.useState,
  useEffect = _React.useEffect,
  useMemo = _React.useMemo,
  useCallback = _React.useCallback,
  useRef = _React.useRef;

// ── API BASE ──
var BASE = window.location.origin;
var HEALTH_ENDPOINT = '/health';
var HEALTH_POLL_INTERVAL_MS = 3000;
var _sessionExpired = false;

// ── I18N ──
var I18N = {
  zh: {
    'login.title': '渊博+579 HR',
    'login.admin': '👔 管理员登录',
    'login.worker': '👷 工人PIN',
    'login.username': '用户名',
    'login.password': '密码',
    'login.btn': '登 录',
    'login.pin_label': '工人PIN（4位）',
    'login.pin_btn': '打卡入口',
    'login.err_empty': '请填写用户名和密码',
    'login.err_pin': '请输入4位PIN',
    'login.hint': 'admin/admin123 · hr/hr123 · finance/fin123 · wh_una/una123 · sup001/sup123 · mgr/mgr123 · worker01/worker123',
    'login.pin_hint': '测试PIN: 1001 (worker01 张三)',
    'c.loading': '加载中...',
    'c.load_fail': '加载失败',
    'c.save': '保存',
    'c.cancel': '取消',
    'c.edit': '编辑',
    'c.add': '新增',
    'c.submit': '提交',
    'c.all': '全部',
    'c.search': '搜索',
    'c.close': '关闭',
    'c.confirm': '确认',
    'c.logout': '退出登录',
    'c.no_data': '暂无数据',
    'c.notes': '备注',
    'c.date': '日期',
    'c.status': '状态',
    'c.action': '操作',
    'c.name': '姓名',
    'c.phone': '电话',
    'c.starting': '系统正在启动…',
    'nav.dashboard': '仪表盘',
    'nav.employees': '员工花名册',
    'nav.timesheets': '工时记录',
    'nav.zeitkonto': 'Zeitkonto',
    'nav.settlement': '月度结算',
    'nav.containers': '卸柜记录',
    'nav.werkvertrag': 'Werkvertrag项目',
    'nav.abmahnung': 'Abmahnung',
    'nav.clock': '打卡',
    'nav.grades': '职级薪资体系',
    'nav.warehouse_rates': '仓库价格配置',
    'nav.cost_calc': '岗位成本测算',
    'nav.docs': '企业文档库',
    'nav.logs': '审计日志',
    'dash.employees': '在职员工',
    'dash.pending_ts': '待审批工时',
    'dash.total_hours': '本期总工时',
    'dash.abmahnung': '有效Abmahnung',
    'dash.zk_alerts': 'Zeitkonto预警',
    'dash.wv_active': 'WV项目进行中',
    'dash.chart': '📊 近7日工时分布',
    'dash.no_data': '暂无工时数据',
    'emp.new': '+ 新增员工',
    'emp.search': '搜索姓名/ID/电话...',
    'emp.status_active': '在职',
    'emp.status_left': '离职',
    'emp.col_id': 'ID',
    'emp.col_name': '姓名',
    'emp.col_biz': '业务线',
    'emp.col_wh': '仓库',
    'emp.col_pos': '职位',
    'emp.col_grade': '级别',
    'emp.col_src': '来源',
    'emp.col_rate': '时薪',
    'emp.col_status': '状态',
    'emp.col_join': '入职',
    'emp.add_title': '新增员工',
    'emp.edit_title': '编辑员工',
    'emp.f_name': '姓名 *',
    'emp.f_phone': '电话',
    'emp.f_biz': '业务线',
    'emp.f_wh': '仓库',
    'emp.f_pos': '职位',
    'emp.f_grade': '职级',
    'emp.f_src': '来源',
    'emp.f_rate': '时薪 (€/h)',
    'emp.f_settle': '结算方式',
    'emp.f_contract_hrs': '合同工时/日',
    'emp.f_nationality': '国籍',
    'emp.f_join': '入职日期',
    'emp.f_tax': '报税方式',
    'emp.f_pin': 'PIN (4位)',
    'emp.f_notes': '备注',
    'emp.src_own': '自有',
    'emp.src_sup': '供应商',
    'ts.add': '+ 录入工时',
    'ts.batch': '✓ 批量审批',
    'ts.add_title': '录入工时',
    'ts.col_id': 'ID',
    'ts.col_emp': '员工',
    'ts.col_grade': '级别',
    'ts.col_wh': '仓库',
    'ts.col_date': '日期',
    'ts.col_shift': '班次',
    'ts.col_hrs': '工时',
    'ts.col_base': '基础薪',
    'ts.col_shift_b': '班次+',
    'ts.col_eff': '实际率',
    'ts.col_brutto': 'Brutto',
    'ts.col_perf': '绩效',
    'ts.col_net': 'Net',
    'ts.col_status': '状态',
    'ts.col_action': '操作',
    'ts.f_emp': '员工 *',
    'ts.f_date': '工作日期',
    'ts.f_start': '开始时间',
    'ts.f_end': '结束时间',
    'ts.f_wh': '仓库（留空=员工默认仓库）',
    'ts.f_shift': '班次',
    'ts.f_notes': '备注',
    'ts.auto_calc': '工时、Brutto、SSI、Net 由系统根据员工时薪自动计算',
    'ts.wh_approve': '✓仓库',
    'ts.fin_approve': '✓财务',
    'zk.add': '+ 手动录入',
    'zk.add_title': '手动录入 Zeitkonto',
    'zk.col_emp': '员工',
    'zk.col_wh': '仓库',
    'zk.col_grade': '级别',
    'zk.col_status': '合规状态',
    'zk.arrange_rest': '安排休息',
    'zk.f_emp': '员工',
    'zk.f_date': '日期',
    'zk.f_type': '类型',
    'zk.f_hrs': '工时（h）',
    'zk.f_reason': '原因说明',
    'settle.emp_count': '员工数',
    'settle.hours': '总工时',
    'settle.brutto': '总Brutto',
    'settle.net': '总Net',
    'settle.col_emp': '员工',
    'settle.col_wh': '仓库',
    'settle.col_biz': '业务线',
    'settle.col_src': '来源',
    'settle.col_hrs': '工时',
    'settle.col_count': '记录数',
    'ct.add': '+ 新增卸柜记录',
    'ct.add_title': '新增卸柜记录',
    'ct.col_no': '柜号',
    'ct.col_type': '类型',
    'ct.col_wh': '仓库',
    'ct.col_date': '日期',
    'ct.col_start': '开始',
    'ct.col_end': '结束',
    'ct.col_hrs': '工时',
    'ct.col_workers': '人数',
    'ct.col_video': '视频',
    'ct.col_status': '状态',
    'ct.complete': '完成',
    'ct.f_no': '柜号 *',
    'ct.f_type': '柜型',
    'ct.f_date': '作业日期',
    'ct.f_seal': '铅封号',
    'ct.f_start': '开始时间',
    'ct.f_revenue': '客户结算(€)',
    'ct.f_workers': '参与工人',
    'ct.f_notes': '备注',
    'clock.clock_in': '上班打卡',
    'clock.clock_out': '下班打卡',
    'clock.clocked_in': '✓ 已上班打卡',
    'clock.not_clocked': '○ 尚未打卡',
    'log.col_time': '时间',
    'log.col_user': '用户',
    'log.col_action': '操作',
    'log.col_table': '对象',
    'log.col_id': 'ID',
    'log.col_detail': '详情',
    'kb.search': '搜索文档...',
    'kb.all_cats': '全部',
    'kb.print': '⎙ 打印',
    'grade.title': '职级薪资体系',
    'grade.col_grade': '职级',
    'grade.col_base': '基础薪',
    'grade.col_mult': '倍数',
    'grade.col_gross': '月Brutto',
    'grade.col_mgmt': '管理津贴',
    'grade.col_ot': '超时h',
    'grade.col_cost': '真实成本',
    'grade.col_hourly': '等效时薪',
    'grade.col_desc': '描述',
    'wh.select': '← 选择仓库',
    'wh.edit': '编辑价格',
    'wh.f_save': '保存',
    'cost.title': '岗位成本测算',
    'cost.calc': '测算',
    'cost.f_type': '雇佣类型',
    'cost.f_grade': '职级',
    'cost.f_wh': '仓库',
    'cost.f_weekly': '周工时',
    'cost.f_months': '月数',
    'nav.suppliers': '供应商管理',
    'sup.add': '+ 新增供应商',
    'sup.search': '搜索供应商...',
    'sup.col_id': '编号',
    'sup.col_name': '名称',
    'sup.col_biz': '业务线',
    'sup.col_contact': '联系人',
    'sup.col_phone': '电话',
    'sup.col_email': '邮件',
    'sup.col_rating': '评级',
    'sup.col_status': '状态',
    'sup.add_title': '新增供应商',
    'sup.edit_title': '编辑供应商',
    'sup.f_name': '供应商名称 *',
    'sup.f_biz': '业务线',
    'sup.f_contact': '联系人',
    'sup.f_phone': '电话',
    'sup.f_email': '邮件',
    'sup.f_tax': '报税方式',
    'sup.f_rating': '评级',
    'sup.f_notes': '备注',
    'zk.fz_title': '安排 Freizeitausgleich',
    'zk.fz_hours': '消化工时（h）',
    'zk.fz_btn': '确认安排',
    'zk.fz_desc': '当前 +{{h}}h',
    'zk.fz_err': '请输入有效工时',
    'abm.revoke_title': '撤销 Abmahnung',
    'abm.revoke_reason': '撤销原因 *',
    'abm.revoke_btn': '确认撤销',
    'abm.revoke_placeholder': '请填写撤销原因...',
    'abm.revoke_err': '请填写撤销原因',
    'ct.complete_title': '完成卸柜',
    'ct.complete_end': '结束时间',
    'ct.complete_btn': '✓ 确认完成',
    'ct.complete_hint': '确认后将标记视频已录制并完成卸柜。'
  },
  en: {
    'login.title': 'Yuanbo+579 HR',
    'login.admin': '👔 Admin Login',
    'login.worker': '👷 Worker PIN',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.btn': 'Sign In',
    'login.pin_label': 'Worker PIN (4 digits)',
    'login.pin_btn': 'Clock In',
    'login.err_empty': 'Please enter username and password',
    'login.err_pin': 'Please enter 4-digit PIN',
    'login.hint': 'admin/admin123 · hr/hr123 · finance/fin123 · wh_una/una123 · sup001/sup123 · mgr/mgr123 · worker01/worker123',
    'login.pin_hint': 'Test PIN: 1001 (worker01 Zhang San)',
    'c.loading': 'Loading...',
    'c.load_fail': 'Load failed',
    'c.save': 'Save',
    'c.cancel': 'Cancel',
    'c.edit': 'Edit',
    'c.add': 'Add',
    'c.submit': 'Submit',
    'c.all': 'All',
    'c.search': 'Search',
    'c.close': 'Close',
    'c.confirm': 'Confirm',
    'c.logout': 'Logout',
    'c.no_data': 'No data',
    'c.notes': 'Notes',
    'c.date': 'Date',
    'c.status': 'Status',
    'c.action': 'Action',
    'c.name': 'Name',
    'c.phone': 'Phone',
    'c.starting': 'System starting…',
    'nav.dashboard': 'Dashboard',
    'nav.employees': 'Employees',
    'nav.timesheets': 'Timesheets',
    'nav.zeitkonto': 'Zeitkonto',
    'nav.settlement': 'Monthly Settlement',
    'nav.containers': 'Container Records',
    'nav.werkvertrag': 'Werkvertrag Projects',
    'nav.abmahnung': 'Abmahnung',
    'nav.clock': 'Clock In/Out',
    'nav.grades': 'Grade & Pay Structure',
    'nav.warehouse_rates': 'Warehouse Rates',
    'nav.cost_calc': 'Cost Calculator',
    'nav.docs': 'Company Docs',
    'nav.logs': 'Audit Logs',
    'dash.employees': 'Active Staff',
    'dash.pending_ts': 'Pending Approval',
    'dash.total_hours': 'Total Hours (Period)',
    'dash.abmahnung': 'Active Abmahnungen',
    'dash.zk_alerts': 'Zeitkonto Alerts',
    'dash.wv_active': 'Active WV Projects',
    'dash.chart': '📊 Last 7 Days Hours',
    'dash.no_data': 'No timesheet data',
    'emp.new': '+ New Employee',
    'emp.search': 'Search name/ID/phone...',
    'emp.status_active': 'Active',
    'emp.status_left': 'Left',
    'emp.col_id': 'ID',
    'emp.col_name': 'Name',
    'emp.col_biz': 'Biz Line',
    'emp.col_wh': 'Warehouse',
    'emp.col_pos': 'Position',
    'emp.col_grade': 'Grade',
    'emp.col_src': 'Source',
    'emp.col_rate': 'Rate',
    'emp.col_status': 'Status',
    'emp.col_join': 'Join Date',
    'emp.add_title': 'New Employee',
    'emp.edit_title': 'Edit Employee',
    'emp.f_name': 'Name *',
    'emp.f_phone': 'Phone',
    'emp.f_biz': 'Business Line',
    'emp.f_wh': 'Warehouse',
    'emp.f_pos': 'Position',
    'emp.f_grade': 'Grade',
    'emp.f_src': 'Source',
    'emp.f_rate': 'Hourly Rate (€/h)',
    'emp.f_settle': 'Settlement Type',
    'emp.f_contract_hrs': 'Contract Hours/Day',
    'emp.f_nationality': 'Nationality',
    'emp.f_join': 'Join Date',
    'emp.f_tax': 'Tax Method',
    'emp.f_pin': 'PIN (4 digits)',
    'emp.f_notes': 'Notes',
    'emp.src_own': 'Own',
    'emp.src_sup': 'Supplier',
    'ts.add': '+ Log Hours',
    'ts.batch': '✓ Batch Approve',
    'ts.add_title': 'Log Hours',
    'ts.col_id': 'ID',
    'ts.col_emp': 'Employee',
    'ts.col_grade': 'Grade',
    'ts.col_wh': 'Warehouse',
    'ts.col_date': 'Date',
    'ts.col_shift': 'Shift',
    'ts.col_hrs': 'Hours',
    'ts.col_base': 'Base Rate',
    'ts.col_shift_b': 'Shift+',
    'ts.col_eff': 'Eff. Rate',
    'ts.col_brutto': 'Brutto',
    'ts.col_perf': 'Perf.',
    'ts.col_net': 'Net',
    'ts.col_status': 'Status',
    'ts.col_action': 'Action',
    'ts.f_emp': 'Employee *',
    'ts.f_date': 'Work Date',
    'ts.f_start': 'Start Time',
    'ts.f_end': 'End Time',
    'ts.f_wh': 'Warehouse (leave blank = employee default)',
    'ts.f_shift': 'Shift',
    'ts.f_notes': 'Notes',
    'ts.auto_calc': 'Hours, Brutto, SSI, Net calculated automatically from employee rate',
    'ts.wh_approve': '✓WH',
    'ts.fin_approve': '✓Fin',
    'zk.add': '+ Manual Entry',
    'zk.add_title': 'Manual Zeitkonto Entry',
    'zk.col_emp': 'Employee',
    'zk.col_wh': 'Warehouse',
    'zk.col_grade': 'Grade',
    'zk.col_status': 'Compliance',
    'zk.arrange_rest': 'Schedule Rest',
    'zk.f_emp': 'Employee',
    'zk.f_date': 'Date',
    'zk.f_type': 'Type',
    'zk.f_hrs': 'Hours (h)',
    'zk.f_reason': 'Reason',
    'settle.emp_count': 'Employees',
    'settle.hours': 'Total Hours',
    'settle.brutto': 'Total Brutto',
    'settle.net': 'Total Net',
    'settle.col_emp': 'Employee',
    'settle.col_wh': 'Warehouse',
    'settle.col_biz': 'Biz Line',
    'settle.col_src': 'Source',
    'settle.col_hrs': 'Hours',
    'settle.col_count': 'Records',
    'ct.add': '+ New Container',
    'ct.add_title': 'New Container Record',
    'ct.col_no': 'Container No.',
    'ct.col_type': 'Type',
    'ct.col_wh': 'Warehouse',
    'ct.col_date': 'Date',
    'ct.col_start': 'Start',
    'ct.col_end': 'End',
    'ct.col_hrs': 'Hours',
    'ct.col_workers': 'Workers',
    'ct.col_video': 'Video',
    'ct.col_status': 'Status',
    'ct.complete': 'Complete',
    'ct.f_no': 'Container No. *',
    'ct.f_type': 'Type',
    'ct.f_date': 'Work Date',
    'ct.f_seal': 'Seal No.',
    'ct.f_start': 'Start Time',
    'ct.f_revenue': 'Client Revenue (€)',
    'ct.f_workers': 'Workers',
    'ct.f_notes': 'Notes',
    'clock.clock_in': 'Clock In',
    'clock.clock_out': 'Clock Out',
    'clock.clocked_in': '✓ Clocked In',
    'clock.not_clocked': '○ Not Clocked In',
    'log.col_time': 'Time',
    'log.col_user': 'User',
    'log.col_action': 'Action',
    'log.col_table': 'Object',
    'log.col_id': 'ID',
    'log.col_detail': 'Detail',
    'kb.search': 'Search documents...',
    'kb.all_cats': 'All',
    'kb.print': '⎙ Print',
    'grade.title': 'Grade & Pay Structure',
    'grade.col_grade': 'Grade',
    'grade.col_base': 'Base',
    'grade.col_mult': 'Mult.',
    'grade.col_gross': 'Gross/Month',
    'grade.col_mgmt': 'Mgmt Allow.',
    'grade.col_ot': 'OT h',
    'grade.col_cost': 'True Cost',
    'grade.col_hourly': 'Hourly Eq.',
    'grade.col_desc': 'Description',
    'wh.select': '← Select Warehouse',
    'wh.edit': 'Edit Rates',
    'wh.f_save': 'Save',
    'cost.title': 'Position Cost Calculator',
    'cost.calc': 'Calculate',
    'cost.f_type': 'Employment Type',
    'cost.f_grade': 'Grade',
    'cost.f_wh': 'Warehouse',
    'cost.f_weekly': 'Weekly Hours',
    'cost.f_months': 'Months',
    'nav.suppliers': 'Suppliers',
    'sup.add': '+ New Supplier',
    'sup.search': 'Search suppliers...',
    'sup.col_id': 'ID',
    'sup.col_name': 'Name',
    'sup.col_biz': 'Biz Line',
    'sup.col_contact': 'Contact',
    'sup.col_phone': 'Phone',
    'sup.col_email': 'Email',
    'sup.col_rating': 'Rating',
    'sup.col_status': 'Status',
    'sup.add_title': 'New Supplier',
    'sup.edit_title': 'Edit Supplier',
    'sup.f_name': 'Supplier Name *',
    'sup.f_biz': 'Business Line',
    'sup.f_contact': 'Contact Person',
    'sup.f_phone': 'Phone',
    'sup.f_email': 'Email',
    'sup.f_tax': 'Tax Handling',
    'sup.f_rating': 'Rating',
    'sup.f_notes': 'Notes',
    'zk.fz_title': 'Schedule Freizeitausgleich',
    'zk.fz_hours': 'Hours to compensate (h)',
    'zk.fz_btn': 'Confirm',
    'zk.fz_desc': 'Current +{{h}}h',
    'zk.fz_err': 'Please enter valid hours',
    'abm.revoke_title': 'Revoke Abmahnung',
    'abm.revoke_reason': 'Reason *',
    'abm.revoke_btn': 'Confirm Revoke',
    'abm.revoke_placeholder': 'Enter reason for revocation...',
    'abm.revoke_err': 'Please provide a reason',
    'ct.complete_title': 'Complete Container',
    'ct.complete_end': 'End Time',
    'ct.complete_btn': '✓ Confirm Complete',
    'ct.complete_hint': 'This will mark the container as done and video recorded.'
  },
  de: {
    'login.title': 'Yuanbo+579 HR',
    'login.admin': '👔 Admin-Login',
    'login.worker': '👷 Arbeiter-PIN',
    'login.username': 'Benutzername',
    'login.password': 'Passwort',
    'login.btn': 'Anmelden',
    'login.pin_label': 'Arbeiter-PIN (4 Ziffern)',
    'login.pin_btn': 'Stempeluhr',
    'login.err_empty': 'Bitte Benutzername und Passwort eingeben',
    'login.err_pin': 'Bitte 4-stellige PIN eingeben',
    'login.hint': 'admin/admin123 · hr/hr123 · finance/fin123 · wh_una/una123 · sup001/sup123 · mgr/mgr123 · worker01/worker123',
    'login.pin_hint': 'Test-PIN: 1001 (worker01 Zhang San)',
    'c.loading': 'Laden...',
    'c.load_fail': 'Ladefehler',
    'c.save': 'Speichern',
    'c.cancel': 'Abbrechen',
    'c.edit': 'Bearbeiten',
    'c.add': 'Hinzufügen',
    'c.submit': 'Absenden',
    'c.all': 'Alle',
    'c.search': 'Suchen',
    'c.close': 'Schließen',
    'c.confirm': 'Bestätigen',
    'c.logout': 'Abmelden',
    'c.no_data': 'Keine Daten',
    'c.notes': 'Notizen',
    'c.date': 'Datum',
    'c.status': 'Status',
    'c.action': 'Aktion',
    'c.name': 'Name',
    'c.phone': 'Telefon',
    'c.starting': 'System startet…',
    'nav.dashboard': 'Dashboard',
    'nav.employees': 'Mitarbeiter',
    'nav.timesheets': 'Arbeitszeiterfassung',
    'nav.zeitkonto': 'Zeitkonto',
    'nav.settlement': 'Monatsabrechnung',
    'nav.containers': 'Container-Protokoll',
    'nav.werkvertrag': 'Werkvertrag-Projekte',
    'nav.abmahnung': 'Abmahnung',
    'nav.clock': 'Stempeluhr',
    'nav.grades': 'Lohn- & Gehaltsstufen',
    'nav.warehouse_rates': 'Lagertarife',
    'nav.cost_calc': 'Kostenkalkulation',
    'nav.docs': 'Unternehmensdoku',
    'nav.logs': 'Audit-Protokoll',
    'dash.employees': 'Aktive Mitarbeiter',
    'dash.pending_ts': 'Ausstehende Genehmigungen',
    'dash.total_hours': 'Gesamtstunden (Periode)',
    'dash.abmahnung': 'Aktive Abmahnungen',
    'dash.zk_alerts': 'Zeitkonto-Warnungen',
    'dash.wv_active': 'Aktive WV-Projekte',
    'dash.chart': '📊 Arbeitsstunden letzte 7 Tage',
    'dash.no_data': 'Keine Zeitdaten vorhanden',
    'emp.new': '+ Neuer Mitarbeiter',
    'emp.search': 'Name/ID/Telefon suchen...',
    'emp.status_active': 'Beschäftigt',
    'emp.status_left': 'Ausgeschieden',
    'emp.col_id': 'ID',
    'emp.col_name': 'Name',
    'emp.col_biz': 'Geschäftsbereich',
    'emp.col_wh': 'Lager',
    'emp.col_pos': 'Position',
    'emp.col_grade': 'Stufe',
    'emp.col_src': 'Quelle',
    'emp.col_rate': 'Stundenlohn',
    'emp.col_status': 'Status',
    'emp.col_join': 'Eintrittsdatum',
    'emp.add_title': 'Neuer Mitarbeiter',
    'emp.edit_title': 'Mitarbeiter bearbeiten',
    'emp.f_name': 'Name *',
    'emp.f_phone': 'Telefon',
    'emp.f_biz': 'Geschäftsbereich',
    'emp.f_wh': 'Lager',
    'emp.f_pos': 'Position',
    'emp.f_grade': 'Stufe',
    'emp.f_src': 'Quelle',
    'emp.f_rate': 'Stundenlohn (€/h)',
    'emp.f_settle': 'Abrechnungsart',
    'emp.f_contract_hrs': 'Vertragliche Stunden/Tag',
    'emp.f_nationality': 'Nationalität',
    'emp.f_join': 'Eintrittsdatum',
    'emp.f_tax': 'Steuermethode',
    'emp.f_pin': 'PIN (4 Ziffern)',
    'emp.f_notes': 'Notizen',
    'emp.src_own': 'Eigen',
    'emp.src_sup': 'Lieferant',
    'ts.add': '+ Stunden erfassen',
    'ts.batch': '✓ Sammelgenehmigung',
    'ts.add_title': 'Stunden erfassen',
    'ts.col_id': 'ID',
    'ts.col_emp': 'Mitarbeiter',
    'ts.col_grade': 'Stufe',
    'ts.col_wh': 'Lager',
    'ts.col_date': 'Datum',
    'ts.col_shift': 'Schicht',
    'ts.col_hrs': 'Stunden',
    'ts.col_base': 'Grundlohn',
    'ts.col_shift_b': 'Schicht+',
    'ts.col_eff': 'Eff. Satz',
    'ts.col_brutto': 'Brutto',
    'ts.col_perf': 'Leistung',
    'ts.col_net': 'Netto',
    'ts.col_status': 'Status',
    'ts.col_action': 'Aktion',
    'ts.f_emp': 'Mitarbeiter *',
    'ts.f_date': 'Arbeitsdatum',
    'ts.f_start': 'Startzeit',
    'ts.f_end': 'Endzeit',
    'ts.f_wh': 'Lager (leer = Standard)',
    'ts.f_shift': 'Schicht',
    'ts.f_notes': 'Notizen',
    'ts.auto_calc': 'Stunden, Brutto, SSI und Netto werden automatisch berechnet',
    'ts.wh_approve': '✓Lager',
    'ts.fin_approve': '✓Fin',
    'zk.add': '+ Manueller Eintrag',
    'zk.add_title': 'Zeitkonto manuell erfassen',
    'zk.col_emp': 'Mitarbeiter',
    'zk.col_wh': 'Lager',
    'zk.col_grade': 'Stufe',
    'zk.col_status': 'Compliance',
    'zk.arrange_rest': 'Ausgleich planen',
    'zk.f_emp': 'Mitarbeiter',
    'zk.f_date': 'Datum',
    'zk.f_type': 'Typ',
    'zk.f_hrs': 'Stunden (h)',
    'zk.f_reason': 'Begründung',
    'settle.emp_count': 'Mitarbeiter',
    'settle.hours': 'Gesamtstunden',
    'settle.brutto': 'Brutto gesamt',
    'settle.net': 'Netto gesamt',
    'settle.col_emp': 'Mitarbeiter',
    'settle.col_wh': 'Lager',
    'settle.col_biz': 'Bereich',
    'settle.col_src': 'Quelle',
    'settle.col_hrs': 'Stunden',
    'settle.col_count': 'Einträge',
    'ct.add': '+ Neues Container-Protokoll',
    'ct.add_title': 'Container-Protokoll erfassen',
    'ct.col_no': 'Container-Nr.',
    'ct.col_type': 'Typ',
    'ct.col_wh': 'Lager',
    'ct.col_date': 'Datum',
    'ct.col_start': 'Start',
    'ct.col_end': 'Ende',
    'ct.col_hrs': 'Stunden',
    'ct.col_workers': 'Arbeiter',
    'ct.col_video': 'Video',
    'ct.col_status': 'Status',
    'ct.complete': 'Abschließen',
    'ct.f_no': 'Container-Nr. *',
    'ct.f_type': 'Typ',
    'ct.f_date': 'Datum',
    'ct.f_seal': 'Plomben-Nr.',
    'ct.f_start': 'Startzeit',
    'ct.f_revenue': 'Kundenabrechnung (€)',
    'ct.f_workers': 'Arbeiter',
    'ct.f_notes': 'Notizen',
    'clock.clock_in': 'Einstempeln',
    'clock.clock_out': 'Ausstempeln',
    'clock.clocked_in': '✓ Eingestempelt',
    'clock.not_clocked': '○ Noch nicht gestempelt',
    'log.col_time': 'Zeit',
    'log.col_user': 'Benutzer',
    'log.col_action': 'Aktion',
    'log.col_table': 'Objekt',
    'log.col_id': 'ID',
    'log.col_detail': 'Details',
    'kb.search': 'Dokumente suchen...',
    'kb.all_cats': 'Alle',
    'kb.print': '⎙ Drucken',
    'grade.title': 'Lohn- & Gehaltsstufen',
    'grade.col_grade': 'Stufe',
    'grade.col_base': 'Grundlohn',
    'grade.col_mult': 'Faktor',
    'grade.col_gross': 'Brutto/Monat',
    'grade.col_mgmt': 'Führungszuschlag',
    'grade.col_ot': 'ÜSt h',
    'grade.col_cost': 'Echte Kosten',
    'grade.col_hourly': 'Effekt. Std.',
    'grade.col_desc': 'Beschreibung',
    'wh.select': '← Lager auswählen',
    'wh.edit': 'Tarife bearbeiten',
    'wh.f_save': 'Speichern',
    'cost.title': 'Stellenkostenkalkulation',
    'cost.calc': 'Berechnen',
    'cost.f_type': 'Beschäftigungsart',
    'cost.f_grade': 'Stufe',
    'cost.f_wh': 'Lager',
    'cost.f_weekly': 'Wochenstunden',
    'cost.f_months': 'Monate',
    'nav.suppliers': 'Lieferanten',
    'sup.add': '+ Neuer Lieferant',
    'sup.search': 'Lieferanten suchen...',
    'sup.col_id': 'ID',
    'sup.col_name': 'Name',
    'sup.col_biz': 'Bereich',
    'sup.col_contact': 'Kontakt',
    'sup.col_phone': 'Telefon',
    'sup.col_email': 'E-Mail',
    'sup.col_rating': 'Bewertung',
    'sup.col_status': 'Status',
    'sup.add_title': 'Neuer Lieferant',
    'sup.edit_title': 'Lieferant bearbeiten',
    'sup.f_name': 'Lieferantenname *',
    'sup.f_biz': 'Geschäftsbereich',
    'sup.f_contact': 'Kontaktperson',
    'sup.f_phone': 'Telefon',
    'sup.f_email': 'E-Mail',
    'sup.f_tax': 'Steuerbehandlung',
    'sup.f_rating': 'Bewertung',
    'sup.f_notes': 'Notizen',
    'zk.fz_title': 'Freizeitausgleich planen',
    'zk.fz_hours': 'Stunden ausgleichen (h)',
    'zk.fz_btn': 'Bestätigen',
    'zk.fz_desc': 'Aktuell +{{h}}h',
    'zk.fz_err': 'Bitte gültige Stunden eingeben',
    'abm.revoke_title': 'Abmahnung widerrufen',
    'abm.revoke_reason': 'Grund *',
    'abm.revoke_btn': 'Widerruf bestätigen',
    'abm.revoke_placeholder': 'Grund eingeben...',
    'abm.revoke_err': 'Bitte Grund angeben',
    'ct.complete_title': 'Container abschließen',
    'ct.complete_end': 'Endzeit',
    'ct.complete_btn': '✓ Abschluss bestätigen',
    'ct.complete_hint': 'Container wird als fertig und Video aufgezeichnet markiert.'
  },
  ar: {
    'login.title': 'Yuanbo+579 HR',
    'login.admin': '👔 دخول المسؤول',
    'login.worker': '👷 رمز العامل',
    'login.username': 'اسم المستخدم',
    'login.password': 'كلمة المرور',
    'login.btn': 'تسجيل الدخول',
    'login.pin_label': 'رمز العامل (4 أرقام)',
    'login.pin_btn': 'تسجيل الحضور',
    'login.err_empty': 'يرجى إدخال اسم المستخدم وكلمة المرور',
    'login.err_pin': 'يرجى إدخال رمز مكون من 4 أرقام',
    'login.hint': 'admin/admin123 · hr/hr123 · finance/fin123 · mgr/mgr123 · worker01/worker123',
    'login.pin_hint': 'رموز الاختبار: 1001 (worker01)',
    'c.loading': 'جار التحميل...',
    'c.load_fail': 'فشل التحميل',
    'c.save': 'حفظ',
    'c.cancel': 'إلغاء',
    'c.edit': 'تعديل',
    'c.add': 'إضافة',
    'c.submit': 'إرسال',
    'c.all': 'الكل',
    'c.search': 'بحث',
    'c.close': 'إغلاق',
    'c.confirm': 'تأكيد',
    'c.logout': 'تسجيل الخروج',
    'c.no_data': 'لا توجد بيانات',
    'c.notes': 'ملاحظات',
    'c.date': 'التاريخ',
    'c.status': 'الحالة',
    'c.action': 'إجراء',
    'c.name': 'الاسم',
    'c.phone': 'الهاتف',
    'c.starting': 'يبدأ النظام…',
    'nav.dashboard': 'لوحة التحكم',
    'nav.employees': 'الموظفون',
    'nav.timesheets': 'سجلات الوقت',
    'nav.zeitkonto': 'Zeitkonto',
    'nav.settlement': 'التسوية الشهرية',
    'nav.containers': 'سجلات الحاويات',
    'nav.werkvertrag': 'مشاريع Werkvertrag',
    'nav.abmahnung': 'Abmahnung',
    'nav.clock': 'الحضور والانصراف',
    'nav.grades': 'هيكل الرواتب',
    'nav.warehouse_rates': 'تعريفات المستودع',
    'nav.cost_calc': 'حاسبة التكاليف',
    'nav.docs': 'وثائق الشركة',
    'nav.logs': 'سجل التدقيق',
    'dash.employees': 'الموظفون النشطون',
    'dash.pending_ts': 'في انتظار الموافقة',
    'dash.total_hours': 'إجمالي الساعات',
    'dash.abmahnung': 'Abmahnung النشطة',
    'dash.zk_alerts': 'تنبيهات Zeitkonto',
    'dash.wv_active': 'مشاريع WV النشطة',
    'dash.chart': '📊 ساعات آخر 7 أيام',
    'dash.no_data': 'لا توجد بيانات',
    'emp.new': '+ موظف جديد',
    'emp.search': 'بحث عن اسم/ID/هاتف...',
    'emp.status_active': 'نشط',
    'emp.status_left': 'منتهي',
    'emp.col_id': 'ID',
    'emp.col_name': 'الاسم',
    'emp.col_biz': 'خط العمل',
    'emp.col_wh': 'المستودع',
    'emp.col_pos': 'المنصب',
    'emp.col_grade': 'الدرجة',
    'emp.col_src': 'المصدر',
    'emp.col_rate': 'الأجر',
    'emp.col_status': 'الحالة',
    'emp.col_join': 'تاريخ التعيين',
    'emp.add_title': 'موظف جديد',
    'emp.edit_title': 'تعديل الموظف',
    'emp.f_name': 'الاسم *',
    'emp.f_phone': 'الهاتف',
    'emp.f_biz': 'خط العمل',
    'emp.f_wh': 'المستودع',
    'emp.f_pos': 'المنصب',
    'emp.f_grade': 'الدرجة',
    'emp.f_src': 'المصدر',
    'emp.f_rate': 'الأجر بالساعة (€/h)',
    'emp.f_settle': 'نوع التسوية',
    'emp.f_contract_hrs': 'ساعات العقد/يوم',
    'emp.f_nationality': 'الجنسية',
    'emp.f_join': 'تاريخ التعيين',
    'emp.f_tax': 'طريقة الضريبة',
    'emp.f_pin': 'رمز PIN (4 أرقام)',
    'emp.f_notes': 'ملاحظات',
    'emp.src_own': 'مباشر',
    'emp.src_sup': 'مورد',
    'ts.add': '+ تسجيل الساعات',
    'ts.batch': '✓ الموافقة الجماعية',
    'ts.add_title': 'تسجيل ساعات العمل',
    'ts.col_id': 'ID',
    'ts.col_emp': 'الموظف',
    'ts.col_grade': 'الدرجة',
    'ts.col_wh': 'المستودع',
    'ts.col_date': 'التاريخ',
    'ts.col_shift': 'الوردية',
    'ts.col_hrs': 'الساعات',
    'ts.col_base': 'الأساسي',
    'ts.col_shift_b': 'إضافة الوردية',
    'ts.col_eff': 'الفعلي',
    'ts.col_brutto': 'Brutto',
    'ts.col_perf': 'الأداء',
    'ts.col_net': 'Netto',
    'ts.col_status': 'الحالة',
    'ts.col_action': 'إجراء',
    'ts.f_emp': 'الموظف *',
    'ts.f_date': 'تاريخ العمل',
    'ts.f_start': 'وقت البداية',
    'ts.f_end': 'وقت النهاية',
    'ts.f_wh': 'المستودع',
    'ts.f_shift': 'الوردية',
    'ts.f_notes': 'ملاحظات',
    'ts.auto_calc': 'يتم الحساب تلقائياً',
    'ts.wh_approve': '✓مستودع',
    'ts.fin_approve': '✓مالية',
    'zk.add': '+ إدخال يدوي',
    'zk.add_title': 'إدخال Zeitkonto يدوياً',
    'zk.col_emp': 'الموظف',
    'zk.col_wh': 'المستودع',
    'zk.col_grade': 'الدرجة',
    'zk.col_status': 'الامتثال',
    'zk.arrange_rest': 'جدولة الراحة',
    'zk.f_emp': 'الموظف',
    'zk.f_date': 'التاريخ',
    'zk.f_type': 'النوع',
    'zk.f_hrs': 'الساعات (h)',
    'zk.f_reason': 'السبب',
    'settle.emp_count': 'الموظفون',
    'settle.hours': 'إجمالي الساعات',
    'settle.brutto': 'إجمالي Brutto',
    'settle.net': 'إجمالي Netto',
    'settle.col_emp': 'الموظف',
    'settle.col_wh': 'المستودع',
    'settle.col_biz': 'الخط',
    'settle.col_src': 'المصدر',
    'settle.col_hrs': 'الساعات',
    'settle.col_count': 'السجلات',
    'ct.add': '+ حاوية جديدة',
    'ct.add_title': 'تسجيل حاوية جديدة',
    'ct.col_no': 'رقم الحاوية',
    'ct.col_type': 'النوع',
    'ct.col_wh': 'المستودع',
    'ct.col_date': 'التاريخ',
    'ct.col_start': 'البداية',
    'ct.col_end': 'النهاية',
    'ct.col_hrs': 'الساعات',
    'ct.col_workers': 'العمال',
    'ct.col_video': 'فيديو',
    'ct.col_status': 'الحالة',
    'ct.complete': 'إنهاء',
    'ct.f_no': 'رقم الحاوية *',
    'ct.f_type': 'النوع',
    'ct.f_date': 'تاريخ العمل',
    'ct.f_seal': 'رقم الختم',
    'ct.f_start': 'وقت البداية',
    'ct.f_revenue': 'إيرادات العميل (€)',
    'ct.f_workers': 'العمال',
    'ct.f_notes': 'ملاحظات',
    'clock.clock_in': 'تسجيل الحضور',
    'clock.clock_out': 'تسجيل الانصراف',
    'clock.clocked_in': '✓ تم تسجيل الحضور',
    'clock.not_clocked': '○ لم تسجل حضوراً بعد',
    'log.col_time': 'الوقت',
    'log.col_user': 'المستخدم',
    'log.col_action': 'الإجراء',
    'log.col_table': 'الجدول',
    'log.col_id': 'ID',
    'log.col_detail': 'التفاصيل',
    'kb.search': 'بحث في الوثائق...',
    'kb.all_cats': 'الكل',
    'kb.print': '⎙ طباعة',
    'grade.title': 'هيكل الرواتب',
    'grade.col_grade': 'الدرجة',
    'grade.col_base': 'الأساسي',
    'grade.col_mult': 'المضاعف',
    'grade.col_gross': 'Brutto/شهر',
    'grade.col_mgmt': 'بدل الإدارة',
    'grade.col_ot': 'إضافي h',
    'grade.col_cost': 'التكلفة الحقيقية',
    'grade.col_hourly': 'مكافئ الساعة',
    'grade.col_desc': 'الوصف',
    'wh.select': '← اختر المستودع',
    'wh.edit': 'تعديل التعريفات',
    'wh.f_save': 'حفظ',
    'cost.title': 'حاسبة تكاليف المنصب',
    'cost.calc': 'احسب',
    'cost.f_type': 'نوع التوظيف',
    'cost.f_grade': 'الدرجة',
    'cost.f_wh': 'المستودع',
    'cost.f_weekly': 'ساعات أسبوعية',
    'cost.f_months': 'أشهر',
    'nav.suppliers': 'الموردون',
    'sup.add': '+ مورد جديد',
    'sup.search': 'بحث في الموردين...',
    'sup.col_id': 'ID',
    'sup.col_name': 'الاسم',
    'sup.col_biz': 'خط العمل',
    'sup.col_contact': 'جهة الاتصال',
    'sup.col_phone': 'الهاتف',
    'sup.col_email': 'البريد',
    'sup.col_rating': 'التقييم',
    'sup.col_status': 'الحالة',
    'sup.add_title': 'مورد جديد',
    'sup.edit_title': 'تعديل المورد',
    'sup.f_name': 'اسم المورد *',
    'sup.f_biz': 'خط العمل',
    'sup.f_contact': 'شخص الاتصال',
    'sup.f_phone': 'الهاتف',
    'sup.f_email': 'البريد',
    'sup.f_tax': 'طريقة الضريبة',
    'sup.f_rating': 'التقييم',
    'sup.f_notes': 'ملاحظات',
    'zk.fz_title': 'جدولة Freizeitausgleich',
    'zk.fz_hours': 'ساعات التعويض (h)',
    'zk.fz_btn': 'تأكيد',
    'zk.fz_desc': 'الحالي +{{h}}h',
    'zk.fz_err': 'يرجى إدخال ساعات صحيحة',
    'abm.revoke_title': 'إلغاء Abmahnung',
    'abm.revoke_reason': 'السبب *',
    'abm.revoke_btn': 'تأكيد الإلغاء',
    'abm.revoke_placeholder': 'أدخل سبب الإلغاء...',
    'abm.revoke_err': 'يرجى تقديم سبب',
    'ct.complete_title': 'إتمام الحاوية',
    'ct.complete_end': 'وقت الانتهاء',
    'ct.complete_btn': '✓ تأكيد الإتمام',
    'ct.complete_hint': 'سيتم تحديد الحاوية كمكتملة ومسجلة.'
  },
  hu: {
    'login.title': 'Yuanbo+579 HR',
    'login.admin': '👔 Admin bejelentkezés',
    'login.worker': '👷 Munkás PIN',
    'login.username': 'Felhasználónév',
    'login.password': 'Jelszó',
    'login.btn': 'Bejelentkezés',
    'login.pin_label': 'Munkás PIN (4 jegyű)',
    'login.pin_btn': 'Jelenléti rögzítés',
    'login.err_empty': 'Kérem adja meg a felhasználónevet és jelszót',
    'login.err_pin': 'Kérem adja meg a 4 jegyű PIN-t',
    'login.hint': 'admin/admin123 · hr/hr123 · finance/fin123 · mgr/mgr123 · worker01/worker123',
    'login.pin_hint': 'Teszt PIN: 1001 (worker01)',
    'c.loading': 'Töltés...',
    'c.load_fail': 'Betöltési hiba',
    'c.save': 'Mentés',
    'c.cancel': 'Mégse',
    'c.edit': 'Szerkesztés',
    'c.add': 'Hozzáadás',
    'c.submit': 'Küldés',
    'c.all': 'Összes',
    'c.search': 'Keresés',
    'c.close': 'Bezárás',
    'c.confirm': 'Megerősítés',
    'c.logout': 'Kijelentkezés',
    'c.no_data': 'Nincs adat',
    'c.notes': 'Megjegyzések',
    'c.date': 'Dátum',
    'c.status': 'Állapot',
    'c.action': 'Művelet',
    'c.name': 'Név',
    'c.phone': 'Telefon',
    'c.starting': 'Rendszer indul…',
    'nav.dashboard': 'Irányítópult',
    'nav.employees': 'Alkalmazottak',
    'nav.timesheets': 'Munkaidő-nyilvántartás',
    'nav.zeitkonto': 'Zeitkonto',
    'nav.settlement': 'Havi elszámolás',
    'nav.containers': 'Konténer-nyilvántartás',
    'nav.werkvertrag': 'Werkvertrag projektek',
    'nav.abmahnung': 'Abmahnung',
    'nav.clock': 'Jelenléti',
    'nav.grades': 'Bérsáv struktúra',
    'nav.warehouse_rates': 'Raktári díjak',
    'nav.cost_calc': 'Költségkalkulátor',
    'nav.docs': 'Vállalati dokumentumok',
    'nav.logs': 'Audit napló',
    'dash.employees': 'Aktív alkalmazottak',
    'dash.pending_ts': 'Jóváhagyásra vár',
    'dash.total_hours': 'Összes óra (időszak)',
    'dash.abmahnung': 'Aktív Abmahnungen',
    'dash.zk_alerts': 'Zeitkonto figyelmeztetések',
    'dash.wv_active': 'Aktív WV projektek',
    'dash.chart': '📊 Utolsó 7 nap munkaideje',
    'dash.no_data': 'Nincs munkaidő adat',
    'emp.new': '+ Új alkalmazott',
    'emp.search': 'Név/ID/Telefon keresése...',
    'emp.status_active': 'Aktív',
    'emp.status_left': 'Kilépett',
    'emp.col_id': 'ID',
    'emp.col_name': 'Név',
    'emp.col_biz': 'Üzleti vonal',
    'emp.col_wh': 'Raktár',
    'emp.col_pos': 'Pozíció',
    'emp.col_grade': 'Fokozat',
    'emp.col_src': 'Forrás',
    'emp.col_rate': 'Órabér',
    'emp.col_status': 'Állapot',
    'emp.col_join': 'Belépés dátuma',
    'emp.add_title': 'Új alkalmazott',
    'emp.edit_title': 'Alkalmazott szerkesztése',
    'emp.f_name': 'Név *',
    'emp.f_phone': 'Telefon',
    'emp.f_biz': 'Üzleti vonal',
    'emp.f_wh': 'Raktár',
    'emp.f_pos': 'Pozíció',
    'emp.f_grade': 'Fokozat',
    'emp.f_src': 'Forrás',
    'emp.f_rate': 'Órabér (€/h)',
    'emp.f_settle': 'Elszámolás típusa',
    'emp.f_contract_hrs': 'Szerz. óra/nap',
    'emp.f_nationality': 'Állampolgárság',
    'emp.f_join': 'Belépés dátuma',
    'emp.f_tax': 'Adózás módja',
    'emp.f_pin': 'PIN (4 jegyű)',
    'emp.f_notes': 'Megjegyzések',
    'emp.src_own': 'Saját',
    'emp.src_sup': 'Szállító',
    'ts.add': '+ Munkaidő rögzítése',
    'ts.batch': '✓ Tömeges jóváhagyás',
    'ts.add_title': 'Munkaidő rögzítése',
    'ts.col_id': 'ID',
    'ts.col_emp': 'Alkalmazott',
    'ts.col_grade': 'Fokozat',
    'ts.col_wh': 'Raktár',
    'ts.col_date': 'Dátum',
    'ts.col_shift': 'Műszak',
    'ts.col_hrs': 'Órák',
    'ts.col_base': 'Alapbér',
    'ts.col_shift_b': 'Műszak+',
    'ts.col_eff': 'Eff. díj',
    'ts.col_brutto': 'Bruttó',
    'ts.col_perf': 'Teljesítmény',
    'ts.col_net': 'Nettó',
    'ts.col_status': 'Állapot',
    'ts.col_action': 'Művelet',
    'ts.f_emp': 'Alkalmazott *',
    'ts.f_date': 'Munkadátum',
    'ts.f_start': 'Kezdési idő',
    'ts.f_end': 'Befejezési idő',
    'ts.f_wh': 'Raktár (üres = alapért.)',
    'ts.f_shift': 'Műszak',
    'ts.f_notes': 'Megjegyzések',
    'ts.auto_calc': 'Az órákat, bruttót, SSI-t és nettót a rendszer automatikusan számítja',
    'ts.wh_approve': '✓Raktár',
    'ts.fin_approve': '✓Pénz',
    'zk.add': '+ Manuális rögzítés',
    'zk.add_title': 'Zeitkonto manuális rögzítése',
    'zk.col_emp': 'Alkalmazott',
    'zk.col_wh': 'Raktár',
    'zk.col_grade': 'Fokozat',
    'zk.col_status': 'Megfelelőség',
    'zk.arrange_rest': 'Pihenő tervezése',
    'zk.f_emp': 'Alkalmazott',
    'zk.f_date': 'Dátum',
    'zk.f_type': 'Típus',
    'zk.f_hrs': 'Óra (h)',
    'zk.f_reason': 'Ok',
    'settle.emp_count': 'Alkalmazottak',
    'settle.hours': 'Összes óra',
    'settle.brutto': 'Összes bruttó',
    'settle.net': 'Összes nettó',
    'settle.col_emp': 'Alkalmazott',
    'settle.col_wh': 'Raktár',
    'settle.col_biz': 'Üzleti vonal',
    'settle.col_src': 'Forrás',
    'settle.col_hrs': 'Órák',
    'settle.col_count': 'Rekordok',
    'ct.add': '+ Új konténer',
    'ct.add_title': 'Konténer-nyilvántartás rögzítése',
    'ct.col_no': 'Konténer sz.',
    'ct.col_type': 'Típus',
    'ct.col_wh': 'Raktár',
    'ct.col_date': 'Dátum',
    'ct.col_start': 'Kezdés',
    'ct.col_end': 'Befejezés',
    'ct.col_hrs': 'Órák',
    'ct.col_workers': 'Munkások',
    'ct.col_video': 'Videó',
    'ct.col_status': 'Állapot',
    'ct.complete': 'Befejezés',
    'ct.f_no': 'Konténer sz. *',
    'ct.f_type': 'Típus',
    'ct.f_date': 'Munkadátum',
    'ct.f_seal': 'Plomba sz.',
    'ct.f_start': 'Kezdési idő',
    'ct.f_revenue': 'Ügyfél bevétel (€)',
    'ct.f_workers': 'Munkások',
    'ct.f_notes': 'Megjegyzések',
    'clock.clock_in': 'Érkezés rögzítése',
    'clock.clock_out': 'Távozás rögzítése',
    'clock.clocked_in': '✓ Rögzítve (érkezés)',
    'clock.not_clocked': '○ Még nem rögzített',
    'log.col_time': 'Idő',
    'log.col_user': 'Felhasználó',
    'log.col_action': 'Művelet',
    'log.col_table': 'Objektum',
    'log.col_id': 'ID',
    'log.col_detail': 'Részletek',
    'kb.search': 'Dokumentumok keresése...',
    'kb.all_cats': 'Összes',
    'kb.print': '⎙ Nyomtatás',
    'grade.title': 'Bérsáv struktúra',
    'grade.col_grade': 'Fokozat',
    'grade.col_base': 'Alap',
    'grade.col_mult': 'Szorzó',
    'grade.col_gross': 'Bruttó/hó',
    'grade.col_mgmt': 'Vezet. pótlék',
    'grade.col_ot': 'Túlóra h',
    'grade.col_cost': 'Valódi költség',
    'grade.col_hourly': 'Eff. órabér',
    'grade.col_desc': 'Leírás',
    'wh.select': '← Raktár kiválasztása',
    'wh.edit': 'Díjak szerkesztése',
    'wh.f_save': 'Mentés',
    'cost.title': 'Pozíció-költségkalkulátor',
    'cost.calc': 'Számítás',
    'cost.f_type': 'Foglalkoztatás típusa',
    'cost.f_grade': 'Fokozat',
    'cost.f_wh': 'Raktár',
    'cost.f_weekly': 'Heti órák',
    'cost.f_months': 'Hónapok',
    'nav.suppliers': 'Szállítók',
    'sup.add': '+ Új szállító',
    'sup.search': 'Szállítók keresése...',
    'sup.col_id': 'ID',
    'sup.col_name': 'Név',
    'sup.col_biz': 'Üzletág',
    'sup.col_contact': 'Kapcsolat',
    'sup.col_phone': 'Telefon',
    'sup.col_email': 'E-mail',
    'sup.col_rating': 'Értékelés',
    'sup.col_status': 'Állapot',
    'sup.add_title': 'Új szállító',
    'sup.edit_title': 'Szállító szerkesztése',
    'sup.f_name': 'Szállító neve *',
    'sup.f_biz': 'Üzletág',
    'sup.f_contact': 'Kapcsolattartó',
    'sup.f_phone': 'Telefon',
    'sup.f_email': 'E-mail',
    'sup.f_tax': 'Adókezelés',
    'sup.f_rating': 'Értékelés',
    'sup.f_notes': 'Megjegyzések',
    'zk.fz_title': 'Freizeitausgleich tervezése',
    'zk.fz_hours': 'Kompenzálandó órák (h)',
    'zk.fz_btn': 'Megerősítés',
    'zk.fz_desc': 'Jelenlegi +{{h}}h',
    'zk.fz_err': 'Kérjük adjon meg érvényes óraszámot',
    'abm.revoke_title': 'Abmahnung visszavonása',
    'abm.revoke_reason': 'Ok *',
    'abm.revoke_btn': 'Visszavonás megerősítése',
    'abm.revoke_placeholder': 'Adja meg a visszavonás okát...',
    'abm.revoke_err': 'Kérjük adja meg az okot',
    'ct.complete_title': 'Konténer befejezése',
    'ct.complete_end': 'Befejezési idő',
    'ct.complete_btn': '✓ Befejezés megerősítése',
    'ct.complete_hint': 'A konténer befejezettnek és a videó rögzítettnek lesz jelölve.'
  },
  vi: {
    'login.title': 'Yuanbo+579 HR',
    'login.admin': '👔 Đăng nhập Quản lý',
    'login.worker': '👷 PIN Công nhân',
    'login.username': 'Tên đăng nhập',
    'login.password': 'Mật khẩu',
    'login.btn': 'Đăng nhập',
    'login.pin_label': 'PIN công nhân (4 chữ số)',
    'login.pin_btn': 'Chấm công',
    'login.err_empty': 'Vui lòng nhập tên đăng nhập và mật khẩu',
    'login.err_pin': 'Vui lòng nhập PIN 4 chữ số',
    'login.hint': 'admin/admin123 · hr/hr123 · finance/fin123 · mgr/mgr123 · worker01/worker123',
    'login.pin_hint': 'PIN thử nghiệm: 1001 (worker01)',
    'c.loading': 'Đang tải...',
    'c.load_fail': 'Tải thất bại',
    'c.save': 'Lưu',
    'c.cancel': 'Hủy',
    'c.edit': 'Chỉnh sửa',
    'c.add': 'Thêm mới',
    'c.submit': 'Gửi',
    'c.all': 'Tất cả',
    'c.search': 'Tìm kiếm',
    'c.close': 'Đóng',
    'c.confirm': 'Xác nhận',
    'c.logout': 'Đăng xuất',
    'c.no_data': 'Không có dữ liệu',
    'c.notes': 'Ghi chú',
    'c.date': 'Ngày',
    'c.status': 'Trạng thái',
    'c.action': 'Thao tác',
    'c.name': 'Họ tên',
    'c.phone': 'Điện thoại',
    'c.starting': 'Hệ thống đang khởi động…',
    'nav.dashboard': 'Bảng điều khiển',
    'nav.employees': 'Nhân viên',
    'nav.timesheets': 'Chấm công',
    'nav.zeitkonto': 'Zeitkonto',
    'nav.settlement': 'Quyết toán tháng',
    'nav.containers': 'Nhật ký container',
    'nav.werkvertrag': 'Dự án Werkvertrag',
    'nav.abmahnung': 'Abmahnung',
    'nav.clock': 'Chấm công',
    'nav.grades': 'Cơ cấu lương',
    'nav.warehouse_rates': 'Giá kho',
    'nav.cost_calc': 'Tính chi phí',
    'nav.docs': 'Tài liệu công ty',
    'nav.logs': 'Nhật ký kiểm toán',
    'dash.employees': 'Nhân viên đang làm',
    'dash.pending_ts': 'Chờ duyệt',
    'dash.total_hours': 'Tổng giờ làm',
    'dash.abmahnung': 'Abmahnung hiệu lực',
    'dash.zk_alerts': 'Cảnh báo Zeitkonto',
    'dash.wv_active': 'Dự án WV đang chạy',
    'dash.chart': '📊 Giờ làm 7 ngày gần nhất',
    'dash.no_data': 'Chưa có dữ liệu chấm công',
    'emp.new': '+ Thêm nhân viên',
    'emp.search': 'Tìm tên/ID/SĐT...',
    'emp.status_active': 'Đang làm',
    'emp.status_left': 'Đã nghỉ',
    'emp.col_id': 'ID',
    'emp.col_name': 'Họ tên',
    'emp.col_biz': 'Dòng KD',
    'emp.col_wh': 'Kho',
    'emp.col_pos': 'Vị trí',
    'emp.col_grade': 'Cấp',
    'emp.col_src': 'Nguồn',
    'emp.col_rate': 'Lương/h',
    'emp.col_status': 'Trạng thái',
    'emp.col_join': 'Ngày vào',
    'emp.add_title': 'Thêm nhân viên',
    'emp.edit_title': 'Sửa nhân viên',
    'emp.f_name': 'Họ tên *',
    'emp.f_phone': 'Điện thoại',
    'emp.f_biz': 'Dòng kinh doanh',
    'emp.f_wh': 'Kho',
    'emp.f_pos': 'Vị trí',
    'emp.f_grade': 'Cấp bậc',
    'emp.f_src': 'Nguồn',
    'emp.f_rate': 'Lương/giờ (€/h)',
    'emp.f_settle': 'Cách tính lương',
    'emp.f_contract_hrs': 'Giờ HĐ/ngày',
    'emp.f_nationality': 'Quốc tịch',
    'emp.f_join': 'Ngày vào',
    'emp.f_tax': 'Cách khai thuế',
    'emp.f_pin': 'PIN (4 số)',
    'emp.f_notes': 'Ghi chú',
    'emp.src_own': 'Trực tiếp',
    'emp.src_sup': 'Nhà cung cấp',
    'ts.add': '+ Nhập giờ làm',
    'ts.batch': '✓ Duyệt hàng loạt',
    'ts.add_title': 'Nhập giờ làm',
    'ts.col_id': 'ID',
    'ts.col_emp': 'Nhân viên',
    'ts.col_grade': 'Cấp',
    'ts.col_wh': 'Kho',
    'ts.col_date': 'Ngày',
    'ts.col_shift': 'Ca',
    'ts.col_hrs': 'Giờ',
    'ts.col_base': 'Lương CB',
    'ts.col_shift_b': 'Phụ ca',
    'ts.col_eff': 'Tỷ lệ TT',
    'ts.col_brutto': 'Brutto',
    'ts.col_perf': 'KPI',
    'ts.col_net': 'Netto',
    'ts.col_status': 'TT',
    'ts.col_action': 'Thao tác',
    'ts.f_emp': 'Nhân viên *',
    'ts.f_date': 'Ngày làm',
    'ts.f_start': 'Giờ bắt đầu',
    'ts.f_end': 'Giờ kết thúc',
    'ts.f_wh': 'Kho (để trống = mặc định)',
    'ts.f_shift': 'Ca làm',
    'ts.f_notes': 'Ghi chú',
    'ts.auto_calc': 'Giờ, Brutto, SSI, Netto được tính tự động',
    'ts.wh_approve': '✓Kho',
    'ts.fin_approve': '✓TC',
    'zk.add': '+ Nhập thủ công',
    'zk.add_title': 'Nhập Zeitkonto thủ công',
    'zk.col_emp': 'Nhân viên',
    'zk.col_wh': 'Kho',
    'zk.col_grade': 'Cấp',
    'zk.col_status': 'Tuân thủ',
    'zk.arrange_rest': 'Sắp xếp nghỉ',
    'zk.f_emp': 'Nhân viên',
    'zk.f_date': 'Ngày',
    'zk.f_type': 'Loại',
    'zk.f_hrs': 'Giờ (h)',
    'zk.f_reason': 'Lý do',
    'settle.emp_count': 'Nhân viên',
    'settle.hours': 'Tổng giờ',
    'settle.brutto': 'Tổng Brutto',
    'settle.net': 'Tổng Netto',
    'settle.col_emp': 'Nhân viên',
    'settle.col_wh': 'Kho',
    'settle.col_biz': 'Dòng KD',
    'settle.col_src': 'Nguồn',
    'settle.col_hrs': 'Giờ',
    'settle.col_count': 'Bản ghi',
    'ct.add': '+ Thêm container',
    'ct.add_title': 'Nhật ký container mới',
    'ct.col_no': 'Số container',
    'ct.col_type': 'Loại',
    'ct.col_wh': 'Kho',
    'ct.col_date': 'Ngày',
    'ct.col_start': 'Bắt đầu',
    'ct.col_end': 'Kết thúc',
    'ct.col_hrs': 'Giờ',
    'ct.col_workers': 'Công nhân',
    'ct.col_video': 'Video',
    'ct.col_status': 'TT',
    'ct.complete': 'Hoàn thành',
    'ct.f_no': 'Số container *',
    'ct.f_type': 'Loại',
    'ct.f_date': 'Ngày làm',
    'ct.f_seal': 'Số niêm phong',
    'ct.f_start': 'Giờ bắt đầu',
    'ct.f_revenue': 'Doanh thu KH (€)',
    'ct.f_workers': 'Công nhân',
    'ct.f_notes': 'Ghi chú',
    'clock.clock_in': 'Chấm công vào',
    'clock.clock_out': 'Chấm công ra',
    'clock.clocked_in': '✓ Đã chấm công vào',
    'clock.not_clocked': '○ Chưa chấm công',
    'log.col_time': 'Thời gian',
    'log.col_user': 'Người dùng',
    'log.col_action': 'Hành động',
    'log.col_table': 'Bảng',
    'log.col_id': 'ID',
    'log.col_detail': 'Chi tiết',
    'kb.search': 'Tìm kiếm tài liệu...',
    'kb.all_cats': 'Tất cả',
    'kb.print': '⎙ In',
    'grade.title': 'Cơ cấu lương theo cấp',
    'grade.col_grade': 'Cấp',
    'grade.col_base': 'Lương cơ bản',
    'grade.col_mult': 'Hệ số',
    'grade.col_gross': 'Brutto/tháng',
    'grade.col_mgmt': 'PQ quản lý',
    'grade.col_ot': 'Tăng ca h',
    'grade.col_cost': 'Chi phí thực',
    'grade.col_hourly': 'Chi phí/giờ',
    'grade.col_desc': 'Mô tả',
    'wh.select': '← Chọn kho',
    'wh.edit': 'Sửa giá',
    'wh.f_save': 'Lưu',
    'cost.title': 'Tính chi phí vị trí',
    'cost.calc': 'Tính toán',
    'cost.f_type': 'Loại hợp đồng',
    'cost.f_grade': 'Cấp',
    'cost.f_wh': 'Kho',
    'cost.f_weekly': 'Giờ/tuần',
    'cost.f_months': 'Số tháng',
    'nav.suppliers': 'Nhà cung cấp',
    'sup.add': '+ Thêm NCC',
    'sup.search': 'Tìm nhà cung cấp...',
    'sup.col_id': 'ID',
    'sup.col_name': 'Tên',
    'sup.col_biz': 'Dòng KD',
    'sup.col_contact': 'Liên hệ',
    'sup.col_phone': 'Điện thoại',
    'sup.col_email': 'Email',
    'sup.col_rating': 'Đánh giá',
    'sup.col_status': 'Trạng thái',
    'sup.add_title': 'Thêm nhà cung cấp',
    'sup.edit_title': 'Sửa nhà cung cấp',
    'sup.f_name': 'Tên NCC *',
    'sup.f_biz': 'Dòng kinh doanh',
    'sup.f_contact': 'Người liên hệ',
    'sup.f_phone': 'Điện thoại',
    'sup.f_email': 'Email',
    'sup.f_tax': 'Cách khai thuế',
    'sup.f_rating': 'Đánh giá',
    'sup.f_notes': 'Ghi chú',
    'zk.fz_title': 'Lên lịch Freizeitausgleich',
    'zk.fz_hours': 'Giờ bù (h)',
    'zk.fz_btn': 'Xác nhận',
    'zk.fz_desc': 'Hiện tại +{{h}}h',
    'zk.fz_err': 'Vui lòng nhập số giờ hợp lệ',
    'abm.revoke_title': 'Thu hồi Abmahnung',
    'abm.revoke_reason': 'Lý do *',
    'abm.revoke_btn': 'Xác nhận thu hồi',
    'abm.revoke_placeholder': 'Nhập lý do thu hồi...',
    'abm.revoke_err': 'Vui lòng cung cấp lý do',
    'ct.complete_title': 'Hoàn thành container',
    'ct.complete_end': 'Thời gian kết thúc',
    'ct.complete_btn': '✓ Xác nhận hoàn thành',
    'ct.complete_hint': 'Container sẽ được đánh dấu hoàn thành và đã ghi video.'
  }
};
var RTL_LANGS = new Set(['ar']);
var LangCtx = React.createContext({
  t: function t(key) {
    return key;
  },
  lang: 'zh',
  setLang: function setLang() {}
});
function useLang() {
  return React.useContext(LangCtx);
}
var ToastCtx = React.createContext(function () {});
function useToast() {
  return React.useContext(ToastCtx);
}
function LangSwitcher() {
  var _useLang = useLang(),
    lang = _useLang.lang,
    setLang = _useLang.setLang;
  var OPTS = [['zh', '中文'], ['en', 'English'], ['de', 'Deutsch'], ['ar', 'العربية'], ['hu', 'Magyar'], ['vi', 'Tiếng Việt']];
  return /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: lang,
    onChange: function onChange(e) {
      return setLang(e.target.value);
    },
    style: {
      fontSize: 10,
      padding: '3px 6px',
      borderRadius: 6,
      border: '1px solid var(--bd)',
      background: 'var(--bg3)',
      color: 'var(--tx)',
      cursor: 'pointer',
      fontFamily: 'inherit'
    }
  }, OPTS.map(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
      k = _ref2[0],
      l = _ref2[1];
    return /*#__PURE__*/React.createElement("option", {
      key: k,
      value: k
    }, l);
  }));
}
function api(_x) {
  return _api.apply(this, arguments);
} // ── COLORS ──
function _api() {
  _api = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee19(path) {
    var _ref81,
      _ref81$method,
      method,
      body,
      token,
      h,
      r,
      e,
      _args19 = arguments;
    return _regenerator().w(function (_context19) {
      while (1) switch (_context19.n) {
        case 0:
          _ref81 = _args19.length > 1 && _args19[1] !== undefined ? _args19[1] : {}, _ref81$method = _ref81.method, method = _ref81$method === void 0 ? 'GET' : _ref81$method, body = _ref81.body, token = _ref81.token;
          h = {
            'Content-Type': 'application/json'
          };
          if (token) h['Authorization'] = 'Bearer ' + token;
          _context19.n = 1;
          return fetch(BASE + path, {
            method: method,
            headers: h,
            body: body ? JSON.stringify(body) : undefined
          });
        case 1:
          r = _context19.v;
          if (r.ok) {
            _context19.n = 4;
            break;
          }
          if (!(r.status === 401 && token && !_sessionExpired)) {
            _context19.n = 2;
            break;
          }
          _sessionExpired = true;
          localStorage.removeItem('hr6_token');
          localStorage.removeItem('hr6_user');
          window.location.reload();
          return _context19.a(2);
        case 2:
          _context19.n = 3;
          return r.json().catch(function () {
            return {
              detail: 'Network error'
            };
          });
        case 3:
          e = _context19.v;
          throw new Error(e.detail || r.statusText);
        case 4:
          return _context19.a(2, r.json());
      }
    }, _callee19);
  }));
  return _api.apply(this, arguments);
}
var SC = {
  '已入账': '#2dd4a0',
  '待财务确认': '#f97316',
  '待仓库审批': '#f5a623',
  '驳回': '#f0526c',
  '在职': '#2dd4a0',
  '离职': '#f0526c',
  '自有': '#4f6ef7',
  '供应商': '#f97316',
  '渊博': '#4f6ef7',
  '579': '#f97316',
  '合作中': '#2dd4a0',
  '有效': '#f0526c',
  '已撤销': '#6a7498',
  '进行中': '#f5a623',
  '已完成': '#2dd4a0',
  'A': '#2dd4a0',
  'B': '#f5a623',
  'C': '#f0526c'
};
function Bg(_ref3) {
  var t = _ref3.t;
  var c = SC[t] || '#6a7498';
  return /*#__PURE__*/React.createElement("span", {
    className: "bg",
    style: {
      background: c + '1a',
      color: c,
      border: "1px solid ".concat(c, "33")
    }
  }, t);
}
function fmt(n) {
  return typeof n === 'number' ? n.toFixed(2) : '0.00';
}
function fmtE(n) {
  return (+(n || 0)).toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// ── SHARED COMPONENTS ──
function Modal(_ref4) {
  var title = _ref4.title,
    onClose = _ref4.onClose,
    children = _ref4.children,
    footer = _ref4.footer,
    wide = _ref4.wide;
  return /*#__PURE__*/React.createElement("div", {
    className: "mo",
    onClick: function onClick(e) {
      if (e.target === e.currentTarget) onClose();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "md",
    style: wide ? {
      maxWidth: 960
    } : {}
  }, /*#__PURE__*/React.createElement("div", {
    className: "md-h"
  }, /*#__PURE__*/React.createElement("h3", null, title), /*#__PURE__*/React.createElement("button", {
    className: "md-x",
    onClick: onClose
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "md-b"
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    className: "md-f"
  }, footer)));
}
function Spinner() {
  return /*#__PURE__*/React.createElement("span", {
    className: "spin"
  }, "\u27F3");
}
function Loading() {
  var _useLang2 = useLang(),
    t = _useLang2.t;
  return /*#__PURE__*/React.createElement("div", {
    className: "loading"
  }, /*#__PURE__*/React.createElement(Spinner, null), " ", t('c.loading'));
}

// ── AUTH CONTEXT ──
var AuthCtx = React.createContext({});

// ── LOGIN ──
function Login(_ref5) {
  var onLogin = _ref5.onLogin;
  var _useState = useState('admin'),
    _useState2 = _slicedToArray(_useState, 2),
    mode = _useState2[0],
    setMode = _useState2[1];
  var _useState3 = useState(''),
    _useState4 = _slicedToArray(_useState3, 2),
    u = _useState4[0],
    su = _useState4[1];
  var _useState5 = useState(''),
    _useState6 = _slicedToArray(_useState5, 2),
    p = _useState6[0],
    sp = _useState6[1];
  var _useState7 = useState(''),
    _useState8 = _slicedToArray(_useState7, 2),
    pin = _useState8[0],
    setPin = _useState8[1];
  var _useState9 = useState(''),
    _useState0 = _slicedToArray(_useState9, 2),
    err = _useState0[0],
    setErr = _useState0[1];
  var _useState1 = useState(false),
    _useState10 = _slicedToArray(_useState1, 2),
    loading = _useState10[0],
    setLoading = _useState10[1];
  var _useLang3 = useLang(),
    t = _useLang3.t,
    lang = _useLang3.lang,
    setLang = _useLang3.setLang;
  var doLogin = /*#__PURE__*/function () {
    var _ref6 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
      var r, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if (!(!u || !p)) {
              _context.n = 1;
              break;
            }
            setErr(t('login.err_empty'));
            return _context.a(2);
          case 1:
            setLoading(true);
            setErr('');
            _context.p = 2;
            _context.n = 3;
            return api('/api/auth/login', {
              method: 'POST',
              body: {
                username: u,
                password: p
              }
            });
          case 3:
            r = _context.v;
            onLogin(r.token, r.user);
            _context.n = 5;
            break;
          case 4:
            _context.p = 4;
            _t = _context.v;
            setErr(_t.message);
          case 5:
            _context.p = 5;
            setLoading(false);
            return _context.f(5);
          case 6:
            return _context.a(2);
        }
      }, _callee, null, [[2, 4, 5, 6]]);
    }));
    return function doLogin() {
      return _ref6.apply(this, arguments);
    };
  }();
  var doPin = /*#__PURE__*/function () {
    var _ref7 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
      var r, _t2;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            if (!(pin.length < 4)) {
              _context2.n = 1;
              break;
            }
            setErr(t('login.err_pin'));
            return _context2.a(2);
          case 1:
            setLoading(true);
            setErr('');
            _context2.p = 2;
            _context2.n = 3;
            return api('/api/auth/pin', {
              method: 'POST',
              body: {
                pin: pin
              }
            });
          case 3:
            r = _context2.v;
            onLogin(r.token, r.user);
            _context2.n = 5;
            break;
          case 4:
            _context2.p = 4;
            _t2 = _context2.v;
            setErr(_t2.message);
          case 5:
            _context2.p = 5;
            setLoading(false);
            return _context2.f(5);
          case 6:
            return _context2.a(2);
        }
      }, _callee2, null, [[2, 4, 5, 6]]);
    }));
    return function doPin() {
      return _ref7.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      zIndex: 9999
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      width: 500,
      height: 500,
      borderRadius: '50%',
      background: 'radial-gradient(circle,#4f6ef720,transparent 70%)',
      top: -100,
      right: -100
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: 380,
      background: 'var(--bg2)',
      border: '1px solid var(--bd)',
      borderRadius: 'var(--R3)',
      padding: '32px',
      boxShadow: '0 8px 40px #0008',
      animation: 'fadeUp .4s ease'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 16,
      right: 16
    }
  }, /*#__PURE__*/React.createElement(LangSwitcher, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sb-logo",
    style: {
      width: 44,
      height: 44,
      fontSize: 20
    }
  }, "\u6E0A"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700
    }
  }, t('login.title')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--tx3)',
      letterSpacing: 2
    }
  }, "V7 \xB7 Warehouse Management"))), /*#__PURE__*/React.createElement("div", {
    className: "tb",
    style: {
      marginBottom: 20,
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "tbn ".concat(mode === 'admin' ? 'on' : ''),
    style: {
      flex: 1
    },
    onClick: function onClick() {
      return setMode('admin');
    }
  }, t('login.admin')), /*#__PURE__*/React.createElement("button", {
    className: "tbn ".concat(mode === 'worker' ? 'on' : ''),
    style: {
      flex: 1
    },
    onClick: function onClick() {
      return setMode('worker');
    }
  }, t('login.worker'))), mode === 'admin' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('login.username')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    value: u,
    onChange: function onChange(e) {
      su(e.target.value);
      setErr('');
    },
    onKeyDown: function onKeyDown(e) {
      return e.key === 'Enter' && doLogin();
    },
    autoFocus: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('login.password')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    type: "password",
    value: p,
    onChange: function onChange(e) {
      sp(e.target.value);
      setErr('');
    },
    onKeyDown: function onKeyDown(e) {
      return e.key === 'Enter' && doLogin();
    }
  })), /*#__PURE__*/React.createElement("button", {
    className: "b bga bl",
    style: {
      width: '100%'
    },
    onClick: doLogin,
    disabled: loading
  }, loading ? /*#__PURE__*/React.createElement(Spinner, null) : t('login.btn')), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 9,
      color: 'var(--tx3)',
      textAlign: 'center'
    }
  }, t('login.hint'))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('login.pin_label')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    type: "tel",
    maxLength: 4,
    style: {
      fontSize: 24,
      textAlign: 'center',
      letterSpacing: 12
    },
    value: pin,
    onChange: function onChange(e) {
      setPin(e.target.value.replace(/\D/g, ''));
      setErr('');
    },
    onKeyDown: function onKeyDown(e) {
      return e.key === 'Enter' && doPin();
    },
    placeholder: "\u2022\u2022\u2022\u2022"
  })), /*#__PURE__*/React.createElement("button", {
    className: "b bga bl",
    style: {
      width: '100%'
    },
    onClick: doPin,
    disabled: loading
  }, loading ? /*#__PURE__*/React.createElement(Spinner, null) : t('login.pin_btn')), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 9,
      color: 'var(--tx3)',
      textAlign: 'center'
    }
  }, t('login.pin_hint'))), err && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 11,
      color: 'var(--rd)',
      textAlign: 'center'
    }
  }, err)));
}

// ── DASHBOARD ──
function Dashboard(_ref8) {
  var token = _ref8.token;
  var _useState11 = useState(null),
    _useState12 = _slicedToArray(_useState11, 2),
    data = _useState12[0],
    setData = _useState12[1];
  var _useState13 = useState(true),
    _useState14 = _slicedToArray(_useState13, 2),
    loading = _useState14[0],
    setLoading = _useState14[1];
  var _useLang4 = useLang(),
    t = _useLang4.t;
  useEffect(function () {
    api('/api/analytics/dashboard', {
      token: token
    }).then(setData).catch(function () {}).finally(function () {
      return setLoading(false);
    });
  }, []);
  if (loading) return /*#__PURE__*/React.createElement(Loading, null);
  if (!data) return /*#__PURE__*/React.createElement("div", {
    className: "tm"
  }, t('c.load_fail'));
  var mx = Math.max.apply(Math, _toConsumableArray((data.daily_hours || []).map(function (d) {
    return d.total_hours;
  })).concat([1]));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sr"
  }, [[data.employee_count, t('dash.employees'), 'var(--cy)', '👥'], [data.ts_pending, t('dash.pending_ts'), 'var(--og)', '⏳'], [data.ts_total_hours + 'h', t('dash.total_hours'), 'var(--pp)', '⏱️'], [data.abmahnung_active, t('dash.abmahnung'), 'var(--rd)', '⚠️'], [data.zeitkonto_alerts, t('dash.zk_alerts'), 'var(--og)', '📊'], [data.wv_active_projects, t('dash.wv_active'), 'var(--gn)', '📋']].map(function (_ref9, idx) {
    var _ref0 = _slicedToArray(_ref9, 4),
      v = _ref0[0],
      l = _ref0[1],
      c = _ref0[2],
      i = _ref0[3];
    return /*#__PURE__*/React.createElement("div", {
      key: idx,
      className: "sc"
    }, /*#__PURE__*/React.createElement("div", {
      className: "sl"
    }, i, " ", l), /*#__PURE__*/React.createElement("div", {
      className: "sv",
      style: {
        color: c
      }
    }, v));
  })), data.zeitkonto_alerts > 0 && /*#__PURE__*/React.createElement("div", {
    className: "alert alert-og"
  }, "\u26A0 ", /*#__PURE__*/React.createElement("b", null, data.zeitkonto_alerts), " \u540D\u5458\u5DE5 Zeitkonto \u8D85\u8FC7+150h\uFF0C\u8BF7\u5B89\u6392 Freizeitausgleich\uFF08\xA74 ArbZG\uFF09"), data.abmahnung_active > 0 && /*#__PURE__*/React.createElement("div", {
    className: "alert alert-rd"
  }, "\u26A0 ", /*#__PURE__*/React.createElement("b", null, data.abmahnung_active), " \u4EFD Abmahnung \u6709\u6548\u4E2D\uFF0C\u8BF7\u68C0\u67E5\u662F\u5426\u6709\u5458\u5DE5\u8FBE\u5230 K\xFCndigung \u6761\u4EF6"), /*#__PURE__*/React.createElement("div", {
    className: "cd"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ct-t"
  }, t('dash.chart')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 8,
      height: 100
    }
  }, (data.daily_hours || []).map(function (d, i) {
    var _d$work_date;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: 'var(--tx3)',
        marginBottom: 3
      }
    }, d.total_hours, "h"), /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        background: 'linear-gradient(180deg,var(--ac),var(--ac3))',
        borderRadius: '4px 4px 2px 2px',
        height: Math.max(4, d.total_hours / mx * 88)
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 8,
        color: 'var(--tx3)',
        marginTop: 3
      }
    }, (_d$work_date = d.work_date) === null || _d$work_date === void 0 ? void 0 : _d$work_date.slice(5)));
  }), (data.daily_hours || []).length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--tx3)',
      fontSize: 11,
      padding: '20px 0'
    }
  }, t('dash.no_data')))));
}

// ── EMPLOYEES ──
function Employees(_ref1) {
  var token = _ref1.token,
    user = _ref1.user;
  var _useState15 = useState([]),
    _useState16 = _slicedToArray(_useState15, 2),
    emps = _useState16[0],
    setEmps = _useState16[1];
  var _useState17 = useState(true),
    _useState18 = _slicedToArray(_useState17, 2),
    loading = _useState18[0],
    setLoading = _useState18[1];
  var _useState19 = useState(''),
    _useState20 = _slicedToArray(_useState19, 2),
    search = _useState20[0],
    setSearch = _useState20[1];
  var _useState21 = useState('在职'),
    _useState22 = _slicedToArray(_useState21, 2),
    fSt = _useState22[0],
    setFSt = _useState22[1];
  var _useState23 = useState(null),
    _useState24 = _slicedToArray(_useState23, 2),
    editM = _useState24[0],
    setEM = _useState24[1];
  var _useState25 = useState({}),
    _useState26 = _slicedToArray(_useState25, 2),
    form = _useState26[0],
    setForm = _useState26[1];
  var _useLang5 = useLang(),
    t = _useLang5.t;
  var showToast = useToast();
  var load = useCallback(function () {
    setLoading(true);
    api("/api/employees?search=".concat(search, "&status=").concat(fSt), {
      token: token
    }).then(setEmps).finally(function () {
      return setLoading(false);
    });
  }, [token, search, fSt]);
  useEffect(function () {
    load();
  }, [load]);
  var canEdit = ['admin', 'hr', 'mgr'].includes(user.role);
  var GRADES = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9'];
  var WHS = ['UNA', 'DHL', 'W579', 'AMZ', 'TEMU'];
  var openNew = function openNew() {
    setForm({
      biz_line: '渊博',
      source: '自有',
      grade: 'P1',
      settlement_type: '按小时',
      hourly_rate: 13,
      status: '在职',
      contract_hours: 8
    });
    setEM('new');
  };
  var openEdit = function openEdit(e) {
    setForm(_objectSpread({}, e));
    setEM(e.id);
  };
  var save = /*#__PURE__*/function () {
    var _ref10 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
      var _t3;
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.p = _context3.n) {
          case 0:
            _context3.p = 0;
            if (!(editM === 'new')) {
              _context3.n = 2;
              break;
            }
            _context3.n = 1;
            return api('/api/employees', {
              method: 'POST',
              body: form,
              token: token
            });
          case 1:
            _context3.n = 3;
            break;
          case 2:
            _context3.n = 3;
            return api("/api/employees/".concat(editM), {
              method: 'PUT',
              body: form,
              token: token
            });
          case 3:
            setEM(null);
            load();
            showToast(editM === 'new' ? '员工已创建' : '员工已更新');
            _context3.n = 5;
            break;
          case 4:
            _context3.p = 4;
            _t3 = _context3.v;
            showToast(_t3.message, 'err');
          case 5:
            return _context3.a(2);
        }
      }, _callee3, null, [[0, 4]]);
    }));
    return function save() {
      return _ref10.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ab"
  }, /*#__PURE__*/React.createElement("input", {
    className: "si",
    placeholder: t('emp.search'),
    value: search,
    onChange: function onChange(e) {
      return setSearch(e.target.value);
    }
  }), [['', 'c.all'], ['在职', 'emp.status_active'], ['离职', 'emp.status_left']].map(function (_ref11) {
    var _ref12 = _slicedToArray(_ref11, 2),
      s = _ref12[0],
      tk = _ref12[1];
    return /*#__PURE__*/React.createElement("button", {
      key: s,
      className: "fb ".concat(fSt === s ? 'on' : ''),
      onClick: function onClick() {
        return setFSt(s);
      }
    }, t(tk));
  }), /*#__PURE__*/React.createElement("div", {
    className: "ml",
    style: {
      display: 'flex',
      gap: 6
    }
  }, canEdit && /*#__PURE__*/React.createElement("button", {
    className: "b bga",
    onClick: openNew
  }, t('emp.new')))), loading ? /*#__PURE__*/React.createElement(Loading, null) : /*#__PURE__*/React.createElement("div", {
    className: "tw"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ts"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, t('emp.col_id')), /*#__PURE__*/React.createElement("th", null, t('emp.col_name')), /*#__PURE__*/React.createElement("th", null, t('emp.col_biz')), /*#__PURE__*/React.createElement("th", null, t('emp.col_wh')), /*#__PURE__*/React.createElement("th", null, t('emp.col_pos')), /*#__PURE__*/React.createElement("th", null, t('emp.col_grade')), /*#__PURE__*/React.createElement("th", null, t('emp.col_src')), /*#__PURE__*/React.createElement("th", null, t('emp.col_rate')), /*#__PURE__*/React.createElement("th", null, t('emp.col_status')), /*#__PURE__*/React.createElement("th", null, t('emp.col_join')), canEdit && /*#__PURE__*/React.createElement("th", null))), /*#__PURE__*/React.createElement("tbody", null, emps.map(function (e) {
    return /*#__PURE__*/React.createElement("tr", {
      key: e.id
    }, /*#__PURE__*/React.createElement("td", {
      className: "mn gn"
    }, e.id), /*#__PURE__*/React.createElement("td", {
      className: "fw6"
    }, e.name), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Bg, {
      t: e.biz_line
    })), /*#__PURE__*/React.createElement("td", null, e.warehouse_code), /*#__PURE__*/React.createElement("td", null, e.position), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--pp)',
        fontWeight: 600
      }
    }, e.grade)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Bg, {
      t: e.source
    })), /*#__PURE__*/React.createElement("td", {
      className: "mn"
    }, "\u20AC", fmt(e.hourly_rate), "/h"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Bg, {
      t: e.status
    })), /*#__PURE__*/React.createElement("td", {
      className: "tm"
    }, e.join_date), canEdit && /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
      className: "b bgh",
      onClick: function onClick() {
        return openEdit(e);
      }
    }, t('c.edit'))));
  }))))), editM && /*#__PURE__*/React.createElement(Modal, {
    title: editM === 'new' ? t('emp.add_title') : t('emp.edit_title'),
    onClose: function onClose() {
      return setEM(null);
    },
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "b bgh",
      onClick: function onClick() {
        return setEM(null);
      }
    }, t('c.cancel')), /*#__PURE__*/React.createElement("button", {
      className: "b bga",
      onClick: save
    }, t('c.save')))
  }, /*#__PURE__*/React.createElement("div", {
    className: "fr"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('emp.f_name')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    value: form.name || '',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        name: e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('emp.f_phone')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    value: form.phone || '',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        phone: e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('emp.f_biz')), /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: form.biz_line || '渊博',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        biz_line: e.target.value
      }));
    }
  }, /*#__PURE__*/React.createElement("option", null, "\u6E0A\u535A"), /*#__PURE__*/React.createElement("option", null, "579"))), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('emp.f_wh')), /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: form.warehouse_code || '',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        warehouse_code: e.target.value
      }));
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "-"), WHS.map(function (w) {
    return /*#__PURE__*/React.createElement("option", {
      key: w
    }, w);
  }))), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('emp.f_pos')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    value: form.position || '',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        position: e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('emp.f_grade')), /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: form.grade || 'P1',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        grade: e.target.value
      }));
    }
  }, GRADES.map(function (g) {
    return /*#__PURE__*/React.createElement("option", {
      key: g
    }, g);
  }))), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('emp.f_src')), /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: form.source || '自有',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        source: e.target.value
      }));
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "\u81EA\u6709"
  }, t('emp.src_own')), /*#__PURE__*/React.createElement("option", {
    value: "\u4F9B\u5E94\u5546"
  }, t('emp.src_sup')))), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('emp.f_rate')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    type: "number",
    step: "0.5",
    value: form.hourly_rate || 13,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        hourly_rate: +e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('emp.f_settle')), /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: form.settlement_type || '按小时',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        settlement_type: e.target.value
      }));
    }
  }, /*#__PURE__*/React.createElement("option", null, "\u6309\u5C0F\u65F6"), /*#__PURE__*/React.createElement("option", null, "\u6309\u4EF6"), /*#__PURE__*/React.createElement("option", null, "\u6309\u67DC"))), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('emp.f_contract_hrs')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    type: "number",
    value: form.contract_hours || 8,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        contract_hours: +e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('emp.f_nationality')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    value: form.nationality || '',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        nationality: e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('emp.f_join')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    type: "date",
    value: form.join_date || '',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        join_date: e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('emp.f_tax')), /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: form.tax_mode || '我方报税',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        tax_mode: e.target.value
      }));
    }
  }, /*#__PURE__*/React.createElement("option", null, "\u6211\u65B9\u62A5\u7A0E"), /*#__PURE__*/React.createElement("option", null, "\u4F9B\u5E94\u5546\u62A5\u7A0E"))), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('emp.f_pin')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    maxLength: 4,
    value: form.pin || '',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        pin: e.target.value.replace(/\D/g, '')
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg ful"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('emp.f_notes')), /*#__PURE__*/React.createElement("textarea", {
    className: "fta",
    value: form.notes || '',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        notes: e.target.value
      }));
    }
  })))));
}

// ── TIMESHEETS ──
function Timesheets(_ref13) {
  var token = _ref13.token,
    user = _ref13.user;
  var _useState27 = useState([]),
    _useState28 = _slicedToArray(_useState27, 2),
    ts = _useState28[0],
    setTS = _useState28[1];
  var _useState29 = useState(true),
    _useState30 = _slicedToArray(_useState29, 2),
    loading = _useState30[0],
    setLoading = _useState30[1];
  var _useState31 = useState(''),
    _useState32 = _slicedToArray(_useState31, 2),
    fSt = _useState32[0],
    setFSt = _useState32[1];
  var _useState33 = useState(false),
    _useState34 = _slicedToArray(_useState33, 2),
    addM = _useState34[0],
    setAddM = _useState34[1];
  var _useState35 = useState({
      work_date: new Date().toISOString().slice(0, 10),
      start_time: '08:00',
      end_time: '16:00'
    }),
    _useState36 = _slicedToArray(_useState35, 2),
    form = _useState36[0],
    setForm = _useState36[1];
  var _useState37 = useState([]),
    _useState38 = _slicedToArray(_useState37, 2),
    emps = _useState38[0],
    setEmps = _useState38[1];
  var _useLang6 = useLang(),
    t = _useLang6.t;
  var showToast = useToast();
  var load = function load() {
    setLoading(true);
    api("/api/timesheets?status=".concat(fSt), {
      token: token
    }).then(setTS).finally(function () {
      return setLoading(false);
    });
  };
  useEffect(function () {
    load();
    api('/api/employees?status=在职', {
      token: token
    }).then(setEmps);
  }, [fSt]);
  var canApproveWH = ['admin', 'wh', 'mgr'].includes(user.role);
  var canApproveFin = ['admin', 'fin'].includes(user.role);
  var approve = /*#__PURE__*/function () {
    var _ref14 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(id) {
      var _t4;
      return _regenerator().w(function (_context4) {
        while (1) switch (_context4.p = _context4.n) {
          case 0:
            _context4.p = 0;
            _context4.n = 1;
            return api("/api/timesheets/".concat(id, "/approve"), {
              method: 'PUT',
              token: token
            });
          case 1:
            load();
            showToast('审批成功');
            _context4.n = 3;
            break;
          case 2:
            _context4.p = 2;
            _t4 = _context4.v;
            showToast(_t4.message, 'err');
          case 3:
            return _context4.a(2);
        }
      }, _callee4, null, [[0, 2]]);
    }));
    return function approve(_x2) {
      return _ref14.apply(this, arguments);
    };
  }();
  var addTS = /*#__PURE__*/function () {
    var _ref15 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5() {
      var _t5;
      return _regenerator().w(function (_context5) {
        while (1) switch (_context5.p = _context5.n) {
          case 0:
            _context5.p = 0;
            _context5.n = 1;
            return api('/api/timesheets', {
              method: 'POST',
              body: form,
              token: token
            });
          case 1:
            setAddM(false);
            load();
            showToast('工时已录入');
            _context5.n = 3;
            break;
          case 2:
            _context5.p = 2;
            _t5 = _context5.v;
            showToast(_t5.message, 'err');
          case 3:
            return _context5.a(2);
        }
      }, _callee5, null, [[0, 2]]);
    }));
    return function addTS() {
      return _ref15.apply(this, arguments);
    };
  }();
  var batchApprove = /*#__PURE__*/function () {
    var _ref16 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6(ids) {
      var _t6;
      return _regenerator().w(function (_context6) {
        while (1) switch (_context6.p = _context6.n) {
          case 0:
            _context6.p = 0;
            _context6.n = 1;
            return api('/api/timesheets/batch-approve', {
              method: 'PUT',
              body: {
                ids: ids
              },
              token: token
            });
          case 1:
            load();
            showToast("\u5DF2\u6279\u91CF\u5BA1\u6279 ".concat(ids.length, " \u6761"));
            _context6.n = 3;
            break;
          case 2:
            _context6.p = 2;
            _t6 = _context6.v;
            showToast(_t6.message, 'err');
          case 3:
            return _context6.a(2);
        }
      }, _callee6, null, [[0, 2]]);
    }));
    return function batchApprove(_x3) {
      return _ref16.apply(this, arguments);
    };
  }();
  var pending = ts.filter(function (row) {
    return row.status === '待仓库审批' || row.status === '待财务确认';
  });
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ab"
  }, [['', 'c.all'], ['待仓库审批', '待仓库审批'], ['待财务确认', '待财务确认'], ['已入账', '已入账'], ['驳回', '驳回']].map(function (_ref17) {
    var _ref18 = _slicedToArray(_ref17, 2),
      s = _ref18[0],
      tk = _ref18[1];
    return /*#__PURE__*/React.createElement("button", {
      key: s,
      className: "fb ".concat(fSt === s ? 'on' : ''),
      onClick: function onClick() {
        return setFSt(s);
      }
    }, s === '' ? t('c.all') : s);
  }), /*#__PURE__*/React.createElement("div", {
    className: "ml",
    style: {
      display: 'flex',
      gap: 6
    }
  }, pending.length > 0 && canApproveWH && /*#__PURE__*/React.createElement("button", {
    className: "b bgn",
    onClick: function onClick() {
      return batchApprove(pending.map(function (row) {
        return row.id;
      }));
    }
  }, t('ts.batch'), " (", pending.length, ")"), /*#__PURE__*/React.createElement("button", {
    className: "b bga",
    onClick: function onClick() {
      return setAddM(true);
    }
  }, t('ts.add')))), loading ? /*#__PURE__*/React.createElement(Loading, null) : /*#__PURE__*/React.createElement("div", {
    className: "tw"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ts"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, t('ts.col_id')), /*#__PURE__*/React.createElement("th", null, t('ts.col_emp')), /*#__PURE__*/React.createElement("th", null, t('ts.col_grade')), /*#__PURE__*/React.createElement("th", null, t('ts.col_wh')), /*#__PURE__*/React.createElement("th", null, t('ts.col_date')), /*#__PURE__*/React.createElement("th", null, t('ts.col_shift')), /*#__PURE__*/React.createElement("th", null, t('ts.col_hrs')), /*#__PURE__*/React.createElement("th", null, t('ts.col_base')), /*#__PURE__*/React.createElement("th", null, t('ts.col_shift_b')), /*#__PURE__*/React.createElement("th", null, t('ts.col_eff')), /*#__PURE__*/React.createElement("th", null, t('ts.col_brutto')), /*#__PURE__*/React.createElement("th", null, t('ts.col_perf')), /*#__PURE__*/React.createElement("th", null, t('ts.col_net')), /*#__PURE__*/React.createElement("th", null, t('ts.col_status')), /*#__PURE__*/React.createElement("th", null, t('ts.col_action')))), /*#__PURE__*/React.createElement("tbody", null, ts.map(function (row) {
    var _row$id;
    return /*#__PURE__*/React.createElement("tr", {
      key: row.id
    }, /*#__PURE__*/React.createElement("td", {
      className: "mn tm"
    }, (_row$id = row.id) === null || _row$id === void 0 ? void 0 : _row$id.slice(-10)), /*#__PURE__*/React.createElement("td", {
      className: "fw6"
    }, row.employee_name), /*#__PURE__*/React.createElement("td", {
      style: {
        color: 'var(--pp)',
        fontWeight: 600
      }
    }, row.grade || '—'), /*#__PURE__*/React.createElement("td", null, row.warehouse_code), /*#__PURE__*/React.createElement("td", null, row.work_date), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      style: {
        color: row.shift === '夜班' ? 'var(--pp)' : row.shift === '周末' ? 'var(--og)' : row.shift === '节假日' ? 'var(--rd)' : 'var(--tx3)',
        fontSize: 10
      }
    }, row.shift || '白班')), /*#__PURE__*/React.createElement("td", {
      className: "mn fw6"
    }, row.hours, "h"), /*#__PURE__*/React.createElement("td", {
      className: "mn tm"
    }, "\u20AC", fmt(row.base_rate)), /*#__PURE__*/React.createElement("td", {
      className: "mn",
      style: {
        color: row.shift_bonus > 0 ? 'var(--og)' : 'var(--tx3)'
      }
    }, "+\u20AC", fmt(row.shift_bonus)), /*#__PURE__*/React.createElement("td", {
      className: "mn fw6",
      style: {
        color: 'var(--ac2)'
      }
    }, "\u20AC", fmt(row.effective_rate)), /*#__PURE__*/React.createElement("td", {
      className: "mn"
    }, "\u20AC", fmt(row.gross_pay)), /*#__PURE__*/React.createElement("td", {
      className: "mn",
      style: {
        color: row.perf_bonus > 0 ? 'var(--gn)' : 'var(--tx3)'
      }
    }, "+\u20AC", fmt(row.perf_bonus)), /*#__PURE__*/React.createElement("td", {
      className: "mn gn"
    }, "\u20AC", fmt(row.net_pay)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Bg, {
      t: row.status
    })), /*#__PURE__*/React.createElement("td", null, row.status === '待仓库审批' && canApproveWH ? /*#__PURE__*/React.createElement("button", {
      className: "b bgn",
      style: {
        fontSize: 9
      },
      onClick: function onClick() {
        return approve(row.id);
      }
    }, t('ts.wh_approve')) : row.status === '待财务确认' && canApproveFin ? /*#__PURE__*/React.createElement("button", {
      className: "b bga",
      style: {
        fontSize: 9
      },
      onClick: function onClick() {
        return approve(row.id);
      }
    }, t('ts.fin_approve')) : /*#__PURE__*/React.createElement("span", {
      className: "tm",
      style: {
        fontSize: 9
      }
    }, "\u2014")));
  }))))), addM && /*#__PURE__*/React.createElement(Modal, {
    title: t('ts.add_title'),
    onClose: function onClose() {
      return setAddM(false);
    },
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "b bgh",
      onClick: function onClick() {
        return setAddM(false);
      }
    }, t('c.cancel')), /*#__PURE__*/React.createElement("button", {
      className: "b bga",
      onClick: addTS
    }, t('c.submit')))
  }, /*#__PURE__*/React.createElement("div", {
    className: "fr"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('ts.f_emp')), /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: form.employee_id || '',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        employee_id: e.target.value
      }));
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014\u9009\u62E9\u5458\u5DE5\u2014"), emps.map(function (e) {
    return /*#__PURE__*/React.createElement("option", {
      key: e.id,
      value: e.id
    }, e.name, "\uFF08", e.id, "\uFF09");
  }))), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('ts.f_date')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    type: "date",
    value: form.work_date,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        work_date: e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('ts.f_start')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    type: "time",
    value: form.start_time,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        start_time: e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('ts.f_end')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    type: "time",
    value: form.end_time,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        end_time: e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('ts.f_wh')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    value: form.warehouse_code || '',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        warehouse_code: e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('ts.f_shift')), /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: form.shift || '白班',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        shift: e.target.value
      }));
    }
  }, /*#__PURE__*/React.createElement("option", null, "\u767D\u73ED"), /*#__PURE__*/React.createElement("option", null, "\u591C\u73ED"), /*#__PURE__*/React.createElement("option", null, "\u5468\u672B"), /*#__PURE__*/React.createElement("option", null, "\u8282\u5047\u65E5"))), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('ts.f_notes')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    value: form.notes || '',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        notes: e.target.value
      }));
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "alert alert-ac"
  }, t('ts.auto_calc'))));
}

// ── ZEITKONTO ──
function Zeitkonto(_ref19) {
  var token = _ref19.token,
    user = _ref19.user;
  var _useState39 = useState([]),
    _useState40 = _slicedToArray(_useState39, 2),
    zk = _useState40[0],
    setZK = _useState40[1];
  var _useState41 = useState(true),
    _useState42 = _slicedToArray(_useState41, 2),
    loading = _useState42[0],
    setLoading = _useState42[1];
  var _useState43 = useState(null),
    _useState44 = _slicedToArray(_useState43, 2),
    sel = _useState44[0],
    setSel = _useState44[1];
  var _useState45 = useState([]),
    _useState46 = _slicedToArray(_useState45, 2),
    logs = _useState46[0],
    setLogs = _useState46[1];
  var _useState47 = useState(false),
    _useState48 = _slicedToArray(_useState47, 2),
    addM = _useState48[0],
    setAddM = _useState48[1];
  var _useState49 = useState(null),
    _useState50 = _slicedToArray(_useState49, 2),
    fzModal = _useState50[0],
    setFzModal = _useState50[1];
  var _useState51 = useState(''),
    _useState52 = _slicedToArray(_useState51, 2),
    fzHours = _useState52[0],
    setFzHours = _useState52[1];
  var _useState53 = useState({
      employee_id: '',
      log_date: new Date().toISOString().slice(0, 10),
      entry_type: 'plus',
      hours: '',
      reason: ''
    }),
    _useState54 = _slicedToArray(_useState53, 2),
    form = _useState54[0],
    setForm = _useState54[1];
  var showToast = useToast();
  var load = function load() {
    setLoading(true);
    api('/api/zeitkonto', {
      token: token
    }).then(setZK).finally(function () {
      return setLoading(false);
    });
  };
  useEffect(function () {
    load();
  }, []);
  var selRow = zk.find(function (z) {
    return z.employee_id === sel;
  });
  var openLogs = function openLogs(id) {
    setSel(id);
    api("/api/zeitkonto/".concat(id, "/logs"), {
      token: token
    }).then(setLogs);
  };
  var addLog = /*#__PURE__*/function () {
    var _ref20 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7() {
      var _t7;
      return _regenerator().w(function (_context7) {
        while (1) switch (_context7.p = _context7.n) {
          case 0:
            _context7.p = 0;
            _context7.n = 1;
            return api("/api/zeitkonto/".concat(form.employee_id, "/log"), {
              method: 'POST',
              body: _objectSpread(_objectSpread({}, form), {}, {
                hours: +form.hours
              }),
              token: token
            });
          case 1:
            setAddM(false);
            load();
            showToast('记录已添加');
            _context7.n = 3;
            break;
          case 2:
            _context7.p = 2;
            _t7 = _context7.v;
            showToast(_t7.message, 'err');
          case 3:
            return _context7.a(2);
        }
      }, _callee7, null, [[0, 2]]);
    }));
    return function addLog() {
      return _ref20.apply(this, arguments);
    };
  }();
  var doFreizeitausgleich = function doFreizeitausgleich(id, plusHours) {
    setFzModal({
      id: id,
      plusHours: plusHours
    });
    setFzHours('');
  };
  var confirmFz = /*#__PURE__*/function () {
    var _ref21 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8() {
      var _t8;
      return _regenerator().w(function (_context8) {
        while (1) switch (_context8.p = _context8.n) {
          case 0:
            if (!(!fzHours || +fzHours <= 0)) {
              _context8.n = 1;
              break;
            }
            showToast(t('zk.fz_err'), 'err');
            return _context8.a(2);
          case 1:
            _context8.p = 1;
            _context8.n = 2;
            return api("/api/zeitkonto/".concat(fzModal.id, "/freizeitausgleich"), {
              method: 'PUT',
              body: {
                hours: +fzHours
              },
              token: token
            });
          case 2:
            setFzModal(null);
            load();
            showToast('已安排 Freizeitausgleich');
            _context8.n = 4;
            break;
          case 3:
            _context8.p = 3;
            _t8 = _context8.v;
            showToast(_t8.message, 'err');
          case 4:
            return _context8.a(2);
        }
      }, _callee8, null, [[1, 3]]);
    }));
    return function confirmFz() {
      return _ref21.apply(this, arguments);
    };
  }();
  var canEdit = ['admin', 'hr', 'mgr'].includes(user.role);
  var _useLang7 = useLang(),
    t = _useLang7.t;
  var getStatus = function getStatus(z) {
    if (z.plus_hours > 200 || z.daily_max > 10) return {
      c: 'var(--rd)',
      t: '⛔ 违规'
    };
    if (z.plus_hours > 150) return {
      c: 'var(--og)',
      t: '⚠ 预警'
    };
    if (z.minus_hours > 20) return {
      c: 'var(--pp)',
      t: '⚠ 亏时'
    };
    return {
      c: 'var(--gn)',
      t: '✓ 合规'
    };
  };
  var alerts = zk.filter(function (z) {
    return z.plus_hours > 150 || z.daily_max > 10;
  });
  return /*#__PURE__*/React.createElement("div", null, alerts.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, alerts.map(function (z, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "alert ".concat(z.daily_max > 10 || z.plus_hours > 200 ? 'alert-rd' : 'alert-og')
    }, z.daily_max > 10 ? '⛔' : '⚠️', " ", /*#__PURE__*/React.createElement("b", null, z.employee_name), ": ", z.plus_hours > 200 ? "Zeitkonto\u8D85\u4E0A\u9650 +".concat(z.plus_hours, "h") : z.daily_max > 10 ? "\u65E5\u5DE5\u65F6\u8D85\u6CD5\u5B9A\u4E0A\u9650 ".concat(z.daily_max, "h (\xA74 ArbZG)") : z.plus_hours > 150 ? "\u9700\u5B89\u6392Freizeitausgleich +".concat(z.plus_hours, "h") : '');
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tm",
    style: {
      fontSize: 10
    }
  }, "\xA74 ArbZG: 10h/\u65E5\u4E0A\u9650 \xB7 Zeitkonto\u4E0A\u9650+200h \xB7 MTV DGB/GVP 2026"), canEdit && /*#__PURE__*/React.createElement("button", {
    className: "b bga",
    onClick: function onClick() {
      return setAddM(true);
    }
  }, t('zk.add'))), loading ? /*#__PURE__*/React.createElement(Loading, null) : /*#__PURE__*/React.createElement("div", {
    className: "tw"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ts"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, t('zk.col_emp')), /*#__PURE__*/React.createElement("th", null, t('zk.col_wh')), /*#__PURE__*/React.createElement("th", null, t('zk.col_grade')), /*#__PURE__*/React.createElement("th", null, "Plusstunden"), /*#__PURE__*/React.createElement("th", null, "Minusstunden"), /*#__PURE__*/React.createElement("th", null, "\u65E5\u6700\u9AD8\u5DE5\u65F6"), /*#__PURE__*/React.createElement("th", null, t('zk.col_status')), /*#__PURE__*/React.createElement("th", null))), /*#__PURE__*/React.createElement("tbody", null, zk.map(function (z) {
    var s = getStatus(z);
    return /*#__PURE__*/React.createElement("tr", {
      key: z.employee_id,
      onClick: function onClick() {
        return openLogs(z.employee_id);
      },
      style: {
        cursor: 'pointer',
        background: sel === z.employee_id ? '#4f6ef710' : ''
      }
    }, /*#__PURE__*/React.createElement("td", {
      className: "fw6"
    }, z.employee_name, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
      className: "mn tm"
    }, z.employee_id)), /*#__PURE__*/React.createElement("td", null, z.warehouse_code), /*#__PURE__*/React.createElement("td", {
      style: {
        color: 'var(--pp)'
      }
    }, z.grade), /*#__PURE__*/React.createElement("td", {
      style: {
        color: z.plus_hours > 150 ? 'var(--rd)' : z.plus_hours > 80 ? 'var(--og)' : 'var(--gn)',
        fontFamily: 'monospace',
        fontWeight: 700
      }
    }, "+", z.plus_hours, "h"), /*#__PURE__*/React.createElement("td", {
      style: {
        color: z.minus_hours > 0 ? 'var(--pp)' : 'var(--tx3)',
        fontFamily: 'monospace'
      }
    }, "-", z.minus_hours, "h"), /*#__PURE__*/React.createElement("td", {
      style: {
        color: z.daily_max > 10 ? 'var(--rd)' : z.daily_max > 9 ? 'var(--og)' : 'var(--tx)',
        fontFamily: 'monospace'
      }
    }, z.daily_max || '—', "h"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: "bg",
      style: {
        background: s.c + '22',
        color: s.c,
        border: "1px solid ".concat(s.c, "44")
      }
    }, s.t)), /*#__PURE__*/React.createElement("td", null, z.plus_hours > 150 && canEdit && /*#__PURE__*/React.createElement("button", {
      className: "b bgo",
      style: {
        fontSize: 9
      },
      onClick: function onClick(e) {
        e.stopPropagation();
        doFreizeitausgleich(z.employee_id, z.plus_hours);
      }
    }, t('zk.arrange_rest'))));
  }))))), sel && selRow && /*#__PURE__*/React.createElement("div", {
    className: "cd",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ct-t"
  }, "\uD83D\uDCCA ", selRow.employee_name, " \u2014 Zeitkonto \u660E\u7EC6"), /*#__PURE__*/React.createElement("div", {
    className: "g4",
    style: {
      marginBottom: 12
    }
  }, [['Plusstunden', '+' + selRow.plus_hours + 'h', 'var(--gn)'], ['Minusstunden', '-' + selRow.minus_hours + 'h', 'var(--pp)'], ['日最高', selRow.daily_max + 'h', selRow.daily_max > 10 ? 'var(--rd)' : 'var(--tx)'], ['超10h天数', (selRow.over10_days || 0) + '天', selRow.over10_days > 0 ? 'var(--rd)' : 'var(--tx3)']].map(function (_ref22) {
    var _ref23 = _slicedToArray(_ref22, 3),
      l = _ref23[0],
      v = _ref23[1],
      c = _ref23[2];
    return /*#__PURE__*/React.createElement("div", {
      key: l,
      style: {
        padding: 12,
        background: 'var(--bg3)',
        borderRadius: 8,
        border: '1px solid var(--bd)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "sl"
    }, l), /*#__PURE__*/React.createElement("div", {
      className: "sv",
      style: {
        color: c,
        fontSize: 18
      }
    }, v));
  })), selRow.plus_hours > 200 && /*#__PURE__*/React.createElement("div", {
    className: "alert alert-rd"
  }, "\u26D4 \u8FDD\u89C4\uFF1A\u8D85\u8FC7+200h\u4E0A\u9650\u3002\u987B\u7ACB\u5373\u5B89\u6392\u5F3A\u5236\u4F11\u606F\uFF0C\u5426\u5219\u8FDD\u53CD MTV DGB/GVP \u89C4\u5B9A\u3002"), selRow.plus_hours > 150 && selRow.plus_hours <= 200 && /*#__PURE__*/React.createElement("div", {
    className: "alert alert-og"
  }, "\u26A0 \u9884\u8B66\uFF1A\u8D85\u8FC7+150h\uFF0C\u987B\u4E3B\u52A8\u5B89\u6392 Freizeitausgleich\uFF0C\u4E0D\u53EF\u7B49\u5458\u5DE5\u7533\u8BF7\u3002"), selRow.daily_max > 10 && /*#__PURE__*/React.createElement("div", {
    className: "alert alert-rd"
  }, "\u26D4 \u53D1\u73B0\u65E5\u5DE5\u65F6 ", selRow.daily_max, "h \u8D85\u8FC7\u6CD5\u5B9A10h\uFF08\xA74 ArbZG\uFF09\uFF0C\u96C7\u4E3B\u987B\u4E3B\u52A8\u963B\u6B62\uFF0C\u8FDD\u89C4\u7F5A\u6B3E\u6700\u9AD8\u20AC30,000\u3002"), /*#__PURE__*/React.createElement("div", {
    className: "tw"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\u65E5\u671F"), /*#__PURE__*/React.createElement("th", null, "\u7C7B\u578B"), /*#__PURE__*/React.createElement("th", null, "\u5DE5\u65F6"), /*#__PURE__*/React.createElement("th", null, "\u539F\u56E0"), /*#__PURE__*/React.createElement("th", null, "\u5F55\u5165\u4EBA"))), /*#__PURE__*/React.createElement("tbody", null, logs.map(function (l, i) {
    return /*#__PURE__*/React.createElement("tr", {
      key: i
    }, /*#__PURE__*/React.createElement("td", null, l.log_date), /*#__PURE__*/React.createElement("td", {
      style: {
        color: l.entry_type === 'plus' ? 'var(--gn)' : l.entry_type === 'freizeitausgleich' ? 'var(--pp)' : 'var(--rd)'
      }
    }, l.entry_type === 'plus' ? '+ Plusstunden' : l.entry_type === 'freizeitausgleich' ? '↓ Freizeitausgleich' : '- Minusstunden'), /*#__PURE__*/React.createElement("td", {
      className: "mn"
    }, l.hours, "h"), /*#__PURE__*/React.createElement("td", null, l.reason), /*#__PURE__*/React.createElement("td", {
      className: "tm"
    }, l.approved_by));
  }), logs.length === 0 && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 5,
    style: {
      textAlign: 'center',
      color: 'var(--tx3)',
      padding: 16
    }
  }, "\u6682\u65E0\u624B\u52A8\u8BB0\u5F55")))))), addM && /*#__PURE__*/React.createElement(Modal, {
    title: t('zk.add_title'),
    onClose: function onClose() {
      return setAddM(false);
    },
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "b bgh",
      onClick: function onClick() {
        return setAddM(false);
      }
    }, t('c.cancel')), /*#__PURE__*/React.createElement("button", {
      className: "b bga",
      onClick: addLog
    }, t('c.save')))
  }, /*#__PURE__*/React.createElement("div", {
    className: "fr"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('zk.f_emp')), /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: form.employee_id,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        employee_id: e.target.value
      }));
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014\u9009\u62E9\u2014"), zk.map(function (z) {
    return /*#__PURE__*/React.createElement("option", {
      key: z.employee_id,
      value: z.employee_id
    }, z.employee_name, "\uFF08", z.employee_id, "\uFF09");
  }))), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('zk.f_date')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    type: "date",
    value: form.log_date,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        log_date: e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('zk.f_type')), /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: form.entry_type,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        entry_type: e.target.value
      }));
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "plus"
  }, "+ Plusstunden\uFF08\u52A0\u73ED\uFF09"), /*#__PURE__*/React.createElement("option", {
    value: "minus"
  }, "- Minusstunden\uFF08\u77ED\u65F6\uFF09"))), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('zk.f_hrs')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    type: "number",
    step: "0.5",
    value: form.hours,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        hours: e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg ful"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('zk.f_reason')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    value: form.reason,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        reason: e.target.value
      }));
    }
  })))), fzModal && /*#__PURE__*/React.createElement(Modal, {
    title: t('zk.fz_title'),
    onClose: function onClose() {
      return setFzModal(null);
    },
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "b bgh",
      onClick: function onClick() {
        return setFzModal(null);
      }
    }, t('c.cancel')), /*#__PURE__*/React.createElement("button", {
      className: "b bgo",
      onClick: confirmFz
    }, t('zk.fz_btn')))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14,
      fontSize: 12,
      color: 'var(--tx2)'
    }
  }, "\u4E3A\u5458\u5DE5 ", /*#__PURE__*/React.createElement("b", null, fzModal.id), " ", t('zk.fz_title'), "\uFF08", t('zk.fz_desc').replace('{{h}}', fzModal.plusHours), "\uFF09"), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('zk.fz_hours')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    type: "number",
    step: "0.5",
    min: "0.5",
    value: fzHours,
    onChange: function onChange(e) {
      return setFzHours(e.target.value);
    },
    autoFocus: true
  }))));
}

// ── ABMAHNUNG ──
function Abmahnung(_ref24) {
  var token = _ref24.token,
    user = _ref24.user;
  var _useState55 = useState([]),
    _useState56 = _slicedToArray(_useState55, 2),
    abms = _useState56[0],
    setAbms = _useState56[1];
  var _useState57 = useState(true),
    _useState58 = _slicedToArray(_useState57, 2),
    loading = _useState58[0],
    setLoading = _useState58[1];
  var _useState59 = useState(false),
    _useState60 = _slicedToArray(_useState59, 2),
    addM = _useState60[0],
    setAddM = _useState60[1];
  var _useState61 = useState(null),
    _useState62 = _slicedToArray(_useState61, 2),
    previewM = _useState62[0],
    setPreviewM = _useState62[1];
  var _useState63 = useState(null),
    _useState64 = _slicedToArray(_useState63, 2),
    revokeModal = _useState64[0],
    setRevokeModal = _useState64[1];
  var _useState65 = useState(''),
    _useState66 = _slicedToArray(_useState65, 2),
    revokeReason = _useState66[0],
    setRevokeReason = _useState66[1];
  var _useState67 = useState([]),
    _useState68 = _slicedToArray(_useState67, 2),
    emps = _useState68[0],
    setEmps = _useState68[1];
  var today = new Date().toISOString().slice(0, 10);
  var _useState69 = useState({
      employee_id: '',
      abmahnung_type: '旷工（Unentschuldigtes Fehlen）',
      incident_date: today,
      issued_date: today,
      incident_description: '',
      internal_notes: '',
      delivery_method: '面交'
    }),
    _useState70 = _slicedToArray(_useState69, 2),
    form = _useState70[0],
    setForm = _useState70[1];
  var showToast = useToast();
  var _useLang8 = useLang(),
    t = _useLang8.t;
  var TYPES = ['旷工（Unentschuldigtes Fehlen）', '擅自超时（Eigenmächtige Arbeitszeitverlängerung）', '多次迟到（Wiederholte Verspätung）', '工时违规（ArbZG Verstoß）', '其他违约行为'];
  var load = function load() {
    setLoading(true);
    api('/api/abmahnungen', {
      token: token
    }).then(setAbms).finally(function () {
      return setLoading(false);
    });
  };
  useEffect(function () {
    load();
    api('/api/employees?status=在职', {
      token: token
    }).then(setEmps);
  }, []);
  var save = /*#__PURE__*/function () {
    var _ref25 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee9() {
      var _t9;
      return _regenerator().w(function (_context9) {
        while (1) switch (_context9.p = _context9.n) {
          case 0:
            if (!(!form.employee_id || !form.incident_description)) {
              _context9.n = 1;
              break;
            }
            showToast('请填写员工和违约事实', 'err');
            return _context9.a(2);
          case 1:
            _context9.p = 1;
            _context9.n = 2;
            return api('/api/abmahnungen', {
              method: 'POST',
              body: form,
              token: token
            });
          case 2:
            setAddM(false);
            load();
            showToast('Abmahnung 已发出');
            _context9.n = 4;
            break;
          case 3:
            _context9.p = 3;
            _t9 = _context9.v;
            showToast(_t9.message, 'err');
          case 4:
            return _context9.a(2);
        }
      }, _callee9, null, [[1, 3]]);
    }));
    return function save() {
      return _ref25.apply(this, arguments);
    };
  }();
  var revoke = function revoke(id) {
    setRevokeModal(id);
    setRevokeReason('');
  };
  var confirmRevoke = /*#__PURE__*/function () {
    var _ref26 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee0() {
      var _t0;
      return _regenerator().w(function (_context0) {
        while (1) switch (_context0.p = _context0.n) {
          case 0:
            if (revokeReason.trim()) {
              _context0.n = 1;
              break;
            }
            showToast(t('abm.revoke_err'), 'err');
            return _context0.a(2);
          case 1:
            _context0.p = 1;
            _context0.n = 2;
            return api("/api/abmahnungen/".concat(revokeModal, "/revoke"), {
              method: 'PUT',
              body: {
                reason: revokeReason
              },
              token: token
            });
          case 2:
            setRevokeModal(null);
            load();
            showToast('已撤销');
            _context0.n = 4;
            break;
          case 3:
            _context0.p = 3;
            _t0 = _context0.v;
            showToast(_t0.message, 'err');
          case 4:
            return _context0.a(2);
        }
      }, _callee0, null, [[1, 3]]);
    }));
    return function confirmRevoke() {
      return _ref26.apply(this, arguments);
    };
  }();

  // Group by employee to find Kündigung candidates
  var empCounts = {};
  abms.forEach(function (a) {
    if (a.status === '有效') empCounts[a.employee_id] = (empCounts[a.employee_id] || 0) + 1;
  });
  var kandidaten = Object.entries(empCounts).filter(function (_ref27) {
    var _ref28 = _slicedToArray(_ref27, 2),
      c = _ref28[1];
    return c >= 2;
  }).map(function (_ref29) {
    var _abms$find;
    var _ref30 = _slicedToArray(_ref29, 2),
      id = _ref30[0],
      c = _ref30[1];
    return {
      id: id,
      name: ((_abms$find = abms.find(function (a) {
        return a.employee_id === id;
      })) === null || _abms$find === void 0 ? void 0 : _abms$find.employee_name) || id,
      count: c
    };
  });
  var genLetter = function genLetter(a) {
    var _a$abmahnung_type;
    var emp = emps.find(function (e) {
      return e.id === a.employee_id;
    }) || {
      name: a.employee_name,
      address: '—'
    };
    var isOT = (_a$abmahnung_type = a.abmahnung_type) === null || _a$abmahnung_type === void 0 ? void 0 : _a$abmahnung_type.includes('超时');
    return "<div style=\"font-family:system-ui,sans-serif;padding:28px;max-width:640px;font-size:12px;line-height:1.8;color:#111\">\n      <div style=\"display:flex;justify-content:space-between;border-bottom:2px solid #1B2B4B;padding-bottom:14px;margin-bottom:18px\">\n        <div><div style=\"font-size:18px;font-weight:800;color:#1B2B4B\">Yuanbo GmbH</div><div style=\"font-size:9px;color:#666\">Personalmanagement \xB7 HR-DISZ-001</div></div>\n        <div style=\"text-align:right;font-size:10px;color:#666\">".concat(a.issued_date, "<br/>Nr.: ").concat(a.id, "</div>\n      </div>\n      <div style=\"margin-bottom:18px\">An:<br/><b>").concat(emp.name, "</b><br/>").concat(emp.address || '—', "</div>\n      <div style=\"font-size:15px;font-weight:800;color:#DC2626;margin-bottom:14px;letter-spacing:1px\">ABMAHNUNG</div>\n      <div style=\"background:#FEF2F2;border-left:3px solid #DC2626;padding:12px;border-radius:0 6px 6px 0;margin-bottom:14px\"><b>I. Sachverhaltsdarstellung\uFF08\u4E8B\u5B9E\u63CF\u8FF0\uFF09</b><br/>").concat(a.incident_description, "</div>\n      <div style=\"margin-bottom:12px\"><b>II. R\xFCge\uFF08\u6307\u8D23\uFF09</b><br/>\u60A8\u7684\u4E0A\u8FF0\u884C\u4E3A\u8FDD\u53CD\u4E86\u52B3\u52A8\u5408\u540C\u4E49\u52A1\uFF08\xA7611a BGB\uFF09").concat(isOT ? "及雇主基于§106 GewO发出的工时指令。本次未批准超时 [X]h 不计入 Zeitkonto。" : "。", "</div>\n      <div style=\"margin-bottom:12px\"><b>III. Aufforderung zur Verhaltens\xE4nderung\uFF08\u6539\u6B63\u8981\u6C42\uFF09</b><br/>\u6211\u65B9\u8981\u6C42\u60A8\u7ACB\u5373\u505C\u6B62\u4E0A\u8FF0\u8FDD\u7EA6\u884C\u4E3A\uFF0C\u4E25\u683C\u9075\u5B88\u5408\u540C\u89C4\u5B9A\u3002</div>\n      <div style=\"background:#FFF7ED;border:1px solid #FED7AA;padding:12px;border-radius:6px;margin-bottom:14px\"><b>IV. Warnung\uFF08\u8B66\u544A\uFF09</b><br/>\u5982\u60A8\u518D\u6B21\u53D1\u751F\u7C7B\u4F3C\u8FDD\u7EA6\u884C\u4E3A\uFF0C\u6211\u65B9\u5C06\u4E0D\u518D\u53D1\u51FA\u989D\u5916\u8B66\u544A\uFF0C<b>\u76F4\u63A5\u542F\u52A8\u52B3\u52A8\u5408\u540C\u89E3\u9664\u7A0B\u5E8F\uFF08K\xFCndigung des Arbeitsverh\xE4ltnisses\uFF09</b>\u3002</div>\n      <div style=\"font-size:10px;color:#666;margin-bottom:24px\">V. Hinweis: \u60A8\u6709\u6743\u5C06\u4E66\u9762\u53CD\u9A73\u610F\u89C1\uFF08Gegendarstellung\uFF09\u9644\u5165\u4E2A\u4EBA\u6863\u6848\uFF08Personalakte\uFF09\u3002<br/>\u6709\u6548\u671F2\u5E74 \xB7 \u6863\u6848\u7F16\u53F7\uFF1A").concat(a.id, "</div>\n      <div style=\"display:grid;grid-template-columns:1fr 1fr;gap:50px;margin-top:36px\">\n        <div><div style=\"border-top:1px solid #aaa;padding-top:6px;font-size:10px;color:#666\">\u6E0A\u535A GmbH \xB7 ").concat(a.issued_by || 'HR', " \xB7 Datum/Unterschrift</div></div>\n        <div><div style=\"border-top:1px solid #aaa;padding-top:6px;font-size:10px;color:#666\">").concat(emp.name, " \xB7 Empfang best\xE4tigt \xB7 Datum</div></div>\n      </div>\n    </div>");
  };
  return /*#__PURE__*/React.createElement("div", null, kandidaten.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "alert alert-rd"
  }, "\u26D4 ", /*#__PURE__*/React.createElement("b", null, "K\xFCndigung-Eignung:"), " ", kandidaten.map(function (k) {
    return "".concat(k.name, "\uFF08").concat(k.count, "\u6B21\u6709\u6548Abmahnung\uFF09");
  }).join('、'), " \u2014 \u5DF2\u5177\u5907 verhaltensbedingte K\xFCndigung \u6761\u4EF6\uFF0C\u5EFA\u8BAE\u54A8\u8BE2\u52B3\u52A8\u6CD5\u5F8B\u987E\u95EE"), /*#__PURE__*/React.createElement("div", {
    className: "alert alert-ac"
  }, "BAG GS 1/84 \u8981\u6C42 Abmahnung \u987B\u6EE1\u8DB3\uFF1A\u2460 \u5177\u4F53\u4E8B\u5B9E \u2461 \u4E66\u9762\u5F62\u5F0F \u2462 \u6539\u6B63\u8981\u6C42 \u2463 \u89E3\u804C\u8B66\u544A \u2464 \u53EF\u8BC1\u660E\u9001\u8FBE \u2465 14\u5929\u5185\u53D1\u51FA"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "b bgr",
    onClick: function onClick() {
      return setAddM(true);
    }
  }, "\u26A0 \u53D1\u51FA Abmahnung")), loading ? /*#__PURE__*/React.createElement(Loading, null) : /*#__PURE__*/React.createElement(React.Fragment, null, abms.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: 40,
      color: 'var(--tx3)'
    }
  }, "\u6682\u65E0 Abmahnung \u8BB0\u5F55"), /*#__PURE__*/React.createElement("div", {
    className: "tw"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\u6863\u6848\u53F7"), /*#__PURE__*/React.createElement("th", null, "\u5458\u5DE5"), /*#__PURE__*/React.createElement("th", null, "\u7C7B\u578B"), /*#__PURE__*/React.createElement("th", null, "\u8FDD\u7EA6\u65E5\u671F"), /*#__PURE__*/React.createElement("th", null, "\u53D1\u51FA\u65E5\u671F"), /*#__PURE__*/React.createElement("th", null, "\u6709\u6548\u81F3"), /*#__PURE__*/React.createElement("th", null, "\u53D1\u51FA\u4EBA"), /*#__PURE__*/React.createElement("th", null, "\u72B6\u6001"), /*#__PURE__*/React.createElement("th", null, "\u6B21\u6570"), /*#__PURE__*/React.createElement("th", null, "\u64CD\u4F5C"))), /*#__PURE__*/React.createElement("tbody", null, abms.map(function (a) {
    return /*#__PURE__*/React.createElement("tr", {
      key: a.id
    }, /*#__PURE__*/React.createElement("td", {
      className: "mn tm"
    }, a.id), /*#__PURE__*/React.createElement("td", {
      className: "fw6"
    }, a.employee_name), /*#__PURE__*/React.createElement("td", {
      style: {
        fontSize: 9,
        maxWidth: 160
      }
    }, a.abmahnung_type), /*#__PURE__*/React.createElement("td", null, a.incident_date), /*#__PURE__*/React.createElement("td", null, a.issued_date), /*#__PURE__*/React.createElement("td", {
      style: {
        color: a.status === '有效' ? 'var(--rd)' : 'var(--tx3)'
      }
    }, a.expiry_date), /*#__PURE__*/React.createElement("td", null, a.issued_by), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Bg, {
      t: a.status
    })), /*#__PURE__*/React.createElement("td", null, a._valid_count > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        color: a._valid_count >= 2 ? 'var(--rd)' : 'var(--og)',
        fontWeight: 700
      }
    }, a._valid_count, "\u6B21")), /*#__PURE__*/React.createElement("td", {
      style: {
        display: 'flex',
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "b bgh",
      style: {
        fontSize: 9
      },
      onClick: function onClick() {
        return setPreviewM(a);
      }
    }, "\uD83D\uDCC4"), a.status === '有效' && /*#__PURE__*/React.createElement("button", {
      className: "b",
      style: {
        fontSize: 9,
        background: 'var(--tx3)22',
        color: 'var(--tx3)'
      },
      onClick: function onClick() {
        return revoke(a.id);
      }
    }, "\u64A4\u9500")));
  }))))), addM && /*#__PURE__*/React.createElement(Modal, {
    title: "\u26A0\uFE0F \u53D1\u51FA Abmahnung",
    onClose: function onClose() {
      return setAddM(false);
    },
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "b bgh",
      onClick: function onClick() {
        return setAddM(false);
      }
    }, "\u53D6\u6D88"), /*#__PURE__*/React.createElement("button", {
      className: "b bgr",
      onClick: save
    }, "\u6B63\u5F0F\u53D1\u51FA"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "alert alert-og"
  }, "\u987B\u5728\u53D1\u73B0\u8FDD\u7EA6\u540E14\u5929\u5185\u53D1\u51FA\u3002\u53D1\u51FA\u524D\u786E\u8BA4\u4E8B\u5B9E\u5177\u4F53\u3001\u53EF\u8BC1\u660E\u9001\u8FBE\u3002"), /*#__PURE__*/React.createElement("div", {
    className: "fr"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, "\u5458\u5DE5 *"), /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: form.employee_id,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        employee_id: e.target.value
      }));
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014\u9009\u62E9\u2014"), emps.map(function (e) {
    return /*#__PURE__*/React.createElement("option", {
      key: e.id,
      value: e.id
    }, e.name, "\uFF08", e.id, "\uFF09");
  }))), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, "\u8FDD\u89C4\u7C7B\u578B *"), /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: form.abmahnung_type,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        abmahnung_type: e.target.value
      }));
    }
  }, TYPES.map(function (t) {
    return /*#__PURE__*/React.createElement("option", {
      key: t
    }, t);
  }))), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, "\u8FDD\u7EA6\u53D1\u751F\u65E5\u671F"), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    type: "date",
    value: form.incident_date,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        incident_date: e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, "Abmahnung\u53D1\u51FA\u65E5\u671F"), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    type: "date",
    value: form.issued_date,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        issued_date: e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, "\u9001\u8FBE\u65B9\u5F0F"), /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: form.delivery_method,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        delivery_method: e.target.value
      }));
    }
  }, /*#__PURE__*/React.createElement("option", null, "\u9762\u4EA4\uFF08\u5458\u5DE5\u7B7E\u6536\uFF09"), /*#__PURE__*/React.createElement("option", null, "\u6302\u53F7\u4FE1\uFF08Einschreiben\uFF09"))), /*#__PURE__*/React.createElement("div", {
    className: "fg ful"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, "I. \u8FDD\u7EA6\u4E8B\u5B9E\u63CF\u8FF0 * \uFF08\u987B\u5177\u4F53\uFF1A\u65E5\u671F/\u65F6\u95F4/\u884C\u4E3A/\u6211\u65B9\u5E94\u5BF9\u8BB0\u5F55\uFF09"), /*#__PURE__*/React.createElement("textarea", {
    className: "fta",
    rows: 4,
    value: form.incident_description,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        incident_description: e.target.value
      }));
    },
    placeholder: "\u4F8B\uFF1A\u5458\u5DE5\u4E8E2026\u5E743\u670810\u65E5\uFF08\u5468\u4E8C\uFF09\u672A\u901A\u77E5\u6211\u65B9\uFF0C\u672A\u5230UNA\u4ED3\u5E93\u5DE5\u4F5C\u3002\u6211\u65B9\u4E8E08:15\u300110:30\u4E24\u6B21\u7535\u8BDD\u8054\u7CFB\uFF0C\u5747\u65E0\u4EBA\u63A5\u542C\u3002\u622A\u81F32026\u5E743\u670812\u65E5\uFF0C\u5458\u5DE5\u672A\u63D0\u4EA4\u4EFB\u4F55\u8BF7\u5047\u7533\u8BF7\u6216AU-Bescheinigung\u3002"
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg ful"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, "\u5185\u90E8\u5907\u6CE8\uFF08\u4E0D\u5199\u5165\u6B63\u5F0FAbmahnung\uFF09"), /*#__PURE__*/React.createElement("textarea", {
    className: "fta",
    value: form.internal_notes,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        internal_notes: e.target.value
      }));
    }
  })))), previewM && /*#__PURE__*/React.createElement(Modal, {
    title: "Abmahnung \u9884\u89C8 \u2014 ".concat(previewM.employee_name),
    onClose: function onClose() {
      return setPreviewM(null);
    },
    wide: true,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "b bga",
      onClick: function onClick() {
        return window.print();
      }
    }, "\u2399 \u6253\u5370"), /*#__PURE__*/React.createElement("button", {
      className: "b bgh",
      onClick: function onClick() {
        return setPreviewM(null);
      }
    }, "\u5173\u95ED"))
  }, /*#__PURE__*/React.createElement("div", {
    dangerouslySetInnerHTML: {
      __html: genLetter(previewM)
    },
    style: {
      background: 'white',
      borderRadius: 8,
      padding: 16
    }
  })), revokeModal && /*#__PURE__*/React.createElement(Modal, {
    title: t('abm.revoke_title'),
    onClose: function onClose() {
      return setRevokeModal(null);
    },
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "b bgh",
      onClick: function onClick() {
        return setRevokeModal(null);
      }
    }, t('c.cancel')), /*#__PURE__*/React.createElement("button", {
      className: "b bgr",
      onClick: confirmRevoke
    }, t('abm.revoke_btn')))
  }, /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('abm.revoke_reason')), /*#__PURE__*/React.createElement("textarea", {
    className: "fta",
    value: revokeReason,
    onChange: function onChange(e) {
      return setRevokeReason(e.target.value);
    },
    placeholder: t('abm.revoke_placeholder'),
    autoFocus: true
  }))));
}

// ── WERKVERTRAG ──
var WV_PHASES = ['立项', '测算', '报价', '合规', '备人', '培训', '运营', '撤离'];
var WV_COMP_ITEMS = [{
  id: 'wv1',
  cat: 'Werkvertrag',
  lbl: 'Werkerfolg清晰定义（§631 BGB），非劳动时间',
  crit: true
}, {
  id: 'wv2',
  cat: 'Werkvertrag',
  lbl: '工人仅接受渊博方指令，不受客户直接指挥',
  crit: true
}, {
  id: 'wv3',
  cat: 'Werkvertrag',
  lbl: '渊博提供自有PPE和作业器具',
  crit: true
}, {
  id: 'aug1',
  cat: 'AÜG边界',
  lbl: '无 Arbeitnehmerüberlassung 认定风险',
  crit: true
}, {
  id: 'aug2',
  cat: 'AÜG边界',
  lbl: '工人未纳入客户组织架构',
  crit: true
}, {
  id: 'mw1',
  cat: 'Mindestlohn',
  lbl: '所有人员时薪 ≥ €13.00（MiLoG）',
  crit: true
}, {
  id: 'mw2',
  cat: 'Mindestlohn',
  lbl: 'Arbeitszeitaufzeichnung 完整留存',
  crit: true
}, {
  id: 'ap1',
  cat: '工作许可',
  lbl: 'EU公民：Freizügigkeit 已确认',
  crit: true
}, {
  id: 'ap2',
  cat: '工作许可',
  lbl: '非EU：Arbeitserlaubnis 有效核查',
  crit: true
}, {
  id: 'as1',
  cat: '安全/BG',
  lbl: 'BG Unfallversicherung 登记，Gefährdungsbeurteilung 完成',
  crit: true
}, {
  id: 'as2',
  cat: '安全/BG',
  lbl: '安全 Unterweisung 已记录签字',
  crit: true
}, {
  id: 'dsgvo',
  cat: 'DSGVO',
  lbl: '员工数据仅存EU合规服务器',
  crit: false
}];
function Werkvertrag(_ref31) {
  var _selP$cost_data;
  var token = _ref31.token,
    user = _ref31.user;
  var _useState71 = useState([]),
    _useState72 = _slicedToArray(_useState71, 2),
    projs = _useState72[0],
    setProjs = _useState72[1];
  var _useState73 = useState(true),
    _useState74 = _slicedToArray(_useState73, 2),
    loading = _useState74[0],
    setLoading = _useState74[1];
  var _useState75 = useState(null),
    _useState76 = _slicedToArray(_useState75, 2),
    selId = _useState76[0],
    setSelId = _useState76[1];
  var _useState77 = useState(0),
    _useState78 = _slicedToArray(_useState77, 2),
    ph = _useState78[0],
    setPh = _useState78[1];
  var _useState79 = useState(false),
    _useState80 = _slicedToArray(_useState79, 2),
    newM = _useState80[0],
    setNewM = _useState80[1];
  var _useState81 = useState({
      name: '',
      client: '',
      service_type: '',
      region: '',
      project_manager: ''
    }),
    _useState82 = _slicedToArray(_useState81, 2),
    form = _useState82[0],
    setForm = _useState82[1];
  var SERVICES = ['卸柜承包', '装卸承包', '入库承包', '出库承包', '区域承包', '快转/分拣承包', '综合承包'];
  var REGIONS = ['南部大区 (Köln/Düsseldorf)', '鲁尔西大区 (Duisburg/Essen)', '鲁尔东大区 (Dortmund/Unna)'];
  var showToast = useToast();
  var load = function load() {
    setLoading(true);
    api('/api/werkvertrag', {
      token: token
    }).then(setProjs).finally(function () {
      return setLoading(false);
    });
  };
  useEffect(function () {
    load();
  }, []);
  var selP = projs.find(function (p) {
    return p.id === selId;
  });
  var canEdit = ['admin', 'hr', 'mgr'].includes(user.role);
  var createProj = /*#__PURE__*/function () {
    var _ref32 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee1() {
      var r, _t1;
      return _regenerator().w(function (_context1) {
        while (1) switch (_context1.p = _context1.n) {
          case 0:
            if (form.name) {
              _context1.n = 1;
              break;
            }
            showToast('请填写项目名称', 'err');
            return _context1.a(2);
          case 1:
            _context1.p = 1;
            _context1.n = 2;
            return api('/api/werkvertrag', {
              method: 'POST',
              body: form,
              token: token
            });
          case 2:
            r = _context1.v;
            setSelId(r.id);
            setPh(0);
            setNewM(false);
            load();
            showToast('项目已创建');
            _context1.n = 4;
            break;
          case 3:
            _context1.p = 3;
            _t1 = _context1.v;
            showToast(_t1.message, 'err');
          case 4:
            return _context1.a(2);
        }
      }, _callee1, null, [[1, 3]]);
    }));
    return function createProj() {
      return _ref32.apply(this, arguments);
    };
  }();
  var updateProj = /*#__PURE__*/function () {
    var _ref33 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee10(upd) {
      var _t10;
      return _regenerator().w(function (_context10) {
        while (1) switch (_context10.p = _context10.n) {
          case 0:
            if (selId) {
              _context10.n = 1;
              break;
            }
            return _context10.a(2);
          case 1:
            _context10.p = 1;
            _context10.n = 2;
            return api("/api/werkvertrag/".concat(selId), {
              method: 'PUT',
              body: upd,
              token: token
            });
          case 2:
            load();
            _context10.n = 4;
            break;
          case 3:
            _context10.p = 3;
            _t10 = _context10.v;
            showToast(_t10.message, 'err');
          case 4:
            return _context10.a(2);
        }
      }, _callee10, null, [[1, 3]]);
    }));
    return function updateProj(_x4) {
      return _ref33.apply(this, arguments);
    };
  }();
  var calcCost = function calcCost() {
    var c = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var workers = c.workers || [];
    var lb = workers.reduce(function (s, w) {
      return s + (w.count || 0) * (w.hoursDay || 0) * (w.days || 0) * (w.rate || 13);
    }, 0);
    var soc = lb * ((c.soc || 21) / 100),
      hol = lb * ((c.hol || 8) / 100),
      mgmt = lb * ((c.mgmt || 18) / 100);
    var sub = lb + soc + hol + mgmt + (+c.equip || 0) + (+c.travel || 0);
    var tot = sub + sub * ((c.overhead || 5) / 100);
    var price = tot / (1 - (c.margin || 15) / 100);
    return {
      lb: lb,
      soc: soc,
      hol: hol,
      mgmt: mgmt,
      tot: tot,
      price: price,
      margin: price - tot
    };
  };
  var compOk = selP ? WV_COMP_ITEMS.filter(function (i) {
    var _selP$comp_data;
    return ((_selP$comp_data = selP.comp_data) === null || _selP$comp_data === void 0 ? void 0 : _selP$comp_data[i.id]) === 'ok';
  }).length : 0;
  var compCritFail = selP ? WV_COMP_ITEMS.filter(function (i) {
    var _selP$comp_data2;
    return i.crit && ((_selP$comp_data2 = selP.comp_data) === null || _selP$comp_data2 === void 0 ? void 0 : _selP$comp_data2[i.id]) === 'fail';
  }).length : 0;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      height: 'calc(100vh - 120px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 210,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, canEdit && /*#__PURE__*/React.createElement("button", {
    className: "b bga",
    style: {
      width: '100%'
    },
    onClick: function onClick() {
      return setNewM(true);
    }
  }, "+ \u65B0\u5EFA\u9879\u76EE"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto'
    }
  }, loading ? /*#__PURE__*/React.createElement(Loading, null) : projs.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "tm",
    style: {
      textAlign: 'center',
      padding: 20,
      fontSize: 11
    }
  }, "\u6682\u65E0\u9879\u76EE") : projs.map(function (p) {
    return /*#__PURE__*/React.createElement("div", {
      key: p.id,
      className: "proj-card ".concat(selId === p.id ? 'sel' : ''),
      onClick: function onClick() {
        setSelId(p.id);
        setPh(p.phase);
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 700,
        fontSize: 12,
        marginBottom: 3
      }
    }, p.name), /*#__PURE__*/React.createElement("div", {
      className: "tm",
      style: {
        fontSize: 9,
        marginBottom: 6
      }
    }, p.client || '—'), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: 'var(--tx3)',
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 3
      }
    }, /*#__PURE__*/React.createElement("span", null, WV_PHASES[p.phase]), /*#__PURE__*/React.createElement("span", null, Math.round(p.phase / 7 * 100), "%")), /*#__PURE__*/React.createElement("div", {
      className: "prog-wrap"
    }, /*#__PURE__*/React.createElement("div", {
      className: "prog-fill",
      style: {
        width: Math.round(p.phase / 7 * 100) + '%',
        background: 'var(--ac)'
      }
    })), p.closed && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: 'var(--gn)',
        marginTop: 4
      }
    }, "\u2713 \u5DF2\u5F52\u6863"));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto'
    }
  }, !selP ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: 'var(--tx3)'
    }
  }, "\u2190 \u9009\u62E9\u9879\u76EE\u6216\u65B0\u5EFA") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 3,
      flexWrap: 'wrap',
      marginBottom: 12,
      background: 'var(--bg3)',
      padding: 3,
      borderRadius: 10
    }
  }, WV_PHASES.map(function (p2, i) {
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      onClick: function onClick() {
        return setPh(i);
      },
      style: {
        padding: '5px 10px',
        borderRadius: 7,
        border: 'none',
        fontFamily: 'inherit',
        fontSize: 10,
        fontWeight: 600,
        cursor: 'pointer',
        background: ph === i ? 'var(--ac)' : 'transparent',
        color: ph === i ? '#fff' : i < selP.phase ? 'var(--gn)' : 'var(--tx3)'
      }
    }, i < selP.phase ? '✓ ' : '', p2);
  })), ph === 0 && /*#__PURE__*/React.createElement("div", {
    className: "cd"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ct-t"
  }, "\u2460 \u9879\u76EE\u7ACB\u9879 \xB7 Projekter\xF6ffnung"), /*#__PURE__*/React.createElement("div", {
    className: "fr"
  }, [['项目名称', 'name'], ['客户/仓库', 'client'], ['地址', 'address'], ['服务类型', 'service_type'], ['大区', 'region'], ['项目负责人', 'project_manager']].map(function (_ref34) {
    var _ref35 = _slicedToArray(_ref34, 2),
      l = _ref35[0],
      k = _ref35[1];
    return /*#__PURE__*/React.createElement("div", {
      key: k,
      className: "fg"
    }, /*#__PURE__*/React.createElement("label", {
      className: "fl"
    }, l), k === 'service_type' ? /*#__PURE__*/React.createElement("select", {
      className: "fsl",
      value: selP[k] || '',
      onChange: function onChange(e) {
        return updateProj(_defineProperty({}, k, e.target.value));
      }
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "\u2014"), SERVICES.map(function (s) {
      return /*#__PURE__*/React.createElement("option", {
        key: s
      }, s);
    })) : k === 'region' ? /*#__PURE__*/React.createElement("select", {
      className: "fsl",
      value: selP[k] || '',
      onChange: function onChange(e) {
        return updateProj(_defineProperty({}, k, e.target.value));
      }
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "\u2014"), REGIONS.map(function (s) {
      return /*#__PURE__*/React.createElement("option", {
        key: s
      }, s);
    })) : /*#__PURE__*/React.createElement("input", {
      className: "fi",
      defaultValue: selP[k] || '',
      onBlur: function onBlur(e) {
        return updateProj(_defineProperty({}, k, e.target.value));
      }
    }));
  }), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, "\u5F00\u59CB"), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    type: "date",
    defaultValue: selP.start_date || '',
    onBlur: function onBlur(e) {
      return updateProj({
        start_date: e.target.value
      });
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, "\u7ED3\u675F\uFF08\u7559\u7A7A=\u957F\u671F\uFF09"), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    type: "date",
    defaultValue: selP.end_date || '',
    onBlur: function onBlur(e) {
      return updateProj({
        end_date: e.target.value
      });
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg ful"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, "Werkerfolg \u63CF\u8FF0\uFF08\u5408\u540C\u6838\u5FC3\uFF1A\u6210\u679C\u800C\u975E\u5DE5\u65F6\uFF09"), /*#__PURE__*/React.createElement("textarea", {
    className: "fta",
    defaultValue: selP.description || '',
    onBlur: function onBlur(e) {
      return updateProj({
        description: e.target.value
      });
    },
    placeholder: "\u63CF\u8FF0\u7EA6\u5B9A\u7684\u6210\u679C\uFF1AX\u4E2A\u67DC/X\u4EF6\u8D27\u7269\u5904\u7406\u3001\u8D28\u91CF\u6807\u51C6\u3001\u4EA4\u4ED8\u65B9\u5F0F..."
  }))), /*#__PURE__*/React.createElement("button", {
    className: "b bga",
    onClick: function onClick() {
      return updateProj({
        phase: Math.max(selP.phase, 1)
      });
    }
  }, "\u786E\u8BA4 \u2192 \u6210\u672C\u6D4B\u7B97")), ph === 1 && function () {
    var c = selP.cost_data || {
      workers: [{
        label: 'P1-P2',
        rate: 13,
        count: 5,
        hoursDay: 8,
        days: 20
      }],
      soc: 21,
      hol: 8,
      mgmt: 18,
      equip: 0,
      travel: 0,
      overhead: 5,
      margin: 15
    };
    var cv = calcCost(c);
    var updW = function updW(idx, k, v) {
      var ws = _toConsumableArray(c.workers);
      ws[idx] = _objectSpread(_objectSpread({}, ws[idx]), {}, _defineProperty({}, k, v));
      updateProj({
        cost_data: _objectSpread(_objectSpread({}, c), {}, {
          workers: ws
        })
      });
    };
    return /*#__PURE__*/React.createElement("div", {
      className: "cd"
    }, /*#__PURE__*/React.createElement("div", {
      className: "ct-t"
    }, "\u2461 \u6210\u672C\u6D4B\u7B97 \xB7 Kostenkalkulation"), /*#__PURE__*/React.createElement("div", {
      style: {
        overflowX: 'auto'
      }
    }, /*#__PURE__*/React.createElement("table", {
      style: {
        fontSize: 11
      }
    }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\u4EBA\u5458\u7EC4"), /*#__PURE__*/React.createElement("th", null, "\u65F6\u85AA(\u20AC)"), /*#__PURE__*/React.createElement("th", null, "\u4EBA\u6570"), /*#__PURE__*/React.createElement("th", null, "h/\u65E5"), /*#__PURE__*/React.createElement("th", null, "\u5929\u6570"), /*#__PURE__*/React.createElement("th", null, "\u5C0F\u8BA1(\u20AC)"), /*#__PURE__*/React.createElement("th", null))), /*#__PURE__*/React.createElement("tbody", null, c.workers.map(function (w, i) {
      return /*#__PURE__*/React.createElement("tr", {
        key: i
      }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
        className: "fi",
        value: w.label,
        style: {
          width: 110
        },
        onBlur: function onBlur(e) {
          return updW(i, 'label', e.target.value);
        }
      })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
        className: "fi",
        type: "number",
        value: w.rate,
        step: "0.5",
        style: {
          width: 70
        },
        onChange: function onChange(e) {
          return updW(i, 'rate', +e.target.value);
        }
      })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
        className: "fi",
        type: "number",
        value: w.count,
        style: {
          width: 60
        },
        onChange: function onChange(e) {
          return updW(i, 'count', +e.target.value);
        }
      })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
        className: "fi",
        type: "number",
        value: w.hoursDay,
        step: "0.5",
        style: {
          width: 60
        },
        onChange: function onChange(e) {
          return updW(i, 'hoursDay', +e.target.value);
        }
      })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
        className: "fi",
        type: "number",
        value: w.days,
        style: {
          width: 60
        },
        onChange: function onChange(e) {
          return updW(i, 'days', +e.target.value);
        }
      })), /*#__PURE__*/React.createElement("td", {
        className: "mn"
      }, "\u20AC", fmtE((w.count || 0) * (w.hoursDay || 0) * (w.days || 0) * (w.rate || 13))), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
        className: "b bgr",
        style: {
          fontSize: 9
        },
        onClick: function onClick() {
          return updateProj({
            cost_data: _objectSpread(_objectSpread({}, c), {}, {
              workers: c.workers.filter(function (_, j) {
                return j !== i;
              })
            })
          });
        }
      }, "\u2715")));
    })))), /*#__PURE__*/React.createElement("button", {
      className: "b bgh",
      style: {
        fontSize: 10,
        margin: '8px 0 14px'
      },
      onClick: function onClick() {
        return updateProj({
          cost_data: _objectSpread(_objectSpread({}, c), {}, {
            workers: [].concat(_toConsumableArray(c.workers), [{
              label: 'P1',
              rate: 13,
              count: 3,
              hoursDay: 8,
              days: 10
            }])
          })
        });
      }
    }, "+ \u4EBA\u5458\u7EC4"), /*#__PURE__*/React.createElement("div", {
      className: "fr3"
    }, [['SV %', c.soc, 'soc'], ['假期 %', c.hol, 'hol'], ['管理 %', c.mgmt, 'mgmt'], ['设备 €', c.equip, 'equip'], ['差旅 €', c.travel, 'travel'], ['Overhead %', c.overhead, 'overhead'], ['利润率 %', c.margin, 'margin']].map(function (_ref36) {
      var _ref37 = _slicedToArray(_ref36, 3),
        l = _ref37[0],
        v = _ref37[1],
        k = _ref37[2];
      return /*#__PURE__*/React.createElement("div", {
        key: k,
        className: "fg"
      }, /*#__PURE__*/React.createElement("label", {
        className: "fl"
      }, l), /*#__PURE__*/React.createElement("input", {
        className: "fi",
        type: "number",
        value: v,
        step: "0.5",
        onChange: function onChange(e) {
          return updateProj({
            cost_data: _objectSpread(_objectSpread({}, c), {}, _defineProperty({}, k, +e.target.value))
          });
        }
      }));
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        background: '#11141d',
        borderRadius: 10,
        padding: 16,
        color: '#fff',
        marginTop: 4
      }
    }, [['Bruttoarbeitslohn', 'var(--tx2)', fmtE(cv.lb)], ["SV (".concat(c.soc || 21, "%)"), 'var(--tx2)', fmtE(cv.soc)], ["\u5047\u671F (".concat(c.hol || 8, "%)"), 'var(--tx2)', fmtE(cv.hol)], ["\u7BA1\u7406 (".concat(c.mgmt || 18, "%)"), 'var(--tx2)', fmtE(cv.mgmt)], ['设备+差旅', 'var(--tx2)', fmtE((+c.equip || 0) + (+c.travel || 0))], ["Overhead (".concat(c.overhead || 5, "%)"), 'var(--tx2)', fmtE(cv.tot - cv.lb - cv.soc - cv.hol - cv.mgmt)], ['总成本', '#fff', fmtE(cv.tot)]].map(function (_ref38) {
      var _ref39 = _slicedToArray(_ref38, 3),
        l = _ref39[0],
        tc = _ref39[1],
        v = _ref39[2];
      return /*#__PURE__*/React.createElement("div", {
        key: l,
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          padding: '4px 0',
          borderBottom: '1px solid #ffffff12',
          color: tc
        }
      }, /*#__PURE__*/React.createElement("span", null, l), /*#__PURE__*/React.createElement("span", {
        style: {
          fontFamily: 'monospace'
        }
      }, "\u20AC", v));
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 15,
        fontWeight: 800,
        padding: '10px 0 0',
        color: 'var(--og)'
      }
    }, /*#__PURE__*/React.createElement("span", null, "\u5EFA\u8BAE\u62A5\u4EF7 (Marge ", c.margin || 15, "%)"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'monospace'
      }
    }, "\u20AC", fmtE(cv.price))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: 'rgba(255,255,255,.4)',
        marginTop: 4
      }
    }, "\u51C0\u5229\u6DA6: \u20AC", fmtE(cv.margin), " \xB7 \u5B9E\u9645Marge: ", cv.price > 0 ? (cv.margin / cv.price * 100).toFixed(1) : 0, "%")), /*#__PURE__*/React.createElement("button", {
      className: "b bga",
      style: {
        marginTop: 12
      },
      onClick: function onClick() {
        return updateProj({
          phase: Math.max(selP.phase, 2)
        });
      }
    }, "\u6210\u672C\u786E\u8BA4 \u2192 \u62A5\u4EF7"));
  }(), ph === 2 && function () {
    var c = selP.cost_data || {};
    var cv = calcCost(c);
    return /*#__PURE__*/React.createElement("div", {
      className: "cd"
    }, /*#__PURE__*/React.createElement("div", {
      className: "ct-t"
    }, "\u2462 \u62A5\u4EF7\u9884\u89C8 \xB7 Angebotserstellung"), /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'white',
        borderRadius: 10,
        padding: 24,
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 20
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 800,
        color: '#1B2B4B'
      }
    }, "Yuanbo GmbH"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: '#666'
      }
    }, "Werkvertrag \xB7 \xA7631 BGB")), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'right',
        fontSize: 10,
        color: '#F59E0B',
        fontWeight: 700
      }
    }, "ANGEBOT")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: '#111',
        marginBottom: 12
      }
    }, "An: ", /*#__PURE__*/React.createElement("b", null, selP.client || '[Kunde]'), /*#__PURE__*/React.createElement("br", null), selP.address, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null), "Betreff: ", selP.name, /*#__PURE__*/React.createElement("br", null), "Leistungsart: ", selP.service_type, /*#__PURE__*/React.createElement("br", null), "Zeitraum: ", selP.start_date || '—', " bis ", selP.end_date || 'offen'), /*#__PURE__*/React.createElement("div", {
      style: {
        borderTop: '2px solid #1B2B4B',
        paddingTop: 12
      }
    }, [['Nettobetrag', '#111', fmtE(cv.price)], ['zzgl. 19% MwSt.', '#666', fmtE(cv.price * 0.19)], ['Gesamt inkl. MwSt.', '#1B2B4B', fmtE(cv.price * 1.19)]].map(function (_ref40) {
      var _ref41 = _slicedToArray(_ref40, 3),
        l = _ref41[0],
        c2 = _ref41[1],
        v = _ref41[2];
      return /*#__PURE__*/React.createElement("div", {
        key: l,
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: l.includes('Gesamt') ? 14 : 11,
          fontWeight: l.includes('Gesamt') ? 800 : 400,
          color: c2,
          padding: '4px 0'
        }
      }, /*#__PURE__*/React.createElement("span", null, l), /*#__PURE__*/React.createElement("span", {
        style: {
          fontFamily: 'monospace'
        }
      }, "\u20AC", v));
    }))), /*#__PURE__*/React.createElement("button", {
      className: "b bga",
      onClick: function onClick() {
        return updateProj({
          phase: Math.max(selP.phase, 3),
          quote_approved: 1
        });
      }
    }, "\u62A5\u4EF7\u786E\u8BA4 \u2192 \u5408\u89C4\u5BA1\u67E5"));
  }(), ph === 3 && /*#__PURE__*/React.createElement("div", {
    className: "cd"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ct-t"
  }, "\u2463 \u5408\u89C4\u5BA1\u67E5 \xB7 Compliance-Pr\xFCfung"), compCritFail > 0 && /*#__PURE__*/React.createElement("div", {
    className: "alert alert-rd"
  }, "\u26D4 ", compCritFail, "\u9879\u5173\u952E\u5408\u89C4\u4E0D\u901A\u8FC7 \u2014 \u7981\u6B62\u4E0A\u5C97"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--tx3)',
      marginBottom: 10
    }
  }, "\u5DF2\u901A\u8FC7 ", compOk, "/", WV_COMP_ITEMS.length, " \xB7 \u5173\u952E\u9879\u672A\u901A\u8FC7: ", compCritFail), ['Werkvertrag', 'AÜG边界', 'Mindestlohn', '工作许可', '安全/BG', 'DSGVO'].map(function (cat) {
    return /*#__PURE__*/React.createElement("div", {
      key: cat,
      style: {
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        color: 'var(--ac2)',
        marginBottom: 6
      }
    }, "\u25B8 ", cat), WV_COMP_ITEMS.filter(function (i) {
      return i.cat === cat;
    }).map(function (item) {
      return /*#__PURE__*/React.createElement("div", {
        key: item.id,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 0',
          borderBottom: '1px solid var(--bd)30'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: 5
        }
      }, ['ok', 'fail'].map(function (v) {
        var _selP$comp_data3, _selP$comp_data4, _selP$comp_data5;
        return /*#__PURE__*/React.createElement("div", {
          key: v,
          onClick: function onClick() {
            var nd = _objectSpread({}, selP.comp_data);
            nd[item.id] === v ? delete nd[item.id] : nd[item.id] = v;
            updateProj({
              comp_data: nd
            });
          },
          style: {
            width: 16,
            height: 16,
            borderRadius: 4,
            cursor: 'pointer',
            border: "2px solid ".concat(((_selP$comp_data3 = selP.comp_data) === null || _selP$comp_data3 === void 0 ? void 0 : _selP$comp_data3[item.id]) === v ? v === 'ok' ? 'var(--gn)' : 'var(--rd)' : 'var(--bd)'),
            background: ((_selP$comp_data4 = selP.comp_data) === null || _selP$comp_data4 === void 0 ? void 0 : _selP$comp_data4[item.id]) === v ? v === 'ok' ? 'var(--gn)' : 'var(--rd)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            color: '#fff',
            flexShrink: 0
          }
        }, ((_selP$comp_data5 = selP.comp_data) === null || _selP$comp_data5 === void 0 ? void 0 : _selP$comp_data5[item.id]) === v ? v === 'ok' ? '✓' : '✕' : '');
      })), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11
        }
      }, item.lbl, " ", item.crit && /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 8,
          padding: '1px 5px',
          borderRadius: 3,
          background: '#f0526c22',
          color: 'var(--rd)',
          border: '1px solid #f0526c44'
        }
      }, "\u5FC5\u987B")));
    }));
  }), /*#__PURE__*/React.createElement("button", {
    className: "b bga",
    disabled: compCritFail > 0,
    style: {
      opacity: compCritFail > 0 ? .4 : 1,
      marginTop: 4
    },
    onClick: function onClick() {
      return updateProj({
        phase: Math.max(selP.phase, 4),
        comp_approved: 1
      });
    }
  }, "\u5408\u89C4\u901A\u8FC7 \u2192 \u5907\u4EBA")), ph >= 4 && ph <= 6 && /*#__PURE__*/React.createElement("div", {
    className: "cd"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ct-t"
  }, ph === 4 ? '⑤ 岗前备人' : ph === 5 ? '⑥ 培训管理' : '⑦ 上岗运营'), ph === 4 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "alert alert-ac"
  }, "\u786E\u8BA4\u6240\u6709\u53C2\u4E0E\u672C\u9879\u76EE\u7684\u4EBA\u5458\uFF1A\u5DE5\u4F5C\u8BB8\u53EF\u6709\u6548\u3001PPE\u914D\u7F6E\u5B8C\u6BD5\u3001\u5DF2\u5F55\u5165\u5458\u5DE5\u82B1\u540D\u518C\u3002"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--tx2)'
    }
  }, "\u6240\u9700\u4EBA\u6570: ", /*#__PURE__*/React.createElement("b", null, (((_selP$cost_data = selP.cost_data) === null || _selP$cost_data === void 0 ? void 0 : _selP$cost_data.workers) || []).reduce(function (s, w) {
    return s + (w.count || 0);
  }, 0)), " \u4EBA \xB7 \u4ED3\u5E93: ", selP.client)), ph === 5 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--tx2)',
      lineHeight: 2
    }
  }, /*#__PURE__*/React.createElement("div", null, "\u2713 \u5B89\u5168Unterweisung\uFF08\u7B7E\u5230\u8868\uFF09"), /*#__PURE__*/React.createElement("div", null, "\u2713 PPE\u89C4\u8303\u4F7F\u7528"), /*#__PURE__*/React.createElement("div", null, "\u2713 \u5F00\u67DC\u516D\u6B65\u6CD5+\u89C6\u9891\u8BB0\u5F55\u89C4\u8303\uFF08HGB \xA7438\uFF09"), /*#__PURE__*/React.createElement("div", null, "\u2713 Arbeitszeitnachweis \u586B\u5199\u89C4\u8303"), /*#__PURE__*/React.createElement("div", null, "\u2713 \u5DE5\u4EBA\u4EC5\u63A5\u53D7\u6E0A\u535A\u65B9\u6307\u4EE4\uFF08Werkvertrag\u5408\u89C4\u6838\u5FC3\uFF09")), ph === 6 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--tx2)',
      lineHeight: 2
    }
  }, /*#__PURE__*/React.createElement("div", null, "\u2192 \u6BCF\u65E5\u5DE5\u65F6\u5F55\u5165\uFF1A\u5DE5\u65F6\u8BB0\u5F55\u9875"), /*#__PURE__*/React.createElement("div", null, "\u2192 \u5F00\u67DC\u8BB0\u5F55\uFF1A\u5378\u67DC\u8BB0\u5F55\u9875"), /*#__PURE__*/React.createElement("div", null, "\u2192 \u5F02\u5E38\u4E8B\u4EF6\uFF1AAbmahnung\u9875"), /*#__PURE__*/React.createElement("div", null, "\u2192 Zeitkonto\u8D85\u65F6\u9884\u8B66\uFF1AZeitkonto\u9875")), /*#__PURE__*/React.createElement("button", {
    className: "b bga",
    style: {
      marginTop: 12
    },
    onClick: function onClick() {
      return updateProj({
        phase: Math.max(selP.phase, ph + 1)
      });
    }
  }, "\u786E\u8BA4 \u2192 ", WV_PHASES[ph + 1])), ph === 7 && /*#__PURE__*/React.createElement("div", {
    className: "cd"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ct-t"
  }, "\u2467 \u9879\u76EE\u64A4\u79BB \xB7 Projektabschluss"), [['client_signed_off', '客户 Leistungsabnahme 签字（§640 BGB）'], ['staff_returned', '人员重新分配/离场'], ['equip_returned', 'PPE和器具回收'], ['final_billed', '最终结算账单已发送']].map(function (_ref42) {
    var _ref43 = _slicedToArray(_ref42, 2),
      k = _ref43[0],
      lbl = _ref43[1];
    return /*#__PURE__*/React.createElement("div", {
      key: k,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 0',
        borderBottom: '1px solid var(--bd)30'
      }
    }, /*#__PURE__*/React.createElement("div", {
      onClick: function onClick() {
        return updateProj(_defineProperty({}, k, selP[k] ? 0 : 1));
      },
      style: {
        width: 18,
        height: 18,
        borderRadius: 4,
        cursor: 'pointer',
        border: "2px solid ".concat(selP[k] ? 'var(--gn)' : 'var(--bd)'),
        background: selP[k] ? 'var(--gn)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 11,
        flexShrink: 0
      }
    }, selP[k] ? '✓' : ''), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12
      }
    }, lbl));
  }), /*#__PURE__*/React.createElement("div", {
    className: "fg",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, "Debrief / Lessons Learned"), /*#__PURE__*/React.createElement("textarea", {
    className: "fta",
    defaultValue: selP.debrief || '',
    onBlur: function onBlur(e) {
      return updateProj({
        debrief: e.target.value
      });
    },
    placeholder: "\u7ECF\u9A8C\u603B\u7ED3\u3001\u6539\u8FDB\u5EFA\u8BAE\u3001\u7EED\u7EA6\u8BC4\u4F30..."
  })), /*#__PURE__*/React.createElement("button", {
    className: "b bgn",
    style: {
      marginTop: 12
    },
    disabled: !!selP.closed,
    onClick: function onClick() {
      if (window.confirm('确认归档此项目？')) updateProj({
        closed: 1
      });
    }
  }, selP.closed ? '✅ 已归档' : '项目完成归档')))), newM && /*#__PURE__*/React.createElement(Modal, {
    title: "\u65B0\u5EFA Werkvertrag \u9879\u76EE",
    onClose: function onClose() {
      return setNewM(false);
    },
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "b bgh",
      onClick: function onClick() {
        return setNewM(false);
      }
    }, "\u53D6\u6D88"), /*#__PURE__*/React.createElement("button", {
      className: "b bga",
      onClick: createProj
    }, "\u521B\u5EFA"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "alert alert-og"
  }, "Werkvertrag \u987B\u7EA6\u5B9A Werkerfolg\uFF08\u6210\u679C\uFF09\uFF0C\u975E\u52B3\u52A8\u65F6\u95F4\u3002"), /*#__PURE__*/React.createElement("div", {
    className: "fr"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fg ful"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, "\u9879\u76EE\u540D\u79F0 *"), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    value: form.name,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        name: e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, "\u5BA2\u6237/\u4ED3\u5E93"), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    value: form.client,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        client: e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, "\u670D\u52A1\u7C7B\u578B"), /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: form.service_type,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        service_type: e.target.value
      }));
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014"), SERVICES.map(function (s) {
    return /*#__PURE__*/React.createElement("option", {
      key: s
    }, s);
  }))), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, "\u5927\u533A"), /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: form.region,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        region: e.target.value
      }));
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014"), REGIONS.map(function (r) {
    return /*#__PURE__*/React.createElement("option", {
      key: r
    }, r);
  }))), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, "\u9879\u76EE\u8D1F\u8D23\u4EBA"), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    value: form.project_manager,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        project_manager: e.target.value
      }));
    }
  })))));
}

// ── CONTAINERS ──
function Containers(_ref44) {
  var token = _ref44.token,
    user = _ref44.user;
  var _useState83 = useState([]),
    _useState84 = _slicedToArray(_useState83, 2),
    cts = _useState84[0],
    setCts = _useState84[1];
  var _useState85 = useState(true),
    _useState86 = _slicedToArray(_useState85, 2),
    loading = _useState86[0],
    setLoading = _useState86[1];
  var _useState87 = useState(false),
    _useState88 = _slicedToArray(_useState87, 2),
    addM = _useState88[0],
    setAddM = _useState88[1];
  var _useState89 = useState(null),
    _useState90 = _slicedToArray(_useState89, 2),
    completeModal = _useState90[0],
    setCompleteModal = _useState90[1];
  var _useState91 = useState('16:00'),
    _useState92 = _slicedToArray(_useState91, 2),
    completeEndTime = _useState92[0],
    setCompleteEndTime = _useState92[1];
  var _useState93 = useState([]),
    _useState94 = _slicedToArray(_useState93, 2),
    emps = _useState94[0],
    setEmps = _useState94[1];
  var _useState95 = useState({
      container_no: '',
      container_type: '40GP',
      work_date: new Date().toISOString().slice(0, 10),
      start_time: '08:00',
      seal_no: '',
      worker_ids: [],
      client_revenue: 0,
      team_pay: 0,
      notes: ''
    }),
    _useState96 = _slicedToArray(_useState95, 2),
    form = _useState96[0],
    setForm = _useState96[1];
  var _useLang9 = useLang(),
    t = _useLang9.t;
  var showToast = useToast();
  var load = function load() {
    setLoading(true);
    api('/api/containers', {
      token: token
    }).then(setCts).finally(function () {
      return setLoading(false);
    });
  };
  useEffect(function () {
    load();
    api('/api/employees?status=在职', {
      token: token
    }).then(setEmps);
  }, []);
  var addCt = /*#__PURE__*/function () {
    var _ref45 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee11() {
      var _t11;
      return _regenerator().w(function (_context11) {
        while (1) switch (_context11.p = _context11.n) {
          case 0:
            if (form.container_no) {
              _context11.n = 1;
              break;
            }
            showToast('请输入柜号', 'err');
            return _context11.a(2);
          case 1:
            _context11.p = 1;
            _context11.n = 2;
            return api('/api/containers', {
              method: 'POST',
              body: form,
              token: token
            });
          case 2:
            setAddM(false);
            load();
            showToast('卸柜记录已添加');
            _context11.n = 4;
            break;
          case 3:
            _context11.p = 3;
            _t11 = _context11.v;
            showToast(_t11.message, 'err');
          case 4:
            return _context11.a(2);
        }
      }, _callee11, null, [[1, 3]]);
    }));
    return function addCt() {
      return _ref45.apply(this, arguments);
    };
  }();
  var complete = function complete(id) {
    setCompleteModal(id);
    setCompleteEndTime('16:00');
  };
  var confirmComplete = /*#__PURE__*/function () {
    var _ref46 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee12() {
      var _t12;
      return _regenerator().w(function (_context12) {
        while (1) switch (_context12.p = _context12.n) {
          case 0:
            _context12.p = 0;
            _context12.n = 1;
            return api("/api/containers/".concat(completeModal, "/complete"), {
              method: 'PUT',
              body: {
                end_time: completeEndTime,
                video_recorded: 1
              },
              token: token
            });
          case 1:
            setCompleteModal(null);
            load();
            showToast('卸柜已完成');
            _context12.n = 3;
            break;
          case 2:
            _context12.p = 2;
            _t12 = _context12.v;
            showToast(_t12.message, 'err');
          case 3:
            return _context12.a(2);
        }
      }, _callee12, null, [[0, 2]]);
    }));
    return function confirmComplete() {
      return _ref46.apply(this, arguments);
    };
  }();
  var TYPES = ['20GP', '40GP', '40HQ', '45HC'];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "b bga",
    onClick: function onClick() {
      return setAddM(true);
    }
  }, t('ct.add'))), loading ? /*#__PURE__*/React.createElement(Loading, null) : /*#__PURE__*/React.createElement("div", {
    className: "tw"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ts"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, t('ct.col_no')), /*#__PURE__*/React.createElement("th", null, t('ct.col_type')), /*#__PURE__*/React.createElement("th", null, t('ct.col_wh')), /*#__PURE__*/React.createElement("th", null, t('ct.col_date')), /*#__PURE__*/React.createElement("th", null, t('ct.col_start')), /*#__PURE__*/React.createElement("th", null, t('ct.col_end')), /*#__PURE__*/React.createElement("th", null, t('ct.col_hrs')), /*#__PURE__*/React.createElement("th", null, t('ct.col_workers')), /*#__PURE__*/React.createElement("th", null, t('ct.col_video')), /*#__PURE__*/React.createElement("th", null, t('ct.col_status')), /*#__PURE__*/React.createElement("th", null))), /*#__PURE__*/React.createElement("tbody", null, cts.map(function (c) {
    return /*#__PURE__*/React.createElement("tr", {
      key: c.id
    }, /*#__PURE__*/React.createElement("td", {
      className: "mn fw6 gn"
    }, c.container_no), /*#__PURE__*/React.createElement("td", null, c.container_type), /*#__PURE__*/React.createElement("td", null, c.warehouse_code), /*#__PURE__*/React.createElement("td", null, c.work_date), /*#__PURE__*/React.createElement("td", {
      className: "mn"
    }, c.start_time), /*#__PURE__*/React.createElement("td", {
      className: "mn"
    }, c.end_time || '—'), /*#__PURE__*/React.createElement("td", {
      className: "mn"
    }, c.duration_hours ? c.duration_hours + 'h' : '—'), /*#__PURE__*/React.createElement("td", null, c.worker_count), /*#__PURE__*/React.createElement("td", null, c.video_recorded ? /*#__PURE__*/React.createElement("span", {
      className: "gn"
    }, "\u2713") : /*#__PURE__*/React.createElement("span", {
      className: "rd"
    }, "\u2717")), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Bg, {
      t: c.status
    })), /*#__PURE__*/React.createElement("td", null, c.status === '进行中' && /*#__PURE__*/React.createElement("button", {
      className: "b bgn",
      style: {
        fontSize: 9
      },
      onClick: function onClick() {
        return complete(c.id);
      }
    }, t('ct.complete'))));
  }))))), addM && /*#__PURE__*/React.createElement(Modal, {
    title: t('ct.add_title'),
    onClose: function onClose() {
      return setAddM(false);
    },
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "b bgh",
      onClick: function onClick() {
        return setAddM(false);
      }
    }, t('c.cancel')), /*#__PURE__*/React.createElement("button", {
      className: "b bga",
      onClick: addCt
    }, t('c.submit')))
  }, /*#__PURE__*/React.createElement("div", {
    className: "alert alert-og"
  }, "\u26A0 \u5F00\u67DC\u524D\u5FC5\u987B\u5F55\u5236\u89C6\u9891\uFF08HGB \xA7438\uFF09\uFF0C\u8BB0\u5F55\u94C5\u5C01\u53F7\u3001\u8D27\u7269\u521D\u59CB\u72B6\u6001\uFF08\u4E00\u955C\u5230\u5E95\uFF0C\u7981\u6B62\u4E2D\u65AD\uFF09"), /*#__PURE__*/React.createElement("div", {
    className: "fr"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('ct.f_no')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    value: form.container_no,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        container_no: e.target.value
      }));
    },
    placeholder: "TCKU1234567"
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('ct.f_type')), /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: form.container_type,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        container_type: e.target.value
      }));
    }
  }, TYPES.map(function (tp) {
    return /*#__PURE__*/React.createElement("option", {
      key: tp
    }, tp);
  }))), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('ct.f_date')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    type: "date",
    value: form.work_date,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        work_date: e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('ct.f_seal')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    value: form.seal_no,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        seal_no: e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('ct.f_start')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    type: "time",
    value: form.start_time,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        start_time: e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('ct.f_revenue')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    type: "number",
    value: form.client_revenue,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        client_revenue: +e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg ful"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('ct.f_workers')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 4
    }
  }, emps.map(function (e) {
    var sel = form.worker_ids.includes(e.id);
    return /*#__PURE__*/React.createElement("button", {
      key: e.id,
      onClick: function onClick() {
        return setForm(function (f) {
          return _objectSpread(_objectSpread({}, f), {}, {
            worker_ids: sel ? f.worker_ids.filter(function (x) {
              return x !== e.id;
            }) : [].concat(_toConsumableArray(f.worker_ids), [e.id])
          });
        });
      },
      style: {
        padding: '4px 8px',
        borderRadius: 6,
        border: "1px solid ".concat(sel ? 'var(--ac)' : 'var(--bd)'),
        background: sel ? '#4f6ef722' : 'transparent',
        color: sel ? 'var(--ac2)' : 'var(--tx3)',
        fontSize: 10,
        cursor: 'pointer'
      }
    }, e.name);
  }))), /*#__PURE__*/React.createElement("div", {
    className: "fg ful"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('ct.f_notes')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    value: form.notes,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        notes: e.target.value
      }));
    }
  })))), completeModal && /*#__PURE__*/React.createElement(Modal, {
    title: t('ct.complete_title'),
    onClose: function onClose() {
      return setCompleteModal(null);
    },
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "b bgh",
      onClick: function onClick() {
        return setCompleteModal(null);
      }
    }, t('c.cancel')), /*#__PURE__*/React.createElement("button", {
      className: "b bgn",
      onClick: confirmComplete
    }, t('ct.complete_btn')))
  }, /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('ct.complete_end')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    type: "time",
    value: completeEndTime,
    onChange: function onChange(e) {
      return setCompleteEndTime(e.target.value);
    },
    autoFocus: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "alert alert-ac",
    style: {
      marginTop: 10,
      fontSize: 10
    }
  }, t('ct.complete_hint'))));
}

// ── SETTLEMENT ──
function Settlement(_ref47) {
  var token = _ref47.token;
  var _useState97 = useState(null),
    _useState98 = _slicedToArray(_useState97, 2),
    data = _useState98[0],
    setData = _useState98[1];
  var _useState99 = useState(true),
    _useState100 = _slicedToArray(_useState99, 2),
    loading = _useState100[0],
    setLoading = _useState100[1];
  var _useState101 = useState(new Date().toISOString().slice(0, 7)),
    _useState102 = _slicedToArray(_useState101, 2),
    month = _useState102[0],
    setMonth = _useState102[1];
  var _useLang0 = useLang(),
    t = _useLang0.t;
  var load = function load() {
    setLoading(true);
    api("/api/settlement/monthly?month=".concat(month), {
      token: token
    }).then(setData).finally(function () {
      return setLoading(false);
    });
  };
  useEffect(function () {
    load();
  }, [month]);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ab"
  }, /*#__PURE__*/React.createElement("input", {
    type: "month",
    className: "fs",
    value: month,
    onChange: function onChange(e) {
      return setMonth(e.target.value);
    }
  })), data && /*#__PURE__*/React.createElement("div", {
    className: "sr"
  }, [[t('settle.emp_count'), data.summary.employee_count, 'var(--cy)'], ["".concat(t('settle.hours'), " ").concat(data.summary.total_hours, "h"), '', 'var(--pp)'], [t('settle.brutto'), '€' + fmtE(data.summary.total_gross), 'var(--og)'], [t('settle.net'), '€' + fmtE(data.summary.total_net), 'var(--gn)']].map(function (_ref48, i) {
    var _ref49 = _slicedToArray(_ref48, 3),
      l = _ref49[0],
      v = _ref49[1],
      c = _ref49[2];
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "sc"
    }, /*#__PURE__*/React.createElement("div", {
      className: "sl"
    }, l), /*#__PURE__*/React.createElement("div", {
      className: "sv",
      style: {
        color: c
      }
    }, v || data.summary.employee_count));
  })), loading ? /*#__PURE__*/React.createElement(Loading, null) : data && /*#__PURE__*/React.createElement("div", {
    className: "tw"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, t('settle.col_emp')), /*#__PURE__*/React.createElement("th", null, t('settle.col_wh')), /*#__PURE__*/React.createElement("th", null, t('settle.col_biz')), /*#__PURE__*/React.createElement("th", null, t('settle.col_src')), /*#__PURE__*/React.createElement("th", null, t('settle.col_hrs')), /*#__PURE__*/React.createElement("th", null, "Brutto"), /*#__PURE__*/React.createElement("th", null, "SSI"), /*#__PURE__*/React.createElement("th", null, "Tax"), /*#__PURE__*/React.createElement("th", null, "Net"), /*#__PURE__*/React.createElement("th", null, t('settle.col_count')))), /*#__PURE__*/React.createElement("tbody", null, data.rows.map(function (r, i) {
    return /*#__PURE__*/React.createElement("tr", {
      key: i
    }, /*#__PURE__*/React.createElement("td", {
      className: "fw6"
    }, r.employee_name), /*#__PURE__*/React.createElement("td", null, r.warehouse_code), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Bg, {
      t: r.biz_line
    })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Bg, {
      t: r.source
    })), /*#__PURE__*/React.createElement("td", {
      className: "mn"
    }, r.total_hours, "h"), /*#__PURE__*/React.createElement("td", {
      className: "mn"
    }, "\u20AC", fmtE(r.gross_total)), /*#__PURE__*/React.createElement("td", {
      className: "mn tm"
    }, "\u20AC", fmtE(r.ssi_total)), /*#__PURE__*/React.createElement("td", {
      className: "mn tm"
    }, "\u20AC", fmtE(r.tax_total)), /*#__PURE__*/React.createElement("td", {
      className: "mn gn fw6"
    }, "\u20AC", fmtE(r.net_total)), /*#__PURE__*/React.createElement("td", {
      className: "tm"
    }, r.record_count));
  })))));
}

// ── CLOCK ──
function Clock(_ref50) {
  var token = _ref50.token,
    user = _ref50.user;
  var _useState103 = useState(new Date()),
    _useState104 = _slicedToArray(_useState103, 2),
    now = _useState104[0],
    setNow = _useState104[1];
  var _useState105 = useState([]),
    _useState106 = _slicedToArray(_useState105, 2),
    logs = _useState106[0],
    setLogs = _useState106[1];
  var _useLang1 = useLang(),
    t = _useLang1.t;
  useEffect(function () {
    var i = setInterval(function () {
      return setNow(new Date());
    }, 1000);
    return function () {
      return clearInterval(i);
    };
  }, []);
  useEffect(function () {
    api('/api/clock/today', {
      token: token
    }).then(setLogs).catch(function () {});
  }, []);
  var last = logs[logs.length - 1];
  var isIn = (last === null || last === void 0 ? void 0 : last.clock_type) === 'in';
  var punch = /*#__PURE__*/function () {
    var _ref51 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee13(tp) {
      var r;
      return _regenerator().w(function (_context13) {
        while (1) switch (_context13.n) {
          case 0:
            _context13.n = 1;
            return api('/api/clock', {
              method: 'POST',
              body: {
                clock_type: tp
              },
              token: token
            });
          case 1:
            _context13.n = 2;
            return api('/api/clock/today', {
              token: token
            });
          case 2:
            r = _context13.v;
            setLogs(r);
          case 3:
            return _context13.a(2);
        }
      }, _callee13);
    }));
    return function punch(_x5) {
      return _ref51.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 64,
      fontWeight: 800,
      color: 'var(--ac2)',
      letterSpacing: -2
    }
  }, now.toTimeString().slice(0, 8)), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--tx3)',
      marginBottom: 24
    }
  }, now.toLocaleDateString('de-DE'), " \xB7 ", user.display_name), /*#__PURE__*/React.createElement("div", {
    onClick: function onClick() {
      return punch(isIn ? 'out' : 'in');
    },
    style: {
      width: 160,
      height: 160,
      borderRadius: '50%',
      border: "4px solid ".concat(isIn ? 'var(--rd)' : 'var(--gn)'),
      background: isIn ? '#f0526c10' : '#2dd4a010',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all .3s',
      userSelect: 'none'
    },
    onMouseEnter: function onMouseEnter(e) {
      e.currentTarget.style.transform = 'scale(1.05)';
    },
    onMouseLeave: function onMouseLeave(e) {
      e.currentTarget.style.transform = 'scale(1)';
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 36,
      marginBottom: 4
    }
  }, isIn ? '👋' : '👆'), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700
    }
  }, isIn ? t('clock.clock_out') : t('clock.clock_in'))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      fontSize: 12,
      color: isIn ? 'var(--gn)' : 'var(--og)'
    }
  }, isIn ? "".concat(t('clock.clocked_in'), " ").concat(last.clock_time) : t('clock.not_clocked')), logs.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      width: '100%',
      maxWidth: 400
    }
  }, logs.map(function (l, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        gap: 12,
        padding: '10px 14px',
        background: 'var(--bg2)',
        border: '1px solid var(--bd)',
        borderRadius: 10,
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 20
      }
    }, l.clock_type === 'in' ? '🟢' : '🔴'), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 600,
        fontSize: 12
      }
    }, l.clock_type === 'in' ? t('clock.clock_in') : t('clock.clock_out')), /*#__PURE__*/React.createElement("div", {
      className: "tm",
      style: {
        fontSize: 10
      }
    }, l.clock_time)));
  })));
}

// ── AUDIT LOGS ──
function AuditLogs(_ref52) {
  var token = _ref52.token;
  var _useState107 = useState([]),
    _useState108 = _slicedToArray(_useState107, 2),
    logs = _useState108[0],
    setLogs = _useState108[1];
  var _useState109 = useState(true),
    _useState110 = _slicedToArray(_useState109, 2),
    loading = _useState110[0],
    setLoading = _useState110[1];
  var _useLang10 = useLang(),
    t = _useLang10.t;
  useEffect(function () {
    api('/api/logs', {
      token: token
    }).then(setLogs).finally(function () {
      return setLoading(false);
    });
  }, []);
  return /*#__PURE__*/React.createElement("div", null, loading ? /*#__PURE__*/React.createElement(Loading, null) : /*#__PURE__*/React.createElement("div", {
    className: "tw"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ts"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, t('log.col_time')), /*#__PURE__*/React.createElement("th", null, t('log.col_user')), /*#__PURE__*/React.createElement("th", null, t('log.col_action')), /*#__PURE__*/React.createElement("th", null, t('log.col_table')), /*#__PURE__*/React.createElement("th", null, t('log.col_id')), /*#__PURE__*/React.createElement("th", null, t('log.col_detail')))), /*#__PURE__*/React.createElement("tbody", null, logs.map(function (l, i) {
    var _l$created_at;
    return /*#__PURE__*/React.createElement("tr", {
      key: i
    }, /*#__PURE__*/React.createElement("td", {
      className: "mn tm"
    }, (_l$created_at = l.created_at) === null || _l$created_at === void 0 ? void 0 : _l$created_at.slice(5, 19)), /*#__PURE__*/React.createElement("td", {
      className: "fw6"
    }, l.user_display), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--ac2)'
      }
    }, l.action)), /*#__PURE__*/React.createElement("td", {
      className: "tm"
    }, l.target_table), /*#__PURE__*/React.createElement("td", {
      className: "mn"
    }, l.target_id), /*#__PURE__*/React.createElement("td", null, l.detail));
  }))))));
}

// ══════════════════════════════════════════════════════════════════════
// 企业文档知识库 — 完整内容数据
// ══════════════════════════════════════════════════════════════════════

var DOCS_DB = {
  // ─── P级职责 ────────────────────────────────────────────────────────
  "p1-duties": {
    id: "p1-duties",
    cat: "职级职责",
    tag: "P1",
    title: "P1 操作员 — 岗位职责与行为准则",
    icon: "👷",
    audience: "P1",
    lang: "zh",
    content: "\n<h3>\u4E00\u3001\u5C97\u4F4D\u5B9A\u4F4D</h3>\n<p>\u804C\u7EA7\uFF1A<strong>P1 \u64CD\u4F5C\u5458\uFF08Operator\uFF09</strong><br/>\u6C47\u62A5\u5BF9\u8C61\uFF1AP3/P4 \u7EC4\u957F / \u73ED\u7EC4\u957F<br/>\u5B9A\u4F4D\uFF1A\"\u6267\u884C\u4E4B\u672C\"\uFF0C\u4ED3\u5E93\u8FD0\u8425\u6700\u57FA\u7840\u3001\u6700\u91CD\u8981\u7684\u529B\u91CF\u3002</p>\n<h3>\u4E8C\u3001\u6838\u5FC3\u804C\u8D23</h3>\n<ul>\n<li><strong>\u57FA\u7840\u4ED3\u50A8\u64CD\u4F5C\uFF1A</strong>\u642C\u8FD0\u3001\u5206\u62E3\u3001\u626B\u63CF\u3001\u8D34\u6807\u3001\u7801\u6258\u3001\u7F20\u819C\u3001\u5378\u67DC/\u88C5\u67DC</li>\n<li><strong>\u8BBE\u5907\u4F7F\u7528\uFF1A</strong>\u6B63\u786E\u4F7F\u7528\u626B\u63CF\u67AA\u3001\u624B\u63A8\u8F66\u3001\u53C9\u8F66\uFF08\u6301\u8BC1\u8005\uFF09</li>\n<li><strong>\u8D28\u91CF\u6267\u884C\uFF1A</strong>\u6309\u7EC4\u957F\u6307\u793A\u64CD\u4F5C\uFF0C\u4E0D\u786E\u5B9A\u65F6\u7ACB\u5373\u95EE\uFF0C\u4E0D\u731C\u6D4B</li>\n<li><strong>\u5B89\u5168\u6267\u884C\uFF1A</strong>\u5168\u7A0B\u7A7F\u6234PPE\uFF08\u5B89\u5168\u978B+\u80CC\u5FC3\uFF09\uFF0C\u9075\u5B88\u533A\u57DF\u9650\u901F\u548C\u53C9\u8F66\u5B89\u5168\u89C4\u5219</li>\n<li><strong>\u5DE5\u65F6\u8BB0\u5F55\uFF1A</strong>\u51C6\u65F6\u5230\u5C97\uFF0C\u6BCF\u65E5\u7B7E\u7F72\u5DE5\u65F6\u786E\u8BA4\u5355\uFF08Arbeitszeitnachweis\uFF09</li>\n</ul>\n<h3>\u4E09\u3001\u6BCF\u65E5\u5DE5\u4F5C\u6D41\u7A0B</h3>\n<table>\n<tr><th>\u65F6\u95F4</th><th>\u52A8\u4F5C</th></tr>\n<tr><td>\u5230\u5C97\u524D5\u5206\u949F</td><td>\u6362\u5DE5\u88C5\u3001\u7A7F\u5B89\u5168\u978B\u3001\u6234\u80CC\u5FC3\uFF0C\u5230\u6307\u5B9A\u5DE5\u4F4D\u96C6\u5408</td></tr>\n<tr><td>\u73ED\u524D\u4F1A\uFF085min\uFF09</td><td>\u542C\u73ED\u7EC4\u957F\u4EFB\u52A1\u8BF4\u660E\uFF0C\u6709\u4E0D\u660E\u767D\u7ACB\u5373\u4E3E\u624B\u63D0\u95EE</td></tr>\n<tr><td>\u4F5C\u4E1A\u4E2D</td><td>\u6309\u6307\u793A\u64CD\u4F5C\uFF1B\u6BCF15-20\u4EF6\u6838\u67E5\u4E00\u6B21\u76EE\u7684\u5730\u662F\u5426\u6B63\u786E\uFF1B\u53D1\u73B0\u95EE\u9898\u53EB\u505C\u62A5\u544A</td></tr>\n<tr><td>\u4F11\u606F\u65F6\u95F4</td><td>\u5B8C\u5168\u79BB\u5F00\u4F5C\u4E1A\u533A\uFF0C\u4E0D\u5728\u8D27\u67B6/\u53C9\u8F66\u9053\u4F11\u606F</td></tr>\n<tr><td>\u4E0B\u73ED\u524D</td><td>\u6E05\u7406\u5DE5\u4F4D\uFF1B\u4EA4\u8FD8\u5DE5\u5177\u8BBE\u5907\uFF1B\u7B7E\u5DE5\u65F6\u786E\u8BA4\u5355</td></tr>\n</table>\n<h3>\u56DB\u3001P1 \u7EDD\u5BF9\u7EA2\u7EBF</h3>\n<div class=\"alert-block danger\">\n<strong>\u4EE5\u4E0B\u884C\u4E3A\u5BFC\u81F4\u7ACB\u5373Abmahnung\uFF0C\u518D\u72AF\u89E3\u804C\uFF1A</strong><br/>\n\u274C \u4E0D\u7A7F\u5B89\u5168\u978B / \u4E0D\u6234\u80CC\u5FC3\u8FDB\u5165\u4F5C\u4E1A\u533A<br/>\n\u274C \u7AD9\u5728\u53C9\u8F66\u5DE5\u4F5C\u534A\u5F843\u7C73\u5185<br/>\n\u274C \u4EE3\u4ED6\u4EBA\u7B7E\u7F72\u5DE5\u65F6\u786E\u8BA4\u5355\uFF08Unterschriftenf\xE4lschung = \u5211\u4E8B\u6B3A\u8BC8\uFF09<br/>\n\u274C \u65E0\u6545\u4E0D\u5230\u5C97\u4E14\u4E0D\u901A\u77E5\uFF08\u65F7\u5DE5\uFF09<br/>\n\u274C \u64C5\u81EA\u64CD\u4F5C\u672A\u7ECF\u57F9\u8BAD\u7684\u8BBE\u5907\n</div>\n<h3>\u4E94\u3001P1 \u2192 P2 \u664B\u5347\u8981\u6C42</h3>\n<ul>\n<li>\u5728\u81F3\u5C112\u4E2A\u4E0D\u540C\u5DE5\u4F4D\u72EC\u7ACB\u4E0A\u5C97\uFF0C\u9519\u8BEF\u7387 \u22643%</li>\n<li>\u51FA\u52E4\u7387 \u226597%\uFF0C\u65E0\u65E0\u6545\u65F7\u5DE5\u8BB0\u5F55</li>\n<li>WMS/\u626B\u63CF\u7CFB\u7EDF\u64CD\u4F5C\u6B63\u786E\u7387 \u226598%</li>\n<li>\u8FDE\u7EED3\u4E2A\u6708\u65E0\u5B89\u5168\u8FDD\u89C4</li>\n</ul>"
  },
  "p2-p3-duties": {
    id: "p2-p3-duties",
    cat: "职级职责",
    tag: "P2/P3",
    title: "P2 资深操作员 / P3 技能工 — 岗位职责",
    icon: "⚙️",
    audience: "P2,P3",
    lang: "zh",
    content: "\n<h3>P2 \u8D44\u6DF1\u64CD\u4F5C\u5458</h3>\n<p>\u6C47\u62A5\u5BF9\u8C61\uFF1AP4 \u73ED\u7EC4\u957F &nbsp;|&nbsp; \u53EF\u5E26\uFF1A\u65B0\u5165\u804CP1\u5458\u5DE5</p>\n<ul>\n<li>\u719F\u7EC3\u64CD\u4F5C\u672C\u4ED3\u5E93\u81F3\u5C112\u4E2A\u5DE5\u4F4D\uFF0C\u53EF\u72EC\u7ACB\u5B8C\u6210\u5168\u6D41\u7A0B</li>\n<li>\u5BF9\u65B0P1\u5458\u5DE5\u8FDB\u884C1\u5BF91\u793A\u8303\u548C\u73B0\u573A\u7EA0\u9519\uFF08Einarbeitung\uFF09</li>\n<li>\u4EA7\u91CF\u7A33\u5B9A\u8FBE\u56E2\u961F\u5E73\u5747\u6C34\u5E7390%\u4EE5\u4E0A</li>\n<li>5S\u6267\u884C\u6807\u6746\uFF1A\u4E2A\u4EBA\u5DE5\u4F4D\u957F\u671F\u6574\u6D01\u3001\u65E0\u5B89\u5168\u9690\u60A3</li>\n<li>\u6392\u73ED\u670D\u4ECE\u5EA6\u9AD8\uFF0C\u53EF\u914D\u5408\u4E34\u65F6\u52A0\u73ED\u548C\u8C03\u73ED</li>\n</ul>\n<h3>P3 \u6280\u80FD\u5DE5\uFF08\u53C9\u8F66/\u8BBE\u5907/\u5173\u952E\u5DE5\u5E8F\uFF09</h3>\n<p>\u524D\u63D0\u6761\u4EF6\uFF1A\u6301\u6709\u6548\u53C9\u8F66\u8BC1\uFF08Gabelstaplerschein\uFF09\u6216\u8BBE\u5907\u64CD\u4F5C\u8D44\u683C\u8BC1\uFF0C\u5E76\u901A\u8FC7\u516C\u53F8\u5185\u90E8\u5B9E\u64CD\u8BA4\u8BC1\u3002</p>\n<ul>\n<li>\u72EC\u7ACB\u627F\u62C5\u9AD8\u98CE\u9669\u6216\u5173\u952E\u8282\u70B9\u5DE5\u5E8F\uFF08\u53C9\u8F66\u4F5C\u4E1A\u3001\u9AD8\u8D27\u4F4D\u5B58\u53D6\u3001\u91CD\u578B\u8D27\u7269\uFF09</li>\n<li>\u8BBE\u5907\u65E5\u5E38\u70B9\u68C0\uFF1A\u6BCF\u65E5\u5F00\u59CB\u524D\u6267\u884C\u53C9\u8F665\u70B9\u68C0\u67E5\uFF08\u6CB9\u6DB2\u3001\u8F6E\u80CE\u3001\u53C9\u81C2\u3001\u62A5\u8B66\u3001\u5B89\u5168\u5E26\uFF09</li>\n<li>\u5E74\u5EA6\u91CD\u5927\u64CD\u4F5C\u5931\u8BEF\u4E3A0\uFF1B\u6700\u8FD112\u4E2A\u6708\u5185\u65E0\u8BBE\u5907/\u8F66\u8F86\u5B89\u5168\u4E8B\u6545</li>\n<li>\u7EFC\u5408\u6548\u7387 \u2265 \u56E2\u961F\u5E73\u5747\u6C34\u5E73100%\uFF0C\u8D28\u91CF\u8FBE\u6807\u7387 \u226598%</li>\n<li>\u53EF\u627F\u62C5\u7B80\u5355\u5E26\u6559\u4EFB\u52A1</li>\n</ul>\n<h3>\u53C9\u8F66\u4F5C\u4E1A\u5B89\u5168\u5F3A\u5236\u89C4\u5B9A\uFF08P3\u9002\u7528\uFF09</h3>\n<table>\n<tr><th>\u68C0\u67E5\u9879\u76EE</th><th>\u6807\u51C6</th></tr>\n<tr><td>\u64CD\u4F5C\u524D</td><td>\u68C0\u67E5\u573A\u5730\u3001\u6E05\u573A\u901A\u9053\u3001\u786E\u8BA4\u65E0\u884C\u4EBA</td></tr>\n<tr><td>\u901F\u5EA6</td><td>\u5BA4\u5185 \u22646km/h\uFF1B\u659C\u5761 \u22643km/h\uFF1B\u8F6C\u5F2F\u51CF\u901F\u81F3\u6B65\u884C\u901F\u5EA6</td></tr>\n<tr><td>\u8D27\u7269\u56FA\u5B9A</td><td>\u8D77\u5347\u524D\u786E\u8BA4\u8D27\u7269\u7A33\u56FA\uFF0C\u8D85\u9AD8\u8D27\u7269\u7528\u7ED1\u5E26</td></tr>\n<tr><td>\u5012\u8F66</td><td>\u5FC5\u987B\u9E23\u7B1B\uFF1B\u6709\u4EBA\u5458\u65F6\u505C\u8F66\u7B49\u5F85</td></tr>\n<tr><td>\u4E0B\u8F66</td><td>\u53C9\u81C2\u843D\u5730\u3001\u7184\u706B\u3001\u4E0A\u624B\u5239\uFF0C\u65B9\u53EF\u79BB\u5F00</td></tr>\n</table>"
  },
  "p4-duties": {
    id: "p4-duties",
    cat: "职级职责",
    tag: "P4",
    title: "P4 班组长（Team Leader）— 岗位职责与SOP",
    icon: "👑",
    audience: "P4",
    lang: "zh",
    content: "\n<h3>\u4E00\u3001\u5B9A\u4F4D\uFF1A\"\u4E00\u7EBF\u6267\u884C\u5B98\"</h3>\n<p>\u76F4\u63A5\u7BA1\u74065-10\u540D\u64CD\u4F5C\u5458\uFF0C\u8D1F\u8D23\u5177\u4F53\u5DE5\u4F4D\u7684\u64CD\u4F5C\u6267\u884C\uFF0C\u65E2\u8981\u5E26\u5934\u5E72\u6D3B\uFF0C\u53C8\u8981\u7BA1\u7406\u4EBA\u3002</p>\n<h3>\u4E8C\u3001\u6838\u5FC3\u804C\u8D23</h3>\n<ul>\n<li><strong>\u5DE5\u4F4D\u6267\u884C\u7B2C\u4E00\u8D1F\u8D23\u4EBA\uFF1A</strong>\u786E\u4FDD\u672C\u5DE5\u4F4D\u4EFB\u52A1\u6309\u65F6\u3001\u9AD8\u8D28\u91CF\u5B8C\u6210</li>\n<li><strong>\u64CD\u4F5C\u5458\u76F4\u63A5\u7BA1\u7406\uFF1A</strong>\u8003\u52E4\u3001\u7EAA\u5F8B\u3001\u57F9\u8BAD\u7B2C\u4E00\u8D1F\u8D23\u4EBA</li>\n<li><strong>\u6267\u884CP5/P6\u6307\u4EE4\uFF1A</strong>\u65E0\u6761\u4EF6\u6267\u884C\u4E0A\u7EA7\u5DE5\u4F5C\u5B89\u6392\uFF0C\u786E\u4FDD100%\u843D\u5B9E</li>\n</ul>\n<h3>\u4E09\u3001\u6BCF\u65E5\u5DE5\u4F5C\u6D41\u7A0B SOP</h3>\n<h4>06:30 \u73ED\u524D\u68C0\u67E5\uFF085\u5206\u949F\uFF09</h4>\n<div class=\"checklist\">\n\u25A1 \u70B9\u540D\uFF1A\u5168\u5458\u5230\u9F50\uFF1F\u7F3A\u5458\u7ACB\u5373\u62A5\u544AP5<br/>\n\u25A1 \u5DE5\u5177\u68C0\u67E5\uFF1A\u53C9\u8F66\u3001\u626B\u63CF\u67AA\u3001\u6807\u7B7E\u673A\u6B63\u5E38<br/>\n\u25A1 \u5DE5\u4F4D\u68C0\u67E5\uFF1A\u6E05\u6D01\u3001\u5B89\u5168\u3001\u7269\u6599\u9F50\u5907<br/>\n\u25A1 \u5B89\u5168\u88C5\u5907\uFF1A\u5168\u5458\u7A7F\u5B89\u5168\u978B\u3001\u6234\u80CC\u5FC3<br/>\n\u25A1 \u4EFB\u52A1\u786E\u8BA4\uFF1A\u672C\u7EC4\u4ECA\u65E5\u4EFB\u52A1\u660E\u786E\n</div>\n<h4>\u6BCF\u5C0F\u65F6\u5DE1\u67E55\u70B9</h4>\n<div class=\"checklist\">\n\u25A1 \u8FDB\u5EA6\uFF1A\u662F\u5426\u6309\u8BA1\u5212\u63A8\u8FDB<br/>\n\u25A1 \u8D28\u91CF\uFF1A\u64CD\u4F5C\u662F\u5426\u89C4\u8303\uFF08\u62BD\u68C0\u6BD4\u4F8B\uFF1A\u62E3\u8D2710%\uFF0C\u88C5\u8F6620%\uFF0C\u5378\u67DC100%\uFF09<br/>\n\u25A1 \u5B89\u5168\uFF1A\u9632\u62A4\u5230\u4F4D\u3001\u65E0\u9690\u60A3<br/>\n\u25A1 \u5458\u5DE5\uFF1A\u7CBE\u795E\u72B6\u6001\u6B63\u5E38\u3001\u65E0\u75B2\u52B3\u8FF9\u8C61<br/>\n\u25A1 \u8BBE\u5907\uFF1A\u6B63\u5E38\u8FD0\u884C\u3001\u65E0\u6545\u969C\n</div>\n<h4>16:30 \u65E5\u62A5\u6C47\u62A5</h4>\n<p>\u53E3\u5934\u6216\u4E66\u9762\u6C47\u62A5P5\uFF1A\u51FA\u52E4 / \u4EA7\u91CF / \u9519\u8BEF / \u5B89\u5168 / \u8BBE\u5907 / \u660E\u65E5\u8BA1\u5212</p>\n<h3>\u56DB\u3001\u6743\u529B\u8FB9\u754C</h3>\n<table>\n<tr><th>\u2705 \u53EF\u4EE5\u72EC\u7ACB\u51B3\u5B9A</th><th>\u274C \u5FC5\u987B\u8BF7\u793A</th></tr>\n<tr><td>\u5DE5\u4F4D\u5185\u4EBA\u5458\u4E34\u65F6\u8C03\u914D</td><td>\u52A0\u73ED\u5B89\u6392</td></tr>\n<tr><td>\u64CD\u4F5C\u987A\u5E8F\u8C03\u6574</td><td>\u5BA2\u6237\u76F4\u63A5\u63A5\u89E6</td></tr>\n<tr><td>\u53E3\u5934\u8868\u626C/\u63D0\u9192\u64CD\u4F5C\u5458</td><td>\u4EFB\u4F55\u5904\u7F5A</td></tr>\n<tr><td>\u73B0\u573A\u8D28\u91CF\u7EA0\u6B63</td><td>\u8DE8\u5DE5\u4F4D\u534F\u8C03</td></tr>\n<tr><td>\u5B89\u5168\u9690\u60A3\u6392\u9664</td><td>\u4EFB\u4F55\u652F\u51FA</td></tr>\n</table>\n<h3>\u4E94\u3001\u5458\u5DE5\u95EE\u9898\u5904\u7406\u6B65\u9AA4</h3>\n<table>\n<tr><th>\u60C5\u51B5</th><th>\u5904\u7406\u6D41\u7A0B</th></tr>\n<tr><td>\u5DE5\u4F5C\u6162/\u61D2\u6563</td><td>\u2460\u79C1\u4E0B\u63D0\u9192\u660E\u786E\u8981\u6C42 \u2192 \u2461\u7B2C\u4E8C\u6B21\u5F53\u4F17\u6307\u51FA \u2192 \u2462\u7B2C\u4E09\u6B21\u62A5\u544AP5</td></tr>\n<tr><td>\u8FDF\u5230</td><td>\u8BB0\u5F55\u65F6\u95F4\uFF0C\u7ACB\u5373\u62A5\u544AP5\uFF0C\u4E66\u9762\u5B58\u6863</td></tr>\n<tr><td>\u4E0D\u6234\u5B89\u5168\u88C5\u5907</td><td>\u7ACB\u5373\u53EB\u505C\uFF0C\u7EA0\u6B63\u540E\u65B9\u53EF\u7EE7\u7EED\uFF1B\u5C61\u72AF\u62A5\u544AP5</td></tr>\n<tr><td>\u6253\u67B6/\u51B2\u7A81</td><td>\u7ACB\u5373\u9694\u79BB\u53CC\u65B9\uFF0C\u7ACB\u5373\u62A5\u544AP5/P6\uFF0C\u4E0D\u5F97\u81EA\u884C\u5904\u7F6E</td></tr>\n</table>"
  },
  "p5-p6-duties": {
    id: "p5-p6-duties",
    cat: "职级职责",
    tag: "P5/P6",
    title: "P5 高级班组长 / P6 副驻仓经理 — 岗位职责",
    icon: "🎖️",
    audience: "P5,P6",
    lang: "zh",
    content: "\n<h3>P5 \u9AD8\u7EA7\u73ED\u7EC4\u957F\uFF08Senior Team Leader\uFF09</h3>\n<p>\u5B9A\u4F4D\uFF1A\"\u4E00\u7EBF\u9EC4\u91D1\u5C97\u4F4D\" \u2014 \u7BA1\u7406\u5C42\u4E0E\u64CD\u4F5C\u5C42\u7684\u5173\u952E\u6865\u6881\uFF0C\u8D1F\u8D238-15\u540D\u64CD\u4F5C\u5458\u3002</p>\n<h4>\u6838\u5FC3\u804C\u8D23</h4>\n<ul>\n<li>\u6BCF\u65E5\u73ED\u7EC4KPI\uFF08\u51FA\u52E4\u3001\u4EA7\u91CF\u3001\u8D28\u91CF\u3001\u5B89\u5168\uFF09\u7B2C\u4E00\u8D23\u4EFB\u4EBA</li>\n<li>\u6839\u636E\u8BA2\u5355\u6CE2\u5CF0\u6CE2\u8C37\u5408\u7406\u8C03\u914D2-3\u7EC4\u4EBA\u529B\uFF0C\u8FBE\u6807\u7387 \u226595%</li>\n<li>\u5728\u7ECF\u7406\u4E0D\u5728\u5C97\u65F6\u53EF\u72EC\u7ACB\u8D1F\u8D23\u6240\u5728\u73ED\u6B21\u6574\u4F53\u8FD0\u8425</li>\n<li>\u63A5\u73ED/\u4EA4\u73ED\u4FE1\u606F\u5B8C\u6574\u6E05\u6670\uFF0C\u91CD\u5927\u4E8B\u9879\u6709\u4E66\u9762\u8BB0\u5F55\u53EF\u8FFD\u6EAF</li>\n<li>\u6BCF\u5B63\u5EA6\u81F3\u5C11\u5B8C\u62101\u6B21\u5BF9\u4E0B\u5C5E\u7684\u6B63\u5F0F\u9762\u8C08\u8BB0\u5F55</li>\n</ul>\n<h4>\u6BCF\u65E5\u5DE5\u4F5C\u8282\u594F</h4>\n<table>\n<tr><th>\u65F6\u95F4</th><th>\u5185\u5BB9</th></tr>\n<tr><td>06:30</td><td>\u70B9\u540D(3min)\u2192\u4EFB\u52A1\u4F20\u8FBE(5min)\u2192\u4EFB\u52A1\u5206\u914D(5min)\u2192\u5B89\u5168\u63D0\u9192(2min)\u2192\u58EB\u6C14\u52A8\u5458(2min)</td></tr>\n<tr><td>\u6BCF2\u5C0F\u65F6</td><td>\u5DE1\u89C6\u6240\u6709\u73ED\u7EC4\uFF1A\u8FDB\u5EA6/\u8D28\u91CF/\u5B89\u5168/\u4EBA\u5458\u72B6\u6001</td></tr>\n<tr><td>16:30</td><td>\u6C47\u603B\u65E5\u62A5\uFF0C\u5411P6/P7\u62A5\u544A\uFF1B\u586B\u5199\u73ED\u7EC4\u5DE5\u65F6\u8BB0\u5F55\u5E76\u7B7E\u5B57</td></tr>\n</table>\n\n<h3>P6 \u526F\u9A7B\u4ED3\u7ECF\u7406\uFF08Deputy Site Manager\uFF09</h3>\n<p>\u5B9A\u4F4D\uFF1AP7\u9A7B\u4ED3\u7ECF\u7406\u7684\u76F4\u63A5\u526F\u624B\uFF0C\u53EF\u5728\u7ECF\u7406\u7F3A\u5E2D\u65F6\u72EC\u7ACB\u7BA1\u7406\u6574\u4E2A\u4ED3\u5E93\u3002</p>\n<h4>\u6838\u5FC3\u804C\u8D23</h4>\n<ul>\n<li>\u719F\u6089\u5BA2\u6237SLA/KPI\u6307\u6807\uFF0C\u8DDF\u8E2A\u65E5\u3001\u5468\u6570\u636E\u5E76\u63D0\u51FA\u5177\u4F53\u6539\u5584\u884C\u52A8</li>\n<li>\u6392\u73ED\u8349\u6848\u4E0E\u4EBA\u529B\u9700\u6C42\u6D4B\u7B97\uFF0C\u4EBA\u529B\u7F3A\u53E3\u9884\u8B66\u63D0\u524D \u22652\u5468</li>\n<li>\u6BCF\u5E74\u81F3\u5C11\u5B75\u53161\u540D\u5408\u683CP4\u53CA\u4EE5\u4E0A\u4EBA\u624D</li>\n<li>\u8D1F\u8D23\u65E5\u5E38\u5B89\u5168\u5DE1\u68C0\u4E0E\u6574\u6539\u8DDF\u8FDB</li>\n<li>\u5B8C\u6210P7\u4EA4\u529E\u7684\u4E13\u9879\u4EFB\u52A1\uFF08\u6D41\u7A0B\u4F18\u5316\u3001\u6210\u672C\u63A7\u5236\u3001\u5C0F\u9879\u76EE\uFF09\u5E76\u6309\u671F\u4EA4\u4ED8</li>\n</ul>\n<h4>P6 \u7279\u522B\u6743\u9650</h4>\n<ul>\n<li>\u53EF\u4EE3P7\u7B7E\u7F72\u65E5\u5E38\u5DE5\u65F6\u786E\u8BA4\u5355</li>\n<li>\u7D27\u6025\u60C5\u51B5\u4E0B\u53EF\u6388\u6743\u52A0\u73ED\uFF08\u987B\u6B21\u65E5\u8865\u62A5P7\u5BA1\u6279\uFF09</li>\n<li>\u53EF\u76F4\u63A5\u4E0E\u5BA2\u6237\u65B9\u73B0\u573A\u8D1F\u8D23\u4EBA\u6C9F\u901A\u65E5\u5E38\u4E8B\u5B9C</li>\n</ul>"
  },
  "p7-duties": {
    id: "p7-duties",
    cat: "职级职责",
    tag: "P7",
    title: "P7 驻仓经理（Site Manager）— 岗位职责",
    icon: "🏭",
    audience: "P7",
    lang: "zh",
    content: "\n<h3>\u4E00\u3001\u5C97\u4F4D\u5B9A\u4F4D</h3>\n<p>\u804C\u7EA7\uFF1AP7 &nbsp;|&nbsp; \u9A7B\u4ED3\u7ECF\u7406\uFF08Site Manager\uFF09<br/>\n\u6C47\u62A5\u5BF9\u8C61\uFF1AP8 \u533A\u57DF\u7ECF\u7406<br/>\n\u7BA1\u7406\u8303\u56F4\uFF1A\u6307\u5B9A\u4ED3\u5E93\u5168\u90E8\u8FD0\u8425\uFF0810-50\u4EBA\uFF0C\u53D6\u51B3\u4E8E\u9879\u76EE\u89C4\u6A21\uFF09<br/>\n\u5DE5\u4F5C\u5236\uFF1A\u9A7B\u4ED3\u5236\uFF0C\u6BCF\u5468\u57FA\u672C\u5728\u573A\uFF0C\u5468\u672B\u8F6E\u73ED</p>\n\n<h3>\u4E8C\u3001\u516D\u5927\u6838\u5FC3\u804C\u8D23</h3>\n<ul>\n<li><strong>\u65E5\u5E38\u8FD0\u8425\u6307\u6325\uFF1A</strong>\u5236\u5B9A\u6BCF\u65E5\u5DE5\u4F5C\u8BA1\u5212\uFF0C\u76D1\u7763\u73B0\u573A\u8D28\u91CF\u548C\u5B89\u5168\uFF0C\u5904\u7406\u7A81\u53D1\u72B6\u51B5</li>\n<li><strong>\u4EBA\u5458\u7BA1\u7406\u4E0E\u6FC0\u52B1\uFF1A</strong>\u5BF9P1-P6\u8FDB\u884C\u65E5\u5E38\u7BA1\u7406\u8003\u6838\uFF0C\u5904\u7406\u5458\u5DE5\u7EAA\u5F8B\u95EE\u9898</li>\n<li><strong>KPI\u7BA1\u7406\uFF1A</strong>\u6BCF\u65E5\u8FFD\u8E2A\u51FA\u52E4\u7387\u3001\u4EA7\u91CF\u3001\u9519\u8BEF\u7387\u3001\u5B89\u5168\u4E8B\u4EF6\uFF0C\u4E0E\u5BA2\u6237\u6C9F\u901A\u8FDB\u5EA6</li>\n<li><strong>\u5BA2\u6237\u5173\u7CFB\u7EF4\u62A4\uFF1A</strong>\u4F5C\u4E3A\u6E0A\u535A\u65B9\u73B0\u573A\u4EE3\u8868\u4E0E\u5BA2\u6237\u65E5\u5E38\u5BF9\u63A5\uFF0C\u7EF4\u62A4\u957F\u671F\u5408\u4F5C\u5173\u7CFB</li>\n<li><strong>\u6210\u672C\u63A7\u5236\uFF1A</strong>\u76D1\u63A7\u4EBA\u5DE5\u6210\u672C\uFF0C\u4F18\u5316\u4EBA\u5458\u914D\u7F6E\uFF0C\u63D0\u51FA\u6548\u7387\u6539\u5584\u65B9\u6848</li>\n<li><strong>\u5B89\u5168\u7BA1\u7406\uFF1A</strong>\u6BCF\u65E5\u5B89\u5168\u5DE1\u67E5\uFF0C\u786E\u4FDDBGW\u5408\u89C4\uFF0C\u5904\u7406\u5B89\u5168\u4E8B\u6545</li>\n</ul>\n\n<h3>\u4E09\u3001\u6BCF\u65E5\u5DE5\u4F5C\u6807\u51C6\u6D41\u7A0B</h3>\n<table>\n<tr><th>\u65F6\u6BB5</th><th>\u4EFB\u52A1</th><th>\u8F93\u51FA\u7269</th></tr>\n<tr><td>07:00\u524D</td><td>\u67E5\u770B\u6628\u65E5\u6536\u5C3E\u6570\u636E + \u786E\u8BA4\u4ECA\u65E5\u5BA2\u6237\u9700\u6C42</td><td>\u5F53\u65E5\u4EFB\u52A1\u6E05\u5355</td></tr>\n<tr><td>07:00-07:15</td><td>\u65E9\u4F1A\uFF1A\u5411\u73ED\u7EC4\u957F\u4F20\u8FBE\u4EFB\u52A1\u3001\u91CD\u70B9\u3001\u6CE8\u610F\u4E8B\u9879</td><td>\u5168\u5458\u4EFB\u52A1\u660E\u786E</td></tr>\n<tr><td>\u5168\u5929</td><td>\u6BCF2\u5C0F\u65F6\u73B0\u573A\u5DE1\u67E5\uFF1B\u5F02\u5E3830\u5206\u949F\u5185\u4E0A\u62A5P8</td><td>\u5DE1\u67E5\u8BB0\u5F55</td></tr>\n<tr><td>17:00-17:30</td><td>\u65E5\u62A5\uFF1A\u5DE5\u65F6\u786E\u8BA4\u3001\u5F53\u65E5KPI\u3001\u95EE\u9898\u53CA\u5904\u7406</td><td>\u53D1\u7ED9P8\u7684\u65E5\u62A5</td></tr>\n<tr><td>\u6BCF\u5468</td><td>\u5468\u62A5\uFF08KPI+\u6210\u672C+\u4EBA\u5458+\u4E0B\u5468\u8BA1\u5212\uFF09\uFF1B\u4E0EP8\u5468\u4F1A</td><td>\u4E66\u9762\u5468\u62A5</td></tr>\n</table>\n\n<h3>\u56DB\u3001P7 \u8003\u6838\u6807\u51C6\uFF08\u5FC5\u987B\u9879\uFF09</h3>\n<ul>\n<li>\u4ED3\u5E93\u6838\u5FC3KPI\u5168\u5E74\u4FDD\u6301\u76EE\u6807\u503C\u6216\u4EE5\u4E0A</li>\n<li>\u5B89\u5168\u4E8B\u65450\uFF0C\u6216\u4EC5\u8F7B\u5FAE\u4E8B\u4EF6\u4E14\u5168\u90E8\u6709\u5B8C\u6574\u62A5\u544A\u4E0E\u6539\u8FDB\u95ED\u73AF</li>\n<li>\u5458\u5DE5\u6D41\u5931\u7387\u63A7\u5236\u5728\u516C\u53F8\u76EE\u6807\u4EE5\u5185</li>\n<li>\u4ED3\u5E93\u5E74\u5EA6\u5BA1\u8BA1\u65E0\u91CD\u5927\u7F3A\u9677\u9879</li>\n<li>\u6BCF\u5E74\u81F3\u5C11\u63A8\u52A81\u9879\u53EF\u91CF\u5316\u7684\u6548\u7387\u63D0\u5347\u6216\u6210\u672C\u6539\u5584</li>\n</ul>"
  },
  "p8-p9-duties": {
    id: "p8-p9-duties",
    cat: "职级职责",
    tag: "P8/P9",
    title: "P8 区域经理 / P9 运营总监 — 岗位职责",
    icon: "🎯",
    audience: "P8,P9",
    lang: "zh",
    content: "\n<h3>P8 \u533A\u57DF\u7ECF\u7406\uFF08Regional Manager\uFF09</h3>\n<p>\u7BA1\u7406\u8303\u56F4\uFF1A\u4E00\u4E2A\u5927\u533A\uFF083-6\u4E2A\u4ED3\u5E93\uFF09&nbsp;|&nbsp; \u6C47\u62A5\u5BF9\u8C61\uFF1AP9 \u8FD0\u8425\u603B\u76D1</p>\n<h4>\u6838\u5FC3\u804C\u8D23</h4>\n<ul>\n<li>\u7EDF\u9886\u6574\u4E2A\u533A\u57DF\u5185\u6240\u6709\u4ED3\u5E93\uFF0C\u4E0E\u4ED3\u5E93\u65B9\u76F4\u63A5\u4E1A\u52A1\u5BF9\u63A5\u6C9F\u901A</li>\n<li>\u6839\u636E\u4E1A\u52A1\u7C7B\u578B\u5236\u5B9A\u8BA1\u5212\uFF0C\u534F\u8C03\u5404\u4ED3\u4E1A\u52A1\u540C\u6B65\uFF0C\u5236\u5B9A\u5177\u4F53\u65B9\u5411</li>\n<li>\u6240\u8D1F\u8D23\u533A\u57DF\u6240\u6709\u4ED3\u5E93KPI\u6574\u4F53\u65E0\u660E\u663E\u4E0B\u6ED1\uFF0C\u5173\u952E\u6307\u6807\u6CE2\u52A8\u4E0D\u8D85\u8FC7\xB15%</li>\n<li>\u533A\u57DF\u5185\u5BA2\u6237\u6EE1\u610F\u5EA6\u6216NPS\u8F83\u4E0A\u4E00\u5E74\u6574\u4F53\u4E0D\u4E0B\u964D</li>\n<li>\u5E74\u5EA6\u6210\u672C\u9884\u7B97\u63A7\u5236\u5728\u6279\u51C6\u989D\u5EA6\u5185</li>\n<li>\u6709\u8BA1\u5212\u57F9\u517B\u540E\u5907P7/P8\uFF0C\u6BCF\u5E74\u81F3\u5C11\u8F93\u51FA1\u540D\u53EF\u63A5\u73ED\u4EBA\u9009</li>\n</ul>\n<h4>\u4E09\u5927\u533A\u57DF</h4>\n<table>\n<tr><th>\u5927\u533A</th><th>\u4ED3\u5E93</th></tr>\n<tr><td>\u5357\u90E8\u5927\u533A</td><td>K\xF6ln (KLN), D\xFCsseldorf (DUS), Wuppertal (WPT), M\xF6nchengladbach (MGL)</td></tr>\n<tr><td>\u9C81\u5C14\u897F\u5927\u533A</td><td>Duisburg (DBG), Bochum (BOC), Essen (ESN)</td></tr>\n<tr><td>\u9C81\u5C14\u4E1C\u5927\u533A</td><td>Dortmund, Unna (UNA), Bergkamen (BGK)</td></tr>\n</table>\n\n<h3>P9 \u8FD0\u8425\u603B\u76D1\uFF08Operations Director\uFF09</h3>\n<p>\u7EDF\u7B79\u4E09\u5927\u533A\u57DF\uFF0C\u76F4\u63A5\u5BF9\u63A5\u8D22\u52A1\u603B\u76D1\u548C\u4EBA\u4E8B\u90E8\u95E8\u3002</p>\n<h4>\u6838\u5FC3\u804C\u8D23</h4>\n<ul>\n<li>\u5236\u5B9A\u516C\u53F8\u6574\u4F53\u53D1\u5C55\u6218\u7565\u548C\u5E74\u5EA6\u8FD0\u8425\u76EE\u6807</li>\n<li>\u8BBE\u8BA1\u6D3E\u9063\u6A21\u5F0F\u3001\u9879\u76EE\u627F\u5305\u6A21\u5F0F\u7684\u4E1A\u52A1\u7EC4\u5408</li>\n<li>\u53C2\u4E0E\u91CD\u70B9\u5BA2\u6237\u5F00\u53D1\u548C\u5408\u540C\u8C08\u5224\uFF08\u5408\u540C>50\u4E07\u6B27\u5143\u987B\u7B7E\u5B57\uFF09</li>\n<li>\u4E0E\u8D22\u52A1\u603B\u76D1\u5236\u5B9A\u6210\u672C\u63A7\u5236\u76EE\u6807\uFF0C\u5BA1\u6838\u533A\u57DF\u6210\u672C\u9884\u7B97</li>\n<li>\u5BA1\u6279\u5927\u533A\u7ECF\u7406\u3001\u5173\u952E\u9A7B\u4ED3\u7ECF\u7406\u7684\u4EFB\u514D</li>\n</ul>\n<h4>P9 KPI\uFF08\u5FC5\u987B\u9879\uFF09</h4>\n<ul>\n<li>\u4E09\u5927\u533A\u57DF\u6574\u4F53\u8425\u6536\u76EE\u6807\u8FBE\u6210\u7387 \u226590%</li>\n<li>\u5E74\u5EA6\u6838\u5FC3KPI\u76F8\u8F83\u4E0A\u4E00\u8D22\u5E74\u6709\u660E\u786E\u63D0\u5347\uFF08\u6BDB\u5229\u7387/\u6548\u7387/\u4EBA\u5747\u4EA7\u51FA\uFF09</li>\n<li>\u91CD\u5927\u5B89\u5168\u3001\u8D28\u91CF\u3001\u5408\u89C4\u4E8B\u4EF6\u5F97\u5230\u6709\u6548\u9632\u63A7\uFF0C\u65E0\u7CFB\u7EDF\u6027\u7BA1\u7406\u5931\u804C</li>\n<li>\u7BA1\u7406\u56E2\u961F\uFF08P8\u53CA\u5173\u952EP7\uFF09\u7A33\u5B9A\u5EA6 \u226580%</li>\n</ul>"
  },
  // ─── 安全须知 ────────────────────────────────────────────────────────
  "safety-ppe": {
    id: "safety-ppe",
    cat: "安全须知",
    tag: "PPE",
    title: "个人防护装备（PPE）强制规定",
    icon: "🦺",
    audience: "全员",
    lang: "zh",
    content: "\n<div class=\"alert-block danger\">\u26A0 PPE\u4E0D\u5230\u4F4D = \u7ACB\u5373\u505C\u5DE5\u3002\u4EFB\u4F55\u4EBA\u5728\u4EFB\u4F55\u65F6\u5019\u8FDB\u5165\u4F5C\u4E1A\u533A\uFF0C\u5FC5\u987B\u7A7F\u6234\u5F3A\u5236PPE\u3002</div>\n\n<h3>\u5F3A\u5236PPE\u6E05\u5355</h3>\n<table>\n<tr><th>\u88C5\u5907</th><th>\u6807\u51C6</th><th>\u9002\u7528\u573A\u666F</th></tr>\n<tr><td><strong>S3\u5B89\u5168\u5DE5\u978B</strong></td><td>\u94A2\u5934+\u9632\u523A\u7A7F\u978B\u5E95+\u9632\u6ED1\uFF0C\u5168\u5929\u7A7F\u6234</td><td>\u6240\u6709\u4ED3\u5E93\u4F5C\u4E1A</td></tr>\n<tr><td><strong>\u9AD8\u53EF\u89C1\u5EA6\u80CC\u5FC3</strong></td><td>EN 471\u6807\u51C6\uFF0C\u6A59\u8272\u6216\u9EC4\u8272\u53CD\u5149\u6761</td><td>\u6240\u6709\u4ED3\u5E93\u4F5C\u4E1A</td></tr>\n<tr><td>\u5B89\u5168\u5E3D</td><td>EN 397\u6807\u51C6</td><td>\u4ED3\u5E93\u65B9\u8981\u6C42\u65F6 / \u8D27\u7269\u5806\u9AD8\u6709\u5760\u843D\u98CE\u9669\u65F6</td></tr>\n<tr><td>\u9632\u5272\u624B\u5957</td><td>EN 388\u6807\u51C6</td><td>\u642C\u8FD0\u950B\u5229\u8FB9\u89D2\u8D27\u7269\u65F6\uFF08\u4E0D\u5F3A\u5236\u4F46\u5EFA\u8BAE\uFF09</td></tr>\n<tr><td>\u4FBF\u643ALED\u706F</td><td>\u9632\u7206\u578B</td><td>\u8FDB\u5165\u96C6\u88C5\u7BB1\u5185\u4F5C\u4E1A\u65F6</td></tr>\n</table>\n\n<h3>\u4F5C\u4E1A\u533A\u57DF\u5B89\u5168\u89C4\u5219</h3>\n<ul>\n<li>\u53C9\u8F66\u5DE5\u4F5C\u534A\u5F84 <strong>3\u7C73</strong>\u4E3A\u5371\u9669\u533A\uFF0C\u6240\u6709\u4EBA\u5458\u7981\u6B62\u8FDB\u5165</li>\n<li>\u53C9\u8F66\u9053\u7981\u6B62\u6B65\u884C\uFF0C\u5FC5\u987B\u8D70\u4EBA\u884C\u901A\u9053</li>\n<li>\u8D27\u67B6\u4E0B\u65B9\u7981\u6B62\u5750\u5367\u4F11\u606F</li>\n<li>\u8FDE\u7EED\u4F5C\u4E1A\u4E0D\u8D85\u8FC74\u5C0F\u65F6\uFF0C\u5FC5\u987B\u5B89\u6392\u4F11\u606F</li>\n<li>\u6E7F\u6ED1\u5730\u9762\u7ACB\u5373\u4E0A\u62A5\uFF0C\u653E\u7F6E\u8B66\u793A\u6807\u5FD7</li>\n<li>\u7D27\u6025\u51FA\u53E3\u548C\u6D88\u9632\u8BBE\u5907\u524D\u4E25\u7981\u5806\u653E\u8D27\u7269</li>\n</ul>\n\n<h3>\u7D27\u6025\u60C5\u51B5\u5904\u7406</h3>\n<table>\n<tr><th>\u60C5\u51B5</th><th>\u7ACB\u5373\u884C\u52A8</th><th>\u62A5\u544A\u5BF9\u8C61</th></tr>\n<tr><td>\u4EBA\u5458\u53D7\u4F24</td><td>\u7ACB\u5373\u505C\u5DE5\uFF0C\u53EB\u6551\u62A4\u8F66(112)\uFF0C\u4E0D\u79FB\u52A8\u4F24\u8005\uFF08\u810A\u690E\u4F24\u9664\u5916\uFF09</td><td>\u73ED\u7EC4\u957F\u2192\u9A7B\u4ED3\u7ECF\u7406</td></tr>\n<tr><td>\u8D27\u7269\u5760\u843D</td><td>STOP\uFF01\u5168\u5458\u540E\u900010\u7C73\uFF0C\u786E\u8BA4\u65E0\u4EBA\u53D7\u4F24</td><td>\u73ED\u7EC4\u957F\u7ACB\u5373</td></tr>\n<tr><td>\u706B\u707E</td><td>\u542F\u52A8\u8B66\u62A5\uFF0C\u6309\u7D27\u6025\u758F\u6563\u8DEF\u7EBF\u64A4\u79BB\uFF0C\u4E0D\u4E58\u7535\u68AF</td><td>\u6D88\u9632(112)\u2192\u73ED\u7EC4\u957F</td></tr>\n<tr><td>\u718F\u84B8\u8D27\u7269</td><td>\u7ACB\u5373\u6E05\u573A10\u7C73\uFF0C\u901A\u98CE30\u5206\u949F\uFF0C\u65E0Freigabe\u4E0D\u5F97\u8FDB\u5165</td><td>\u5B89\u5168\u8D1F\u8D23\u4EBA</td></tr>\n<tr><td>\u53C9\u8F66\u4E8B\u6545</td><td>\u505C\u673A\u3001\u4E0D\u79FB\u52A8\u8F66\u8F86\u3001\u63A7\u5236\u73B0\u573A\u3001\u7B49\u5F85\u68C0\u67E5</td><td>\u9A7B\u4ED3\u7ECF\u7406+\u4ED3\u5E93\u65B9</td></tr>\n</table>"
  },
  "safety-container": {
    id: "safety-container",
    cat: "安全须知",
    tag: "开柜安全",
    title: "集装箱开柜安全操作规程（六步法）",
    icon: "📦",
    audience: "全员",
    lang: "zh",
    content: "\n<div class=\"alert-block danger\">\u26A0 \u7535\u5546\u8D27\u67DC\uFF08FBA/TEMU/\u4EAC\u4E1C\uFF09\u6563\u88C5\u8D27\u7269\u56FA\u5B9A\u8D28\u91CF\u5DEE\u3002\u5F00\u95E8\u77AC\u95F4\u8D27\u7269\u53EF\u80FD\u4EE5\u6781\u5927\u51B2\u51FB\u529B\u5760\u51FA\uFF0C\u53EF\u81F4\u91CD\u4F24\u6216\u6B7B\u4EA1\u3002\u5FC5\u987B\u4E25\u683C\u6267\u884C\u516D\u6B65\u6CD5\u3002</div>\n\n<h3>\u5F00\u67DC\u516D\u6B65\u6CD5\uFF08\u5F3A\u5236\u6267\u884C\uFF09</h3>\n<table>\n<tr><th>\u6B65\u9AA4</th><th>\u64CD\u4F5C</th><th>\u5173\u952E\u8981\u70B9</th></tr>\n<tr><td><strong>\u2460 \u4FE1\u606F\u6838\u67E5</strong></td><td>\u4E86\u89E3\u8D27\u7269\u7C7B\u578B\u3001\u88C5\u8F7D\u65B9\u5F0F\u3001\u6709\u65E0\u718F\u84B8\u6807\u8BC6</td><td>\u4E0D\u786E\u5B9A\u65F6\u6309\u6700\u574F\u60C5\u51B5\u5904\u7406</td></tr>\n<tr><td><strong>\u2461 \u5916\u90E8\u76EE\u89C6</strong></td><td>\u68C0\u67E5\u67DC\u4F53\u9F13\u80C0\u53D8\u5F62\uFF1B\u95E8\u94F0\u94FE/\u9501\u6746\uFF1B\u718F\u84B8\u6807\u8BC6</td><td>\u63A5\u89E6\u67DC\u95E8\u4E4B\u524D\u5FC5\u987B\u5B8C\u6210</td></tr>\n<tr><td><strong>\u2462 \u5B89\u88C5\u7EA6\u675F\u5E26</strong></td><td>\u6A2A\u8DE8\u67DC\u95E8\u5B89\u88C5 Sicherungsgurt\uFF08\u5B89\u5168\u7EA6\u675F\u5E26\uFF09</td><td><strong>\u5FC5\u987B\u5728\u677E\u5F00\u9501\u6746\u4E4B\u524D\u5B89\u88C5</strong></td></tr>\n<tr><td><strong>\u2463 \u4FA7\u9762\u7AD9\u4F4D</strong></td><td>\u5168\u5458\u7AD9\u81F3\u67DC\u95E8\u4FA7\u9762\uFF0C\u95E8\u524D\u65B93\u7C73\u4E3A\u5371\u9669\u533A</td><td>\u786E\u8BA4\u7AD9\u4F4D\u540E\u624D\u80FD\u8FDB\u884C\u4E0B\u6B65\u64CD\u4F5C</td></tr>\n<tr><td><strong>\u2464 \u7F13\u6162\u5F00\u95E8</strong></td><td>\u5148\u5F00\u53F3\u95E8\u81F310cm\u6682\u505C3\u79D2\uFF1B\u5728\u7EA6\u675F\u5E26\u63A7\u5236\u4E0B\u7F13\u6162\u6253\u5F00</td><td>\u5168\u5F00\u540E\u5728\u95E8\u5916\u89C2\u5BDF30\u79D2\uFF0C\u518D\u9760\u8FD1</td></tr>\n<tr><td><strong>\u2465 \u718F\u84B8\u5904\u7406</strong></td><td>\u82E5\u53D1\u73B0\u718F\u84B8\u6807\u8BC6\uFF1A\u5168\u5458\u6E05\u573A10\u7C73 \u2192 \u901A\u98CE30\u5206\u949F \u2192 \u901A\u77E5\u5B89\u5168\u8D1F\u8D23\u4EBA</td><td>\u65E0\u4E66\u9762 Freigabe \u4E0D\u5F97\u8FDB\u5165</td></tr>\n</table>\n\n<h3>\u5F00\u67DC\u89C6\u9891\u8BB0\u5F55\uFF08HGB \xA7438 \u8981\u6C42\uFF09</h3>\n<p>\u6BCF\u6B21\u5F00\u67DC\u5FC5\u987B\u5168\u7A0B\u5F55\u50CF\uFF0C\u4E00\u955C\u5230\u5E95\uFF0C\u4E25\u7981\u4E2D\u65AD\u3002</p>\n<table>\n<tr><th>\u9636\u6BB5</th><th>\u5185\u5BB9</th><th>\u65F6\u957F</th></tr>\n<tr><td>\u94C5\u5C01\u9A8C\u8BC1</td><td>\u62CD\u94C5\u5C01\u53F7\u7801\u7279\u5199 + \u67DC\u53F7</td><td>\u7EA630\u79D2</td></tr>\n<tr><td>\u5F00\u5C01\u8FC7\u7A0B</td><td>\u94C5\u5C01\u5207\u65AD\u5B8C\u6574\u52A8\u4F5C</td><td>\u7EA625\u79D2</td></tr>\n<tr><td>\u8D27\u7269\u521D\u59CB\u72B6\u6001</td><td>\u5E7F\u89D2\u5C55\u793A\u67DC\u5185\u5168\u8C8C\uFF08\u4EFB\u4F55\u4EBA\u63A5\u89E6\u8D27\u7269\u4E4B\u524D\uFF09</td><td>\u7EA640\u79D2</td></tr>\n<tr><td>\u635F\u574F\u53D1\u73B0</td><td>\u505C\u6B62\u5378\u8D27\uFF0C\u8FDC\u666F+\u7279\u5199\uFF0C\u653E\u5377\u5C3A\u4F5C\u53C2\u7167</td><td>\u89C6\u60C5\u51B5</td></tr>\n<tr><td>\u7A7A\u67DC\u6536\u5C3E</td><td>\u62CD\u7A7A\u67DC\u5185\u90E8 + \u5730\u9762\u6B8B\u7559\u7269</td><td>\u7EA615\u79D2</td></tr>\n</table>\n<p><strong>\u6587\u4EF6\u547D\u540D\uFF1A</strong>YYYY-MM-DD_HHMMSS_\u4ED3\u5E93\u4EE3\u7801_\u67DC\u53F7_\u5F00\u67DC.mp4<br/>\n<strong>\u4FDD\u5B58\u671F\u9650\uFF1A</strong>\u6700\u4F4E6\u5E74\uFF08HGB \xA7257\uFF09\uFF0C\u5EFA\u8BAE10\u5E74</p>"
  },
  "safety-forklift": {
    id: "safety-forklift",
    cat: "安全须知",
    tag: "叉车安全",
    title: "叉车安全规程 — 人车共处规则",
    icon: "🚜",
    audience: "全员",
    lang: "zh",
    content: "\n<div class=\"alert-block danger\">\u53C9\u8F66\u662F\u4ED3\u5E93\u6700\u5371\u9669\u7684\u8BBE\u5907\u3002\u5FB7\u56FD\u6BCF\u5E74\u7EA6\u670920\u4EBA\u6B7B\u4E8E\u53C9\u8F66\u4E8B\u6545\uFF0C\u6570\u767E\u4EBA\u91CD\u4F24\u3002</div>\n\n<h3>\u6240\u6709\u4EBA\u5458\uFF08\u65E0\u8BBA\u662F\u5426\u64CD\u4F5C\u53C9\u8F66\uFF09</h3>\n<ul>\n<li>\u53EA\u8D70\u5212\u5B9A\u7684\u884C\u4EBA\u901A\u9053\uFF08\u9EC4\u7EBF\u533A\u57DF\uFF09\uFF0C\u4E0D\u8D70\u53C9\u8F66\u9053</li>\n<li>\u53C9\u8F66\u4F5C\u4E1A\u534A\u5F843\u7C73\u5185\u7ACB\u5373\u8FDC\u79BB\uFF0C\u4E0D\u7B49\u53C9\u8F66\u505C\u4E0B</li>\n<li>\u4E0E\u53C9\u8F66\u53F8\u673A\u4FDD\u6301\u773C\u795E\u63A5\u89E6\uFF0C\u786E\u8BA4\u88AB\u770B\u89C1\u540E\u624D\u901A\u8FC7</li>\n<li>\u80CC\u5BF9\u53C9\u8F66\u9053\u65F6\uFF0C\u5148\u8F6C\u8EAB\u786E\u8BA4\u518D\u884C\u8D70</li>\n<li>\u7EDD\u5BF9\u7981\u6B62\uFF1A\u5728\u53C9\u8F66\u65C1\u8FB9\u4F11\u606F\u3001\u73A9\u624B\u673A\u3001\u7A81\u7136\u6A2A\u7A7F\u53C9\u8F66\u9053</li>\n</ul>\n\n<h3>\u53C9\u8F66\u53F8\u673A\uFF08P3\u53CA\u4EE5\u4E0A\uFF0C\u6301\u8BC1\u4E0A\u5C97\uFF09</h3>\n<table>\n<tr><th>\u64CD\u4F5C\u524D</th><th>\u64CD\u4F5C\u4E2D</th><th>\u505C\u8F66\u65F6</th></tr>\n<tr><td>5\u70B9\u68C0\u67E5\uFF08\u6CB9\u6DB2/\u8F6E\u80CE/\u53C9\u81C2/\u62A5\u8B66/\u5B89\u5168\u5E26\uFF09</td><td>\u5BA4\u5185\u9650\u901F6km/h</td><td>\u53C9\u81C2\u843D\u5730</td></tr>\n<tr><td>\u786E\u8BA4\u4F5C\u4E1A\u533A\u57DF\u65E0\u884C\u4EBA</td><td>\u6709\u4EBA\u65F6\u51CF\u901F\u81F3\u6B65\u884C\u901F\u5EA6</td><td>\u7184\u706B</td></tr>\n<tr><td>\u7CFB\u597D\u5B89\u5168\u5E26</td><td>\u5012\u8F66\u5FC5\u987B\u9E23\u7B1B</td><td>\u4E0A\u624B\u5239</td></tr>\n<tr><td>\u786E\u8BA4\u89C6\u7EBF\u6E05\u6670</td><td>\u8F6C\u5F2F\u51CF\u901F</td><td>\u94A5\u5319\u53D6\u51FA</td></tr>\n</table>\n\n<h3>STOP\u89C4\u5219\uFF08\u4EBA\u5458\u4F18\u5148\uFF09</h3>\n<p>\u5728\u4EE5\u4E0B\u60C5\u51B5\uFF0C\u53C9\u8F66\u5FC5\u987B\u5B8C\u5168\u505C\u6B62\uFF0C\u7B49\u5F85\u4EBA\u5458\u901A\u8FC7\u540E\u65B9\u53EF\u7EE7\u7EED\uFF1A</p>\n<ul>\n<li>\u4EFB\u4F55\u4EBA\u51FA\u73B0\u5728\u53C9\u8F6610\u7C73\u8303\u56F4\u5185\u4E14\u672A\u6CE8\u610F\u5230\u53C9\u8F66</li>\n<li>\u89C6\u7EBF\u53D7\u963B\uFF08\u8D27\u67B6/\u5927\u4EF6\u8D27\u7269\u906E\u6321\uFF09</li>\n<li>\u901A\u9053\u5BBD\u5EA6\u4E0D\u8DB3\u53CC\u5411\u901A\u884C</li>\n<li>\u884C\u4EBA\u533A\u57DF\u8FB9\u754C\u4E0D\u6E05\u6670</li>\n</ul>"
  },
  "safety-fire": {
    id: "safety-fire",
    cat: "安全须知",
    tag: "消防应急",
    title: "消防与紧急疏散规程",
    icon: "🔥",
    audience: "全员",
    lang: "zh",
    content: "\n<h3>\u706B\u707E\u65F6\uFF08\u4E09\u6B65\u6CD5\uFF09</h3>\n<div class=\"alert-block\">\n<strong>\u2460 \u53D1\u73B0\u706B\u60C5\uFF1A\u7ACB\u5373\u5927\u58F0\u547C\u558A\u300CFEUER!\u300D\u5E76\u6309\u4E0B\u6700\u8FD1\u7684\u706B\u707E\u62A5\u8B66\u6309\u94AE</strong><br/>\n<strong>\u2461 \u901A\u77E5\u5168\u5458\uFF1A\u786E\u4FDD\u5468\u56F4\u540C\u4E8B\u77E5\u9053\uFF0C\u4E0D\u8981\u604B\u6218\u6551\u7269</strong><br/>\n<strong>\u2462 \u6309\u6307\u5B9A\u8DEF\u7EBF\u64A4\u79BB\uFF1A\u4E0D\u4E58\u7535\u68AF\uFF0C\u5230\u8FBE\u96C6\u5408\u70B9\uFF0C\u6E05\u70B9\u4EBA\u6570</strong>\n</div>\n\n<h3>\u758F\u6563\u89C4\u5219</h3>\n<ul>\n<li>\u758F\u6563\u8DEF\u7EBF\u56FE\u5F20\u8D34\u5728\u4ED3\u5E93\u5404\u51FA\u5165\u53E3\uFF0C\u5230\u5C97\u7B2C\u4E00\u5929\u5FC5\u987B\u786E\u8BA4</li>\n<li>\u96C6\u5408\u70B9\uFF1A[\u7531\u9A7B\u4ED3\u7ECF\u7406\u5728\u5165\u804C\u65F6\u544A\u77E5\u5177\u4F53\u4F4D\u7F6E]</li>\n<li>\u6E05\u70B9\u4EBA\u6570\u540E\u5411\u8D1F\u8D23\u4EBA\u6C47\u62A5\uFF0C\u7B49\u5F85\u6D88\u9632\u961F\u6307\u4EE4</li>\n<li>\u786E\u8BA4\u5168\u5458\u64A4\u79BB\u524D\uFF0C\u4E0D\u5F97\u8FD4\u56DE\u4ED3\u5E93\u53D6\u7269</li>\n</ul>\n\n<h3>\u706D\u706B\u5668\u4F7F\u7528\uFF08PASS\u6CD5\u5219\uFF09</h3>\n<table>\n<tr><td><strong>P</strong>ull</td><td>\u62D4\u51FA\u4FDD\u9669\u9500</td></tr>\n<tr><td><strong>A</strong>im</td><td>\u5BF9\u51C6\u706B\u7130\u6839\u90E8</td></tr>\n<tr><td><strong>S</strong>queeze</td><td>\u6309\u4E0B\u624B\u67C4</td></tr>\n<tr><td><strong>S</strong>weep</td><td>\u5DE6\u53F3\u626B\u5C04</td></tr>\n</table>\n<p><strong>\u6CE8\u610F\uFF1A</strong>\u706D\u706B\u5668\u53EA\u9002\u7528\u4E8E\u521D\u671F\u5C0F\u706B\uFF08\u76F4\u5F84\u4E0D\u8D85\u8FC71\u5E73\u65B9\u7C73\uFF09\u3002\u706B\u52BF\u5DF2\u6269\u5927\u65F6\u7ACB\u5373\u64A4\u79BB\uFF0C\u7B49\u5F85\u4E13\u4E1A\u6D88\u9632\u961F\u3002</p>\n\n<h3>\u7D27\u6025\u8054\u7CFB</h3>\n<table>\n<tr><td>\u6D88\u9632/\u6551\u62A4</td><td><strong>112</strong></td></tr>\n<tr><td>\u8B66\u5BDF</td><td><strong>110</strong></td></tr>\n<tr><td>\u9A7B\u4ED3\u7ECF\u7406</td><td>[\u89C1\u516C\u544A\u680F]</td></tr>\n<tr><td>\u6E0A\u535A\u516C\u53F8\u603B\u90E8</td><td>[\u89C1\u52B3\u52A8\u5408\u540C\u9996\u9875]</td></tr>\n</table>"
  },
  // ─── 法规法条 ────────────────────────────────────────────────────────
  "law-arbzg": {
    id: "law-arbzg",
    cat: "法规法条",
    tag: "ArbZG",
    title: "德国劳动时间法（ArbZG）要点 — 员工须知",
    icon: "⚖️",
    audience: "全员",
    lang: "zh",
    content: "\n<h3>Arbeitszeitgesetz \u2014 \u5173\u952E\u89C4\u5B9A\u901F\u67E5</h3>\n\n<table>\n<tr><th>\u6761\u6B3E</th><th>\u89C4\u5B9A</th><th>\u5BF9\u4F60\u610F\u5473\u7740\u4EC0\u4E48</th></tr>\n<tr><td><strong>\xA73 \u65E5\u5DE5\u65F6\u4E0A\u9650</strong></td><td>\u6BCF\u5DE5\u4F5C\u65E5\u6700\u591A8\u5C0F\u65F6\uFF0C\u7279\u6B8A\u60C5\u51B5\u53EF\u5EF6\u81F310\u5C0F\u65F6</td><td>\u8D85\u8FC710\u5C0F\u65F6/\u65E5\u662F\u8FDD\u6CD5\u7684\uFF0C\u516C\u53F8\u4E0D\u5F97\u8981\u6C42\uFF0C\u4F60\u4E5F\u4E0D\u5E94\u81EA\u884C\u5EF6\u957F</td></tr>\n<tr><td><strong>\xA73 6\u4E2A\u6708\u5747\u503C</strong></td><td>6\u4E2A\u6708\u5185\u65E5\u5747\u4E0D\u8D85\u8FC78\u5C0F\u65F6</td><td>\u5373\u4F7F\u67D0\u5929\u4E0A\u4E8610\u5C0F\u65F6\uFF0C\u5176\u4ED6\u5929\u5FC5\u987B\u76F8\u5E94\u51CF\u5C11</td></tr>\n<tr><td><strong>\xA74 \u4F11\u606F\u65F6\u95F4</strong></td><td>\u5DE5\u4F5C6\u5C0F\u65F6\u4EE5\u4E0A\u987B\u670930\u5206\u949F\u4F11\u606F\uFF1B9\u5C0F\u65F6\u4EE5\u4E0A\u987B\u670945\u5206\u949F</td><td>\u4F11\u606F\u65F6\u95F4\u662F\u6743\u5229\uFF0C\u4E0D\u662F\u5956\u52B1\uFF0C\u516C\u53F8\u4E0D\u80FD\u53D6\u6D88</td></tr>\n<tr><td><strong>\xA75 \u6BCF\u65E5\u4F11\u606F</strong></td><td>\u4E24\u73ED\u6B21\u4E4B\u95F4\u6700\u5C1111\u5C0F\u65F6\u8FDE\u7EED\u4F11\u606F</td><td>\u6628\u665A23\u70B9\u4E0B\u73ED\uFF0C\u6700\u65E9\u4ECA\u65E910\u70B9\u4E0A\u73ED</td></tr>\n<tr><td><strong>\xA76 \u591C\u73ED\u89C4\u5B9A</strong></td><td>\u591C\u73ED\u5DE5\u65F6\u4E0D\u8D85\u8FC78\u5C0F\u65F6/\u65E5\uFF08\u7279\u6B8A\u60C5\u51B510\u5C0F\u65F6\uFF09</td><td>\u591C\u73ED\u6709\u989D\u5916\u8865\u507F\u6743\u5229\uFF0C\u89C1\u4F60\u7684\u52B3\u52A8\u5408\u540C</td></tr>\n<tr><td><strong>\xA717 \u8BB0\u5F55\u4E49\u52A1</strong></td><td>\u96C7\u4E3B\u5FC5\u987B\u8BB0\u5F55\u8D85\u8FC78\u5C0F\u65F6\u7684\u5DE5\u4F5C\u65F6\u95F4</td><td>\u4F60\u6709\u6743\u67E5\u770B\u4F60\u7684\u5DE5\u65F6\u8BB0\u5F55</td></tr>\n</table>\n\n<h3>Zeitkonto\uFF08\u65F6\u95F4\u8D26\u6237\uFF09\u89C4\u5219</h3>\n<ul>\n<li>\u8D85\u8FC7\u5408\u540C\u5DE5\u65F6\u7684\u90E8\u5206\u8BA1\u5165 <strong>Plusstunden</strong>\uFF08\u52A0\u65F6\u8D26\u6237\uFF09</li>\n<li>Plusstunden\u4E0A\u9650\uFF1A<strong>+200\u5C0F\u65F6</strong>\uFF08MTV DGB/GVP 2026\uFF09</li>\n<li>\u8D85\u8FC7+150\u5C0F\u65F6\uFF1A\u516C\u53F8\u987B\u4E3B\u52A8\u5B89\u6392 <strong>Freizeitausgleich</strong>\uFF08\u8865\u4F11\uFF09</li>\n<li>\u672A\u7ECF\u4E66\u9762\u6279\u51C6\u7684\u81EA\u884C\u8D85\u65F6\uFF1A<strong>\u4E0D\u8BA1\u5165Zeitkonto\uFF0C\u4E5F\u4E0D\u652F\u4ED8</strong></li>\n</ul>\n\n<h3>\u8FDD\u89C4\u540E\u679C</h3>\n<ul>\n<li>\u96C7\u4E3B\u8FDD\u53CDArbZG\uFF1A\u6700\u9AD8 <strong>\u20AC30,000</strong> \u7F5A\u6B3E\uFF08\xA722 ArbZG\uFF09</li>\n<li>\u5458\u5DE5\u81EA\u884C\u8D85\u65F6\uFF08\u672A\u7ECF\u6279\u51C6\uFF09\uFF1A\u5C5E\u8FDD\u53CD\u5DE5\u65F6\u6307\u4EE4\uFF0C\u53EF\u6536\u5230Abmahnung</li>\n</ul>"
  },
  "law-milo": {
    id: "law-milo",
    cat: "法规法条",
    tag: "Mindestlohn",
    title: "德国最低工资法（MiLoG）— 员工权利",
    icon: "💶",
    audience: "全员",
    lang: "zh",
    content: "\n<h3>\u4F60\u7684\u6700\u4F4E\u85AA\u8D44\u6743\u5229</h3>\n<div class=\"alert-block info\">\n<strong>2026\u5E74\u5FB7\u56FD\u6CD5\u5B9A\u6700\u4F4E\u5DE5\u8D44\uFF1A\u20AC13.00/\u5C0F\u65F6\uFF08brutto\uFF09</strong><br/>\n\u6E0A\u535A+579\u6240\u6709\u4ED3\u5E93\u57FA\u7840\u65F6\u85AA\u5747\u9AD8\u4E8E\u6CD5\u5B9A\u6700\u4F4E\u5DE5\u8D44\u3002\n</div>\n\n<h3>MiLoG \u6838\u5FC3\u89C4\u5B9A</h3>\n<table>\n<tr><th>\u89C4\u5B9A</th><th>\u8BF4\u660E</th></tr>\n<tr><td>\u9002\u7528\u8303\u56F4</td><td>\u6240\u6709\u5728\u5FB7\u56FD\u5DE5\u4F5C\u7684\u4EBA\uFF0C\u5305\u62EC\u5916\u7C4D\u52B3\u5DE5\u3001\u6D3E\u9063\u5DE5\u3001\u517C\u804C</td></tr>\n<tr><td>\u652F\u4ED8\u65B9\u5F0F</td><td>\u6700\u8FDF\u5728\u6B21\u6708\u6700\u540E\u5DE5\u4F5C\u65E5\u652F\u4ED8\u4E0A\u6708\u5DE5\u8D44</td></tr>\n<tr><td>\u8BB0\u5F55\u4E49\u52A1\uFF08\xA717\uFF09</td><td>\u96C7\u4E3B\u987B\u8BB0\u5F55\u5F00\u59CB/\u7ED3\u675F/\u603B\u65F6\u957F\uFF0C\u5458\u5DE5\u987B\u5728\u5DE5\u65F6\u8BB0\u5F55\u4E0A\u7B7E\u5B57</td></tr>\n<tr><td>\u4FDD\u5B58\u671F\u9650</td><td>\u5DE5\u65F6\u8BB0\u5F55\u987B\u4FDD\u5B582\u5E74\u4EE5\u5907\u68C0\u67E5</td></tr>\n</table>\n\n<h3>\u5982\u679C\u4F60\u8BA4\u4E3A\u5DE5\u8D44\u8BA1\u7B97\u6709\u8BEF</h3>\n<ol>\n<li>\u67E5\u770B\u4F60\u7684\u5DE5\u65F6\u786E\u8BA4\u5355\uFF08Arbeitszeitnachweis\uFF09\u2014 \u4F60\u7B7E\u5B57\u7684\u90A3\u4EFD</li>\n<li>\u4E0E\u4F60\u7684\u9A7B\u4ED3\u7ECF\u7406\uFF08P7\uFF09\u6C9F\u901A\uFF0C\u8981\u6C42\u4E66\u9762\u8BF4\u660E</li>\n<li>\u5982\u65E0\u6CD5\u89E3\u51B3\uFF0C\u8054\u7CFB\u6E0A\u535AHR\u90E8\u95E8</li>\n<li>\u53EF\u5411 <strong>Zoll\uFF08\u6D77\u5173\u52B3\u5DE5\u76D1\u5BDF\uFF09</strong> \u6295\u8BC9\uFF0C\u533F\u540D\u4E5F\u53EF\u63A5\u53D7</li>\n</ol>\n<p>\u6295\u8BC9\u70ED\u7EBF\uFF1A<strong>0800 1234 567</strong>\uFF08\u514D\u8D39\uFF0C\u5FB7\u8BED/\u82F1\u8BED\uFF09</p>\n\n<h3>Minijob \u7279\u6B8A\u89C4\u5B9A</h3>\n<ul>\n<li>\u6708\u6536\u5165\u4E0A\u9650\uFF1A\u20AC538\uFF08\u8D85\u8FC7\u5C06\u8F6C\u4E3A\u6B63\u5E38\u5C31\u4E1A\u5173\u7CFB\uFF09</li>\n<li>\u65F6\u85AA\u540C\u6837\u4E0D\u5F97\u4F4E\u4E8E\u20AC13.00</li>\n<li>\u5458\u5DE5\u793E\u4FDD\u514D\u7F34\uFF0C\u4F46\u516C\u53F8\u987B\u652F\u4ED8\u7EA630%\u56FA\u5B9A\u7F34\u8D39</li>\n</ul>"
  },
  "law-kuendigung": {
    id: "law-kuendigung",
    cat: "法规法条",
    tag: "KSchG/BGB",
    title: "解雇保护法与劳动合同解除 — 你的权利",
    icon: "📋",
    audience: "全员",
    lang: "zh",
    content: "\n<h3>K\xFCndigungsschutz\uFF08\u89E3\u96C7\u4FDD\u62A4\uFF09</h3>\n<table>\n<tr><th>\u6761\u4EF6</th><th>\u89C4\u5B9A</th></tr>\n<tr><td>\u9002\u7528\u6761\u4EF6</td><td>\u5165\u804C\u6EE16\u4E2A\u6708\u4E14\u7528\u4EBA\u5355\u4F4D\u89C4\u6A21>10\u4EBA\uFF08\xA71 KSchG\uFF09</td></tr>\n<tr><td>\u4FDD\u62A4\u5185\u5BB9</td><td>\u89E3\u96C7\u987B\u6709\"\u793E\u4F1A\u6B63\u5F53\u6027\"\uFF0C\u5426\u5219\u53EF\u7533\u8BF7\u6CD5\u9662\u64A4\u9500</td></tr>\n<tr><td>\u4E09\u79CD\u5408\u6CD5\u89E3\u96C7\u7406\u7531</td><td>\u2460\u7ECF\u8425\u539F\u56E0\uFF08\u88C1\u5458\uFF09\u2461\u4EBA\u5458\u539F\u56E0\uFF08\u957F\u671F\u75C5\u5047\u7B49\uFF09\u2462\u884C\u4E3A\u539F\u56E0\uFF08\u8FDD\u7EA6\uFF09</td></tr>\n</table>\n\n<h3>\u901A\u77E5\u671F\uFF08\xA7622 BGB\uFF09</h3>\n<table>\n<tr><th>\u5728\u804C\u65F6\u957F</th><th>\u6700\u77ED\u901A\u77E5\u671F</th></tr>\n<tr><td>\u8BD5\u7528\u671F\uFF08\u6700\u591A6\u4E2A\u6708\uFF09</td><td>2\u5468</td></tr>\n<tr><td>2\u5E74\u4EE5\u5185</td><td>4\u5468\uFF08\u81F3\u6BCF\u6708\u6708\u4E2D\u6216\u6708\u5E95\uFF09</td></tr>\n<tr><td>2-5\u5E74</td><td>1\u4E2A\u6708\uFF08\u81F3\u6708\u5E95\uFF09</td></tr>\n<tr><td>5-8\u5E74</td><td>2\u4E2A\u6708\uFF08\u81F3\u6708\u5E95\uFF09</td></tr>\n</table>\n\n<h3>\u4EC0\u4E48\u662F Abmahnung\uFF08\u4E66\u9762\u8B66\u544A\uFF09</h3>\n<p>Abmahnung \u662F\u6B63\u5F0F\u7684\u4E66\u9762\u8B66\u544A\uFF0C\u8BB0\u5F55\u4F60\u7684\u8FDD\u7EA6\u884C\u4E3A\uFF0C\u8B66\u544A\u518D\u72AF\u5C06\u89E3\u96C7\u3002</p>\n<ul>\n<li>\u4F60\u6709\u6743\u5728\u6536\u5230\u540E\u5C06<strong>\u4E66\u9762\u53CD\u9A73\u610F\u89C1\uFF08Gegendarstellung\uFF09</strong>\u9644\u5165\u4F60\u7684\u4E2A\u4EBA\u6863\u6848</li>\n<li>Abmahnung \u6709\u6548\u671F\u901A\u5E38<strong>2\u5E74</strong>\uFF0C\u4E4B\u540E\u5931\u53BB\u6CD5\u5F8B\u6548\u529B</li>\n<li>Abmahnung\u4E0D\u7B49\u4E8E\u7ACB\u5373\u89E3\u96C7\uFF0C\u901A\u5E38\u9700\u89812\u6B21\u540C\u7C7B\u8FDD\u89C4\u624D\u4F1A\u89E3\u96C7</li>\n</ul>\n\n<h3>\u5982\u679C\u4F60\u6536\u5230 K\xFCndigung\uFF08\u89E3\u96C7\u901A\u77E5\uFF09</h3>\n<ol>\n<li>\u4E0D\u8981\u7ACB\u5373\u7B7E\u5B57\"\u63A5\u53D7\u89E3\u96C7\"\uFF0C\u7B7E\u5B57\u53EA\u786E\u8BA4\u6536\u5230</li>\n<li>\u7ACB\u5373\u54A8\u8BE2 <strong>Arbeitsgericht\uFF08\u52B3\u52A8\u6CD5\u9662\uFF09</strong>\uFF0C\u65F6\u6548\uFF1A\u6536\u5230\u89E3\u96C7\u540E3\u5468\u5185\u63D0\u8D77 <strong>K\xFCndigungsschutzklage</strong></li>\n<li>\u7533\u8BF7 <strong>Arbeitslosen\xADgeld\uFF08\u5931\u4E1A\u91D1\uFF09</strong>\uFF08\u987B\u5411 Arbeitsagentur \u767B\u8BB0\uFF09</li>\n</ol>"
  },
  "law-dsgvo": {
    id: "law-dsgvo",
    cat: "法规法条",
    tag: "DSGVO",
    title: "DSGVO（欧盟数据保护条例）— 员工须知",
    icon: "🔒",
    audience: "全员",
    lang: "zh",
    content: "\n<h3>\u4F60\u7684\u4E2A\u4EBA\u6570\u636E\u5982\u4F55\u88AB\u4F7F\u7528</h3>\n<p>\u6E0A\u535A+579\u5904\u7406\u4F60\u7684\u4E2A\u4EBA\u6570\u636E\u7684\u6CD5\u5F8B\u4F9D\u636E\u662F <strong>Art. 6(1)(b) DSGVO</strong>\uFF08\u5C65\u884C\u52B3\u52A8\u5408\u540C\u6240\u5FC5\u9700\uFF09\u548C <strong>Art. 6(1)(c)</strong>\uFF08\u6CD5\u5F8B\u4E49\u52A1\uFF0C\u5982\u7A0E\u52A1/\u793E\u4FDD\u8BB0\u5F55\uFF09\u3002</p>\n\n<h3>\u6211\u4EEC\u6536\u96C6\u54EA\u4E9B\u6570\u636E</h3>\n<ul>\n<li>\u59D3\u540D\u3001\u5730\u5740\u3001\u51FA\u751F\u65E5\u671F\u3001\u8054\u7CFB\u65B9\u5F0F</li>\n<li>\u8EAB\u4EFD\u8BC1\u4EF6/\u62A4\u7167\u4FE1\u606F\uFF08\u6838\u5B9E\u5DE5\u4F5C\u8BB8\u53EF\uFF09</li>\n<li>\u94F6\u884C\u8D26\u6237\u4FE1\u606F\uFF08IBAN\uFF0C\u5DE5\u8D44\u652F\u4ED8\uFF09</li>\n<li>Steuer-ID\u3001Steuerklasse\uFF08\u7A0E\u52A1\u7533\u62A5\uFF09</li>\n<li>\u5DE5\u65F6\u8BB0\u5F55\u3001\u8003\u52E4\u8BB0\u5F55</li>\n</ul>\n\n<h3>\u4F60\u7684\u6743\u5229\uFF08DSGVO Art. 15-22\uFF09</h3>\n<table>\n<tr><th>\u6743\u5229</th><th>\u8BF4\u660E</th></tr>\n<tr><td>\u67E5\u9605\u6743\uFF08Art. 15\uFF09</td><td>\u53EF\u8981\u6C42\u67E5\u770B\u516C\u53F8\u50A8\u5B58\u7684\u5173\u4E8E\u4F60\u7684\u6240\u6709\u6570\u636E</td></tr>\n<tr><td>\u66F4\u6B63\u6743\uFF08Art. 16\uFF09</td><td>\u5982\u6570\u636E\u6709\u8BEF\uFF0C\u6709\u6743\u8981\u6C42\u66F4\u6B63</td></tr>\n<tr><td>\u5220\u9664\u6743\uFF08Art. 17\uFF09</td><td>\u79BB\u804C\u540E\uFF0C\u8D85\u8FC7\u6CD5\u5B9A\u4FDD\u5B58\u671F\u9650\u7684\u6570\u636E\u987B\u5220\u9664</td></tr>\n<tr><td>\u6570\u636E\u53EF\u79FB\u690D\uFF08Art. 20\uFF09</td><td>\u53EF\u8981\u6C42\u4EE5\u901A\u7528\u683C\u5F0F\u5BFC\u51FA\u4F60\u7684\u6570\u636E</td></tr>\n</table>\n\n<h3>\u6570\u636E\u5B58\u50A8\u4F4D\u7F6E</h3>\n<p>\u6240\u6709\u5458\u5DE5\u6570\u636E\u4EC5\u5B58\u50A8\u5728<strong>EU\u5883\u5185\u670D\u52A1\u5668</strong>\uFF08\u5FB7\u56FD/\u6B27\u6D32\u6570\u636E\u4E2D\u5FC3\uFF09\uFF0C\u4E0D\u8F6C\u79FB\u81F3EU\u4EE5\u5916\u5730\u533A\uFF08\u5305\u62EC\u4E2D\u56FD\uFF09\uFF0C\u7B26\u5408GDPR\u8981\u6C42\u3002</p>\n\n<h3>\u5982\u6709\u6570\u636E\u76F8\u5173\u95EE\u9898</h3>\n<p>\u8054\u7CFB\u6E0A\u535AHR\u90E8\u95E8\uFF0C\u6216\u5411\u5FB7\u56FD\u6570\u636E\u4FDD\u62A4\u76D1\u7BA1\u673A\u6784\uFF08<strong>Datenschutzbeh\xF6rde</strong>\uFF09\u6295\u8BC9\u3002</p>"
  },
  "law-aug": {
    id: "law-aug",
    cat: "法规法条",
    tag: "AÜG/BetrVG",
    title: "派遣法（AÜG）与企业组织法（BetrVG）要点",
    icon: "📑",
    audience: "全员",
    lang: "zh",
    content: "\n<h3>Arbeitnehmer\xFCberlassungsgesetz\uFF08A\xDCG\uFF09\u2014 \u6D3E\u9063\u5DE5\u6743\u5229</h3>\n<h4>\u4F5C\u4E3A\u6E0A\u535A\u6D3E\u9063\u5230\u4ED3\u5E93\u5DE5\u4F5C\u7684\u5458\u5DE5\uFF0C\u4F60\u6709\u4EE5\u4E0B\u6743\u5229\uFF1A</h4>\n<table>\n<tr><th>\u6743\u5229</th><th>\u5185\u5BB9</th></tr>\n<tr><td>Equal Pay\uFF08\xA710 A\xDCG\uFF09</td><td>\u6D3E\u9063\u6EE19\u4E2A\u6708\u540E\uFF0C\u85AA\u8D44\u4E0D\u5F97\u4F4E\u4E8E\u540C\u5C97\u4F4D\u6B63\u5F0F\u5458\u5DE5\uFF08Stammarbeitnehmer\uFF09</td></tr>\n<tr><td>\u6700\u957F\u6D3E\u9063\u671F\u9650</td><td>\u540C\u4E00\u7528\u5DE5\u5355\u4F4D\u6700\u957F18\u4E2A\u6708\uFF0C\u8D85\u671F\u987B\u8F6C\u6B63\u6216\u7ED3\u675F\uFF08\u6709Tarifvertrag\u53EF\u4F8B\u5916\uFF09</td></tr>\n<tr><td>\u7528\u5DE5\u5355\u4F4D\u544A\u77E5\u4E49\u52A1</td><td>\u7528\u5DE5\u5355\u4F4D\u987B\u5728\u4F60\u5230\u5C97\u524D\u544A\u77E5\u6D3E\u9063\u6761\u4EF6</td></tr>\n<tr><td>\u793E\u4FDD\u8FDE\u7EED</td><td>\u5728\u6E0A\u535A\u5C31\u804C\u671F\u95F4\u7684\u793E\u4FDD\u7F34\u7EB3\u8FDE\u7EED\u8BA1\u7B97\uFF0C\u4E0D\u56E0\u6362\u4ED3\u5E93\u4E2D\u65AD</td></tr>\n</table>\n\n<h3>\u4F60\u7684\u52B3\u52A8\u5408\u540C\u662F\u4E0E\u6E0A\u535A\u7B7E\u8BA2\u7684</h3>\n<ul>\n<li>\u4F60\u7684\u96C7\u4E3B\u662F<strong>\u6E0A\u535AGmbH</strong>\uFF0C\u4E0D\u662F\u4F60\u5DE5\u4F5C\u7684\u4ED3\u5E93\uFF08\u5982Amazon\u3001TEMU\u3001DHL\u7B49\uFF09</li>\n<li>\u85AA\u8D44\u7531\u6E0A\u535A\u652F\u4ED8\uFF0C\u4ED3\u5E93\u65B9\u4E0D\u80FD\u76F4\u63A5\u8981\u6C42\u4F60\u5EF6\u957F\u5DE5\u65F6\u3001\u6539\u53D8\u4F60\u7684\u5C97\u4F4D</li>\n<li>\u5982\u4ED3\u5E93\u65B9\u7684\u6307\u4EE4\u8D85\u51FA\u4F60\u7684\u5408\u540C\u8303\u56F4\uFF0C\u53EF\u5411\u6E0A\u535A\u9A7B\u4ED3\u7ECF\u7406\u53CD\u6620</li>\n</ul>\n\n<h3>Werkvertrag\uFF08\u627F\u63FD\u5408\u540C\uFF09\u91CD\u8981\u533A\u522B</h3>\n<p>\u5982\u679C\u4F60\u53C2\u4E0E\u7684\u662FWerkvertrag\u9879\u76EE\uFF1A</p>\n<ul>\n<li>\u4F60\u53EA\u63A5\u53D7<strong>\u6E0A\u535A\u65B9</strong>\uFF08\u9A7B\u4ED3\u7ECF\u7406/\u73ED\u7EC4\u957F\uFF09\u7684\u5DE5\u4F5C\u6307\u793A</li>\n<li>\u4ED3\u5E93\u5BA2\u6237\u65B9<strong>\u4E0D\u80FD</strong>\u76F4\u63A5\u6307\u6325\u4F60\u7684\u5177\u4F53\u64CD\u4F5C\u65B9\u6CD5\uFF08\u8FD9\u662F\u6CD5\u5F8B\u8981\u6C42\uFF09</li>\n<li>\u5982\u4ED3\u5E93\u65B9\u5C1D\u8BD5\u76F4\u63A5\u6307\u6325\u4F60\uFF0C\u8BF7\u544A\u77E5\u4F60\u7684\u9A7B\u4ED3\u7ECF\u7406</li>\n</ul>"
  },
  // ─── 模板库 ────────────────────────────────────────────────────────
  "tpl-timesheet": {
    id: "tpl-timesheet",
    cat: "模板库",
    tag: "工时",
    title: "Arbeitszeitnachweis — 工时确认单（可打印模板）",
    icon: "📋",
    audience: "全员",
    lang: "zh+de",
    printable: true,
    content: "\n<div class=\"print-doc\">\n<div class=\"print-header\">\n  <div class=\"print-logo\">Yuanbo GmbH</div>\n  <div>\n    <div class=\"print-title\">ARBEITSZEITNACHWEIS / \u5DE5\u65F6\u786E\u8BA4\u5355</div>\n    <div class=\"print-meta\">Datum / \u65E5\u671F: _______________ &nbsp;|&nbsp; Lager / \u4ED3\u5E93: _______________</div>\n    <div class=\"print-meta\">Manager Unterschrift / \u4ED3\u5E93\u4E3B\u7BA1\u7B7E\u5B57: ___________________</div>\n  </div>\n</div>\n<table class=\"print-table\">\n<tr><th>Nr.</th><th>Name / \u59D3\u540D</th><th>Start / \u5F00\u59CB</th><th>End / \u7ED3\u675F</th><th>Pause / \u4F11\u606F</th><th>Total / \u5408\u8BA1</th><th>Unterschrift / \u7B7E\u5B57</th></tr>\n".concat(Array.from({
      length: 20
    }, function (_, i) {
      return "<tr><td>".concat(i + 1, "</td><td style=\"min-width:120px\"></td><td></td><td></td><td>0:30</td><td></td><td style=\"min-width:140px\"></td></tr>");
    }).join(''), "\n</table>\n<div class=\"print-footer\">\n<p>Hinweis / \u6CE8\u610F\uFF1A\u901A\u8FC7\u7B7E\u5B57\uFF0C\u5458\u5DE5\u786E\u8BA4\u6240\u586B\u5DE5\u65F6\u771F\u5B9E\u51C6\u786E\u3002\u4EE3\u4ED6\u4EBA\u7B7E\u5B57\u5C5E\u6B3A\u8BC8\u884C\u4E3A\uFF08Unterschriftenf\xE4lschung\uFF09\uFF0C\u53EF\u5BFC\u81F4\u5211\u4E8B\u8FFD\u8BC9\u3002<br/>\nDie Unterschrift best\xE4tigt die Richtigkeit der Arbeitszeitangaben. Das stellvertretende Unterzeichnen ist eine Straftat.</p>\n<p>\u6587\u4EF6\u4FDD\u5B58\uFF1A\u539F\u4EF6\u81F3\u5C11\u4FDD\u5B586\u4E2A\u6708\uFF08Aufbewahrungspflicht nach MiLoG \xA717\uFF09</p>\n</div>\n</div>")
  },
  "tpl-container": {
    id: "tpl-container",
    cat: "模板库",
    tag: "卸柜",
    title: "货柜分货清点表 Tally Sheet（可打印模板）",
    icon: "📦",
    audience: "P4+",
    lang: "zh+de",
    printable: true,
    content: "\n<div class=\"print-doc\">\n<div class=\"print-header\">\n  <div class=\"print-logo\">Yuanbo GmbH</div>\n  <div>\n    <div class=\"print-title\">TALLY SHEET / \u8D27\u67DC\u5206\u8D27\u6E05\u70B9\u8868</div>\n    <div class=\"print-meta\">Container Nr. / \u67DC\u53F7: _______________ &nbsp;|&nbsp; Seal Nr. / \u94C5\u5C01\u53F7: _______________</div>\n    <div class=\"print-meta\">Datum / \u65E5\u671F: _______________ &nbsp;|&nbsp; Lager / \u4ED3\u5E93: _______________ &nbsp;|&nbsp; Typ / \u67DC\u578B: _______________</div>\n    <div class=\"print-meta\">Teilnehmer / \u4F5C\u4E1A\u4EBA\u5458: _____________________________________________</div>\n  </div>\n</div>\n<p style=\"font-size:11px;margin-bottom:6px\"><strong>\u7BB1\u551B\u53C2\u8003\u56FE\u533A</strong>\uFF08\u7C98\u8D34\u6216\u624B\u7ED8\u6807\u7B7E\u793A\u610F\uFF0C\u6807\u6CE8\u5173\u952E\u5B57\u6BB5\u4F4D\u7F6E\uFF09\uFF1A</p>\n<div style=\"border:1px dashed #aaa;height:80px;margin-bottom:12px;display:flex;align-items:center;justify-content:center;color:#999;font-size:11px\">\u7C98\u8D34\u6807\u7B7E\u7167\u7247 / \u624B\u7ED8\u793A\u610F\u56FE</div>\n<table class=\"print-table\">\n<tr><th>\u76EE\u7684\u4ED3 Destination</th><th>\u6258\u76D81</th><th>\u6258\u76D82</th><th>\u6258\u76D83</th><th>\u6258\u76D84</th><th>\u6258\u76D85</th><th>\u6258\u76D86</th><th>\u5C0F\u8BA1 Subtotal</th></tr>\n".concat(Array.from({
      length: 8
    }, function () {
      return "<tr><td style=\"min-width:100px\"></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>";
    }).join(''), "\n<tr><td><strong>\u603B\u8BA1 Total</strong></td><td></td><td></td><td></td><td></td><td></td><td></td><td style=\"font-weight:700\"></td></tr>\n</table>\n<table style=\"width:100%;font-size:11px;margin-top:8px;border-collapse:collapse\">\n<tr><td style=\"width:50%;padding:4px;border:0.5px solid #ccc\">\u9884\u62A5\u4EF6\u6570 Voranmeldung: ________</td><td style=\"padding:4px;border:0.5px solid #ccc\">\u5B9E\u5230\u4EF6\u6570 Ist: ________</td></tr>\n<tr><td style=\"padding:4px;border:0.5px solid #ccc\">\u5DEE\u5F02\u8BF4\u660E Differenz-Erl\xE4uterung:</td><td style=\"padding:4px;border:0.5px solid #ccc\"></td></tr>\n</table>\n<div style=\"display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:14px;font-size:11px\">\n<div>\u6E05\u70B9\u4EBA / Z\xE4hler:<br/><div style=\"border-bottom:1px solid #333;margin-top:20px\"></div></div>\n<div>\u7EC4\u957F\u786E\u8BA4 / Teamleiter:<br/><div style=\"border-bottom:1px solid #333;margin-top:20px\"></div></div>\n<div>\u5BA2\u6237\u4ED3\u5E93\u786E\u8BA4 / Lager:<br/><div style=\"border-bottom:1px solid #333;margin-top:20px\"></div></div>\n</div>\n</div>")
  },
  "tpl-abmahnung-absent": {
    id: "tpl-abmahnung-absent",
    cat: "模板库",
    tag: "Abmahnung",
    title: "Abmahnung 模板 B — 无故旷工（HR专用）",
    icon: "⚠️",
    audience: "HR,P7,P8,P9",
    lang: "de",
    content: "\n<div class=\"print-doc\">\n<div style=\"display:flex;justify-content:space-between;margin-bottom:16px\">\n<div><strong>Yuanbo GmbH</strong><br/><span style=\"font-size:10px;color:#666\">Personalmanagement \xB7 Deutschland</span></div>\n<div style=\"text-align:right;font-size:10px;color:#666\">[Stadt], den [Datum]<br/>HR-DISZ-001 \xB7 ABM-[ID]-[Jahr]-[Nr.]</div>\n</div>\n<p>[Mitarbeiter Vor- und Nachname]<br/>[Stra\xDFe Nr.]<br/>[PLZ Stadt]</p>\n<br/>\n<p style=\"font-size:15px;font-weight:800;letter-spacing:1px\">ABMAHNUNG</p>\n<p><strong>Betreff: Abmahnung wegen unentschuldigten Fehlens am [Datum]</strong></p>\n<br/>\n<p><strong>I. Sachverhaltsdarstellung\uFF08\u4E8B\u5B9E\u63CF\u8FF0\uFF09</strong><br/>\nSie sind am <u>[\u5177\u4F53\u65E5\u671F\uFF0C\u5982\uFF1A2026\u5E743\u67085\u65E5\uFF0C\u661F\u671F\u4E09]</u> nicht zu Ihrer vertraglich vereinbarten Arbeitszeit (<u>[\u73ED\u6B21\u5F00\u59CB\u65F6\u95F4]</u>) am Arbeitsort erschienen.</p>\n<p>Wir haben Sie am selben Tag um <u>[\u65F6\u95F41]</u> und um <u>[\u65F6\u95F42]</u> telefonisch kontaktiert. <u>[Sie haben abgenommen / Sie haben nicht abgenommen]</u>.<br/>\nBis zum <u>[\u65E5\u671F]</u> haben Sie weder einen Urlaubsantrag eingereicht noch eine Arbeitsunf\xE4higkeitsbescheinigung (AU) vorgelegt.<br/>\nIhre Abwesenheit von insgesamt <u>[X]</u> Stunden gilt daher als unentschuldigtes Fehlen (\u65F7\u5DE5).</p>\n<p><strong>II. R\xFCge\uFF08\u6307\u8D23\uFF09</strong><br/>\nIhr Verhalten stellt eine Verletzung Ihrer Hauptleistungspflicht aus dem Arbeitsvertrag dar (\xA7 611a BGB i.V.m. Ihrem Arbeitsvertrag \xA7 [X]).</p>\n<p><strong>III. Aufforderung zur Verhaltens\xE4nderung\uFF08\u6539\u6B63\u8981\u6C42\uFF09</strong><br/>\nWir fordern Sie auf, k\xFCnftig Ihre Arbeitspflicht p\xFCnktlich und vollst\xE4ndig zu erf\xFCllen sowie Abwesenheiten unverz\xFCglich und rechtzeitig zu melden und zu belegen.</p>\n<p><strong>IV. Warnung\uFF08\u8B66\u544A\uFF09</strong><br/>\nWir weisen Sie hiermit ausdr\xFCcklich darauf hin: Sollten Sie erneut unentschuldigt fehlen oder \xE4hnliche Pflichtverletzungen begehen, werden wir <u>ohne weitere Abmahnung</u> die K\xFCndigung des Arbeitsverh\xE4ltnisses aussprechen.</p>\n<p><strong>V. Hinweis auf Gegendarstellungsrecht</strong><br/>\nSie haben das Recht, eine schriftliche Gegendarstellung zu dieser Abmahnung zu verfassen und in Ihre Personalakte aufnehmen zu lassen.</p>\n<br/>\n<p>Mit freundlichen Gr\xFC\xDFen<br/><strong>Yuanbo GmbH</strong><br/>[HR Manager Name], HR Management</p>\n<br/>\n<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:40px;font-size:11px\">\n<div style=\"border-top:1px solid #333;padding-top:4px\">Unterschrift Arbeitgeber \xB7 Datum</div>\n<div style=\"border-top:1px solid #333;padding-top:4px\">Empfang best\xE4tigt (\u2260 Einverst\xE4ndnis) \xB7 Datum \xB7 Unterschrift Arbeitnehmer</div>\n</div>\n<div style=\"margin-top:12px;font-size:9px;color:#666\">\n\u25A1 \u9762\u4EA4\u7B7E\u6536 \xB7 \u25A1 \u6302\u53F7\u4FE1 Einschreiben (Sendungsnummer: ___________)<br/>\nAufbewahrung: mind. 2 Jahre in der Personalakte \xB7 Ablauf: [Datum+2 Jahre]\n</div>\n</div>"
  },
  "tpl-aufforderung": {
    id: "tpl-aufforderung",
    cat: "模板库",
    tag: "到岗催告",
    title: "到岗催告通知 — Aufforderungsschreiben（HR专用）",
    icon: "📄",
    audience: "HR,P7,P8",
    lang: "de",
    content: "\n<div class=\"print-doc\">\n<div style=\"display:flex;justify-content:space-between;margin-bottom:16px\">\n<div><strong>Yuanbo GmbH</strong></div>\n<div style=\"font-size:10px;color:#666;text-align:right\">[Stadt], den [Datum]</div>\n</div>\n<p>[Mitarbeiter Name]<br/>[Adresse]</p><br/>\n<p><strong>Betreff: Aufforderung zur Arbeitsaufnahme / Kl\xE4rung Ihrer Abwesenheit</strong></p>\n<p>Sehr geehrte/r Herr/Frau [Name],</p>\n<p>wir stellen fest, dass Sie seit dem <u>[Datum]</u> nicht an Ihrem Arbeitsplatz erschienen sind, ohne dass uns hierf\xFCr ein triftiger Grund mitgeteilt wurde.</p>\n<p>Wir fordern Sie hiermit auf, <strong>innerhalb von [2] Werktagen</strong> nach Erhalt dieses Schreibens:</p>\n<ol>\n<li>unsere HR-Abteilung zu kontaktieren und Ihre Abwesenheit zu begr\xFCnden;</li>\n<li>falls Sie erkrankt sind, umgehend eine Arbeitsunf\xE4higkeitsbescheinigung (AU-Bescheinigung) einzureichen.</li>\n</ol>\n<p>Sollten Sie dieser Aufforderung nicht nachkommen, m\xFCssen wir Ihre Abwesenheit als unentschuldigtes Fehlen werten und entsprechende arbeitsrechtliche Ma\xDFnahmen einleiten.</p>\n<p>Mit freundlichen Gr\xFC\xDFen<br/><strong>Yuanbo GmbH</strong> \xB7 [HR Manager]</p>\n<div style=\"margin-top:12px;font-size:10px;color:#666\">\uD83D\uDCCC Bitte Einschreiben mit R\xFCckschein verwenden / \u8BF7\u7528\u6302\u53F7\u4FE1\u53D1\u9001\uFF0C\u4FDD\u7559\u56DE\u6267</div>\n</div>"
  },
  "tpl-safety-sign": {
    id: "tpl-safety-sign",
    cat: "模板库",
    tag: "安全",
    title: "安全Unterweisung签到表（可打印）",
    icon: "✅",
    audience: "全员",
    lang: "zh+de",
    printable: true,
    content: "\n<div class=\"print-doc\">\n<div class=\"print-header\">\n  <div class=\"print-logo\">Yuanbo GmbH</div>\n  <div>\n    <div class=\"print-title\">SICHERHEITSUNTERWEISUNG / \u5B89\u5168\u57F9\u8BAD\u7B7E\u5230\u8868</div>\n    <div class=\"print-meta\">Datum / \u65E5\u671F: _______________ &nbsp;|&nbsp; Lager / \u4ED3\u5E93: _______________</div>\n    <div class=\"print-meta\">Schulungsleiter / \u57F9\u8BAD\u4EBA: _______________ &nbsp;|&nbsp; Dauer / \u65F6\u957F: _______________ min</div>\n  </div>\n</div>\n<p style=\"font-size:11px;margin-bottom:6px\"><strong>\u57F9\u8BAD\u5185\u5BB9 / Schulungsinhalt\uFF08\u8BF7\u52FE\u9009\u5B8C\u6210\u7684\u5185\u5BB9\uFF09\uFF1A</strong></p>\n<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;margin-bottom:12px\">\n".concat(["□ PPE强制要求（安全鞋/背心）", "□ 叉车安全规则 / Gabelstapler", "□ 集装箱开柜六步法", "□ 火灾疏散路线 / Brandschutz", "□ 工时记录与签字规定", "□ Arbeitszeitnachweis签字", "□ Werkvertrag指令渠道说明", "□ 紧急联系人信息"].map(function (i) {
      return "<span>".concat(i, "</span>");
    }).join(''), "\n</div>\n<table class=\"print-table\">\n<tr><th>Nr.</th><th>Name / \u59D3\u540D</th><th>Unterschrift / \u7B7E\u540D</th><th>Datum / \u65E5\u671F</th></tr>\n").concat(Array.from({
      length: 20
    }, function (_, i) {
      return "<tr><td>".concat(i + 1, "</td><td style=\"min-width:140px\"></td><td style=\"min-width:140px\"></td><td></td></tr>");
    }).join(''), "\n</table>\n<div class=\"print-footer\">\nDurch die Unterschrift best\xE4tigt der/die Mitarbeiter/in, die Sicherheitsunterweisung erhalten und verstanden zu haben.<br/>\n\u7B7E\u5B57\u8868\u793A\u5458\u5DE5\u5DF2\u63A5\u53D7\u5E76\u7406\u89E3\u672C\u6B21\u5B89\u5168\u57F9\u8BAD\u5185\u5BB9\u3002<br/>\nAufbewahrung: mind. 2 Jahre / \u4FDD\u5B58\u671F\uFF1A\u81F3\u5C112\u5E74\n</div>\n</div>")
  },
  "tpl-incident": {
    id: "tpl-incident",
    cat: "模板库",
    tag: "事故记录",
    title: "违规/事故事件记录表（HR存档用）",
    icon: "📝",
    audience: "P5+",
    lang: "zh",
    content: "\n<div class=\"print-doc\">\n<div class=\"print-header\">\n  <div class=\"print-logo\">Yuanbo GmbH</div>\n  <div><div class=\"print-title\">\u8FDD\u89C4\u4E8B\u4EF6\u8BB0\u5F55\u8868 / Versto\xDFprotokoll</div>\n  <div class=\"print-meta\">HR-DISZ-001 \u914D\u5957\u6587\u4EF6 \xB7 \u586B\u5199\u540E\u5B58\u5165\u5458\u5DE5\u6863\u6848</div></div>\n</div>\n<table style=\"width:100%;font-size:12px;border-collapse:collapse;margin-bottom:12px\">\n<tr><td style=\"width:30%;padding:6px;border:0.5px solid #ccc;font-weight:700\">\u5458\u5DE5\u59D3\u540D / Name:</td><td style=\"padding:6px;border:0.5px solid #ccc\"></td><td style=\"width:30%;padding:6px;border:0.5px solid #ccc;font-weight:700\">\u5458\u5DE5ID / ID:</td><td style=\"padding:6px;border:0.5px solid #ccc\"></td></tr>\n<tr><td style=\"padding:6px;border:0.5px solid #ccc;font-weight:700\">\u4E8B\u4EF6\u65E5\u671F / Datum:</td><td style=\"padding:6px;border:0.5px solid #ccc\"></td><td style=\"padding:6px;border:0.5px solid #ccc;font-weight:700\">\u4ED3\u5E93 / Lager:</td><td style=\"padding:6px;border:0.5px solid #ccc\"></td></tr>\n<tr><td style=\"padding:6px;border:0.5px solid #ccc;font-weight:700\">\u8BB0\u5F55\u4EBA / Ersteller:</td><td style=\"padding:6px;border:0.5px solid #ccc\"></td><td style=\"padding:6px;border:0.5px solid #ccc;font-weight:700\">\u8BB0\u5F55\u65E5\u671F:</td><td style=\"padding:6px;border:0.5px solid #ccc\"></td></tr>\n</table>\n<p style=\"font-weight:700;font-size:12px;margin-bottom:4px\">\u8FDD\u89C4\u7C7B\u578B / Art des Versto\xDFes\uFF1A</p>\n<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;margin-bottom:10px\">\n".concat(["□ 无故旷工 (unentschuldigtes Fehlen)", "□ 迟到/早退", "□ 擅自超时", "□ 安全违规（不戴PPE等）", "□ 拒绝执行合理指令", "□ 设备违规操作", "□ 工时记录不实", "□ 其他: ___________"].map(function (i) {
      return "<span>".concat(i, "</span>");
    }).join(''), "\n</div>\n<p style=\"font-weight:700;font-size:12px;margin-bottom:4px\">\u4E8B\u5B9E\u63CF\u8FF0\uFF08\u7CBE\u786E\u5230\u65F6\u95F4\u3001\u5730\u70B9\u3001\u884C\u4E3A\uFF09/ Sachverhaltsdarstellung\uFF1A</p>\n<div style=\"border:0.5px solid #ccc;min-height:60px;margin-bottom:10px;padding:6px;font-size:11px\"></div>\n<p style=\"font-weight:700;font-size:12px;margin-bottom:4px\">\u8054\u7CFB\u8BB0\u5F55 / Kontaktprotokoll\uFF1A</p>\n<div style=\"border:0.5px solid #ccc;min-height:40px;margin-bottom:10px;padding:6px;font-size:11px\">\u7535\u8BDD1: ___:___ \u25A1\u63A5\u901A \u25A1\u672A\u63A5 &nbsp; \u7535\u8BDD2: ___:___ \u25A1\u63A5\u901A \u25A1\u672A\u63A5 &nbsp; WhatsApp: \u25A1\u5DF2\u53D1</div>\n<p style=\"font-weight:700;font-size:12px;margin-bottom:4px\">\u5458\u5DE5\u8BF4\u660E / Mitarbeiter-Erkl\xE4rung\uFF1A</p>\n<div style=\"border:0.5px solid #ccc;min-height:50px;margin-bottom:10px;padding:6px;font-size:11px\"></div>\n<p style=\"font-weight:700;font-size:12px;margin-bottom:4px\">\u5904\u7406\u63AA\u65BD / Ma\xDFnahme\uFF1A</p>\n<div style=\"font-size:11px;display:grid;grid-template-columns:1fr 1fr;gap:4px\">\n").concat(["□ 口头提醒（非正式）", "□ 书面提醒", "□ Abmahnung 第一份", "□ Abmahnung 第二份", "□ 扣薪（旷工时段）", "□ 报告区域经理"].map(function (i) {
      return "<span>".concat(i, "</span>");
    }).join(''), "\n</div>\n<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:20px;font-size:11px\">\n<div style=\"border-top:1px solid #333;padding-top:4px\">HR Manager \xB7 Datum \xB7 Unterschrift</div>\n<div style=\"border-top:1px solid #333;padding-top:4px\">Vorgesetzter (P5+) \xB7 Datum \xB7 Unterschrift</div>\n</div>\n</div>")
  },
  "handbook-onboarding": {
    id: "handbook-onboarding",
    cat: "员工手册",
    tag: "入职",
    title: "新员工入职指南 — 第一天你需要知道的",
    icon: "🎉",
    audience: "P1",
    lang: "zh",
    content: "\n<h3>\u6B22\u8FCE\u52A0\u5165\u6E0A\u535A+579\uFF01</h3>\n<p>\u4F60\u6B63\u5F0F\u6210\u4E3A\u6211\u4EEC\u4ED3\u50A8\u64CD\u4F5C\u56E2\u961F\u7684\u4E00\u5458\u3002\u672C\u6307\u5357\u5E2E\u52A9\u4F60\u5FEB\u901F\u4E86\u89E3\u5DE5\u4F5C\u4E2D\u6700\u91CD\u8981\u7684\u4E8B\u9879\u3002</p>\n\n<h3>\u7B2C\u4E00\u5929\u5DE5\u4F5C\u6D41\u7A0B</h3>\n<ol>\n<li>\u51C6\u65F6\u5230\u8FBE\u6307\u5B9A\u4ED3\u5E93\uFF0C\u627E\u5230\u4F60\u7684<strong>\u73ED\u7EC4\u957F\uFF08P4\uFF09</strong>\u62A5\u5230</li>\n<li>\u9886\u53D6\u5B89\u5168\u88C5\u5907\uFF1A<strong>\u5B89\u5168\u978B + \u9AD8\u53EF\u89C1\u5EA6\u80CC\u5FC3</strong>\uFF08\u8FD9\u4E24\u6837\u662F\u5F3A\u5236\u7684\uFF0C\u6CA1\u6709\u5C31\u4E0D\u80FD\u8FDB\u5165\u4F5C\u4E1A\u533A\uFF09</li>\n<li>\u53C2\u52A015\u5206\u949F\u5B89\u5168\u4ECB\u7ECD\uFF0C\u5728<strong>\u5B89\u5168\u57F9\u8BAD\u7B7E\u5230\u8868</strong>\u4E0A\u7B7E\u5B57</li>\n<li>\u73ED\u7EC4\u957F\u5E26\u4F60\u719F\u6089\uFF1A\u7D27\u6025\u51FA\u53E3\u4F4D\u7F6E\u3001\u6D17\u624B\u95F4\u3001\u4F11\u606F\u533A\u3001\u53C9\u8F66\u9053\u4F4D\u7F6E</li>\n<li>\u5F00\u59CB\u5728\u73ED\u7EC4\u957F/\u8001\u5458\u5DE5\u6307\u5BFC\u4E0B\u64CD\u4F5C</li>\n</ol>\n\n<h3>\u5DE5\u65F6\u548C\u5DE5\u8D44</h3>\n<ul>\n<li>\u6BCF\u5929\u4E0B\u73ED\u524D\uFF0C\u4F60\u7684<strong>Arbeitszeitnachweis\uFF08\u5DE5\u65F6\u786E\u8BA4\u5355\uFF09</strong>\u4E0A\u5FC5\u987B\u6709\u4F60\u7684\u4EB2\u7B14\u7B7E\u540D</li>\n<li>\u53EA\u80FD\u81EA\u5DF1\u7B7E\uFF0C\u4E0D\u80FD\u8BA9\u522B\u4EBA\u4EE3\u7B7E\u2014\u2014\u4EE3\u7B7E\u662F\u8FDD\u6CD5\u884C\u4E3A</li>\n<li>\u5982\u679C\u4F60\u89C9\u5F97\u5DE5\u65F6\u8BB0\u5F55\u6709\u8BEF\uFF0C\u5F53\u573A\u8BF4\u51FA\u6765\uFF0C\u4E0D\u8981\u5148\u7B7E\u5B57\u540E\u6295\u8BC9</li>\n<li>\u5DE5\u8D44\u6700\u8FDF\u5728\u6B21\u6708\u6700\u540E\u4E00\u4E2A\u5DE5\u4F5C\u65E5\u6253\u5165\u4F60\u7684\u94F6\u884C\u8D26\u6237\uFF08IBAN\uFF09</li>\n</ul>\n\n<h3>\u8BF7\u5047\u89C4\u5B9A</h3>\n<table>\n<tr><th>\u8BF7\u5047\u7C7B\u578B</th><th>\u5982\u4F55\u7533\u8BF7</th><th>\u622A\u6B62\u65F6\u95F4</th></tr>\n<tr><td>\u5E74\u5047\uFF08Urlaub\uFF09</td><td>\u63D0\u524D\u5411\u73ED\u7EC4\u957F/\u9A7B\u4ED3\u7ECF\u7406\u7533\u8BF7\uFF0C\u4E66\u9762\u786E\u8BA4</td><td>\u81F3\u5C11\u63D0\u524D1\u5468</td></tr>\n<tr><td>\u75C5\u5047\uFF08Krankmeldung\uFF09</td><td>\u5F53\u5929\u4E0A\u73ED\u524D\u901A\u77E5\u73ED\u7EC4\u957F\uFF0C3\u5929\u5185\u63D0\u4EA4AU\u8BC1\u660E</td><td>\u5F53\u5929\u65E9\u4E0A</td></tr>\n<tr><td>\u4E8B\u5047</td><td>\u63D0\u524D\u7533\u8BF7\uFF0C\u7279\u6B8A\u60C5\u51B5\u4E8B\u540E\u8865\u529E</td><td>\u5C3D\u65E9</td></tr>\n</table>\n\n<h3>\u8C01\u662F\u4F60\u7684\u8054\u7CFB\u4EBA</h3>\n<table>\n<tr><th>\u95EE\u9898\u7C7B\u578B</th><th>\u627E\u8C01</th></tr>\n<tr><td>\u4ECA\u5929\u5E72\u4EC0\u4E48 / \u73B0\u573A\u95EE\u9898</td><td>\u4F60\u7684\u73ED\u7EC4\u957F P4</td></tr>\n<tr><td>\u5DE5\u8D44 / \u5408\u540C / \u6392\u73ED</td><td>\u9A7B\u4ED3\u7ECF\u7406 P7</td></tr>\n<tr><td>\u5B89\u5168\u4E8B\u6545 / \u53D7\u4F24</td><td>\u9A7B\u4ED3\u7ECF\u7406 P7 \u2192 \u62E8\u6253112</td></tr>\n<tr><td>\u5BF9\u7BA1\u7406\u5C42\u6709\u610F\u89C1</td><td>\u5148\u627EP7\uFF0C\u518D\u8054\u7CFBHR\u90E8\u95E8</td></tr>\n</table>\n\n<h3>\u8BB0\u4F4F\u8FD93\u6761\u6700\u91CD\u8981\u7684\u89C4\u5219</h3>\n<div class=\"alert-block\">\n<strong>1. \u8FDB\u4F5C\u4E1A\u533A\u5FC5\u987B\u7A7F\u5B89\u5168\u978B + \u6234\u80CC\u5FC3\uFF0C\u65E0\u4F8B\u5916</strong><br/>\n<strong>2. \u53C9\u8F66\u9053 = \u5371\u9669\u533A\uFF0C\u6C38\u8FDC\u8D70\u4EBA\u884C\u901A\u9053</strong><br/>\n<strong>3. \u4E0D\u786E\u5B9A\u5C31\u95EE\uFF0C\u5B81\u53EF\u591A\u95EE\u4E5F\u4E0D\u8981\u731C\u6D4B\u64CD\u4F5C</strong>\n</div>"
  },
  "handbook-rights": {
    id: "handbook-rights",
    cat: "员工手册",
    tag: "权利",
    title: "员工权利手册 — 在德国工作你受法律保护",
    icon: "🛡️",
    audience: "全员",
    lang: "zh",
    content: "\n<h3>\u4F60\u5728\u5FB7\u56FD\u5DE5\u4F5C\u4EAB\u6709\u4EE5\u4E0B\u57FA\u672C\u6743\u5229</h3>\n\n<table>\n<tr><th>\u6743\u5229</th><th>\u5177\u4F53\u5185\u5BB9</th><th>\u76F8\u5173\u6CD5\u5F8B</th></tr>\n<tr><td><strong>\u6700\u4F4E\u5DE5\u8D44</strong></td><td>\u20AC13.00/h brutto\uFF0C\u65E0\u8BBA\u56FD\u7C4D</td><td>MiLoG</td></tr>\n<tr><td><strong>\u6700\u4F4E\u5047\u671F</strong></td><td>\u6BCF\u5E7424\u4E2A\u5DE5\u4F5C\u65E5\uFF08\u5168\u804C\uFF09\uFF0C\u517C\u804C\u6309\u6BD4\u4F8B</td><td>BUrlG</td></tr>\n<tr><td><strong>\u75C5\u5047\u5E26\u85AA</strong></td><td>\u75C5\u5047\u524D6\u5468\u7531\u96C7\u4E3B\u5168\u989D\u652F\u4ED8\uFF08Entgeltfortzahlung\uFF09</td><td>EFZG \xA73</td></tr>\n<tr><td><strong>\u5DE5\u65F6\u4E0A\u9650</strong></td><td>\u6700\u591A10h/\u65E5\uFF0C6\u4E2A\u6708\u5185\u5747\u503C\u22648h/\u65E5</td><td>ArbZG \xA73</td></tr>\n<tr><td><strong>\u89E3\u96C7\u4FDD\u62A4</strong></td><td>\u5165\u804C6\u4E2A\u6708\u540E\uFF0C\u89E3\u96C7\u987B\u6709\u6B63\u5F53\u7406\u7531</td><td>KSchG \xA71</td></tr>\n<tr><td><strong>\u6570\u636E\u4FDD\u62A4</strong></td><td>\u4E2A\u4EBA\u6570\u636E\u4EC5\u7528\u4E8E\u5408\u540C\u5C65\u884C\uFF0C\u4E0D\u5F97\u6EE5\u7528</td><td>DSGVO</td></tr>\n</table>\n\n<h3>\u5982\u679C\u4F60\u8BA4\u4E3A\u6743\u5229\u53D7\u5230\u4FB5\u72AF</h3>\n<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:12px\">\n<div style=\"padding:12px;background:#f8f9fb;border-radius:8px;border:1px solid #e0e4ef;font-size:12px\">\n<strong>\u5DE5\u8D44\u76F8\u5173</strong><br/>\nZoll Finanzkontrolle Schwarzarbeit<br/>\n\u70ED\u7EBF\uFF1A<strong>0800 1234 567</strong>\uFF08\u514D\u8D39\uFF09<br/>\n\u53EF\u533F\u540D\u6295\u8BC9\n</div>\n<div style=\"padding:12px;background:#f8f9fb;border-radius:8px;border:1px solid #e0e4ef;font-size:12px\">\n<strong>\u52B3\u52A8\u6761\u4EF6\u76F8\u5173</strong><br/>\nArbeitsschutzbeh\xF6rde\uFF08\u5404\u5DDE\u52B3\u52A8\u4FDD\u62A4\u5C40\uFF09<br/>\n\u53EF\u7F51\u4E0A\u533F\u540D\u4E3E\u62A5\n</div>\n<div style=\"padding:12px;background:#f8f9fb;border-radius:8px;border:1px solid #e0e4ef;font-size:12px\">\n<strong>\u89E3\u96C7\u4E89\u8BAE</strong><br/>\nArbeitsgericht\uFF08\u52B3\u52A8\u6CD5\u9662\uFF09<br/>\n\u6536\u5230\u89E3\u96C7\u8D77<strong>3\u5468\u5185</strong>\u63D0\u8D77\u8BC9\u8BBC<br/>\n\u53EF\u7533\u8BF7\u6CD5\u5F8B\u63F4\u52A9\uFF08Prozesskostenhilfe\uFF09\n</div>\n<div style=\"padding:12px;background:#f8f9fb;border-radius:8px;border:1px solid #e0e4ef;font-size:12px\">\n<strong>\u516C\u53F8\u5185\u90E8\u6E20\u9053</strong><br/>\n\u73ED\u7EC4\u957FP4 \u2192 \u9A7B\u4ED3\u7ECF\u7406P7 \u2192 HR\u90E8\u95E8<br/>\n\u4EFB\u4F55\u6295\u8BC9\u53D7\u5230\u6253\u51FB\u62A5\u590D\u662F\u8FDD\u6CD5\u7684\n</div>\n</div>"
  }
};

// ─── DOCS STYLES ────────────────────────────────────────────────────
var DOCS_STYLE = "\n.doc-body h3{font-size:13px;font-weight:700;color:var(--ac2);margin:16px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--bd)}\n.doc-body h4{font-size:12px;font-weight:600;color:var(--tx2);margin:12px 0 6px}\n.doc-body p{font-size:12px;color:var(--tx2);line-height:1.7;margin-bottom:8px}\n.doc-body ul,.doc-body ol{font-size:12px;color:var(--tx2);line-height:1.9;padding-left:18px;margin-bottom:10px}\n.doc-body table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:12px}\n.doc-body th{background:var(--bg3);padding:7px 10px;text-align:left;font-weight:600;color:var(--tx2);border-bottom:1px solid var(--bd);font-size:10px;text-transform:uppercase}\n.doc-body td{padding:7px 10px;border-bottom:1px solid var(--bd)33;color:var(--tx2)}\n.doc-body tr:hover td{background:var(--sf)}\n.alert-block{padding:10px 14px;border-radius:8px;font-size:11px;line-height:1.7;margin:12px 0}\n.alert-block.danger,.alert-block{background:#f0526c14;border:1px solid #f0526c44;color:#f0526c}\n.alert-block.info{background:#4f6ef714;border:1px solid #4f6ef744;color:var(--ac2)}\n.checklist{background:var(--bg3);border:1px solid var(--bd);border-radius:8px;padding:12px;font-size:12px;color:var(--tx2);line-height:2.0;font-family:'Outfit',monospace}\n/* Print styles */\n@media print{\n  .sidebar,.hdr,.mob-hdr,.ab,.no-print{display:none!important}\n  .doc-body{color:#111!important}\n  .doc-body h3{color:#1B2B4B!important;border-color:#ccc!important}\n  .doc-body p,.doc-body li,.doc-body td{color:#333!important}\n  .doc-body th{background:#f0f0f0!important;color:#333!important;border-color:#ccc!important}\n  .doc-body td{border-color:#ccc!important}\n  .alert-block{background:#fff8f8!important;border-color:#f0526c!important;color:#c00!important}\n  .print-doc{color:#111;font-family:Arial,sans-serif;font-size:11px}\n  .print-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #1B2B4B}\n  .print-logo{font-size:16px;font-weight:800;color:#1B2B4B}\n  .print-title{font-size:14px;font-weight:700;color:#1B2B4B}\n  .print-meta{font-size:10px;color:#555}\n  .print-table{width:100%;border-collapse:collapse}\n  .print-table th{background:#1B2B4B;color:#fff;padding:6px 8px;font-size:10px}\n  .print-table td{padding:5px 8px;border:0.5px solid #ccc;min-height:22px}\n  .print-footer{margin-top:12px;font-size:9px;color:#555;border-top:1px solid #ccc;padding-top:8px}\n}";

// ─── DOCS COMPONENT ─────────────────────────────────────────────────
function KnowledgeBase(_ref53) {
  var token = _ref53.token,
    user = _ref53.user;
  var _React$useState = React.useState(null),
    _React$useState2 = _slicedToArray(_React$useState, 2),
    selId = _React$useState2[0],
    setSelId = _React$useState2[1];
  var _React$useState3 = React.useState(''),
    _React$useState4 = _slicedToArray(_React$useState3, 2),
    search = _React$useState4[0],
    setSearch = _React$useState4[1];
  var _React$useState5 = React.useState(''),
    _React$useState6 = _slicedToArray(_React$useState5, 2),
    cat = _React$useState6[0],
    setCat = _React$useState6[1];
  var _React$useState7 = React.useState(false),
    _React$useState8 = _slicedToArray(_React$useState7, 2),
    printing = _React$useState8[0],
    setPrinting = _React$useState8[1];
  var _useLang11 = useLang(),
    t = _useLang11.t;
  var CATS = ['职级职责', '安全须知', '法规法条', '模板库', '员工手册'];
  var CAT_ICONS = {
    '职级职责': '🏅',
    '安全须知': '🦺',
    '法规法条': '⚖️',
    '模板库': '📋',
    '员工手册': '📖'
  };
  var docs = Object.values(DOCS_DB);
  var filtered = docs.filter(function (d) {
    if (cat && d.cat !== cat) return false;
    if (search && !d.title.includes(search) && !d.content.includes(search)) return false;
    return true;
  });
  var selDoc = selId ? DOCS_DB[selId] : null;
  var printDoc = function printDoc() {
    window.print();
  };

  // Inject CSS once
  React.useEffect(function () {
    if (!document.getElementById('docs-style')) {
      var s = document.createElement('style');
      s.id = 'docs-style';
      s.textContent = DOCS_STYLE;
      document.head.appendChild(s);
    }
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      height: 'calc(100vh - 120px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 260,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "si",
    placeholder: t('kb.search'),
    value: search,
    onChange: function onChange(e) {
      return setSearch(e.target.value);
    },
    style: {
      fontSize: 12
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "fb ".concat(!cat ? 'on' : ''),
    onClick: function onClick() {
      return setCat('');
    },
    style: {
      fontSize: 10
    }
  }, t('kb.all_cats')), CATS.map(function (c) {
    return /*#__PURE__*/React.createElement("button", {
      key: c,
      className: "fb ".concat(cat === c ? 'on' : ''),
      onClick: function onClick() {
        return setCat(c);
      },
      style: {
        fontSize: 10
      }
    }, CAT_ICONS[c], " ", c);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, CATS.filter(function (c) {
    return !cat || c === cat;
  }).map(function (c) {
    var catDocs = filtered.filter(function (d) {
      return d.cat === c;
    });
    if (catDocs.length === 0) return null;
    return /*#__PURE__*/React.createElement("div", {
      key: c
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        color: 'var(--tx3)',
        padding: '8px 6px 4px',
        textTransform: 'uppercase',
        letterSpacing: '.06em'
      }
    }, CAT_ICONS[c], " ", c), catDocs.map(function (d) {
      return /*#__PURE__*/React.createElement("div", {
        key: d.id,
        onClick: function onClick() {
          return setSelId(d.id);
        },
        style: {
          padding: '8px 10px',
          borderRadius: 8,
          cursor: 'pointer',
          background: selId === d.id ? '#4f6ef718' : 'transparent',
          border: "1px solid ".concat(selId === d.id ? 'var(--ac)' : 'transparent'),
          marginBottom: 2,
          transition: 'all .1s'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 2
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 14
        }
      }, d.icon), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          fontWeight: 600,
          color: selId === d.id ? 'var(--ac2)' : 'var(--tx)',
          lineHeight: 1.3
        }
      }, d.title.length > 36 ? d.title.slice(0, 36) + '…' : d.title)), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: 4,
          paddingLeft: 20
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 9,
          padding: '1px 6px',
          borderRadius: 10,
          background: 'var(--sf)',
          color: 'var(--tx3)'
        }
      }, d.tag), d.printable && /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 9,
          padding: '1px 6px',
          borderRadius: 10,
          background: '#2dd4a014',
          color: 'var(--gn)'
        }
      }, "\u53EF\u6253\u5370")));
    }));
  }), filtered.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: 20,
      color: 'var(--tx3)',
      fontSize: 12
    }
  }, "\u65E0\u5339\u914D\u6587\u6863")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--tx3)',
      textAlign: 'center'
    }
  }, docs.length, " \u4EFD\u6587\u6863 \xB7 \u968F\u65F6\u66F4\u65B0")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: 'var(--bg2)',
      border: '1px solid var(--bd)',
      borderRadius: 14,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, !selDoc ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: 'var(--tx3)',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 48,
      opacity: .3
    }
  }, "\uD83D\uDCDA"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14
    }
  }, "\u9009\u62E9\u5DE6\u4FA7\u6587\u6863\u5F00\u59CB\u9605\u8BFB"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--tx3)',
      maxWidth: 300,
      textAlign: 'center'
    }
  }, "\u5171 ", docs.length, " \u4EFD\u6587\u6863\uFF0C\u6DB5\u76D6\u804C\u7EA7\u804C\u8D23\u3001\u5B89\u5168\u987B\u77E5\u3001\u6CD5\u89C4\u6CD5\u6761\u3001\u6A21\u677F\u548C\u5458\u5DE5\u624B\u518C")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 20px',
      borderBottom: '1px solid var(--bd)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22
    }
  }, selDoc.icon), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700
    }
  }, selDoc.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--tx3)',
      marginTop: 2,
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", null, selDoc.cat), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "\u9002\u7528: ", selDoc.audience), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: selDoc.lang.includes('de') ? 'var(--og)' : 'var(--tx3)'
    }
  }, selDoc.lang.includes('de') ? '🇩🇪 含德文' : '🇨🇳 中文')))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    },
    className: "no-print"
  }, selDoc.printable && /*#__PURE__*/React.createElement("button", {
    className: "b bgn",
    style: {
      fontSize: 10
    },
    onClick: printDoc
  }, t('kb.print')), /*#__PURE__*/React.createElement("button", {
    className: "b bgh",
    style: {
      fontSize: 10
    },
    onClick: printDoc
  }, t('kb.print')), /*#__PURE__*/React.createElement("button", {
    className: "b bgh",
    style: {
      fontSize: 10
    },
    onClick: function onClick() {
      return setSelId(null);
    }
  }, "\u2715"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '20px 24px'
    },
    className: "doc-body",
    dangerouslySetInnerHTML: {
      __html: selDoc.content
    }
  }))));
}

// ── GRADE SALARIES ──
function GradeSalaries(_ref54) {
  var token = _ref54.token;
  var _useState111 = useState([]),
    _useState112 = _slicedToArray(_useState111, 2),
    grades = _useState112[0],
    setGrades = _useState112[1];
  var _useState113 = useState([]),
    _useState114 = _slicedToArray(_useState113, 2),
    kpi = _useState114[0],
    setKpi = _useState114[1];
  var _useState115 = useState(true),
    _useState116 = _slicedToArray(_useState115, 2),
    loading = _useState116[0],
    setLoading = _useState116[1];
  var _useLang12 = useLang(),
    t = _useLang12.t;
  useEffect(function () {
    Promise.all([api('/api/grades', {
      token: token
    }), api('/api/kpi-levels', {
      token: token
    })]).then(function (_ref55) {
      var _ref56 = _slicedToArray(_ref55, 2),
        g = _ref56[0],
        k = _ref56[1];
      setGrades(g);
      setKpi(k);
    }).finally(function () {
      return setLoading(false);
    });
  }, []);
  if (loading) return /*#__PURE__*/React.createElement(Loading, null);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "cd"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ct-t"
  }, "\uD83C\uDFC5 ", t('grade.title')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--tx3)',
      marginBottom: 10
    }
  }, "\u57FA\u51C6\u5DE5\u8D44 \u20AC2,400 \xD7 \u500D\u7387 + \u7BA1\u7406\u6D25\u8D34 + \u8D85\u65F6\u5DE5\u8D44 = \u6708\u5B9E\u9645\u6210\u672C"), /*#__PURE__*/React.createElement("div", {
    className: "tw"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, t('grade.col_grade')), /*#__PURE__*/React.createElement("th", null, t('grade.col_desc')), /*#__PURE__*/React.createElement("th", null, t('grade.col_base')), /*#__PURE__*/React.createElement("th", null, t('grade.col_mult')), /*#__PURE__*/React.createElement("th", null, t('grade.col_gross')), /*#__PURE__*/React.createElement("th", null, t('grade.col_mgmt')), /*#__PURE__*/React.createElement("th", null, t('grade.col_ot')), /*#__PURE__*/React.createElement("th", null, t('grade.col_cost')), /*#__PURE__*/React.createElement("th", null, t('grade.col_hourly')))), /*#__PURE__*/React.createElement("tbody", null, grades.map(function (g) {
    return /*#__PURE__*/React.createElement("tr", {
      key: g.grade
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        color: 'var(--pp)',
        fontWeight: 800,
        fontSize: 13
      }
    }, g.grade), /*#__PURE__*/React.createElement("td", null, g.description), /*#__PURE__*/React.createElement("td", {
      className: "mn"
    }, "\u20AC", (g.base_salary || 0).toLocaleString('de-DE')), /*#__PURE__*/React.createElement("td", {
      className: "mn",
      style: {
        color: 'var(--og)'
      }
    }, "\xD7", g.multiplier), /*#__PURE__*/React.createElement("td", {
      className: "mn fw6"
    }, "\u20AC", (g.gross_salary || 0).toLocaleString('de-DE')), /*#__PURE__*/React.createElement("td", {
      className: "mn"
    }, "\u20AC", (g.mgmt_allowance || 0).toLocaleString('de-DE')), /*#__PURE__*/React.createElement("td", {
      className: "mn"
    }, g.overtime_hours, "h"), /*#__PURE__*/React.createElement("td", {
      className: "mn",
      style: {
        color: 'var(--rd)',
        fontWeight: 700
      }
    }, "\u20AC", (g.real_cost || 0).toLocaleString('de-DE')), /*#__PURE__*/React.createElement("td", {
      className: "mn",
      style: {
        color: 'var(--gn)',
        fontWeight: 700
      }
    }, "\u20AC", (g.hourly_equiv || 0).toFixed(2), "/h"));
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "cd",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ct-t"
  }, "\uD83C\uDFAF KPI \u7EE9\u6548\u7B49\u7EA7\u4E0E\u5956\u91D1"), /*#__PURE__*/React.createElement("div", {
    className: "tw"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\u7B49\u7EA7"), /*#__PURE__*/React.createElement("th", null, "\u57FA\u7840\u5DE5\u8D44"), /*#__PURE__*/React.createElement("th", null, "\u5956\u91D1\u6BD4\u4F8B"), /*#__PURE__*/React.createElement("th", null, "KPI\u5956\u91D1"), /*#__PURE__*/React.createElement("th", null, "\u6700\u7EC8\u6536\u5165"))), /*#__PURE__*/React.createElement("tbody", null, kpi.map(function (k) {
    return /*#__PURE__*/React.createElement("tr", {
      key: k.level
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        fontWeight: 700,
        color: 'var(--ac2)'
      }
    }, k.level), /*#__PURE__*/React.createElement("td", {
      className: "mn"
    }, "\u20AC", (k.base_salary || 0).toLocaleString('de-DE')), /*#__PURE__*/React.createElement("td", {
      className: "mn",
      style: {
        color: 'var(--og)'
      }
    }, ((k.bonus_rate || 0) * 100).toFixed(0), "%"), /*#__PURE__*/React.createElement("td", {
      className: "mn gn"
    }, "\u20AC", (k.kpi_bonus || 0).toFixed(0)), /*#__PURE__*/React.createElement("td", {
      className: "mn fw6",
      style: {
        color: 'var(--gn)'
      }
    }, "\u20AC", (k.total_income || 0).toLocaleString('de-DE')));
  }))))));
}

// ── WAREHOUSE RATES ──
function WarehouseRates(_ref57) {
  var token = _ref57.token,
    user = _ref57.user;
  var _useState117 = useState([]),
    _useState118 = _slicedToArray(_useState117, 2),
    whs = _useState118[0],
    setWhs = _useState118[1];
  var _useState119 = useState(null),
    _useState120 = _slicedToArray(_useState119, 2),
    sel = _useState120[0],
    setSel = _useState120[1];
  var _useState121 = useState(true),
    _useState122 = _slicedToArray(_useState121, 2),
    loading = _useState122[0],
    setLoading = _useState122[1];
  var _useState123 = useState(false),
    _useState124 = _slicedToArray(_useState123, 2),
    editing = _useState124[0],
    setEditing = _useState124[1];
  var _useState125 = useState({}),
    _useState126 = _slicedToArray(_useState125, 2),
    form = _useState126[0],
    setForm = _useState126[1];
  var _useLang13 = useLang(),
    t = _useLang13.t;
  useEffect(function () {
    api('/api/warehouses', {
      token: token
    }).then(setWhs).finally(function () {
      return setLoading(false);
    });
  }, []);
  var selWh = whs.find(function (w) {
    return w.code === sel;
  });
  var loadRates = function loadRates(code) {
    setSel(code);
    api("/api/warehouses/".concat(code, "/rates"), {
      token: token
    }).then(function (w) {
      setForm(w);
    });
  };
  var canEdit = ['admin', 'mgr'].includes(user.role);
  var saveRates = /*#__PURE__*/function () {
    var _ref58 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee14() {
      return _regenerator().w(function (_context14) {
        while (1) switch (_context14.n) {
          case 0:
            _context14.n = 1;
            return api("/api/warehouses/".concat(sel), {
              method: 'PUT',
              body: form,
              token: token
            });
          case 1:
            setEditing(false);
            api('/api/warehouses', {
              token: token
            }).then(setWhs);
          case 2:
            return _context14.a(2);
        }
      }, _callee14);
    }));
    return function saveRates() {
      return _ref58.apply(this, arguments);
    };
  }();
  var GRADES = ['P1', 'P2', 'P3', 'P4', 'P5'];
  var RATE_KEYS = [['rate_p1', 'P1'], ['rate_p2', 'P2'], ['rate_p3', 'P3'], ['rate_p4', 'P4'], ['rate_p5', 'P5']];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 180,
      flexShrink: 0
    }
  }, loading ? /*#__PURE__*/React.createElement(Loading, null) : whs.map(function (w) {
    return /*#__PURE__*/React.createElement("div", {
      key: w.code,
      onClick: function onClick() {
        return loadRates(w.code);
      },
      style: {
        padding: '10px 12px',
        background: sel === w.code ? '#4f6ef718' : 'var(--bg2)',
        border: "1px solid ".concat(sel === w.code ? 'var(--ac)' : 'var(--bd)'),
        borderRadius: 10,
        cursor: 'pointer',
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 700,
        fontSize: 12
      }
    }, w.code), /*#__PURE__*/React.createElement("div", {
      className: "tm",
      style: {
        fontSize: 9
      }
    }, w.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 9,
        color: 'var(--tx3)',
        marginTop: 2
      }
    }, w.region));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, !selWh ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 200,
      color: 'var(--tx3)'
    }
  }, t('wh.select')) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "cd"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ct-t"
  }, selWh.name, " \xB7 ", selWh.region), canEdit && /*#__PURE__*/React.createElement("button", {
    className: "b bga",
    onClick: function onClick() {
      return setEditing(!editing);
    }
  }, editing ? t('c.cancel') : t('wh.edit'))), /*#__PURE__*/React.createElement("div", {
    className: "section-grid",
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 12,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg3)',
      borderRadius: 8,
      border: '1px solid var(--bd)',
      padding: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: 'var(--ac2)',
      marginBottom: 8
    }
  }, "\u65F6\u85AA\uFF08\u20AC/h\uFF09 by \u804C\u7EA7"), RATE_KEYS.map(function (_ref59) {
    var _ref60 = _slicedToArray(_ref59, 2),
      k = _ref60[0],
      g = _ref60[1];
    return /*#__PURE__*/React.createElement("div", {
      key: k,
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 11,
        padding: '3px 0',
        borderBottom: '1px solid var(--bd)30'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--pp)',
        fontWeight: 600
      }
    }, g), editing ? /*#__PURE__*/React.createElement("input", {
      type: "number",
      step: "0.10",
      value: form[k] || '',
      onChange: function onChange(e) {
        return setForm(_objectSpread(_objectSpread({}, form), {}, _defineProperty({}, k, +e.target.value)));
      },
      style: {
        width: 70,
        padding: '2px 6px',
        background: 'var(--bg2)',
        border: '1px solid var(--ac)',
        borderRadius: 4,
        color: 'var(--tx)',
        fontFamily: 'monospace',
        fontSize: 11
      }
    }) : /*#__PURE__*/React.createElement("span", {
      className: "mn",
      style: {
        color: 'var(--gn)',
        fontWeight: 700
      }
    }, "\u20AC", (selWh[k] || 0).toFixed(2)));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg3)',
      borderRadius: 8,
      border: '1px solid var(--bd)',
      padding: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: 'var(--og)',
      marginBottom: 8
    }
  }, "\u73ED\u6B21\u9644\u52A0\uFF08\u20AC/h\uFF09"), [['night_bonus', '夜班'], ['weekend_bonus', '周末'], ['holiday_bonus', '节假日']].map(function (_ref61) {
    var _ref62 = _slicedToArray(_ref61, 2),
      k = _ref62[0],
      l = _ref62[1];
    return /*#__PURE__*/React.createElement("div", {
      key: k,
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 11,
        padding: '3px 0',
        borderBottom: '1px solid var(--bd)30'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--og)'
      }
    }, l), editing ? /*#__PURE__*/React.createElement("input", {
      type: "number",
      step: "0.10",
      value: form[k] || '',
      onChange: function onChange(e) {
        return setForm(_objectSpread(_objectSpread({}, form), {}, _defineProperty({}, k, +e.target.value)));
      },
      style: {
        width: 70,
        padding: '2px 6px',
        background: 'var(--bg2)',
        border: '1px solid var(--ac)',
        borderRadius: 4,
        color: 'var(--tx)',
        fontFamily: 'monospace',
        fontSize: 11
      }
    }) : /*#__PURE__*/React.createElement("span", {
      className: "mn",
      style: {
        fontWeight: 700
      }
    }, "+\u20AC", (selWh[k] || 0).toFixed(2)));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg3)',
      borderRadius: 8,
      border: '1px solid var(--bd)',
      padding: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: 'var(--cy)',
      marginBottom: 8
    }
  }, "\u88C5\u5378\u67DC\u4EF7\u683C\uFF08\u20AC/\u67DC\uFF09"), [['load_20gp', '20GP 装'], ['unload_20gp', '20GP 卸'], ['load_40gp', '40GP 装'], ['unload_40gp', '40GP 卸'], ['price_45hc', '45HC 装/卸']].map(function (_ref63) {
    var _ref64 = _slicedToArray(_ref63, 2),
      k = _ref64[0],
      l = _ref64[1];
    return /*#__PURE__*/React.createElement("div", {
      key: k,
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 11,
        padding: '3px 0',
        borderBottom: '1px solid var(--bd)30'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "tm"
    }, l), editing ? /*#__PURE__*/React.createElement("input", {
      type: "number",
      step: "5",
      value: form[k] || '',
      onChange: function onChange(e) {
        return setForm(_objectSpread(_objectSpread({}, form), {}, _defineProperty({}, k, +e.target.value)));
      },
      style: {
        width: 70,
        padding: '2px 6px',
        background: 'var(--bg2)',
        border: '1px solid var(--ac)',
        borderRadius: 4,
        color: 'var(--tx)',
        fontFamily: 'monospace',
        fontSize: 11
      }
    }) : /*#__PURE__*/React.createElement("span", {
      className: "mn",
      style: {
        fontWeight: 700
      }
    }, "\u20AC", selWh[k] || 0));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      marginBottom: editing ? 12 : 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg3)',
      borderRadius: 8,
      border: '1px solid var(--bd)',
      padding: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: 'var(--gn)',
      marginBottom: 6
    }
  }, "\u7EE9\u6548\u53C2\u6570"), [['perf_coeff', '绩效系数'], ['kpi_bonus_rate', 'KPI奖金率']].map(function (_ref65) {
    var _ref66 = _slicedToArray(_ref65, 2),
      k = _ref66[0],
      l = _ref66[1];
    return /*#__PURE__*/React.createElement("div", {
      key: k,
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 11,
        padding: '3px 0'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "tm"
    }, l), editing ? /*#__PURE__*/React.createElement("input", {
      type: "number",
      step: "0.01",
      value: form[k] || '',
      onChange: function onChange(e) {
        return setForm(_objectSpread(_objectSpread({}, form), {}, _defineProperty({}, k, +e.target.value)));
      },
      style: {
        width: 70,
        padding: '2px 6px',
        background: 'var(--bg2)',
        border: '1px solid var(--ac)',
        borderRadius: 4,
        color: 'var(--tx)',
        fontFamily: 'monospace',
        fontSize: 11
      }
    }) : /*#__PURE__*/React.createElement("span", {
      className: "mn gn"
    }, ((selWh[k] || 0) * 100).toFixed(0), "%"));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg3)',
      borderRadius: 8,
      border: '1px solid var(--bd)',
      padding: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: 'var(--tx2)',
      marginBottom: 6
    }
  }, "\u8D1F\u8D23\u4EBA / \u5BA2\u6237"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--tx2)'
    }
  }, selWh.manager), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--tx3)',
      marginTop: 4
    }
  }, selWh.client), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--tx3)'
    }
  }, selWh.address))), editing && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "b bga",
    onClick: saveRates
  }, t('wh.f_save')), /*#__PURE__*/React.createElement("button", {
    className: "b bgh",
    onClick: function onClick() {
      return setEditing(false);
    }
  }, t('c.cancel')))), /*#__PURE__*/React.createElement("div", {
    className: "cd",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ct-t"
  }, "\uD83D\uDCCA 10\u4ED3\u5E93\u85AA\u8D44\u5BF9\u6BD4\uFF08P2\u65F6\u85AA\uFF09"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 6,
      height: 80
    }
  }, whs.map(function (w) {
    var v = w.rate_p2 || 14;
    var mx = Math.max.apply(Math, _toConsumableArray(whs.map(function (x) {
      return x.rate_p2 || 14;
    })));
    return /*#__PURE__*/React.createElement("div", {
      key: w.code,
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 8,
        color: 'var(--tx3)',
        marginBottom: 2
      }
    }, v.toFixed(2)), /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        background: w.code === sel ? 'var(--ac)' : 'var(--bd2)',
        borderRadius: '3px 3px 0 0',
        height: Math.max(4, v / mx * 70)
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 8,
        color: w.code === sel ? 'var(--ac2)' : 'var(--tx3)',
        marginTop: 2,
        fontWeight: w.code === sel ? 700 : 400
      }
    }, w.code));
  }))))));
}

// ── COST CALCULATOR ──
function CostCalculator(_ref67) {
  var token = _ref67.token;
  var _useState127 = useState({
      brutto_rate: 14.0,
      weekly_hours: 40,
      emp_type: '正常雇用'
    }),
    _useState128 = _slicedToArray(_useState127, 2),
    form = _useState128[0],
    setForm = _useState128[1];
  var _useState129 = useState(null),
    _useState130 = _slicedToArray(_useState129, 2),
    result = _useState130[0],
    setResult = _useState130[1];
  var _useState131 = useState(false),
    _useState132 = _slicedToArray(_useState131, 2),
    loading = _useState132[0],
    setLoading = _useState132[1];
  var _useLang14 = useLang(),
    t = _useLang14.t;
  var showToast = useToast();
  var calc = /*#__PURE__*/function () {
    var _ref68 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee15() {
      var r, _t13;
      return _regenerator().w(function (_context15) {
        while (1) switch (_context15.p = _context15.n) {
          case 0:
            setLoading(true);
            _context15.p = 1;
            _context15.n = 2;
            return api('/api/cost-calc', {
              method: 'POST',
              body: form,
              token: token
            });
          case 2:
            r = _context15.v;
            setResult(r);
            _context15.n = 4;
            break;
          case 3:
            _context15.p = 3;
            _t13 = _context15.v;
            showToast(_t13.message, 'err');
          case 4:
            _context15.p = 4;
            setLoading(false);
            return _context15.f(4);
          case 5:
            return _context15.a(2);
        }
      }, _callee15, null, [[1, 3, 4, 5]]);
    }));
    return function calc() {
      return _ref68.apply(this, arguments);
    };
  }();
  useEffect(function () {
    calc();
  }, [form.brutto_rate, form.weekly_hours, form.emp_type]);
  return /*#__PURE__*/React.createElement("div", {
    className: "g2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cd"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ct-t"
  }, "\uD83E\uDDEE ", t('cost.title')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--tx3)',
      marginBottom: 14
    }
  }, "\u8BA1\u7B97\u516C\u53F8\u771F\u5B9E\u7528\u4EBA\u6210\u672C = Brutto + \u96C7\u4E3B\u793E\u4FDD + \u5047\u671F\u51C6\u5907\u91D1 + \u7BA1\u7406\u6210\u672C"), /*#__PURE__*/React.createElement("div", {
    className: "fr3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, "Brutto\u65F6\u85AA (\u20AC/h)"), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    type: "number",
    step: "0.10",
    value: form.brutto_rate,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        brutto_rate: +e.target.value
      }));
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      color: form.brutto_rate < 13 ? 'var(--rd)' : 'var(--tx3)'
    }
  }, "\u6700\u4F4E\u5DE5\u8D44 \u20AC13.00/h")), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('cost.f_weekly')), /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: form.weekly_hours,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        weekly_hours: +e.target.value
      }));
    }
  }, [10, 15, 20, 25, 30, 35, 40].map(function (h) {
    return /*#__PURE__*/React.createElement("option", {
      key: h,
      value: h
    }, h, "h/\u5468");
  }))), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('cost.f_type')), /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: form.emp_type,
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        emp_type: e.target.value
      }));
    }
  }, /*#__PURE__*/React.createElement("option", null, "\u6B63\u5E38\u96C7\u7528"), /*#__PURE__*/React.createElement("option", null, "Minijob")))), result && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg3)',
      border: '1px solid var(--bd)',
      borderRadius: 10,
      padding: 14,
      marginBottom: 12
    }
  }, [['月Brutto', "\u20AC".concat((result.gross_monthly || 0).toFixed(2)), 'var(--tx)'], ["\u96C7\u4E3BSV (~20.65%)", "\u20AC".concat((result.employer_ssi || 0).toFixed(2)), 'var(--og)'], ["\u5047\u671F\u51C6\u5907\u91D1 (8.33%)", "\u20AC".concat((result.holiday_provision || 0).toFixed(2)), 'var(--og)'], ["\u7BA1\u7406\u6210\u672C (5%)", "\u20AC".concat((result.mgmt_cost || 0).toFixed(2)), 'var(--og)']].map(function (_ref69) {
    var _ref70 = _slicedToArray(_ref69, 3),
      l = _ref70[0],
      v = _ref70[1],
      c = _ref70[2];
    return /*#__PURE__*/React.createElement("div", {
      key: l,
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 11,
        padding: '5px 0',
        borderBottom: '1px solid var(--bd)30',
        color: c
      }
    }, /*#__PURE__*/React.createElement("span", null, l), /*#__PURE__*/React.createElement("span", {
      className: "mn"
    }, v));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 14,
      fontWeight: 800,
      padding: '10px 0 0',
      color: 'var(--rd)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u516C\u53F8\u6708\u771F\u5B9E\u6210\u672C"), /*#__PURE__*/React.createElement("span", {
    className: "mn"
  }, "\u20AC", (result.total_employer_cost || 0).toFixed(2))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 12,
      fontWeight: 700,
      padding: '4px 0',
      color: 'var(--og)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u771F\u5B9E\u65F6\u5747\u6210\u672C"), /*#__PURE__*/React.createElement("span", {
    className: "mn"
  }, "\u20AC", (result.true_hourly_cost || 0).toFixed(2), "/h"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg3)',
      border: '1px solid var(--bd)',
      borderRadius: 10,
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: 'var(--ac2)',
      marginBottom: 8
    }
  }, "\u5458\u5DE5\u5B9E\u9645\u5230\u624B\uFF08\u53C2\u8003\uFF09"), [['月Brutto', "\u20AC".concat((result.gross_monthly || 0).toFixed(2))], ['员工SV扣款', "-\u20AC".concat((result.employee_ssi || 0).toFixed(2))], ['所得税预估', "-\u20AC".concat((result.income_tax || 0).toFixed(2))]].map(function (_ref71) {
    var _ref72 = _slicedToArray(_ref71, 2),
      l = _ref72[0],
      v = _ref72[1];
    return /*#__PURE__*/React.createElement("div", {
      key: l,
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 11,
        padding: '4px 0',
        borderBottom: '1px solid var(--bd)30'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "tm"
    }, l), /*#__PURE__*/React.createElement("span", {
      className: "mn"
    }, v));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 13,
      fontWeight: 700,
      padding: '8px 0 0',
      color: 'var(--gn)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u6708Netto\uFF08\u4F30\u7B97\uFF09"), /*#__PURE__*/React.createElement("span", {
    className: "mn"
  }, "\u20AC", (result.net_pay || 0).toFixed(2))), result.is_minijob && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: 'var(--og)',
      marginTop: 6
    }
  }, "\u26A0 Minijob: \u5458\u5DE5\u514D\u7F34SV\uFF0C\u516C\u53F8\u652F\u4ED8\u7EA630%\u56FA\u5B9A\u7F34\u8D39")))), /*#__PURE__*/React.createElement("div", {
    className: "cd"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ct-t"
  }, "\uD83D\uDCCA Brutto 14\u20AC/h \u6210\u672C\u901F\u67E5\u8868"), /*#__PURE__*/React.createElement("div", {
    className: "tw"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\u96C7\u4F63\u7C7B\u578B"), /*#__PURE__*/React.createElement("th", null, "\u5468\u65F6"), /*#__PURE__*/React.createElement("th", null, "\u6708\u65F6"), /*#__PURE__*/React.createElement("th", null, "\u6708Brutto"), /*#__PURE__*/React.createElement("th", null, "\u771F\u5B9E\u6210\u672C"), /*#__PURE__*/React.createElement("th", null, "\u65F6\u5747\u6210\u672C"))), /*#__PURE__*/React.createElement("tbody", null, [[14, "Minijob", 10, 43.3, 603, 844, 19.5], [14, "正常雇用", 15, 65.0, 909, 1273, 19.6], [14, "正常雇用", 20, 86.6, 1212, 1697, 19.6], [14, "正常雇用", 25, 108.3, 1516, 2120, 19.6], [14, "正常雇用", 30, 129.9, 1819, 2546, 19.6], [14, "正常雇用", 35, 151.6, 2122, 2970, 19.6], [14, "正常雇用", 40, 173.3, 2426, 3395, 19.6]].map(function (_ref73, i) {
    var _ref74 = _slicedToArray(_ref73, 7),
      r = _ref74[0],
      t = _ref74[1],
      wh = _ref74[2],
      mh = _ref74[3],
      br = _ref74[4],
      tc = _ref74[5],
      hc = _ref74[6];
    return /*#__PURE__*/React.createElement("tr", {
      key: i,
      style: {
        background: form.weekly_hours === wh && form.emp_type === t ? '#4f6ef718' : ''
      }
    }, /*#__PURE__*/React.createElement("td", null, t), /*#__PURE__*/React.createElement("td", {
      className: "mn"
    }, wh, "h"), /*#__PURE__*/React.createElement("td", {
      className: "mn"
    }, mh, "h"), /*#__PURE__*/React.createElement("td", {
      className: "mn"
    }, "\u20AC", br), /*#__PURE__*/React.createElement("td", {
      className: "mn",
      style: {
        color: 'var(--rd)',
        fontWeight: 700
      }
    }, "\u20AC", tc), /*#__PURE__*/React.createElement("td", {
      className: "mn",
      style: {
        color: 'var(--og)',
        fontWeight: 700
      }
    }, "\u20AC", hc, "/h"));
  })))), /*#__PURE__*/React.createElement("div", {
    className: "alert alert-ac",
    style: {
      marginTop: 12,
      fontSize: 10
    }
  }, "\u8BA1\u7B97\u57FA\u51C6: Brutto \u20AC14/h \xB7 \u96C7\u4E3BSV ~21% \xB7 \u5047\u671F8.33% \xB7 \u7BA1\u74065%\u3002Minijob\u6708\u6536\u5165\u2264\u20AC538\uFF0C\u516C\u53F8\u989D\u5916\u7F3415%KV+1.3%RV+0.6%ALV\u224830%\u3002")));
}

// ── SUPPLIERS ──
function Suppliers(_ref75) {
  var token = _ref75.token,
    user = _ref75.user;
  var _useState133 = useState([]),
    _useState134 = _slicedToArray(_useState133, 2),
    sups = _useState134[0],
    setSups = _useState134[1];
  var _useState135 = useState(true),
    _useState136 = _slicedToArray(_useState135, 2),
    loading = _useState136[0],
    setLoading = _useState136[1];
  var _useState137 = useState(''),
    _useState138 = _slicedToArray(_useState137, 2),
    search = _useState138[0],
    setSearch = _useState138[1];
  var _useState139 = useState(''),
    _useState140 = _slicedToArray(_useState139, 2),
    fSt = _useState140[0],
    setFSt = _useState140[1];
  var _useState141 = useState(null),
    _useState142 = _slicedToArray(_useState141, 2),
    editM = _useState142[0],
    setEM = _useState142[1];
  var _useState143 = useState({}),
    _useState144 = _slicedToArray(_useState143, 2),
    form = _useState144[0],
    setForm = _useState144[1];
  var _useLang15 = useLang(),
    t = _useLang15.t;
  var showToast = useToast();
  var RATINGS = ['A', 'B', 'C'];
  var load = useCallback(function () {
    setLoading(true);
    api('/api/suppliers', {
      token: token
    }).then(function (data) {
      var filtered = data;
      if (search) filtered = filtered.filter(function (s) {
        return (s.name || '').toLowerCase().includes(search.toLowerCase()) || (s.id || '').toLowerCase().includes(search.toLowerCase()) || (s.contact_name || '').toLowerCase().includes(search.toLowerCase());
      });
      if (fSt) filtered = filtered.filter(function (s) {
        return s.status === fSt;
      });
      setSups(filtered);
    }).finally(function () {
      return setLoading(false);
    });
  }, [token, search, fSt]);
  useEffect(function () {
    load();
  }, [load]);
  var canEdit = ['admin', 'hr'].includes(user.role);
  var canDelete = user.role === 'admin';
  var openNew = function openNew() {
    setForm({
      name: '',
      biz_line: '渊博',
      contact_name: '',
      phone: '',
      email: '',
      tax_handle: '供应商自行报税',
      rating: 'B',
      status: '合作中',
      notes: ''
    });
    setEM('new');
  };
  var openEdit = function openEdit(s) {
    setForm(_objectSpread({}, s));
    setEM(s.id);
  };
  var save = /*#__PURE__*/function () {
    var _ref76 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee16() {
      var _t14;
      return _regenerator().w(function (_context16) {
        while (1) switch (_context16.p = _context16.n) {
          case 0:
            if (form.name) {
              _context16.n = 1;
              break;
            }
            showToast(t('sup.f_name').replace(' *', '') + '不能为空', 'err');
            return _context16.a(2);
          case 1:
            _context16.p = 1;
            if (!(editM === 'new')) {
              _context16.n = 3;
              break;
            }
            _context16.n = 2;
            return api('/api/suppliers', {
              method: 'POST',
              body: form,
              token: token
            });
          case 2:
            _context16.n = 4;
            break;
          case 3:
            _context16.n = 4;
            return api("/api/suppliers/".concat(editM), {
              method: 'PUT',
              body: form,
              token: token
            });
          case 4:
            setEM(null);
            load();
            showToast(editM === 'new' ? '供应商已创建' : '供应商已更新');
            _context16.n = 6;
            break;
          case 5:
            _context16.p = 5;
            _t14 = _context16.v;
            showToast(_t14.message, 'err');
          case 6:
            return _context16.a(2);
        }
      }, _callee16, null, [[1, 5]]);
    }));
    return function save() {
      return _ref76.apply(this, arguments);
    };
  }();
  var deactivate = /*#__PURE__*/function () {
    var _ref77 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee17(id) {
      var _t15;
      return _regenerator().w(function (_context17) {
        while (1) switch (_context17.p = _context17.n) {
          case 0:
            _context17.p = 0;
            _context17.n = 1;
            return api("/api/suppliers/".concat(id), {
              method: 'DELETE',
              token: token
            });
          case 1:
            load();
            showToast('已停止合作');
            _context17.n = 3;
            break;
          case 2:
            _context17.p = 2;
            _t15 = _context17.v;
            showToast(_t15.message, 'err');
          case 3:
            return _context17.a(2);
        }
      }, _callee17, null, [[0, 2]]);
    }));
    return function deactivate(_x6) {
      return _ref77.apply(this, arguments);
    };
  }();
  var ratingColor = {
    'A': 'var(--gn)',
    'B': 'var(--og)',
    'C': 'var(--rd)'
  };
  var statusColor = {
    '合作中': 'var(--gn)',
    '停止合作': 'var(--rd)'
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ab"
  }, /*#__PURE__*/React.createElement("input", {
    className: "si",
    placeholder: t('sup.search'),
    value: search,
    onChange: function onChange(e) {
      return setSearch(e.target.value);
    }
  }), [['', 'c.all'], ['合作中', '合作中'], ['停止合作', '停止合作']].map(function (_ref78) {
    var _ref79 = _slicedToArray(_ref78, 2),
      s = _ref79[0],
      tk = _ref79[1];
    return /*#__PURE__*/React.createElement("button", {
      key: s,
      className: "fb ".concat(fSt === s ? 'on' : ''),
      onClick: function onClick() {
        return setFSt(s);
      }
    }, s === '' ? t('c.all') : s);
  }), /*#__PURE__*/React.createElement("div", {
    className: "ml"
  }, canEdit && /*#__PURE__*/React.createElement("button", {
    className: "b bga",
    onClick: openNew
  }, t('sup.add')))), loading ? /*#__PURE__*/React.createElement(Loading, null) : /*#__PURE__*/React.createElement("div", {
    className: "tw"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ts"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, t('sup.col_id')), /*#__PURE__*/React.createElement("th", null, t('sup.col_name')), /*#__PURE__*/React.createElement("th", null, t('sup.col_biz')), /*#__PURE__*/React.createElement("th", null, t('sup.col_contact')), /*#__PURE__*/React.createElement("th", null, t('sup.col_phone')), /*#__PURE__*/React.createElement("th", null, t('sup.col_email')), /*#__PURE__*/React.createElement("th", null, t('sup.col_rating')), /*#__PURE__*/React.createElement("th", null, t('sup.col_status')), /*#__PURE__*/React.createElement("th", null, t('c.action')))), /*#__PURE__*/React.createElement("tbody", null, sups.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 9,
    style: {
      textAlign: 'center',
      color: 'var(--tx3)',
      padding: 24
    }
  }, t('c.no_data'))) : sups.map(function (s) {
    return /*#__PURE__*/React.createElement("tr", {
      key: s.id
    }, /*#__PURE__*/React.createElement("td", {
      className: "mn gn fw6"
    }, s.id), /*#__PURE__*/React.createElement("td", {
      className: "fw6"
    }, s.name), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Bg, {
      t: s.biz_line
    })), /*#__PURE__*/React.createElement("td", null, s.contact_name), /*#__PURE__*/React.createElement("td", {
      className: "tm"
    }, s.phone), /*#__PURE__*/React.createElement("td", {
      className: "tm",
      style: {
        fontSize: 10
      }
    }, s.email), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      style: {
        color: ratingColor[s.rating] || 'var(--tx3)',
        fontWeight: 700
      }
    }, s.rating)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      style: {
        color: statusColor[s.status] || 'var(--tx3)',
        fontSize: 10,
        fontWeight: 600
      }
    }, s.status)), /*#__PURE__*/React.createElement("td", {
      style: {
        display: 'flex',
        gap: 4
      }
    }, canEdit && /*#__PURE__*/React.createElement("button", {
      className: "b bgh",
      style: {
        fontSize: 9
      },
      onClick: function onClick() {
        return openEdit(s);
      }
    }, t('c.edit')), canDelete && s.status === '合作中' && /*#__PURE__*/React.createElement("button", {
      className: "b bgr",
      style: {
        fontSize: 9
      },
      onClick: function onClick() {
        return deactivate(s.id);
      }
    }, "\u505C\u5408\u4F5C")));
  }))))), editM && /*#__PURE__*/React.createElement(Modal, {
    title: editM === 'new' ? t('sup.add_title') : t('sup.edit_title'),
    onClose: function onClose() {
      return setEM(null);
    },
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "b bgh",
      onClick: function onClick() {
        return setEM(null);
      }
    }, t('c.cancel')), /*#__PURE__*/React.createElement("button", {
      className: "b bga",
      onClick: save
    }, t('c.save')))
  }, /*#__PURE__*/React.createElement("div", {
    className: "fr"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fg ful"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('sup.f_name')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    value: form.name || '',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        name: e.target.value
      }));
    },
    autoFocus: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('sup.f_biz')), /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: form.biz_line || '渊博',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        biz_line: e.target.value
      }));
    }
  }, /*#__PURE__*/React.createElement("option", null, "\u6E0A\u535A"), /*#__PURE__*/React.createElement("option", null, "579"))), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('sup.f_contact')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    value: form.contact_name || '',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        contact_name: e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('sup.f_phone')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    value: form.phone || '',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        phone: e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('sup.f_email')), /*#__PURE__*/React.createElement("input", {
    className: "fi",
    type: "email",
    value: form.email || '',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        email: e.target.value
      }));
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('sup.f_tax')), /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: form.tax_handle || '供应商自行报税',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        tax_handle: e.target.value
      }));
    }
  }, /*#__PURE__*/React.createElement("option", null, "\u4F9B\u5E94\u5546\u81EA\u884C\u62A5\u7A0E"), /*#__PURE__*/React.createElement("option", null, "\u6211\u65B9\u4EE3\u62A5\u7A0E"))), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('sup.f_rating')), /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: form.rating || 'B',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        rating: e.target.value
      }));
    }
  }, RATINGS.map(function (r) {
    return /*#__PURE__*/React.createElement("option", {
      key: r
    }, r);
  }))), /*#__PURE__*/React.createElement("div", {
    className: "fg"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('c.status')), /*#__PURE__*/React.createElement("select", {
    className: "fsl",
    value: form.status || '合作中',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        status: e.target.value
      }));
    }
  }, /*#__PURE__*/React.createElement("option", null, "\u5408\u4F5C\u4E2D"), /*#__PURE__*/React.createElement("option", null, "\u505C\u6B62\u5408\u4F5C"))), /*#__PURE__*/React.createElement("div", {
    className: "fg ful"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fl"
  }, t('sup.f_notes')), /*#__PURE__*/React.createElement("textarea", {
    className: "fta",
    value: form.notes || '',
    onChange: function onChange(e) {
      return setForm(_objectSpread(_objectSpread({}, form), {}, {
        notes: e.target.value
      }));
    }
  })))));
}

// ── MAIN APP ──
var NAV = [{
  k: 'dashboard',
  i: '📊',
  labelKey: 'nav.dashboard',
  roles: ['admin', 'hr', 'wh', 'fin', 'mgr', 'sup']
}, {
  k: 'employees',
  i: '👥',
  labelKey: 'nav.employees',
  roles: ['admin', 'hr', 'wh', 'fin', 'mgr', 'sup']
}, {
  k: 'timesheets',
  i: '⏱️',
  labelKey: 'nav.timesheets',
  roles: ['admin', 'hr', 'wh', 'fin', 'mgr', 'sup']
}, {
  k: 'zeitkonto',
  i: '⏳',
  labelKey: 'nav.zeitkonto',
  roles: ['admin', 'hr', 'mgr']
}, {
  k: 'settlement',
  i: '💰',
  labelKey: 'nav.settlement',
  roles: ['admin', 'hr', 'fin', 'sup', 'mgr']
}, {
  k: 'containers',
  i: '📦',
  labelKey: 'nav.containers',
  roles: ['admin', 'hr', 'wh', 'mgr']
}, {
  sep: true
}, {
  k: 'werkvertrag',
  i: '📋',
  labelKey: 'nav.werkvertrag',
  roles: ['admin', 'hr', 'mgr']
}, {
  k: 'abmahnung',
  i: '⚠️',
  labelKey: 'nav.abmahnung',
  roles: ['admin', 'hr', 'mgr']
}, {
  k: 'suppliers',
  i: '🏢',
  labelKey: 'nav.suppliers',
  roles: ['admin', 'hr', 'mgr']
}, {
  sep: true
}, {
  k: 'clock',
  i: '⏰',
  labelKey: 'nav.clock',
  roles: ['admin', 'hr', 'wh', 'mgr', 'worker', 'sup']
}, {
  k: 'grades',
  i: '🏅',
  labelKey: 'nav.grades',
  roles: ['admin', 'hr', 'mgr']
}, {
  k: 'warehouse_rates',
  i: '🏭',
  labelKey: 'nav.warehouse_rates',
  roles: ['admin', 'hr', 'mgr', 'wh']
}, {
  k: 'cost_calc',
  i: '🧮',
  labelKey: 'nav.cost_calc',
  roles: ['admin', 'hr', 'mgr', 'fin']
}, {
  k: 'docs',
  i: '📚',
  labelKey: 'nav.docs',
  roles: ['admin', 'hr', 'wh', 'fin', 'mgr', 'sup', 'worker']
}, {
  k: 'logs',
  i: '📝',
  labelKey: 'nav.logs',
  roles: ['admin', 'hr']
}];
function App() {
  var _NAV$find, _user$display_name, _user$display_name2;
  var _useState145 = useState(function () {
      return localStorage.getItem('hr6_lang') || 'zh';
    }),
    _useState146 = _slicedToArray(_useState145, 2),
    lang = _useState146[0],
    setLang = _useState146[1];
  var t = function t(key) {
    return (I18N[lang] || I18N.zh)[key] || I18N.zh[key] || key;
  };
  var _useState147 = useState(function () {
      return localStorage.getItem('hr6_token') || null;
    }),
    _useState148 = _slicedToArray(_useState147, 2),
    token = _useState148[0],
    setToken = _useState148[1];
  var _useState149 = useState(function () {
      try {
        return JSON.parse(localStorage.getItem('hr6_user')) || null;
      } catch (_unused) {
        return null;
      }
    }),
    _useState150 = _slicedToArray(_useState149, 2),
    user = _useState150[0],
    setUser = _useState150[1];
  var _useState151 = useState('dashboard'),
    _useState152 = _slicedToArray(_useState151, 2),
    page = _useState152[0],
    setPage = _useState152[1];
  var _useState153 = useState(null),
    _useState154 = _slicedToArray(_useState153, 2),
    toast = _useState154[0],
    setToast = _useState154[1];
  var _useState155 = useState(false),
    _useState156 = _slicedToArray(_useState155, 2),
    mobNav = _useState156[0],
    setMN = _useState156[1];
  var _useState157 = useState(false),
    _useState158 = _slicedToArray(_useState157, 2),
    srvReady = _useState158[0],
    setSrvReady = _useState158[1];
  var _useState159 = useState(''),
    _useState160 = _slicedToArray(_useState159, 2),
    srvStatus = _useState160[0],
    setSrvStatus = _useState160[1];
  useEffect(function () {
    document.documentElement.dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('hr6_lang', lang);
  }, [lang]);
  useEffect(function () {
    var cancelled = false;
    var _check = /*#__PURE__*/function () {
      var _ref80 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee18() {
        var r, j, _t16;
        return _regenerator().w(function (_context18) {
          while (1) switch (_context18.p = _context18.n) {
            case 0:
              _context18.p = 0;
              _context18.n = 1;
              return fetch(BASE + HEALTH_ENDPOINT);
            case 1:
              r = _context18.v;
              if (!cancelled) {
                _context18.n = 2;
                break;
              }
              return _context18.a(2);
            case 2:
              if (!r.ok) {
                _context18.n = 3;
                break;
              }
              setSrvReady(true);
              _context18.n = 6;
              break;
            case 3:
              if (!(r.status === 503)) {
                _context18.n = 5;
                break;
              }
              _context18.n = 4;
              return r.json().catch(function () {
                return {};
              });
            case 4:
              j = _context18.v;
              setSrvStatus(j.status || 'initializing');
              localStorage.removeItem('hr6_token');
              localStorage.removeItem('hr6_user');
              setToken(null);
              setUser(null);
              setTimeout(_check, HEALTH_POLL_INTERVAL_MS);
              _context18.n = 6;
              break;
            case 5:
              setSrvReady(true);
            case 6:
              _context18.n = 8;
              break;
            case 7:
              _context18.p = 7;
              _t16 = _context18.v;
              if (!cancelled) setSrvReady(true);
            case 8:
              return _context18.a(2);
          }
        }, _callee18, null, [[0, 7]]);
      }));
      return function check() {
        return _ref80.apply(this, arguments);
      };
    }();
    _check();
    return function () {
      cancelled = true;
    };
  }, []);
  var onLogin = function onLogin(tk, u) {
    setToken(tk);
    setUser(u);
    localStorage.setItem('hr6_token', tk);
    localStorage.setItem('hr6_user', JSON.stringify(u));
    setPage(u.role === 'worker' ? 'clock' : 'dashboard');
  };
  var onLogout = function onLogout() {
    api('/api/auth/logout', {
      method: 'POST',
      token: token
    }).catch(function () {});
    setToken(null);
    setUser(null);
    localStorage.removeItem('hr6_token');
    localStorage.removeItem('hr6_user');
  };
  var toast_ = useCallback(function (m) {
    var tp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'ok';
    setToast({
      m: m,
      t: tp
    });
    setTimeout(function () {
      return setToast(null);
    }, 2500);
  }, []);
  var navItems = token && user ? NAV.filter(function (n) {
    return !n.k || !n.roles || n.roles.includes(user.role);
  }) : [];
  var go = function go(k) {
    setPage(k);
    setMN(false);
  };
  var pageLabel = (_NAV$find = NAV.find(function (n) {
    return n.k === page;
  })) !== null && _NAV$find !== void 0 && _NAV$find.labelKey ? t(NAV.find(function (n) {
    return n.k === page;
  }).labelKey) : page;
  var colors = {
    admin: '#4f6ef7',
    hr: '#a78bfa',
    wh: '#f5a623',
    fin: '#2dd4a0',
    mgr: '#ff6b9d',
    sup: '#f0526c',
    worker: '#38bdf8'
  };
  var roleColor = user ? colors[user.role] || '#6a7498' : '#6a7498';
  if (!srvReady) return /*#__PURE__*/React.createElement(LangCtx.Provider, {
    value: {
      t: t,
      lang: lang,
      setLang: setLang
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      border: '3px solid var(--bd)',
      borderTopColor: 'var(--ac)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--tx3)'
    }
  }, t('c.starting')), srvStatus && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: 'var(--tx3)',
      opacity: .6
    }
  }, srvStatus)));
  if (!token || !user) return /*#__PURE__*/React.createElement(LangCtx.Provider, {
    value: {
      t: t,
      lang: lang,
      setLang: setLang
    }
  }, /*#__PURE__*/React.createElement(ToastCtx.Provider, {
    value: toast_
  }, /*#__PURE__*/React.createElement(Login, {
    onLogin: onLogin
  })));
  var sidebar = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "sb-hd"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sb-logo"
  }, "\u6E0A"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sb-t"
  }, "\u6E0A\u535A+579"), /*#__PURE__*/React.createElement("div", {
    className: "sb-s"
  }, "HR V7 \xB7 LIVE"))), /*#__PURE__*/React.createElement("div", {
    className: "nav"
  }, navItems.map(function (n, i) {
    return n.sep ? /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "nsep"
    }) : /*#__PURE__*/React.createElement("button", {
      key: n.k,
      className: "ni ".concat(page === n.k ? 'on' : ''),
      onClick: function onClick() {
        return go(n.k);
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "ni-i"
    }, n.i), /*#__PURE__*/React.createElement("span", null, t(n.labelKey)));
  })), /*#__PURE__*/React.createElement("div", {
    className: "sb-ft"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sb-btn",
    style: {
      cursor: 'default',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ua",
    style: {
      background: roleColor
    }
  }, ((_user$display_name = user.display_name) === null || _user$display_name === void 0 ? void 0 : _user$display_name[0]) || '?'), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      color: 'var(--tx)'
    }
  }, user.display_name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: 'var(--tx3)'
    }
  }, user.role))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '4px 8px 8px'
    }
  }, /*#__PURE__*/React.createElement(LangSwitcher, null)), /*#__PURE__*/React.createElement("button", {
    className: "sb-btn dg",
    onClick: onLogout
  }, "\uD83D\uDEAA ", t('c.logout'))));
  return /*#__PURE__*/React.createElement(LangCtx.Provider, {
    value: {
      t: t,
      lang: lang,
      setLang: setLang
    }
  }, /*#__PURE__*/React.createElement(ToastCtx.Provider, {
    value: toast_
  }, /*#__PURE__*/React.createElement("div", {
    className: "app"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sidebar ".concat(mobNav ? 'open' : '')
  }, sidebar), /*#__PURE__*/React.createElement("div", {
    className: "mob-overlay ".concat(mobNav ? 'show' : ''),
    onClick: function onClick() {
      return setMN(false);
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mob-hdr"
  }, /*#__PURE__*/React.createElement("button", {
    className: "mob-menu-btn",
    onClick: function onClick() {
      return setMN(true);
    }
  }, "\u2630"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 14,
      fontWeight: 700
    }
  }, pageLabel)), /*#__PURE__*/React.createElement("div", {
    className: "hdr"
  }, /*#__PURE__*/React.createElement("h1", null, pageLabel), /*#__PURE__*/React.createElement("div", {
    className: "hdr-r"
  }, /*#__PURE__*/React.createElement("div", {
    className: "uc"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ua",
    style: {
      background: roleColor
    }
  }, (_user$display_name2 = user.display_name) === null || _user$display_name2 === void 0 ? void 0 : _user$display_name2[0]), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "un"
  }, user.display_name), /*#__PURE__*/React.createElement("div", {
    className: "ur"
  }, user.role))))), /*#__PURE__*/React.createElement("div", {
    className: "ct"
  }, page === 'dashboard' && /*#__PURE__*/React.createElement(Dashboard, {
    token: token
  }), page === 'employees' && /*#__PURE__*/React.createElement(Employees, {
    token: token,
    user: user
  }), page === 'timesheets' && /*#__PURE__*/React.createElement(Timesheets, {
    token: token,
    user: user
  }), page === 'zeitkonto' && /*#__PURE__*/React.createElement(Zeitkonto, {
    token: token,
    user: user
  }), page === 'settlement' && /*#__PURE__*/React.createElement(Settlement, {
    token: token
  }), page === 'containers' && /*#__PURE__*/React.createElement(Containers, {
    token: token,
    user: user
  }), page === 'werkvertrag' && /*#__PURE__*/React.createElement(Werkvertrag, {
    token: token,
    user: user
  }), page === 'abmahnung' && /*#__PURE__*/React.createElement(Abmahnung, {
    token: token,
    user: user
  }), page === 'suppliers' && /*#__PURE__*/React.createElement(Suppliers, {
    token: token,
    user: user
  }), page === 'clock' && /*#__PURE__*/React.createElement(Clock, {
    token: token,
    user: user
  }), page === 'logs' && /*#__PURE__*/React.createElement(AuditLogs, {
    token: token
  }), page === 'docs' && /*#__PURE__*/React.createElement(KnowledgeBase, {
    token: token,
    user: user
  }), page === 'grades' && /*#__PURE__*/React.createElement(GradeSalaries, {
    token: token
  }), page === 'warehouse_rates' && /*#__PURE__*/React.createElement(WarehouseRates, {
    token: token,
    user: user
  }), page === 'cost_calc' && /*#__PURE__*/React.createElement(CostCalculator, {
    token: token
  }))), toast && /*#__PURE__*/React.createElement("div", {
    className: "toast ".concat(toast.t === 'err' ? 'ter' : toast.t === 'warn' ? 'tow' : 'tok')
  }, toast.m))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
