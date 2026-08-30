export const BOARD_LAYOUTS = [
  {
    id: 'basico',
    nome: 'Básico',
    descricao: 'Um fluxo simples para organizar o dia a dia.',
    colunas: ['A fazer', 'Em andamento', 'Concluído'],
  },
  {
    id: 'projetos',
    nome: 'Projetos',
    descricao: 'Da ideia à entrega, com uma etapa de revisão.',
    colunas: ['Backlog', 'A fazer', 'Em andamento', 'Em revisão', 'Concluído'],
  },
  {
    id: 'comercial',
    nome: 'Comercial',
    descricao: 'Acompanhe oportunidades até o fechamento.',
    colunas: ['Novos contatos', 'Qualificação', 'Proposta', 'Negociação', 'Fechado'],
  },
  {
    id: 'conteudo',
    nome: 'Conteúdo',
    descricao: 'Organize a produção e aprovação das publicações.',
    colunas: ['Ideias', 'Em produção', 'Em aprovação', 'Agendado', 'Publicado'],
  },
  {
    id: 'atendimento',
    nome: 'Atendimento',
    descricao: 'Organize solicitações e acompanhe cada resolução.',
    colunas: ['Recebido', 'Em triagem', 'Em atendimento', 'Aguardando retorno', 'Resolvido'],
  },
  {
    id: 'vazio',
    nome: 'Em branco',
    descricao: 'Comece sem colunas e monte seu próprio fluxo.',
    colunas: [],
  },
];
