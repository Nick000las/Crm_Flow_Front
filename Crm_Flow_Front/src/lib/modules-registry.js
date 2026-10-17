import { Construction, KanbanSquare, LayoutDashboard, Settings } from 'lucide-react';
import { PAPEIS_GESTAO } from '@/modules/crm/constants';
import { SECOES_CONFIGURACOES } from '@/modules/crm/lib/secoes-configuracoes';
import { paginaVisivel, podeVer } from './acesso';

/**
 * Fonte única de verdade da navegação. O Rail (nível 1) e a Sidebar
 * (nível 2) leem daqui — nenhum dos dois fixa rota ou rótulo no JSX.
 *
 * @typedef {Object} ModulePage
 * @property {string} key
 * @property {string} label
 * @property {string} path
 * @property {readonly string[]} [roles] papéis que veem a página; omitido = todos
 * @property {string | readonly string[]} [feature] feature flag(s) que liberam a
 *   página (todas); omitido = sempre. Ver `podeVer`.
 * @property {readonly { pronta?: boolean }[]} [secoes] subseções com papel/flag
 *   próprios; a página só aparece se alguma for visível (`paginaVisivel`)
 * @property {readonly string[]} [ativoEm] prefixos extras em que a página
 *   conta como ativa (ex.: Leads em `/crm/leads/:id`)
 *
 * @typedef {Object} ModuleEntry
 * @property {string} key
 * @property {string} [moduleKey] chave do módulo contratável no back (`tenant_modules`)
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
    moduleKey: 'crm',
    label: 'CRM',
    icon: KanbanSquare,
    path: '/crm',
    pages: [
      { key: 'leads', label: 'Leads', path: '/crm', ativoEm: ['/crm/leads'] },
      {
        key: 'importar',
        label: 'Importar',
        path: '/crm/importar',
        roles: PAPEIS_GESTAO,
      },
      {
        key: 'configuracoes',
        label: 'Configurações',
        // A página leva à primeira subseção visível.
        path: '/crm/configuracoes',
        ativoEm: ['/crm/configuracoes'],
        // O papel vale por subseção (OPERADOR edita só o próprio layout).
        secoes: SECOES_CONFIGURACOES,
      },
    ],
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

/**
 * Módulos e páginas que o usuário pode ver, já filtrados por `podeVer`.
 *
 * @param {Parameters<typeof podeVer>[1]} user
 * @returns {ModuleEntry[]}
 */
export function modulosVisiveis(user) {
  return MODULES.filter((entry) => podeVer(entry, user)).map((entry) => ({
    ...entry,
    pages: entry.pages.filter((page) => paginaVisivel(page, user)),
  }));
}

/**
 * A página casa pelo caminho exato ou por um prefixo de `ativoEm`. Casar por
 * prefixo do próprio `path` não serve: `/crm` acenderia em `/crm/campos`.
 *
 * @param {ModulePage} page
 * @param {string} pathname
 */
export function isPageActive(page, pathname) {
  return (
    pathname === page.path ||
    (page.ativoEm ?? []).some((prefixo) => pathname.startsWith(prefixo))
  );
}

/**
 * @param {string} pathname
 * @param {ModuleEntry[]} [modules]
 */
export function findActiveModule(pathname, modules = MODULES) {
  return modules.find((entry) => pathname.startsWith(entry.path)) ?? null;
}
