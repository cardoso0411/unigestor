// Autocomplete de matrícula dos funcionários
let cacheFuncionarios = [];
async function carregarFuncionariosAutocomplete() {
  const res = await fetch(`${apiBase}/employees`);
  cacheFuncionarios = await res.json();
}

function filtrarSugestoesMatricula(valor) {
  valor = valor.toLowerCase();
  return cacheFuncionarios.filter(f => f.registration.toLowerCase().includes(valor));
}

function renderSugestoesMatricula(lista) {
  const ul = document.getElementById('sugestoesMatricula');
  ul.innerHTML = '';
  if (!lista.length) {
    ul.style.display = 'none';
    return;
  }
  lista.forEach(f => {
    const li = document.createElement('li');
    li.textContent = `${f.registration} - ${f.name}`;
    li.style.padding = '6px 10px';
    li.style.cursor = 'pointer';
    li.onmousedown = () => {
      document.getElementById('matriculaEntrega').value = f.registration;
      ul.style.display = 'none';
    };
    ul.appendChild(li);
  });
  ul.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  carregarFuncionariosAutocomplete();
  const input = document.getElementById('matriculaEntrega');
  const ul = document.getElementById('sugestoesMatricula');
  if (input) {
    input.addEventListener('input', () => {
      const valor = input.value.trim();
      if (!valor) {
        ul.style.display = 'none';
        return;
      }
      const sugestoes = filtrarSugestoesMatricula(valor);
      renderSugestoesMatricula(sugestoes);
    });
    input.addEventListener('blur', () => {
      setTimeout(() => { ul.style.display = 'none'; }, 150);
    });
  }
});
// Modal de exclusão em massa
const modalExcluir = document.getElementById('modalExcluirEntregas');
const btnExcluirEntregas = document.getElementById('btnExcluirEntregas');
const btnCancelarExcluir = document.getElementById('btnCancelarExcluir');
const btnConfirmarExcluir = document.getElementById('btnConfirmarExcluir');
const selectExcluirItem = document.getElementById('selectExcluirItem');

if (btnExcluirEntregas) {
  btnExcluirEntregas.onclick = () => {
    selectExcluirItem.value = '';
    modalExcluir.style.display = 'flex';
  };
}
if (btnCancelarExcluir) {
  btnCancelarExcluir.onclick = () => {
    modalExcluir.style.display = 'none';
  };
}
if (btnConfirmarExcluir) {
  btnConfirmarExcluir.onclick = async () => {
    const item = selectExcluirItem.value;
    const matricula = document.getElementById('matriculaEntrega').value.trim();
    if (!matricula) {
      showToast('Digite a matrícula do funcionário para excluir entregas!', false);
      return;
    }
    if (!item) {
      showToast('Selecione um item para excluir!', false);
      return;
    }
    if (!confirm('Tem certeza que deseja excluir todas as entregas deste item para a matrícula informada?')) return;
    // Chamar backend para exclusão
    let url = `${apiBase}/deliveries?registration=${encodeURIComponent(matricula)}`;
    if (item !== 'todos') url += `&item=${encodeURIComponent(item)}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (res.ok) {
      showToast('Entregas excluídas com sucesso!', true);
      carregarEntregas();
    } else {
      showToast('Erro ao excluir entregas.', false);
    }
    modalExcluir.style.display = 'none';
  };
}
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
    showToast("✅ Funcionário cadastrado!", true);
    e.target.reset();
    carregarFuncionarios();
  } else {
    showToast("❌ Erro ao cadastrar funcionário.", false);
  }
});

// Registrar entrega para múltiplos itens
document.getElementById("formEntrega").addEventListener("submit", async (e) => {
  e.preventDefault();
  const matricula = document.getElementById("matriculaEntrega").value;
  const observation = document.getElementById("observation").value;
  const itensSelecionados = Array.from(document.querySelectorAll('#itensEntrega input[name="item"]:checked')).map(cb => cb.value);
  if (itensSelecionados.length === 0) {
    showToast("Selecione pelo menos um item!", false);
    return;
  }
  // Buscar funcionário pela matrícula
  const resFunc = await fetch(`${apiBase}/employees?registration=${encodeURIComponent(matricula)}`);
  const funcionarios = await resFunc.json();
  const funcionario = funcionarios[0];
  if (!funcionario) {
    showToast("Funcionário não encontrado!", false);
    return;
  }
  let sucesso = true;
  const resEntregas = await fetch(`${apiBase}/deliveries`);
  const entregas = await resEntregas.json();
  for (const item of itensSelecionados) {
    let mesesLimite = 0;
    let mensagem = "";
    if (item === "Sapato") {
      mesesLimite = 8;
      mensagem = "⚠️ O funcionário já recebeu o item Sapato em DATA e só pode pegar novamente após 8 meses. Deseja registrar mesmo assim?";
    } else if (item === "Camisa" || item === "Calça") {
      mesesLimite = 3;
      mensagem = `⚠️ O funcionário já recebeu o item ${item} em DATA e só pode pegar novamente após 3 meses. Deseja registrar mesmo assim?`;
    }
    if (mesesLimite > 0) {
      const entregasItem = entregas.filter(e => e.item === item && String(e.registration) === String(funcionario.registration));
      if (entregasItem.length > 0) {
        const ultima = entregasItem.reduce((a, b) => new Date(a.delivery_date) > new Date(b.delivery_date) ? a : b);
        const dataUltima = new Date(ultima.delivery_date);
        const agora = new Date();
        const diffMeses = (agora.getFullYear() - dataUltima.getFullYear()) * 12 + (agora.getMonth() - dataUltima.getMonth());
        if (diffMeses < mesesLimite) {
          const confirma = confirm(mensagem.replace("DATA", dataUltima.toLocaleDateString('pt-BR')));
          if (!confirma) continue;
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
    showToast("✅ Entrega(s) registrada(s)!", true);
    e.target.reset();
    carregarEntregas();
  } else {
    showToast("❌ Erro ao registrar uma ou mais entregas.", false);
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