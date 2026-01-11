const apiBase = "http://localhost:3000/api";

async function carregarItensBaixo() {
  const res = await fetch(`${apiBase}/items`);
  const itens = await res.json();
  const tbody = document.querySelector("#tabelaItensBaixo tbody");
  tbody.innerHTML = "";
  itens.filter(item => Number(item.quantity) < Number(item.min_stock_level))
    .forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.name}</td>
        <td>${item.code}</td>
        <td>${item.category}</td>
        <td style="color:#d32f2f;font-weight:bold;">${item.quantity}</td>
        <td>${item.min_stock_level}</td>
      `;
      tbody.appendChild(tr);
    });
}

window.addEventListener('DOMContentLoaded', carregarItensBaixo);
