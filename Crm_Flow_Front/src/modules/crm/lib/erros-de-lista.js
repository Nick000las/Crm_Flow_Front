/**
 * 400 de um PUT que leva uma lista inteira (regras da distribuição, regras e
 * faixas da pontuação) → erros por item do rascunho. Puro.
 *
 * O índice do caminho (`<prefixo>.<n>.…`) é o da lista **enviada**: com as
 * chaves na ordem do envio, o erro acha o item mesmo depois de reordenar ou
 * remover. Erro do item inteiro (`<prefixo>.<n>`) fica em `item`; o que não
 * é de um item (`<prefixo>`, outro campo) volta em `outros`.
 *
 * @param {Record<string, string[]> | null | undefined} fields
 * @param {string} prefixo `regras`, `faixas`…
 * @param {string[]} chavesEnviadas `chaveLocal` na ordem do PUT
 * @returns {{ porItem: Record<string, Record<string, string>>, outros: string[] }}
 */
export function errosPorItem(fields, prefixo, chavesEnviadas) {
  const caminhoDoItem = new RegExp(`^${prefixo}\\.(\\d+)(?:\\.(.+))?$`);
  const porItem = {};
  const outros = [];

  for (const [caminho, mensagens] of Object.entries(fields ?? {})) {
    const mensagem = Array.isArray(mensagens) ? mensagens[0] : String(mensagens);
    const partes = caminhoDoItem.exec(caminho);
    const chave = partes ? chavesEnviadas[Number(partes[1])] : undefined;
    if (!chave) {
      outros.push(mensagem);
      continue;
    }
    porItem[chave] = { ...porItem[chave], [partes[2] ?? 'item']: mensagem };
  }

  return { porItem, outros };
}
