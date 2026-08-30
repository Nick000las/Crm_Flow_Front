/**
 * @file Definições declarativas de tutoriais interativos (Driver.js) por tela e helpers puros
 * para resolução por rota e filtragem de elementos visíveis no DOM.
 */

const SHELL_STEPS = Object.freeze([
  {
    element: '[data-tour="shell-rail"]',
    popover: {
      title: 'Barra de módulos',
      description:
        'Alterne rapidamente entre Dashboard, Kanban e CRM. O sino na base reúne suas notificações e o botão de ajuda abre este tutorial em qualquer tela.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="shell-sidebar"]',
    popover: {
      title: 'Menu do módulo atual',
      description:
        'Aqui ficam as páginas do módulo selecionado, já filtradas conforme o seu perfil e os recursos ativos da empresa.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="shell-command-palette"]',
    popover: {
      title: 'Busca rápida e comandos',
      description:
        'Clique aqui ou pressione Ctrl+K (⌘K no Mac) para saltar para qualquer tela, trocar o tema ou abrir o tutorial sem tirar as mãos do teclado.',
      side: 'right',
      align: 'center',
    },
  },
  {
    element: '[data-tour="shell-account-menu"]',
    popover: {
      title: 'Sua conta e preferências',
      description:
        'Acesse configurações de segurança, alterne entre tema Claro, Escuro ou Sistema, consulte atalhos de teclado ou encerre sua sessão.',
      side: 'top',
      align: 'start',
    },
  },
]);

/**
 * Mapa de tutoriais por tela do Flow CRM.
 * Passos cujo seletor não exista ou esteja oculto (ex.: permissão, flag ou viewport mobile)
 * são ignorados automaticamente em `resolveVisibleTourSteps`.
 */
export const TOURS = Object.freeze({
  dashboard: {
    id: 'dashboard',
    title: 'Visão geral do Flow CRM',
    steps: [
      {
        popover: {
          title: 'Bem-vindo ao Flow CRM',
          description:
            'Este guia rápido mostra onde encontrar seus módulos, atalhos e preferências. Você pode reabrir o tutorial de qualquer tela sempre que precisar.',
        },
      },
      ...SHELL_STEPS,
      {
        element: '[data-tour="dashboard-modules"]',
        popover: {
          title: 'Módulos e atalhos diretos',
          description:
            'Clique em um módulo para abrir sua página principal ou use os botões inferiores para ir direto a uma área específica, como Forecast ou Gerenciar quadros.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },

  'kanban-gallery': {
    id: 'kanban-gallery',
    title: 'Galeria de quadros Kanban',
    steps: [
      {
        popover: {
          title: 'Seus quadros e pipelines',
          description:
            'Nesta tela você visualiza todos os quadros Kanban e pipelines comerciais liberados para a sua equipe.',
        },
      },
      {
        element: '[data-tour="kanban-gallery-search"]',
        popover: {
          title: 'Buscar e atualizar quadros',
          description:
            'Filtre quadros pelo nome ou clique em Atualizar para sincronizar novas liberações de acesso.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="kanban-gallery-grid"]',
        popover: {
          title: 'Abrir um quadro',
          description:
            'Clique em qualquer cartão para entrar no quadro. Quadros nativos organizam tarefas da equipe; pipelines comerciais acompanham oportunidades do CRM.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-tour="kanban-gallery-manage"]',
        popover: {
          title: 'Gerenciar quadros e equipe',
          description:
            'Gestores podem criar novos quadros, definir modelos de colunas e escolher quem tem acesso como editor ou leitor.',
          side: 'bottom',
          align: 'end',
        },
      },
    ],
  },

  'kanban-board': {
    id: 'kanban-board',
    title: 'Quadro Kanban',
    steps: [
      {
        popover: {
          title: 'Operação do quadro Kanban',
          description:
            'Organize tarefas por etapa com atualização em tempo real. Veja os principais recursos disponíveis nesta tela.',
        },
      },
      {
        element: '[data-tour="kanban-board-actions"]',
        popover: {
          title: 'Ferramentas do quadro',
          description:
            'Use modelos de card, consulte cards arquivados, ajuste suas notificações por e-mail, abra o relatório de métricas ou crie novas colunas.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '[data-tour="kanban-board-filters"]',
        popover: {
          title: 'Busca, filtros rápidos e salvos',
          description:
            'Filtre por texto, prioridade, responsável ou prazo. Você também pode salvar combinações pessoais de filtros neste navegador.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="kanban-board-bulk"]',
        popover: {
          title: 'Ações em lote',
          description:
            'Ative a seleção múltipla para mover, atribuir responsável, adicionar etiquetas ou arquivar até 100 cards de uma só vez.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="kanban-board-columns"]',
        popover: {
          title: 'Colunas e cards',
          description:
            'Arraste cards entre colunas (ou use os controles do próprio card), clique em um card para abrir detalhes, checklist, comentários e anexos, ou adicione novos cards na base da coluna.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },

  'kanban-manage': {
    id: 'kanban-manage',
    title: 'Gerenciar quadros',
    steps: [
      {
        popover: {
          title: 'Administração de quadros',
          description:
            'Crie quadros nativos, escolha modelos prontos de etapas e controle exatamente quem participa de cada quadro.',
        },
      },
      {
        element: '[data-tour="kanban-manage-new"]',
        popover: {
          title: 'Criar novo quadro',
          description:
            'Defina nome, tipo, layout inicial de colunas e participantes. Você entra automaticamente como editor do quadro que criar.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '[data-tour="kanban-manage-list"]',
        popover: {
          title: 'Gerenciar quadros existentes',
          description:
            'Abra o quadro diretamente, edite permissões de cada participante (editor ou leitor) ou exclua quadros que não serão mais usados.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },

  'crm-leads': {
    id: 'crm-leads',
    title: 'Central de Leads do CRM',
    steps: [
      {
        popover: {
          title: 'Gestão de Leads',
          description:
            'Visualize, filtre, segmente e edite sua base comercial sem sair da lista. Vamos passar pelos controles principais.',
        },
      },
      {
        element: '[data-tour="crm-leads-actions"]',
        popover: {
          title: 'Criar e exportar leads',
          description:
            'Cadastre um novo lead manualmente ou exporte a base respeitando os filtros e colunas ativos na tela.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '[data-tour="crm-leads-status-tabs"]',
        popover: {
          title: 'Situação dos leads',
          description:
            'Alterne entre leads Ativos, Arquivados e Lixeira para consultar registros antigos ou restaurar itens.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="crm-leads-toolbar"]',
        popover: {
          title: 'Busca, filtros, visões e colunas',
          description:
            'Pesquise por texto (atalho "/"), monte filtros combinados por campo, salve visões recorrentes e escolha quais colunas aparecem na tabela.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="crm-leads-content"]',
        popover: {
          title: 'Lista e ficha lateral',
          description:
            'Clique em qualquer lead para abrir a ficha lateral com dados, oportunidades, atividades e histórico. Marque várias linhas para editar em massa ou mesclar duplicados.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },

  'crm-pipeline': {
    id: 'crm-pipeline',
    title: 'Pipeline comercial',
    steps: [
      {
        popover: {
          title: 'Quadro do Pipeline comercial',
          description:
            'Acompanhe cada oportunidade por etapa do funil. Alterações feitas aqui atualizam o CRM em tempo real.',
        },
      },
      {
        element: '[data-tour="crm-pipeline-actions"]',
        popover: {
          title: 'Atualizar e editar estrutura',
          description:
            'Recarregue os dados do funil ou, se for gestor, abra as configurações do pipeline para ajustar colunas, probabilidades e regras.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '[data-tour="crm-pipeline-filters"]',
        popover: {
          title: 'Filtros, visões e ordenação',
          description:
            'Use a mesma busca e visões salvas da lista de leads e ordene os cards dentro de cada coluna por valor, atualização ou outro campo.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="crm-pipeline-board"]',
        popover: {
          title: 'Movimentação entre etapas',
          description:
            'Arraste os cards ou use “Mover para…”. Se a etapa exigir campos obrigatórios, um formulário rápido aparece automaticamente. Clique no card para abrir a ficha do lead.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },

  'crm-forecast': {
    id: 'crm-forecast',
    title: 'Forecast comercial',
    steps: [
      {
        popover: {
          title: 'Previsão e Assertividade',
          description:
            'Acompanhe a receita esperada por mês, identifique gargalos fora do prazo e avalie a precisão histórica da previsão.',
        },
      },
      {
        element: '[data-tour="crm-forecast-tabs"]',
        popover: {
          title: 'Previsão e Assertividade',
          description:
            'Na aba Previsão você acompanha o realizado, o ponderado e o melhor caso. Na aba Assertividade (gestão), compara o previsto no início do mês com o que realmente fechou.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="crm-forecast-filters"]',
        popover: {
          title: 'Recorte do período e filtros',
          description:
            'Ajuste o intervalo de meses, filtre por pipeline ou responsável e escolha como agrupar o detalhamento abaixo.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="crm-forecast-chart"]',
        popover: {
          title: 'Gráfico interativo',
          description:
            'Clique em qualquer mês do gráfico para abrir logo abaixo a lista exata de oportunidades que compõem aquele número.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-tour="crm-forecast-blocks"]',
        popover: {
          title: 'Alertas fora da previsão mensal',
          description:
            'Clique em blocos como oportunidades sem data, vencidas ou em atraso para inspecionar e atualizar datas previstas em lote.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },

  'crm-import': {
    id: 'crm-import',
    title: 'Importação de leads',
    steps: [
      {
        popover: {
          title: 'Importar leads por planilha',
          description:
            'Traga contatos em lote de um arquivo .xlsx com validação prévia. Nenhum registro é gravado antes da sua confirmação.',
        },
      },
      {
        element: '[data-tour="crm-import-steps"]',
        popover: {
          title: 'Fluxo em 4 etapas',
          description:
            '1. Envie o arquivo · 2. Relacione colunas aos campos do CRM · 3. Revise avisos e duplicidades · 4. Acompanhe o processamento em segundo plano.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="crm-import-stage"]',
        popover: {
          title: 'Área da etapa atual',
          description:
            'Siga as orientações deste painel. Depois de confirmar, você pode até recarregar a página sem perder o acompanhamento do lote.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },

  'crm-settings': {
    id: 'crm-settings',
    title: 'Configurações do CRM',
    steps: [
      {
        popover: {
          title: 'Personalização do CRM',
          description:
            'Configure a estrutura de campos, pipelines, automações, governança e formulários públicos da sua empresa.',
        },
      },
      {
        element: '[data-tour="crm-settings-nav"]',
        popover: {
          title: 'Categorias de configuração',
          description:
            'As seções são organizadas por tema: Estrutura, Pipeline e automação, Governança e dados e Captação. Cada usuário vê apenas o que tem permissão para editar.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="crm-settings-content"]',
        popover: {
          title: 'Painel da seção ativa',
          description:
            'Edite os parâmetros da área escolhida ao lado. Alterações estruturais refletem imediatamente na ficha de leads, filtros e quadros.',
          side: 'left',
          align: 'start',
        },
      },
    ],
  },

  'account-settings': {
    id: 'account-settings',
    title: 'Preferências e segurança da conta',
    steps: [
      {
        popover: {
          title: 'Configurações da sua conta',
          description:
            'Personalize a aparência do Flow CRM neste dispositivo e proteja seu login com verificação em duas etapas.',
        },
      },
      {
        element: '[data-tour="settings-appearance"]',
        popover: {
          title: 'Tema da interface',
          description:
            'Escolha entre modo Claro, Escuro ou seguir automaticamente a configuração do sistema operacional.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="settings-account"]',
        popover: {
          title: 'Dados da conta',
          description:
            'Confira seu nome, e-mail de acesso e papel atribuído dentro da empresa atual.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-tour="settings-mfa"]',
        popover: {
          title: 'Verificação em duas etapas',
          description:
            'Ative o código de 6 dígitos por e-mail para proteger seu acesso. Para desativar, sua senha será solicitada por segurança.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },

  'admin-tenants': {
    id: 'admin-tenants',
    title: 'Administração de Tenants',
    steps: [
      {
        popover: {
          title: 'Painel Master da Plataforma',
          description:
            'Gerencie todas as empresas (tenants) provisionadas no Flow CRM, seus módulos contratados e status operacional.',
        },
      },
      {
        element: '[data-tour="admin-tenants-new"]',
        popover: {
          title: 'Provisionar novo tenant',
          description:
            'Crie uma nova empresa definindo nome, subdomínio, usuário dono inicial e módulos contratados.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '[data-tour="admin-tenants-filters"]',
        popover: {
          title: 'Buscar e filtrar empresas',
          description:
            'Encontre rapidamente um tenant por nome ou subdomínio e filtre por status (Ativos, Suspensos ou Cancelados).',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="admin-tenants-table"]',
        popover: {
          title: 'Abrir detalhes do tenant',
          description:
            'Clique em qualquer linha da tabela para editar dados cadastrais, alterar status, ativar módulos e gerenciar feature flags.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },

  'admin-tenant-detail': {
    id: 'admin-tenant-detail',
    title: 'Detalhes do Tenant',
    steps: [
      {
        popover: {
          title: 'Gestão individual do tenant',
          description:
            'Cada bloco abaixo salva suas alterações de forma independente, mantendo o controle granular da empresa.',
        },
      },
      {
        element: '[data-tour="admin-tenant-identity"]',
        popover: {
          title: 'Identidade e status',
          description:
            'Atualize nome/identidade da conta e controle se o tenant está Ativo, Suspenso ou Cancelado.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="admin-tenant-modules"]',
        popover: {
          title: 'Módulos e recursos (feature flags)',
          description:
            'Habilite ou desabilite módulos contratados e recursos específicos (como Forecast, Formulários, LGPD e Arquivo) para esta empresa.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-tour="admin-tenant-danger"]',
        popover: {
          title: 'Exclusão permanente',
          description:
            'A exclusão remove a conta e todos os dados associados e exige a digitação exata do subdomínio para evitar erros.',
          side: 'top',
          align: 'start',
        },
      },
    ],
  },
});

/**
 * Resolve o tutorial correspondente à rota atual (`pathname` + `search`).
 *
 * @param {string} pathname
 * @param {string} [search]
 */
export function resolveTourForRoute(pathname = '', search = '') {
  const path = String(pathname || '/').replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(search || '');

  if (path === '/dashboard') {
    return TOURS.dashboard;
  }

  if (path === '/kanban/quadros') {
    return TOURS['kanban-manage'];
  }

  if (path.startsWith('/kanban/pipeline/')) {
    return TOURS['crm-pipeline'];
  }

  if (path === '/kanban') {
    return params.get('quadro') ? TOURS['kanban-board'] : TOURS['kanban-gallery'];
  }

  if (path === '/crm/forecast' || path.startsWith('/crm/forecast/')) {
    return TOURS['crm-forecast'];
  }

  if (path === '/crm/importar') {
    return TOURS['crm-import'];
  }

  if (path === '/crm/configuracoes' || path.startsWith('/crm/configuracoes/')) {
    return TOURS['crm-settings'];
  }

  if (path === '/crm' || path.startsWith('/crm/leads')) {
    return TOURS['crm-leads'];
  }

  if (path === '/configuracoes') {
    return TOURS['account-settings'];
  }

  if (path.startsWith('/admin/tenants/') && path !== '/admin/tenants') {
    return TOURS['admin-tenant-detail'];
  }

  if (path === '/admin' || path === '/admin/tenants') {
    return TOURS['admin-tenants'];
  }

  return TOURS.dashboard;
}

/**
 * Verifica se um elemento do DOM está efetivamente visível para ser destacado pelo Driver.js.
 *
 * @param {Element | null | undefined} element
 * @param {Window | undefined} [win]
 */
export function isTourElementVisible(element, win = globalThis.window) {
  if (!element) {
    return false;
  }

  if (
    typeof element.closest === 'function' &&
    element.closest('[hidden], [inert], [aria-hidden="true"]')
  ) {
    return false;
  }

  if (win && typeof win.getComputedStyle === 'function') {
    const style = win.getComputedStyle(element);

    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }
  }

  if (typeof element.getClientRects === 'function') {
    const rects = element.getClientRects();

    // Em navegadores reais, elementos ocultos por ancestral `display: none` têm 0 rects.
    if (rects.length === 0) {
      return false;
    }
  }

  return true;
}

/**
 * Filtra os passos do tutorial mantendo passos introdutórios (sem `element`) e apenas
 * passos cujos seletores estejam presentes e visíveis no DOM atual.
 *
 * @param {{ steps: Array<{ element?: string, popover: object }> } | null} tour
 * @param {Document | undefined} [doc]
 * @param {Window | undefined} [win]
 */
export function resolveVisibleTourSteps(tour, doc = globalThis.document, win = globalThis.window) {
  if (!tour?.steps?.length) {
    return [];
  }

  return tour.steps.filter((step) => {
    if (!step.element) {
      return true;
    }

    if (typeof step.element !== 'string' || !doc || typeof doc.querySelector !== 'function') {
      return false;
    }

    const match = doc.querySelector(step.element);

    return isTourElementVisible(match, win);
  });
}

/**
 * Monta a configuração padronizada do Driver.js em português, respeitando movimento reduzido.
 *
 * @param {Array<object>} steps
 * @param {{ reducedMotion?: boolean }} [options]
 */
export function createDriverOptions(steps, { reducedMotion = false } = {}) {
  return {
    steps,
    animate: !reducedMotion,
    smoothScroll: !reducedMotion,
    allowClose: true,
    allowKeyboardControl: true,
    overlayClickBehavior: 'close',
    overlayOpacity: 0.62,
    stagePadding: 8,
    stageRadius: 12,
    popoverClass: 'flow-tour-popover',
    popoverOffset: 12,
    showProgress: steps.length > 1,
    progressText: '{{current}} de {{total}}',
    nextBtnText: 'Próximo',
    prevBtnText: 'Anterior',
    doneBtnText: 'Concluir',
    closeBtnLabel: 'Fechar tutorial',
    skipMissingElement: true,
  };
}
