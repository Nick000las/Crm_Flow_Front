import { X } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

const TECLAS_ADICIONAR = new Set(['Enter', ',']);

/**
 * Seleção múltipla sem opções fixas (caso de `tags`): Enter adiciona, ✕
 * remove, Backspace no campo vazio remove a última.
 *
 * @param {{
 *   value: string[],
 *   onChange: (tags: string[]) => void,
 *   id: string,
 * } & Record<string, unknown>} props demais props vão para o `Input`
 */
export function TagsInput({ value, onChange, id, ...controle }) {
  const [texto, setTexto] = useState('');

  function adicionar() {
    const tag = texto.trim();
    setTexto('');
    if (tag && !value.includes(tag)) onChange([...value, tag]);
  }

  function handleKeyDown(event) {
    if (TECLAS_ADICIONAR.has(event.key)) {
      event.preventDefault();
      adicionar();
    } else if (event.key === 'Backspace' && texto === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="grid gap-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1" aria-label="Itens adicionados">
          {value.map((tag) => (
            <li
              className="inline-flex items-center gap-1 border border-border px-1.5 py-0.5 text-xs"
              key={tag}
            >
              {tag}
              <button
                aria-label={`Remover ${tag}`}
                className="text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                onClick={() => onChange(value.filter((atual) => atual !== tag))}
                type="button"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Input
        {...controle}
        className="h-9 rounded-none"
        id={id}
        onBlur={adicionar}
        onChange={(event) => setTexto(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Digite e tecle Enter"
        value={texto}
      />
    </div>
  );
}
