const apiBase = "http://localhost:3000/api";

function parseMovDate(m) {
  const d = new Date(m.performed_at || m.date || m.created_at);
  return isNaN(d) ? null : d;
}

async function carregarRankingConsumo() {
  const [resItens, resMovs] = await Promise.all([
    fetch(`${apiBase}/items`),
    fetch(`${apiBase}/movements`)
  ]);

  const itens = await resItens.json();
  const movs = await resMovs.json();
  const tbody = document.querySelector("#tabelaRankingConsumo tbody");
  tbody.innerHTML = "";

  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = agora.getMonth();

  const saidasMes = movs.filter(m => m.type === "OUT").filter(m => {
    const d = parseMovDate(m);
    return d && d.getFullYear() === ano && d.getMonth() === mes;
  });

  const totalPorItem = {};
  saidasMes.forEach(m => {
    const id = String(m.item_id);
    totalPorItem[id] = (totalPorItem[id] || 0) + Number(m.quantity || 0);
  });

  const itensMap = {};
  itens.forEach(i => {
    itensMap[String(i.id)] = i.name;
  });

  const ranking = Object.entries(totalPorItem)
    .map(([id, total]) => ({ id, total }))
    .sort((a, b) => b.total - a.total);

  if (ranking.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="2">Sem consumo registrado neste mes.</td>`;
    tbody.appendChild(tr);
    return;
  }

  ranking.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${itensMap[r.id] || "Item " + r.id}</td>
      <td class="col-quantidade-consumo">${r.total}</td>
    `;
    tbody.appendChild(tr);
  });
}

carregarRankingConsumo();
