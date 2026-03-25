export function Modal({ title, onClose, children, footer, wide }) {
  return (
    <div className="mo" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="md" style={wide ? { maxWidth: 960 } : {}}>
        <div className="md-h">
          <h3>{title}</h3>
          <button className="md-x" onClick={onClose}>✕</button>
        </div>
        <div className="md-b">{children}</div>
        {footer && <div className="md-f">{footer}</div>}
      </div>
    </div>
  );
}
