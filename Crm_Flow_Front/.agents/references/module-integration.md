# Integração dos módulos do Flow CRM

Consulte este guia junto à [skill do frontend](../skills/flow-frontend/SKILL.md).
Os caminhos de código abaixo são relativos à raiz que contém `package.json`.
O código é a referência para contratos e funcionalidades disponíveis.

## Inicialização e sessão

- `src/main.jsx` cria um único `QueryClient` por `createQueryClient` e mantém
  `QueryClientProvider`, `BrowserRouter`, `AuthProvider` e `AdminAuthProvider`
  na raiz. Navegar entre áreas não deve desmontar as sessões.
- `src/hooks/create-auth-session.js` implementa sessões independentes para tenant
  e master. Access tokens vivem em memória; o tenant restaura a sessão pelo
  refresh cookie httpOnly. A sessão master usa um cookie próprio, também persistente.
- `src/hooks/useAuth.js` consulta `/me` para resolver o usuário, incluindo
  `modulosAtivos` e `featuresAtivas`. Preserve essa resolução após o login.
- `authApi` oferece `get`, `post`, `put`, `patch`, `delete`, `upload`, `download`
  e `refreshAccessToken`. HTTP e Kanban em tempo real aguardam a mesma renovação
  em andamento; uma resposta 401 permite uma única retentativa HTTP.
- `src/services/api.js` preserva cookies nas requisições. Upload usa `FormData`
  sem fixar o boundary; download devolve `{ blob, filename }`. Erros binários e
  JSON continuam normalizados por `ApiError`.
- Os fluxos de login tenant e master renderizam um único desafio MFA por vez.
  Configuração de MFA da conta fica em `src/modules/configuracoes`.

A restauração usa `src/services/session.js`: `GET /auth/session` para tenant e
`GET /auth/session?scope=admin` para administração. Sem cookie válido, a resposta
é `200` com `{ accessToken: null, user: null }`, encerrando o carregamento sem
chamar refresh. Com sessão, devolve `{ accessToken, user }` com MFA, módulos e
flags. O prefixo `/auth` recebe cookies legados e migra o path automaticamente.
`/me` continua autenticada; `/auth/refresh` renova tokens após um 401 em operações
protegidas. Preserve `scope`, o bloqueio inicial das rotas e a invalidação de
respostas pendentes no logout.
Login, ativação, MFA e logout enviam o escopo da área (`tenant` ou `admin`).
Um MASTER com tenant pode usar o CRM: `/me` deve preservar os módulos e flags
do tenant para qualquer papel. Apenas usuários sem tenant recebem listas vazias.

## Rotas, navegação e permissões

- `src/routes/(app)/app.routes.jsx` reúne Dashboard, CRM, Kanban e configurações
  da conta. As rotas de administração ficam em `src/routes/(admin)`.
- `/crm` mantém `LeadsPage` montada enquanto `/crm/leads/:leadId` abre o
  `LeadSheet` por cima. Use `src/modules/crm/rotas.js` para caminhos, criação e
  retorno de foco. Preserve busca, filtros e paginação na URL.
- `/crm/importar` mantém seu portão de gestão. `/crm/configuracoes/:secao?`
  resolve a primeira subseção visível; `/crm/campos` mantém o redirecionamento
  para compatibilidade com links antigos.
- `/kanban` usa `KanbanLayout` e `KanbanRealtimeProvider`. A galeria abre um
  quadro por `?quadro=<id>`; `/kanban/quadros` acessa a gestão para DONO/MASTER.
- `src/lib/modules-registry.js` define os destinos. `modulosVisiveis` filtra
  módulos e páginas; o shell compartilha o resultado entre Rail e Sidebar,
  incluindo o menu para telas pequenas. Preserve `ativoEm` nos detalhes.
- `src/lib/acesso.js` centraliza papel, contratação e feature flags. Sem
  `modulosAtivos`, o filtro de contratação é permissivo; uma flag ausente fica
  desligada. Não acrescente `moduleKey` sem conferir o contrato do módulo.
- `RequireRole` protege a apresentação das rotas aplicáveis. O backend autoriza
  as operações. Erros `MODULE_NOT_ENABLED` e `FEATURE_NOT_ENABLED` mantêm o
  tratamento por `isAccessError` e pelo estado `AcessoIndisponivel`.

## Dados e funcionalidades do CRM

- Reutilize `src/modules/crm/api`, os hooks existentes e `crmKeys` em
  `src/modules/crm/query-keys.js`. Invalide os prefixos adequados após mutações;
  atividades e histórico têm chaves próprias, fora do prefixo do detalhe do lead.
- O catálogo de campos vem da API. Preserve opções e rótulos dinâmicos,
  permissões por campo, layout efetivo e validação das regras de campo.
- Configurações incluem layout, campos, listas, regras, permissões, duplicidade,
  distribuição, inatividade, pontuação, enriquecimento e privacidade. Consulte
  `lib/secoes-configuracoes.js` para papel, flag e disponibilidade, e
  `pages/configuracoes-page.jsx` para o mapa `TELA_DA_SECAO`. Uma seção nova
  precisa das duas entradas; leitura e edição podem ter permissões distintas.
- Preserve importação/exportação, ações em massa, atividades, histórico,
  arquivo/lixeira e anonimização conforme as flags e os contratos existentes.
  Uma tela introdutória de Kanban não substitui essas funcionalidades.

## Administração e notificações

- A página de tenant mantém `TenantIdentitySection`, `TenantStatusSection`,
  `TenantModulesSection` e `TenantFeaturesSection`. Contratação de módulos e
  ativação de funcionalidades são controles distintos.
- Identidade mantém `fusoHorario` em formato IANA, sugestões do navegador,
  validação pelo backend e atualização para o valor canônico após salvar.
- Remoção de acesso a módulos pede confirmação. Exclusão de tenant mantém
  confirmação digitada do subdomínio. Durante revalidação, preserve formulários
  e dados já carregados; mostre falhas e progresso na região correspondente.
- O `SinoNotificacoes` permanece no rodapé do Rail para usuários autenticados.
  `src/modules/notificacoes/lib/notificacoes.js` resolve os destinos do CRM e
  só aceita caminhos internos no fallback `dados.rota`.
- O contador de notificações usa recarga periódica própria. A orientação de não
  adicionar polling ao Kanban não remove essa atualização das notificações.

## Validação de integrações

Execute `pnpm check`. Ao alterar os contratos compartilhados, confira também
rotas aninhadas, navegação por perfil, restauração de sessão, refresh concorrente
entre HTTP e socket, upload multipart e download com nome de arquivo. Use mocks
ou dados de teste quando necessário e informe quais fluxos foram verificados com
o backend real. Build e testes locais não comprovam essa integração externa.
