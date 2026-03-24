const SC = {
  '已入账':'#2dd4a0','待财务确认':'#f97316','待仓库审批':'#f5a623','驳回':'#f0526c',
  '在职':'#2dd4a0','离职':'#f0526c','自有':'#4f6ef7','供应商':'#f97316',
  '渊博':'#4f6ef7','579':'#f97316','合作中':'#2dd4a0','有效':'#f0526c',
  '已撤销':'#6a7498','进行中':'#f5a623','已完成':'#2dd4a0',
  'A':'#2dd4a0','B':'#f5a623','C':'#f0526c',
};

export function StatusBadge({ value }) {
  const color = SC[value] || '#6a7498';
  return (
    <span
      className="bg"
      style={{ background: color + '1a', color, border: `1px solid ${color}33` }}
    >
      {value}
    </span>
  );
}

export function fmt(n) {
  return typeof n === 'number' ? n.toFixed(2) : '0.00';
}

export function fmtE(n) {
  return (+(n || 0)).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
