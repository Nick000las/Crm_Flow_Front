---
name: flow-frontend
description: Implementar e revisar telas, formulários e componentes React do Flow CRM, seguindo navegação, design system, confirmações destrutivas, autenticação e eventos em tempo real existentes. Usar neste repositório; não rege o backend.
---

# Padrões do frontend Flow CRM

## Localização e referências

Esta skill fica dentro do projeto frontend, na mesma árvore de `package.json`.
Execute comandos na raiz desse projeto, onde ficam `package.json` e `src/`. Use React com JavaScript/JSX, Vite e os aliases
`@/`. Não introduza outro framework ou TypeScript numa alteração de funcionalidade.

- Consulte [PADRAO_DE_CODIGO.md](../../../PADRAO_DE_CODIGO.md) para
  formatação e scripts. ESLint e Prettier são as referências executáveis.
- Reutilize `src/components/ui` (Base UI, Button, Dialog, Input etc.), os tokens
  de `src/index.css` e os componentes compartilhados de `src/components`.
- Páginas, hooks, componentes e regras próprias de produto ficam no respectivo
  diretório `src/modules/<modulo>`. Utilitários puros pertencem a `lib`.
- Componentes de referência: `src/components/confirmation-dialog.jsx`,
  `src/modules/kanban/components/card-editor.jsx` e o diálogo especializado
  `src/modules/admin/components/delete-tenant-dialog.jsx`.

## Interações e identidade visual

- Escreva rótulos e mensagens em português. Use tokens semânticos (`background`,
  `foreground`, `border`, `muted`, `primary`, `destructive`) para os controles;
  cores de etiquetas são categorias de produto, não novas cores de botões.
- Reutilize `Button` e suas variantes. Ações de exclusão são vermelhas desde o
  botão que abre a confirmação: use `variant="destructive"`. Em trechos legados
  do Kanban, use a classe existente `kb-button-danger`; não espalhe estilos inline
  nem crie outra classe de exclusão por tela.
- Exclusões persistidas de quadros, colunas, cards e comentários usam
  `ConfirmationDialog`, nunca `window.confirm`, `alert`, `prompt` ou equivalentes
  globais. ESLint bloqueia essas APIs.
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

## Navegação e acessibilidade

- As páginas do módulo são declaradas em `src/lib/modules-registry.js` e
  acessadas pelo shell/menu lateral. Não duplique esses destinos em abas na tela.
  Preserve o acesso ao menu em telas pequenas e links contextuais de retorno.
- Respeite `PageHeader`, a estrutura do shell e as permissões de navegação.
  A galeria do Kanban abre os quadros; gestão e seleção da equipe ficam na gestão.
- Inputs precisam de rótulos; botões só com ícone precisam de nome acessível.
  Cor não substitui texto. Preserve foco visível, foco dentro de modais, Escape,
  retorno de foco, leitura de erros e navegação por teclado.
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

- Use a sessão existente (`useAuth` ou `useAdminAuth`) e seu `authApi`; não crie
  outro cliente com tokens ou lógica de refresh paralela. Sessões master e tenant
  permanecem separadas. Não persista tokens em localStorage.
- Siga `src/services/api.js`, `api-error.js` e `ApiErrorAlert` para contratos e
  erros. Estados de carregamento, vazio e falha devem ser distinguíveis.
- Extraia componentes com responsabilidades claras; mantenha hooks no topo,
  limpe efeitos e ignore respostas antigas de requisições concorrentes.
- Filtrar opções por perfil na interface não concede permissão de API. No Kanban,
  criação/gestão de quadros exige DONO/MASTER e atribuições usam a equipe ativa.
- Preserve o `KanbanRealtimeProvider` e `useKanbanEvents`. Eventos invalidam dados
  que são reconsultados pela API. Não introduza polling periódico, salas sem
  autorização ou outro socket por componente.
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

- Reutilize os tokens e efeitos de `src/styles/motion.css`. Durações padrão:
  120 ms para feedback e 180 ms para entrada de conteúdo e modais, com a curva
  `--motion-ease-standard`. Não adicione outra biblioteca só para microinterações.
- O conteúdo dos shells usa `PageTransition`, que anima a troca de rota sem
  alterar keys ou remontar filhos. Não remonte formulários para disparar efeitos;
  uma atualização de dados ou renderização normal não deve repetir a transição.
- Modais nativos animam ao abrir; Base UI mantém seu ciclo de entrada e saída.
  A confirmação e o foco funcionam imediatamente. Não atrase gravações,
  exclusões, fechamento, navegação ou carregamento para esperar uma animação.
- Dê feedback de hover e foco nos elementos acionáveis, de arraste no card de
  origem e de entrada em comentários novos. Prefira opacity e transform; evite
  animar dimensões, deslocar colunas ou criar grandes movimentos de página.
- Todas as animações respeitam `prefers-reduced-motion`. `PageTransition`
  também cancela a animação se a preferência mudar durante sua execução.
  Spinners permanecem com o padrão acessível já existente.
- Efeitos visuais não mudam permissões, requisições ou estado de negócio. Confira
  foco, cliques rápidos, preservação de rascunhos e mensagens de erro no navegador.

## Validação e manutenção

- Formate somente os arquivos alterados com Prettier e execute `pnpm lint`.
  Não desligue regras para acomodar uma implementação.
- Execute testes relevantes para lógica alterada e `pnpm build` para alterações
  executáveis. Use `pnpm test` para os testes locais existentes.
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
