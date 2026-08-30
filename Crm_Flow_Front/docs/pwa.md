# Flow CRM no celular (PWA)

O build de produção inclui manifesto, ícones regulares e maskable, ícone para
Apple, service worker e modo `standalone`. A aplicação continua funcionando no
navegador em dispositivos que não oferecem instalação.

## Instalar

Abra **Configurações → Aplicativo no celular**. Quando o navegador oferece o
prompt nativo, o botão **Instalar aplicativo** abre a instalação.

- Android: menu do navegador → Instalar aplicativo / Adicionar à tela inicial.
- iPhone/iPad: Safari → Compartilhar → Adicionar à Tela de Início.

O aplicativo precisa de internet para consultar dados e gravar alterações.
O cache contém somente a estrutura pública e os arquivos estáticos. Respostas da
API, cookies, tokens, dados de leads, anexos e URLs de formulários públicos não
são gravados pelo service worker. O cache não cria uma fila de edições offline.
Após recarregar offline, a sessão ainda precisa ser validada pela API; a tela de
recuperação permite tentar novamente quando a conexão voltar.

## Publicação

1. Defina `VITE_API_URL` antes de gerar o build, com a URL pública HTTPS do backend
   (ou um caminho como `/api`, atendido por proxy na mesma origem).
2. Execute `pnpm build` e publique o conteúdo de `dist/` na raiz do domínio.
3. Sirva por **HTTPS**. `localhost` é aceito para testes; um IP da rede local em
   HTTP não oferece os mesmos recursos de instalação e service worker.
4. Sirva `sw.js` e `index.html` com `Cache-Control: no-cache`. Assets com hash em
   `assets/` podem usar cache longo com `immutable`. Não reescreva recursos
   inexistentes, `sw.js`, ícones ou manifesto para `index.html`.
5. Rotas de navegação (`/dashboard`, `/crm`, `/kanban`, `/f/...`) precisam do
   fallback SPA para `index.html`. Rotas da API mantêm o proxy/servidor da API.
6. Se a API usa outra origem, mantenha CORS, cookies de sessão e WebSocket
   configurados para o domínio HTTPS do aplicativo. Nunca use `localhost` como
   backend de um aplicativo aberto em outro celular.

O navegador mantém o site funcionando se o registro do service worker falhar.
Uma atualização exibe aviso; a pessoa confirma antes de recarregar. Não há
recarga automática que descarte rascunhos. O cache mantém uma versão anterior
para atender arquivos estáticos de abas que ainda estão abertas.

## Responsividade

O menu móvel reúne módulos e páginas e continua acessível em Configurações.
Notificações ficam no cabeçalho. A interface considera as áreas seguras da tela,
usa viewport dinâmico, alvos de toque com pelo menos 44 px e fonte de 16 px nos
campos em telas de toque. Tabelas e colunas do Kanban rolam em suas próprias
áreas. Os mesmos formulários, permissões e ações seguem disponíveis.

## Verificação

```sh
pnpm check
pnpm exec playwright install chromium
pnpm test:e2e
```

Os testes de navegador geram um build isolado em `dist-e2e/`, com API simulada e verificam
manifesto, registro do worker, cache sem API, offline, navegação, ausência de
overflow em 320/393/768/1024/1440 px e editor por toque com rotação da tela. Os testes
Node verificam também instalação e ativação de atualização mediante aprovação.
Eles não substituem a validação de instalação no dispositivo físico e do backend
HTTPS real. A publicação não é executada automaticamente por esses comandos.
