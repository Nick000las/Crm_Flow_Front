import { useEffect, useState } from 'react';

/** Hook de dado do módulo CRM — chama o backend, nunca importa de outro módulo. */
export function useLeads() {
  const [leads, setLeads] = useState(/** @type {import('../types').Lead[]} */ ([]));
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch('/api/crm/leads')
      .then((res) => res.json())
      .then(setLeads)
      .finally(() => setCarregando(false));
  }, []);

  return { leads, carregando };
}
