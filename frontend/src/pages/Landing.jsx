import { useState, useEffect } from 'react';
import { useLang } from '../context/LangContext.jsx';
import '../styles/landing.css';

/*
 * Public website: company intro (from the IWO whitepaper), business inquiry → leads,
 * job application → talent pool, and the login entry. No auth required.
 */

const T = {
  de: {
    nav: { services: 'Leistungen', approach: 'Über uns', business: 'Für Unternehmen', jobs: 'Karriere', login: 'Login' },
    hero: {
      kicker: 'IWO · Integrated Warehouse Operations',
      title: 'Lagerlogistik, die planbar liefert.',
      sub: 'Personaldienstleistung und Betriebsführung für Amazon- und TEMU-Lager, Container-Be- und Entladung sowie Logistikprojekte – mit starkem Management, belastbaren Daten und einem verlässlichen Partnernetzwerk.',
      cta1: 'Personal anfragen', cta2: 'Jetzt bewerben',
    },
    services: {
      title: 'Leistungen',
      sub: 'Vom einzelnen Modul bis zur Betriebsführung vor Ort. Sie behalten Geschäftshoheit, Prognosen, Budget und Abnahme.',
      items: [
        ['Amazon & TEMU Lager', 'Wareneingang, Kommissionierung, Verpackung, FBA-Vorbereitung, Retouren – mit geschulten, mehrsprachigen Teams.'],
        ['Container Be- & Entladung', '20′/40′/45′ und LKW, lose oder palettiert, inkl. Sortierung und Palettierung. Abrechnung pro Container, Palette oder Stück.'],
        ['Modulbetrieb', 'Klar abgegrenzte Module wie Entladung + Sortierung, VAS oder Retouren – mit eigener Organisation und Verantwortung (Werkvertrag).'],
        ['Personalgestellung', 'Flexible Kapazität für Spitzen und Saison – über zugelassene Partner nach AÜG, mit klarer Weisungs- und Arbeitgeberzuordnung.'],
        ['Betriebsführung vor Ort', 'Site Management: Planung, Koordination, Tagesreport, Qualitätskreislauf und Ansprechpartner direkt im Lager.'],
        ['Lieferanten- & Kapazitätsmanagement', 'Zulassung, bestätigte Kapazitäten, Abgleich und Bewertung von Personal- und Equipmentpartnern.'],
      ],
    },
    approach: {
      title: 'Unser Ansatz',
      lead: 'Kunden kaufen bei uns keine Köpfe, sondern Betriebsfähigkeit: im vereinbarten Leistungsumfang stabil Qualität, Termintreue und Stückkostenziele erreichen.',
      flow: ['Bedarf', 'Arbeitsauftrag', 'Ressourcenplan', 'Ausführung & Nachweis', 'Abrechnung', 'Bessere Entscheidung'],
      pillars: [
        ['Starkes Management', 'Ein Team, das die Ausführung selbstständig organisiert: Site Manager, Teamleitung, Daten & Qualität, Einkauf/Partner.'],
        ['Starke Daten', 'Jeder Arbeitsschritt mit Zeit, Menge, Qualität, Kosten und Abweichungen – nachvollziehbar bis zur Abrechnung. Ihr Live-Dashboard zeigt Leistung, Effizienz und Fehlerquote.'],
        ['Starke Lieferkette', 'Ein Partnernetz mit real abrufbarer Kapazität – Haupt-, Ersatz- und Notfallpartner je Kernqualifikation.'],
        ['Kontinuierliche Verbesserung', 'Daten → Ursache → Maßnahme → Wirkung prüfen → Standard aktualisieren. Einsparungen werden nur auf Basis verifizierter Ergebnisse abgerechnet.'],
      ],
      pilotTitle: 'Start mit einem 90-Tage-Pilot',
      pilot: [
        ['Tag 1–15', 'Modul wählen, Grenzen, Datenquellen, Verantwortung und Kennzahlen festlegen'],
        ['Tag 16–30', 'Aufträge, Zeiten, Abweichungen und Abnahme im Testbetrieb – täglich abgleichbar'],
        ['Tag 31–60', 'Zeitstandards, Kosten und Kapazitäten berechnen, Einsatzplanung vorschlagen'],
        ['Tag 61–90', 'Verbesserungen erproben, Finanzen prüfen, SOP V2 und Übertragungsplan'],
      ],
      compliance: 'Rechtssicher aufgestellt: Personalüberlassung und Werkvertrag werden je Modul getrennt geführt (tatsächliche Arbeitgeber- und Weisungsverhältnisse, § 1 AÜG). Personenbezogene Daten verarbeiten wir zweckgebunden und datensparsam nach DSGVO.',
    },
    business: {
      title: 'Für Unternehmen', sub: 'Beschreiben Sie Ihren Bedarf – wir melden uns in der Regel innerhalb eines Werktags mit Rückfragen oder einem Angebot.',
      company: 'Firma *', contact: 'Ansprechpartner *', email: 'E-Mail *', phone: 'Telefon', location: 'Standort / Lager',
      services: 'Benötigte Leistungen', headcount: 'Personalbedarf (ca.)', volume: 'Volumen (z. B. 15 Container/Woche)',
      start: 'Start ab', duration: 'Dauer', durations: ['Kurzfristig / Saison', 'Bis 6 Monate', 'Langfristig'], shifts: 'Schichten (z. B. Früh/Spät, Wochenende)',
      message: 'Weitere Informationen', submit: 'Anfrage senden', done: 'Vielen Dank! Ihre Anfrage ist eingegangen. Referenz: ',
    },
    svc: { amazon: 'Amazon / FBA', temu: 'TEMU / E-Commerce', container: 'Container Be-/Entladung', warehouse: 'Lagerprozesse', project: 'Projekt / Werkvertrag', leasing: 'Personalüberlassung', operations: 'Betriebsführung vor Ort' },
    jobs: {
      title: 'Karriere', sub: 'Lagerhelfer, Kommissionierer, Staplerfahrer, Container-Entlader und Teamleiter (m/w/d). Pünktliche Bezahlung, Einarbeitung mit klaren SOPs, mehrsprachige Teams.',
      open: 'Offene Stellen', none: 'Aktuell keine ausgeschriebenen Stellen – Initiativbewerbungen sind jederzeit willkommen.',
      apply: 'Bewerben', people: 'Personen', from: 'ab',
      name: 'Vor- und Nachname *', phone: 'Telefon / WhatsApp *', email: 'E-Mail', nationality: 'Staatsangehörigkeit', languages: 'Sprachen',
      position: 'Gewünschte Tätigkeit', positions: ['Lagerhelfer', 'Kommissionierer', 'Staplerfahrer', 'Container-Entlader', 'Teamleiter'],
      location: 'Bevorzugter Ort', available: 'Verfügbar ab', forklift: 'Ich habe einen Staplerschein',
      permit: 'Arbeitserlaubnis', permits: ['EU-Bürger/in', 'Aufenthaltstitel mit Arbeitserlaubnis', 'Benötige Unterstützung'],
      experience: 'Erfahrung (kurz)', cv: 'Lebenslauf (PDF, Foto oder Word, max. 15 MB)', submit: 'Bewerbung senden', forJob: 'Bewerbung für',
      done: 'Vielen Dank für Ihre Bewerbung! Wir melden uns telefonisch oder per WhatsApp.',
    },
    consent: 'Ich stimme der Verarbeitung meiner Angaben zur Bearbeitung meiner Anfrage zu (DSGVO). *',
    footer: { contact: 'Kontakt', staff: 'Mitarbeiter-Login', imprint: 'Impressum', privacy: 'Datenschutz', rights: 'Alle Rechte vorbehalten.' },
    err: 'Senden fehlgeschlagen: ',
  },
  zh: {
    nav: { services: '服务', approach: '关于我们', business: '企业合作', jobs: '加入我们', login: '登录' },
    hero: {
      kicker: 'IWO · 仓储运营整合',
      title: '强管理、强数据、强供应链',
      sub: '为 Amazon、TEMU 仓库提供人力与驻场运营服务，承接装卸柜与仓储项目——从现场执行到可复制的交付能力。',
      cta1: '企业需求咨询', cta2: '我要求职',
    },
    services: {
      title: '服务范围',
      sub: '从单一作业模块到整仓驻场管理。客户保留业务所有权、预测输入、预算审批和验收权。',
      items: [
        ['Amazon / TEMU 仓内作业', '收货、拣货、打包、FBA 备货、退货处理，培训上岗的多语言团队。'],
        ['装卸柜', '20/40/45 尺柜及 LKW，散装或托装，含分拣打托；可按柜、托或件计费。'],
        ['模块运营', '卸柜+分拣打托、增值服务、退货等边界清晰的模块，我方独立组织与履约（Werkvertrag）。'],
        ['人员派遣', '旺季与峰值的弹性用工，经持证合作方依 AÜG 合规派遣，雇主与指挥关系清晰。'],
        ['驻场管理', 'Site Manager 驻仓：计划、协调、日报、质量闭环，客户的一站式接口。'],
        ['供应商与容量管理', '准入、容量确认、对账与评价，管理人员与设备合作伙伴。'],
      ],
    },
    approach: {
      title: '我们的理念',
      lead: '客户购买的不是人数，而是运营能力：在约定的业务范围、预测与资源条件下，稳定达到质量、时效和单位成本目标。',
      flow: ['需求', '工单', '资源计划', '执行与证据', '结算', '更好的决策'],
      pillars: [
        ['强管理', '能独立组织执行的管理团队：项目负责人、班组负责人、数据与质量负责人、采购/供应商接口。'],
        ['强数据', '每个作业步骤记录时间、产量、质量、成本与异常，可追溯至结算；甲方可在线查看作业量、效率与差错率。'],
        ['强供应链', '具有实际可调用容量的供应商网络，关键技能设主力、替补、应急三层。'],
        ['持续改善', '数据→解释→行动→结果验证→标准更新；节省分成只基于经客户验证的净改善。'],
      ],
      pilotTitle: '从 90 天试点开始',
      pilot: [
        ['第 1–15 天', '选模块，定义边界、数据来源、责任和指标'],
        ['第 16–30 天', '工单、时段、异常、验收试运行，每日可对账'],
        ['第 31–60 天', '形成工时标准、成本与供应商容量，给出排产建议'],
        ['第 61–90 天', '改善实验、财务复核、SOP V2 与复制清单'],
      ],
      compliance: '合规经营：人员派遣与独立承包按模块分别记录实际雇主与指挥关系（AÜG §1）；个人数据遵循 GDPR 目的限制与数据最小化原则。',
    },
    business: {
      title: '企业合作', sub: '留下您的需求，我们通常在一个工作日内联系您，确认细节并提供报价。',
      company: '公司名称 *', contact: '联系人 *', email: '邮箱 *', phone: '电话', location: '仓库地点',
      services: '需要的服务', headcount: '预计人数', volume: '业务量（如每周 15 个柜）',
      start: '期望开始', duration: '合作期限', durations: ['短期 / 旺季', '6 个月以内', '长期'], shifts: '班次（早/晚班、周末等）',
      message: '补充说明', submit: '提交需求', done: '提交成功！我们会尽快与您联系。编号：',
    },
    svc: { amazon: 'Amazon / FBA', temu: 'TEMU / 跨境电商', container: '装卸柜', warehouse: '仓内作业', project: '项目承包', leasing: '人员派遣', operations: '驻场运营管理' },
    jobs: {
      title: '加入我们', sub: '招聘仓库操作员、拣货员、叉车司机、卸柜工和班组长。按时发薪，SOP 带教上岗，多语言团队。',
      open: '在招岗位', none: '暂无公开岗位，欢迎直接投递简历。', apply: '投递', people: '人', from: '起',
      name: '姓名 *', phone: '电话 / WhatsApp *', email: '邮箱', nationality: '国籍', languages: '语言',
      position: '意向岗位', positions: ['仓库操作员', '拣货员', '叉车司机', '卸柜工', '班组长'],
      location: '期望工作地点', available: '可到岗日期', forklift: '我有叉车证（Staplerschein）',
      permit: '工作许可', permits: ['欧盟公民', '持工作许可的居留', '需要协助办理'],
      experience: '工作经验（简述）', cv: '简历（PDF、照片或 Word，最大 15 MB）', submit: '提交申请', forJob: '应聘',
      done: '感谢投递！我们会通过电话或 WhatsApp 联系您。',
    },
    consent: '我同意贵公司为处理本次申请而使用我提交的信息（GDPR）。*',
    footer: { contact: '联系方式', staff: '员工登录', imprint: '法律声明', privacy: '隐私政策', rights: '版权所有。' },
    err: '提交失败：',
  },
  en: {
    nav: { services: 'Services', approach: 'About', business: 'For Companies', jobs: 'Careers', login: 'Login' },
    hero: {
      kicker: 'IWO · Integrated Warehouse Operations',
      title: 'Warehouse operations that deliver as planned.',
      sub: 'Staffing and on-site operations for Amazon and TEMU warehouses, container loading and unloading, and logistics projects – built on strong management, reliable data and a dependable partner network.',
      cta1: 'Request staff', cta2: 'Apply now',
    },
    services: {
      title: 'Services', sub: 'From a single module to full on-site operations. You keep business ownership, forecasts, budget approval and acceptance.',
      items: [
        ['Amazon & TEMU warehouses', 'Receiving, picking, packing, FBA prep and returns – with trained, multilingual teams.'],
        ['Container loading & unloading', '20/40/45 ft and trucks, loose or palletised, incl. sorting and palletising. Billed per container, pallet or piece.'],
        ['Module operations', 'Clearly scoped modules such as unloading + sorting, VAS or returns – organised and delivered by us (Werkvertrag).'],
        ['Staff leasing', 'Flexible capacity for peaks and seasons through licensed partners under the AÜG, with clear employer and instruction roles.'],
        ['On-site management', 'Site management: planning, coordination, daily reporting, quality loop and one contact on site.'],
        ['Supplier & capacity management', 'Qualification, confirmed capacity, reconciliation and rating of staffing and equipment partners.'],
      ],
    },
    approach: {
      title: 'Our approach',
      lead: 'Clients do not buy headcount from us – they buy operational capability: consistently hitting quality, lead-time and unit-cost targets within the agreed scope.',
      flow: ['Demand', 'Work order', 'Resource plan', 'Execution & evidence', 'Settlement', 'Better decisions'],
      pillars: [
        ['Strong management', 'A team that runs execution independently: site manager, team leads, data & quality, purchasing/partners.'],
        ['Strong data', 'Every work step with time, volume, quality, cost and exceptions – traceable to invoicing. Your live dashboard shows output, efficiency and error rate.'],
        ['Strong supply chain', 'A partner network with capacity that can really be called off – primary, backup and emergency partners per key skill.'],
        ['Continuous improvement', 'Data → cause → action → verify → update the standard. Savings are shared only on verified results.'],
      ],
      pilotTitle: 'Start with a 90-day pilot',
      pilot: [
        ['Day 1–15', 'Choose a module; define scope, data sources, responsibilities and KPIs'],
        ['Day 16–30', 'Trial run of orders, times, exceptions and acceptance – reconcilable daily'],
        ['Day 31–60', 'Time standards, costs and capacity; resource plan proposals'],
        ['Day 61–90', 'Improvement trials, financial review, SOP V2 and roll-out plan'],
      ],
      compliance: 'Compliant by design: staff leasing and contracted modules are recorded separately with actual employer and instruction relations (§ 1 AÜG). Personal data is processed purpose-bound and minimised under the GDPR.',
    },
    business: {
      title: 'For companies', sub: 'Tell us what you need – we usually get back to you within one business day with questions or a quote.',
      company: 'Company *', contact: 'Contact person *', email: 'Email *', phone: 'Phone', location: 'Location / warehouse',
      services: 'Services needed', headcount: 'Headcount (approx.)', volume: 'Volume (e.g. 15 containers/week)',
      start: 'Start from', duration: 'Duration', durations: ['Short-term / season', 'Up to 6 months', 'Long-term'], shifts: 'Shifts (e.g. early/late, weekends)',
      message: 'Further details', submit: 'Send inquiry', done: 'Thank you! We received your inquiry. Reference: ',
    },
    svc: { amazon: 'Amazon / FBA', temu: 'TEMU / e-commerce', container: 'Container handling', warehouse: 'Warehouse processes', project: 'Project / contract work', leasing: 'Staff leasing', operations: 'On-site management' },
    jobs: {
      title: 'Careers', sub: 'Warehouse operatives, pickers, forklift drivers, container unloaders and team leads. Paid on time, onboarding with clear SOPs, multilingual teams.',
      open: 'Open positions', none: 'No open positions listed right now – speculative applications are always welcome.', apply: 'Apply', people: 'people', from: 'from',
      name: 'Full name *', phone: 'Phone / WhatsApp *', email: 'Email', nationality: 'Nationality', languages: 'Languages',
      position: 'Preferred role', positions: ['Warehouse operative', 'Picker', 'Forklift driver', 'Container unloader', 'Team lead'],
      location: 'Preferred location', available: 'Available from', forklift: 'I have a forklift licence',
      permit: 'Work permit', permits: ['EU citizen', 'Residence permit with work authorisation', 'Need support'],
      experience: 'Experience (short)', cv: 'CV (PDF, photo or Word, max. 15 MB)', submit: 'Send application', forJob: 'Applying for',
      done: 'Thank you for applying! We will contact you by phone or WhatsApp.',
    },
    consent: 'I agree to the processing of my details to handle my request (GDPR). *',
    footer: { contact: 'Contact', staff: 'Staff login', imprint: 'Imprint', privacy: 'Privacy', rights: 'All rights reserved.' },
    err: 'Sending failed: ',
  },
};
const SVC_KEYS = ['amazon', 'temu', 'container', 'warehouse', 'project', 'leasing', 'operations'];

async function post(path, body, isForm) {
  const res = await fetch(path, isForm ? { method: 'POST', body } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = data.detail;
    throw new Error(Array.isArray(d) ? d.map(x => x.loc?.slice(-1)[0] + ': ' + x.msg).join('; ') : d || res.statusText);
  }
  return data;
}

export default function Landing({ onLogin }) {
  const { lang, setLang } = useLang();
  const L = lang === 'zh' ? 'zh' : lang === 'de' ? 'de' : 'en';
  const t = T[L];
  const [info, setInfo] = useState(null);
  const [menu, setMenu] = useState(false);
  const [job, setJob] = useState(null);

  useEffect(() => { fetch('/api/v1/public/info').then(r => (r.ok ? r.json() : null)).then(setInfo).catch(() => {}); }, []);
  useEffect(() => { document.title = (info?.company?.name || 'IWO') + ' · Integrated Warehouse Operations'; }, [info]);

  const go = (id) => { setMenu(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };
  const c = info?.company || {};
  const name = c.name || 'IWO';

  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-wrap lp-nav-in">
          <button className="lp-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="lp-logo">{name.slice(0, 1)}</span><span>{name}</span>
          </button>
          <nav className={`lp-links ${menu ? 'open' : ''}`}>
            {['services', 'approach', 'business', 'jobs'].map(k => <button key={k} onClick={() => go(k)}>{t.nav[k]}</button>)}
          </nav>
          <div className="lp-nav-r">
            <select className="lp-lang" value={L} onChange={e => setLang(e.target.value)} aria-label="Language">
              <option value="de">DE</option><option value="en">EN</option><option value="zh">中文</option>
            </select>
            <button className="lp-btn lp-btn-s" onClick={onLogin}>{t.nav.login}</button>
            <button className="lp-burger" aria-label="Menu" onClick={() => setMenu(!menu)}>☰</button>
          </div>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-wrap">
          <div className="lp-kicker">{t.hero.kicker}</div>
          <h1>{t.hero.title}</h1>
          <p>{t.hero.sub}</p>
          <div className="lp-cta">
            <button className="lp-btn lp-btn-p" onClick={() => go('business')}>{t.hero.cta1}</button>
            <button className="lp-btn" onClick={() => go('jobs')}>{t.hero.cta2}</button>
          </div>
          <div className="lp-flow">
            {t.approach.flow.map((s, i) => <span key={s}>{s}{i < t.approach.flow.length - 1 && <em>→</em>}</span>)}
          </div>
        </div>
      </section>

      <section id="services" className="lp-sec">
        <div className="lp-wrap">
          <h2>{t.services.title}</h2><p className="lp-sub">{t.services.sub}</p>
          <div className="lp-grid3">
            {t.services.items.map(([h, d], i) => (
              <div key={h} className="lp-card"><div className="lp-num">0{i + 1}</div><h3>{h}</h3><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section id="approach" className="lp-sec lp-alt">
        <div className="lp-wrap">
          <h2>{t.approach.title}</h2>
          <p className="lp-lead">{t.approach.lead}</p>
          <div className="lp-grid2">
            {t.approach.pillars.map(([h, d]) => <div key={h} className="lp-pillar"><h3>{h}</h3><p>{d}</p></div>)}
          </div>
          <h3 className="lp-h3">{t.approach.pilotTitle}</h3>
          <div className="lp-steps">
            {t.approach.pilot.map(([d, s]) => <div key={d} className="lp-step"><div className="lp-step-d">{d}</div><div>{s}</div></div>)}
          </div>
          <p className="lp-note">{t.approach.compliance}</p>
        </div>
      </section>

      <section id="business" className="lp-sec">
        <div className="lp-wrap lp-split">
          <div><h2>{t.business.title}</h2><p className="lp-sub">{t.business.sub}</p>
            {(c.phone || c.email) && <div className="lp-contact">{c.phone && <div>☎ {c.phone}</div>}{c.email && <div>✉ <a href={`mailto:${c.email}`}>{c.email}</a></div>}</div>}
          </div>
          <InquiryForm t={t} lang={L} />
        </div>
      </section>

      <section id="jobs" className="lp-sec lp-alt">
        <div className="lp-wrap lp-split">
          <div>
            <h2>{t.jobs.title}</h2><p className="lp-sub">{t.jobs.sub}</p>
            <div className="lp-h4">{t.jobs.open}</div>
            {!info?.jobs?.length ? <p className="lp-muted">{t.jobs.none}</p> : (
              <div className="lp-jobs">
                {info.jobs.map(j => (
                  <div key={j.id} className={`lp-job ${job?.id === j.id ? 'on' : ''}`}>
                    <div><b>{j.position || '—'}</b><div className="lp-muted">{[j.location, j.shift, j.start_date && `${t.jobs.from} ${j.start_date}`, `${j.headcount} ${t.jobs.people}`].filter(Boolean).join(' · ')}</div></div>
                    <button className="lp-btn lp-btn-s" onClick={() => { setJob(j); document.getElementById('apply-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>{t.jobs.apply}</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <ApplyForm t={t} job={job} clearJob={() => setJob(null)} />
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-wrap lp-foot-in">
          <div><b>{name}</b>{c.address && <div>{c.address}</div>}{c.phone && <div>{c.phone}</div>}{c.email && <div>{c.email}</div>}</div>
          <div className="lp-foot-links">
            <button onClick={onLogin}>{t.footer.staff}</button>
            <button onClick={() => go('business')}>{t.footer.contact}</button>
          </div>
          <div className="lp-muted">© {new Date().getFullYear()} {name}. {t.footer.rights}</div>
        </div>
      </footer>
    </div>
  );
}

function Field({ label, children, wide }) {
  return <label className={`lp-field ${wide ? 'wide' : ''}`}><span>{label}</span>{children}</label>;
}

function InquiryForm({ t, lang }) {
  const b = t.business;
  const empty = { company: '', contact_name: '', email: '', phone: '', location: '', services: [], headcount: '', volume: '', start_date: '', duration: '', shifts: '', message: '', consent: false, website: '' };
  const [f, setF] = useState(empty);
  const [state, setState] = useState({});
  const set = (k, v) => setF({ ...f, [k]: v });
  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true });
    try {
      const body = { ...f, language: lang, headcount: f.headcount ? Number(f.headcount) : null, start_date: f.start_date || null };
      const r = await post('/api/v1/public/inquiry', body);
      setState({ done: b.done + (r.ref || '') }); setF(empty);
    } catch (x) { setState({ err: t.err + x.message }); }
  };
  if (state.done) return <div className="lp-form lp-done">✓ {state.done}</div>;
  return (
    <form className="lp-form" onSubmit={submit}>
      <Field label={b.company}><input required minLength={2} value={f.company} onChange={e => set('company', e.target.value)} /></Field>
      <Field label={b.contact}><input required minLength={2} value={f.contact_name} onChange={e => set('contact_name', e.target.value)} /></Field>
      <Field label={b.email}><input required type="email" value={f.email} onChange={e => set('email', e.target.value)} /></Field>
      <Field label={b.phone}><input type="tel" value={f.phone} onChange={e => set('phone', e.target.value)} /></Field>
      <Field label={b.services} wide>
        <div className="lp-chips">
          {SVC_KEYS.map(k => (
            <button type="button" key={k} className={f.services.includes(k) ? 'on' : ''}
              onClick={() => set('services', f.services.includes(k) ? f.services.filter(x => x !== k) : [...f.services, k])}>{t.svc[k]}</button>
          ))}
        </div>
      </Field>
      <Field label={b.location}><input value={f.location} onChange={e => set('location', e.target.value)} /></Field>
      <Field label={b.headcount}><input type="number" min="1" value={f.headcount} onChange={e => set('headcount', e.target.value)} /></Field>
      <Field label={b.volume} wide><input value={f.volume} onChange={e => set('volume', e.target.value)} /></Field>
      <Field label={b.start}><input type="date" value={f.start_date} onChange={e => set('start_date', e.target.value)} /></Field>
      <Field label={b.duration}><select value={f.duration} onChange={e => set('duration', e.target.value)}><option value="">—</option>{b.durations.map(d => <option key={d}>{d}</option>)}</select></Field>
      <Field label={b.shifts} wide><input value={f.shifts} onChange={e => set('shifts', e.target.value)} /></Field>
      <Field label={b.message} wide><textarea rows={4} value={f.message} onChange={e => set('message', e.target.value)} /></Field>
      <input className="lp-hp" tabIndex={-1} autoComplete="off" value={f.website} onChange={e => set('website', e.target.value)} aria-hidden="true" />
      <label className="lp-consent wide"><input type="checkbox" required checked={f.consent} onChange={e => set('consent', e.target.checked)} /> {t.consent}</label>
      {state.err && <div className="lp-err wide">{state.err}</div>}
      <button className="lp-btn lp-btn-p wide" disabled={state.busy}>{state.busy ? '…' : b.submit}</button>
    </form>
  );
}

function ApplyForm({ t, job, clearJob }) {
  const j = t.jobs;
  const empty = { name: '', phone: '', email: '', nationality: '', languages: '', position: '', location: '', available_from: '', forklift: false, work_permit: '', experience: '', consent: false, website: '' };
  const [f, setF] = useState(empty);
  const [cv, setCv] = useState(null);
  const [state, setState] = useState({});
  const set = (k, v) => setF({ ...f, [k]: v });
  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true });
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => fd.append(k, typeof v === 'boolean' ? String(v) : v));
      if (job) fd.append('job_id', job.id);
      if (cv) fd.append('cv', cv);
      await post('/api/v1/public/apply', fd, true);
      setState({ done: true }); setF(empty); setCv(null); clearJob();
    } catch (x) { setState({ err: t.err + x.message }); }
  };
  if (state.done) return <div className="lp-form lp-done">✓ {j.done}</div>;
  return (
    <form id="apply-form" className="lp-form" onSubmit={submit}>
      {job && <div className="lp-forjob wide">{j.forJob}: <b>{job.position}</b> {job.location && `· ${job.location}`} <button type="button" onClick={clearJob}>×</button></div>}
      <Field label={j.name}><input required minLength={2} value={f.name} onChange={e => set('name', e.target.value)} /></Field>
      <Field label={j.phone}><input required type="tel" minLength={5} value={f.phone} onChange={e => set('phone', e.target.value)} /></Field>
      <Field label={j.email}><input type="email" value={f.email} onChange={e => set('email', e.target.value)} /></Field>
      <Field label={j.nationality}><input value={f.nationality} onChange={e => set('nationality', e.target.value)} /></Field>
      <Field label={j.languages}><input value={f.languages} onChange={e => set('languages', e.target.value)} placeholder="DE, EN, PL…" /></Field>
      <Field label={j.position}><select value={f.position} onChange={e => set('position', e.target.value)}><option value="">—</option>{j.positions.map(p => <option key={p}>{p}</option>)}</select></Field>
      <Field label={j.location}><input value={f.location} onChange={e => set('location', e.target.value)} /></Field>
      <Field label={j.available}><input type="date" value={f.available_from} onChange={e => set('available_from', e.target.value)} /></Field>
      <Field label={j.permit}><select value={f.work_permit} onChange={e => set('work_permit', e.target.value)}><option value="">—</option>{j.permits.map(p => <option key={p}>{p}</option>)}</select></Field>
      <label className="lp-consent" style={{ alignSelf: 'end' }}><input type="checkbox" checked={f.forklift} onChange={e => set('forklift', e.target.checked)} /> {j.forklift}</label>
      <Field label={j.experience} wide><textarea rows={3} value={f.experience} onChange={e => set('experience', e.target.value)} /></Field>
      <Field label={j.cv} wide><input type="file" accept=".pdf,.png,.jpg,.jpeg,.heic,.webp,.doc,.docx" onChange={e => setCv(e.target.files[0] || null)} /></Field>
      <input className="lp-hp" tabIndex={-1} autoComplete="off" value={f.website} onChange={e => set('website', e.target.value)} aria-hidden="true" />
      <label className="lp-consent wide"><input type="checkbox" required checked={f.consent} onChange={e => set('consent', e.target.checked)} /> {t.consent}</label>
      {state.err && <div className="lp-err wide">{state.err}</div>}
      <button className="lp-btn lp-btn-p wide" disabled={state.busy}>{state.busy ? '…' : j.submit}</button>
    </form>
  );
}
