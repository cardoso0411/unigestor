const apiBase = "http://localhost:3000/api";
const DAY_MS = 24 * 60 * 60 * 1000;
const ALERTA_PARADO_DIAS = 180;

function parseMovDate(m) {
  // Normaliza a data da movimentacao para facilitar comparacoes.
  const d = new Date(m.performed_at || m.date || m.created_at);
  return isNaN(d) ? null : d;
}

async function carregarItensParados() {
  // Descobre quais itens estao sem movimentacao recente.
  const [resItens, resMovs] = await Promise.all([
    fetch(`${apiBase}/items`),
    fetch(`${apiBase}/movements`)
  ]);
  const itens = await resItens.json();
  const movs = await resMovs.json();
  const tbody = document.querySelector("#tabelaItensParados tbody");
  tbody.innerHTML = "";

  const ultimoPorItem = {};
  movs.forEach(m => {
    const d = parseMovDate(m);
    if (!d) return;
    const id = String(m.item_id);
    if (!ultimoPorItem[id] || d > ultimoPorItem[id]) ultimoPorItem[id] = d;
  });

  const limite = new Date(Date.now() - ALERTA_PARADO_DIAS * DAY_MS);
  let adicionados = 0;

  itens.forEach(item => {
    const ultima = ultimoPorItem[String(item.id)];
    if (ultima && ultima > limite) return;

    const diasParados = ultima ? Math.floor((Date.now() - ultima.getTime()) / DAY_MS) : "-";
    const ultimaTxt = ultima ? ultima.toLocaleDateString() : "Sem movimentacao";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="col-parados-item">${item.name}</td>
      <td class="col-parados-codigo">${item.code}</td>
      <td class="col-parados-ultima">${ultimaTxt}</td>
      <td class="col-parados-dias">${diasParados}</td>
    `;
    tbody.appendChild(tr);
    adicionados += 1;
  });

  if (adicionados === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4">Nenhum item parado ha ${ALERTA_PARADO_DIAS} dias.</td>`;
    tbody.appendChild(tr);
  }
}

carregarItensParados();

