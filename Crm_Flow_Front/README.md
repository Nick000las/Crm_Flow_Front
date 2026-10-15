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
