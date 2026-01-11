const apiBase = "http://localhost:3000/api"; // URL do backend

// Função para listar itens
async function carregarItens() {
  const res = await fetch(`${apiBase}/items`);
  const itens = await res.json();

  const tbody = document.querySelector("#tabelaItens tbody");
  tbody.innerHTML = "";

  itens.forEach((item) => {
    const situacao = item.quantity < item.min_stock_level ? 'Baixo' : 'Adequado';
    const situacaoClass = item.quantity < item.min_stock_level ? 'situacao-baixo' : 'situacao-adequado';
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.code}</td>
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.min_stock_level}</td>
      <td class="col-estoque">${item.quantity}</td>
      <td class="${situacaoClass}">${situacao}</td>
      
    `;
    tbody.appendChild(tr);
  });

}

// Função para cadastrar novo item
document.getElementById("formItem").addEventListener("submit", async (e) => {
  e.preventDefault();

  const item = {
    code: document.getElementById("code").value,
    name: document.getElementById("name").value,
    category: document.getElementById("category").value,
    min_stock_level: parseInt(document.getElementById("min_stock_level").value),
  };

  const res = await fetch(`${apiBase}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });

  if (res.ok) {
    alert("✅ Item cadastrado!");
    e.target.reset();
    carregarItens();
  } else {
    alert("❌ Erro ao cadastrar item.");
  }
});

carregarItens();