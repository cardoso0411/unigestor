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
    alert("Digite a matrícula!");
    return;
  }
  // Buscar funcionário pela matrícula
  const res = await fetch(`${apiBase}/employees?registration=${encodeURIComponent(matricula)}`);
  const funcionarios = await res.json();
  const funcionario = funcionarios[0];
  if (!funcionario) {
    alert("Funcionário não encontrado!");
    return;
  }
  if (!confirm(`Confirma excluir o funcionário ${funcionario.name} (${funcionario.registration})?`)) return;
  const resDel = await fetch(`${apiBase}/employees/${funcionario.id}`, { method: "DELETE" });
  if (resDel.ok) {
    alert("Funcionário excluído!");
    carregarFuncionarios();
    document.getElementById("matriculaExcluir").value = "";
  } else {
    alert("Erro ao excluir funcionário.");
  }
}

carregarFuncionarios();

// Verificar funcionários inativos há mais de 20 meses
async function verificarInativos() {
  const res = await fetch(`${apiBase}/inativos`);
  const inativos = await res.json();
  if (inativos.length === 0) {
    alert("Nenhum funcionário com mais de 20 meses sem entrega foi encontrado.");
    return;
  }
  let msg = "Funcionários inativos há mais de 20 meses:\n\n";
  inativos.forEach(f => {
    msg += `- ${f.name} (Matrícula: ${f.registration}) – Última entrega: ${f.last_delivery ? new Date(f.last_delivery).toLocaleDateString() : 'Nunca'}\n`;
  });
  alert(msg);
}