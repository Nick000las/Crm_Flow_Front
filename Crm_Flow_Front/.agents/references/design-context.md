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

Interface elegante, minimalista e intuitiva, com precisão geométrica, espaço
negativo e densidade adequada a um sistema empresarial.

- Referência Enterprise: contraste, legibilidade de dados e interações claras.
  Use tipografia monoespaçada para dados técnicos ou numéricos quando apropriado.
- Paleta quase monocromática; destaque em navegação ativa e ações primárias.
  Use os tokens existentes, incluindo estados destrutivos, erros e etiquetas.
- Cantos retos ou raio discreto, bordas sutis; evite gradientes, sombras grandes,
  cantos exagerados e ícones emoji coloridos como linguagem da interface.
- Movimento discreto e funcional segue `src/styles/motion.css`: 120 ms para
  feedback e 180 ms para entradas, respeitando movimento reduzido.

## Navegação e acessibilidade

- Rail de módulos e sidebar de páginas consultam `src/lib/modules-registry.js`;
  não duplique destinos em abas nem mantenha listas paralelas no JSX.
- Conteúdo usa cabeçalho com título e subtítulo curto, áreas de dados e estados
  vazios com mensagem e ação contextual.
- Preserve contraste AA, navegação por teclado, foco visível e nome acessível
  em botões com ícone. Respeite os componentes compartilhados de modal e loading.

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
