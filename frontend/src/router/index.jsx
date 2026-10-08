/**
 * Application routes definition.
 * NAV_ITEMS is the master list for both the sidebar and route rendering.
 */

import {
  BadgePercent, BarChart3, Building2, Calculator, ClipboardList, Clock3, Container, FileText, Gauge, Gift, Hourglass, LayoutDashboard, Link2, Mail, ScrollText, Send, Settings, Star, Target, Timer, Trophy, UserCog, Users, Wallet, Warehouse,
} from 'lucide-react';

export const NAV_ITEMS = [
  { key: 'client_bi',       icon: BarChart3, labelKey: 'nav.client_bi',      roles: ['client'] },
  { key: 'dashboard',       icon: LayoutDashboard, labelKey: 'nav.dashboard',       roles: ['admin','hr','wh','fin','mgr','sup'] },
  { key: 'employees',       icon: Users, labelKey: 'nav.employees',       roles: ['admin','hr','wh','fin','mgr','sup'] },
  { key: 'timesheets',      icon: Clock3, labelKey: 'nav.timesheets',       roles: ['admin','hr','wh','fin','mgr','sup'] },
  { key: 'schedules',       icon: Hourglass, labelKey: 'nav.schedules',        roles: ['admin','hr','mgr'] },
  { key: 'settlements',     icon: Wallet, labelKey: 'nav.settlement',       roles: ['admin','hr','fin','sup','mgr'] },
  { key: 'containers',      icon: Container, labelKey: 'nav.containers',       roles: ['admin','hr','wh','mgr'] },
  { key: 'operations',      icon: ClipboardList, labelKey: 'nav.operations',       roles: ['admin','hr','wh','fin','mgr','sup'] },
  { key: 'performance',     icon: Trophy, labelKey: 'nav.performance',      roles: ['admin','hr','wh','fin','mgr','sup','worker'] },
  { key: 'client_preview',  icon: BarChart3, labelKey: 'nav.client_preview', roles: ['admin','hr','mgr'] },
  { sep: true },
  { key: 'dispatch',        icon: Send, labelKey: 'nav.dispatch',         roles: ['admin','hr','mgr'] },
  { key: 'talent',          icon: Star, labelKey: 'nav.talent',           roles: ['admin','hr','mgr'] },
  { key: 'recruit',         icon: Target, labelKey: 'nav.recruit',          roles: ['admin','hr','mgr'] },
  { sep: true },
  { key: 'quotations',      icon: FileText, labelKey: 'nav.quotations',       roles: ['admin','hr','mgr','fin'] },
  { key: 'referrals',       icon: Gift, labelKey: 'nav.referrals',        roles: ['admin','hr','mgr'] },
  { key: 'commissions',     icon: BadgePercent, labelKey: 'nav.commissions',      roles: ['admin','fin'] },
  { key: 'suppliers',       icon: Building2, labelKey: 'nav.suppliers',        roles: ['admin','hr','mgr'] },
  { sep: true },
  { key: 'clock',           icon: Timer, labelKey: 'nav.clock',            roles: ['admin','hr','wh','mgr','worker','sup'] },
  { key: 'warehouses',      icon: Warehouse, labelKey: 'nav.warehouse_rates',  roles: ['admin','hr','mgr','wh'] },
  { key: 'cost_calc',       icon: Calculator, labelKey: 'nav.cost_calc',        roles: ['admin','hr','mgr','fin'] },
  { key: 'logs',            icon: ScrollText, labelKey: 'nav.logs',             roles: ['admin'] },
  { sep: true },
  { key: 'messages',        icon: Mail, labelKey: 'nav.messages',         roles: ['admin','hr','wh','fin','mgr','sup','worker'] },
  { key: 'integrations',    icon: Link2, labelKey: 'nav.integrations',     roles: ['admin'] },
  { sep: true },
  { key: 'admin',           icon: Gauge, labelKey: 'nav.admin',            roles: ['admin'] },
  { key: 'users',           icon: UserCog, labelKey: 'nav.users',            roles: ['admin'] },
  { key: 'settings',        icon: Settings, labelKey: 'nav.settings',         roles: ['admin'] },
];
