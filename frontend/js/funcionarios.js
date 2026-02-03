const apiBase = "http://localhost:3000/api/uniformes";

async function carregarFuncionarios() {
  const res = await fetch(`${apiBase}/employees`);
  const funcionarios = await res.json();
  const tbody = document.querySelector("#tabelaFuncionarios tbody");
  tbody.innerHTML = "";
  funcionarios.forEach(f => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${f.registration}</td>
      <td>${f.name}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function excluirFuncionarioPorMatricula() {
  const matricula = document.getElementById("matriculaExcluir").value.trim();
  if (!matricula) {
    showToast("Digite a matrícula!", false);
    return;
  }
  // Buscar funcionário pela matrícula
  const res = await fetch(`${apiBase}/employees?registration=${encodeURIComponent(matricula)}`);
  const funcionarios = await res.json();
  const funcionario = funcionarios[0];
  if (!funcionario) {
    showToast("Funcionário não encontrado!", false);
    return;
  }
  if (!confirm(`Confirma excluir o funcionário ${funcionario.name} (${funcionario.registration})?`)) return;
  const resDel = await fetch(`${apiBase}/employees/${funcionario.id}`, { method: "DELETE" });
  if (resDel.ok) {
    showToast("Funcionário excluído!", true);
    carregarFuncionarios();
    document.getElementById("matriculaExcluir").value = "";
  } else {
    showToast("Erro ao excluir funcionário.", false);
  }
}

carregarFuncionarios();

// Verificar funcionários inativos há mais de 20 meses
async function verificarInativos() {
  const res = await fetch(`${apiBase}/inativos`);
  const inativos = await res.json();
  if (inativos.length === 0) {
    showToast("Nenhum funcionário com mais de 20 meses sem entrega foi encontrado.", false);
    return;
  }
  let msg = "Funcionários inativos há mais de 20 meses:\n\n";
  inativos.forEach(f => {
    msg += `- ${f.name} (Matrícula: ${f.registration}) – Última entrega: ${f.last_delivery ? new Date(f.last_delivery).toLocaleDateString() : 'Nunca'}\n`;
  });
  showToast(msg, true);
}

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
    showToast("✅ Funcionário cadastrado!", true);
    e.target.reset();
    carregarFuncionarios();
  } else {
    showToast("❌ Erro ao cadastrar funcionário.", false);
  }
});