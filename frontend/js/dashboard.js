// Script da pagina inicial do sistema.
// Reune dados do backend e monta indicadores, alertas e resumos para o usuario.
// Funções utilitárias usadas para montar os indicadores do dashboard.
const apiBase = "http://localhost:3000/api";
const DAY_MS = 24 * 60 * 60 * 1000;
const ALERTA_CA_DIAS = 30;
const ALERTA_PARADO_DIAS = 180;
const PREVISAO_JANELA_DIAS = 180;
const PREVISAO_ALERTA_DIAS = 30;
const CA_CACHE_DIAS = 7;
const DIA_LEMBRETE_BACKUP = 5; // sexta-feira
const UNIFORME_LIMITES_MESES = {
  Sapato: 8,
  Camisa: 5,
  "Calça": 5
};

function parseDateSafe(value) {
  // Converte um valor em Date e devolve null quando a data e invalida.
  const d = new Date(value);
  return isNaN(d) ? null : d;
}

function parseMovDate(m) {
  // Tenta ler a data da movimentacao usando mais de um nome de campo possivel.
  return parseDateSafe(m.performed_at || m.date || m.created_at);
}

function parseValidadeCA(validade) {
  if (!validade) return null;
  const texto = String(validade).trim();
  const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  const dia = Number(match[1]);
  const mes = Number(match[2]);
  const ano = Number(match[3]);
  const d = new Date(ano, mes - 1, dia);
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function getCaCache() {
  // localStorage guarda dados no navegador mesmo depois de fechar a pagina.
  try {
    return JSON.parse(localStorage.getItem("caCache") || "{}");
  } catch {
    return {};
  }
}

function setCaCache(cache) {
  localStorage.setItem("caCache", JSON.stringify(cache));
}

function getCachedValidadeCA(ca) {
  const cache = getCaCache();
  const cached = cache[ca];
  if (cached && cached.fetchedAt) {
    const idadeDias = (Date.now() - cached.fetchedAt) / DAY_MS;
    if (idadeDias <= CA_CACHE_DIAS && cached.validade) return cached.validade;
  }
  try {
    const historico = JSON.parse(localStorage.getItem("historicoCA") || "[]");
    const item = historico.find(h => String(h.ca) === String(ca) && h.validade);
    if (item && item.validade) {
      cache[ca] = { validade: item.validade, fetchedAt: Date.now() };
      setCaCache(cache);
      return item.validade;
    }
  } catch {
    return null;
  }
  return null;
}

async function consultarCA(ca) {
  // fetch chama o backend sem precisar recarregar a pagina.
  try {
    const res = await fetch(`${apiBase}/ca/consultar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ca })
    });
    const data = await res.json();
    if (!res.ok) return null;
    const cache = getCaCache();
    cache[ca] = { validade: data.validade || null, fetchedAt: Date.now() };
    setCaCache(cache);
    return data.validade || null;
  } catch {
    return null;
  }
}

async function obterValidadeCA(ca) {
  const cached = getCachedValidadeCA(ca);
  if (cached) return cached;
  return consultarCA(ca);
}

async function carregarDashboard() {
  // Promise.all dispara varias requisicoes em paralelo para ganhar desempenho.
  const [resItens, resMovs, resEntregas, resFuncionarios] = await Promise.all([
    fetch(`${apiBase}/items`),
    fetch(`${apiBase}/movements`),
    fetch(`${apiBase}/uniformes/deliveries`),
    fetch(`${apiBase}/uniformes/employees`)
  ]);

  const itens = await resItens.json();
  const movs = await resMovs.json();
  const entregas = await resEntregas.json();
  const funcionarios = await resFuncionarios.json();

  document.getElementById("totalItens").innerText = itens.length;
  const baixoEstoque = itens.filter(i => i.quantity < i.min_stock_level).length;
  const elBaixo = document.getElementById("itensBaixoEstoque");
  if (elBaixo) elBaixo.innerText = baixoEstoque;

  // Indicador de itens adequados
  const adequados = itens.length - baixoEstoque;
  document.getElementById("itensAdequados").innerText = adequados;
  const proporcao = itens.length > 0 ? Math.round((adequados / itens.length) * 100) : 0;
  document.getElementById("proporcaoAdequados").innerText = proporcao + "%";

  // Preenche select de resumo
  const select = document.getElementById('selectItemResumo');
  if (select) {
    // Limpa e adiciona opções.
    select.innerHTML = '<option value="">- selecione -</option>';
    itens.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = `${item.code} - ${item.name}`;
      select.appendChild(opt);
    });
    select.addEventListener('change', () => {
      const id = select.value;
      if (id) carregarResumoSaidasMensais(id);
      else document.querySelector('#tabelaResumoSaidas tbody').innerHTML = '';
    });
  }

  atualizarAlertasEstoque(itens);
  atualizarAlertasPrevisao(itens, movs);
  atualizarAlertasParados(itens, movs);
  atualizarAlertasUniformes(entregas, funcionarios);
  atualizarAlertasCA();
  atualizarAlertasRankingConsumo(movs);
}

carregarDashboard();

function renderLembreteSugestoes() {
  // Exibe o lembrete somente no dia definido para gerar sugestoes de compra.
  const el = document.getElementById("lembreteSugestoes");
  if (!el) return;
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  let alvo = new Date(ano, mes, 15);
  const hojeSemHora = new Date(ano, mes, hoje.getDate());
  const diaSemana = alvo.getDay();
  if (diaSemana === 6) {
    alvo.setDate(14); // sabado -> sexta (antecipa)
  } else if (diaSemana === 0) {
    alvo.setDate(16); // domingo -> segunda
  }
  if (hojeSemHora.getTime() !== alvo.getTime()) {
    el.style.display = "none";
    return;
  }
  const key = `lembreteSugestoes_${alvo.getFullYear()}-${alvo.getMonth()+1}-${alvo.getDate()}`;
  const fechouNaSessao = sessionStorage.getItem(key) === "dismissed";
  if (fechouNaSessao) {
    el.style.display = "none";
    return;
  }
  const dataAlvo = alvo.toLocaleDateString('pt-BR');
  el.className = "lembrete-sugestoes";
  el.innerHTML = `
    <span class="texto">Lembrete: gere a Sugestão de Compras no dia ${dataAlvo}.</span>
    <button class="acao" onclick="window.location.href='sugestao-compras.html'">Abrir Sugestões</button>
    <button class="fechar" aria-label="Fechar">×</button>
  `;
  el.style.display = "flex";
  el.querySelector(".fechar").onclick = () => {
    sessionStorage.setItem(key, "dismissed");
    el.style.display = "none";
  };

}

renderLembreteSugestoes();

function renderLembreteBackup() {
  const el = document.getElementById("lembreteBackup");
  if (!el) return;

  const hoje = new Date();
  if (hoje.getDay() !== DIA_LEMBRETE_BACKUP) {
    el.style.display = "none";
    return;
  }

  const chaveDia = `lembreteBackup_${hoje.getFullYear()}-${hoje.getMonth() + 1}-${hoje.getDate()}`;
  if (localStorage.getItem(chaveDia) === "dismissed") {
    el.style.display = "none";
    return;
  }

  el.className = "lembrete-sugestoes";
  el.innerHTML = `
    <span class="texto">Lembrete: hoje e dia de fazer o backup semanal do sistema.</span>
    <button class="acao" id="btnExecutarBackup">Fazer backup</button>
    <button class="fechar" aria-label="Fechar">×</button>
  `;
  el.style.display = "flex";

  el.querySelector(".fechar").onclick = () => {
    localStorage.setItem(chaveDia, "dismissed");
    el.style.display = "none";
  };

  const btnBackup = document.getElementById("btnExecutarBackup");
  if (!btnBackup) return;

  btnBackup.onclick = async () => {
    const confirmar = confirm("Deseja iniciar o backup do sistema agora?");
    if (!confirmar) return;

    btnBackup.disabled = true;
    btnBackup.textContent = "Executando...";

    try {
      const res = await fetch(`${apiBase}/backup/run`, { method: "POST" });
      const raw = await res.text();
      let data = null;

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { error: raw };
      }

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("A rota de backup nao foi encontrada. Reinicie o servidor backend e tente novamente.");
        }
        throw new Error(data.error || "Nao foi possivel executar o backup.");
      }

      if (typeof window.showToast === "function") {
        window.showToast(data.message || "Backup executado com sucesso!", true);
      } else {
        alert(data.message || "Backup executado com sucesso!");
      }

      localStorage.setItem(chaveDia, "dismissed");
      el.style.display = "none";
    } catch (error) {
      if (typeof window.showToast === "function") {
        window.showToast(error.message || "Erro ao executar backup.", false);
      } else {
        alert(error.message || "Erro ao executar backup.");
      }
      btnBackup.disabled = false;
      btnBackup.textContent = "Fazer backup";
    }
  };
}

renderLembreteBackup();

// Popula uma tabela simples com saídas por mês para o item selecionado.
async function carregarResumoSaidasMensais(itemId) {
  // Resume as saidas recentes do item agrupando por mes.
  const res = await fetch(`${apiBase}/movements`);
  const movs = await res.json();
  // Filtra apenas as saídas do item.
  const saidas = movs.filter(m => String(m.item_id) === String(itemId) && m.type === 'OUT');
  // Agrupa os dados por ano e mês.
  const porMes = {};
  saidas.forEach(m => {
    const date = new Date(m.performed_at || m.date || m.created_at);
    if (isNaN(date)) return;
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
    porMes[key] = (porMes[key] || 0) + Number(m.quantity || 0);
  });
  const meses = Object.keys(porMes).sort();
  const tbody = document.querySelector('#tabelaResumoSaidas tbody');
  tbody.innerHTML = '';
  if (meses.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="2">Nenhuma saída registrada para este item</td>`;
    tbody.appendChild(tr);
    return;
  }
  const ultimos = meses.slice(-2);
  ultimos.forEach((mes, idx) => {
    const [ano, mesNum] = mes.split('-').map(Number);
    const label = new Date(ano, mesNum - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    const tr = document.createElement('tr');
    if (idx === ultimos.length - 1) tr.classList.add('linha-resumo-recente');
    tr.innerHTML = `<td>${label}</td><td>${porMes[mes]}</td>`;
    tbody.appendChild(tr);
  });
}

function atualizarAlertasEstoque(itens) {
  const criticos = itens.filter(i => Number(i.quantity) <= 0);
  const baixos = itens.filter(i => Number(i.quantity) > 0 && Number(i.quantity) < Number(i.min_stock_level || 0));
  const total = criticos.length + baixos.length;
  const elTotal = document.getElementById("alertaEstoqueCritico");
  const elSub = document.getElementById("alertaEstoqueCriticoSub");
  if (elTotal) elTotal.innerText = total;
  if (elSub) elSub.innerText = `Baixo: ${baixos.length} | Critico: ${criticos.length}`;
}

function atualizarAlertasPrevisao(itens, movs) {
  // Estima quais itens podem acabar em breve com base nas saidas recentes.
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

  let alertas = 0;
  itens.forEach(item => {
    const total = totalPorItem[String(item.id)] || 0;
    if (total <= 0) return;
    const mediaDia = total / PREVISAO_JANELA_DIAS;
    if (mediaDia <= 0) return;
    const dias = Number(item.quantity || 0) / mediaDia;
    if (dias <= PREVISAO_ALERTA_DIAS) alertas += 1;
  });

  const el = document.getElementById("alertaPrevisaoEstoque");
  if (el) el.innerText = alertas;
}

function atualizarAlertasParados(itens, movs) {
  const limite = new Date(Date.now() - ALERTA_PARADO_DIAS * DAY_MS);
  const ultimoPorItem = {};
  movs.forEach(m => {
    const d = parseMovDate(m);
    if (!d) return;
    const id = String(m.item_id);
    if (!ultimoPorItem[id] || d > ultimoPorItem[id]) ultimoPorItem[id] = d;
  });

  let parados = 0;
  itens.forEach(item => {
    const ultima = ultimoPorItem[String(item.id)];
    if (!ultima || ultima <= limite) parados += 1;
  });
  const el = document.getElementById("alertaItensParados");
  if (el) el.innerText = parados;
}

function atualizarAlertasUniformes(entregas, funcionarios) {
  // Descobre quantos funcionarios ja podem retirar algum uniforme novamente.
  const porFuncionario = {};
  entregas.forEach(e => {
    const reg = String(e.registration);
    porFuncionario[reg] = porFuncionario[reg] || {};
    const d = parseDateSafe(e.delivery_date);
    if (!d) return;
    const item = e.item;
    if (!porFuncionario[reg][item] || d > porFuncionario[reg][item]) {
      porFuncionario[reg][item] = d;
    }
  });

  const liberadosSet = new Set();
  funcionarios.forEach(f => {
    let liberado = false;
    Object.keys(UNIFORME_LIMITES_MESES).forEach(item => {
      const ultima = porFuncionario[String(f.registration)]?.[item];
      if (!ultima) {
        liberado = true;
        return;
      }
      const agora = new Date();
      const diffMeses = (agora.getFullYear() - ultima.getFullYear()) * 12 + (agora.getMonth() - ultima.getMonth());
      if (diffMeses >= UNIFORME_LIMITES_MESES[item]) liberado = true;
    });
    if (liberado) liberadosSet.add(String(f.registration));
  });

  const el = document.getElementById("alertaUniformesLiberados");
  if (el) el.innerText = liberadosSet.size;
}

function getHistoricoCAUnique() {
  let historico = [];
  try {
    historico = JSON.parse(localStorage.getItem("historicoCA") || "[]");
  } catch {
    historico = [];
  }
  const porCA = {};
  historico.forEach(item => {
    const ca = String(item.ca || "");
    if (!ca) return;
    const dataVal = parseValidadeCA(item.validade);
    if (!dataVal) return;
    const atual = porCA[ca];
    if (!atual || dataVal > atual.dataVal) {
      porCA[ca] = { item, dataVal };
    }
  });
  return Object.values(porCA).map(v => v.item);
}

function atualizarAlertasCA() {
  const el = document.getElementById("alertaCAVencendo");
  if (!el) return;
  const historicoUnico = getHistoricoCAUnique();
  let emRisco = 0;
  historicoUnico.forEach(item => {
    const dataVal = parseValidadeCA(item.validade);
    if (!dataVal) return;
    const dias = Math.floor((dataVal.getTime() - Date.now()) / DAY_MS);
    if (dias <= ALERTA_CA_DIAS) emRisco += 1;
  });
  el.innerText = emRisco;
}

function atualizarAlertasRankingConsumo(movs) {
  const el = document.getElementById("alertaRankingConsumo");
  if (!el) return;
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = agora.getMonth();
  const saidasMes = movs.filter(m => m.type === "OUT").filter(m => {
    const d = parseMovDate(m);
    return d && d.getFullYear() === ano && d.getMonth() === mes;
  });
  const totalPorItem = {};
  saidasMes.forEach(m => {
    const id = String(m.item_id);
    totalPorItem[id] = (totalPorItem[id] || 0) + Number(m.quantity || 0);
  });
  el.innerText = Object.keys(totalPorItem).length;
}

