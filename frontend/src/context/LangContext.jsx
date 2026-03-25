import { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, { RTL_LANGS, LANG_OPTIONS } from '../i18n/index.js';

const LangCtx = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('hr7_lang') || 'zh');

  const setLang = (l) => {
    setLangState(l);
    localStorage.setItem('hr7_lang', l);
    i18n.changeLanguage(l);
    document.documentElement.dir = RTL_LANGS.has(l) ? 'rtl' : 'ltr';
    document.documentElement.lang = l;
  };

  useEffect(() => {
    document.documentElement.dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LangCtx.Provider value={{ lang, setLang }}>
      {children}
    </LangCtx.Provider>
  );
}

export function useLang() {
  const { t } = useTranslation();
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return { t, lang: ctx.lang, setLang: ctx.setLang };
}

export function LangSwitcher() {
  const { lang, setLang } = useContext(LangCtx);
  return (
    <select
      value={lang}
      onChange={e => setLang(e.target.value)}
      style={{ fontSize: 10, padding: '2px 4px', borderRadius: 4, border: '1px solid var(--bd)', background: 'var(--bg2)', color: 'var(--tx)', cursor: 'pointer' }}
    >
      {LANG_OPTIONS.map(([code, label]) => (
        <option key={code} value={code}>{label}</option>
      ))}
    </select>
  );
}
