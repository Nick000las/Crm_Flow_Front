import { SearchX, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ModulePlaceholder } from '@/components/module-placeholder';
import { Button, buttonVariants } from '@/components/ui/button';
import { ROTAS_CRM } from '../rotas';

/** Tenant sem leads ainda. Importar só aparece para quem pode importar. */
export function LeadsVazio({ acaoNovo, podeImportar }) {
  return (
    <ModulePlaceholder
      icon={Users}
      title="Nenhum lead ainda"
      description="Os leads do CRM aparecem aqui assim que forem cadastrados ou importados."
    >
      <div className="flex flex-wrap justify-center gap-2">
        {acaoNovo}
        {podeImportar && (
          <Link className={buttonVariants({ variant: 'outline' })} to={ROTAS_CRM.IMPORTAR}>
            Importar planilha
          </Link>
        )}
      </div>
    </ModulePlaceholder>
  );
}

export function LeadsNaoEncontrados({ onLimpar }) {
  return (
    <ModulePlaceholder
      icon={SearchX}
      title="Nenhum lead encontrado"
      description="Nenhum lead corresponde à busca e aos filtros atuais."
    >
      <Button onClick={onLimpar} variant="outline">
        Limpar busca e filtros
      </Button>
    </ModulePlaceholder>
  );
}

/** URL com página além da última (link antigo, leads excluídos). */
export function PaginaSemLeads({ onPrimeiraPagina }) {
  return (
    <ModulePlaceholder
      icon={SearchX}
      title="Esta página não tem leads"
      description="A lista ficou menor do que a página pedida."
    >
      <Button onClick={onPrimeiraPagina} variant="outline">
        Ir para a primeira página
      </Button>
    </ModulePlaceholder>
  );
}
