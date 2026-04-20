const DAY_MS = 24 * 60 * 60 * 1000;
const ALERTA_CA_DIAS = 30;

function parseValidadeCA(validade) {
  // Converte a validade do formato brasileiro para um objeto Date.
  if (!validade) return null;
  const partes = validade.split("/");
  if (partes.length !== 3) return null;
  const d = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
  return isNaN(d) ? null : d;
}

function formatarDiasParaVencer(dias) {
  // Transforma um numero de dias em texto mais amigavel para a tela.
  const vencido = dias < 0;
  const diasAbs = Math.abs(dias);
  if (diasAbs > 24 * 30) {
    const anos = Math.max(1, Math.round(diasAbs / 365));
    const unidade = anos === 1 ? "ano" : "anos";
    return vencido ? `Vencido há ${anos} ${unidade}` : `${anos} ${unidade}`;
  }
  if (diasAbs > 180) {
    const meses = Math.max(1, Math.round(diasAbs / 30));
    const unidade = meses === 1 ? "mês" : "meses";
    return vencido ? `Vencido há ${meses} ${unidade}` : `${meses} ${unidade}`;
  }
  const unidade = diasAbs === 1 ? "dia" : "dias";
  return vencido ? `Vencido há ${diasAbs} ${unidade}` : `${diasAbs} ${unidade}`;
}

function carregarCAVencendo() {
  // Mostra apenas os CAs vencidos ou que vencem em breve.
  const tbody = document.querySelector("#tabelaCAVencendo tbody");
  tbody.innerHTML = "";

  let historico = [];
  try {
    historico = JSON.parse(localStorage.getItem("historicoCA") || "[]");
  } catch {
    historico = [];
  }

  const hoje = new Date();
  let adicionados = 0;

  historico.forEach(item => {
    const validade = item.validade;
    const dataVal = parseValidadeCA(validade);
    if (!dataVal) return;
    const dias = Math.floor((dataVal.getTime() - hoje.getTime()) / DAY_MS);
    if (dias > ALERTA_CA_DIAS) return;

    const status = dias < 0 ? "Vencido" : `Vence em ${dias} dias`;
    let statusStyle = "";
    if (dias < 0) {
      statusStyle = "color:#d32f2f;font-weight:bold;";
    } else {
      statusStyle = "color:#f59e0b;font-weight:bold;";
    }
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.ca}</td>
      <td class="col-ca-equipamento">${item.equipamento || "-"}</td>
      <td class="col-ca-empresa">${item.empresa || "-"}</td>
      <td class="col-ca-validade">${validade || "-"}</td>
      <td class="col-dias-vencer">${formatarDiasParaVencer(dias)}</td>
      <td style="${statusStyle}">${status}</td>
    `;
    tbody.appendChild(tr);
    adicionados += 1;
  });

  if (adicionados === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="6">Nenhum CA vencendo nos proximos ${ALERTA_CA_DIAS} dias.</td>`;
    tbody.appendChild(tr);
  }
}

carregarCAVencendo();

