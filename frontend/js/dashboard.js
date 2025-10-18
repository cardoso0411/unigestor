const apiBase = "http://localhost:3000/api";

async function carregarDashboard() {
  const res = await fetch(`${apiBase}/items`);
  const itens = await res.json();

  document.getElementById("totalItens").innerText = itens.length;

  const baixoEstoque = itens.filter(i => i.quantity < i.min_stock_level).length;
  document.getElementById("itensBaixoEstoque").innerText = baixoEstoque;
}

carregarDashboard();