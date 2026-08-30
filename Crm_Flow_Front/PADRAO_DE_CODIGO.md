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
nativos. Todo `<form>` deve declarar `noValidate` e exibir erros de validação
inline com `FieldError` (`src/components/field-error.jsx`) e
`src/lib/form-validation.js`, nunca balões nativos de validação do navegador.
Navegação entre páginas de um módulo pertence ao menu lateral.

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

## Animações e tema

A aplicação usa `motion` (`motion/react`) envolvido por
`<MotionConfig reducedMotion="user">` em `src/main.jsx`, junto aos tokens base
de `src/styles/motion.css` e `src/components/motion/motion-tokens.js`. Reutilize
os primitivos em `src/components/motion/` (`FadeIn`, `StaggerList`,
`StaggerItem`, `InteractiveCard`) e `PageTransition`, que anima trocas de rota
sem remontar os componentes. Respeite `prefers-reduced-motion` e não atrase
ações ou requisições para esperar animações.

O tema **Light / Dark / System** é controlado por `ThemeProvider` e `useTheme`,
com seletor acessível em `ThemeToggle` e tokens OKLCH em `src/index.css`.

## Organização das instruções de IA

Skills, regras e contexto para agentes ficam em `.agents/`, dentro deste projeto.
O ponto de entrada é `.agents/AGENTS.md`; não mantenha arquivos de instruções
de IA na raiz. Configure a ferramenta para ler esse caminho quando necessário.
Mantenha as regras centralizadas e atualize os links quando a estrutura evoluir.
