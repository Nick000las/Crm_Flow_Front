/**
 * @file Filtra comandos ignorando acentos e maiúsculas/minúsculas.
 */
/**
 * Utilitários puros de atalhos de teclado e navegação rápida.
 * Respeita sempre a lista de módulos/páginas filtrada por `modulosVisiveis(user)`.
 */

const MODULE_CHORDS = Object.freeze({
  dashboard: 'd',
  crm: 'c',
  kanban: 'k',
  configuracoes: 's',
});

/** Enter durante composição confirma o texto do teclado, não uma ação do sistema. */
export function isComposingKeyEvent(event) {
  return Boolean(event.isComposing || event.nativeEvent?.isComposing || event.keyCode === 229);
}

export function normalizeQuery(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function isEditableTarget(target) {
  if (!target || typeof target !== 'object') {
    return false;
  }

  const tagName = String(target.tagName ?? '').toUpperCase();

  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
    return true;
  }

  if (target.isContentEditable) {
    return true;
  }

  if (typeof target.closest === 'function') {
    return Boolean(
      target.closest(
        '[contenteditable="true"], [role="textbox"], [role="combobox"], [role="slider"], [role="spinbutton"]',
      ),
    );
  }

  return false;
}

export function hasOpenModal() {
  return hasVisibleOverlay(
    'dialog[open], [data-slot="dialog-content"], [data-slot="alert-dialog-content"], [data-slot="sheet-content"], [role="dialog"][aria-modal="true"], .driver-popover',
  );
}

export function hasOpenOverlay() {
  return (
    hasOpenModal() ||
    hasVisibleOverlay('[role="menu"], [role="listbox"], [data-slot="popover-content"]')
  );
}

function hasVisibleOverlay(selector) {
  if (typeof document === 'undefined') {
    return false;
  }

  // Seletores podem manter o popup montado e oculto depois de fechar.
  return Array.from(document.querySelectorAll(selector)).some(
    (element) =>
      element.getClientRects().length > 0 &&
      !element.closest('[data-closed], [hidden], [inert], [aria-hidden="true"]'),
  );
}

/**
 * Monta os destinos navegáveis para a paleta de comandos e para os atalhos `G + <tecla>`.
 */
export function buildNavigationCommands(modules = [], utilityItems = []) {
  const commands = [];

  for (const mod of modules) {
    const chord = MODULE_CHORDS[mod.key] ?? null;

    if (mod.pages && mod.pages.length > 0) {
      mod.pages.forEach((page, index) => {
        commands.push({
          id: `${mod.key}:${page.key}`,
          group: 'Navegação',
          label: page.label,
          subtitle: mod.label,
          path: page.path,
          icon: page.icon ?? mod.icon,
          chord: index === 0 ? chord : null,
          keywords: `${mod.label} ${page.label} ${mod.subtitle ?? ''}`,
        });
      });
    } else {
      commands.push({
        id: mod.key,
        group: 'Navegação',
        label: mod.label,
        subtitle: mod.subtitle ?? 'Módulo',
        path: mod.path,
        icon: mod.icon,
        chord,
        keywords: `${mod.label} ${mod.subtitle ?? ''}`,
      });
    }
  }

  for (const item of utilityItems) {
    commands.push({
      id: `util:${item.key}`,
      group: 'Navegação',
      label: item.label,
      subtitle: 'Conta e preferências',
      path: item.path,
      icon: item.icon,
      chord: MODULE_CHORDS[item.key] ?? null,
      keywords: `${item.label} conta tema mfa segurança`,
    });
  }

  return commands;
}

/**
 * Resolve o destino de um atalho `G + <tecla>` a partir dos comandos visíveis.
 */
export function findChordDestination(commands, key) {
  const normalized = String(key ?? '').toLowerCase();

  if (!normalized) {
    return null;
  }

  const match = commands.find((cmd) => cmd.chord === normalized);

  return match?.path ?? null;
}

/**
 * Filtra comandos ignorando acentos e maiúsculas/minúsculas.
 */
export function filterCommands(commands, query) {
  const normalized = normalizeQuery(query);

  if (!normalized) {
    return commands;
  }

  const terms = normalized.split(/\s+/).filter(Boolean);

  return commands.filter((cmd) => {
    const haystack = normalizeQuery(`${cmd.label} ${cmd.subtitle ?? ''} ${cmd.keywords ?? ''}`);

    return terms.every((term) => haystack.includes(term));
  });
}

export function isMacPlatform() {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const platform = navigator.userAgentData?.platform ?? navigator.platform ?? navigator.userAgent;

  return /mac|iphone|ipad|ipod/i.test(String(platform));
}
