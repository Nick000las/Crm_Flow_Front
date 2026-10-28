import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useFaixasScore } from '../hooks/use-score';
import { RESPONSAVEL_NENHUM } from '../lib/filtro';
import { SelectSimples } from './select-simples';

const INPUT_CLASS = 'h-9 rounded-none font-mono tabular-nums';

function Faixa({ legenda, nome, de, ate, tipo, erros, onChange }) {
  const [chaveDe, chaveAte] = nome;
  const erro = erros[chaveDe] ?? erros[chaveAte];
  const erroId = `filtro-${chaveDe}-erro`;
  const comum = {
    'aria-describedby': erro ? erroId : undefined,
    'aria-invalid': erro ? true : undefined,
    className: INPUT_CLASS,
    inputMode: tipo === 'date' ? undefined : 'decimal',
    type: tipo,
  };

  return (
    <fieldset className="grid gap-1.5">
      <legend className="mb-1.5 text-sm font-medium">{legenda}</legend>
      <div className="grid grid-cols-2 gap-2">
        <Input
          {...comum}
          aria-label={`${legenda}: de`}
          onChange={(event) => onChange(chaveDe, event.target.value)}
          placeholder="de"
          value={de}
        />
        <Input
          {...comum}
          aria-label={`${legenda}: até`}
          onChange={(event) => onChange(chaveAte, event.target.value)}
          placeholder="até"
          value={ate}
        />
      </div>
      {erro && (
        <p className="text-xs text-destructive" id={erroId}>
          {erro}
        </p>
      )}
    </fieldset>
  );
}

/**
 * Filtros que não dependem de `/fields`: responsável, valor, data de criação
 * e, com `crm.score`, a faixa de score (as faixas vêm da configuração).
 *
 * @param {{
 *   fixos: import('../lib/filtro').FixosRascunho,
 *   usuarios: { id: string, nome: string }[],
 *   erros: Record<string, string>,
 *   onChange: (chave: keyof import('../lib/filtro').FixosRascunho, valor: string) => void,
 *   className?: string,
 * }} props
 */
export function FiltrosFixos({ fixos, usuarios, erros, onChange, className }) {
  const faixas = useFaixasScore();
  // "Sem responsável" (sem dono ou dono desativado) vale mesmo sem a lista de usuários.
  const opcoesResponsavel = [
    { valor: RESPONSAVEL_NENHUM, rotulo: 'Sem responsável' },
    ...usuarios.map((usuario) => ({ valor: usuario.id, rotulo: usuario.nome })),
  ];

  return (
    <div className={cn('grid gap-3 sm:grid-cols-3', className)}>
      <div className="grid content-start gap-1.5">
        <label className="mb-1.5 text-sm font-medium" htmlFor="filtro-responsavel">
          Responsável
        </label>
        <SelectSimples
          id="filtro-responsavel"
          onChange={(valor) => onChange('usuarioResponsavelId', valor)}
          opcoes={opcoesResponsavel}
          vazio="Qualquer um"
          value={fixos.usuarioResponsavelId}
        />
      </div>
      <Faixa
        ate={fixos.valorMax}
        de={fixos.valorMin}
        erros={erros}
        legenda="Valor (R$)"
        nome={['valorMin', 'valorMax']}
        onChange={onChange}
        tipo="text"
      />
      <Faixa
        ate={fixos.criadoAte}
        de={fixos.criadoDe}
        erros={erros}
        legenda="Criado em"
        nome={['criadoDe', 'criadoAte']}
        onChange={onChange}
        tipo="date"
      />
      {faixas && (
        <div className="grid content-start gap-1.5">
          <label className="mb-1.5 text-sm font-medium" htmlFor="filtro-faixa-score">
            Faixa de score
          </label>
          <SelectSimples
            id="filtro-faixa-score"
            onChange={(valor) => onChange('faixaScore', valor)}
            opcoes={faixas.map((faixa) => ({ valor: faixa.chave, rotulo: faixa.rotulo }))}
            vazio="Qualquer faixa"
            value={fixos.faixaScore}
          />
        </div>
      )}
    </div>
  );
}
