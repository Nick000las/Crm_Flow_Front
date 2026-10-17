import { AVISOS_LEAD } from '../constants';
import { avisoDaRestauracao } from '../lib/arquivo';
import { useArquivarLead, useDesarquivarLead, useRestaurarLead } from './use-lead-mutations';

/**
 * Arquivar, desarquivar e restaurar pela linha da tabela. Sem confirmação
 * (tudo se desfaz); o sucesso vira aviso da lista e o erro, um alerta só.
 *
 * @param {(aviso: string) => void} onAviso
 */
export function useAcoesDeArquivo(onAviso) {
  const arquivar = useArquivarLead();
  const desarquivar = useDesarquivarLead();
  const restaurar = useRestaurarLead();
  const mutacoes = [arquivar, desarquivar, restaurar];

  function executar(mutacao, lead, aviso) {
    mutacoes.forEach((outra) => outra !== mutacao && outra.reset());
    mutacao.mutate(lead.id, { onSuccess: (resposta) => onAviso(aviso(resposta)) });
  }

  return {
    acoes: {
      onArquivar: (lead) => executar(arquivar, lead, () => AVISOS_LEAD.ARQUIVADO),
      onDesarquivar: (lead) => executar(desarquivar, lead, () => AVISOS_LEAD.DESARQUIVADO),
      onRestaurar: (lead) => executar(restaurar, lead, avisoDaRestauracao),
      restaurandoId: restaurar.isPending ? restaurar.variables : null,
    },
    erro: arquivar.error ?? desarquivar.error ?? restaurar.error,
    limparErro: () => mutacoes.forEach((mutacao) => mutacao.reset()),
  };
}
