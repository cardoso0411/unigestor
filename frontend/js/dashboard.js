// Função para desenhar gráfico de barras simples
const apiBase = "http://localhost:3000/api";

async function carregarDashboard() {
  const res = await fetch(`${apiBase}/items`);
  const itens = await res.json();

  document.getElementById("totalItens").innerText = itens.length;
  const baixoEstoque = itens.filter(i => i.quantity < i.min_stock_level).length;
  document.getElementById("itensBaixoEstoque").innerText = baixoEstoque;
  // Preenche select de resumo
  const select = document.getElementById('selectItemResumo');
  if (select) {
    // limpa e adiciona opções
    select.innerHTML = '<option value="">— selecione —</option>';
    itens.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = `${item.code} — ${item.name}`;
      select.appendChild(opt);
    });
    select.addEventListener('change', () => {
      const id = select.value;
      if (id) carregarResumoSaidasMensais(id);
      else document.querySelector('#tabelaResumoSaidas tbody').innerHTML = '';
    });
  }
  // gráfico removido
}

carregarDashboard();

// Popula tabela simples com saídas por mês para o item selecionado (sem gráfico)
async function carregarResumoSaidasMensais(itemId) {
  const res = await fetch(`${apiBase}/movements`);
  const movs = await res.json();
  // filtra apenas saídas do item
  const saidas = movs.filter(m => String(m.item_id) === String(itemId) && m.type === 'OUT');
  // agrupa por ano-mês
  const porMes = {};
  saidas.forEach(m => {
    const date = new Date(m.performed_at || m.date || m.created_at);
    if (isNaN(date)) return;
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
    porMes[key] = (porMes[key] || 0) + Number(m.quantity || 0);
  });
  const meses = Object.keys(porMes).sort();
  const tbody = document.querySelector('#tabelaResumoSaidas tbody');
  tbody.innerHTML = '';
  if (meses.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="2">Nenhuma saída registrada para este item</td>`;
    tbody.appendChild(tr);
    return;
  }
  meses.forEach(mes => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${mes}</td><td>${porMes[mes]}</td>`;
    tbody.appendChild(tr);
  });
}