import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  findChordDestination,
  hasOpenOverlay,
  isEditableTarget,
  isComposingKeyEvent,
} from '@/lib/keyboard-shortcuts';
import { isPageActive } from '@/lib/modules-registry';

const CHORD_TIMEOUT_MS = 900;

/**
 * Registra atalhos globais de navegação do AppShell:
 * - `⌘K` / `Ctrl+K`: abre ou fecha a paleta de comandos
 * - `?`: abre a referência de atalhos de teclado
 * - `/`: foca o campo de busca principal da tela atual
 * - `G` + `D`/`C`/`K`/`S`: navega para Dashboard, CRM, Kanban ou Configurações
 * - `Alt+↑` / `Alt+↓`: alterna entre as páginas do módulo ativo
 */
export function useGlobalShortcuts({ commands, activeModule, onTogglePalette, onOpenHelp }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const chordPrefixRef = useRef(null);
  const chordTimerRef = useRef(null);

  useEffect(() => {
    function clearChord() {
      chordPrefixRef.current = null;
      if (chordTimerRef.current) {
        window.clearTimeout(chordTimerRef.current);
        chordTimerRef.current = null;
      }
    }

    function handleKeyDown(event) {
      if (event.defaultPrevented || event.repeat || isComposingKeyEvent(event)) {
        return;
      }
      const key = event.key.toLowerCase();
      const togglesPalette = (event.metaKey || event.ctrlKey) && !event.altKey && key === 'k';
      if (!togglesPalette && isEditableTarget(event.target)) {
        clearChord();
        return;
      }
      const overlayOpen = hasOpenOverlay();

      // ⌘K / Ctrl+K funciona em qualquer contexto do shell
      if (togglesPalette) {
        if (overlayOpen && !document.querySelector('[data-command-palette]')) {
          return;
        }
        event.preventDefault();
        clearChord();
        onTogglePalette();
        return;
      }

      // Ignora atalhos simples quando o foco está em campo editável ou modal aberto
      if (overlayOpen) {
        clearChord();
        return;
      }

      // Alt + ↑ / ↓ alterna páginas do módulo ativo
      if (
        event.altKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        (event.key === 'ArrowDown' || event.key === 'ArrowUp') &&
        activeModule?.pages?.length > 1
      ) {
        event.preventDefault();
        clearChord();
        const pages = activeModule.pages;
        const currentIndex = pages.findIndex((page) => isPageActive(page, pathname));
        const safeIndex = currentIndex === -1 ? 0 : currentIndex;
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        const nextIndex = (safeIndex + delta + pages.length) % pages.length;
        navigate(pages[nextIndex].path);
        return;
      }

      // Ignora combinações com modificadores abaixo (exceto Shift para `?`)
      if (event.metaKey || event.ctrlKey || event.altKey) {
        clearChord();
        return;
      }

      // `?` abre ajuda de atalhos
      if (event.key === '?') {
        event.preventDefault();
        clearChord();
        onOpenHelp();
        return;
      }

      // `/` foca o campo de busca principal da tela
      if (event.key === '/') {
        const searchInput = document.querySelector(
          'main input[type="search"], main input[data-search-input], main input[placeholder*="Buscar" i]',
        );
        if (searchInput && typeof searchInput.focus === 'function') {
          event.preventDefault();
          clearChord();
          searchInput.focus();
          searchInput.select?.();
        }
        return;
      }

      // Sequência `G` + destino (estilo Linear/GitHub)
      if (chordPrefixRef.current === 'g') {
        const destination = findChordDestination(commands, key);
        clearChord();
        if (destination) {
          event.preventDefault();
          navigate(destination);
        }
        return;
      }

      if (key === 'g' && !event.shiftKey) {
        chordPrefixRef.current = 'g';
        chordTimerRef.current = window.setTimeout(clearChord, CHORD_TIMEOUT_MS);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearChord();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [commands, activeModule, pathname, navigate, onTogglePalette, onOpenHelp]);
}
