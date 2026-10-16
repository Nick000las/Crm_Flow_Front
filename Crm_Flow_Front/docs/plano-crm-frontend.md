# Plano: interface do CRM (frontend)

Este documento é só o plano; nenhum código foi escrito. Ele parte do estado real dos dois repositórios em 2026-10-14. Do lado do back, o contrato está em [`Back/docs/crm/plano-campos-hibridos.md`](../../../Back/docs/crm/plano-campos-hibridos.md) (histórico; o plano vigente é [`Back/docs/crm/plano-configuracoes.md`](../../../Back/docs/crm/plano-configuracoes.md)).

**Decisões já tomadas:**
- **Estágio na criação:** passa a ser opcional no back. O lead nasce sem estágio, e o front não mostra estágio até o Kanban existir.
- **Dados:** TanStack Query.
- **Ajustes no back:** os que a interface precisa entram antes, como fase 0.

---

## 0. Estado atual do front

**Stack real:**
- **Base:** React 19 + Vite 8, em **JavaScript** (não TypeScript).
- **Rotas:** `react-router-dom` 7 com `useRoutes`, em [src/routes/](../src/routes/).
- **Estilo:** Tailwind 4, shadcn estilo `base-nova` sobre `@base-ui/react` e ícones `lucide-react`.
- **Fonte:** Geist Variable.

O [CLAUDE.md](../CLAUDE.md) ainda descreve App Router, TypeScript e Server Components, e está **desatualizado** (ver seção 10). A direção estética dele continua valendo:
- quase monocromático, com accent laranja (`--primary`) só no item ativo e na ação primária;
- borda de 1px, raio mínimo e sem sombra difusa;
- fonte mono para dado numérico;
- motion de 200 a 250 ms.

**O que pode ser reaproveitado:**
- **Sessão:** `useAuth()` ([create-auth-session.js](../src/hooks/create-auth-session.js)) expõe `authApi` (get/post/put/patch/delete), com refresh single-flight e uma retentativa em 401. Os tokens ficam só em memória. O `user` traz `{ tenantId, userId, role }`.
- **Cliente HTTP:** [services/api.js](../src/services/api.js) desembrulha o envelope `{ statusCode, data }`. Os erros viram `ApiError` com `code`, `fields` e `requestId`. Os helpers `getFieldError` e `toApiError` e o componente `ApiErrorAlert` já existem.
- **Navegação:** a fonte única é [lib/modules-registry.js](../src/lib/modules-registry.js), lida pelo Rail e pela Sidebar. Hoje o CRM tem uma página só ("Leads").
- **Componentes de tela:** `PageHeader` e `ModulePlaceholder` (para empty state).
- **UI disponível:** badge, button, card, checkbox, dialog, input, label, select, switch, table e tooltip.
- **Padrões de referência:** a área admin, com tabela, dialog com formulário e erro de campo vindo do Zod do servidor ([create-tenant-dialog.jsx](../src/modules/admin/components/create-tenant-dialog.jsx)).

**O que falta ou está desatualizado:**
- **Placeholder:** [crm-page.jsx](../src/modules/crm/pages/crm-page.jsx) ainda é só um placeholder.
- **`use-leads.js`:** espera um **array**, mas `GET /crm/leads` agora devolve `{ itens, total, pagina, tamanho }`. Também usa `accessToken` cru em vez de `authApi`, então não renova o token.
- **Upload e download:** o cliente HTTP só envia JSON e só lê JSON ou texto. Upload multipart (import) e download binário (export) não são suportados.
- **Sem toast:** por decisão do README, o cliente não dispara toast.
- **Sem fonte mono:** `font-mono` hoje cai na mono do sistema.
- **Papel e módulo:** a UI não conhece os módulos contratados e não esconde nada por papel.
- **Testes:** `pnpm test` é `node --test`, que só serve para funções puras.

---

## 1. Fase 0: ajustes no back (pré-requisito)

Todas as mudanças são pequenas e seguem os padrões do módulo CRM: Zod na borda, service, adapter e teste.

| # | Mudança | Por quê |
|---|---|---|
| 0.1 | `funilEstagioId` **opcional** em `POST /crm/leads` (o schema deixa de exigir; o repository já aceita `null`) | Não há estágios, então hoje ninguém consegue criar lead pela tela |
| 0.2 | `GET /crm/usuarios`: usuários **ativos** do tenant, `{ id, nome }`, ordenados por nome. Liberado a todos os papéis. Reaproveita `adapters/usuarios.repository.js` | Select de responsável e exibir o nome do responsável em vez do UUID |
| 0.3 | `/auth/me` passa a devolver `modulosAtivos: string[]` (de `tenant_modules` com `disabled_at IS NULL`) | O Rail esconde módulo não contratado; o back já bloqueia com 403 `MODULE_NOT_ENABLED` |
| 0.4 | `GET /crm/leads/fields` inclui `coluna` (snake_case) nos itens das Camadas 1 e 2 (de `CAMADA_1_CAMPOS`/`CAMADA_2_CAMPOS`) | A leitura do lead volta em snake_case (`fonte_lead`), e o form, o filtro e o payload usam a `chave` camelCase (`fonteLead`). Sem isso, o front teria que converter por convenção |
| 0.5 | Documentar no plano do back que `valor`, `probabilidade_fechamento` e `lead_score` (NUMERIC) chegam como **string** no JSON | O front precisa converter para número ao exibir e editar |

Em 0.3, o front passa a buscar sempre `/auth/me` depois do login, em vez de confiar no usuário que vem na resposta do login: um `resolverUsuario` próprio na sessão do tenant.

---

## 2. Fase 1: fundação no front

### 2.1 Dependências
- **Dados:** `@tanstack/react-query`. A devtools só em dev, opcional.
- **Fonte mono:** `@fontsource-variable/geist-mono`. Declarar `--font-mono` no `@theme` de [index.css](../src/index.css).
- **Componentes shadcn a adicionar** via `pnpm dlx shadcn add`, todos no estilo `base-nova` já configurado:

  | Componente | Uso |
  |---|---|
  | `sheet` | Detalhe e edição de lead |
  | `dropdown-menu` | Ações da linha, views |
  | `popover` | Construtor de filtro |
  | `tabs` | Página de campos |
  | `textarea` | Campos de texto longo |
  | `skeleton` | Carregamento da tabela |
  | `separator` | Divisões visuais |
  | `alert-dialog` | Confirmar exclusão |

  A data usa `<input type="date">` nativo estilizado; não entra date-picker novo agora.

### 2.2 Query client e cliente HTTP
- **`QueryClientProvider` em [main.jsx](../src/main.jsx):** um `QueryClient` com `retry` desligado para 4xx (`ApiError.status < 500`), porque erro de validação ou permissão não se repete, e `staleTime` curto (30 s).
- **[services/api.js](../src/services/api.js):** aceitar `body: FormData` sem forçar `Content-Type`, para o navegador montar o boundary. Novo modo `responseType: 'blob'`, que devolve `{ blob, filename }` lendo o `Content-Disposition`.
- **`authApi` em [create-auth-session.js](../src/hooks/create-auth-session.js):** ganha `upload(path, formData)` e `download(path, json)`, com o mesmo `withAuthRetry`. Isso evita que cada tela faça `fetch` cru e perca o refresh de token.

### 2.3 Navegação por módulo e papel
- **Registry:** em [modules-registry.js](../src/lib/modules-registry.js), cada módulo ganha `moduleKey` (a chave do back, `crm`) e cada página ganha `roles?` opcional.
- **Páginas do CRM:**

  | Página | Rota | Papéis |
  |---|---|---|
  | Leads | `/crm` | todos |
  | Importar | `/crm/importar` | `DONO`/`MASTER` |
  | Campos | `/crm/campos` | `DONO`/`MASTER` |

- **Rail e Sidebar:** filtram por `user.modulosAtivos` (0.3) e por `user.role`, nunca com regra no JSX. Uma função `podeVer(entry, user)` no próprio registry.
- **Rotas:** em [app.routes.jsx](../src/routes/(app)/app.routes.jsx), um wrapper `<RequireRole roles>` redireciona para `/crm` quando o papel não permite. É só UX: o back valida de verdade com 403.

### 2.4 Camada de dados do CRM (`src/modules/crm/`)
```
modules/crm/
├── api/            # funções finas sobre authApi (uma por rota), sem React
├── hooks/          # useQuery/useMutation + query keys
├── lib/            # funções puras: payload, diff, filtros, rótulos, formatação (testáveis com node --test)
├── components/     # tabela, form dinâmico, filtro, views, import, export, campos
├── pages/          # leads-page, importar-page, campos-page
├── constants.js    # espelho do back: OPERADORES_POR_TIPO, ESTRATEGIAS_DUPLICATA, PAPEIS_GESTAO, limites
└── types.js        # JSDoc: Lead, Campo, Filtro, ImportJob, FilterView
```
- **Query keys:** `['crm','campos']`, `['crm','leads',{filtro,pagina,tamanho}]`, `['crm','lead',id]`, `['crm','views']`, `['crm','usuarios']`, `['crm','definicoes']`, `['crm','visibilidade']` e `['crm','import',jobId]`.
- **Invalidação:**
  - salvar ou excluir lead invalida `leads` e `lead`;
  - mudar campos ou visibilidade invalida `campos`, `leads`, `definicoes` e `visibilidade`, porque a coluna some ou aparece.
- **Substituições:** remover `use-leads.js` e o `Lead` antigo de `types.js`.
- **Espelho de constantes:** `constants.js` replica `OPERADORES_POR_TIPO` do back. Comentar a origem (`Back/src/modules/nucleo/crm/constants.js`) para mudar os dois juntos.

---

## 3. Fase 2: página de Leads (lista)

```
┌ PageHeader: "Leads" · subtítulo · [Exportar] [+ Novo lead]   (Exportar só DONO/MASTER)
├ Toolbar: [🔍 busca............] [Filtros (2)] [Views ▾] [Colunas ▾]      total: 1.234 (mono)
├ Chips de filtro ativos: Status: Novo, Ganho ✕ · Renda entre 1.000–5.000 ✕ · limpar tudo
├ Tabela (borda 1px, cabeçalho mono uppercase 11px como em TenantsTable)
│   Nome | E-mail | Telefone | Status | Responsável | colunas extras escolhidas…
├ Paginação: ‹ 1 2 3 … › · tamanho [50 ▾]                            (mono)
```
- **Fonte da busca:** `POST /crm/leads/search`. A tabela usa essa rota, e não `GET /crm/leads`, porque filtro e paginação são o mesmo endpoint.
- **Estado na URL:** busca, filtros, página e tamanho ficam em `useSearchParams`, com o filtro em JSON compacto e codificado. Assim um link compartilhado reabre a mesma visão, e voltar no navegador funciona.
- **Busca textual:** debounce de 300 ms.
- **Colunas:**
  - o padrão é Nome, E-mail, Telefone, Status e Responsável;
  - o seletor "Colunas" lista **todos** os campos de `/crm/leads/fields`, o que inclui Camada 2 visível e Camada 3;
  - a escolha fica em `localStorage` por tenant, porque é conveniência de quem está vendo e não dado.
- **Renderização por tipo:**
  - número e data em `font-mono tabular-nums`;
  - seleção como `Badge` com rótulo legível (seção 8);
  - seleção múltipla como até 2 badges mais "+N";
  - booleano como "Sim/Não";
  - responsável pelo nome (0.2).
- **Estados:**
  - **carregando:** skeleton de linhas, mantendo a lista anterior durante a troca de página (`placeholderData: keepPreviousData`);
  - **erro:** `ApiErrorAlert`;
  - **vazio sem filtro:** `ModulePlaceholder` com CTA "Novo lead" e "Importar planilha" (este só para gestão);
  - **vazio com filtro:** "Nenhum lead encontrado" e um botão para limpar os filtros.
- **Linha:** clicar ou dar Enter abre o Sheet de detalhe (fase 3). O menu "⋯" tem Editar e Excluir, com confirmação em `alert-dialog`.
- **Módulo não contratado:** com 403 `MODULE_NOT_ENABLED`, a página mostra um empty state "CRM não contratado". Só aparece se o Rail falhar em esconder.

---

## 4. Fase 3: formulário dinâmico (criar, editar, detalhe)

Fica em um **Sheet lateral**, aberto pela própria lista, para não perder o contexto. Rotas `/crm/leads/:id` abrem o mesmo Sheet sobre a lista, o que permite link direto.

**Fonte única:** `/crm/leads/fields`, já ordenado por `ordem`. O form itera essa lista sem saber a camada de cada campo, exatamente como o back prevê. Além disso entram o select de **Responsável** (`/crm/usuarios`) e o **Valor**, que é campo fora de `/fields`.

**Renderizador por `tipo`** (`components/campo-dinamico.jsx`):

| tipo | Controle |
|---|---|
| `texto` | `Input` (`email`/`telefone` com `type` e `inputMode` adequados) |
| `numero` | `Input inputMode="decimal"` mono; aceita vírgula e converte para número |
| `data` | `<input type="date">`; envia `AAAA-MM-DD` (ISO) |
| `booleano` | `Switch` |
| `selecao` | `Select` com as `opcoes` |
| `selecao_multipla` | lista de `Checkbox`; sem `opcoes` (caso de `tags`), vira um input de tags livres (Enter adiciona, ✕ remove) |

**Payload** (`lib/payload.js`, função pura e testada):
- Camadas 1 e 2 vão no nível raiz, pela `chave` camelCase; a Camada 3 vai em `customFields`.
- **Criação:** só envia o que foi preenchido.
- **Edição:** gera um **diff** contra o lead carregado.
  - campo não alterado **não vai**;
  - campo esvaziado vai como **`null`**, que limpa no back;
  - campo customizado esvaziado vai como `customFields: { chave: null }`.
  - Para comparar, a leitura do lead (snake_case) é convertida para os valores do form usando `coluna` (0.4).
- **Conversões:**
  - NUMERIC em string vira número;
  - o telefone formatado `(11) 99999-0000` é aceito como está.

**Validação:**
- **No cliente, só para UX:**
  - obrigatório marcado com `*`;
  - aviso "Informe e-mail ou telefone" quando os dois estão vazios.
- **No back, a validação de verdade:** a resposta de erro é mapeada para o campo com `getFieldError(error, chave)`, inclusive `customFields` e `filtros.*`.
  - Os erros específicos da edição aparecem inline no campo: "O lead precisa manter e-mail ou telefone" e "é obrigatório e não pode ser limpo".

**Detalhe (modo leitura):**
- os campos aparecem agrupados em "Contato" (Camada 1), "Dados adicionais" (Camada 2) e "Campos personalizados" (Camada 3), com `label` e valor formatado;
- o botão Editar troca para o form no mesmo Sheet;
- metadados em mono e discretos: ID e responsável.

---

## 5. Fase 4: filtros e views salvas

**Construtor de filtro** (Popover "Filtros"):
- **Cada linha:** `[Campo ▾] [Operador ▾] [Valor]`.
  - O campo vem de `/fields`.
  - Os operadores são filtrados por `OPERADORES_POR_TIPO[tipo]`.
  - O valor muda conforme o operador:
    - `entre`: dois inputs "de/até" (número ou data);
    - `e_um_dos`: checkboxes das opções ou tags;
    - `vazio`/`nao_vazio`: sem valor.
- **Filtros fixos:** criado de/até, valor mín/máx e responsável (`usuarioResponsavelId`, de 0.2).
- **Rótulos dos operadores:**

  | Operador | Rótulo |
  |---|---|
  | `igual` | é |
  | `contem` | contém |
  | `entre` | entre |
  | `e_um_dos` | é um de |
  | `vazio` | está vazio |
  | `nao_vazio` | está preenchido |

- **Aplicação:** o filtro só é aplicado no botão "Aplicar", e não a cada tecla, porque cada aplicação é uma busca.
- **Chips:** os filtros ativos aparecem como chips abaixo da toolbar.
- **Erro do back:** um 400 de filtro com `fields['filtros.<chave>']`, como campo desligado depois de uma view salva, destaca a linha correspondente e o chip.

**Views salvas** (dropdown "Views"):
- lista `GET /crm/filter-views`;
- aplicar uma view substitui o filtro da URL;
- "Salvar visão atual…" abre um dialog com o nome, e 409 aparece inline no campo;
- excluir pede confirmação;
- as views são **do usuário**, então não há compartilhamento.

---

## 6. Fase 5: página "Campos" (DONO/MASTER)

`/crm/campos`, com `Tabs`:

**Aba "Campos do sistema" (Camada 2)**
- Fonte: `GET /crm/field-visibility`, que sempre traz as 15 colunas.
- Tabela: Campo (rótulo vindo de `/fields` ou de um mapa local), Visível (Switch), Obrigatório (Switch, desabilitado se não estiver visível) e Ordem.
- Salvar envia `PUT /crm/field-visibility` com **só as linhas alteradas**.
- Texto de ajuda: desligar um campo não apaga os dados já preenchidos (filosofia do back).

**Aba "Campos personalizados" (Camada 3)**
- **Lista:** `GET /crm/field-definitions`.
- **Criar e editar:** dialog com Rótulo, Tipo, Opções (só para seleção; editor de lista com adicionar e remover) e Obrigatório.
- **Chave:** é gerada pelo back e mostrada em mono como somente leitura depois de criada.
- **Ordem:** botões ↑/↓ por linha, que disparam `PUT /crm/field-definitions/reorder`. É a alternativa acessível ao drag-and-drop pedida no MASTER_DOCUMENT §4.3; o drag pode vir depois.
- **Excluir:** `alert-dialog` mostrando o `aviso` que o back devolve no DELETE (dado órfão preservado).

---

## 7. Fase 6: import e export (DONO/MASTER)

**Importar** (`/crm/importar`), um wizard de 4 passos com indicador `1 Arquivo · 2 Mapear · 3 Revisar · 4 Processar`:

1. **Arquivo.**
   - Dropzone e input para `.xlsx`, validados no cliente antes do envio: no máximo 10 MB e 5.000 linhas, limites que o back confirma.
   - Envia `authApi.upload('/crm/import/preview')`.
2. **Mapear.**
   - **Tabela:** uma linha por coluna da planilha, com um select de destino (os `campos` do preview, incluindo `valor` e `funilEstagio`) e as 3 primeiras amostras em mono.
   - **Pré-seleção:** quando o nome da coluna bate com o `label` ou a `chave`, o destino já vem preenchido.
   - **Aviso no cliente:** obrigatório não mapeado e "mapeie e-mail ou telefone", espelhando o back.
   - **Estratégia de duplicata:** radio entre Pular, Atualizar e Criar mesmo assim, cada uma com uma frase explicando o efeito.
3. **Revisar.**
   - Envia `POST /crm/import/validate` (multipart com o arquivo de novo, `mapeamento` e `estrategiaDuplicata`).
   - Mostra o resumo "N válidas de M" e a tabela de erros por linha (linha, coluna e motivo).
   - Permite baixar o relatório em CSV, gerado no cliente.
   - "Confirmar importação" só aparece com `jobId`. Sem nenhuma linha válida, a tela pede para voltar e corrigir.
4. **Processar.**
   - Envia `POST /crm/import/:jobId/confirm`.
   - Faz **polling** de `GET /crm/import/:jobId` com `refetchInterval` de 2 s enquanto o status for `processando`.
   - Mostra uma barra `linhas_processadas/total_linhas` e os contadores criadas, atualizadas, ignoradas e com erro.
   - No fim, `relatorio_erro`, um link para os leads e a invalidação de `leads`.
   - **503 `QUEUE_UNAVAILABLE`:** mensagem clara ("A fila de importação está indisponível…") e botão "Tentar novamente", porque o job continua `pendente` no back.
   - **Retomada:** o `jobId` fica na URL (`?job=`) para retomar o acompanhamento depois de recarregar a página.

**Exportar** (dialog aberto da página de Leads):
- checklist de colunas a partir de `/fields` + `valor`/`funilEstagio`, com reordenação ↑/↓;
- o padrão é igual às colunas visíveis da tabela;
- opção "Usar os filtros atuais", ligada por padrão;
- envia `authApi.download('/crm/export', { colunas, filtro })` e dispara o download do blob como `leads.xlsx`;
- o 400 de limite ("O filtro retorna N leads…") aparece inline no dialog.

---

## 8. Detalhes transversais

- **Rótulos de opção:** os valores de seleção da Camada 1 e 2 vêm crus (`em_contato`, `trafego_pago`). Um mapa em `lib/rotulos.js` traduz os valores conhecidos (status, fonte e motivo de perda), com fallback para humanizar (trocar `_` por espaço e capitalizar). As opções da Camada 3 já são texto do usuário.
- **Status com significado:** só `ganho` e `perdido` ganham tom diferente no badge, discreto e acessível (não só por cor, também com texto). O resto fica neutro, mantendo a paleta quase monocromática.
- **Datas:** exibir em `dd/MM/aaaa` com `Intl.DateTimeFormat('pt-BR')`. Os campos de data do lead são `TIMESTAMP` sem fuso, então tratar como data local para não "voltar um dia".
- **Números e moeda:** `Intl.NumberFormat('pt-BR')`, e `valor` como BRL, tudo em mono.
- **Erros por `code`, nunca por mensagem:**
  - `MODULE_NOT_ENABLED` vira empty state;
  - `FORBIDDEN` mostra "sem permissão" e esconde a ação;
  - `VALIDATION_ERROR` vai para o campo;
  - `RESOURCE_CONFLICT` vai para o campo de nome;
  - `QUEUE_UNAVAILABLE` mostra a mensagem com "tentar novamente".
- **Feedback de sucesso:** sem toast, seguindo a decisão do README.
  - fechar o Sheet ou dialog e atualizar a lista já é o feedback;
  - ações destrutivas mostram uma confirmação inline breve (`role="status"`).
- **Acessibilidade:**
  - foco visível em tudo;
  - o Sheet devolve o foco à linha de origem;
  - a tabela navega por teclado (Enter abre);
  - todo ícone sem texto tem `aria-label`;
  - os erros têm `aria-describedby` ligado ao campo;
  - o filtro e o import funcionam sem mouse.

---

## 9. Testes e verificação

- **Funções puras (`node --test`):** testes de `lib/`:
  - diff de edição (omitido, alterado e esvaziado para `null`, inclusive `customFields`);
  - payload de criação por camada;
  - serialização e parse do filtro na URL;
  - rótulos;
  - conversões de número e data;
  - auto-mapeamento do import.
- **`pnpm lint` e `pnpm build`** sem erros.
- **Manual contra o back local** (`pnpm dev` nos dois), com um tenant que tenha `crm` contratado e um usuário DONO e outro OPERADOR:
  - OPERADOR não vê Importar e Campos no menu, e a URL direta redireciona;
  - criar lead sem estágio (0.1), editar limpando o e-mail, e tentar limpar o único contato para ver o erro inline;
  - ligar um campo da Camada 2 e criar um da Camada 3; os dois aparecem no form, no filtro e no seletor de colunas;
  - filtro combinado, salvar view, recarregar a página e reaplicar pela URL;
  - export com filtro abre no Excel;
  - import completo: com Redis, até `concluido`; sem Redis, validar a mensagem de 503.

---

## 10. Ordem de entrega

| Etapa | Conteúdo | Depende de |
|---|---|---|
| 0 | Ajustes no back (0.1–0.5) | — |
| 1 | Fundação: dependências, query client, upload e download no cliente, registry com papel e módulo, `RequireRole`, `modules/crm/api` e `hooks` | 0 |
| 2 | Lista de leads com busca, paginação, colunas e estados | 1 |
| 3 | Sheet de detalhe e form dinâmico (criar, editar, excluir) | 2 |
| 4 | Construtor de filtro e views salvas | 2 |
| 5 | Página Campos (Camadas 2 e 3) | 1 |
| 6 | Import (wizard e polling) e Export | 2 |
| 7 | Atualizar o [CLAUDE.md](../CLAUDE.md) para a stack real e o [README](../README.md) (cliente com upload e download, TanStack Query) | — |

As etapas 3, 4 e 5 podem andar em paralelo depois da 2.

**Fora do escopo agora:**
- Kanban e estágios do funil (aguardam a integração com `modulo_kanban_universal`);
- tema Camaleão por tenant;
- dark mode (os tokens `.dark` existem, mas não há alternador);
- drag-and-drop para ordenar campos (as setas ↑/↓ resolvem a acessibilidade primeiro);
- notificações em tempo real (socket).
