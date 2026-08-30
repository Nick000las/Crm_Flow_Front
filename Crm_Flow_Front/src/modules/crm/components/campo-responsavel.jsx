import { CampoForm } from './campo-form';
import { SelectSimples } from './select-simples';

/**
 * Responsável pelo lead — não é campo de `/fields`; as opções vêm de
 * `/crm/usuarios`. O significado do vazio depende do modo (ver `rotuloVazio`).
 *
 * @param {{
 *   id: string,
 *   value: string,
 *   onChange: (id: string) => void,
 *   usuarios: { id: string, nome: string }[],
 *   rotuloVazio: string,
 *   erro?: string | null,
 *   ajuda?: string,
 * }} props
 */
export function CampoResponsavel({ id, value, onChange, usuarios, rotuloVazio, erro, ajuda }) {
  const opcoes = usuarios.map((usuario) => ({ valor: usuario.id, rotulo: usuario.nome }));

  return (
    <CampoForm ajuda={ajuda} erro={erro} id={id} label="Responsável">
      {(controle) => (
        <SelectSimples
          {...controle}
          onChange={onChange}
          opcoes={opcoes}
          vazio={rotuloVazio}
          value={value}
        />
      )}
    </CampoForm>
  );
}
