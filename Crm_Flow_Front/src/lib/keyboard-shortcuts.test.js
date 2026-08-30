import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildNavigationCommands,
  filterCommands,
  findChordDestination,
  isEditableTarget,
  isComposingKeyEvent,
  hasOpenOverlay,
} from './keyboard-shortcuts.js';

const MOCK_MODULES = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    pages: [{ key: 'overview', label: 'Visão geral', path: '/dashboard' }],
  },
  {
    key: 'crm',
    label: 'CRM',
    path: '/crm',
    pages: [
      { key: 'leads', label: 'Leads', path: '/crm' },
      { key: 'importar', label: 'Importar', path: '/crm/importar' },
    ],
  },
];

const MOCK_UTILITY = [{ key: 'configuracoes', label: 'Configurações', path: '/configuracoes' }];

describe('keyboard-shortcuts', () => {
  it('um seletor fechado e ainda montado não bloqueia os atalhos', () => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
    let closed = false;
    let visible = true;
    const popup = {
      getClientRects: () => (visible ? [{}] : []),
      closest: () => (closed ? {} : null),
    };
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: {
        querySelectorAll: (selector) => (selector.includes('[role="listbox"]') ? [popup] : []),
      },
    });
    try {
      assert.equal(hasOpenOverlay(), true);
      closed = true;
      assert.equal(hasOpenOverlay(), false);
      closed = false;
      visible = false;
      assert.equal(hasOpenOverlay(), false);
    } finally {
      if (previous) {
        Object.defineProperty(globalThis, 'document', previous);
      } else {
        delete globalThis.document;
      }
    }
  });
  it('preserva a confirmação de texto durante composição do teclado', () => {
    assert.equal(isComposingKeyEvent({ isComposing: true }), true);
    assert.equal(isComposingKeyEvent({ nativeEvent: { isComposing: true } }), true);
    assert.equal(isComposingKeyEvent({ keyCode: 229 }), true);
    assert.equal(isComposingKeyEvent({ key: 'Enter' }), false);
  });
  it('detecta alvos editáveis para não sequestrar digitação', () => {
    assert.equal(isEditableTarget({ tagName: 'INPUT' }), true);
    assert.equal(isEditableTarget({ tagName: 'TEXTAREA' }), true);
    assert.equal(isEditableTarget({ tagName: 'SELECT' }), true);
    assert.equal(isEditableTarget({ tagName: 'DIV', isContentEditable: true }), true);
    assert.equal(isEditableTarget({ tagName: 'BUTTON' }), false);
    assert.equal(isEditableTarget(null), false);
  });

  it('monta destinos respeitando apenas os módulos visíveis e associa atalhos G', () => {
    const commands = buildNavigationCommands(MOCK_MODULES, MOCK_UTILITY);
    assert.equal(findChordDestination(commands, 'd'), '/dashboard');
    assert.equal(findChordDestination(commands, 'c'), '/crm');
    assert.equal(findChordDestination(commands, 's'), '/configuracoes');
    // Kanban não estava em MOCK_MODULES: não pode navegar para módulo oculto.
    assert.equal(findChordDestination(commands, 'k'), null);
  });

  it('filtra comandos sem distinção de acentos ou caixa', () => {
    const commands = buildNavigationCommands(MOCK_MODULES, MOCK_UTILITY);
    const result = filterCommands(commands, 'configuracoes');
    assert.equal(result.length, 1);
    assert.equal(result[0].path, '/configuracoes');

    const visao = filterCommands(commands, 'visao');
    assert.equal(visao.length, 1);
    assert.equal(visao[0].path, '/dashboard');
  });
});
