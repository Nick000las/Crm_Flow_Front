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
- **CRM › Configurações**: subseções em `modules/crm/lib/secoes-configuracoes.js`, com papel e flag **por subseção** (Campos e Listas são de DONO/MASTER; Layout é de todos). O item do menu só aparece se alguma subseção for visível (`paginaVisivel`). Campos vale sempre; as demais nascem atrás da flag própria (`crm.listas`…) e entram com `pronta: true` e uma tela em `TELA_DA_SECAO`. Campos usa só `/crm/configuracoes/campos*` (matriz, nome, ordem) e `/crm/field-definitions` (criar/editar/excluir personalizado). Cada tela consome os campos do seu contexto com `camposDoContexto` (`create_form`/`detail`/`table`/`filter`) sobre uma única `GET /crm/leads/fields`. Ordem por arrastar com `@dnd-kit` via `components/ordenavel/` (+ ↑/↓ como alternativa).
- **Listas do tenant** (status, origem, motivo de perda, tags): opções e rótulos vêm de `/crm/leads/fields` (`opcoes` = keys ativas, `opcoesLista` = todas). Nunca rótulo fixo no front — passe por `lib/opcoes.js` (`opcaoDoCampo`, `opcoesDoSeletor`, `opcoesDoFiltro`). A cor da opção é um marcador no `OpcaoBadge`; o texto continua grafite (contraste em `src/lib/contraste.js`).
- **Layout do lead** (flag `crm.layout`): `GET /crm/layout` → `efetivo` (padrão do tenant + override do usuário). Tabela e drawer leem por `useLayoutEfetivo()`; `null` = interface de antes. Título sempre por `tituloDoLead` (identificador → Nome → "Lead sem nome"), formatação por `textoDoValor` (`lib/layout.js`).
- **Arquivo e lixeira** (flag `crm.arquivo`): `situacao` (`ativos`/`arquivados`/`lixeira`) é filtro fixo da busca — fica no `EstadoLista` (URL `?situacao=`) e na view (`visaoDoEstado`/`estadoDaVisao`), nunca vira chip. Sem a flag, `situacaoDaBusca` força `ativos` (`lib/arquivo.js`). Lead da lixeira dá 404 no detalhe: a linha não abre, só restaura.
- **Atividades e histórico** (flag `crm.atividades`): o drawer ganha abas Dados · Atividades · Histórico (`lead-abas.jsx`; só a aba aberta busca). Query keys `atividades(id)`/`historico(id)` ficam fora do prefixo `lead(id)`. Concluir/reabrir atividade recarrega o lead (`ultima_interacao_em`); editar ou arquivar o lead recarrega o histórico. Tipos da atividade vêm da lista `tipo_atividade` (`useListas`); frases do histórico por `frasesDoEvento` (`lib/historico.js`, valores via `textoDoValor`).
- **Duplicidade e mesclagem** (flag `crm.duplicidade`): regras em Configurações › Duplicidade (todos leem, DONO/MASTER alteram). O form checa ao sair de e-mail/telefone/CNPJ/CPF (`POST /crm/leads/duplicados`, vazio sem a flag — o form não conhece a flag) e trata o 409 `DUPLICATE_WARNING`/`DUPLICATE_BLOCKED` no `DuplicadosDialog` (candidatos em `error.details.duplicados`; "Salvar mesmo assim" reenvia com `ignorarDuplicados`). Mesclar (DONO/MASTER): menu "⋯" ou 2 leads marcados na tabela (`useSelecaoLeads`, zera ao trocar a consulta); comparação em `lib/mesclagem.js`. O Sheet do lead é montado com `key={leadId}`.
- **Regras de campo** (flag `crm.regras`): Configurações › Regras de campo (DONO/MASTER; todos leem, porque o form aplica). `lib/regras.js` é **espelho** de `avaliarRegras` do back — os dois rodam `lib/regras.casos.json` (cópia de `Back/src/modules/nucleo/crm/testing/regras.casos.json`; mudou lá, copie de novo). O form reavalia a cada render (`avaliarNoForm` → `camposComRegras`): esconde os ocultos e marca os obrigatórios; esconder não limpa valor. O 400 do back é a palavra final.
- **Lead esfriando** (flag `crm.inatividade`): o back decide e manda `esfriando_desde` (ISO ou `null`); o front só mostra o `SeloEsfriando` ("Esfriando há N dias", `lib/inatividade.js`), nunca calcula. O filtro é `esfriando: true` no `FiltroAplicado` (URL, views, export, chip "Esfriando"); sem a flag, `filtroDaBusca` o tira da busca. A view do sistema "Esfriando" vem do back (`sistema: true`): selo, sem excluir. Configurações › Inatividade: dias por status (todos leem, DONO/MASTER editam; só categoria `aberto` esfria).
- **Notificações** (core, sem flag): sino no rodapé do Rail (`modules/notificacoes/`), recarga a cada 60 s e ao abrir (sem push). Para onde cada uma leva é `destinoDaNotificacao`, com uma regra por `modulo` (CRM: `dados.rota` `/crm/leads` → `/crm` com `dados.filtro` na URL).
- **Sem responsável** (sem flag): `semResponsavel: true` no `FiltroAplicado` (lead sem dono ou com dono desativado). Junto com `usuarioResponsavelId` o back dá 400, então no construtor é a opção `RESPONSAVEL_NENHUM` do mesmo select "Responsável", e `lerFiltro` descarta o `semResponsavel` quando os dois vêm juntos.
- **Edição em massa** (flag `crm.massa`, qualquer papel): a seleção da tabela (`useSelecaoLeads`) vai até `BULK.MAX_IDS` (200) com "selecionar a página" no cabeçalho; sem a flag, serve só para mesclar (2). `EditarEmMassaDialog` monta o `PATCH /crm/leads/bulk` por `alteracoesDoForm` (`lib/massa.js`; checkbox por alteração, para "tirar o responsável" ≠ "não mexer"). A resposta é sempre 200 com resultado por lead: as falhas são listadas e só elas continuam marcadas. Export com a flag: formato `.xlsx`/`.csv` e as colunas Responsável/Criado em (`itensIniciais(…, { comMassa })`).
- **Primeiro nome** (`primeiroNome`, sem flag): campo do sistema comum em `/fields`; vazio volta ao derivado do Nome (o diff já manda `null`). Dica no form por `AJUDA_POR_CHAVE` (`lib/form-lead.js`).
- **Tipos de campo do M11** (sem flag): `cpf`, `cnpj` (alfanumérico) e `cep` chegam e vão **sem máscara** — o front mascara no input (`mascarar*`) e na leitura (`formatar*`, por **tipo**, nunca por chave); `hora` (`HH:MM`, `type="time"`), `usuario` (id; opções de `useUsuarios`), `intervalo_datas` (`{ de, ate }`) e `endereco` (objeto, só as partes preenchidas; `PARTES_ENDERECO`). Conversões em `paraValorDeForm`/`paraValorDeApi` (`lib/form-lead.js`; o diff compara objeto por JSON), controles em `campos-texto.jsx`/`campos-compostos.jsx`. No filtro, `entre` em período é sobreposição (`lib/regras.js` espelha o back).
- **Enriquecimento por CNPJ** (flag `crm.cnpj`): com `config.ativo`, a `LupaCnpj` aparece sob cada campo de tipo `cnpj` no form; as sugestões (`lib/cnpj.js`, `itensDaSugestao`) vêm marcadas se o campo está vazio ou igual e só **preenchem o form** — quem salva é o usuário. Com `status: ok`, o que a Receita devolveu e não está nas sugestões aparece só para leitura (`dadosParaLeitura`: rótulos e ordem de `camposReceita`, endereço numa linha), com link (nova aba) para Enriquecimento por CNPJ/Campos; situação fora de ATIVA ganha selo (`situacaoDestacada`). O 400 de DV vai para o erro do próprio campo CNPJ; o 403 (desligado depois de a tela carregar) desabilita a lupa. Configurações › Enriquecimento por CNPJ (todos leem, DONO/MASTER alteram): ligado, modo (lupa/automático), sobrescrever e mapeamento dado → `id` do campo (`camposCompativeis` por tipo; 400 em `mapeamento.<dado>` na linha). O modo automático aparece só no histórico (evento `enriquecido`, autor "Sistema").
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