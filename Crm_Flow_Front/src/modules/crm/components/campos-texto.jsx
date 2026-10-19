import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { LIMITE_TEXTO_LONGO, TIPOS_CAMPO } from '../constants';
import { mascararCep, mascararCnpj, mascararCpf, mascararTelefone } from '../lib/formatadores';

export const INPUT_CLASS = 'h-9 rounded-none';

/** `type`/`inputMode` do input de texto por tipo (e-mail nativo inclusive). */
const ATRIBUTOS = Object.freeze({
  [TIPOS_CAMPO.EMAIL]: { type: 'email', inputMode: 'email', autoComplete: 'email' },
  [TIPOS_CAMPO.URL]: { type: 'url', inputMode: 'url', placeholder: 'https://' },
});

const atributosDe = (campo) => ATRIBUTOS[campo.tipo];

export function CampoTexto({ campo, value, onChange, controle }) {
  return (
    <Input
      {...controle}
      {...atributosDe(campo)}
      className={INPUT_CLASS}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    />
  );
}

export function CampoTextoLongo({ value, onChange, controle }) {
  const contadorId = `${controle.id}-contador`;
  const describedBy = [controle['aria-describedby'], contadorId].filter(Boolean).join(' ');

  return (
    <div className="grid gap-1">
      <Textarea
        {...controle}
        aria-describedby={describedBy}
        className="min-h-24 rounded-none"
        maxLength={LIMITE_TEXTO_LONGO}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      <p className="justify-self-end font-mono text-[11px] text-muted-foreground tabular-nums" id={contadorId}>
        {value.length.toLocaleString('pt-BR')}/{LIMITE_TEXTO_LONGO.toLocaleString('pt-BR')}
      </p>
    </div>
  );
}

/** Reais, como o usuário digita (`1.234,56`); `paraValorDeApi` converte. */
export function CampoMonetario({ value, onChange, controle }) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center font-mono text-sm text-muted-foreground"
      >
        R$
      </span>
      <Input
        {...controle}
        className={cn(INPUT_CLASS, 'pl-9 font-mono tabular-nums')}
        inputMode="decimal"
        onChange={(event) => onChange(event.target.value)}
        placeholder="0,00"
        value={value}
      />
    </div>
  );
}

/** Máscara BR enquanto digita; o back grava só os dígitos. */
export function CampoTelefone({ value, onChange, controle }) {
  return (
    <Input
      {...controle}
      autoComplete="tel"
      className={cn(INPUT_CLASS, 'font-mono tabular-nums')}
      inputMode="tel"
      onChange={(event) => onChange(mascararTelefone(event.target.value))}
      placeholder="(11) 91234-5678"
      type="tel"
      value={value}
    />
  );
}

const DOCUMENTOS = Object.freeze({
  [TIPOS_CAMPO.CPF]: { mascarar: mascararCpf, placeholder: '000.000.000-00', inputMode: 'numeric' },
  // CNPJ alfanumérico (M11): teclado de texto, não numérico.
  [TIPOS_CAMPO.CNPJ]: { mascarar: mascararCnpj, placeholder: '00.000.000/0000-00', inputMode: 'text' },
  [TIPOS_CAMPO.CEP]: { mascarar: mascararCep, placeholder: '00000-000', inputMode: 'numeric', autoComplete: 'postal-code' },
});

/** CPF, CNPJ e CEP: máscara ao digitar; o payload vai sem ela (`paraValorDeApi`). */
export function CampoDocumento({ campo, value, onChange, controle }) {
  const { mascarar, ...atributos } = DOCUMENTOS[campo.tipo];

  return (
    <Input
      {...controle}
      {...atributos}
      className={cn(INPUT_CLASS, 'font-mono tabular-nums')}
      onChange={(event) => onChange(mascarar(event.target.value))}
      value={value}
    />
  );
}

export function CampoHora({ value, onChange, controle }) {
  return (
    <Input
      {...controle}
      className={cn(INPUT_CLASS, 'w-32 font-mono tabular-nums')}
      onChange={(event) => onChange(event.target.value)}
      type="time"
      value={value}
    />
  );
}
