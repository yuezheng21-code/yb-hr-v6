import { createContext, useContext, useState, useEffect } from 'react';
import { translate, RTL_LANGS, LANG_OPTIONS } from '../i18n/index.js';

export const LangCtx = createContext({ t: k => k, lang: 'zh', setLang: () => {} });

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('hr6_lang') || 'zh');

  const setLang = (l) => {
    setLangState(l);
    localStorage.setItem('hr6_lang', l);
  };

  useEffect(() => {
    document.documentElement.dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key) => translate(lang, key);

  return <LangCtx.Provider value={{ t, lang, setLang }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}

export function LangSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <select
      className="fsl lang-sw"
      value={lang}
      onChange={e => setLang(e.target.value)}
    >
      {LANG_OPTIONS.map(([k, label]) => (
        <option key={k} value={k}>{label}</option>
      ))}
    </select>
  );
}
