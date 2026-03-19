const apiBase = "http://localhost:3000/api";
const DAY_MS = 24 * 60 * 60 * 1000;
const PREVISAO_JANELA_DIAS = 90;
const PREVISAO_ALERTA_DIAS = 30;
const MIN_MEDIA_DIA = 0.01;

function parseMovDate(m) {
  const d = new Date(m.performed_at || m.date || m.created_at);
  return isNaN(d) ? null : d;
}

function formatarEstimativa(dias) {
  if (dias > 24 * 30) {
    const anos = Math.max(1, Math.round(dias / 365));
    const unidade = anos === 1 ? "ano" : "anos";
    return { valor: `${anos} ${unidade}`, texto: `Estoque acabara em aproximadamente ${anos} ${unidade}` };
  }
  if (dias > PREVISAO_JANELA_DIAS) {
    const meses = Math.max(1, Math.round(dias / 30));
    const unidade = meses === 1 ? "mês" : "meses";
    return { valor: `${meses} ${unidade}`, texto: `Estoque acabara em aproximadamente ${meses} ${unidade}` };
  }
  const diasArred = Math.round(dias);
  const unidade = diasArred === 1 ? "dia" : "dias";
  return { valor: `${diasArred} ${unidade}`, texto: `Estoque acabara em aproximadamente ${diasArred} ${unidade}` };
}

async function carregarPrevisaoEstoque() {
  const [resItens, resMovs] = await Promise.all([
    fetch(`${apiBase}/items`),
    fetch(`${apiBase}/movements`)
  ]);

  const itens = await resItens.json();
  const movs = await resMovs.json();
  const tbody = document.querySelector("#tabelaPrevisaoEstoque tbody");
  tbody.innerHTML = "";

  const agora = new Date();
  const inicio = new Date(agora.getTime() - PREVISAO_JANELA_DIAS * DAY_MS);

  const saidas = movs.filter(m => m.type === "OUT").filter(m => {
    const d = parseMovDate(m);
    return d && d >= inicio;
  });

  const totalPorItem = {};
  saidas.forEach(m => {
    const id = String(m.item_id);
    totalPorItem[id] = (totalPorItem[id] || 0) + Number(m.quantity || 0);
  });

  let adicionados = 0;

  itens.forEach(item => {
    const total = totalPorItem[String(item.id)] || 0;
    if (total <= 0) return;

    const mediaMensal = total / (PREVISAO_JANELA_DIAS / 30);
    const mediaDia = total / PREVISAO_JANELA_DIAS;
    if (mediaDia <= 0) return;

    const dias = Number(item.quantity || 0) / mediaDia;
    let estimativa;
    let alerta;
    let alertaStyle = "";
    if (mediaDia < MIN_MEDIA_DIA) {
      estimativa = { valor: "Sem consumo suficiente", texto: "Sem consumo suficiente para estimar" };
      alerta = estimativa.texto;
    } else {
      estimativa = formatarEstimativa(dias);
      alerta = dias <= PREVISAO_ALERTA_DIAS
        ? `⚠ ${estimativa.texto}`
        : estimativa.texto;
      if (dias <= PREVISAO_ALERTA_DIAS) alertaStyle = "color:#d32f2f;font-weight:bold;";
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="col-item-previsao">${item.name}</td>
      <td class="col-consumo-mensal">${Math.round(mediaMensal)}</td>
      <td class="col-estoque-atual">${item.quantity}</td>
      <td class="col-dias-estimados">${estimativa.valor}</td>
      <td class="col-alerta-previsao" style="${alertaStyle}">${alerta}</td>
    `;
    tbody.appendChild(tr);
    adicionados += 1;
  });

  if (adicionados === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5">Sem dados suficientes para previsao.</td>`;
    tbody.appendChild(tr);
  }
}

carregarPrevisaoEstoque();
