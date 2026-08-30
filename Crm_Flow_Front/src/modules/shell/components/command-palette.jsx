/**
 * @file Modal de referência com todos os atalhos disponíveis para o perfil do usuário.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CircleHelp,
  CornerDownLeft,
  Keyboard,
  Monitor,
  Moon,
  Search,
  Sun,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/hooks/use-theme';
import { filterCommands, isComposingKeyEvent, isMacPlatform } from '@/lib/keyboard-shortcuts';
import { cn } from '@/lib/utils';

function KeyCap({ children, className }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-border bg-surface px-1.5 font-sans text-[11px] font-medium text-muted-foreground shadow-2xs',
        className,
      )}
    >
      {children}
    </kbd>
  );
}

/**
 * Paleta de comandos global (`⌘K` / `Ctrl+K`) para navegar entre módulos,
 * páginas, alternar tema e consultar atalhos usando apenas o teclado.
 */
export function CommandPalette({ open, onOpenChange, commands, onOpenHelp, onStartTour }) {
  const listId = useId();
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allItems = useMemo(() => {
    const helpItems = [
      ...(onStartTour
        ? [
            {
              id: 'help:tour',
              group: 'Ajuda',
              label: 'Iniciar tutorial desta tela',
              subtitle: 'Guia interativo',
              icon: CircleHelp,
              keywords: 'tutorial guia tour ajuda como usar onboarding driver',
              run: () => onStartTour(),
            },
          ]
        : []),
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

    const themeItems = [
      {
        id: 'theme:light',
        group: 'Aparência',
        label: 'Usar tema claro',
        subtitle: 'Aparência',
        icon: Sun,
        keywords: 'tema claro light modo',
        run: () => setTheme('light'),
      },
      {
        id: 'theme:dark',
        group: 'Aparência',
        label: 'Usar tema escuro',
        subtitle: 'Aparência',
        icon: Moon,
        keywords: 'tema escuro dark modo',
        run: () => setTheme('dark'),
      },
      {
        id: 'theme:system',
        group: 'Aparência',
        label: 'Seguir tema do sistema',
        subtitle: 'Aparência',
        icon: Monitor,
        keywords: 'tema sistema automatico',
        run: () => setTheme('system'),
      },
    ];

    const navItems = commands.map((cmd) => ({
      ...cmd,
      run: () => navigate(cmd.path),
    }));

    return [...navItems, ...helpItems, ...themeItems];
  }, [commands, navigate, setTheme, onOpenHelp, onStartTour]);

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
        className="flex flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-popover p-0 shadow-2xl sm:max-w-xl"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Navegação rápida</DialogTitle>
          <DialogDescription>Pesquise páginas, módulos e ações usando o teclado.</DialogDescription>
        </DialogHeader>

        {/* Barra de busca limpa, sem anel de foco externo */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card/60 px-4 py-3.5">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Input
            ref={inputRef}
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
            className="h-6 flex-1 rounded-none border-0 bg-transparent px-0 py-0 text-sm font-medium shadow-none placeholder:font-normal placeholder:text-muted-foreground/70 hover:enabled:border-transparent focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
          />
          {query && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            aria-label="Fechar busca rápida"
            className="shrink-0 cursor-pointer rounded-md transition-opacity hover:opacity-80"
          >
            <KeyCap>Esc</KeyCap>
          </button>
        </div>

        {/* Lista de comandos */}
        <div
          id={listId}
          className="max-h-[22rem] overflow-y-auto scroll-py-2 p-2"
          role="listbox"
          aria-label="Comandos"
        >
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
              <span className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground">
                <Search className="size-4" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium text-foreground">
                Nenhum resultado para &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-muted-foreground">
                Tente buscar pelo nome de uma página, módulo ou tema.
              </p>
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="mt-1"
                onClick={() => {
                  setQuery('');
                  setSelectedIndex(0);
                  inputRef.current?.focus();
                }}
              >
                Limpar busca
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map(([groupName, items]) => (
                <div key={groupName} className="space-y-0.5">
                  <p className="px-2.5 pt-1 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
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
                          'relative flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                          active
                            ? 'bg-accent text-foreground before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-primary'
                            : 'text-muted-foreground hover:bg-accent/55 hover:text-foreground',
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          {Icon && (
                            <span
                              className={cn(
                                'inline-flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors',
                                active
                                  ? 'border-primary/25 bg-primary/10 text-primary'
                                  : 'border-border/70 bg-surface text-muted-foreground',
                              )}
                            >
                              <Icon className="size-3.5" aria-hidden="true" />
                            </span>
                          )}
                          <span className="flex min-w-0 items-baseline gap-2">
                            <span className="truncate font-medium text-foreground">
                              {item.label}
                            </span>
                            {item.subtitle && item.subtitle !== item.label && (
                              <span className="shrink-0 rounded-md bg-muted/70 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                                {item.subtitle}
                              </span>
                            )}
                          </span>
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
                            <CornerDownLeft
                              className="size-3.5 text-muted-foreground"
                              aria-hidden="true"
                            />
                          ) : (
                            <ArrowRight
                              className="size-3.5 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground"
                              aria-hidden="true"
                            />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé com legenda de teclado e acesso rápido aos atalhos */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-surface/80 px-4 py-2.5 text-[11px] text-muted-foreground">
          <span className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <KeyCap>↑</KeyCap>
              <KeyCap>↓</KeyCap>
              <span>navegar</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <KeyCap>↵</KeyCap>
              <span>abrir</span>
            </span>
          </span>
          <button
            type="button"
            onClick={() => {
              handleOpenChange(false);
              onOpenHelp();
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <KeyCap>?</KeyCap>
            <span>atalhos</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Modal de referência com todos os atalhos disponíveis para o perfil do usuário.
 */
export function ShortcutsHelpDialog({ open, onOpenChange, commands, onStartTour }) {
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

        {onStartTour && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/70 px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">Prefere um tour guiado?</p>
              <p className="text-[11px] text-muted-foreground">
                Veja passo a passo como usar os controles desta tela.
              </p>
            </div>
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onStartTour();
              }}
            >
              <CircleHelp className="size-3.5" aria-hidden="true" />
              Tutorial
            </Button>
          </div>
        )}

        <div className="grid gap-5 py-1">
          <section className="grid gap-2.5">
            <h3 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
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
            <section className="grid gap-2.5 border-t border-border pt-4">
              <h3 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
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
