import { ArrowRight, Keyboard, Monitor, Moon, Search, Sun } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTheme } from '@/hooks/use-theme';
import { filterCommands, isMacPlatform, isComposingKeyEvent } from '@/lib/keyboard-shortcuts';
import { cn } from '@/lib/utils';

function KeyCap({ children }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-border bg-surface px-1.5 text-[11px] font-medium text-muted-foreground shadow-2xs">
      {children}
    </kbd>
  );
}

/**
 * Paleta de comandos global (`⌘K` / `Ctrl+K`) para navegar entre módulos,
 * páginas, alternar tema e consultar atalhos usando apenas o teclado.
 */
export function CommandPalette({ open, onOpenChange, commands, onOpenHelp }) {
  const listId = useId();
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allItems = useMemo(() => {
    const themeItems = [
      {
        id: 'theme:light',
        group: 'Aparência',
        label: 'Usar tema claro',
        subtitle: 'Aparência da interface',
        icon: Sun,
        keywords: 'tema claro light modo',
        run: () => setTheme('light'),
      },
      {
        id: 'theme:dark',
        group: 'Aparência',
        label: 'Usar tema escuro',
        subtitle: 'Aparência da interface',
        icon: Moon,
        keywords: 'tema escuro dark modo',
        run: () => setTheme('dark'),
      },
      {
        id: 'theme:system',
        group: 'Aparência',
        label: 'Seguir tema do sistema',
        subtitle: 'Aparência da interface',
        icon: Monitor,
        keywords: 'tema sistema automatico',
        run: () => setTheme('system'),
      },
      {
        id: 'help:shortcuts',
        group: 'Ajuda',
        label: 'Ver todos os atalhos de teclado',
        subtitle: 'Referência rápida',
        icon: Keyboard,
        shortcut: '?',
        keywords: 'atalhos teclado ajuda shortcuts',
        run: () => onOpenHelp(),
      },
    ];

    const navItems = commands.map((cmd) => ({
      ...cmd,
      run: () => navigate(cmd.path),
    }));

    return [...navItems, ...themeItems];
  }, [commands, navigate, setTheme, onOpenHelp]);

  const filtered = useMemo(() => filterCommands(allItems, query), [allItems, query]);
  const safeIndex = filtered.length > 0 ? Math.min(selectedIndex, filtered.length - 1) : 0;

  useEffect(() => {
    if (open) {
      document.getElementById(`${listId}-${safeIndex}`)?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, safeIndex, listId, query]);

  function handleOpenChange(nextOpen) {
    if (!nextOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
    onOpenChange(nextOpen);
  }

  function executeItem(item) {
    handleOpenChange(false);
    item.run();
  }

  function handleKeyDown(event) {
    if (
      event.defaultPrevented ||
      isComposingKeyEvent(event) ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      filtered.length === 0
    ) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((current) => (current + 1) % filtered.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((current) => (current - 1 + filtered.length) % filtered.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (!event.repeat) {
        executeItem(filtered[safeIndex]);
      }
    }
  }

  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach((item, flatIndex) => {
      if (!map.has(item.group)) {
        map.set(item.group, []);
      }
      map.get(item.group).push({ ...item, flatIndex });
    });
    return [...map.entries()];
  }, [filtered]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-command-palette=""
        className="gap-0 overflow-hidden p-0 sm:max-w-lg"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Navegação rápida</DialogTitle>
          <DialogDescription>Pesquise páginas, módulos e ações usando o teclado.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ir para página, módulo ou ação…"
            aria-label="Pesquisar páginas e comandos"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={filtered.length ? `${listId}-${safeIndex}` : undefined}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/75"
          />
          <KeyCap>Esc</KeyCap>
        </div>

        <div
          id={listId}
          className="max-h-80 overflow-y-auto p-2"
          role="listbox"
          aria-label="Comandos"
        >
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Nenhum destino encontrado para &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <div className="grid gap-3">
              {groups.map(([groupName, items]) => (
                <div key={groupName} className="grid gap-0.5">
                  <p className="px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {groupName}
                  </p>
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = item.flatIndex === safeIndex;

                    return (
                      <button
                        key={item.id}
                        id={`${listId}-${item.flatIndex}`}
                        tabIndex={-1}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onMouseEnter={() => setSelectedIndex(item.flatIndex)}
                        onClick={() => executeItem(item)}
                        className={cn(
                          'flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                          active
                            ? 'bg-accent text-foreground'
                            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          {Icon && (
                            <Icon
                              className={cn(
                                'size-4 shrink-0',
                                active ? 'text-primary' : 'text-muted-foreground',
                              )}
                              aria-hidden="true"
                            />
                          )}
                          <span className="truncate font-medium text-foreground">{item.label}</span>
                          {item.subtitle && (
                            <span className="truncate text-xs text-muted-foreground">
                              {item.subtitle}
                            </span>
                          )}
                        </span>

                        <span className="flex shrink-0 items-center gap-1">
                          {item.chord ? (
                            <>
                              <KeyCap>G</KeyCap>
                              <KeyCap>{item.chord.toUpperCase()}</KeyCap>
                            </>
                          ) : item.shortcut ? (
                            <KeyCap>{item.shortcut}</KeyCap>
                          ) : active ? (
                            <ArrowRight
                              className="size-3.5 text-muted-foreground"
                              aria-hidden="true"
                            />
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-surface px-4 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <KeyCap>↑</KeyCap>
              <KeyCap>↓</KeyCap> navegar
            </span>
            <span className="inline-flex items-center gap-1">
              <KeyCap>↵</KeyCap> abrir
            </span>
          </span>
          <span className="inline-flex items-center gap-1">
            <KeyCap>?</KeyCap> atalhos
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Modal de referência com todos os atalhos disponíveis para o perfil do usuário.
 */
export function ShortcutsHelpDialog({ open, onOpenChange, commands }) {
  const isMac = isMacPlatform();
  const modKey = isMac ? '⌘' : 'Ctrl';
  const navShortcuts = commands.filter((cmd) => Boolean(cmd.chord));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Atalhos de teclado</DialogTitle>
          <DialogDescription>
            Navegue pelo Flow CRM sem tirar as mãos do teclado. Atalhos de letra única ficam
            desativados enquanto você digita em campos de texto.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-1">
          <section className="grid gap-2">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Geral
            </h3>
            <ul className="grid gap-2 text-sm">
              <li className="flex items-center justify-between gap-4">
                <span className="text-foreground">Abrir busca rápida / comandos</span>
                <span className="flex items-center gap-1">
                  <KeyCap>{modKey}</KeyCap>
                  <KeyCap>K</KeyCap>
                </span>
              </li>
              <li className="flex items-center justify-between gap-4">
                <span className="text-foreground">Focar busca da tela atual</span>
                <KeyCap>/</KeyCap>
              </li>
              <li className="flex items-center justify-between gap-4">
                <span className="text-foreground">Alternar página no módulo atual</span>
                <span className="flex items-center gap-1">
                  <KeyCap>Alt</KeyCap>
                  <KeyCap>↑</KeyCap>
                  <KeyCap>↓</KeyCap>
                </span>
              </li>
              <li className="flex items-center justify-between gap-4">
                <span className="text-foreground">Mostrar esta lista de atalhos</span>
                <KeyCap>?</KeyCap>
              </li>
              <li className="flex items-center justify-between gap-4">
                <span className="text-foreground">Enviar formulário, inclusive em texto longo</span>
                <span className="flex items-center gap-1">
                  <KeyCap>{modKey}</KeyCap>
                  <KeyCap>Enter</KeyCap>
                </span>
              </li>
            </ul>
          </section>

          {navShortcuts.length > 0 && (
            <section className="grid gap-2 border-t border-border pt-4">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Ir para
              </h3>
              <ul className="grid gap-2 text-sm">
                {navShortcuts.map((cmd) => (
                  <li key={cmd.id} className="flex items-center justify-between gap-4">
                    <span className="text-foreground">
                      {cmd.subtitle && cmd.subtitle !== cmd.label
                        ? `${cmd.subtitle} · ${cmd.label}`
                        : cmd.label}
                    </span>
                    <span className="flex items-center gap-1">
                      <KeyCap>G</KeyCap>
                      <KeyCap>{cmd.chord.toUpperCase()}</KeyCap>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
