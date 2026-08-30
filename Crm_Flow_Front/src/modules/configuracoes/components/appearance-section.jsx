import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import { isComposingKeyEvent } from '@/lib/keyboard-shortcuts';

const OPCOES = [
  {
    value: 'light',
    label: 'Claro',
    description: 'Superfícies claras para ambientes iluminados.',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Escuro',
    description: 'Baixo brilho para longas jornadas de operação.',
    icon: Moon,
  },
  {
    value: 'system',
    label: 'Sistema',
    description: 'Acompanha automaticamente o sistema operacional.',
    icon: Monitor,
  },
];

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aparência</CardTitle>
        <CardDescription>
          Escolha entre modo claro, modo escuro ou seguir a preferência do seu dispositivo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div role="radiogroup" aria-label="Tema da interface" className="grid gap-3 sm:grid-cols-3">
          {OPCOES.map(({ value, label, description, icon: Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                onClick={() => setTheme(value)}
                onKeyDown={(event) => {
                  if (
                    isComposingKeyEvent(event) ||
                    event.ctrlKey ||
                    event.metaKey ||
                    event.altKey
                  ) {
                    return;
                  }
                  const direction = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[
                    event.key
                  ];
                  if (!direction) {
                    return;
                  }
                  event.preventDefault();
                  const index = OPCOES.findIndex((option) => option.value === value);
                  const next = (index + direction + OPCOES.length) % OPCOES.length;
                  setTheme(OPCOES[next].value);
                  event.currentTarget.parentElement
                    .querySelectorAll('[role="radio"]')
                    [next]?.focus();
                }}
                className={cn(
                  'relative flex cursor-pointer flex-col items-start gap-2 rounded-xl border p-4 text-left outline-none transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/40',
                  active
                    ? 'border-primary bg-primary/[0.05] text-foreground'
                    : 'border-border bg-surface/50 text-foreground hover:border-border-strong hover:bg-accent/60',
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span
                    className={cn(
                      'grid size-8 place-items-center rounded-lg border',
                      active
                        ? 'border-primary/30 bg-primary/12 text-primary'
                        : 'border-border bg-card text-muted-foreground',
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  {active && (
                    <span
                      className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground"
                      aria-hidden="true"
                    >
                      <Check className="size-3" />
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
