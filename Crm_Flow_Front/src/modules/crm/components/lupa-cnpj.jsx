import { Search } from 'lucide-react';
import { useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { podeVer, temFeature } from '@/lib/acesso';
import { getFieldError, toApiError } from '@/services/api';
import { CRM_FEATURES, PAPEIS_GESTAO } from '../constants';
import { useConfigCnpj, useConsultarCnpj } from '../hooks/use-cnpj';
import {
  MENSAGENS_CNPJ,
  aplicarSugestoes,
  cnpjCompleto,
  dadosParaLeitura,
  itensDaSugestao,
  situacaoDestacada,
} from '../lib/cnpj';
import { documentoSemMascara } from '../lib/formatadores';
import { caminhoDaSecao } from '../lib/secoes-configuracoes';

const SERVICO_INDISPONIVEL = 'EXTERNAL_SERVICE_UNAVAILABLE';
const HTTP_FORBIDDEN = 403;
const HTTP_BAD_REQUEST = 400;
const CAMPO_DO_ERRO = 'cnpj';

const MENSAGEM_POR_STATUS = Object.freeze({
  nao_encontrado: MENSAGENS_CNPJ.NAO_ENCONTRADO,
  nao_suportado: MENSAGENS_CNPJ.NAO_SUPORTADO,
});

const LINK = 'underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/50';

/** Situação cadastral fora de ATIVA ("BAIXADA"…): texto e cor, nunca só cor. */
function SeloSituacao({ situacao }) {
  if (!situacao) return null;

  return (
    <p className="flex items-center gap-2 text-sm">
      <Badge className="rounded-none border-destructive font-mono text-[11px] text-destructive" variant="outline">
        {situacao}
      </Badge>
      <span className="text-muted-foreground">Situação cadastral na Receita</span>
    </p>
  );
}

/** Link que abre em nova aba: o form do lead continua aqui, sem perder o digitado. */
function LinkConfiguracao({ secao, children }) {
  return (
    <a className={LINK} href={caminhoDaSecao(secao)} rel="noopener" target="_blank">
      {children}
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  );
}

/**
 * O que a Receita devolveu e não está nas sugestões, só para leitura: o
 * usuário vê o resultado mesmo sem campo para recebê-lo, com o caminho para
 * configurar mais destinos.
 */
function OutrosDados({ dados, comSugestoes, gestao }) {
  if (comSugestoes && dados.length === 0) return null;

  return (
    <section aria-label="Dados da Receita sem campo no lead" className="grid gap-2 border border-border px-3 py-2">
      {dados.length > 0 && (
        <>
          <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
            {comSugestoes ? 'Outros dados da Receita' : 'Dados da Receita'}
          </p>
          <dl className="grid gap-x-3 gap-y-1 text-sm sm:grid-cols-[auto_minmax(0,1fr)]">
            {dados.map((dado) => (
              <div className="contents" key={dado.chave}>
                <dt className="text-xs text-muted-foreground sm:pt-0.5">{dado.label}</dt>
                <dd className="break-words">{dado.texto}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
      <p className="text-xs text-muted-foreground">
        {comSugestoes ? MENSAGENS_CNPJ.CONFIGURAR_MAIS : `${MENSAGENS_CNPJ.SEM_SUGESTAO} Configure em`}{' '}
        <LinkConfiguracao secao="enriquecimento">Configurações › Enriquecimento por CNPJ</LinkConfiguracao>
        {gestao && (
          <>
            {' (ou '}
            <LinkConfiguracao secao="campos">ative campos</LinkConfiguracao>
            {')'}
          </>
        )}
        .
      </p>
    </section>
  );
}

/** O que a Receita sugeriu para o form, com checkbox por campo. */
function Sugestoes({ idBase, itens, marcados, onAlternar }) {
  return (
    <ul aria-label="Sugestões para o formulário" className="divide-y divide-border border border-border">
      {itens.map((item) => {
        const id = `${idBase}-${item.campoReceita}`;

        return (
          <li className="flex items-start gap-2 px-2.5 py-2" key={item.campoReceita}>
            <Checkbox
              checked={marcados.has(item.id)}
              className="mt-0.5"
              disabled={!item.disponivel}
              id={id}
              onCheckedChange={() => onAlternar(item.id)}
            />
            <label className="grid gap-0.5 text-sm" htmlFor={id}>
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <span>{item.texto}</span>
              {item.substitui && <span className="text-xs text-muted-foreground">Substitui o valor atual</span>}
              {!item.disponivel && <span className="text-xs text-muted-foreground">{MENSAGENS_CNPJ.FORA_DO_FORM}</span>}
            </label>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Lupa do CNPJ (`crm.cnpj`, modo manual): consulta a Receita e sugere valores
 * para os campos mapeados. Aplicar só preenche o form — o usuário revisa e
 * salva. Some sem a flag ou com o enriquecimento desligado.
 *
 * @param {{
 *   idBase: string,
 *   cnpj: string,
 *   campos: import('../types').Campo[],
 *   valores: Record<string, unknown>,
 *   onAplicar: (valores: Record<string, unknown>) => void,
 *   onErroNoCampo: (mensagem: string) => void,
 * }} props `onErroNoCampo`: o 400 de dígito verificador vai para o erro do
 *   próprio campo CNPJ, não para o painel
 */
export function LupaCnpj({ idBase, cnpj, campos, valores, onAplicar, onErroNoCampo }) {
  const { user } = useAuth();
  const configQuery = useConfigCnpj();
  const consultar = useConsultarCnpj();
  const [painel, setPainel] = useState(null);

  if (!temFeature(user, CRM_FEATURES.CNPJ) || !configQuery.data?.ativo) return null;

  const documento = documentoSemMascara(cnpj);
  // Trocou o CNPJ depois de consultar: o resultado era do outro.
  const resultado = painel?.documento === documento ? painel : null;
  const erroDaConsulta = consultar.error && consultar.variables === documento ? toApiError(consultar.error) : null;
  // O 400 (DV errado) já está no campo; aqui ficam os outros.
  const erro = erroDaConsulta?.status === HTTP_BAD_REQUEST ? null : erroDaConsulta;
  // Desligado nas configurações (403): a mensagem do back explica; buscar de novo não adianta.
  const desligada = consultar.error ? toApiError(consultar.error).status === HTTP_FORBIDDEN : false;

  function buscar() {
    setPainel(null);
    consultar.mutate(documento, {
      onSuccess: (consulta) => {
        const itens = consulta.status === 'ok' ? itensDaSugestao(consulta.sugestao, campos, valores) : [];
        const marcados = new Set(itens.filter((item) => item.marcadaPorPadrao).map((item) => item.id));
        setPainel({ documento, status: consulta.status, itens, marcados, dados: consulta.dados ?? null });
      },
      onError: (falha) => {
        const apiError = toApiError(falha);
        if (apiError.status === HTTP_BAD_REQUEST) {
          onErroNoCampo(getFieldError(apiError, CAMPO_DO_ERRO) ?? apiError.message);
        }
      },
    });
  }

  function alternar(id) {
    setPainel((atual) => {
      const marcados = new Set(atual.marcados);
      if (marcados.has(id)) marcados.delete(id);
      else marcados.add(id);
      return { ...atual, marcados };
    });
  }

  function fechar() {
    setPainel(null);
    consultar.reset();
  }

  return (
    <div className="grid gap-2">
      <div>
        <Button
          aria-busy={consultar.isPending}
          disabled={!cnpjCompleto(cnpj) || consultar.isPending || desligada}
          onClick={buscar}
          size="sm"
          type="button"
          variant="outline"
        >
          <Search aria-hidden="true" />
          {consultar.isPending ? 'Consultando a Receita…' : 'Buscar dados na Receita'}
        </Button>
      </div>

      <div aria-live="polite" className="grid gap-2">
        {erro?.code === SERVICO_INDISPONIVEL && (
          <div className="flex flex-wrap items-center gap-2 border border-border px-3 py-2 text-sm">
            {MENSAGENS_CNPJ.INDISPONIVEL}
            <Button onClick={buscar} size="sm" type="button" variant="ghost">
              Tentar de novo
            </Button>
          </div>
        )}
        {erro && erro.code !== SERVICO_INDISPONIVEL && (
          <ApiErrorAlert error={erro} id={`${idBase}-erro`} title="Não foi possível consultar o CNPJ" />
        )}

        {resultado && resultado.status !== 'ok' && (
          <p className="border border-border px-3 py-2 text-sm">{MENSAGEM_POR_STATUS[resultado.status]}</p>
        )}
        {resultado?.status === 'ok' && (
          <>
            <SeloSituacao situacao={situacaoDestacada(resultado.dados)} />
            {resultado.itens.length > 0 && (
              <Sugestoes
                idBase={idBase}
                itens={resultado.itens}
                marcados={resultado.marcados}
                onAlternar={alternar}
              />
            )}
            <OutrosDados
              comSugestoes={resultado.itens.length > 0}
              dados={dadosParaLeitura(
                resultado.dados,
                configQuery.data.camposReceita ?? [],
                new Set(resultado.itens.map((item) => item.campoReceita)),
              )}
              gestao={podeVer({ roles: PAPEIS_GESTAO }, user)}
            />
            <div className="flex flex-wrap gap-2">
              {resultado.itens.length > 0 && (
                <Button
                  disabled={resultado.marcados.size === 0}
                  onClick={() => {
                    onAplicar(aplicarSugestoes(valores, resultado.itens, resultado.marcados));
                    fechar();
                  }}
                  size="sm"
                  type="button"
                >
                  Aplicar ao formulário
                </Button>
              )}
              <Button onClick={fechar} size="sm" type="button" variant="outline">
                Fechar
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
