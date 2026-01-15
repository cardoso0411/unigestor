// Autocomplete de itens
let cacheItensMov = [];
let itemSelecionadoMov = null;
async function carregarCodigosItens() {
  const res = await fetch(`${apiBase}/items`);
  cacheItensMov = await res.json();
  window._itensPorNome = {};
  cacheItensMov.forEach(item => { window._itensPorNome[item.name.toLowerCase()] = item; });
}

function filtrarSugestoesMov(valor) {
  valor = valor.toLowerCase();
  return cacheItensMov.filter(item => item.name.toLowerCase().includes(valor));
}

function renderSugestoesMov(lista) {
  const ul = document.getElementById('sugestoesItemMov');
  ul.innerHTML = '';
  if (!lista.length) {
    ul.style.display = 'none';
    return;
  }
  lista.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.name} (${item.code})`;
    li.style.padding = '6px 10px';
    li.style.cursor = 'pointer';
    li.onmousedown = () => {
      document.getElementById('buscaItemMov').value = item.name;
      itemSelecionadoMov = item;
      ul.style.display = 'none';
    };
    ul.appendChild(li);
  });
  ul.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('buscaItemMov');
  const ul = document.getElementById('sugestoesItemMov');
  if (input) {
    input.addEventListener('input', () => {
      const valor = input.value.trim();
      if (!valor) {
        ul.style.display = 'none';
        itemSelecionadoMov = null;
        return;
      }
      const sugestoes = filtrarSugestoesMov(valor);
      renderSugestoesMov(sugestoes);
      itemSelecionadoMov = null;
    });
    input.addEventListener('blur', () => {
      setTimeout(() => { ul.style.display = 'none'; }, 150);
    });
  }
});

const apiBase = "http://localhost:3000/api";

function getFiltroTipo() {
  return document.getElementById('filtroTipo')?.value || '';
}
function getFiltroDataIni() {
  return document.getElementById('filtroDataIni')?.value || '';
}
function getFiltroDataFim() {
  return document.getElementById('filtroDataFim')?.value || '';
}

async function carregarMovimentacoes() {
  const res = await fetch(`${apiBase}/movements`);
  const dados = await res.json();

  // Filtros
  const tipo = getFiltroTipo();
  const dataIni = getFiltroDataIni();
  const dataFim = getFiltroDataFim();

  let filtrados = dados;
  if (tipo) filtrados = filtrados.filter(m => m.type === tipo);
  if (dataIni) filtrados = filtrados.filter(m => {
    const d = new Date(m.performed_at);
    return d >= new Date(dataIni);
  });
  if (dataFim) filtrados = filtrados.filter(m => {
    const d = new Date(m.performed_at);
    return d <= new Date(dataFim + 'T23:59:59');
  });

  const tbody = document.querySelector("#tabelaMov tbody");
  tbody.innerHTML = "";

  filtrados.forEach((mov) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${mov.code || mov.item_code || '-'}</td>
      <td>${mov.item_name}</td>
      <td>${mov.type === "IN" ? "Entrada" : mov.type === "OUT" ? "Saída" : mov.type}</td>
      <td>${mov.quantity}</td>
      <td>${mov.reason || "-"}</td>
      <td>${mov.performed_by || "-"}</td>
      <td>${new Date(mov.performed_at).toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById("formMov").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = document.getElementById("buscaItemMov").value.trim();
  const item = cacheItensMov.find(i => i.name.toLowerCase() === nome.toLowerCase());
  if (!item) {
    alert("Selecione um item válido da lista.");
    return;
  }
  const movimento = {
    item_id: item.id,
    type: document.getElementById("type").value,
    quantity: parseFloat(document.getElementById("quantity").value),
    reason: document.getElementById("reason").value,
    performed_by: document.getElementById("performed_by").value,
  };
  const res = await fetch(`${apiBase}/movements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(movimento),
  });
  if (res.ok) {
    alert("✅ Movimentação registrada!");
    e.target.reset();
    carregarMovimentacoes();
    carregarCodigosItens();
    itemSelecionadoMov = null;
  } else {
    alert("❌ Erro ao registrar movimentação.");
  }
});

carregarMovimentacoes();
carregarCodigosItens();

// Eventos dos filtros
document.getElementById('filtroTipo')?.addEventListener('change', carregarMovimentacoes);
document.getElementById('filtroDataIni')?.addEventListener('change', carregarMovimentacoes);
document.getElementById('filtroDataFim')?.addEventListener('change', carregarMovimentacoes);
document.getElementById('btnLimparFiltros')?.addEventListener('click', () => {
  document.getElementById('filtroTipo').value = '';
  document.getElementById('filtroDataIni').value = '';
  document.getElementById('filtroDataFim').value = '';
  carregarMovimentacoes();
});
