// Autocomplete de matrícula dos funcionários
let cacheFuncionarios = [];
let sugestaoIndexMatricula = -1;
async function carregarFuncionariosAutocomplete() {
  // Busca as matriculas disponiveis para facilitar o preenchimento do formulario.
  const res = await fetch(`${apiBase}/employees`);
  cacheFuncionarios = await res.json();
}

function filtrarSugestoesMatricula(valor) {
  valor = valor.toLowerCase();
  return cacheFuncionarios.filter(f => f.registration.toLowerCase().includes(valor));
}

function renderSugestoesMatricula(lista) {
  // Desenha as sugestoes do autocomplete usando elementos <li>.
  const ul = document.getElementById('sugestoesMatricula');
  ul.innerHTML = '';
  if (!lista.length) {
    ul.style.display = 'none';
    sugestaoIndexMatricula = -1;
    return;
  }
  lista.forEach((f, idx) => {
    const li = document.createElement('li');
    li.textContent = `${f.registration} - ${f.name}`;
    li.style.padding = '6px 10px';
    li.style.cursor = 'pointer';
    li.dataset.index = String(idx);
    li.onmousedown = () => {
      document.getElementById('matriculaEntrega').value = f.registration;
      ul.style.display = 'none';
      sugestaoIndexMatricula = -1;
    };
    ul.appendChild(li);
  });
  sugestaoIndexMatricula = -1;
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
        sugestaoIndexMatricula = -1;
        return;
      }
      const sugestoes = filtrarSugestoesMatricula(valor);
      renderSugestoesMatricula(sugestoes);
    });
    input.addEventListener('keydown', (e) => {
      if (ul.style.display === 'none') return;
      const itens = Array.from(ul.querySelectorAll('li'));
      if (!itens.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        sugestaoIndexMatricula = (sugestaoIndexMatricula + 1) % itens.length;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        sugestaoIndexMatricula = (sugestaoIndexMatricula - 1 + itens.length) % itens.length;
      } else if (e.key === 'Enter') {
        if (sugestaoIndexMatricula >= 0 && itens[sugestaoIndexMatricula]) {
          e.preventDefault();
          itens[sugestaoIndexMatricula].dispatchEvent(new Event('mousedown'));
        }
        return;
      } else {
        return;
      }
      itens.forEach((li, i) => li.classList.toggle('active', i === sugestaoIndexMatricula));
      itens[sugestaoIndexMatricula].scrollIntoView({ block: 'nearest' });
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
    // Monta a exclusao em massa com base na matricula e no item escolhidos.
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
// Modal de registro com seleção de itens
const modalRegistrar = document.getElementById('modalRegistrarEntrega');
const btnRegistrarEntrega = document.getElementById('btnRegistrarEntrega');
const btnCancelarRegistrar = document.getElementById('btnCancelarRegistrar');
const btnConfirmarRegistrar = document.getElementById('btnConfirmarRegistrar');
const checkTodosItens = document.getElementById('checkTodosItens');
const checksItens = Array.from(document.querySelectorAll('.check-item-registrar'));

function atualizarEstiloOpcao(input) {
  // Altera o visual do label quando a opcao foi marcada ou desmarcada.
  const label = input.closest("label");
  if (!label) return;
  if (input.checked) {
    label.classList.add("selected");
  } else {
    label.classList.remove("selected");
  }
}

function resetarSelecaoItens() {
  // Limpa o modal para evitar reaproveitar selecoes antigas.
  if (checkTodosItens) checkTodosItens.checked = false;
  checksItens.forEach(cb => {
    cb.checked = false;
    cb.disabled = false;
    atualizarEstiloOpcao(cb);
  });
  if (checkTodosItens) atualizarEstiloOpcao(checkTodosItens);
  const obs = document.getElementById("observation");
  if (obs) obs.value = "";
}

function abrirModalRegistrar() {
  // Impede abrir o modal sem uma matricula valida informada.
  const matricula = document.getElementById("matriculaEntrega").value.trim();
  if (!matricula) {
    showToast("Digite uma matrícula para registrar alguns itens!", false);
    return;
  }
  resetarSelecaoItens();
  if (modalRegistrar) modalRegistrar.style.display = 'flex';
}

if (btnRegistrarEntrega) {
  btnRegistrarEntrega.onclick = abrirModalRegistrar;
}

if (btnCancelarRegistrar) {
  btnCancelarRegistrar.onclick = () => {
    if (modalRegistrar) modalRegistrar.style.display = 'none';
  };
}

if (checkTodosItens) {
  checkTodosItens.addEventListener('change', () => {
    const marcado = checkTodosItens.checked;
    checksItens.forEach(cb => {
      cb.checked = marcado;
      cb.disabled = marcado;
      atualizarEstiloOpcao(cb);
    });
    atualizarEstiloOpcao(checkTodosItens);
  });
}

checksItens.forEach(cb => {
  cb.addEventListener('change', () => {
    atualizarEstiloOpcao(cb);
    if (!checkTodosItens) return;
    const todosMarcados = checksItens.every(x => x.checked);
    if (todosMarcados) {
      checkTodosItens.checked = true;
      checksItens.forEach(x => { x.disabled = true; });
      atualizarEstiloOpcao(checkTodosItens);
    } else {
      checkTodosItens.checked = false;
      checksItens.forEach(x => { x.disabled = false; });
      atualizarEstiloOpcao(checkTodosItens);
    }
  });
});

if (btnConfirmarRegistrar) {
  btnConfirmarRegistrar.onclick = async () => {
    const itensSelecionados = checkTodosItens?.checked
      ? ["Camisa", "Calça", "Sapato"]
      : checksItens.filter(cb => cb.checked).map(cb => cb.value);
    if (itensSelecionados.length === 0) {
      showToast("Selecione pelo menos um item!", false);
      return;
    }
    const ok = await registrarEntrega(itensSelecionados);
    if (ok && modalRegistrar) modalRegistrar.style.display = 'none';
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
async function registrarEntrega(itensSelecionados) {
  const matricula = document.getElementById("matriculaEntrega").value;
  const observation = document.getElementById("observation").value;
  // Buscar funcionário pela matrícula
  const resFunc = await fetch(`${apiBase}/employees?registration=${encodeURIComponent(matricula)}`);
  const funcionarios = await resFunc.json();
  const funcionario = funcionarios[0];
  if (!funcionario) {
    showToast("Funcionário não encontrado!", false);
    return false;
  }
  let sucesso = true;
  const resEntregas = await fetch(`${apiBase}/deliveries`);
  const entregas = await resEntregas.json();
  for (const item of itensSelecionados) {
    // Antes de registrar, valida o prazo minimo entre entregas do mesmo item.
    let mesesLimite = 0;
    let mensagem = "";
    if (item === "Sapato") {
      mesesLimite = 8;
      mensagem = "⚠️ O funcionário já recebeu o item Sapato em DATA e só pode pegar novamente após 8 meses. Deseja registrar mesmo assim?";
    } else if (item === "Camisa" || item === "Calça") {
      mesesLimite = 5;
      mensagem = `⚠️ O funcionário já recebeu o item ${item} em DATA e só pode pegar novamente após 5 meses. Deseja registrar mesmo assim?`;
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
    document.getElementById("formEntrega").reset();
    carregarEntregas();
  } else {
    showToast("❌ Erro ao registrar uma ou mais entregas.", false);
  }
  return sucesso;
}

document.getElementById("formEntrega").addEventListener("submit", (e) => {
  e.preventDefault();
  abrirModalRegistrar();
});

// Listar entregas com filtros
async function carregarEntregas() {
  // Carrega o historico de entregas e aplica os filtros atuais da tela.
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
      const raw = String(ent.delivery_date || "");
      // Se vier apenas a data (YYYY-MM-DD), evita conversão com fuso
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return raw === filtroData;
      }
      const dataEntrega = new Date(raw);
      if (Number.isNaN(dataEntrega.getTime())) return false;
      const yyyy = dataEntrega.getFullYear();
      const mm = String(dataEntrega.getMonth() + 1).padStart(2, '0');
      const dd = String(dataEntrega.getDate()).padStart(2, '0');
      const dataEntregaLocal = `${yyyy}-${mm}-${dd}`;
      return dataEntregaLocal === filtroData;
    });
  }

  const tbody = document.querySelector("#tabelaUniformes tbody");
  tbody.innerHTML = "";

  if (entregas.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" style="text-align:center;color:#6b7280;padding:12px;">Nenhum registro encontrado para o filtro selecionado.</td>`;
    tbody.appendChild(tr);
    return;
  }

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

document.addEventListener("keydown", (e) => {
  if (!(e.ctrlKey && e.key.toLowerCase() === "x")) return;
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  const input = document.getElementById("matriculaEntrega");
  if (input) {
    input.focus();
    input.select();
  }
});

