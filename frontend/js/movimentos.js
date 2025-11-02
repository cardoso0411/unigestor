// Carregar códigos dos itens para o select
async function carregarCodigosItens() {
  const res = await fetch(`${apiBase}/items`);
  const itens = await res.json();
  const select = document.getElementById("item_code");
  select.innerHTML = '<option value="">Selecione o código do item</option>';
  itens.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.code;
    opt.textContent = `${item.code} - ${item.name}`;
    opt.dataset.id = item.id;
    select.appendChild(opt);
  });
  // Salva itens em window para lookup rápido
  window._itensPorCodigo = {};
  itens.forEach(item => { window._itensPorCodigo[item.code] = item.id; });
}

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
  const code = document.getElementById("item_code").value;
  const item_id = window._itensPorCodigo ? window._itensPorCodigo[code] : null;
  if (!item_id) {
    alert("Selecione um código de item válido.");
    return;
  }
  const movimento = {
    item_id,
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
