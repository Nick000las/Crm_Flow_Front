import { useState } from 'react';
import { toApiError } from '@/services/api';
import { AVISOS_LEAD } from '../constants';
import { avisoDaRestauracao } from '../lib/arquivo';
import { useArquivarLead, useDesarquivarLead, useRestaurarLead } from './use-lead-mutations';

/**
 * Arquivar, desarquivar e restaurar pela linha da tabela. Sem confirmação
 * (tudo se desfaz); o sucesso vira aviso da lista e o erro, um alerta só.
 * Com `confirmarArquivo` (`crm.formularios`, FM6), arquivar pede confirmação
 * antes: os links de formulário ativos são cancelados e não voltam.
 *
 * @param {(aviso: string) => void} onAviso
 * @param {{ confirmarArquivo?: boolean }} [opcoes]
 */
export function useAcoesDeArquivo(onAviso, { confirmarArquivo = false } = {}) {
  const arquivar = useArquivarLead();
  const desarquivar = useDesarquivarLead();
  const restaurar = useRestaurarLead();
  const mutacoes = [arquivar, desarquivar, restaurar];
  const [aConfirmar, setAConfirmar] = useState(null);

  function limparErro() {
    mutacoes.forEach((mutacao) => mutacao.reset());
  }

  function executar(mutacao, lead, aviso) {
    mutacoes.forEach((outra) => outra !== mutacao && outra.reset());
    mutacao.mutate(lead.id, { onSuccess: (resposta) => onAviso(aviso(resposta)) });
  }

  return {
    acoes: {
      onArquivar: (lead) =>
        confirmarArquivo
          ? setAConfirmar(lead)
          : executar(arquivar, lead, () => AVISOS_LEAD.ARQUIVADO),
      onDesarquivar: (lead) => executar(desarquivar, lead, () => AVISOS_LEAD.DESARQUIVADO),
      onRestaurar: (lead) => executar(restaurar, lead, avisoDaRestauracao),
      restaurandoId: restaurar.isPending ? restaurar.variables : null,
    },
    /** O lead esperando a confirmação de arquivar, ou `null`. */
    aConfirmar,
    /** Arquiva o lead confirmado; o erro vai para o dialog (que fica aberto). */
    async confirmarArquivo() {
      limparErro();
      try {
        await arquivar.mutateAsync(aConfirmar.id);
      } catch (error) {
        // O erro aparece no dialog, não também no alerta da lista.
        arquivar.reset();
        throw new Error(toApiError(error).message, { cause: error });
      }
      onAviso(AVISOS_LEAD.ARQUIVADO);
    },
    cancelarArquivo: () => setAConfirmar(null),
    erro: arquivar.error ?? desarquivar.error ?? restaurar.error,
    limparErro,
  };
}
