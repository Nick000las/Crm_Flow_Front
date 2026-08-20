# CRM Flow Frontend

Frontend em React e Vite conectado ao backend do CRM Flow.

## Rodando localmente

Primeiro, no repositório do backend, prepare o ambiente e inicie a API:

```bash
cp .env.example .env
pnpm install
pnpm dev
```

O backend inicia em `http://localhost:3000` e precisa responder em
`GET /health`.

Depois, neste repositório:

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Acesse `http://localhost:5173`. A tela inicial consulta o health check e mostra
se a comunicação foi concluída.

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
- transforma respostas HTTP inválidas em `ApiError`;
- aceita `accessToken` para rotas protegidas.

O health check é cancelado após oito segundos e pode ser repetido pela tela em
caso de falha.

O endpoint `/health` é público. Rotas como `/crm/leads` exigem um access token
JWT válido; o backend ainda não oferece uma rota de login.

## Qualidade

```bash
pnpm lint
pnpm build
```
