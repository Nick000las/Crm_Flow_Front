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

## Estrutura de rotas (App Router)

```
src/app/
├── (auth)/              # Login do tenant — sem shell, layout mínimo
│   └── login/
├── (admin)/             # Área master — isolada, fora do RLS de tenant, auth própria
│   └── login/
├── (app)/               # Autenticado, com shell completo
│   ├── layout.tsx       # AppShell (Server Component)
│   ├── dashboard/
│   ├── crm/
│   └── configuracoes/   # Settings do usuário/tenant
```

## Navegação — duas camadas
- **Rail de módulos** (Nível 1): coluna estreita, fundo escuro fixo, ícone-only + tooltip, sem label textual. Item ativo com destaque de cor de accent do tenant — único lugar do Rail com essa cor.
- **Sidebar de páginas** (Nível 2): coluna clara, lista de páginas do módulo ativo, agrupada por seção quando houver profundidade.
- Fonte única de verdade da navegação: `lib/modules-registry.ts` — Rail e Sidebar leem daqui, nunca hardcoded no JSX.
- Área de conteúdo: cabeçalho (título + subtítulo curto) → cards/formulários → empty states com ícone + frase + CTA.

## Acessibilidade (não negociável)
- Contraste AA mínimo, calculado dinamicamente onde houver cor de accent do tenant.
- Navegação completa por teclado, foco visível em todo elemento clicável.
- `aria-label` em todo ícone sem texto.

## Autenticação já implementada no backend (reaproveitar, não recriar)
- Login com senha + MFA por e-mail (código de 6 dígitos). Fluxo: senha correta + `mfaAtivo: true` → `nextStep: 'mfaCode'` + cookie `mfa_token` (5min) → `POST /auth/mfa/verify` → tokens finais.
- `PUT /auth/mfa` liga o MFA sem fricção extra. `DELETE /auth/mfa` exige senha de novo.
- A tela de `configuracoes` pode consumir essas rotas de verdade — não é placeholder, é feature já pronta no backend.

## Stack
React + Tailwind + shadcn/ui + TypeScript, Server Components por padrão no App Router — interatividade isolada em componentes filhos menores.

## Fora de escopo nesta etapa (não implementar ainda)
- Tema Camaleão dinâmico por tenant (cor real injetada via Edge Middleware/Upstash) — entra depois. Usar accent neutro do design system por enquanto.
- Conteúdo funcional do Kanban/CRM (motor genérico, drag-and-drop real) — etapa própria.
- Lógica de criação/gestão de tenant na área admin — por enquanto só o shell e o login separado dela.
- TOTP como segundo fator — só e-mail por enquanto.