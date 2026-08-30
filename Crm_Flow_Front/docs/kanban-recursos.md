# Recursos do Kanban

O card mostra acesso aos detalhes e aos comentários com contador. Dentro do
editor, as abas Detalhes, Comentários e Histórico funcionam em desktop e celular
sem descartar os rascunhos. Ações rápidas no quadro alteram responsável,
prioridade e prazo; Mais ações no editor permite copiar link, duplicar, salvar
modelo, seguir, arquivar e excluir.

Comentários podem ser editados pelo próprio autor e mostram a data de edição.
Leitores consultam conteúdo; alterações continuam restritas aos editores.

Nos detalhes, é possível indicar um motivo de bloqueio, vincular um lead pelo ID,
adicionar até 20 links HTTP/HTTPS e até 3 arquivos de 200 KB cada. Arquivos são
armazenados no card e baixados como binário; arquivos maiores podem ser vinculados
por URL. A vinculação ao lead verifica o acesso pelo CRM e a empresa no backend.

Salvar modelo cria uma cópia reutilizável fora das colunas. O seletor Modelos do
quadro inicia uma nova tarefa com os dados do modelo. Duplicar cria uma tarefa
imediatamente; conclusão, checklist e seguidores são reiniciados.

A recorrência diária, semanal ou mensal cria a próxima tarefa **ao concluir o
prazo**, usando a data anterior como referência. Não é um agendamento por relógio.
O fim de mês é limitado ao último dia válido. Uma regra por etapa pode concluir
o prazo e/ou atribuir um participante ao entrar nela; a execução ocorre na API.

Seguir card habilita e-mails de atualizações, sujeito à preferência de e-mail,
SMTP configurado e participação atual. As mudanças do próprio usuário não geram
avisos para ele. Links de compartilhamento e de e-mail abrem o card diretamente
com `?quadro=<id>&card=<id>`, sem alterar permissões.

O relatório mostra cards e média de horas por passagem em cada etapa a partir
do histórico disponível. Reordenações na mesma etapa não reiniciam a contagem;
permanências abertas contam até agora e o arquivamento encerra a permanência.

## Instalação

Aplique a migration `0031_kanban_colaboracao` no backend antes de publicar os
novos recursos. A migration foi validada em PostgreSQL isolado; não foi aplicada
pelo agente no banco remoto configurado no projeto.
