import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isComposingKeyEvent } from '@/lib/keyboard-shortcuts';
import { useLayoutEffect, useRef } from 'react';

/**
 * Lista editável das opções de um campo de seleção: uma linha por opção,
 * com adicionar e remover. Sempre sobra ao menos uma linha.
 *
 * @param {{
 *   opcoes: string[],
 *   onChange: (opcoes: string[]) => void,
 *   erro?: string | null,
 *   erroId: string,
 * }} props
 */
export function OpcoesEditor({ opcoes, onChange, erro, erroId }) {
  const listRef = useRef(null);
  const pendingFocus = useRef(null);
  useLayoutEffect(() => {
    if (pendingFocus.current !== null) {
      listRef.current?.querySelectorAll('input')[pendingFocus.current]?.focus();
      pendingFocus.current = null;
    }
  });
  function focusOption(index) {
    const input = listRef.current?.querySelectorAll('input')[index];
    if (input) {
      input.focus();
    } else {
      pendingFocus.current = index;
    }
  }

  const alterar = (indice, texto) =>
    onChange(opcoes.map((opcao, atual) => (atual === indice ? texto : opcao)));
  const remover = (indice) => {
    const restantes = opcoes.filter((_, atual) => atual !== indice);
    onChange(restantes.length > 0 ? restantes : ['']);
    focusOption(Math.min(indice, Math.max(restantes.length - 1, 0)));
  };

  return (
    <fieldset className="grid gap-2" aria-describedby={erro ? erroId : undefined}>
      <legend className="mb-1.5 text-sm font-medium">
        Opções
        <span className="text-destructive" aria-hidden="true">
          *
        </span>
        <span className="sr-only">(obrigatório)</span>
      </legend>

      <ol ref={listRef} className="grid gap-1.5">
        {opcoes.map((opcao, indice) => (
          // Índice como key: as linhas não têm id próprio e só mudam pelo próprio editor.
          <li className="flex items-center gap-1.5" key={indice}>
            <span className="w-5 text-right text-[11px] text-muted-foreground tabular-nums">
              {indice + 1}
            </span>
            <Input
              aria-invalid={erro ? true : undefined}
              aria-label={`Opção ${indice + 1}`}
              className="h-9"
              onChange={(event) => alterar(indice, event.target.value)}
              onKeyDown={(event) => {
                // Enter na última opção já abre a próxima.
                if (
                  event.key === 'Enter' &&
                  !isComposingKeyEvent(event) &&
                  !event.repeat &&
                  !event.ctrlKey &&
                  !event.metaKey &&
                  !event.altKey
                ) {
                  event.preventDefault();
                  if (indice === opcoes.length - 1 && opcao.trim()) {
                    onChange([...opcoes, '']);
                    focusOption(indice + 1);
                  }
                }
              }}
              value={opcao}
            />
            <Button
              aria-label={`Remover opção ${indice + 1}`}
              onClick={() => remover(indice)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ol>

      <Button
        className="w-fit"
        onClick={() => {
          onChange([...opcoes, '']);
          focusOption(opcoes.length);
        }}
        size="sm"
        type="button"
        variant="outline"
      >
        <Plus aria-hidden="true" />
        Adicionar opção
      </Button>

      {erro && (
        <p className="text-xs text-destructive" id={erroId}>
          {erro}
        </p>
      )}
    </fieldset>
  );
}
