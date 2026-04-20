const apiBase = "http://localhost:3000/api/uniformes";

async function carregarFuncionarios() {
  // Lista todos os funcionarios cadastrados no modulo de uniformes.
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
  // Faz a exclusao em duas etapas: busca por matricula e depois remove pelo id.
  const matricula = document.getElementById("matriculaExcluir").value.trim();
  if (!matricula) {
    showToast("Digite a matrÃ­cula!", false);
    return;
  }
  // Buscar funcionÃ¡rio pela matrÃ­cula
  const res = await fetch(`${apiBase}/employees?registration=${encodeURIComponent(matricula)}`);
  const funcionarios = await res.json();
  const funcionario = funcionarios[0];
  if (!funcionario) {
    showToast("FuncionÃ¡rio nÃ£o encontrado!", false);
    return;
  }
  if (!confirm(`Confirma excluir o funcionÃ¡rio ${funcionario.name} (${funcionario.registration})?`)) return;
  const resDel = await fetch(`${apiBase}/employees/${funcionario.id}`, { method: "DELETE" });
  if (resDel.ok) {
    showToast("FuncionÃ¡rio excluÃ­do!", true);
    carregarFuncionarios();
    document.getElementById("matriculaExcluir").value = "";
  } else {
    showToast("Erro ao excluir funcionÃ¡rio.", false);
  }
}

carregarFuncionarios();

// Verificar funcionÃ¡rios inativos hÃ¡ mais de 20 meses
async function verificarInativos() {
  // Consulta quem esta ha muito tempo sem receber uniforme.
  const res = await fetch(`${apiBase}/inativos`);
  const inativos = await res.json();
  if (inativos.length === 0) {
    showToast("Nenhum funcionÃ¡rio com mais de 20 meses sem entrega foi encontrado.", false);
    return;
  }
  let msg = "FuncionÃ¡rios inativos hÃ¡ mais de 20 meses:\n\n";
  inativos.forEach(f => {
    msg += `- ${f.name} (MatrÃ­cula: ${f.registration}) â€“ Ãšltima entrega: ${f.last_delivery ? new Date(f.last_delivery).toLocaleDateString() : 'Nunca'}\n`;
  });
  showToast(msg, true);
}

// Cadastrar funcionÃ¡rio
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
    showToast("âœ… FuncionÃ¡rio cadastrado!", true);
    e.target.reset();
    carregarFuncionarios();
  } else {
    showToast("âŒ Erro ao cadastrar funcionÃ¡rio.", false);
  }
});
