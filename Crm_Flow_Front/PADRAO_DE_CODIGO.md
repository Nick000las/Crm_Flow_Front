# Padrão de código

Backend e frontend usam ESLint para qualidade e Prettier para formatação.
Cada projeto tem configuração própria para funcionar também fora deste workspace.

- Dois espaços, aspas simples, ponto e vírgula e vírgula final.
- Quebra de linhas orientada a 100 caracteres pelo Prettier.
- Blocos com chaves obrigatórios, inclusive em condicionais de uma linha.
- No máximo uma instrução por linha.
- Igualdade estrita, `const` quando possível, sem `var` nem imports duplicados.
- O lint falha também em avisos. As regras de arquitetura e React continuam ativas.

Execute os comandos na pasta que contém o `package.json` de cada projeto:

```sh
pnpm lint:fix
pnpm format
pnpm lint
pnpm format:check
```

`pnpm check` reúne lint, verificação de formatação e testes; no frontend,
também executa o build. Os testes de isolamento do backend precisam do banco.

Configure o editor para usar Prettier ao salvar. O `.editorconfig` define
indentação, UTF-8 e fim de linha LF. Não edite migrations já aplicadas para
adequar formatação: elas estão excluídas do Prettier.

## Interface e orientações para agentes

O ponto de entrada para agentes é [AGENTS.md](.agents/AGENTS.md), que referencia a
skill [flow-frontend](.agents/skills/flow-frontend/SKILL.md).

Exclusões persistidas usam o componente compartilhado
`src/components/confirmation-dialog.jsx`, com foco inicial em Cancelar, alcance
da exclusão explícito, ação vermelha e erro visível. O envio bloqueia novas
confirmações e fechamento. A exclusão de tenant mantém o modal especializado
com confirmação digitada do subdomínio.

Use `Button` com `variant="destructive"`; no CSS legado do Kanban, use
`kb-button-danger`. As regras de ESLint bloqueiam `confirm`, `alert` e `prompt`
nativos. Navegação entre páginas de um módulo pertence ao menu lateral.

## Carregamentos

Cada formulário ou região de dados tem seu próprio estado de requisição. Use
`LoadingState` para áreas e `Button` com `loading` e `loadingText` para ações.
Ambos usam o `Spinner` compartilhado, com suporte a movimento reduzido.
Não use overlay global nem apenas texto de espera. Preserve os dados atuais em
revalidações e os rascunhos de outros componentes.

```jsx
<LoadingState label="Carregando participantes…" />
<Button loading={isSaving} loadingText="Salvando…">Salvar</Button>
```

As IAs devem atualizar as skills versionadas quando estes padrões evoluírem,
junto com o código de referência e as verificações aplicáveis.

## Requisições em paralelo

Consultas independentes do mesmo fluxo usam `Promise.all`, iniciando todas as
chamadas antes do `await`. Efeitos de componentes independentes já concorrem e
mantêm seus próprios spinners e erros. Operações que dependem do resultado da
anterior continuam sequenciais, como salvar e depois consultar o estado salvo.

## Animações

Use `src/styles/motion.css`: 120 ms para feedback e 180 ms para entradas.
`PageTransition` anima o conteúdo dos shells sem remontar os componentes.
Modais, cards, comentários e botões compartilham efeitos discretos. Respeite
`prefers-reduced-motion` e não atrase ações ou requisições para esperar animações.

## Organização das instruções de IA

Skills, regras e contexto para agentes ficam em `.agents/`, dentro deste projeto.
O ponto de entrada é `.agents/AGENTS.md`; não mantenha arquivos de instruções
de IA na raiz. Configure a ferramenta para ler esse caminho quando necessário.
Mantenha as regras centralizadas e atualize os links quando a estrutura evoluir.
