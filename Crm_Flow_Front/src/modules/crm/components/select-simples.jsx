import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

/**
 * Select de lista plana `{ valor, rotulo }`, no visual do CRM (canto reto,
 * altura da toolbar). `vazio` acrescenta uma opção que devolve `''`.
 *
 * @param {{
 *   value: string,
 *   onChange: (valor: string) => void,
 *   opcoes: { valor: string, rotulo: string }[],
 *   vazio?: string,
 *   placeholder?: string,
 *   className?: string,
 *   disabled?: boolean,
 * } & Record<string, unknown>} props demais props (id, aria-*) vão para o trigger
 */
export function SelectSimples({
  value,
  onChange,
  opcoes,
  vazio,
  placeholder = 'Selecione',
  className,
  disabled,
  ...trigger
}) {
  const rotuloPorValor = new Map(opcoes.map((opcao) => [opcao.valor, opcao.rotulo]));
  const textoVazio = vazio ?? placeholder;

  return (
    <Select
      disabled={disabled}
      onValueChange={(valor) => onChange(valor ?? '')}
      value={value || null}
    >
      <SelectTrigger {...trigger} className={cn('h-9 w-full rounded-none', className)}>
        <SelectValue placeholder={textoVazio}>
          {(valor) => rotuloPorValor.get(valor) ?? textoVazio}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {vazio && <SelectItem value={null}>{vazio}</SelectItem>}
        {opcoes.map((opcao) => (
          <SelectItem key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
