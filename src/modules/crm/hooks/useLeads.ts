import { useEffect, useState } from 'react';
import type { Lead } from '../types';

/** Hook de dado do módulo CRM — chama o backend, nunca importa de outro módulo. */
export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch('/api/crm/leads')
      .then((res) => res.json())
      .then(setLeads)
      .finally(() => setCarregando(false));
  }, []);

  return { leads, carregando };
}
