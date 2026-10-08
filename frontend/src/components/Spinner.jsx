import { useLang } from '../context/LangContext.jsx';
import { Loader2 } from 'lucide-react';

export function Spinner() {
  return <span className="spin" style={{ display: 'inline-flex' }}><Loader2 size={16} strokeWidth={1.75} /></span>;
}

export function Loading() {
  const { t } = useLang();
  return (
    <div className="loading">
      <Spinner /> {t('c.loading')}
    </div>
  );
}
