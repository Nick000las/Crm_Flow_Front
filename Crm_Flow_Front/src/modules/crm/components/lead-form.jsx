import { useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { semChave } from '@/lib/objetos';
import { isAbortError, toApiError } from '@/services/api';
import { useChecarDuplicados } from '../hooks/use-duplicidade';
import {
  checaDuplicidade,
  consultaDeDuplicados,
  descreverCandidato,
  ehErroDeDuplicidade,
} from '../lib/duplicidade';
import { camposComRegras } from '../lib/regras';
import { ROTAS_CRM } from '../rotas';
import {
  CAMPO_VALOR,
  CHAVE_RESPONSAVEL,
  errosDoServidor,
  idNoForm,
  validarNoCliente,
} from '../lib/form-lead';
import { CampoDinamico } from './campo-dinamico';
import { CampoResponsavel } from './campo-responsavel';
import { DuplicadosDialog } from './duplicados-dialog';

const PREFIXO_ID = 'lead-form-';
const ERRO_GERAL_ID = 'lead-form-erro';

const SEM_REGRAS = Object.freeze({ obrigatorios: [], ocultos: [] });

const htmlId = (idCampo) => `${PREFIXO_ID}${idCampo.replaceAll('.', '-')}`;

/**
 * Parecidos achados ao sair de e-mail, telefone, CNPJ ou CPF. O link abre em
 * nova aba: o form continua aqui, sem perder o que foi digitado.
 */
function ParecidosAoVivo({ candidatos }) {
  return (
    <div className={candidatos.length > 0 ? 'border border-border px-3 py-2 text-sm' : 'sr-only'} role="status">
      {candidatos.length > 0 && (
        <>
          <p className="font-medium">Parecido com {candidatos.length === 1 ? 'um lead' : 'leads'} que já existe:</p>
          <ul className="mt-1 grid gap-0.5">
            {candidatos.map((candidato) => (
              <li key={candidato.id}>
                <a
                  className="underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  href={ROTAS_CRM.lead(candidato.id)}
                  rel="noopener"
                  target="_blank"
                >
                  {candidato.nome}
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>{' '}
                <span className="text-muted-foreground">— {descreverCandidato(candidato)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

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
 * Duplicidade: ao sair de e-mail/telefone/CNPJ/CPF, checa sem salvar
 * (lista vazia sem `crm.duplicidade`, então o form não conhece a flag). Um
 * 409 de duplicidade abre o `DuplicadosDialog` — no aviso, "Salvar mesmo
 * assim" reenvia com `ignorarDuplicados`.
 *
 * Regras de campo (`crm.regras`): `avaliarRegras` é refeito a cada render
 * (a cada mudança) e esconde campos ou põe o asterisco. Só UX — o 400 do
 * back é a palavra final. Esconder não limpa valor: o payload usa `campos`.
 *
 * @param {{
 *   campos: import('../types').Campo[],
 *   iniciais: Record<string, unknown>,
 *   modo: keyof typeof POR_MODO,
 *   usuarios: { id: string, nome: string }[],
 *   enviando: boolean,
 *   onSalvar: (valores: Record<string, unknown>, opcoes?: { ignorarDuplicados?: boolean }) => Promise<unknown>,
 *   onCancelar: () => void,
 *   onAbrirLead: (id: string) => void,
 *   leadId?: string,
 *   avaliarRegras?: (valores: Record<string, unknown>) => { obrigatorios: string[], ocultos: string[] },
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
  onAbrirLead,
  leadId,
  avaliarRegras,
}) {
  const { rotuloEnviar, responsavelVazio } = POR_MODO[modo];
  const [valores, setValores] = useState(iniciais);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [duplicidade, setDuplicidade] = useState(null);
  const camposVisiveis = camposComRegras(campos, avaliarRegras?.(valores) ?? SEM_REGRAS);
  const checar = useChecarDuplicados();
  const parecidos = checar.data?.duplicados ?? [];

  function checarDuplicados() {
    const consulta = consultaDeDuplicados(campos, valores, leadId);
    if (consulta) checar.mutate(consulta);
    else checar.reset();
  }

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

    const errosCliente = validarNoCliente(camposVisiveis, valores);
    if (Object.keys(errosCliente).length > 0) {
      mostrarErros(errosCliente);
      return;
    }

    await enviar({});
  }

  async function enviar(opcoes) {
    try {
      await onSalvar(valores, opcoes);
      setDuplicidade(null);
    } catch (error) {
      if (isAbortError(error)) return;

      const apiError = toApiError(error);
      if (ehErroDeDuplicidade(apiError)) {
        setDuplicidade(apiError);
        return;
      }
      setDuplicidade(null);
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
        onBlur={checaDuplicidade(campo) ? checarDuplicados : undefined}
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

        {camposVisiveis.map(campoDoForm)}
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
        <ParecidosAoVivo candidatos={parecidos} />
      </div>

      <DuplicadosDialog
        erro={duplicidade}
        onAbrirLead={onAbrirLead}
        onFechar={() => setDuplicidade(null)}
        onSalvarMesmoAssim={() => enviar({ ignorarDuplicados: true })}
        salvando={enviando}
      />

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
