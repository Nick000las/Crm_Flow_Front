/**
 * @file Formulário montado com os dados já lidos.
 */
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { FieldError } from '@/components/field-error';
import { LoadingState } from '@/components/loading-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Radio } from '@/components/ui/radio';
import { Skeleton } from '@/components/ui/skeleton';
import { focusFirstInvalidField } from '@/lib/form-validation';
import { PwaStatus } from '@/pwa/pwa-status';
import { toApiError } from '@/services/api';

import {
  enviarRespostaPublica,
  marcarFormularioAberto,
  obterFormularioPublico,
} from '../api/formulario-publico.api';
import { CampoDinamico } from '../components/campo-dinamico';
import { CampoForm } from '../components/campo-form';
import { formatarInstante } from '../lib/formatadores';
import {
  campoDoItem,
  chaveDoItem,
  corpoDoEnvio,
  errosDoEnvio,
  mensagemDoErroPublico,
  QUEM_PREENCHE,
  temErros,
  validarEnvio,
  valoresIniciais,
} from '../lib/formulario-publico';

const STATUS_VALIDACAO = 400;
const SEM_ERROS = Object.freeze({ porChave: {}, outros: [] });

/** Moldura da página: sem menu, centrada, no visual do CRM. */
function Moldura({ children }) {
  return (
    <main className="app-safe-area min-h-dvh bg-background [--safe-padding-inline:1rem] [--safe-padding-block:1.5rem] sm:[--safe-padding-block:2.5rem]">
      <PwaStatus />
      <Card layout="plain" className="mx-auto grid w-full max-w-2xl gap-6 p-5 shadow-sm sm:p-8">
        {children}
      </Card>
    </main>
  );
}

function Aviso({ icone: Icone, titulo, texto, children }) {
  return (
    <Moldura>
      <div className="grid justify-items-center gap-3 py-8 text-center" role="status">
        <Icone aria-hidden="true" className="size-6 text-muted-foreground" />
        <h1 className="text-lg font-semibold">{titulo}</h1>
        {texto && <p className="max-w-sm text-sm text-muted-foreground">{texto}</p>}
        {children}
      </div>
    </Moldura>
  );
}

/** Formulário montado com os dados já lidos. */
function FormularioRespondivel({ token, dados, onEnviado, onFechou }) {
  const { versao } = dados;
  const [valores, setValores] = useState(() => valoresIniciais(versao));
  const [aceite, setAceite] = useState(false);
  const [preenchidoPor, setPreenchidoPor] = useState(QUEM_PREENCHE.TITULAR);
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [erros, setErros] = useState(SEM_ERROS);
  const enviar = useMutation({ mutationFn: (corpo) => enviarRespostaPublica(token, corpo) });
  const responsavel = preenchidoPor === QUEM_PREENCHE.RESPONSAVEL;

  function mudar(chave, valor) {
    setValores((atuais) => ({ ...atuais, [chave]: valor }));

    if (erros.porChave[chave]) {
      setErros((atuais) => ({ ...atuais, porChave: { ...atuais.porChave, [chave]: undefined } }));
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    const envio = { aceite, preenchidoPor, nomeResponsavel };
    const locais = validarEnvio(versao, valores, envio);

    if (temErros(locais)) {
      setErros({ ...locais, outros: [] });

      focusFirstInvalidField(event.currentTarget, [
        ...Object.keys(locais.porChave ?? {}).map((chave) => `resposta-${chave}`),
        ...(locais.nomeResponsavel ? ['nome-responsavel'] : []),
        ...(locais.aceite ? ['aceite-termo'] : []),
      ]);

      return;
    }

    setErros(SEM_ERROS);

    enviar.mutate(corpoDoEnvio(versao, valores, envio), {
      onSuccess: onEnviado,
      onError: (error) => {
        const erro = toApiError(error);

        if (erro.status === STATUS_VALIDACAO) {
          setErros(errosDoEnvio(erro.fields));
        } else {
          onFechou(erro);
        }
      },
    });
  }

  return (
    <Form className="grid gap-6" noValidate onSubmit={handleSubmit}>
      {versao.introducao && <p className="text-sm whitespace-pre-wrap">{versao.introducao}</p>}

      {versao.secoes.map((secao, indice) => (
        <fieldset className="grid gap-4" key={indice}>
          {secao.titulo && <legend className="mb-1 text-base font-semibold">{secao.titulo}</legend>}
          {secao.itens.map((item) => {
            const chave = chaveDoItem(item);
            const campo = campoDoItem(item);

            return (
              <CampoDinamico
                ajuda={campo.ajuda}
                campo={campo}
                erro={erros.porChave[chave]}
                id={`resposta-${chave}`}
                key={chave}
                onChange={(valor) => mudar(chave, valor)}
                value={valores[chave]}
              />
            );
          })}
        </fieldset>
      ))}

      <fieldset className="grid gap-3 border-t border-border pt-5">
        <legend className="mb-1 text-sm font-semibold">Quem está preenchendo?</legend>
        <div className="flex flex-wrap gap-4" role="radiogroup">
          {[
            { valor: QUEM_PREENCHE.TITULAR, rotulo: 'Eu mesmo' },
            { valor: QUEM_PREENCHE.RESPONSAVEL, rotulo: 'Responsável' },
          ].map((opcao) => (
            <label className="flex items-center gap-2 text-sm" key={opcao.valor}>
              <Radio
                checked={preenchidoPor === opcao.valor}
                className="size-4"
                name="preenchido-por"
                onChange={() => setPreenchidoPor(opcao.valor)}

                value={opcao.valor}
              />
              {opcao.rotulo}
            </label>
          ))}
        </div>
        {responsavel && (
          <CampoForm
            ajuda="Por exemplo, quem responde por um menor de idade."
            erro={erros.nomeResponsavel}
            id="nome-responsavel"
            label="Nome do responsável"
            obrigatorio
          >
            {(controle) => (
              <Input
                {...controle}
                autoComplete="name"

                onChange={(event) => setNomeResponsavel(event.target.value)}
                value={nomeResponsavel}
              />
            )}
          </CampoForm>
        )}
      </fieldset>

      <div className="grid gap-2">
        <p className="text-sm font-semibold">Termo de aceite</p>
        <p className="max-h-48 overflow-y-auto rounded-lg border border-border bg-surface px-3 py-2 text-sm whitespace-pre-wrap">
          {versao.termo}
        </p>
        <label className="flex items-start gap-2 text-sm" htmlFor="aceite-termo">
          <Checkbox
            aria-describedby={erros.aceite ? 'aceite-termo-erro' : undefined}
            aria-invalid={erros.aceite ? true : undefined}
            checked={aceite}
            id="aceite-termo"
            onCheckedChange={(marcado) => setAceite(Boolean(marcado))}
          />
          Li e aceito o termo
        </label>
        <FieldError id="aceite-termo-erro" message={erros.aceite} />
      </div>

      {(erros.outros.length > 0 || temErros(erros)) && (
        <p className="border border-destructive/30 px-3 py-2 text-sm text-destructive" role="alert">
          {erros.outros[0] ?? 'Revise os campos marcados.'}
        </p>
      )}

      <div>
        <Button
          aria-busy={enviar.isPending}
          disabled={enviar.isPending}
          type="submit"
          loading={enviar.isPending}
          loadingText="Enviando…"
        >
          {'Enviar'}
        </Button>
      </div>
    </Form>
  );
}

/**
 * Página pública do formulário (`/f/:token`), sem login: mostra os campos, com
 * os valores que o dono marcou para vir preenchidos, e envia a resposta. O
 * token fica só na URL: não vai para `localStorage` nem para log.
 */
export default function FormularioPublicoPage() {
  const { token } = useParams();
  const [enviado, setEnviado] = useState(false);
  const [erroQueFechou, setErroQueFechou] = useState(null);
  const marcado = useRef(null);
  const formularioQuery = useQuery({
    queryKey: ['formulario-publico', token],
    queryFn: ({ signal }) => obterFormularioPublico(token, { signal }),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const dados = formularioQuery.data;

  useEffect(() => {
    // Uma vez, depois que o formulário aparece (o StrictMode monta duas vezes).
    if (dados && marcado.current !== token) {
      marcado.current = token;
      marcarFormularioAberto(token).catch(() => {});
    }
  }, [dados, token]);

  if (enviado) {
    return (
      <Aviso
        icone={CheckCircle2}
        texto="Obrigado. Recebemos suas respostas, e este link não abre mais."
        titulo="Respostas enviadas"
      />
    );
  }

  const erro = erroQueFechou ?? (formularioQuery.error ? toApiError(formularioQuery.error) : null);
  const mensagem = mensagemDoErroPublico(erro);

  if (mensagem) {
    return (
      <Aviso icone={CircleAlert} texto={mensagem.texto} titulo="Não foi possível abrir">
        {mensagem.tentarDeNovo && (
          <Button
            className="mt-2"
            onClick={() => {
              setErroQueFechou(null);
              formularioQuery.refetch();
            }}
            type="button"
            variant="outline"
          >
            Tentar de novo
          </Button>
        )}
      </Aviso>
    );
  }

  if (formularioQuery.isPending) {
    return (
      <Moldura>
        <div className="grid gap-3" aria-busy="true">
          <LoadingState label="Carregando formulário…" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </Moldura>
    );
  }

  const prazo = formatarInstante(dados.expiraEm);

  return (
    <Moldura>
      <header className="grid gap-1">
        {dados.pessoa.primeiroNome && (
          <p className="text-sm text-muted-foreground">Olá, {dados.pessoa.primeiroNome}</p>
        )}
        <h1 className="text-xl font-semibold">{dados.formulario.nome}</h1>
        {prazo && (
          <p className="text-xs text-muted-foreground">
            Responda até <span className="tabular-nums">{prazo}</span>
          </p>
        )}
      </header>
      <FormularioRespondivel
        dados={dados}
        onEnviado={() => setEnviado(true)}
        onFechou={setErroQueFechou}
        token={token}
      />
    </Moldura>
  );
}
