/**
 * @file Testes unitários para resolução de rotas e filtragem de passos visíveis dos tutoriais
 * interativos (Driver.js).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createDriverOptions,
  isTourElementVisible,
  resolveTourForRoute,
  resolveVisibleTourSteps,
  TOURS,
} from './tours.js';

function createFakeElement({ hiddenAncestor = false, display = 'block', rects = 1 } = {}) {
  return {
    closest: () => (hiddenAncestor ? {} : null),
    getClientRects: () => Array.from({ length: rects }, () => ({ width: 100, height: 40 })),
    __display: display,
  };
}

function createFakeEnv(elementsBySelector) {
  return {
    doc: {
      querySelector: (selector) => elementsBySelector[selector] ?? null,
    },
    win: {
      getComputedStyle: (el) => ({ display: el.__display ?? 'block', visibility: 'visible' }),
    },
  };
}

describe('resolveTourForRoute', () => {
  it('resolve corretamente cada tela principal do aplicativo e do admin', () => {
    assert.equal(resolveTourForRoute('/dashboard').id, 'dashboard');
    assert.equal(resolveTourForRoute('/kanban').id, 'kanban-gallery');
    assert.equal(resolveTourForRoute('/kanban', '?quadro=abc-123').id, 'kanban-board');
    assert.equal(resolveTourForRoute('/kanban/quadros').id, 'kanban-manage');
    assert.equal(resolveTourForRoute('/kanban/pipeline/pipe-1').id, 'crm-pipeline');
    assert.equal(resolveTourForRoute('/kanban/pipeline/pipe-1/leads/lead-9').id, 'crm-pipeline');
    assert.equal(resolveTourForRoute('/crm').id, 'crm-leads');
    assert.equal(resolveTourForRoute('/crm/leads/lead-9').id, 'crm-leads');
    assert.equal(resolveTourForRoute('/crm/forecast').id, 'crm-forecast');
    assert.equal(resolveTourForRoute('/crm/forecast/leads/lead-9').id, 'crm-forecast');
    assert.equal(resolveTourForRoute('/crm/importar').id, 'crm-import');
    assert.equal(resolveTourForRoute('/crm/configuracoes').id, 'crm-settings');
    assert.equal(resolveTourForRoute('/crm/configuracoes/campos').id, 'crm-settings');
    assert.equal(resolveTourForRoute('/configuracoes').id, 'account-settings');
    assert.equal(resolveTourForRoute('/admin').id, 'admin-tenants');
    assert.equal(resolveTourForRoute('/admin/tenants').id, 'admin-tenants');
    assert.equal(resolveTourForRoute('/admin/tenants/t-42').id, 'admin-tenant-detail');
  });

  it('normaliza barras finais e aplica fallback seguro para rotas desconhecidas', () => {
    assert.equal(resolveTourForRoute('/crm/').id, 'crm-leads');
    assert.equal(resolveTourForRoute('/rota-desconhecida').id, 'dashboard');
  });
});

describe('isTourElementVisible e resolveVisibleTourSteps', () => {
  it('mantém passos introdutórios e filtra seletores ausentes ou ocultos', () => {
    const { doc, win } = createFakeEnv({
      '[data-tour="kanban-gallery-search"]': createFakeElement(),
      '[data-tour="kanban-gallery-grid"]': createFakeElement({ display: 'none' }),
      '[data-tour="kanban-gallery-manage"]': createFakeElement({ rects: 0 }),
    });

    const visible = resolveVisibleTourSteps(TOURS['kanban-gallery'], doc, win);

    assert.equal(visible.length, 2);
    assert.equal(visible[0].element, undefined);
    assert.equal(visible[1].element, '[data-tour="kanban-gallery-search"]');
  });

  it('ignora elementos sob ancestrais ocultos ou inertes', () => {
    const el = createFakeElement({ hiddenAncestor: true });
    const win = { getComputedStyle: () => ({ display: 'block', visibility: 'visible' }) };

    assert.equal(isTourElementVisible(el, win), false);
    assert.equal(isTourElementVisible(null, win), false);
  });

  it('garante que todos os tutoriais registrados têm passo introdutório e textos em português', () => {
    for (const tour of Object.values(TOURS)) {
      assert.ok(tour.id);
      assert.ok(tour.title);
      assert.ok(tour.steps.length >= 2);
      assert.equal(tour.steps[0].element, undefined);

      for (const step of tour.steps) {
        assert.ok(step.popover?.title?.trim().length > 0);
        assert.ok(step.popover?.description?.trim().length > 0);
      }
    }
  });
});

describe('createDriverOptions', () => {
  it('configura rótulos em português, classe temática e movimento reduzido', () => {
    const normal = createDriverOptions(TOURS.dashboard.steps, { reducedMotion: false });
    const reduced = createDriverOptions([TOURS.dashboard.steps[0]], { reducedMotion: true });

    assert.equal(normal.popoverClass, 'flow-tour-popover');
    assert.equal(normal.nextBtnText, 'Próximo');
    assert.equal(normal.prevBtnText, 'Anterior');
    assert.equal(normal.doneBtnText, 'Concluir');
    assert.equal(normal.animate, true);
    assert.equal(normal.showProgress, true);

    assert.equal(reduced.animate, false);
    assert.equal(reduced.smoothScroll, false);
    assert.equal(reduced.showProgress, false);
  });
});
