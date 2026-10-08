export const ROLE_META = {
  admin:  { label: '管理员',   desc: '全部功能与系统配置', color: '#4f6ef7' },
  hr:     { label: 'HR',       desc: '员工、工时、报价、派遣', color: '#a78bfa' },
  mgr:    { label: '运营经理', desc: '运营数据与审批', color: '#ff6b9d' },
  fin:    { label: '财务',     desc: '工时审批、月度结算', color: '#2dd4a0' },
  wh:     { label: '仓库管理', desc: '仅绑定仓库的数据', color: '#f5a623' },
  sup:    { label: '劳务供应商', desc: '仅本供应商员工', color: '#f0526c' },
  worker: { label: '工人',     desc: '打卡、报工、个人绩效', color: '#38bdf8' },
  client: { label: '甲方（仓库方）', desc: '仅看绑定仓库的运营看板', color: '#0ea5a4' },
};
export const ROLES = Object.keys(ROLE_META);

export function initials(name) {
  return (name || '?').trim().slice(0, 1).toUpperCase();
}

export function timeAgo(iso) {
  if (!iso) return '从未';
  const t = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z').getTime();
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return '刚刚';
  if (s < 3600) return `${Math.floor(s / 60)} 分钟前`;
  if (s < 86400) return `${Math.floor(s / 3600)} 小时前`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} 天前`;
  return iso.slice(0, 10);
}
