export default function FormField({ label, required, children, className = 'fg' }) {
  return (
    <div className={className}>
      <label className="fl">{label}{required && <span style={{ color:'var(--rd)',marginLeft:2 }}>*</span>}</label>
      {children}
    </div>
  );
}
