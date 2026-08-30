import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { candidatosDoErro, descreverCandidato, ehBloqueio } from '../lib/duplicidade';

const TEXTO = Object.freeze({
  aviso: {
    titulo: 'Já existe um lead parecido',
    descricao: 'Confira se não é o mesmo contato. Dá para salvar mesmo assim.',
  },
  bloqueio: {
    titulo: 'Já existe um lead com esses dados',
    descricao: 'As regras de duplicidade da empresa não deixam salvar. Abra o lead que já existe.',
  },
});

/**
 * 409 de duplicidade ao salvar: os parecidos, com "Abrir" em cada um. No
 * aviso há "Salvar mesmo assim" (reenvia com `ignorarDuplicados`); no
 * bloqueio, não.
 *
 * @param {{
 *   erro: import('@/services/api-error').ApiError | null,
 *   salvando: boolean,
 *   onFechar: () => void,
 *   onSalvarMesmoAssim: () => void,
 *   onAbrirLead: (id: string) => void,
 * }} props aberto enquanto houver `erro`
 */
export function DuplicadosDialog({ erro, salvando, onFechar, onSalvarMesmoAssim, onAbrirLead }) {
  const bloqueio = ehBloqueio(erro);
  const { titulo, descricao } = bloqueio ? TEXTO.bloqueio : TEXTO.aviso;
  const candidatos = candidatosDoErro(erro);

  return (
    <AlertDialog onOpenChange={(aberto) => !aberto && !salvando && onFechar()} open={Boolean(erro)}>
      <AlertDialogContent className="rounded-none">
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </AlertDialogHeader>

        {candidatos.length > 0 && (
          <ul className="border border-border">
            {candidatos.map((candidato) => (
              <li
                className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 last:border-b-0"
                key={candidato.id}
              >
                <div className="grid min-w-0 text-sm">
                  <span className="truncate font-medium">{candidato.nome}</span>
                  <span className="text-xs text-muted-foreground">
                    {descreverCandidato(candidato)}
                  </span>
                </div>
                <Button
                  aria-label={`Abrir ${candidato.nome}`}
                  disabled={salvando}
                  onClick={() => onAbrirLead(candidato.id)}
                  size="sm"
                  variant="outline"
                >
                  {bloqueio ? 'Abrir o existente' : 'Abrir'}
                </Button>
              </li>
            ))}
          </ul>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={salvando}>Voltar ao formulário</AlertDialogCancel>
          {!bloqueio && (
            <Button aria-busy={salvando} disabled={salvando} onClick={onSalvarMesmoAssim}>
              {salvando ? 'Salvando…' : 'Salvar mesmo assim'}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
