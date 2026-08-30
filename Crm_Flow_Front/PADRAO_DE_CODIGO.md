# Padrão de código e legibilidade

Este documento descreve o padrão aplicado ao código existente. ESLint verifica estrutura e responsabilidades; Prettier formata o código. Ambos bloqueiam o `check` quando há divergências, inclusive avisos.

As ferramentas exigem Node.js compatível com `^20.19.0 || ^22.13.0 || >=24`, declarado em `package.json`.

## Formatação e separação de contextos

- Dois espaços, UTF-8, LF, aspas simples, ponto e vírgula e vírgula final. Prettier orienta a quebra em 100 colunas.
- Imports no início do arquivo, agrupados em: efeitos colaterais, módulos Node, dependências, aliases internos e caminhos relativos. A ordem e os nomes importados são corrigidos automaticamente.
- Uma instrução por linha; condicionais sempre com chaves; igualdade estrita; `const` quando não houver reatribuição; sem imports duplicados.
- Separe com linha em branco declarações e execução, validações, blocos de controle, chamadas que ocupam várias linhas e o retorno. Declarações consecutivas do mesmo contexto podem ficar juntas.
- Não una leitura, validação, mutação e retorno em uma sequência compactada. Evite funções com vários assuntos: extraia operações com nomes do domínio.
- Chamadas longas são quebradas pelo Prettier. Prefira objeto nomeado quando houver vários argumentos com significado de negócio; não esconda condições ou efeitos colaterais dentro dos argumentos.
- Não force linhas em branco entre cada campo de objeto, item de array ou setter relacionado: o objetivo é distinguir contextos, não aumentar artificialmente o arquivo.

```js
const input = validarEntrada(request.body);

if (!input.nome) {
  throw erroDeValidacao('nome', 'Informe o nome');
}

const resultado = await salvarRegistro({
  tenantId: context.tenantId,
  nome: input.nome,
});

return resultado;
```

## Finalidade dos arquivos

Todo arquivo de produção em `src/` começa com JSDoc `@file`, antes dos imports. Explique o que ele entrega e seu limite de responsabilidade; não escreva apenas “funções auxiliares”. Testes são identificados pelo nome `*.test.js` e pelo comportamento descrito nas suítes.

```js
/**
 * @file Valida a equipe do quadro e garante o acesso de edição do autor ao salvar.
 * @layer service
 */
```

`@layer` é útil nas camadas de aplicação; `@file` é obrigatório e verificado pelo lint. Documente parâmetros e retornos não óbvios com JSDoc. Comentários explicam intenção e invariantes, sem repetir cada linha do código. Envolva a descrição do cabeçalho em linhas curtas.

## Comandos

Execute na pasta com `package.json`:

```sh
pnpm lint:fix     # corrige imports, espaçamento e formatação
pnpm lint         # verifica ESLint e Prettier sem alterar arquivos
pnpm test:lint    # verifica as regras locais com exemplos válidos e inválidos
pnpm check        # validação completa do projeto
```

O comando de correção executa Prettier, autofix ESLint e Prettier novamente antes da validação final. Isso permite corrigir chaves e quebras de linha na mesma execução, mantendo falha para qualquer erro ou aviso restante.

As regras de legibilidade ficam em `eslint.rules.js`; as específicas do projeto, em `tooling/eslint/`. Não crie configurações divergentes por pasta para fazer o lint passar. Uma exceção precisa ser pontual, explicar o motivo e preservar os contratos existentes.

Migrations já aplicadas, arquivos gerados e lockfiles não são reformatados. A revisão de estilo não autoriza alterar o comportamento dos dados.

## Responsabilidades no frontend

| Local                | Responsabilidade                                      | Evitar                                                                    |
| -------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------- |
| `pages/`             | Compor a tela, navegação e estados de apresentação    | Protocolos HTTP duplicados e cálculos de domínio espalhados no JSX        |
| `components/`        | Renderizar um contexto visual e expor eventos claros  | Consultas ao banco ou misturar recursos independentes no mesmo componente |
| `hooks/`             | Compartilhar estado e efeitos de um fluxo             | Virar um depósito genérico de regras de vários módulos                    |
| `api/` e `*.api.js`  | Transporte, endpoints e contratos das chamadas        | Importar React, telas, componentes ou hooks                               |
| `lib/`               | Cálculos, normalização e transformações puras         | Efeitos de rede escondidos                                                |
| `src/components/ui/` | Controles reutilizáveis e seus contratos de interação | Recriar controles diferentes em cada módulo                               |
| `src/services/`      | Infraestrutura HTTP e sessão compartilhada            | Armazenar credenciais em estado persistente do navegador                  |

O lint impede dependências de interface nos arquivos `.api.js`. As regras de React, hooks, controles compartilhados e atualização de componentes continuam ativas. Regras de permissão e integridade são obrigatoriamente revalidadas no backend.

Exemplos: `src/hooks/create-auth-session.js` cuida do ciclo de sessão; `src/modules/kanban/components/card-flow-fields.jsx` contém os campos do fluxo do card; `src/modules/kanban/lib/flow.js` concentra as transformações puras.

## Fluxo de desenvolvimento

1. Edite o arquivo na camada que representa sua responsabilidade.
2. Atualize sua descrição `@file` se a finalidade mudar.
3. Rode `pnpm lint:fix` e revise o diff.
4. Rode `pnpm check`; mudanças de interação também usam os testes de navegador pertinentes.

Configure o editor para usar Prettier e ESLint ao salvar. As configurações do projeto são a fonte de verdade, independentemente do editor.

As orientações para agentes ficam em [.agents/AGENTS.md](.agents/AGENTS.md) e na [skill do frontend](.agents/skills/flow-frontend/SKILL.md).
