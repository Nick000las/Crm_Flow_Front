import { LoadingState } from '@/components/loading-state';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { isAccessError, toApiError } from '@/services/api';
import { useCampos } from '../../hooks/use-campos';
import {
  useCamposElegiveis,
  useFormulario,
  usePublicarFormulario,
  useSalvarFormulario,
} from '../../hooks/use-formularios';
import { useUsuarios } from '../../hooks/use-usuarios';
import { errosDoFormulario } from '../../lib/formularios';
import { EditorFormulario } from './editor-formulario';

const STATUS_NAO_ENCONTRADO = 404;

function Carregando() {
  return (
    <div className="grid gap-3" aria-busy="true">
      <LoadingState label="Carregando formulário…" />
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-40" />
      <Skeleton className="h-64" />
    </div>
  );
}

/**
 * Carrega o formulário e grava. As mutações moram aqui, e não no editor: salvar
 * remonta o editor com a resposta, e o "Salvar e publicar" continua depois.
 *
 * @param {{ id: string, onVoltar: () => void, onAviso: (texto: string | null) => void }} props
 */
export function FormularioAberto({ id, onVoltar, onAviso }) {
  const formularioQuery = useFormulario(id);
  const elegiveisQuery = useCamposElegiveis();
  // O schema: os alertas (FM5) usam o tipo e as opções do campo.
  const camposQuery = useCampos();
  const { nomePorId } = useUsuarios();
  const salvar = useSalvarFormulario(id);
  const publicar = usePublicarFormulario(id);
  const [falha, setFalha] = useState(null);

  /**
   * @param {{
   *   corpo: object | null,
   *   rascunho: import('../../lib/formularios').RascunhoNoForm,
   *   publicarDepois: boolean,
   * }} pedido `corpo: null` = nada a salvar antes
   */
  async function gravar({ corpo, rascunho, publicarDepois }) {
    setFalha(null);
    onAviso(null);
    try {
      if (corpo) {
        await salvar.mutateAsync(corpo);
      }
      if (publicarDepois) {
        const versao = await publicar.mutateAsync();
        onAviso(`Versão ${versao.versao} publicada.`);
      } else {
        onAviso('Formulário salvo.');
      }
    } catch (error) {
      setFalha({
        error,
        publicando: publicarDepois,
        erros: errosDoFormulario(toApiError(error).fields, rascunho),
      });
    }
  }

  const erro = formularioQuery.error ?? elegiveisQuery.error ?? camposQuery.error;
  if (isAccessError(erro)) {
    return <AcessoIndisponivel error={erro} />;
  }
  if (formularioQuery.error?.status === STATUS_NAO_ENCONTRADO) {
    return (
      <EmptyState
        description="Ele pode ter sido apagado, ou o link está errado."
        icon={ClipboardList}
        title="Formulário não encontrado"
      >
        <Button onClick={onVoltar} type="button" variant="outline">
          <ArrowLeft aria-hidden="true" />
          Voltar aos formulários
        </Button>
      </EmptyState>
    );
  }
  if (erro) {
    return <ApiErrorAlert error={erro} id="config-formulario-carregar-erro" />;
  }
  if (formularioQuery.isPending || elegiveisQuery.isPending || camposQuery.isPending) {
    return <Carregando />;
  }

  return (
    <EditorFormulario
      campos={camposQuery.data}
      detalhe={formularioQuery.data}
      elegiveis={elegiveisQuery.data}
      falha={falha}
      // Salvar devolve o detalhe novo: o editor recomeça dele.
      key={formularioQuery.data.atualizadoEm}
      nomePorId={nomePorId}
      ocupado={salvar.isPending || publicar.isPending}
      onGravar={gravar}
      onMudou={() => setFalha(null)}
      onVoltar={onVoltar}
    />
  );
}
