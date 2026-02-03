const apiBase = "http://localhost:3000/api";

// Carregar itens no select
async function carregarItens() {
  const res = await fetch(`${apiBase}/items`);
  const itens = await res.json();
  const select = document.getElementById("selectItem");
  select.innerHTML = '<option value="">Selecione o item</option>';
  itens.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = item.name;
    select.appendChild(opt);
  });
}

// Carregar tabela de C.A
async function carregarTabelaCA() {
  const res = await fetch(`${apiBase}/items`);
  const itens = await res.json();
  const tbody = document.querySelector("#tabelaCA tbody");
  tbody.innerHTML = "";
  itens.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.ca_number || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Salvar/editar C.A do item
async function salvarCA(e) {
  e.preventDefault();
  const itemId = document.getElementById("selectItem").value;
  const caNumber = document.getElementById("caNumber").value.trim();
  if (!itemId || !caNumber) {
    showToast("Selecione o item e informe o número do C.A!", false);
    return;
  }
  // PATCH para atualizar o campo ca_number do item
  const res = await fetch(`${apiBase}/items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ca_number: caNumber })
  });
  if (res.ok) {
    showToast("C.A salvo!", true);
    document.getElementById("formCA").reset();
    carregarTabelaCA();
  } else {
    showToast("Erro ao salvar C.A.", false);
  }
}

document.getElementById("formCA").addEventListener("submit", salvarCA);
carregarItens();
carregarTabelaCA();
