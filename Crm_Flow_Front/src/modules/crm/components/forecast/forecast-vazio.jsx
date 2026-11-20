import { TrendingUp } from 'lucide-react';
import { ModulePlaceholder } from '@/components/module-placeholder';
import { Button } from '@/components/ui/button';
import { TEXTOS_FORECAST } from '../../lib/forecast-textos';

/**
 * Tenant sem nenhuma oportunidade de venda (`vazio: true`): sem gráfico zerado.
 *
 * @param {{ onCriar: () => void }} props
 */
export function ForecastVazio({ onCriar }) {
  return (
    <ModulePlaceholder
      description={TEXTOS_FORECAST.vazio}
      icon={TrendingUp}
      title="Nada para prever ainda"
    >
      <Button onClick={onCriar}>{TEXTOS_FORECAST.criarOportunidade}</Button>
    </ModulePlaceholder>
  );
}
