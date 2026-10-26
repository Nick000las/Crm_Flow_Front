import { ROTULOS_OPERADOR, operadoresDoCampo, trocarOperador } from '../lib/filtro';
import { condicaoDoCampo } from '../lib/regras';
import { CampoForm } from './campo-form';
import { SelectSimples } from './select-simples';
import { ValorDoFiltro } from './valor-do-filtro';

/**
 * Uma condição "campo → operador → valor" no formato do construtor de filtro
 * (`valor` como o `ValorDoFiltro` edita). Usada pela regra de campo (M8) e
 * pelas regras de distribuição (M12). Trocar o campo zera operador e valor.
 *
 * @param {{
 *   idBase: string,
 *   condicao: { campoId: string, operador: string, valor: unknown },
 *   campos: import('../types').Campo[],
 *   onChange: (condicao: { campoId: string, operador: string, valor: unknown }) => void,
 *   erros?: { campo?: string | null, operador?: string | null, valor?: string | null },
 *   rotuloCampo?: string,
 * }} props `campos`: só os que podem entrar na condição
 */
export function CondicaoDeCampo({ idBase, condicao, campos, onChange, erros = {}, rotuloCampo = 'Quando o campo' }) {
  const campo = campos.find((atual) => atual.id === condicao.campoId);
  const opcoesCampo = campos.map((atual) => ({ valor: atual.id, rotulo: atual.label }));
  const opcoesOperador = campo
    ? operadoresDoCampo(campo).map((operador) => ({ valor: operador, rotulo: ROTULOS_OPERADOR[operador] }))
    : [];

  return (
    <>
      <CampoForm erro={erros.campo} id={`${idBase}-campo`} label={rotuloCampo} obrigatorio>
        {(controle) => (
          <SelectSimples
            {...controle}
            onChange={(id) => onChange(condicaoDoCampo(campos.find((atual) => atual.id === id)))}
            opcoes={opcoesCampo}
            value={condicao.campoId}
          />
        )}
      </CampoForm>
      {campo && (
        <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <CampoForm erro={erros.operador} id={`${idBase}-operador`} label="Operador">
            {(controle) => (
              <SelectSimples
                {...controle}
                onChange={(operador) => onChange(trocarOperador(condicao, operador, campo))}
                opcoes={opcoesOperador}
                value={condicao.operador}
              />
            )}
          </CampoForm>
          <CampoForm erro={erros.valor} id={`${idBase}-valor`} label="Valor">
            {(controle) => (
              <ValorDoFiltro
                campo={campo}
                controle={controle}
                onChange={(valor) => onChange({ ...condicao, valor })}
                operador={condicao.operador}
                rotulo={campo.label}
                value={condicao.valor}
              />
            )}
          </CampoForm>
        </div>
      )}
    </>
  );
}
