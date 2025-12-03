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
    if (item === "Sapato") {
      // Busca todas as entregas e filtra por funcionário e item
      const resEntregas = await fetch(`${apiBase}/deliveries`);
      const entregas = await resEntregas.json();
      const entregasSapato = entregas.filter(e => e.item === "Sapato" && String(e.registration) === String(funcionario.registration));
      if (entregasSapato.length > 0) {
        // Verifica se última entrega foi há menos de 8 meses
        const ultima = entregasSapato.reduce((a, b) => new Date(a.delivery_date) > new Date(b.delivery_date) ? a : b);
        const dataUltima = new Date(ultima.delivery_date);
        const agora = new Date();
        const diffMeses = (agora.getFullYear() - dataUltima.getFullYear()) * 12 + (agora.getMonth() - dataUltima.getMonth());
        if (diffMeses < 8) {
          const confirma = confirm(`⚠️ O funcionário já recebeu o item Sapato em ${dataUltima.toLocaleDateString('pt-BR')} e só pode pegar novamente após 8 meses. Deseja registrar mesmo assim?`);
          if (!confirma) continue; // pula registro
        }
      }
    }
    // Registro normal
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

// Listar entregas com filtros
async function carregarEntregas() {
  const res = await fetch(`${apiBase}/deliveries`);
  let entregas = await res.json();

  // Filtros
  const filtroItem = document.getElementById('filtroItem')?.value || '';
  const filtroData = document.getElementById('filtroData')?.value || '';
  if (filtroItem) {
    entregas = entregas.filter(ent => ent.item === filtroItem);
  }
  if (filtroData) {
    entregas = entregas.filter(ent => {
      const dataEntrega = new Date(ent.delivery_date);
      const dataFiltro = new Date(filtroData);
      // compara apenas ano, mês e dia
      return dataEntrega.getFullYear() === dataFiltro.getFullYear() &&
             dataEntrega.getMonth() === dataFiltro.getMonth() &&
             dataEntrega.getDate() === dataFiltro.getDate();
    });
  }

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

// Eventos dos filtros
document.getElementById('filtroItem')?.addEventListener('change', carregarEntregas);
document.getElementById('filtroData')?.addEventListener('change', carregarEntregas);
document.getElementById('btnLimparFiltros')?.addEventListener('click', () => {
  document.getElementById('filtroItem').value = '';
  document.getElementById('filtroData').value = '';
  carregarEntregas();
});

// Inicialização
carregarEntregas();