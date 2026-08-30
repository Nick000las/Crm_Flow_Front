---
name: flow-frontend
description: Implementar, integrar e revisar CRM, Kanban, administração de tenants e notificações do Flow CRM em React. Preservar rotas, permissões, feature flags, sessão, React Query, design system e tempo real. Usar neste frontend; não rege o backend.
---

# Padrões do frontend Flow CRM

## Localização e referências

Esta skill fica dentro do projeto frontend, na mesma árvore de `package.json`.
Execute comandos na raiz desse projeto, onde ficam `package.json` e `src/`. Use React com JavaScript/JSX, Vite e os aliases
`@/`. Não introduza outro framework ou TypeScript numa alteração de funcionalidade.

- Consulte [PADRAO_DE_CODIGO.md](../../../PADRAO_DE_CODIGO.md) para
  formatação e scripts. `pnpm lint` executa ESLint e Prettier; `pnpm test`
  executa os testes Node e `pnpm build` valida o bundle de produção.
- Para alterações entre módulos, consulte o
  [guia de integração](../../references/module-integration.md), com os pontos
  de entrada e contratos que precisam ser preservados juntos.
- Reutilize `src/components/ui` (Base UI, Button, Dialog, Input etc.), os tokens
  de `src/index.css` (incluindo superfícies `surface`, `surface-elevated`,
  `border-strong` e tokens semânticos `success`, `warning`, `info`, `destructive`)
  e os componentes compartilhados de `src/components` (`EmptyState`, `StatCard`,
  `ThemeToggle`, `PageHeader`, `LoadingState`, `ApiErrorAlert`,
  `ConfirmationDialog`).
- Tema Light/Dark/System é gerenciado por `ThemeProvider`
  (`src/components/theme-provider.jsx`) e `useTheme` (`src/hooks/use-theme.js`),
  com script anti-flash em `index.html`. Apenas a preferência visual do tema
  (`flow-crm:theme`) vai para `localStorage` — nunca tokens ou dados sensíveis.
- Páginas, hooks, componentes e regras próprias de produto ficam no respectivo
  diretório `src/modules/<modulo>`. Utilitários puros pertencem a `lib`.
- Componentes de referência: `src/components/confirmation-dialog.jsx`,
  `src/components/empty-state.jsx`, `src/components/motion/`,
  `src/modules/kanban/components/card-editor.jsx` e o diálogo especializado
  `src/modules/admin/components/delete-tenant-dialog.jsx`.

## Componentes e contrato visual compartilhado

- Use `Input`, `Textarea`, `Select`/`SelectSimples`, `NativeSelect`, `Checkbox`
  e `Radio` de `src/components/ui`. ESLint bloqueia controles HTML isolados fora
  dessa pasta. `control-styles.js` centraliza borda, superfície, foco, erro,
  estado desabilitado e tamanhos `sm` (32 px), `default` (36 px) e `lg` (44 px).
  Escolha `size`; não copie classes para recriar um controle. Campos OTP podem
  manter altura e espaçamento próprios. `Input startIcon={Search}` padroniza buscas.
- `NativeSelect` preserva `<option>`, `onChange(event)`, `name`, `ref` e seleção
  múltipla. `Select` mantém o contrato Base UI `onValueChange(value)`. Não troque
  esses contratos só para alterar aparência. Uploads usam `Input type="file"`.
- Checkboxes usam `checked` e `onCheckedChange(boolean)`; radios preservam o
  contrato nativo `onChange(event)`, o grupo por `name` e a navegação por setas.
- Cards usam `Card` e suas partes; `layout="plain"` mantém layouts próprios sem
  adicionar espaçamentos internos. `as="article"`, `as="section"`, `as="li"`
  e `as="fieldset"` preservam semântica e eventos. `InteractiveCard` usa a mesma
  superfície. Não aplique fundo, borda e raio por módulo para recriar o card.
- `Button` compartilha os tamanhos dos campos, variantes semânticas e loading.
  Botões nativos são reservados a alvos especializados, como swatches e linhas
  de navegação, com foco, nome acessível e semântica preservados.
- Cabeçalhos de tabela usam a tipografia padrão de `TableHead`; células mantêm
  padding simétrico. `Alert` centraliza avisos e erros; `ApiErrorAlert` acrescenta
  o contrato da API sem perder campos, requestId ou opções de recuperação.
- CSS de módulos pode definir disposição, densidade e estados próprios de
  produto (prioridade, etiquetas, arraste); não deve sobrescrever controles
  por seletores genéricos `input`, `select`, `textarea` ou `button`.
- `src/components/ui/components.test.js` verifica os contratos interativos em
  DOM: edição, foco, seleção, uploads, envio, loading, links e eventos de cards.

## Interações e identidade visual

- Ações habilitadas usam `cursor: pointer` (botões, links, menus, abas,
  selects, checkboxes, radios, switches e linhas clicáveis). O CSS compartilhado
  respeita estados desabilitados; campos de texto e alvos de arraste preservam
  seus cursores próprios. Componentes com clique fora de elementos semânticos
  devem expor `data-interactive="true"`, como `TableRow` com `onClick`.

- O painel de apresentação do login (`AuthShell`, tenant e administração) usa
  um escopo `.dark` local com a paleta do menu, incluindo cards, ícones e textos.
  Ele permanece escuro quando o formulário e o restante da aplicação usam tema claro.

- O laranja principal usa `--brand-orange: oklch(0.68 0.168 54)`, igual nos
  dois temas. Superfícies preenchidas com essa cor usam texto e ícones brancos
  pelo token `--brand-orange-foreground` (`primary-foreground`).

- As áreas autenticadas usam toda a largura disponível após a navegação, com
  margens internas responsivas, sem `max-w-*` centralizando o conteúdo no shell.
  Quadros do Kanban e do CRM crescem na altura livre; a rolagem horizontal fica
  na área de colunas. Limites de leitura continuam locais a textos, formulários
  de autenticação e modais.

- Textos de contexto acima do título (`eyebrow`) no `PageHeader` usam
  `text-muted-foreground`, sem fundo colorido ou faixa. Preserve esse padrão
  compartilhado em todas as páginas.

- O tema claro usa a paleta semântica de `src/index.css` e o acabamento de
  `src/styles/light-theme.css`, sempre escopado por `:root:not(.dark)`.
  Prefira fundo branco, superfícies brancas, texto azul-marinho e
  o mesmo laranja do modo escuro nas ações. CRM e Kanban têm acentos azul/violeta nos ícones
  dos módulos; cores de status mantêm significado, sem virar novas variantes
  de botões. Use `theme-page-header`, `theme-card`, `theme-data-toolbar` e
  `theme-data-table` nos componentes compartilhados, evitando ajustes isolados
  com cores literais por página. Mantenha contraste mínimo de 4,5:1 para texto
  comum e 3:1 para limites dos campos/foco, conferindo desktop e mobile.

- Escreva rótulos e mensagens em português. Padronize toda a tipografia da
  interface em `Geist Variable` (`font-sans`, com `tabular-nums` em números e
  datas); use `font-mono` apenas para códigos técnicos reais (OTP, `requestId`,
  chaves de API e subdomínios de confirmação). Use tokens semânticos
  (`background`, `foreground`, `border`, `muted`, `primary`, `destructive`)
  para os controles; cores de etiquetas são categorias de produto, não novas
  cores de botões.
- Reutilize `Button` e suas variantes. Ações de exclusão são vermelhas desde o
  botão que abre a confirmação: use `variant="destructive"`. Em trechos legados
  do Kanban, use a classe existente `kb-button-danger`; não espalhe estilos inline
  nem crie outra classe de exclusão por tela.
- Ao renderizar `Link` ou `<a>` por `render` em Button do
  Base UI, passe `nativeButton={false}`. Preserve o botão nativo para ações
  de formulário; links de navegação mantêm semântica de link.
- Exclusões persistidas de quadros, colunas, cards e comentários, encerramento
  de sessão (`Sair da conta` no Rail e no AdminShell), bloqueio de tenant
  (`Suspender`/`Cancelar`), arquivamento de leads e remoção de filtros salvos
  usam `ConfirmationDialog`, nunca `window.confirm`, `alert`, `prompt` ou
  equivalentes globais. ESLint bloqueia essas APIs.
- **Validação de formulários sem popups nativos do navegador**: todo `<form>`
  deve declarar `noValidate` para suprimir os balões nativos de validação HTML5
  do navegador. Valide os campos com os utilitários de
  `src/lib/form-validation.js`, mova o foco para o primeiro campo inválido com
  `focusFirstInvalidField` e exiba erros inline com `FieldError`
  (`src/components/field-error.jsx`), preservando `aria-invalid` e
  `aria-describedby`. Erros de API continuam em `ApiErrorAlert`.
- O modal deve identificar o recurso e explicar o alcance da exclusão. Cite
  cascatas e irreversibilidade quando aplicáveis. Use “Cancelar” como ação
  inicial e rótulo explícito, como “Excluir quadro”, no botão destrutivo.
- Abra a confirmação antes da mutação. Cancelar ou Escape não faz requisição.
  Durante envio, bloqueie confirmação repetida e fechamento; mostre o erro no
  modal, mantenha o recurso disponível para nova tentativa e preserve o contexto.
  A API continua responsável por autorizar a exclusão.
- `ConfirmationDialog` é um modal nativo estilizado, renderizado por portal na
  top layer. Isso permite confirmar uma ação dentro do editor de cards, que já
  usa `<dialog>`. Não substitua por um portal comum que fique atrás desse editor.
- Exclusão de tenant mantém o modal especializado com confirmação digitada do
  subdomínio. Não remova essa proteção ao reutilizar componentes.
- Remover itens ainda não salvos de um formulário (por exemplo, etiqueta ou item
  de checklist em rascunho) não é uma exclusão persistida e dispensa outro modal.
- Informe alterações não salvas antes de descartá-las. Falha de gravação mantém
  o rascunho. Depois de a API confirmar uma gravação, uma falha ao reconsultar não
  deve oferecer reenviar a criação ou exclusão e duplicar a operação.

- Matrizes com checkboxes centralizam o controle em um contêiner flex, tanto
  ativo quanto bloqueado por tooltip. Cabeçalho e células mantêm espaçamento
  horizontal simétrico; não dependa de `text-center` para centralizar um
  checkbox que usa `display: flex`.

## Telas do CRM integradas da main

- Forecast, Assertividade, quadro comercial, oportunidades, formulários e suas
  configurações seguem os mesmos componentes e tokens das demais telas.
  Não sobrescreva os raios de controles e modais com `rounded-none`, nem use
  `font-mono` para valores monetários, datas, contadores ou rótulos.
- `CampoForm` centraliza `FieldError` e os vínculos de acessibilidade do campo.
  Filtros com validação também usam `FieldError`. Ações assíncronas usam
  `Button` com `loading` e `loadingText`; regiões usam `LoadingState`.
- Estados sem dados usam `EmptyState`. Gráficos usam `--font-sans`, números
  tabulares e cores semânticas; seleção usa o token `primary` nos dois temas.

## PWA e interfaces móveis

- O manifesto e os ícones ficam em `public/`. `build/pwa-plugin.js` gera o
  service worker por versão; `src/pwa` gerencia instalação, conexão e atualização.
  Consulte [publicação e testes](../../../docs/pwa.md).
- Cacheie apenas arquivos estáticos públicos. Sessões, respostas da API, tokens,
  anexos e URLs com dados de pessoas não entram no cache do service worker.
  Atualizações pedem confirmação antes de recarregar, preservando rascunhos.
- Abaixo de `md`, o menu reúne módulos e páginas, inclusive quando não existe
  módulo ativo; notificações permanecem no cabeçalho. Preserve a navegação por
  papel e flag do registry, as sessões separadas e os controles por teclado.
- Use viewport dinâmico, áreas seguras, campos de 16 px em dispositivos de toque
  e ações com alvo de pelo menos 44 px. Overflow fica em tabelas/quadros, nunca
  na página inteira. Modais respeitam a altura disponível e rotação da tela.
- `pnpm test:e2e` valida o build em Chromium com API simulada e larguras
  320/393/768/1024/1440 px; mantenha também testes por toque, offline e de cache.

## Limites de arraste

- Todo arraste respeita o contêiner funcional e a interseção com viewport e
  ancestrais roláveis, usando `src/lib/drag-bounds.js`. Listas reordenáveis
  ficam no próprio `ol`/`tbody` e no eixo vertical; formulários permitem cruzar
  seções, limitados ao editor inteiro. Quadros permitem cruzar colunas, dentro
  da área do quadro. Não limite apenas o ponto de soltura: a prévia também fica contida.
- `useLinhaOrdenavel` expõe a área da lista no dado do sortable. Use o modifier
  compartilhado nos `DndContext`; o autoscroll para quando a área já está visível,
  sem impedir o acesso a listas longas ou colunas fora da parte visível.
- O Kanban HTML5 mantém seus eventos, dados de drop e restauração otimista.
  `useBoundedNativeDrag` substitui a imagem livre do navegador por uma prévia
  limitada, sem eventos ou IDs duplicados, removida ao soltar, cancelar ou desmontar.
- Preserve movimentos por teclado, botões de ordem, permissões e rascunhos.

## Navegação e acessibilidade

- Resolva visibilidade com `modulosVisiveis`, `paginaVisivel` e `podeVer`,
  preservando módulo contratado, papel e feature flag. `AppShell` entrega a
  mesma lista filtrada ao Rail e à Sidebar; `isPageActive` considera `ativoEm`
  para os detalhes de leads e subseções. Use `RequireRole` nas rotas aplicáveis;
  esconder um link não substitui o controle de acesso do backend.
- As páginas do módulo são declaradas em `src/lib/modules-registry.js` e
  acessadas pelo shell/menu lateral. Não duplique esses destinos em abas na tela.
  Preserve o acesso ao menu em telas pequenas e links contextuais de retorno.
- CRM e Kanban têm rotas próprias em `src/routes/(app)/app.routes.jsx`.
  Preserve a lista de leads como layout do `LeadSheet` e o provider de tempo
  real no layout do Kanban. A página legada `crm-page.jsx` não substitui as
  telas de leads, importação ou configurações.
- Respeite `PageHeader`, a estrutura do shell e as permissões de navegação.
  A galeria do Kanban abre os quadros; gestão e seleção da equipe ficam na gestão.
- Inputs precisam de rótulos; botões só com ícone precisam de nome acessível.
  Cor não substitui texto. Preserve foco visível, foco dentro de modais, Escape,
  retorno de foco, leitura de erros e navegação por teclado.
- Use `Form` de `src/components/ui/form.jsx` no lugar de `<form>` diretamente;
  o ESLint garante esse padrão fora do próprio componente. Ele mantém o envio
  nativo por Enter e restaura o foco quando uma requisição desabilita o controle,
  sem roubar o foco se o usuário foi para outro elemento. `Ctrl+Enter`/`Cmd+Enter`
  enviam o formulário pelo botão habilitado; Enter em textarea continua inserindo
  uma nova linha. Preserve `onSubmit`, validação, permissões e bloqueios de envio.
- Handlers locais de Enter e atalhos devem ignorar composição IME com
  `isComposingKeyEvent`. Menus, seletores, painéis e modais abertos têm prioridade
  sobre atalhos globais; respeite eventos já tratados com `defaultPrevented`.
- Shells oferecem `SkipLink` para o `main#conteudo-principal`. Paleta de comandos
  mantém foco na busca, informa a opção ativa e a rola para a área visível; campos
  de opções e seleção de tema mantêm foco ao adicionar, remover e usar as setas.
- **Atalhos globais de navegação**: `AppShell` registra `useGlobalShortcuts`
  (`src/hooks/use-global-shortcuts.js`) e `CommandPalette` / `ShortcutsHelpDialog`
  (`src/modules/shell/components/command-palette.jsx`) filtrados sempre por
  `modulosVisiveis(user)`: `⌘K`/`Ctrl+K` (busca rápida), `G`+`D`/`C`/`K`/`S`
  (Dashboard, CRM, Kanban, Configurações), `Alt+↑`/`Alt+↓` (páginas do módulo),
  `/` (focar busca) e `?` (ajuda). Atalhos simples são sempre ignorados dentro
  de campos editáveis (`isEditableTarget`) ou sobreposições abertas (`hasOpenOverlay`).
- Verifique larguras pequenas sem esconder a ação principal. Modais têm altura
  limitada e rolagem própria. Evite overflow horizontal de formulários.

- Consulta e seleção da equipe ficam em Gerenciar quadros. Não exiba resumo,
  avatares ou lista de participantes na tela de trabalho do quadro. Preserve os
  seletores de responsável nos cards e filtros. Modelos de criação ficam em
  `board-layouts.js`, mostram as etapas antes de salvar e enviam
  `colunasIniciais` na mesma requisição do quadro. Não aplique modelo em edição.

- Seleção de equipe usa `TeamMemberPicker`: busca sem distinção de acentos,
  filtros, páginas de 20 e ações em lote sobre todos os resultados filtrados.
  Mantenha IDs selecionados em estado no formulário; não derive o payload só dos
  checkboxes visíveis. Filtrar e paginar não pode descartar escolhas nem gravar
  alterações. Loading/erro na lista bloqueia salvar, preservando o rascunho.

## Estado, API e tempo real

- Os logins tenant e master oferecem “Esqueceu sua senha?” e compartilham
  `PasswordRecovery`. O fluxo usa `/auth/password/forgot` e
  `/auth/password/reset`, com código por e-mail e confirmação da nova senha.
  Após redefinir, autentique automaticamente por `/auth/login/password` com a nova
  senha e o escopo da área, usando `handleLoginResponse` e preservando MFA. Se o
  login falhar depois da gravação, informe que a senha foi salva e ofereça voltar
  ao login, sem reenviar a redefinição.
  O e-mail digitado no login preenche a recuperação mesmo antes de clicar em Continuar.

- Use a sessão existente (`useAuth` ou `useAdminAuth`) e seu `authApi`; não crie
  outro cliente com tokens ou lógica de refresh paralela. Sessões master e tenant
  permanecem separadas. Não persista tokens em localStorage.
- Tenant e admin restauram a sessão por `/me` com cookies httpOnly separados; preserve o `QueryClientProvider`
  na raiz para os dados do CRM. O mesmo `authApi` oferece `upload` e `download`
  ao CRM e `refreshAccessToken` ao Kanban. HTTP e socket compartilham a mesma
  renovação em andamento para evitar refreshes concorrentes.
- A instância de `queryClient` é compartilhada por `main.jsx` e pela sessão
  tenant. Limpe consultas e mutações ao entrar, restaurar ou sair da conta;
  não reutilize dados da empresa anterior. A sessão admin permanece independente.
- Respostas de login e consultas pertencem à revisão da sessão que as iniciou:
  descarte respostas antigas depois de logout ou outro login. Um 401 atrasado
  reutiliza o token já renovado. Falha operacional no refresh preserva a sessão;
  credenciais rejeitadas encerram-na, sem repetir além de uma tentativa.
- O bootstrap tolera falhas transitórias de conexão e 5xx com três novas
  tentativas limitadas (300, 1000 e 2000 ms). Se persistirem, `SessionRecovery`
  oferece tentar novamente mantendo a URL. Indisponibilidade não é logout.
  Cada área aguarda sua própria sessão; falha do tenant não bloqueia `/admin`.
- Siga `src/services/api.js`, `api-error.js` e `ApiErrorAlert` para contratos e
  erros. Estados de carregamento, vazio e falha devem ser distinguíveis.
- `VITE_API_URL` é a URL pública do backend acessada pelo navegador. Configure-a
  no ambiente de build do Vite; o valor padrão (`http://localhost:3000`) serve
  apenas para desenvolvimento local. Como o cliente HTTP envia cookies com
  `credentials: 'include'`, `CORS_ORIGIN` no backend precisa permitir a origem
  do frontend; origem, protocolo e porta devem corresponder ao navegador. O
  backend aceita várias origens separadas por vírgulas e normaliza barras finais.
  O Socket.IO reutiliza a origem de `API_BASE_URL`.
- Extraia componentes com responsabilidades claras; mantenha hooks no topo,
  limpe efeitos e ignore respostas antigas de requisições concorrentes.
- Filtrar opções por perfil na interface não concede permissão de API. No Kanban,
  criação/gestão de quadros exige DONO/MASTER e atribuições usam a equipe ativa.
- Preserve o `KanbanRealtimeProvider` e `useKanbanEvents`. Eventos invalidam dados
  que são reconsultados pela API. Não introduza polling periódico, salas sem
  autorização ou outro socket por componente.
- O Redis distribui eventos entre processos do backend. Em desenvolvimento, o
  backend pode iniciar sem o broker e manter o realtime apenas local; o estado
  de disponibilidade deve continuar visível e os dados precisam ser recuperados
  pela API após reconexão.
- Preserve rascunhos de conteúdo e comentários durante eventos. `expectedUpdatedAt`
  protege edições; um conflito pede recarregar a versão atual sem apagar o texto
  automaticamente. Exclusão remota e revogação de acesso fecham o recurso.
- Não exiba “Conectado” ou indicador verde de conexão normal. O produto mantém
  apenas os avisos de conexão pendente, reconexão ou indisponibilidade.
- Prazo de entrega é uma data de calendário; evite conversão UTC que mude o dia.
  Cards antigos sem novos metadados devem continuar funcionando.

## Requisições independentes em paralelo

- Ao precisar de vários resultados independentes no mesmo fluxo, dispare as
  chamadas antes de aguardar e use `await Promise.all([chamadaA(), chamadaB()])`.
  Não use `await` dentro dos itens do array nem espere A para iniciar B.
- Referências: a sincronização do quadro/comentários e a recarga de card/quadro
  em `src/modules/kanban/pages/kanban-page.jsx`.
- Componentes com efeitos independentes já disparam chamadas em paralelo.
  Preserve os indicadores e erros locais; não reúna todas as consultas da página
  num bloqueio global só para introduzir `Promise.all`.
- Mantenha sequenciais os fluxos com dependência: autenticar antes de usar o
  token; salvar antes de recarregar; criar um quadro antes de usar seu ID.
- `Promise.all` rejeita se uma chamada falhar e não cancela as outras. Proteja
  respostas antigas e não aplique um rascunho parcial como se todo o grupo tivesse
  sido recarregado. Use tratamento por chamada ou `Promise.allSettled` quando
  resultados parciais forem permitidos pela interface.
- Não dispare mutações concorrentes do mesmo recurso nem arrays sem limite de
  requisições. Preserve a recuperação de falhas e o controle de versão.

## Carregamento por componente

- Todo componente que consulta ou grava dados apresenta seu próprio indicador
  enquanto sua requisição está pendente. Não cubra o aplicativo com um loading
  global e não ative spinners de componentes que não estão fazendo a operação.
- Use `src/components/ui/spinner.jsx` para o ícone e
  `src/components/loading-state.jsx` para áreas de dados. `LoadingState` reúne
  spinner, mensagem específica e `role="status"`/`aria-busy`. Não use apenas o
  texto “Carregando…” nem crie outro spinner por tela.
- Para ações, use `Button` de `src/components/ui/button.jsx` com `loading` e
  `loadingText`. Ele mostra o mesmo spinner e bloqueia reenvio. O estado pertence
  ao formulário ou recurso: `saving`, `commentSubmitting`, `membersLoading` etc.
  Não use um único `busy` para mostrar “Salvando” em todas as ações do módulo.
- Indicadores começam no disparo da requisição e terminam em sucesso ou falha.
  Erros permanecem visíveis e a ação pode ser tentada novamente. Botões de
  cancelamento não exibem spinner só por estarem desabilitados.
- No carregamento inicial, substitua apenas a região dos dados. Em revalidações,
  mantenha o conteúdo existente e mostre um indicador local. Não remonte
  formulários nem apague rascunhos para mostrar carregamento.
- Leituras de comentários, participantes e opções de módulos têm estados
  próprios; não mostre “nenhum item” antes de a requisição terminar. Consultas
  atualizadas por sockets também indicam a atualização em sua área.
- Preserve rótulos acessíveis, `aria-busy`, foco e a preferência por movimento
  reduzido. Verifique sucesso, erro, nova tentativa e requisições concorrentes.

## Animações e feedback visual

- Use `MotionConfig reducedMotion="user"` na raiz e os tokens de
  `src/styles/motion.css` e `src/components/motion/motion-tokens.js`:
  feedback em 120 ms, conteúdo em 180 ms e saída de menus em 100 ms. Modais
  centrais e painéis usam `MODAL_ENTER` (240 ms) e `MODAL_EXIT` (220 ms), com
  saída em ease-in-out, fade e deslocamento máximo de 12 px. A opacidade deve
  cair gradualmente durante a saída, preservando uma fase intermediária visível.
  Anime apenas
  as propriedades necessárias; não use `transition-all`, molas ou zoom nos controles.
- `ContentTransition` faz uma única transição discreta de opacidade sem esconder,
  mover ou remontar o conteúdo. `PageTransition` reage ao pathname; filtros,
  paginação, parâmetros de busca e atualizações de dados não animam a página.
- No `AuthShell`, título e formulário mudam juntos, sem esperar uma saída animada.
  Preserve a posição inicial do bloco entre etapas, o foco e o e-mail digitado.
  Não adicione keys a contêineres de formulários para disparar animações.
- Os nomes `StaggerList` e `StaggerItem` são mantidos por compatibilidade; a lista
  entra como um conjunto, sem atrasar cada item. `InteractiveCard` usa borda e
  sombra no hover com mouse, sem deslocar ou encolher o alvo do clique.
- Erros de campo, alertas, contadores, estados vazios e ações de seleção aparecem
  e desaparecem imediatamente. Não mantenha mensagens antigas durante uma saída
  animada e não anime genericamente todos os elementos com `role="status"`.
- Modais, painéis laterais, seletores, popovers, menus e tooltips do Base UI usam
  os atributos `data-starting-style`/`data-ending-style` e as transições centrais
  do CSS. Não combine esse ciclo com utilitários `animate-in`/`animate-out`.
  `useDialogOpenTransition` prepara o primeiro estado fechado quando uma rota
  monta `Sheet`, `Dialog` ou `AlertDialog` já com `open=true`, permitindo ao Base UI
  aplicar `[data-starting-style]`. Ignore a conclusão desse fechamento inicial;
  a navegação deve ocorrer somente depois da saída solicitada pelo usuário.
  Em painéis, anime `opacity` junto com `translate`; os estados inicial e final
  devem declarar ambos. Use deslocamento curto em cada lado, sem deslizar toda
  a largura/altura, sem zoom e sem animar sombras ou desfoque do fundo.
  Diálogos nativos usam `NativeDialog` e as condicionais dos chamadores são
  envolvidas por `ModalPresence`, preservando top layer, fundo e foco até o fim
  da saída. `propagate` permite encerrar confirmações aninhadas com o editor.
  Escape fecha apenas o diálogo do topo; interrompa a propagação de `cancel`.
  Durante a saída, bloqueie novos cliques/envios no diálogo. A operação de
  produto começa no gesto do usuário e o DOM é desmontado após a transição.
- Respeite movimento reduzido com `useReducedMotion` no JavaScript e a media
  query global no CSS, incluindo menus, painéis e pseudo-elementos. Não deixe
  animações de opacidade ou decoração contínua ativas nessa preferência.
- Animações não atrasam cliques, foco, envio, navegação ou carregamento. Preserve
  transições de arraste controladas pelo dnd-kit, sem somar animações de entrada
  aos cards. Verifique teclado, cliques rápidos, rascunhos, abertura/fechamento
  de modais e as duas preferências de movimento no navegador.

## Validação e manutenção

- Em merges e rebases, compare o comportamento das duas versões, inclusive os
  arquivos mesclados automaticamente. Confira providers, exports do `authApi`,
  rotas, permissões, MFA sem duplicação e seções de administração antes de
  considerar os conflitos resolvidos. Registre limitações de validação com API real.
- Formate somente os arquivos alterados com Prettier e execute `pnpm lint`.
  Não desligue regras para acomodar uma implementação.
- Execute testes relevantes para lógica alterada e `pnpm build` para alterações
  executáveis. Use `pnpm test` para os testes locais existentes.
- Para integração entre módulos, execute `pnpm check` (lint, formatação,
  testes e build). Se a integração trouxer regras de lint novas, ajuste o código
  preservando sua semântica, sem relaxar a configuração para passar a validação.
- Para confirmações, confira no navegador: cancelar sem mutar, confirmar uma vez,
  erro com nova tentativa, bloqueio durante envio, teclado/foco e abertura sobre
  outro modal. Use dados de teste, sem excluir recursos reais para validar a UI.
- Skills e documentação precisam apontar para arquivos reais. Ao estabelecer um
  padrão reutilizável, acrescente enforcement automatizado quando adequado,
  sem criar testes que só comparem o texto da documentação.

## Ferramentas profissionais do Kanban

- Reutilize `BoardFilters` para busca, contador, atalhos e filtros pessoais salvos
  por usuário/quadro neste navegador; não armazene tokens. Mudanças de filtros
  não remontam o editor. Busca com ícone usa foco no contêiner completo.
- O arraste mostra antes/depois do card ou a coluna de destino. Preserve os
  controles de movimento por teclado, a posição real no array sem o card arrastado,
  a restauração otimista em falhas e o bloqueio durante filtros ativos.
- Arquivar é reversível; informe sobre rascunhos antes de descartá-los. O arquivo
  restaura no final da etapa original. Não confunda arquivar com excluir.
- `CardActivity` tem loading/erro próprios e revalida com a versão/comentários.
  Limite WIP mostra contagem e aviso, sem bloquear movimentação.
- A gestão permite `editor` ou `leitor` por participante. Use `board.canEdit`
  para apresentar o quadro somente para leitura, mantendo o editor consultável;
  autorização efetiva permanece no backend.
- Menções usam nomes no texto e chips de destinatários removíveis; IDs viajam
  separados em `mencionados`. O usuário controla e-mails em `EmailPreferences`.
  Preserve comentários e preferências em rascunho quando uma gravação falhar.

## Organização dos arquivos de IA

- Centralize skills, instruções, regras e contexto de agentes em `.agents/`
  na raiz deste projeto. Consulte as [orientações centrais](../../AGENTS.md).
- Use `.agents/AGENTS.md` como ponto de entrada. Não mantenha instruções de IA
  na raiz nem cópias por ferramenta; configure a leitura desse caminho quando
  a ferramenta não o descobrir automaticamente.
- Guarde referências para agentes em `.agents/references/` quando necessárias.
  Documentação geral e código executável mantêm a organização do projeto.

## Evolução das skills por IAs

- Esta skill pode ser editada pelos agentes que trabalham no projeto. Quando o
  usuário pedir um padrão novo, altere o componente ou contrato de referência,
  a skill e o enforcement adequado na mesma tarefa, sem pedir uma confirmação
  separada apenas para manter a documentação.
- Também incorpore convenções reutilizáveis demonstradas pelo código existente.
  Diferencie requisitos do produto, regras de arquitetura e recomendações.
  Não transforme uma escolha específica de uma tela em obrigação global.
- Substitua orientações antigas que conflitem com o padrão aprovado; não acumule
  regras contraditórias. Preserve as invariantes de autorização, dados e escopo.
- Mantenha `name` e `description` no frontmatter, descrições úteis à descoberta e
  links relativos para os arquivos reais de referência. Se mover uma skill,
  atualize o `.agents/AGENTS.md`. Crie outra skill só para um fluxo realmente distinto.
- Valide o frontmatter com o validador da skill-creator quando disponível,
  confira os links e formate os Markdown alterados. Teste o comportamento do
  componente ou contrato que estabelece o padrão; comparar apenas o texto da
  documentação não valida seu funcionamento.
- Informe os padrões criados ou modificados e as verificações realizadas.
  Editar a skill não concede autorização para outras ações externas ou mudanças
  de infraestrutura fora da tarefa do usuário.

Os temas claro e escuro compartilham estrutura, espaçamentos, tipografia, raios
e navegação lateral. Altere apenas cores entre temas; use `--brand-orange`
para o mesmo laranja em ambos. Páginas principais do tema claro usam fundo branco.

O Rail e a sidebar mantêm a paleta escura idêntica nos dois temas, incluindo
seleção e hover. No modo claro, o conteúdo usa branco e superfícies cinza neutras.

Kanban, CRM e administração compartilham os mesmos componentes nos dois temas.
No modo claro, cards e campos usam superfícies brancas. Botões principais usam
laranja com texto branco; as demais variantes seguem seus tokens semânticos,
inclusive no hover. Foco, seleção e ações destrutivas permanecem visíveis.

## Recursos completos dos cards do Kanban

- `CardEditor` usa abas acessíveis de detalhes, comentários e histórico. Preserve
  os rascunhos ao alternar abas e confirme o descarte antes de fechar.
- `CardExtensions` reúne bloqueio, vínculo com lead, links, anexos, recorrência
  e regras ao entrar em uma etapa. Preserve metadados específicos no JSON.
- Anexos são downloads binários, até 3 arquivos de 200 KB por card; arquivos
  maiores usam links HTTP/HTTPS. Não execute nem renderize anexos como HTML.
- Seguidores são geridos pela rota própria, sem sobrescrever listas pelo editor.
  Duplicação e modelos reiniciam checklist, conclusão e seguidores.
- Links diretos usam `?quadro=<id>&card=<id>`. Respeite a autorização da API ao
  abrir um link. Modelos são fornecidos no quadro e ficam fora das colunas.
- O relatório usa o histórico persistido no backend; não estime métricas locais
  nem simule notificações ou execução de regras apenas no navegador.

- No login por e-mail, use `Form submitOnEnter` e `Input enterKeyHint="go"`: Enter aciona o mesmo submit de Continuar, incluindo validação e estado de envio.

- Na seleção de acesso individual aos quadros, `BoardSettingsForm` recebe `currentUser` da sessão: ao criar ou editar, inclui esse usuário uma única vez como `editor` no payload, mesmo fora da lista de membros. O seletor fica reservado aos demais participantes e mantém suas permissões. Informe o acesso automático na interface. Grupos de distribuição e responsáveis não são concessões de acesso.

## Fluxo dos cards nativos

- `CardFlowFields` centraliza próxima ação (título/data/conclusão/lembrete), bloqueio com responsável e dependências no editor. Preserve `dadosExtras` ao salvar; os novos campos são opcionais para compatibilidade com cards antigos.
- Dependências são entre cards do mesmo quadro. Use também `dependenciasResolvidas` da API para exibir referências arquivadas; somente o servidor autoriza transições, conclusão e ciclos.
- `ColumnFlowFields` e `columnRulesFromForm` compartilham requisitos de entrada e automações por coluna. Prazo de zero dias significa hoje no fuso da empresa; vazio mantém o prazo. Automações específicas do card prevalecem. Novas tarefas não disparam recursivamente a automação.
- `etapaDesde` vem do servidor e muda somente ao trocar de coluna ou restaurar. Edição e reordenação na mesma coluna não reiniciam a idade. Destaque após sete dias por padrão; configuração nula desativa o destaque. O relógio do quadro atualiza a cada minuto.
- `BulkCardActions` permite selecionar até 100 cards e mover, atribuir, etiquetar ou arquivar via `POST /kanban/boards/:id/cards/lote`. Envie versões `expectedUpdatedAt`; o backend valida o lote inteiro e desfaz tudo em caso de falha. Selecionar resultados respeita filtros; participantes leitores não recebem controles de escrita.
- `BoardReport` reúne o relatório histórico e `/metricas`: abertos, bloqueados, conclusões em 30 dias, tempo até a primeira conclusão e idade atual por etapa. Use controles e tabelas compartilhados, com rolagem interna em telas pequenas.
- Lembretes de próxima ação usam a fila de e-mails e preferências existentes; exigem responsável e configuração de e-mail ativa no backend. Não implemente envio direto no navegador.

- A sessão real do backend usa `userId`. `createAuthSession` normaliza esse identificador para `user.id` ao restaurar e autenticar, preservando os demais campos e as áreas separadas. Fixtures de autenticação precisam cobrir o formato real sem `id`, para não mascarar falhas de identificação do usuário atual.

## Legibilidade e responsabilidades verificadas

- Arquivos de produção em `src/` começam com `@file` descrevendo finalidade e limites; imports ficam no início e em grupos ordenados. Separe preparação, validação, execução e retorno com linhas em branco. As regras reais ficam em `eslint.rules.js` e `tooling/eslint/`, sem exceções globais para contornar o check.
- `pnpm lint:fix` aplica imports, espaçamento e Prettier. Revise o diff e rode `pnpm check`. Testes das regras estão em `pnpm test:lint`. Não formate migrations já aplicadas nem arquivos gerados.
- Arquivos `.api.js` cuidam de transporte/contratos e não importam React, componentes, páginas ou hooks. Componentes apresentam e emitem eventos; hooks compartilham estado/efeitos; `lib` contém transformações puras. Preserve os controles compartilhados e as regras de React existentes.

## Contexto para ações e áreas de trabalho

- Áreas cujo uso não é evidente precisam de título e descrição visíveis: explique a finalidade e as ações possíveis com termos do usuário. Use `SectionIntro` para manter tipografia e espaçamento consistentes; conecte a descrição com `aria-describedby` quando necessário.
- Ajuda essencial não pode depender de tooltip/hover: deve funcionar em tela pequena e com teclado. Reserve tooltips a detalhes complementares.
- Ao expandir um fluxo, mostre o próximo passo e explique limites e escopo da seleção. Em ações com efeitos distintos, apresente a consequência da ação escolhida antes da confirmação, incluindo onde recuperar um item arquivado.
- Exemplos e textos devem refletir o comportamento real: filtros salvos do Kanban são locais ao navegador; selecionar resultados respeita os filtros atuais e o limite de 100 cards. Preserve os contratos das ações ao acrescentar contexto.
