# CRMFlow — Contexto de design do frontend

## Produto e stack

CRMFlow é uma plataforma B2B multi-tenant com CRM/Kanban, atendimento omnichannel,
agendamento e módulos verticais. O frontend atual usa React, JavaScript/JSX,
Vite, Tailwind e componentes compartilhados Base UI/shadcn.

Rotas e navegação seguem o código atual e `src/lib/modules-registry.js`.
Não use a antiga proposta de Next.js App Router, Server Components ou TypeScript
como referência de implementação. Consulte a
[skill do frontend](../skills/flow-frontend/SKILL.md) para os padrões atuais.

## Direção estética

Interface **Enterprise Minimalista Moderno** (referência Linear / Attio / Vercel),
com precisão geométrica, superfícies em camadas, espaço negativo equilibrado e
densidade adequada a um sistema empresarial de operação intensa.

- Referência Enterprise: contraste AA/AAA, legibilidade de dados e interações
  claras. Padronize toda a interface com `Geist Variable` (`font-sans`), usando
  `tabular-nums` para números, métricas, datas e contadores. Reserve
  `Geist Mono Variable` (`font-mono`) exclusivamente para códigos técnicos reais
  (códigos OTP, `requestId`, chaves de API e subdomínios de confirmação).
- Paleta semântica com suporte completo a **Light / Dark / System** via
  `ThemeProvider` (`src/components/theme-provider.jsx`) e `ThemeToggle`.
  Use os tokens semânticos de `src/index.css` (`background`, `surface`,
  `surface-elevated`, `border`, `border-strong`, `primary`, `destructive`,
  `success`, `warning`, `info`).
- No modo claro, use fundo branco, cards brancos, texto azul-marinho
  e o mesmo laranja do modo escuro para ações. `src/styles/light-theme.css` reúne a identidade
  visual, limitada a `:root:not(.dark)`: navegação com a mesma estrutura e estados do modo escuro, ícones de
  CRM em azul e de Kanban em violeta, tabelas com cabeçalhos azulados e seleção
  em pêssego. Status usam verde, azul, âmbar e vermelho conforme o significado.
  Preserve os tokens e o tratamento próprios do modo escuro. Campos e botões
  devem continuar legíveis no hover, no foco e nos estados de erro.
- Superfícies limpas com bordas precisas e elevações discretas (`--elevation-xs`
  a `--elevation-lg`); evite gradientes chamativos, sombras exageradas e emojis
  coloridos como linguagem de interface.
- Movimento suave e funcional usa `motion` (`motion/react`) com
  `<MotionConfig reducedMotion="user">` na raiz e primitivos compartilhados em
  `src/components/motion/` (`FadeIn`, `StaggerList`, `InteractiveCard`),
  com transições de 120–180 ms sem atrasar ações. Conteúdo permanece legível
  durante as trocas; não use cascatas em listas de trabalho, pulsos decorativos
  contínuos, saltos de cards ou animações disparadas por filtros. Menus e modais
  seguem seu ciclo de abertura e fechamento: menus saem em 100 ms; modais
  e painéis entram em 240 ms e saem em 220 ms, com fade sincronizado, deslocamento
  máximo de 12 px e fundo discreto sem desfoque. A saída usa ease-in-out para
  permanecer visível durante o fechamento. A entrada deve funcionar também
  quando uma rota monta o painel já aberto. Evite zoom, movimentos de toda
  a largura do painel e transições de sombra. Diálogos nativos usam `NativeDialog`
  e `ModalPresence` para concluir a saída antes da desmontagem, preservando
  o foco e a preferência de movimento reduzido.

## Navegação e acessibilidade

- Rail de módulos e sidebar de páginas consultam `src/lib/modules-registry.js`;
  não duplique destinos em abas nem mantenha listas paralelas no JSX.
- Conteúdo usa cabeçalho com título e subtítulo curto, áreas de dados e estados
  vazios com mensagem e ação contextual.
- O texto de contexto acima do título no `PageHeader` usa cor secundária
  (`text-muted-foreground`), sem fundo colorido ou faixa.
- Preserve contraste AA, navegação por teclado, foco visível e nome acessível
  em botões com ícone. Respeite os componentes compartilhados de modal e loading.
- Formulários compartilham `Form`: Enter envia campos de uma linha,
  Ctrl/Cmd+Enter envia também a partir de texto longo e o foco é restaurado após
  falhas. Ofereça acesso direto ao conteúdo pelo teclado; atalhos globais não
  devem interferir em digitação, composição de texto, menus ou diálogos abertos.

## Autenticação e evolução do produto

Reutilize a autenticação existente, com sessões master e tenant separadas.
Login e MFA por e-mail seguem os contratos atuais do backend; não recrie clientes,
tokens ou fluxos paralelos. Configurações de MFA seguem as rotas existentes.

A antiga proposta de tema “Camaleão” dinâmico por tenant não autoriza implementar
uma nova infraestrutura de tema. Preserve o comportamento atual e trate mudanças
como tarefas próprias. Kanban e gestão de tenants já possuem implementação;
consulte o código atual em vez de tratá-los como placeholders.

CRM também possui lista e detalhe de leads, importação, configurações, atividades
e histórico. CRM e Kanban coexistem com rotas próprias no mesmo shell. Preserve
o sino de notificações e os controles de módulos, feature flags e fuso horário
dos tenants. Consulte o [guia de integração](module-integration.md) para os pontos
de entrada e contratos compartilhados.

Os temas claro e escuro compartilham estrutura, espaçamentos, tipografia, raios
e navegação lateral. Altere apenas cores entre temas; use `--brand-orange`
para o mesmo laranja em ambos. Páginas principais do tema claro usam fundo branco.

O Rail e a sidebar mantêm a paleta escura idêntica nos dois temas, incluindo
seleção e hover. No modo claro, o conteúdo usa branco e superfícies cinza neutras.

No Kanban claro, cards, campos e botões usam fundo branco puro (#ffffff),
inclusive no hover. Ações principais mantêm borda laranja e exclusões mantêm
texto e borda vermelhos; foco e seleção continuam visíveis.
