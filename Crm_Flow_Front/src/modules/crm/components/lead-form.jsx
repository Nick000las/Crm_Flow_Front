import { useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { semChave } from '@/lib/objetos';
import { isAbortError, toApiError } from '@/services/api';
import {
  CAMPO_VALOR,
  CHAVE_RESPONSAVEL,
  errosDoServidor,
  idNoForm,
  validarNoCliente,
} from '../lib/form-lead';
import { CampoDinamico } from './campo-dinamico';
import { CampoResponsavel } from './campo-responsavel';

const PREFIXO_ID = 'lead-form-';
const ERRO_GERAL_ID = 'lead-form-erro';

const htmlId = (idCampo) => `${PREFIXO_ID}${idCampo.replaceAll('.', '-')}`;

/** O que muda entre criar e editar — além disso o form é o mesmo. */
const POR_MODO = Object.freeze({
  criar: {
    rotuloEnviar: 'Criar lead',
    // Sem escolha, o back atribui o lead a quem está criando.
    responsavelVazio: 'Eu (quem está criando)',
  },
  editar: {
    rotuloEnviar: 'Salvar alterações',
    responsavelVazio: 'Sem responsável',
  },
});

/**
 * Formulário dinâmico do lead: itera `/crm/leads/fields` sem saber a camada
 * de cada campo. Valida só para UX; o back é quem valida de verdade, e seus
 * erros de campo voltam inline. O payload não é decidido aqui: `onSalvar`
 * recebe os valores e quem chama monta criação ou diff.
 *
 * @param {{
 *   campos: import('../types').Campo[],
 *   iniciais: Record<string, unknown>,
 *   modo: keyof typeof POR_MODO,
 *   usuarios: { id: string, nome: string }[],
 *   enviando: boolean,
 *   onSalvar: (valores: Record<string, unknown>) => Promise<unknown>,
 *   onCancelar: () => void,
 * }} props
 */
export function LeadForm({
  campos,
  iniciais,
  modo,
  usuarios,
  enviando,
  onSalvar,
  onCancelar,
}) {
  const { rotuloEnviar, responsavelVazio } = POR_MODO[modo];
  const [valores, setValores] = useState(iniciais);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState(null);

  function alterar(id, valor) {
    setValores((atuais) => ({ ...atuais, [id]: valor }));
    // Mexer no campo dispensa o erro dele; os outros continuam visíveis.
    setErros((atuais) => semChave(atuais, id));
  }

  function mostrarErros(porCampo) {
    setErros(porCampo);
    const primeiro = Object.keys(porCampo)[0];
    if (primeiro) document.getElementById(htmlId(primeiro))?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErroGeral(null);

    const errosCliente = validarNoCliente(campos, valores);
    if (Object.keys(errosCliente).length > 0) {
      mostrarErros(errosCliente);
      return;
    }

    try {
      await onSalvar(valores);
    } catch (error) {
      if (isAbortError(error)) return;

      const apiError = toApiError(error);
      const { porCampo, gerais } = errosDoServidor(apiError.fields, campos);
      mostrarErros(porCampo);
      // Sem campo onde mostrar (ou com mensagens gerais), o alerta do topo explica.
      if (gerais.length > 0 || Object.keys(porCampo).length === 0) setErroGeral(apiError);
    }
  }

  const campoDoForm = (campo) => {
    const id = idNoForm(campo);

    return (
      <CampoDinamico
        campo={campo}
        erro={erros[id]}
        id={htmlId(id)}
        key={id}
        onChange={(valor) => alterar(id, valor)}
        value={valores[id]}
      />
    );
  };

  return (
    <form
      aria-describedby={erroGeral ? ERRO_GERAL_ID : undefined}
      className="flex min-h-0 flex-1 flex-col"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="grid flex-1 content-start gap-4 overflow-y-auto px-4 pb-4">
        <ApiErrorAlert error={erroGeral} id={ERRO_GERAL_ID} title="Não foi possível salvar" />

        {campos.map(campoDoForm)}
        {campoDoForm(CAMPO_VALOR)}

        {usuarios.length > 0 && (
          <CampoResponsavel
            erro={erros[CHAVE_RESPONSAVEL]}
            id={htmlId(CHAVE_RESPONSAVEL)}
            onChange={(valor) => alterar(CHAVE_RESPONSAVEL, valor)}
            rotuloVazio={responsavelVazio}
            usuarios={usuarios}
            value={valores[CHAVE_RESPONSAVEL]}
          />
        )}
      </div>

      <footer className="flex justify-end gap-2 border-t border-border px-4 py-3">
        <Button disabled={enviando} onClick={onCancelar} type="button" variant="outline">
          Cancelar
        </Button>
        <Button aria-busy={enviando} disabled={enviando} type="submit">
          {enviando ? 'Salvando…' : rotuloEnviar}
        </Button>
      </footer>
    </form>
  );
}
