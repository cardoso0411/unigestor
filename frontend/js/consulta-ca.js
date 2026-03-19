// Botão para limpar histórico
document.addEventListener('DOMContentLoaded', () => {
  const btnLimpar = document.getElementById('btnLimparHistoricoCA');
  if (btnLimpar) {
    btnLimpar.onclick = () => {
      if (confirm('Tem certeza que deseja apagar todo o histórico de consultas?')) {
        localStorage.removeItem('historicoCA');
        renderHistoricoCA();
      }
    };
  }
});
const apiBase = "http://localhost:3000/api";

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


    // Verifica vencimento
    let alerta = '';
    let validadeHtml = `<b>Validade:</b> ${data.validade}`;
    if (data.validade) {
      const partes = data.validade.split("/");
      let dataValidade;
      if (partes.length === 3) {
        // Formato esperado: dd/mm/yyyy
        dataValidade = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
        const hoje = new Date();
        if (dataValidade < hoje) {
          alerta = '<div style="color:#fff;background:#d32f2f;padding:8px 12px;border-radius:6px;margin-bottom:10px;font-weight:bold;">⚠️ ATENÇÃO: Este C.A está VENCIDO!</div>';
          validadeHtml = `<b>Validade:</b> <span style="color:#d32f2f;font-weight:bold;">${data.validade}</span>`;
        }
      }
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

    // Salva histórico no localStorage
    const historico = JSON.parse(localStorage.getItem('historicoCA') || '[]');
    historico.unshift({
      ca,
      equipamento: data.equipamento,
      empresa: data.empresa,
      validade: data.validade,
      dataConsulta: new Date().toLocaleString()
    });
    localStorage.setItem('historicoCA', JSON.stringify(historico.slice(0, 30)));
    renderHistoricoCA();


  } catch (err) {
    div.innerHTML = "❌ Erro ao consultar o site.";
  }
  renderHistoricoCA();
});

function renderHistoricoCA() {
  const historico = JSON.parse(localStorage.getItem('historicoCA') || '[]');
  const tbody = document.querySelector('#tabelaHistoricoCA tbody');
  tbody.innerHTML = '';
  historico.forEach(item => {
    // Verifica vencimento
    let vencido = false;
    let validadeHtml = item.validade || '';
    if (item.validade) {
      const partes = item.validade.split("/");
      if (partes.length === 3) {
        const dataValidade = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
        const hoje = new Date();
        if (dataValidade < hoje) {
          vencido = true;
        }
      }
    }
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.ca}</td>
      <td>${item.equipamento}</td>
      <td>${item.empresa}</td>
      <td style="${vencido ? 'background:#d32f2f;color:#fff;font-weight:bold;' : ''}">${validadeHtml}</td>
    `;
    tbody.appendChild(tr);
  });
}

window.addEventListener('DOMContentLoaded', renderHistoricoCA);