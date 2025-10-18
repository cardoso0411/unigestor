const apiBase = "http://localhost:3000/api";

async function carregarMovimentacoes() {
  const res = await fetch(`${apiBase}/movements`);
  const dados = await res.json();

  const tbody = document.querySelector("#tabelaMov tbody");
  tbody.innerHTML = "";

  dados.forEach((mov) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${mov.item_name}</td>
      <td>${mov.type}</td>
      <td>${mov.quantity}</td>
      <td>${mov.performed_by || "-"}</td>
      <td>${new Date(mov.performed_at).toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById("formMov").addEventListener("submit", async (e) => {
  e.preventDefault();

  const movimento = {
    item_id: parseInt(document.getElementById("item_id").value),
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
  } else {
    alert("❌ Erro ao registrar movimentação.");
  }
});

carregarMovimentacoes();
