export default function MobileNav({ isOpen, onClose }) {
  return (
    <div className={`mob-overlay ${isOpen ? 'show' : ''}`} onClick={onClose} />
  );
}
