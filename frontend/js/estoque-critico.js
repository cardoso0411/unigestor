const apiBase = "http://localhost:3000/api";

async function carregarEstoqueCritico() {
  const res = await fetch(`${apiBase}/items`);
  const itens = await res.json();
  const tbody = document.querySelector("#tabelaEstoqueCritico tbody");
  tbody.innerHTML = "";

  const criticos = itens.filter(i => Number(i.quantity) <= 0);
  const baixos = itens.filter(i => Number(i.quantity) > 0 && Number(i.quantity) < Number(i.min_stock_level || 0));
  const lista = [...criticos.map(i => ({ ...i, nivel: "Critico" })), ...baixos.map(i => ({ ...i, nivel: "Baixo" }))];

  if (lista.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5">Nenhum item com estoque baixo ou critico.</td>`;
    tbody.appendChild(tr);
    return;
  }

  lista.forEach(item => {
    const cor = item.nivel === "Critico" ? "#d32f2f" : "#f59e0b";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="col-item-critico">${item.name}</td>
      <td class="col-codigo-critico">${item.code}</td>
      <td class="col-minimo-critico">${item.min_stock_level}</td>
      <td class="col-quantidade-critico">${item.quantity}</td>
      <td class="col-nivel-critico" style="color:${cor};font-weight:bold;">${item.nivel}</td>
    `;
    tbody.appendChild(tr);
  });
}

carregarEstoqueCritico();
