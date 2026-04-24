const apiBase = "http://localhost:3000/api";

function parseValidadeCA(valor) {
  if (!valor) return null;
  const texto = String(valor).trim();
  const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;

  const dia = Number(match[1]);
  const mes = Number(match[2]);
  const ano = Number(match[3]);
  const data = new Date(ano, mes - 1, dia);
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) return null;

  data.setHours(0, 0, 0, 0);
  return data;
}

function formatarDataValidade(valor) {
  const data = parseValidadeCA(valor);
  if (!data) return valor || "";
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function isCAVencido(validade) {
  const dataValidade = parseValidadeCA(validade);
  if (!dataValidade) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return dataValidade < hoje;
}

function getHistoricoCA() {
  return JSON.parse(localStorage.getItem("historicoCA") || "[]");
}

function setHistoricoCA(historico) {
  localStorage.setItem("historicoCA", JSON.stringify(historico));
}

function preencherSelectConsultaExcluir() {
  const select = document.getElementById("selectConsultaExcluir");
  if (!select) return;

  const historico = getHistoricoCA();
  select.innerHTML = "";

  historico.forEach((item, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    const ca = item.ca || "-";
    const equipamento = item.equipamento || "-";
    const dataConsulta = item.dataConsulta || "";
    option.textContent = `CA ${ca} | ${equipamento}${dataConsulta ? ` | ${dataConsulta}` : ""}`;
    select.appendChild(option);
  });
}

function obterModoExclusaoHistoricoCA() {
  const selecionado = document.querySelector('input[name="modoExclusaoHistoricoCA"]:checked');
  return selecionado?.value || "todas";
}

function atualizarEstadoSelecaoExclusaoCA() {
  const select = document.getElementById("selectConsultaExcluir");
  if (!select) return;

  const historico = getHistoricoCA();
  const modo = obterModoExclusaoHistoricoCA();
  select.disabled = modo !== "uma" || historico.length === 0;
}

function abrirModalLimparHistoricoCA() {
  const modal = document.getElementById("modalLimparHistoricoCA");
  if (!modal) return;

  preencherSelectConsultaExcluir();
  const radioTodas = document.querySelector('input[name="modoExclusaoHistoricoCA"][value="todas"]');
  if (radioTodas) radioTodas.checked = true;
  atualizarEstadoSelecaoExclusaoCA();

  modal.classList.add("ativo");
  modal.setAttribute("aria-hidden", "false");
}

function fecharModalLimparHistoricoCA() {
  const modal = document.getElementById("modalLimparHistoricoCA");
  if (!modal) return;

  modal.classList.remove("ativo");
  modal.setAttribute("aria-hidden", "true");
}

function confirmarLimpezaHistoricoCA() {
  const historico = getHistoricoCA();
  if (historico.length === 0) {
    alert("Não há consultas no histórico.");
    fecharModalLimparHistoricoCA();
    return;
  }

  const modo = obterModoExclusaoHistoricoCA();

  if (modo === "todas") {
    if (!confirm("Tem certeza que deseja excluir todas as consultas do histórico?")) return;
    localStorage.removeItem("historicoCA");
    renderHistoricoCA();
    fecharModalLimparHistoricoCA();
    return;
  }

  const select = document.getElementById("selectConsultaExcluir");
  const indexSelecionado = Number(select?.value);
  if (Number.isNaN(indexSelecionado) || indexSelecionado < 0 || indexSelecionado >= historico.length) {
    alert("Selecione uma consulta para excluir.");
    return;
  }

  const item = historico[indexSelecionado];
  const descricao = `CA ${item?.ca || "-"}${item?.equipamento ? ` - ${item.equipamento}` : ""}`;
  if (!confirm(`Deseja excluir a consulta: ${descricao}?`)) return;

  historico.splice(indexSelecionado, 1);
  if (historico.length > 0) {
    setHistoricoCA(historico);
  } else {
    localStorage.removeItem("historicoCA");
  }

  renderHistoricoCA();
  fecharModalLimparHistoricoCA();
}

document.getElementById("formConsultaCA").addEventListener("submit", async (e) => {
  e.preventDefault();

  const ca = document.getElementById("numeroCA").value.trim();
  const div = document.getElementById("resultadoCA");

  div.innerHTML = "⏳ Consultando no site oficial, aguarde...";

  try {
    const res = await fetch(`${apiBase}/ca/consultar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ca })
    });

    const data = await res.json();

    if (!res.ok) {
      div.innerHTML = "❌ " + data.error;
      return;
    }

    let alerta = "";
    const validadeExibicao = formatarDataValidade(data.validade);
    let validadeHtml = `<b>Validade:</b> ${validadeExibicao}`;
    if (isCAVencido(data.validade)) {
      alerta = '<div style="color:#fff;background:#d32f2f;padding:8px 12px;border-radius:6px;margin-bottom:10px;font-weight:bold;">⚠️ ATENÇÃO: Este C.A está VENCIDO!</div>';
      validadeHtml = `<b>Validade:</b> <span style="color:#d32f2f;font-weight:bold;">${validadeExibicao}</span>`;
    }

    div.innerHTML = `
      <h3>Resultado do C.A</h3>
      ${alerta}
      <p><b>Equipamento:</b> ${data.equipamento}</p>
      <p><b>Descrição:</b> ${data.descricao}</p>
      <p><b>Aprovado para:</b> ${data.aprovado_para}</p>
      <p><b>Empresa:</b> ${data.empresa} (${data.cnpj})</p>
      <p>${validadeHtml}</p>
    `;

    const historico = getHistoricoCA();
    historico.unshift({
      ca,
      equipamento: data.equipamento,
      empresa: data.empresa,
      validade: formatarDataValidade(data.validade),
      dataConsulta: new Date().toLocaleString()
    });
    setHistoricoCA(historico.slice(0, 30));
    renderHistoricoCA();
  } catch (err) {
    div.innerHTML = "❌ Erro ao consultar o site.";
  }

  renderHistoricoCA();
});

function renderHistoricoCA() {
  const historico = getHistoricoCA();
  const tbody = document.querySelector("#tabelaHistoricoCA tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  historico.forEach((item) => {
    const vencido = isCAVencido(item.validade);
    const validadeHtml = formatarDataValidade(item.validade);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.ca}</td>
      <td>${item.equipamento}</td>
      <td>${item.empresa}</td>
      <td style="${vencido ? "background:#d32f2f;color:#fff;font-weight:bold;" : ""}">${validadeHtml}</td>
    `;
    tbody.appendChild(tr);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  const btnLimpar = document.getElementById("btnLimparHistoricoCA");
  const btnCancelar = document.getElementById("btnCancelarLimparHistoricoCA");
  const btnConfirmar = document.getElementById("btnConfirmarLimparHistoricoCA");
  const modal = document.getElementById("modalLimparHistoricoCA");
  const radiosModo = document.querySelectorAll('input[name="modoExclusaoHistoricoCA"]');

  btnLimpar?.addEventListener("click", abrirModalLimparHistoricoCA);
  btnCancelar?.addEventListener("click", fecharModalLimparHistoricoCA);
  btnConfirmar?.addEventListener("click", confirmarLimpezaHistoricoCA);
  radiosModo.forEach((radio) => {
    radio.addEventListener("change", atualizarEstadoSelecaoExclusaoCA);
  });

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) fecharModalLimparHistoricoCA();
  });

  renderHistoricoCA();
});
