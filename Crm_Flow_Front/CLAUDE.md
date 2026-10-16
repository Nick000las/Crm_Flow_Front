# CRMFlow — Contexto de Design e Estrutura de Frontend

## Produto
CRMFlow é uma plataforma B2B multi-tenant (CRM/Kanban, atendimento omnichannel, agendamento, módulos verticais). Cada tenant tem identidade visual injetada dinamicamente (tema "Camaleão") — ainda não implementado nesta etapa, ver seção "Fora de escopo".

## Direção estética
Elegante, minimalista, intuitivo — futurista por precisão geométrica e espaço negativo, com a densidade e a confiança de um terminal financeiro maduro.

- **Preset de referência: Enterprise** (clean, high-contrast, data-driven, drag-and-drop) — com um toque do **Trading Terminal Design System** (tipografia monoespaçada em dados numéricos, legibilidade à distância), sem herdar a paleta dark-only nem os sinais de compra/venda dele.
- Paleta quase monocromática (grafite/quase-preto sobre quase-branco). Cor de destaque só em: item ativo de navegação, botões de ação primária.
- Tipografia: uma sans estruturada para texto, uma monoespaçada para dados técnicos/numéricos (IDs, valores, timestamps).
- Cantos retos ou raio mínimo. Sem gradiente. Sem sombra difusa grande — preferir borda sutil de 1px.
- Motion restrito (200–250ms), nunca decorativo.
- **Evitar explicitamente:** gradiente roxo/azul, fonte Inter como padrão sem intenção, cards com sombra grande sobre fundo cinza genérico, ícones emoji coloridos chapados, cantos exageradamente arredondados.

## Estrutura de rotas (react-router-dom, `useRoutes`)

```
src/routes/
├── app-routes.jsx       # portão de sessão (loading → restaura → rotas)
├── require-role.jsx     # portão de papel por rota (só UX; o back valida com 403)
├── (auth)/              # Login do tenant — sem shell, layout mínimo
├── (admin)/             # Área master — isolada, sessão própria (só memória)
└── (app)/               # Autenticado, com shell completo (AppLayout → AppShell)
    └── app.routes.jsx   # dashboard, crm (Leads · Importar · Configurações/:secao), configuracoes
```

Código de feature mora em `src/modules/<modulo>/{api,hooks,lib,components,pages}`
(ver README, seção "Dados").

## Navegação — duas camadas
- **Rail de módulos** (Nível 1): coluna estreita, fundo escuro fixo, ícone-only + tooltip, sem label textual. Item ativo com destaque de cor de accent do tenant — único lugar do Rail com essa cor.
- **Sidebar de páginas** (Nível 2): coluna clara, lista de páginas do módulo ativo, agrupada por seção quando houver profundidade.
- Fonte única de verdade da navegação: `src/lib/modules-registry.js` — Rail e Sidebar leem daqui, nunca hardcoded no JSX. Visibilidade por módulo contratado, papel e feature flag (`feature` na entrada; `temFeature` dentro de uma tela) passa por `podeVer` (`src/lib/acesso.js`), nunca por condição no JSX. Flag desligada ou ausente na sessão = interface de antes. 403 `MODULE_NOT_ENABLED`/`FEATURE_NOT_ENABLED` vira estado de página com `isAccessError` + `AcessoIndisponivel`.
- **CRM › Configurações** (DONO/MASTER): subseções em `modules/crm/lib/secoes-configuracoes.js`. Campos vale sempre; as demais nascem atrás da flag própria (`crm.listas`…) e entram com `pronta: true` e uma tela em `TELA_DA_SECAO`. Campos usa só `/crm/configuracoes/campos*` (matriz, nome, ordem) e `/crm/field-definitions` (criar/editar/excluir personalizado). Cada tela consome os campos do seu contexto com `camposDoContexto` (`create_form`/`detail`/`table`/`filter`) sobre uma única `GET /crm/leads/fields`. Ordem por arrastar com `@dnd-kit` via `components/ordenavel/` (+ ↑/↓ como alternativa).
- **Listas do tenant** (status, origem, motivo de perda, tags): opções e rótulos vêm de `/crm/leads/fields` (`opcoes` = keys ativas, `opcoesLista` = todas). Nunca rótulo fixo no front — passe por `lib/opcoes.js` (`opcaoDoCampo`, `opcoesDoSeletor`, `opcoesDoFiltro`). A cor da opção é um marcador no `OpcaoBadge`; o texto continua grafite (contraste em `src/lib/contraste.js`).
- Área de conteúdo: cabeçalho (título + subtítulo curto) → cards/formulários → empty states com ícone + frase + CTA.

## Acessibilidade (não negociável)
- Contraste AA mínimo, calculado dinamicamente onde houver cor de accent do tenant.
- Navegação completa por teclado, foco visível em todo elemento clicável.
- `aria-label` em todo ícone sem texto.

## Autenticação já implementada no backend (reaproveitar, não recriar)
- Login com senha + MFA por e-mail (código de 6 dígitos). Fluxo: senha correta + `mfaAtivo: true` → `nextStep: 'mfaCode'` + cookie `mfa_token` (5min) → `POST /auth/mfa/verify` → tokens finais.
- `PUT /auth/mfa` liga o MFA sem fricção extra. `DELETE /auth/mfa` exige senha de novo.
- A tela de `configuracoes` pode consumir essas rotas de verdade — não é placeholder, é feature já pronta no backend.
- Sessão de tenant persiste em cookie httpOnly (`refresh_token`) e se restaura no F5; a sessão master fica só em memória. Chamadas autenticadas sempre por `authApi` (`useAuth()`), nunca `fetch` cru.

## Stack
React 19 + Vite + **JavaScript** (JSDoc para tipos, sem TypeScript) + Tailwind 4 + shadcn/ui (estilo `base-nova` sobre `@base-ui/react`) + `lucide-react`. Roteamento com `react-router-dom` (SPA, sem Server Components). Dados com TanStack Query. Fontes: Geist (texto) e Geist Mono (dados). Regras de negócio em funções puras (`lib/`), testadas com `node --test`.

## Fora de escopo nesta etapa (não implementar ainda)
- Tema Camaleão dinâmico por tenant (cor real injetada via Edge Middleware/Upstash) — entra depois. Usar accent neutro do design system por enquanto.
- Kanban e estágios do funil (motor genérico, drag-and-drop real) — etapa própria. O CRM de leads (lista, form dinâmico, filtros, views, campos, import/export) já está implementado.
- Convite e gestão de usuários do tenant pela interface — por enquanto, scripts `create:tenant`/`create:user` no back (a área admin já cria e gerencia tenants).
- TOTP como segundo fator — só e-mail por enquanto.