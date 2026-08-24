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
- envia e recebe JSON;
- desempacota respostas de sucesso no formato `{ statusCode, data }`;
- transforma falhas HTTP, de rede e de serialização em `ApiError`;
- aceita `accessToken` para rotas protegidas.

Os métodos retornam diretamente o corpo da resposta já convertido de JSON:

```js
import { api } from '@/services/api'

const leads = await api.get('/crm/leads', { accessToken })
const newLead = await api.post('/crm/leads', lead, { accessToken })
```

Erros do backend preservam `status`, `code`, `message`, `fields`, `details` e
`requestId`. Fluxos condicionais devem usar `code`; mensagens são exibidas com
o componente acessível `ApiErrorAlert`. Formulários mostram erros inline,
carregamentos de página mantêm um estado persistente e cancelamentos são
silenciosos. O cliente HTTP não dispara toast, evitando feedback duplicado.

Rotas como `/crm/leads` exigem um access token JWT válido. A autenticação começa
em `POST /auth/login`.

## Qualidade

```bash
pnpm test
pnpm lint
pnpm build
```
