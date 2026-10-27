# CRM Flow Frontend

Frontend em React e Vite conectado ao backend do CRM Flow.

## Rodando localmente

Primeiro, no repositório do backend, prepare o ambiente e inicie a API:

```bash
cp .env.example .env
pnpm install
pnpm dev
```

O backend inicia em `http://localhost:3000`.

Depois, neste repositório:

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Acesse `http://localhost:5173`. A rota inicial redireciona para o login.

## Configuração

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3000` | URL pública do backend acessível pelo navegador |

Somente variáveis públicas podem usar o prefixo `VITE_`. Segredos JWT e dados
de banco permanecem exclusivamente no backend. Em deploy, defina
`VITE_API_URL` explicitamente com a URL pública do ambiente; o fallback local é
destinado apenas ao desenvolvimento.

## Cliente HTTP

As chamadas são centralizadas em `src/services/api.js`. O cliente:

- monta URLs a partir de `VITE_API_URL`;
- envia JSON (`json`) ou multipart (`upload`, com `FormData` — o navegador monta o boundary);
- lê JSON, ou binário com `responseType: 'blob'` (`download`, que devolve `{ blob, filename }`
  a partir do `Content-Disposition`);
- desempacota respostas de sucesso no formato `{ statusCode, data }`;
- transforma falhas HTTP, de rede e de serialização em `ApiError`.

Em telas autenticadas, use sempre o `authApi` da sessão (`useAuth()`), nunca
`api` com token cru: ele injeta o access token e, num 401, renova uma vez
(refresh single-flight) e repete a chamada.

```js
const { authApi } = useAuth()

const pagina = await authApi.post('/crm/leads/search', { paginacao: { pagina: 1, tamanho: 50 } })
const preview = await authApi.upload('/crm/import/preview', formData)
const { blob, filename } = await authApi.download('/crm/export', { colunas: ['nome'] })
```

Erros do backend preservam `status`, `code`, `message`, `fields`, `details` e
`requestId`. Fluxos condicionais devem usar `code`; mensagens são exibidas com
o componente acessível `ApiErrorAlert`. Formulários mostram erros inline,
carregamentos de página mantêm um estado persistente e cancelamentos são
silenciosos. O cliente HTTP não dispara toast, evitando feedback duplicado.

## Sessão

- **Tenant:** o access token vive só em memória; o refresh token fica num
  cookie httpOnly gravado pelo back (`refresh_token`, path `/auth`). Ao abrir
  a página, a sessão se restaura por ele — um F5 não desloga. Front e back
  precisam estar no mesmo site (`localhost` com `localhost`, não com
  `127.0.0.1`) para o cookie ir junto.
- **Admin (MASTER):** tudo em memória, de propósito — um F5 desloga.

## Dados

Leitura e escrita passam por TanStack Query (`QueryClientProvider` em
`main.jsx`, configuração em `src/lib/query-client.js`): sem retentativa em 4xx
e `staleTime` de 30 s. Em cada módulo:

```
modules/<modulo>/
├── api/         # uma função fina por rota, sobre authApi — sem React
├── hooks/       # useQuery/useMutation; query keys em query-keys.js
├── lib/         # regras puras (payload, diff, filtros, formatação), testadas com node --test
├── components/  # apresentação
└── pages/       # composição
```

## CRM: campos por tela

`GET /crm/leads/fields` traz `visibilidade` em cada campo. Cada tela filtra a
mesma resposta com `camposDoContexto(campos, CONTEXTO.X)`
(`modules/crm/lib/contextos.js`): formulário de criação, ficha, colunas da
tabela e construtor de filtro. Uma chamada e um cache para a lista inteira.

A área **Configurações** do CRM (`/crm/configuracoes/:secao`) é de DONO/MASTER.
A subseção Campos vale sempre; as próximas (Listas, Layout…) aparecem quando a
flag delas é ligada para o tenant (no admin, seção "Feature flags").

Status, origem, motivo de perda e tags são **listas do tenant** (Configurações ›
Listas, flag `crm.listas`): rótulo, cor e opções ativas vêm de
`/crm/leads/fields` (`opcoesLista`), nunca de constante no front.

Com `crm.layout`, cada tenant define o **layout do lead** (identificador, subtítulo,
destaques, seções e colunas padrão) e cada usuário pode ter o seu (Configurações ›
Layout do lead, aberto também ao OPERADOR).

Com `crm.arquivo`, a lista ganha as abas **Ativos · Arquivados · Lixeira** (filtro
fixo `situacao` da busca, guardado na URL e nas views). "Arquivar" é a ação de
destaque do lead; "Excluir" manda para a lixeira, de onde dá para restaurar por 30
dias. A lixeira não abre o lead nem exporta. Sem a flag, a lista é a de antes.

Com `crm.atividades`, o drawer do lead tem as abas **Dados · Atividades · Histórico**:
registrar (inclusive "já aconteceu"), concluir/reabrir, editar e remover atividades,
e a lista de mudanças do lead ("Ana mudou Status de Novo para Ganho"). Os tipos de
atividade são a lista "Tipos de atividade" de Configurações › Listas.

Com `crm.duplicidade`, cada empresa define em Configurações › Duplicidade quais dados
(e-mail, telefone, CNPJ, CPF) contam como duplicado e se o CRM **avisa** ou **bloqueia**.
O formulário mostra os parecidos ao sair desses campos e, ao salvar, pede confirmação
(ou bloqueia). DONO e MASTER mesclam dois leads pelo menu "⋯" ou marcando 2 na tabela;
o outro vai para a lixeira como "Mesclado em outro lead". No import, o passo Revisar
mostra as linhas parecidas e deixa escolher pular, atualizar ou criar por linha.

Com `crm.regras`, DONO e MASTER definem em Configurações › Regras de campo quando um
campo fica obrigatório ("Motivo da perda quando o status é Perdido") ou só aparece
("Empresa só quando Origem é Evento"). O formulário do lead aplica as regras enquanto
a pessoa digita; quem valida de verdade é o back.

Com `crm.inatividade`, cada status aberto tem um prazo em dias (Configurações ›
Inatividade). Lead sem interação além do prazo ganha o selo **Esfriando há N dias** na
tabela e no drawer, e a view do sistema **Esfriando** lista só esses. Ganho e perdido não
esfriam. O cálculo é do back; o front só mostra `esfriando_desde`.

Com `crm.massa`, qualquer papel marca até 200 leads (ou a página inteira) e usa
**Editar em massa** para trocar status, origem e responsável, ou somar e tirar tags. Cada
lead passa pelas mesmas regras da edição normal; os que falham aparecem com o motivo e
continuam marcados. O export ganha o formato `.csv` e as colunas Responsável e Criado em.

O **primeiro nome** é um campo do sistema: se ficar vazio, o CRM usa o primeiro nome do
Nome (e acompanha quando o Nome muda, até alguém editá-lo à mão).

Campos podem ser também **CPF, CNPJ e CEP** (com máscara na tela, gravados sem ela),
**Hora**, **Usuário**, **Período** (de/até) e **Endereço** (CEP, logradouro, número,
complemento, bairro, cidade e UF). CNPJ aceita o formato alfanumérico.

Com `crm.cnpj`, o formulário ganha **Buscar dados na Receita** ao lado do CNPJ: as
sugestões aparecem para revisar e só entram no formulário — o lead é salvo pelo usuário.
O resto do que a Receita devolveu aparece só para leitura.
Em Configurações › Enriquecimento por CNPJ, DONO e MASTER escolhem entre a lupa e o
preenchimento automático ao salvar, se sobrescreve campos já preenchidos e para que
campo vai cada dado da Receita.

Com `crm.distribuicao`, Configurações › Distribuição define quem recebe cada lead novo
(no cadastro e no import) quando ninguém escolheu o responsável. As regras são avaliadas
de cima para baixo (arraste para reordenar) e a primeira que casar manda o lead para um
usuário ou para um grupo, em rodízio. Sem regra que case, vale o rodízio geral ou o lead
fica sem responsável. As regras são um rascunho até o **Salvar**; os grupos salvam na
hora. Com a distribuição ligada, o responsável vazio no cadastro aparece como
**Automático**, e o lead mostra "Atribuído pela regra X".

Com `crm.permissoes`, Configurações › Permissões por campo (DONO e MASTER) define, para
o OPERADOR, se cada campo é **Editar**, **Só ver** ou **Oculto**. Só ver aparece travado
no formulário ("Sem permissão para editar"); oculto some do lead, da tabela, dos filtros e
do histórico. O Nome é sempre editável, e e-mail ou telefone precisa continuar editável.

## Notificações

O sino no Rail (para todo usuário logado, sem flag) mostra as não lidas, a lista
paginada e "Marcar todas como lidas". Clicar marca como lida e leva ao destino — no
resumo diário do CRM, a lista de leads já filtrada em Esfriando; num lead atribuído
pela distribuição, o próprio lead; num import distribuído, a lista dos leads recebidos. Não há push: recarrega
a cada minuto e ao abrir.

Documentação do back: `Back/docs/crm/` (plano vigente em `plano-configuracoes.md`).

## Usuários de teste

Ainda não há tela de convite de usuários. No repositório do backend:

```bash
pnpm create:tenant -- --nome="Empresa Teste" --subdomain=empresa-teste --owner-nome="Dono Teste" --owner-email=voce+dono@exemplo.com --modulos=crm
pnpm create:user -- --tenant=empresa-teste --email=voce+operador@exemplo.com --nome="Operador Teste" --role=OPERADOR
```

Os usuários nascem sem senha: no primeiro login chega um código por e-mail
para criá-la. O MASTER (`pnpm create:master`) não vê módulos de cliente.

## Qualidade

```bash
pnpm test   # node --test: arquivos *.test.js ao lado das funções puras
pnpm lint
pnpm build
```
