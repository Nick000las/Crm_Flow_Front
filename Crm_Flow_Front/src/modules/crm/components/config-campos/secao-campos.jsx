import { Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { isAccessError } from '@/services/api';
import { CAMADA } from '../../constants';
import { useCamposConfigurados, useReordenarCampos } from '../../hooks/use-configuracoes-campos';
import { proximaOrdem } from '../../lib/campos-config';
import { DefinicaoDialog } from '../definicao-dialog';
import { ExcluirDefinicaoDialog } from '../excluir-definicao-dialog';
import { ListaCampos } from './lista-campos';
import { RenomearCampoDialog } from './renomear-campo-dialog';
import { RestaurarOrdemDialog } from './restaurar-ordem-dialog';

const LINHAS_SKELETON = 8;

function Carregando() {
  return (
    <div className="grid gap-2" aria-busy="true">
      <span className="sr-only" role="status">
        Carregando campos…
      </span>
      {Array.from({ length: LINHAS_SKELETON }, (_, indice) => (
        <Skeleton className="h-11 rounded-none" key={indice} />
      ))}
    </div>
  );
}

/**
 * Configurações › Campos: em que telas cada campo aparece, obrigatoriedade,
 * nome e ordem — sistema e personalizados numa lista só, na ordem do form.
 * Criar/editar/excluir personalizado reaproveita os dialogs da Camada 3.
 */
export function SecaoCampos() {
  const camposQuery = useCamposConfigurados();
  const reordenar = useReordenarCampos();
  // `undefined` = fechado; `null` = criando; objeto = editando.
  const [personalizadoEmEdicao, setPersonalizadoEmEdicao] = useState(undefined);
  const [aRenomear, setARenomear] = useState(null);
  const [aExcluir, setAExcluir] = useState(null);
  const [restaurando, setRestaurando] = useState(false);
  const [aviso, setAviso] = useState(null);

  if (isAccessError(camposQuery.error)) {
    return <AcessoIndisponivel error={camposQuery.error} />;
  }
  if (camposQuery.error) {
    return <ApiErrorAlert error={camposQuery.error} id="config-campos-carregar-erro" />;
  }
  if (camposQuery.isPending) {
    return <Carregando />;
  }

  const campos = camposQuery.data;

  function abrir(acao) {
    setAviso(null);
    reordenar.reset();
    acao();
  }

  function editar(campo) {
    abrir(() =>
      campo.camada === CAMADA.CAMADA_3 ? setPersonalizadoEmEdicao(campo) : setARenomear(campo),
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Escolha em que telas cada campo aparece e a ordem dele no formulário. Desligar uma tela
          não apaga os dados já preenchidos.
        </p>
        <div className="flex gap-2">
          <Button onClick={() => abrir(() => setRestaurando(true))} variant="outline">
            <RotateCcw aria-hidden="true" />
            Voltar ao padrão
          </Button>
          <Button onClick={() => abrir(() => setPersonalizadoEmEdicao(null))}>
            <Plus aria-hidden="true" />
            Novo campo
          </Button>
        </div>
      </div>

      <p className={aviso ? 'border border-border px-3 py-2 text-sm' : 'sr-only'} role="status">
        {aviso}
      </p>
      <ApiErrorAlert
        error={reordenar.error}
        id="config-campos-ordem-erro"
        title="Não foi possível salvar a ordem. A lista voltou ao que era."
      />

      <ListaCampos
        campos={campos}
        onEditar={editar}
        onExcluir={(campo) => abrir(() => setAExcluir(campo))}
        onReordenar={(ids) => reordenar.mutate(ids)}
        ordemOcupada={reordenar.isPending}
      />

      <DefinicaoDialog
        definicao={personalizadoEmEdicao}
        onOpenChange={(aberto) => !aberto && setPersonalizadoEmEdicao(undefined)}
        onSalvo={() => setAviso(personalizadoEmEdicao ? 'Campo atualizado.' : 'Campo criado.')}
        open={personalizadoEmEdicao !== undefined}
        proximaOrdem={proximaOrdem(campos)}
      />
      <RenomearCampoDialog
        campo={aRenomear}
        onOpenChange={(aberto) => !aberto && setARenomear(null)}
        onSalvo={(atualizado) =>
          atualizado && setAviso(`Campo renomeado para "${atualizado.label}".`)
        }
      />
      <ExcluirDefinicaoDialog
        definicao={aExcluir}
        onExcluido={setAviso}
        onOpenChange={(aberto) => !aberto && setAExcluir(null)}
      />
      <RestaurarOrdemDialog
        onOpenChange={setRestaurando}
        onRestaurado={() => setAviso('Ordem padrão restaurada.')}
        open={restaurando}
      />
    </div>
  );
}
