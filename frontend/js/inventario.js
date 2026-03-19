// Preenche a tabela de inventário com os itens do estoque
const apiBase = "http://localhost:3000/api";

async function carregarInventario() {
  const res = await fetch(`${apiBase}/items`);
  const itens = await res.json();
  const tbody = document.getElementById('corpoInventario');
  tbody.innerHTML = '';
  itens.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.name}</td>
      <td></td>
      <td></td>
      <td></td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', carregarInventario);