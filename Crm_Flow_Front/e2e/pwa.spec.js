import { expect, test } from '@playwright/test';

const user = {
  id: 'u1',
  nome: 'Maria Silva',
  email: 'maria@example.test',
  role: 'DONO',
  tenantId: 't1',
  modulosAtivos: ['crm', 'kanban'],
  featuresAtivas: ['crm.forecast', 'crm.listas', 'crm.importacao', 'crm.exportacao'],
};
const fields = [
  {
    id: 'nome',
    chave: 'nome',
    label: 'Nome',
    labelPadrao: 'Nome',
    tipo: 'texto',
    camada: 1,
    ativo: true,
    obrigatorio: true,
    ordem: 0,
    visibilidade: { create_form: true, detail: true, table: true, filter: true },
    capacidades: {
      canHide: true,
      canRename: true,
      canMakeOptional: true,
      canDelete: false,
      canBeSensitive: true,
    },
  },
  {
    id: 'email',
    chave: 'email',
    label: 'E-mail',
    labelPadrao: 'E-mail',
    tipo: 'email',
    camada: 1,
    ativo: true,
    obrigatorio: false,
    ordem: 1,
    visibilidade: { create_form: true, detail: true, table: true, filter: true },
    capacidades: {
      canHide: true,
      canRename: true,
      canMakeOptional: true,
      canDelete: false,
      canBeSensitive: true,
    },
  },
];
const board = {
  id: 'b1',
  nome: 'Operação comercial',
  boardType: 'trabalho',
  canEdit: true,
  participantes: [],
  colunas: ['Backlog', 'Em andamento', 'Concluído'].map((nome, index) => ({
    id: `c${index}`,
    nome,
    ordem: index,
    cards: index
      ? []
      : [
          {
            id: 'card1',
            titulo: 'Acompanhar proposta do cliente',
            dadosExtras: {},
            colunaId: 'c0',
            updatedAt: '2026-11-21T12:00:00Z',
            responsavelId: 'u1',
          },
        ],
  })),
};

async function mockApi(page) {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api/, '');
    let data = [];

    if (path === '/auth/session') {
      data =
        url.searchParams.get('scope') === 'admin'
          ? { accessToken: null, user: null }
          : { accessToken: 'test-access-token', user };
    } else if (path === '/me') {
      data = user;
    } else if (path === '/auth/settings') {
      data = { email: user.email, mfaEnabled: false, mfa: { enabled: false } };
    } else if (path === '/crm/configuracoes/campos' || path === '/crm/leads/fields') {
      data = fields;
    } else if (path === '/crm/leads/search') {
      data = {
        itens: [
          {
            id: 'l1',
            nome: 'Cliente exemplo',
            email: 'cliente@example.test',
            dados: {},
            criadoEm: '2026-11-21T12:00:00Z',
          },
        ],
        total: 1,
        pagina: 1,
        tamanho: 25,
      };
    } else if (path === '/notificacoes') {
      data = { itens: [], total: 0, pagina: 1, tamanho: 10, naoLidas: 0 };
    } else if (path === '/notificacoes/nao-lidas') {
      data = { total: 0 };
    } else if (path === '/kanban/boards') {
      data = [{ ...board, totalParticipantes: 1 }];
    } else if (path === '/kanban/boards/b1') {
      data = board;
    } else if (path === '/crm/forecast') {
      data = {
        vazio: true,
        meses: [],
        grupos: [],
        blocos: Object.fromEntries(
          ['atrasadas', 'antesDoPeriodo', 'semPrevisao', 'alemDoHorizonte', 'semValor'].map(
            (key) => [key, { quantidade: 0, soma: 0, ponderado: 0 }],
          ),
        ),
        camposDesligados: [],
      };
    } else if (path.includes('members') || path.includes('usuarios')) {
      data = [user];
    }

    await route.fulfill({ json: data });
  });
}

async function expectNoPageOverflow(page) {
  const sizes = await page.evaluate(() => ({
    width: innerWidth,
    document: document.documentElement.scrollWidth,
    main: document.querySelector('main')?.getBoundingClientRect().right ?? 0,
    mainScroll: document.querySelector('#conteudo-principal')?.scrollWidth ?? 0,
    mainClient: document.querySelector('#conteudo-principal')?.clientWidth ?? 0,
  }));

  expect(sizes.document).toBeLessThanOrEqual(sizes.width + 1);
  expect(sizes.main).toBeLessThanOrEqual(sizes.width + 1);
  expect(sizes.mainScroll).toBeLessThanOrEqual(sizes.mainClient + 1);
}

test('manifesto, ícones e service worker instaláveis; API fora do cache', async ({
  page,
  request,
}) => {
  await mockApi(page);

  const manifest = await (await request.get('/manifest.webmanifest')).json();

  expect(manifest.display).toBe('standalone');

  expect(manifest.icons.map((icon) => icon.sizes)).toEqual(
    expect.arrayContaining(['192x192', '512x512']),
  );

  for (const icon of manifest.icons) {
    expect((await request.get(icon.src)).ok()).toBeTruthy();
  }

  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Olá, Maria' })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);

  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBeTruthy();

  const cached = await page.evaluate(async () => {
    const keys = await caches.keys();

    return (
      await Promise.all(
        keys.map(async (key) => (await (await caches.open(key)).keys()).map((entry) => entry.url)),
      )
    ).flat();
  });

  expect(cached.some((url) => url.includes('/assets/'))).toBeTruthy();
  expect(cached.some((url) => url.includes('/api/'))).toBeFalsy();
});

for (const width of [320, 393, 768, 1024, 1440]) {
  test(`telas sem overflow global em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await mockApi(page);

    const errors = [];

    page.on('pageerror', (error) => errors.push(error.message));

    for (const path of [
      '/dashboard',
      '/crm',
      '/crm/configuracoes/campos',
      '/crm/importar',
      '/crm/forecast',
      '/kanban',
      '/kanban?quadro=b1',
      '/configuracoes',
    ]) {
      await page.goto(path);
      await expect(page.locator('#conteudo-principal')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible();
      await expectNoPageOverflow(page);
    }

    expect(errors).toEqual([]);
  });
}

test('menu móvel oferece módulos, páginas, notificações e volta ao conteúdo', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await mockApi(page);
  await page.goto('/configuracoes');
  await page.getByRole('button', { name: 'Abrir menu de navegação' }).click();

  const menu = page.getByRole('dialog');

  await expect(menu).toBeVisible();
  await menu.getByRole('link', { name: 'CRM', exact: true }).click();
  await expect(menu).not.toBeVisible();
  await expect(page).toHaveURL(/\/crm$/);
  await page.getByRole('button', { name: 'Abrir menu de navegação' }).click();
  await expect(menu.getByRole('link', { name: 'Forecast', exact: true })).toBeVisible();
  await menu.getByRole('link', { name: 'Forecast', exact: true }).click();
  await expect(page).toHaveURL(/\/crm\/forecast$/);
  await expectNoPageOverflow(page);
});

test('offline mantém shell instalado e informa necessidade de conexão', async ({
  page,
  context,
}) => {
  await mockApi(page);
  await page.goto('/dashboard');
  await page.evaluate(() => navigator.serviceWorker.ready);

  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBeTruthy();

  await context.setOffline(true);
  await expect(page.getByText('Você está offline.', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.locator('#root')).not.toBeEmpty();
  await context.setOffline(false);
});

test.describe('interação por toque', () => {
  test.use({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });

  test('editor do Kanban cabe no celular e preserva rascunho ao girar a tela', async ({ page }) => {
    await mockApi(page);
    await page.goto('/kanban?quadro=b1');
    await page.getByRole('button', { name: 'Acompanhar proposta do cliente', exact: true }).click();

    const editor = page.getByRole('dialog');

    await expect(editor).toBeVisible();

    const title = editor.locator('#kb-card-title');

    await title.fill('Rascunho no celular');
    await expectNoPageOverflow(page);

    const rect = await editor.boundingBox();

    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(394);

    expect(
      await title.evaluate((input) => parseFloat(getComputedStyle(input).fontSize)),
    ).toBeGreaterThanOrEqual(16);

    for (const button of await editor.locator('header').first().getByRole('button').all()) {
      const bounds = await button.boundingBox();

      expect(bounds.x).toBeGreaterThanOrEqual(rect.x);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(rect.x + rect.width + 1);
    }

    await expect(editor).toHaveCSS('opacity', '1');
    await page.screenshot({ path: '/tmp/flow-mobile-editor.png', animations: 'disabled' });
    await page.setViewportSize({ width: 852, height: 393 });
    await expect(title).toHaveValue('Rascunho no celular');

    const landscape = await editor.boundingBox();

    expect(landscape.height).toBeLessThanOrEqual(393);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Continuar editando' })).toBeVisible();
    await page.getByRole('button', { name: 'Continuar editando' }).click();
    await expect(title).toHaveValue('Rascunho no celular');
  });

  test('login e formulário público cabem em tela estreita com teclado de toque', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 740 });

    await page.route('**/api/**', (route) => {
      if (route.request().url().includes('/public/f/')) {
        return route.fulfill({
          status: 404,
          json: { code: 'NOT_FOUND', message: 'Link indisponível' },
        });
      }

      return route.fulfill({ json: { accessToken: null, user: null } });
    });

    await page.goto('/login');

    const email = page.getByRole('textbox', { name: 'E-mail', exact: true });

    await expect(email).toBeVisible();
    await expectNoPageOverflow(page);
    await email.fill('maria@example.test');

    expect(
      await email.evaluate((input) => input.getBoundingClientRect().height),
    ).toBeGreaterThanOrEqual(44);

    await page.goto('/f/link-invalido');
    await expect(page.getByRole('heading')).toBeVisible();
    await expectNoPageOverflow(page);
    await page.screenshot({ path: '/tmp/flow-mobile-public.png' });
  });
});

test('painel de apresentação do login permanece escuro nos dois temas', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });

  await page.route('**/api/**', (route) =>
    route.fulfill({ json: { accessToken: null, user: null } }),
  );

  const palettes = [];

  for (const theme of ['light', 'dark']) {
    await page.addInitScript((value) => localStorage.setItem('flow-crm:theme', value), theme);
    await page.goto('/login');

    const panel = page.getByRole('complementary', { name: 'Apresentação Flow CRM' });

    await expect(panel).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toBeVisible();

    palettes.push(
      await panel.evaluate((element) => ({
        background: getComputedStyle(element).backgroundColor,
        title: getComputedStyle(element.querySelector('h2')).color,
        card: getComputedStyle(element.querySelector('li')).backgroundColor,
      })),
    );

    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(
      theme === 'dark',
    );
  }

  expect(palettes[0]).toEqual(palettes[1]);
});

test('itens clicáveis usam cursor de clique e campos editáveis preservam o cursor de texto', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await mockApi(page);
  await page.goto('/crm/configuracoes/campos');

  await expect(page.getByRole('link', { name: 'Forecast', exact: true })).toHaveCSS(
    'cursor',
    'pointer',
  );

  await expect(
    page.locator('[role="checkbox"]:not([data-disabled]):not([aria-disabled="true"])').first(),
  ).toHaveCSS('cursor', 'pointer');

  await expect(page.locator('[role="checkbox"][data-disabled]').first()).toHaveCSS(
    'cursor',
    'not-allowed',
  );

  await page.goto('/kanban?quadro=b1');

  await expect(
    page.getByRole('button', { name: 'Acompanhar proposta do cliente', exact: true }),
  ).toHaveCSS('cursor', 'pointer');

  await expect(page.locator('[data-slot="native-select"]').first()).toHaveCSS('cursor', 'pointer');
  await expect(page.getByRole('searchbox', { name: 'Buscar cards' })).toHaveCSS('cursor', 'text');
  await page.goto('/crm');

  await expect(page.locator('tbody tr[data-interactive="true"]').first()).toHaveCSS(
    'cursor',
    'pointer',
  );
});

test('linhas reordenáveis ficam dentro da lista mesmo com o ponteiro fora dela', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await mockApi(page);
  await page.goto('/crm/configuracoes/campos');

  const handle = page.getByRole('button', { name: 'Reordenar E-mail', exact: true });
  const row = page.locator('tbody tr').filter({ hasText: 'E-mail' });

  await expect(handle).toBeVisible();

  const start = await handle.boundingBox();
  const origin = await row.boundingBox();
  const list = await page.locator('tbody').boundingBox();

  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + 10, start.y - 12, { steps: 3 });
  await page.mouse.move(1430, 5, { steps: 5 });

  const top = await row.boundingBox();

  expect(top.y).toBeGreaterThanOrEqual(list.y - 1);
  expect(Math.abs(top.x - origin.x)).toBeLessThanOrEqual(1);
  await page.mouse.move(10, 990, { steps: 5 });

  const bottom = await row.boundingBox();

  expect(bottom.y + bottom.height).toBeLessThanOrEqual(list.y + list.height + 1);
  await page.keyboard.press('Escape');
  await page.mouse.up();
});

test('prévia de arraste nativo do Kanban fica no quadro e é removida ao cancelar', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await mockApi(page);
  await page.goto('/kanban?quadro=b1');

  const card = page.locator('.kb-card').first();

  await expect(card).toBeVisible();

  await card.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const transfer = new DataTransfer();

    element.dispatchEvent(
      new DragEvent('dragstart', {
        bubbles: true,
        clientX: rect.left + 30,
        clientY: rect.top + 30,
        dataTransfer: transfer,
      }),
    );
  });

  const preview = page.locator('[data-drag-preview]');

  await expect(preview).toHaveCount(1);

  await page.evaluate(() =>
    window.dispatchEvent(new DragEvent('dragover', { clientX: 0, clientY: 0 })),
  );

  const bounds = await page.locator('.kb-board').boundingBox();
  const position = await preview.boundingBox();

  expect(position.x).toBeGreaterThanOrEqual(bounds.x - 1);
  expect(position.y).toBeGreaterThanOrEqual(bounds.y - 1);
  await page.evaluate(() => window.dispatchEvent(new DragEvent('dragend')));
  await expect(preview).toHaveCount(0);
});

test('limite de arraste mantém reordenação por teclado', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await mockApi(page);
  await page.goto('/crm/configuracoes/campos');

  const handle = page.getByRole('button', { name: 'Reordenar E-mail', exact: true });

  await handle.focus();
  await page.keyboard.press('Space');
  await expect(handle).toHaveAttribute('aria-pressed', 'true');

  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );

  await page.keyboard.press('ArrowUp');
  await expect(page.locator('[role="status"][aria-live="assertive"]')).toContainText('posição 1');

  const request = page.waitForRequest(
    (req) => req.method() === 'PUT' && req.url().includes('/crm/configuracoes/campos/ordem'),
  );

  await page.keyboard.press('Space');

  const sent = await request;

  expect(sent.postDataJSON()).toEqual({ ids: ['email', 'nome'] });
});

test('arraste nativo limitado mantém o contrato de mover entre colunas', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await mockApi(page);
  await page.goto('/kanban?quadro=b1');
  await expect(page.locator('.kb-card').first()).toBeVisible();

  const moved = page.waitForRequest(
    (req) => req.method() === 'PATCH' && req.url().includes('/kanban/cards/card1/mover'),
  );

  await page.evaluate(() => {
    const card = document.querySelector('.kb-card');
    const target = document.querySelectorAll('.kb-column')[1];
    const rect = card.getBoundingClientRect();
    const bounds = target.getBoundingClientRect();
    const transfer = new DataTransfer();

    card.dispatchEvent(
      new DragEvent('dragstart', {
        bubbles: true,
        clientX: rect.left + 30,
        clientY: rect.top + 30,
        dataTransfer: transfer,
      }),
    );

    target.dispatchEvent(
      new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        clientX: bounds.left + 30,
        clientY: bounds.top + 100,
        dataTransfer: transfer,
      }),
    );

    target.dispatchEvent(
      new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        clientX: bounds.left + 30,
        clientY: bounds.top + 100,
        dataTransfer: transfer,
      }),
    );

    card.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: transfer }));
  });

  expect((await moved).postDataJSON()).toMatchObject({ novaColunaId: 'c1', novaOrdem: 0 });
  await expect(page.locator('[data-drag-preview]')).toHaveCount(0);
});

test('Enter no e-mail valida e continua uma única vez', async ({ page }) => {
  let submissions = 0;

  await page.route('**/api/**', (route) => {
    if (route.request().url().endsWith('/auth/login')) {
      submissions += 1;
      expect(route.request().postDataJSON()).toEqual({ email: 'maria@example.test' });

      return route.fulfill({ json: { nextStep: 'password' } });
    }

    return route.fulfill({ json: { accessToken: null, user: null } });
  });

  await page.goto('/login');

  const email = page.getByRole('textbox', { name: 'E-mail', exact: true });

  await email.fill('invalido');
  await email.press('Enter');
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  expect(submissions).toBe(0);
  await email.fill('maria@example.test');
  await email.press('Enter');
  await expect(page.getByRole('heading', { name: 'Digite sua senha' })).toBeVisible();
  expect(submissions).toBe(1);
});

for (const editing of [false, true]) {
  test(`acesso automático ao ${editing ? 'editar' : 'criar'} quadro preserva os demais participantes`, async ({
    page,
  }) => {
    await mockApi(page);

    const { id: sessionUserId, ...sessionFields } = user;
    const realSessionUser = { ...sessionFields, userId: sessionUserId };

    await page.route('**/api/auth/session', (route) =>
      route.fulfill({ json: { accessToken: 'test-access-token', user: realSessionUser } }),
    );

    const colleague = { id: 'u2', nome: 'João Souza', ativo: true, permissao: 'leitor' };
    const team = editing ? [{ ...user, ativo: true, permissao: 'editor' }, colleague] : [colleague];

    await page.route('**/api/kanban/membros', (route) => route.fulfill({ json: team }));
    await page.route('**/api/kanban/boards/b1/membros', (route) => route.fulfill({ json: team }));
    await page.goto('/kanban/quadros');

    await page
      .getByRole('button', { name: editing ? 'Editar equipe' : 'Novo quadro', exact: true })
      .click();

    await expect(
      page.getByText('Você (Maria Silva) terá permissão para editar automaticamente.'),
    ).toBeVisible();

    await expect(page.getByRole('checkbox', { name: 'Maria Silva' })).toHaveCount(0);

    if (!editing) {
      await page.getByLabel('Nome do quadro', { exact: true }).fill('Novo quadro de vendas');
      await page.getByRole('checkbox', { name: 'João Souza' }).check();
      await page.getByLabel('Acesso de João Souza').selectOption('leitor');
    }

    const saved = page.waitForRequest(
      (req) =>
        req.method() === (editing ? 'PATCH' : 'POST') &&
        new URL(req.url()).pathname === (editing ? '/api/kanban/boards/b1' : '/api/kanban/boards'),
    );

    await page.getByRole('button', { name: 'Salvar quadro', exact: true }).click();

    const payload = (await saved).postDataJSON();

    expect(payload.participantes.sort()).toEqual(['u1', 'u2']);

    expect(payload.permissoes).toEqual(
      expect.arrayContaining([
        { id: 'u1', permissao: 'editor' },
        { id: 'u2', permissao: 'leitor' },
      ]),
    );
  });
}

async function mockFlowBoard(page) {
  await mockApi(page);

  const flowBoard = structuredClone(board);

  flowBoard.participantes = [{ ...user, ativo: true }];
  flowBoard.colunas[0].wipLimit = 1;
  flowBoard.colunas[0].cards[0].etapaDesde = new Date(Date.now() - 10 * 86400000).toISOString();

  flowBoard.colunas[0].cards.push({
    id: 'card2',
    titulo: 'Aprovar orçamento',
    colunaId: 'c0',
    responsavelId: 'u1',
    updatedAt: '2026-11-21T12:00:00Z',
    dadosExtras: {},
  });

  await page.route('**/api/kanban/boards/b1', (route) => route.fulfill({ json: flowBoard }));
  await page.goto('/kanban?quadro=b1');

  await expect(
    page.getByRole('button', { name: 'Acompanhar proposta do cliente', exact: true }),
  ).toBeVisible();

  return flowBoard;
}

test('fluxo Kanban: próxima ação, bloqueio, dependência e recorrência no celular', async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await mockFlowBoard(page);
  await expect(page.getByText('10 dias nesta etapa · Sem movimentação')).toBeVisible();
  await expect(page.locator('[data-wip-exceeded="true"]')).toHaveCount(1);

  await page.route('**/api/kanban/cards/card1', (route) =>
    route.fulfill({ json: { id: 'card1' } }),
  );

  await page.getByRole('button', { name: 'Acompanhar proposta do cliente', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Definir próxima ação', exact: true }).check();
  await page.getByLabel('O que fazer', { exact: true }).fill('Ligar para o cliente');
  await page.getByLabel('Data da próxima ação', { exact: true }).fill('2026-12-01');
  await page.getByRole('checkbox', { name: 'Lembrar o responsável por e-mail' }).check();
  await page.getByLabel('Motivo do bloqueio', { exact: true }).fill('Aguardar contrato');
  await page.getByLabel('Quem precisa resolver', { exact: true }).selectOption('u1');
  await page.getByLabel('Depende da conclusão de', { exact: true }).selectOption('card2');
  await page.getByRole('button', { name: 'Opções avançadas', exact: true }).click();
  await page.getByLabel('Repetir ao concluir o prazo', { exact: true }).selectOption('semanal');
  await expectNoPageOverflow(page);

  const request = page.waitForRequest(
    (req) => req.method() === 'PATCH' && req.url().endsWith('/kanban/cards/card1'),
  );

  await page.getByRole('button', { name: 'Salvar card', exact: true }).click();

  expect((await request).postDataJSON().dadosExtras).toMatchObject({
    proximaAcao: {
      titulo: 'Ligar para o cliente',
      data: '2026-12-01',
      lembrar: true,
      concluida: false,
    },
    bloqueio: 'Aguardar contrato',
    bloqueioResponsavelId: 'u1',
    dependencias: ['card2'],
    recorrencia: 'semanal',
  });
});

test('fluxo Kanban: regras e automações da coluna preservam prazo imediato', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await mockFlowBoard(page);
  await page.route('**/api/kanban/colunas/c0', (route) => route.fulfill({ json: { id: 'c0' } }));
  await page.getByRole('button', { name: 'Editar Backlog', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Exigir responsável', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Exigir prazo', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Exigir checklist preenchido e concluído' }).check();
  await page.getByLabel('Destacar cards parados após (dias)').fill('3');
  await page.getByLabel('Atribuir responsável', { exact: true }).selectOption('u1');
  await page.getByLabel('Definir prazo em dias', { exact: true }).fill('0');
  await page.getByLabel('Criar tarefa nesta etapa', { exact: true }).fill('Preparar contrato');
  await page.getByRole('checkbox', { name: 'Concluir o card automaticamente' }).check();
  await expectNoPageOverflow(page);

  const request = page.waitForRequest(
    (req) => req.method() === 'PATCH' && req.url().endsWith('/kanban/colunas/c0'),
  );

  await page.getByRole('button', { name: 'Salvar coluna', exact: true }).click();

  expect((await request).postDataJSON().regrasFluxo).toEqual({
    exigirResponsavel: true,
    exigirPrazo: true,
    exigirChecklist: true,
    diasSemMovimento: 3,
    automacao: { concluir: true, responsavelId: 'u1', prazoDias: 0, tarefa: 'Preparar contrato' },
  });
});

for (const action of ['mover', 'atribuir', 'etiquetar', 'arquivar']) {
  test(`fluxo Kanban: ação em lote ${action} usa seleção e versões dos cards`, async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await mockFlowBoard(page);

    await page.route('**/api/kanban/boards/b1/cards/lote', (route) =>
      route.fulfill({ json: { total: 2 } }),
    );

    await page.getByRole('button', { name: 'Selecionar cards', exact: true }).click();
    await page.getByRole('button', { name: 'Selecionar resultados', exact: true }).click();

    await expect(
      page.getByRole('checkbox', { name: 'Selecionar Acompanhar proposta do cliente' }),
    ).toBeChecked();

    await page.getByLabel('Ação', { exact: true }).selectOption(action);

    if (action === 'mover') {
      await page.getByLabel('Etapa de destino', { exact: true }).selectOption('c1');
    }

    if (action === 'atribuir') {
      await page.getByLabel('Responsável dos cards', { exact: true }).selectOption('u1');
    }

    if (action === 'etiquetar') {
      await page.getByLabel('Nome da etiqueta', { exact: true }).fill('Priorizar');
    }

    await expectNoPageOverflow(page);

    const request = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().endsWith('/kanban/boards/b1/cards/lote'),
    );

    await page.getByRole('button', { name: 'Aplicar em 2 cards', exact: true }).click();

    const payload = (await request).postDataJSON();

    expect(payload.acao).toBe(action);

    expect(payload.cards).toEqual([
      { id: 'card1', expectedUpdatedAt: '2026-11-21T12:00:00Z' },
      { id: 'card2', expectedUpdatedAt: '2026-11-21T12:00:00Z' },
    ]);

    if (action === 'mover') {
      expect(payload.colunaId).toBe('c1');
    }

    if (action === 'atribuir') {
      expect(payload.responsavelId).toBe('u1');
    }

    if (action === 'etiquetar') {
      expect(payload.etiqueta).toMatchObject({ nome: 'Priorizar', cor: 'azul' });
    }
  });
}

test('fluxo Kanban: relatório mostra métricas e permanece responsivo', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await mockFlowBoard(page);

  await page.route('**/api/kanban/boards/b1/relatorio', (route) =>
    route.fulfill({ json: [{ id: 'c0', nome: 'Backlog', cards: 4, horas: 12 }] }),
  );

  await page.route('**/api/kanban/boards/b1/metricas', (route) =>
    route.fulfill({
      json: {
        abertos: 2,
        bloqueados: 1,
        concluidos30Dias: 5,
        tempoMedioConclusaoHoras: 24,
        etapas: [{ id: 'c0', abertos: 2, wipLimit: 1, idadeMediaHoras: 15 }],
      },
    }),
  );

  await page.getByRole('button', { name: 'Relatório', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Métricas de fluxo' })).toBeVisible();
  await expect(page.getByText('Concluídos (30 dias)', { exact: true })).toBeVisible();
  await expect(page.getByText('24 h', { exact: true })).toBeVisible();
  await expectNoPageOverflow(page);
});

for (const width of [393, 1440]) {
  test(`orientações do Kanban explicam filtros e ações em vários cards em ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await mockFlowBoard(page);

    const filters = page.getByRole('region', { name: 'Busca e filtros de cards' });
    const bulk = page.getByRole('region', { name: 'Ações em vários cards' });

    await expect(filters.getByRole('heading', { name: 'Buscar e filtrar cards' })).toBeVisible();
    await expect(filters).toHaveAccessibleDescription(/Encontre tarefas por texto/);

    await expect(bulk).toHaveAccessibleDescription(
      /mover de etapa, trocar o responsável, adicionar etiquetas ou arquivar/,
    );

    await expectNoPageOverflow(page);
    await page.screenshot({ path: `/tmp/kanban-context-${width}.png`, fullPage: true });

    const saved = filters.getByRole('button', { name: 'Filtros salvos (0)' });

    await saved.click();
    await expect(saved).toHaveAttribute('aria-expanded', 'true');

    await expect(
      filters.getByRole('heading', { name: 'Reutilizar uma combinação de filtros' }),
    ).toBeVisible();

    await expect(
      filters.getByText('Seus filtros ficam salvos neste navegador, com limite de 10 por quadro.'),
    ).toBeVisible();

    await saved.click();

    const select = bulk.getByRole('button', { name: 'Selecionar cards', exact: true });

    await select.click();

    await expect(bulk.getByRole('button', { name: 'Encerrar seleção' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await expect(bulk.getByText(/Marque os cards no quadro/)).toBeVisible();
    await expect(bulk.getByRole('button', { name: 'Aplicar em 0 cards' })).toBeDisabled();
    await bulk.getByLabel('Ação', { exact: true }).selectOption('arquivar');

    await expect(bulk.getByLabel('Ação', { exact: true })).toHaveAccessibleDescription(
      /Você pode recuperá-los pela opção “Arquivados”/,
    );

    await expect(
      bulk.getByRole('button', { name: 'Aplicar em 0 cards' }),
    ).toHaveAccessibleDescription(/Retira os cards marcados do quadro/);

    await expectNoPageOverflow(page);
  });
}
