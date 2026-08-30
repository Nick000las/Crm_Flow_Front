import assert from 'node:assert/strict';
import { after, afterEach, before, test } from 'node:test';

import { act, createElement as h, useState } from 'react';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

let dom;
let server;
let createRoot;
let root;
let container;
let Input;
let NativeSelect;
let Checkbox;
let Radio;
let Button;
let Card;
let Form;
let FieldError;
let Select;
let SelectTrigger;
let SelectValue;
let SelectContent;
let SelectItem;
let Textarea;
let Alert;
const originalGlobals = new Map();

before(async () => {
  dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
  });

  // JSDOM 26 keeps the project's Node range and needs the browser PointerEvent API.
  class PointerEvent extends dom.window.MouseEvent {
    constructor(type, options = {}) {
      super(type, options);
      this.pointerId = options.pointerId ?? 1;
      this.pointerType = options.pointerType ?? 'mouse';
      this.isPrimary = options.isPrimary ?? true;
    }
  }
  dom.window.PointerEvent = PointerEvent;

  for (const name of [
    'window',
    'document',
    'navigator',
    'HTMLElement',
    'HTMLInputElement',
    'HTMLSelectElement',
    'Node',
    'Element',
    'Event',
    'MouseEvent',
    'PointerEvent',
    'KeyboardEvent',
    'MutationObserver',
    'getComputedStyle',
    'CustomEvent',
    'FocusEvent',
    'ShadowRoot',
    'DocumentFragment',
    'requestAnimationFrame',
    'cancelAnimationFrame',
  ]) {
    originalGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));

    const value = name === 'window' ? dom.window : dom.window[name];

    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value:
        typeof value === 'function' && name.endsWith('AnimationFrame')
          ? value.bind(dom.window)
          : value,
    });
  }

  originalGlobals.set(
    'IS_REACT_ACT_ENVIRONMENT',
    Object.getOwnPropertyDescriptor(globalThis, 'IS_REACT_ACT_ENVIRONMENT'),
  );

  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  ({ createRoot } = await import('react-dom/client'));

  server = await createServer({
    logLevel: 'silent',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });

  const load = (file) => server.ssrLoadModule(`/src/components/${file}.jsx`);

  ({ Input } = await load('ui/input'));
  ({ NativeSelect } = await load('ui/native-select'));
  ({ Checkbox } = await load('ui/checkbox'));
  ({ Radio } = await load('ui/radio'));
  ({ Button } = await load('ui/button'));
  ({ Card } = await load('ui/card'));
  ({ Form } = await load('ui/form'));
  ({ FieldError } = await load('field-error'));
  ({ Select, SelectTrigger, SelectValue, SelectContent, SelectItem } = await load('ui/select'));
  ({ Textarea } = await load('ui/textarea'));
  ({ Alert } = await load('ui/alert'));
});

async function render(element) {
  if (!root) {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  }

  await act(async () => root.render(element));

  return container;
}

afterEach(async () => {
  if (root) {
    await act(async () => root.unmount());
    root = null;
    container.remove();
  }
});

after(async () => {
  await server?.close();
  dom?.window.close();

  for (const [name, descriptor] of originalGlobals) {
    if (descriptor) {
      Object.defineProperty(globalThis, name, descriptor);
    } else {
      delete globalThis[name];
    }
  }
});

test('Input mantém edição controlada, foco, ref e associação do erro', async () => {
  let inputRef;

  function Example() {
    const [value, setValue] = useState('');

    return h(
      'div',
      null,
      h(Input, {
        ref: (node) => {
          inputRef = node;
        },
        id: 'nome',
        name: 'nome',
        value,
        onChange: (event) => setValue(event.target.value),
        'aria-invalid': true,
        'aria-describedby': 'nome-erro',
      }),
      h(FieldError, { id: 'nome-erro', message: 'Informe o nome' }),
      h('output', null, value),
    );
  }

  await render(h(Example));

  const input = container.querySelector('input');

  assert.equal(inputRef, input);
  input.focus();
  assert.equal(document.activeElement, input);

  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Maria');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

  assert.equal(container.querySelector('output').textContent, 'Maria');

  assert.equal(
    input.getAttribute('aria-describedby'),
    container.querySelector('[role="alert"]').id,
  );
});

test('NativeSelect preserva valor vazio, onChange nativo, ref e envio no formulário', async () => {
  let selectRef;
  const changes = [];

  function Example() {
    const [value, setValue] = useState('');

    return h(
      Form,
      { noValidate: true },
      h(
        NativeSelect,
        {
          name: 'responsavel',
          value,
          ref: (node) => {
            selectRef = node;
          },
          onChange: (event) => {
            changes.push(event.target.value);
            setValue(event.target.value);
          },
        },
        h('option', { value: '' }, 'Sem responsável'),
        h('option', { value: 'u1' }, 'Maria'),
      ),
    );
  }

  await render(h(Example));
  assert.equal(selectRef.value, '');

  await act(async () => {
    selectRef.value = 'u1';
    selectRef.dispatchEvent(new Event('change', { bubbles: true }));
  });

  assert.deepEqual(changes, ['u1']);
  assert.equal(new dom.window.FormData(container.querySelector('form')).get('responsavel'), 'u1');
  assert.equal(container.querySelectorAll('svg').length, 1);
});

test('NativeSelect múltiplo mantém as opções e não mostra seta de seleção única', async () => {
  await render(
    h(
      'form',
      null,
      h(
        NativeSelect,
        { name: 'tags', multiple: true, defaultValue: ['a', 'b'] },
        h('option', { value: 'a' }, 'A'),
        h('option', { value: 'b' }, 'B'),
      ),
    ),
  );

  assert.deepEqual(new dom.window.FormData(container.querySelector('form')).getAll('tags'), [
    'a',
    'b',
  ]);

  assert.equal(container.querySelector('svg'), null);
});

test('Checkbox mantém alteração controlada e bloqueia interação quando desabilitado', async () => {
  const changes = [];

  function Example({ disabled = false }) {
    const [checked, setChecked] = useState(false);

    return h(Checkbox, {
      checked,
      disabled,
      'aria-label': 'Receber avisos',
      onCheckedChange: (value) => {
        changes.push(value);
        setChecked(value);
      },
    });
  }

  await render(h(Example));
  await act(async () => container.querySelector('[role="checkbox"]').click());
  assert.deepEqual(changes, [true]);
  assert.equal(container.querySelector('[role="checkbox"]').getAttribute('aria-checked'), 'true');
  await render(h(Example, { disabled: true }));
  await act(async () => container.querySelector('[role="checkbox"]').click());
  assert.deepEqual(changes, [true]);
});

test('Radio mantém seleção exclusiva, evento nativo e valor no formulário', async () => {
  const changes = [];

  await render(
    h(
      'form',
      null,
      h(Radio, { name: 'layout', value: 'compacto', defaultChecked: true }),
      h(Radio, {
        name: 'layout',
        value: 'amplo',
        onChange: (event) => changes.push(event.target.value),
      }),
    ),
  );

  await act(async () => container.querySelector('input[value="amplo"]').click());
  assert.equal(container.querySelectorAll('input:checked').length, 1);
  assert.deepEqual(changes, ['amplo']);
  assert.equal(new dom.window.FormData(container.querySelector('form')).get('layout'), 'amplo');
});

test('Button bloqueia envio repetido durante loading e mantém semântica de link', async () => {
  let clicks = 0;

  await render(
    h(Button, { loading: true, loadingText: 'Salvando…', onClick: () => clicks++ }, 'Salvar'),
  );

  const button = container.querySelector('button');

  await act(async () => button.click());
  assert.equal(clicks, 0);
  assert.equal(button.getAttribute('aria-busy'), 'true');
  assert.match(button.textContent, /Salvando/);
  await render(h(Button, { nativeButton: false, render: h('a', { href: '/crm' }) }, 'Leads'));
  assert.equal(container.querySelector('a').getAttribute('href'), '/crm');
  assert.equal(container.querySelector('button'), null);
});

test('Card simples preserva o elemento semântico e eventos de arraste', async () => {
  let drags = 0;

  await render(
    h(
      Card,
      { as: 'article', layout: 'plain', draggable: true, onDragStart: () => drags++ },
      'Negociação',
    ),
  );

  const card = container.querySelector('article');

  assert.equal(card.getAttribute('draggable'), 'true');
  await act(async () => card.dispatchEvent(new Event('dragstart', { bubbles: true })));
  assert.equal(drags, 1);
  assert.equal(card.textContent, 'Negociação');
});

test('Select Base UI mantém abertura e escolha acessíveis após unificar o trigger', async () => {
  function Example() {
    const [value, setValue] = useState('a');

    return h(
      'div',
      null,
      h(
        Select,
        { value, onValueChange: setValue },
        h(SelectTrigger, { 'aria-label': 'Prioridade' }, h(SelectValue)),
        h(
          SelectContent,
          { alignItemWithTrigger: false },
          h(SelectItem, { value: 'a' }, 'Baixa'),
          h(SelectItem, { value: 'b' }, 'Alta'),
        ),
      ),
      h('output', null, value),
    );
  }

  await render(h(Example));
  await act(async () => container.querySelector('[data-slot="select-trigger"]').click());

  const option = Array.from(document.querySelectorAll('[role="option"]')).find((item) =>
    item.textContent.includes('Alta'),
  );

  assert.ok(option);

  await act(async () => {
    option.dispatchEvent(
      new dom.window.PointerEvent('pointerdown', {
        bubbles: true,
        pointerType: 'mouse',
        button: 0,
      }),
    );

    option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));

    option.dispatchEvent(
      new dom.window.PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse', button: 0 }),
    );

    option.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));

    option.dispatchEvent(
      new dom.window.PointerEvent('click', { bubbles: true, pointerType: 'mouse', detail: 1 }),
    );
  });

  assert.equal(container.querySelector('output').textContent, 'b');
});

test('Form preserva Ctrl+Enter em textarea e ignora composição de texto', async () => {
  let submissions = 0;

  await render(
    h(
      Form,
      {
        noValidate: true,
        onSubmit: (event) => {
          event.preventDefault();
          submissions++;
        },
      },
      h(Textarea, { name: 'descricao', defaultValue: 'Descrição' }),
      h(Button, { type: 'submit' }, 'Salvar'),
    ),
  );

  const textarea = container.querySelector('textarea');

  await act(async () =>
    textarea.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
        isComposing: true,
      }),
    ),
  );

  assert.equal(submissions, 0);

  await act(async () =>
    textarea.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }),
    ),
  );

  assert.equal(submissions, 1);
});

test('Input de arquivo preserva o elemento nativo e entrega os arquivos ao onChange', async () => {
  let selected;

  await render(
    h(Input, {
      type: 'file',
      multiple: true,
      accept: '.csv',
      onChange: (event) => {
        selected = event.target.files;
      },
    }),
  );

  const input = container.querySelector('input');
  const file = new dom.window.File(['nome\nMaria'], 'leads.csv', { type: 'text/csv' });

  Object.defineProperty(input, 'files', { configurable: true, value: [file] });
  await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
  assert.equal(selected[0], file);
  assert.equal(input.accept, '.csv');
  assert.equal(input.multiple, true);
});

test('Alert anuncia erros e preserva ações de recuperação', async () => {
  let retries = 0;

  await render(
    h(
      Alert,
      { variant: 'destructive' },
      'Não foi possível carregar',
      h(Button, { onClick: () => retries++ }, 'Tentar novamente'),
    ),
  );

  assert.equal(
    container.querySelector('[role="alert"]').textContent.includes('Não foi possível carregar'),
    true,
  );

  await act(async () => container.querySelector('button').click());
  assert.equal(retries, 1);
});
