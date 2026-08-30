import { Construction, KanbanSquare, LayoutDashboard, Settings } from 'lucide-react';

/**
 * Fonte única de verdade da navegação. O Rail (nível 1) e a Sidebar
 * (nível 2) leem daqui — nenhum dos dois fixa rota ou rótulo no JSX.
 *
 * @typedef {Object} ModulePage
 * @property {string} key
 * @property {string} label
 * @property {string} path
 *
 * @typedef {Object} ModuleEntry
 * @property {string} key
 * @property {string} label
 * @property {import('lucide-react').LucideIcon} icon
 * @property {string} path
 * @property {ModulePage[]} pages
 */

/** @type {ModuleEntry[]} */
export const MODULES = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    pages: [{ key: 'overview', label: 'Visão geral', path: '/dashboard' }],
  },
  {
    key: 'crm',
    label: 'CRM',
    icon: KanbanSquare,
    path: '/crm',
    pages: [{ key: 'leads', label: 'Leads', path: '/crm' }],
  },
];

/**
 * Itens fixos do rodapé do Rail. Configurações não é um módulo de trabalho:
 * não tem hierarquia de páginas e não compete com Dashboard/CRM pela
 * atenção — fica ancorada embaixo, separada.
 *
 * @type {Omit<ModuleEntry, 'pages'>[]}
 */
export const UTILITY_ITEMS = [
  {
    key: 'configuracoes',
    label: 'Configurações',
    icon: Settings,
    path: '/configuracoes',
  },
];

/** Ícone dos módulos ainda sem feature. */
export const PLACEHOLDER_ICON = Construction;

/** @param {string} pathname */
export function findActiveModule(pathname) {
  return MODULES.find((entry) => pathname.startsWith(entry.path)) ?? null;
}
