/**
 * Application routes definition.
 * NAV_ITEMS is the master list for both the sidebar and route rendering.
 */

export const NAV_ITEMS = [
  { key: 'dashboard',       icon: '📊', labelKey: 'nav.dashboard',       roles: ['admin','hr','wh','fin','mgr','sup'] },
  { key: 'attendance',      icon: '👥', labelKey: 'nav.attendance',       roles: ['admin','hr','wh','fin','mgr','sup'] },
  { key: 'timesheets',      icon: '⏱️', labelKey: 'nav.timesheets',       roles: ['admin','hr','wh','fin','mgr','sup'] },
  { key: 'schedules',       icon: '⏳', labelKey: 'nav.schedules',        roles: ['admin','hr','mgr'] },
  { key: 'settlements',     icon: '💰', labelKey: 'nav.settlement',       roles: ['admin','hr','fin','sup','mgr'] },
  { key: 'containers',      icon: '📦', labelKey: 'nav.containers',       roles: ['admin','hr','wh','mgr'] },
  { sep: true },
  { key: 'dispatch',        icon: '🚀', labelKey: 'nav.dispatch',         roles: ['admin','hr','mgr'] },
  { key: 'talent',          icon: '🌟', labelKey: 'nav.talent',           roles: ['admin','hr','mgr'] },
  { sep: true },
  { key: 'quotations',      icon: '📋', labelKey: 'nav.quotations',       roles: ['admin','hr','mgr'] },
  { key: 'referrals',       icon: '⚠️', labelKey: 'nav.referrals',        roles: ['admin','hr','mgr'] },
  { key: 'suppliers',       icon: '🏢', labelKey: 'nav.suppliers',        roles: ['admin','hr','mgr'] },
  { sep: true },
  { key: 'clock',           icon: '⏰', labelKey: 'nav.clock',            roles: ['admin','hr','wh','mgr','worker','sup'] },
  { key: 'commissions',     icon: '🏅', labelKey: 'nav.commissions',      roles: ['admin','hr','mgr'] },
  { key: 'warehouse_rates', icon: '🏭', labelKey: 'nav.warehouse_rates',  roles: ['admin','hr','mgr','wh'] },
  { key: 'cost_calc',       icon: '🧮', labelKey: 'nav.cost_calc',        roles: ['admin','hr','mgr','fin'] },
  { key: 'logs',            icon: '📝', labelKey: 'nav.logs',             roles: ['admin','hr'] },
];
