import { useLang } from '../context/LangContext.jsx';

export function Spinner() {
  return <span className="spin">⟳</span>;
}

export function Loading() {
  const { t } = useLang();
  return (
    <div className="loading">
      <Spinner /> {t('c.loading')}
    </div>
  );
}
