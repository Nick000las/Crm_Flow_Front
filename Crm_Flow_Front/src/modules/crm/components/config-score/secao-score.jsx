import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { podeVer } from '@/lib/acesso';
import { isAccessError } from '@/services/api';
import { CHAVE_SCORE, PAPEIS_GESTAO } from '../../constants';
import { useCampos } from '../../hooks/use-campos';
import { useConfigScore, useRecalcularScore, useSalvarScore } from '../../hooks/use-score';
import { useUsuarios } from '../../hooks/use-usuarios';
import { chaveDaConfig, textoDoRecalculo } from '../../lib/score';
import { FormScore } from './form-score';

const PORCENTAGEM = 100;

function Carregando() {
  return (
    <div className="grid gap-2" aria-busy="true">
      <span className="sr-only" role="status">
        Carregando pontuação…
      </span>
      {Array.from({ length: 4 }, (_, indice) => (
        <Skeleton className="h-14 rounded-none" key={indice} />
      ))}
    </div>
  );
}

/** Barra do recálculo em andamento e a data do último (`role="status"`). */
function Recalculo({ recalculo }) {
  const texto = textoDoRecalculo(recalculo);
  if (!texto) {
    return null;
  }
  const emAndamento = Boolean(recalculo?.emAndamento);
  const parte =
    recalculo.total > 0 ? Math.round((recalculo.processados / recalculo.total) * PORCENTAGEM) : 0;

  return (
    <div className="grid gap-1.5">
      <p className="text-xs text-muted-foreground" role="status">
        {texto}
      </p>
      {emAndamento && (
        <div
          aria-label="Progresso do recálculo"
          aria-valuemax={PORCENTAGEM}
          aria-valuemin={0}
          aria-valuenow={parte}
          className="h-1 w-full max-w-md bg-muted"
          role="progressbar"
        >
          <div
            className="h-full bg-primary transition-[width] duration-200"
            style={{ width: `${parte}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Configurações › Pontuação (`crm.score`): regras que somam pontos e as
 * faixas que dão nome e cor ao score. Todos leem; só DONO/MASTER alteram.
 * Salvar e "Recalcular agora" só respondem no fim do recálculo — enquanto
 * isso, a configuração recarrega a cada segundo com o progresso.
 */
export function SecaoScore() {
  const { user } = useAuth();
  const podeEditar = podeVer({ roles: PAPEIS_GESTAO }, user);
  const salvar = useSalvarScore();
  const recalcular = useRecalcularScore();
  const trabalhando = salvar.isPending || recalcular.isPending;
  const scoreQuery = useConfigScore({ acompanhar: trabalhando });
  const camposQuery = useCampos();
  const { nomePorId } = useUsuarios();
  const [aviso, setAviso] = useState(null);
  const erro = scoreQuery.error ?? camposQuery.error;

  if (isAccessError(erro)) {
    return <AcessoIndisponivel error={erro} />;
  }
  if (erro) {
    return <ApiErrorAlert error={erro} id="score-carregar-erro" />;
  }
  if (scoreQuery.isPending || camposQuery.isPending) {
    return <Carregando />;
  }

  const config = scoreQuery.data;
  // As condições usam os campos com id; o score não pode depender dele mesmo (o back dá 400).
  const campos = camposQuery.data.filter((campo) => campo.id && campo.chave !== CHAVE_SCORE);
  const ocupado = trabalhando || Boolean(config.recalculo?.emAndamento);

  return (
    <div className="grid gap-4">
      <div className="grid max-w-2xl gap-1 text-sm text-muted-foreground">
        <p>
          Cada regra soma (ou tira) pontos do lead que cumpre as condições. O Lead score é calculado
          sozinho e fica só de leitura no formulário.
        </p>
        {!podeEditar && <p>Só DONO e MASTER alteram a pontuação.</p>}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <Recalculo recalculo={config.recalculo} />
        {podeEditar && (
          <Button
            aria-busy={recalcular.isPending}
            disabled={ocupado}
            onClick={() => {
              setAviso(null);
              recalcular.mutate(undefined, { onSuccess: () => setAviso('Pontuação recalculada.') });
            }}
            size="sm"
            variant="outline"
          >
            <RefreshCw aria-hidden="true" />
            {recalcular.isPending ? 'Recalculando…' : 'Recalcular agora'}
          </Button>
        )}
      </div>
      <ApiErrorAlert
        error={recalcular.error}
        id="score-recalcular-erro"
        title="Não foi possível recalcular"
      />

      <p className={aviso ? 'border border-border px-3 py-2 text-sm' : 'sr-only'} role="status">
        {aviso}
      </p>

      <FormScore
        campos={campos}
        config={config}
        key={chaveDaConfig(config)}
        nomePorId={nomePorId}
        ocupado={ocupado}
        onSalvo={setAviso}
        podeEditar={podeEditar}
        salvar={salvar}
      />
    </div>
  );
}
