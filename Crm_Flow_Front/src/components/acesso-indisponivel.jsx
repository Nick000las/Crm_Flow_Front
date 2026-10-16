import { Ban, Clock } from 'lucide-react';
import { ModulePlaceholder } from '@/components/module-placeholder';
import { ACCESS_ERROR_CODES } from '@/services/api';

const POR_CODIGO = Object.freeze({
  [ACCESS_ERROR_CODES.MODULE_NOT_ENABLED]: {
    icon: Ban,
    title: 'Módulo não contratado',
    description: 'Este módulo não está ativo para a sua empresa. Fale com o responsável pela conta.',
  },
  [ACCESS_ERROR_CODES.FEATURE_NOT_ENABLED]: {
    icon: Clock,
    title: 'Funcionalidade ainda não disponível',
    description: 'Ela está sendo liberada aos poucos e ainda não chegou à sua empresa.',
  },
});

/**
 * Estado de página para 403 `MODULE_NOT_ENABLED` / `FEATURE_NOT_ENABLED`
 * (detectar com `isAccessError`).
 * Normalmente a navegação já esconde a tela (`podeVer`); isto cobre o link
 * direto e a sessão desatualizada (flag desligada depois do login).
 *
 * @param {{ error: { code?: string } }} props
 */
export function AcessoIndisponivel({ error }) {
  const conteudo = POR_CODIGO[error.code];

  return <ModulePlaceholder {...conteudo} />;
}
