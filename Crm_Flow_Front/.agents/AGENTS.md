# Orientações para agentes — Flow CRM Frontend

Antes de alterar código deste repositório, leia a skill local
[flow-frontend](skills/flow-frontend/SKILL.md).

Execute os comandos na raiz do projeto, um nível acima desta pasta `.agents/`,
onde ficam `package.json`, `src/` e as configurações de ESLint/Prettier.
A skill aponta os componentes existentes, os padrões de interação e a validação
esperada. Ao mudar um padrão aprovado, atualize também a referência reutilizável
e a skill; não crie uma segunda convenção para uma única tela.

As skills são documentos versionados e evolutivos. As IAs podem e devem
atualizá-las durante a tarefa quando o usuário definir um padrão novo ou quando
um padrão reutilizável for incorporado ao código. Essa manutenção faz parte da
implementação e não exige uma autorização adicional. Siga a seção de evolução
da própria skill e informe no resultado quais padrões foram atualizados.

## Organização dos arquivos de IA

Centralize instruções, skills, regras e contexto para agentes em `.agents/`,
relativo à pasta do projeto que contém `package.json`. Use `skills/` para skills
e `references/` para contexto complementar, criando arquivos apenas quando úteis.
O ponto de entrada é `.agents/AGENTS.md`. Não mantenha arquivos de instruções
de IA na raiz nem crie outra pasta por ferramenta. Configure a ferramenta para
ler este ponto de entrada quando necessário. Atualize referências ao mover arquivos.
Documentação do produto e código executável continuam em seus diretórios próprios.

Para decisões de interface, consulte o
[contexto de design](references/design-context.md) e a skill do frontend.
Para autenticação, rotas, permissões e alterações que cruzam módulos, consulte
também o [guia de integração](references/module-integration.md).
