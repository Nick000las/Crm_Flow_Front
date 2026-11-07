import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { temFeature } from '@/lib/acesso';
import { CHAVE_VALOR, CONTEXTO, CRM_FEATURES } from '../constants';
import { camposDoContexto } from '../lib/contextos';
import { filtroComValor } from '../lib/filtro';
import { filtroDaBusca } from '../lib/inatividade';
import { filtroComScore } from '../lib/score';

const CAMPOS_VAZIOS = [];

/**
 * O filtro que dá para pedir: um link ou uma view antiga pode citar o que este
 * tenant ou papel não tem (o back daria 403 ou 400). Vale na tabela e no quadro.
 *
 * @param {import('../lib/filtro').FiltroAplicado} filtro
 * @param {import('../types').Campo[] | undefined} campos todos os de `/fields`
 */
export function useFiltroPermitido(filtro, campos) {
  const { user } = useAuth();
  const comInatividade = temFeature(user, CRM_FEATURES.INATIVIDADE);
  const comScore = temFeature(user, CRM_FEATURES.SCORE);
  // Antes de `/fields` chegar, não se sabe: fica o que a URL pediu.
  const comValor = !campos || campos.some((campo) => campo.chave === CHAVE_VALOR);

  const permitido = useMemo(
    () => filtroComValor(filtroComScore(filtroDaBusca(filtro, comInatividade), comScore), comValor),
    [filtro, comInatividade, comScore, comValor],
  );
  // Valor é a faixa fixa do construtor: como campo, seria o mesmo filtro duas vezes.
  const camposDoFiltro = useMemo(
    () =>
      camposDoContexto(campos ?? CAMPOS_VAZIOS, CONTEXTO.FILTRO).filter(
        (campo) => campo.chave !== CHAVE_VALOR,
      ),
    [campos],
  );

  return { filtro: permitido, comValor, camposDoFiltro };
}
