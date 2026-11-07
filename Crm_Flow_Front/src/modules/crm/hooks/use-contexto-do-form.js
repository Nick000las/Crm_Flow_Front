import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { temFeature } from '@/lib/acesso';
import { CAMPOS_LGPD, CONTEXTO, CRM_FEATURES } from '../constants';
import { camposDoContexto } from '../lib/contextos';
import { marcarCalculados, marcarSemAcessoComercial, valoresIniciais } from '../lib/form-lead';
import { avaliarNoForm } from '../lib/regras';
import { useCampos } from './use-campos';
import { useDistribuicaoLigada } from './use-distribuicao';
import { useConfigLgpd } from './use-lgpd';
import { useRegrasDoForm } from './use-regras';

const CAMPOS_VAZIOS = [];

/**
 * Tudo de que o `LeadForm` depende, no Sheet e no "Adicionar" do quadro.
 *
 * @param {{ criando: boolean, lead?: import('../types').Lead }} props
 */
export function useContextoDoForm({ criando, lead }) {
  const { user } = useAuth();
  const camposQuery = useCampos();
  const regras = useRegrasDoForm();
  const distribuicaoLigada = useDistribuicaoLigada();
  const lgpdQuery = useConfigLgpd();
  const comLgpd = temFeature(user, CRM_FEATURES.LGPD);
  // Com `crm.score`, o Lead score é calculado: travado no form e fora do payload.
  const comScore = temFeature(user, CRM_FEATURES.SCORE);
  // Criar mostra os campos de "Criação"; ver e editar, os de "Ficha".
  const contexto = criando ? CONTEXTO.CRIACAO : CONTEXTO.FICHA;

  const campos = useMemo(
    () =>
      marcarSemAcessoComercial(
        marcarCalculados(camposDoContexto(camposQuery.data ?? CAMPOS_VAZIOS, contexto), comScore),
        lead,
      ),
    [camposQuery.data, contexto, comScore, lead],
  );
  // LGPD: na criação, a base legal padrão do tenant já vem escolhida.
  const basePadrao = criando ? (lgpdQuery.data?.basePadrao ?? null) : null;
  const iniciais = useMemo(
    () =>
      valoresIniciais(
        campos,
        lead,
        basePadrao ? { [CAMPOS_LGPD.BASE_LEGAL]: basePadrao } : undefined,
      ),
    [campos, lead, basePadrao],
  );
  // Regras de campo: com todos os campos de `/fields`, porque a condição pode
  // estar num campo fora do contexto do form. Sem a flag, `undefined`.
  const todosCampos = camposQuery.data ?? CAMPOS_VAZIOS;
  const avaliarRegras = regras
    ? (valores) => avaliarNoForm(regras, todosCampos, criando ? undefined : lead, campos, valores)
    : undefined;

  return {
    camposQuery,
    campos,
    iniciais,
    avaliarRegras,
    comLgpd,
    distribuicaoLigada,
    // Criando com `crm.lgpd`: espera a configuração, para a base padrão entrar no form.
    esperando: camposQuery.isPending || (criando && comLgpd && lgpdQuery.isPending),
  };
}
