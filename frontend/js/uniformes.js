const apiBase = "http://localhost:3000/api/uniformes";

// Cadastrar funcionário
document.getElementById("formFuncionario").addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    registration: document.getElementById("registration").value,
    name: document.getElementById("name").value
  };
  const res = await fetch(`${apiBase}/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (res.ok) {
    alert("✅ Funcionário cadastrado!");
    e.target.reset();
    carregarFuncionarios();
  } else {
    alert("❌ Erro ao cadastrar funcionário.");
  }
});

// Registrar entrega para múltiplos itens
document.getElementById("formEntrega").addEventListener("submit", async (e) => {
  e.preventDefault();
  const matricula = document.getElementById("matriculaEntrega").value;
  const observation = document.getElementById("observation").value;
  const itensSelecionados = Array.from(document.querySelectorAll('#itensEntrega input[name="item"]:checked')).map(cb => cb.value);
  if (itensSelecionados.length === 0) {
    alert("Selecione pelo menos um item!");
    return;
  }
  // Buscar funcionário pela matrícula
  const resFunc = await fetch(`${apiBase}/employees?registration=${encodeURIComponent(matricula)}`);
  const funcionarios = await resFunc.json();
  const funcionario = funcionarios[0];
  if (!funcionario) {
    alert("Funcionário não encontrado!");
    return;
  }
  let sucesso = true;
  for (const item of itensSelecionados) {
    const data = {
      employee_id: funcionario.id,
      item,
      observation
    };
    const res = await fetch(`${apiBase}/deliveries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) sucesso = false;
  }
  if (sucesso) {
    alert("✅ Entrega(s) registrada(s)!");
    e.target.reset();
    carregarEntregas();
  } else {
    alert("❌ Erro ao registrar uma ou mais entregas.");
  }
});

// Listar entregas
async function carregarEntregas() {
  const res = await fetch(`${apiBase}/deliveries`);
  const entregas = await res.json();

  const tbody = document.querySelector("#tabelaUniformes tbody");
  tbody.innerHTML = "";

  entregas.forEach(ent => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ent.employee_name}</td>
      <td>${ent.registration}</td>
      <td>${ent.item}</td>
      <td>${new Date(ent.delivery_date).toLocaleDateString()}</td>
      <td>${ent.observation || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}
carregarEntregas();