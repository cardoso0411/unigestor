const apiBase = "http://localhost:3000/api";
const STORAGE_KEY_SUGESTOES = "sugestoesComprasTemp";

function getSugestoesSalvas() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY_SUGESTOES) || "{}");
    if (data && (data.sugestoes || data.inputs)) {
      return data.sugestoes || {};
    }
    return data || {};
  } catch {
    return {};
  }
}

function setSugestoesSalvas(sugestoes) {
  localStorage.setItem(STORAGE_KEY_SUGESTOES, JSON.stringify(sugestoes));
}

function limparSugestoesSalvas() {
  localStorage.removeItem(STORAGE_KEY_SUGESTOES);
}

let cacheItensSugestao = [];
let cacheMovsSugestao = [];
let sugestoesTemp = {};
async function carregarItensSugestao() {
  const [resItens, resMovs] = await Promise.all([
    fetch(`${apiBase}/items`),
    fetch(`${apiBase}/movements`)
  ]);
  cacheItensSugestao = await resItens.json();
  cacheMovsSugestao = await resMovs.json();
  sugestoesTemp = getSugestoesSalvas();
  renderItensSugestao();
}

function getPeriodoSugestao() {
  const hoje = new Date();
  let inicio;
  if (hoje.getDate() >= 15) {
    inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 15);
  } else {
    inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 15);
  }
  return { inicio, fim: hoje };
}

function parseMovDate(m) {
  const d = new Date(m.performed_at || m.date || m.created_at);
  return isNaN(d) ? null : d;
}

function renderItensSugestao() {
  const filtro = document.getElementById('filtroNomeSugestao')?.value?.toLowerCase() || '';
  const tbody = document.querySelector("#tabelaSugestaoCompras tbody");
  tbody.innerHTML = "";
  const { inicio, fim } = getPeriodoSugestao();
  const consumoPorItem = {};
  cacheMovsSugestao
    .filter(m => m.type === "OUT")
    .forEach(m => {
      const d = parseMovDate(m);
      if (!d || d < inicio || d > fim) return;
      const id = String(m.item_id);
      consumoPorItem[id] = (consumoPorItem[id] || 0) + Number(m.quantity || 0);
    });

  cacheItensSugestao
    .filter(item => item.name.toLowerCase().includes(filtro))
    .forEach(item => {
      const tr = document.createElement("tr");
      const sugestao = sugestoesTemp[item.id] || { valor: '', cor: '' };
      const minimo = Number(item.min_stock_level || 0);
      const atual = Number(item.quantity || 0);
      const consumoPeriodo = consumoPorItem[String(item.id)] || 0;
      const quantidadeSugerida = Math.max(consumoPeriodo + minimo - atual, 0);
      tr.innerHTML = `
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td><input type="number" min="0" style="width:80px" id="qtd-${item.id}" placeholder="Digite" value=""></td>
        <td class="col-quantidade-sugerida">${quantidadeSugerida}</td>
        <td><div class="acoes-btns">
          <button onclick="naoComprar(${item.id})" style="background:#f44336;color:#fff;">Não comprar</button>
        </div></td>
        <td id="sugestao-${item.id}" class="col-sugestao" style="${sugestao.cor ? `color:${sugestao.cor}` : ''}">${sugestao.valor || ''}</td>
      `;
      tbody.appendChild(tr);
    });

  const inputs = tbody.querySelectorAll('input[id^="qtd-"]');
  inputs.forEach(input => {
    input.addEventListener("input", (e) => {
      const id = e.target.id.replace("qtd-", "");
      const valor = e.target.value;
      const sugestaoTd = document.getElementById(`sugestao-${id}`);
      const qtd = parseInt(valor);
      if (!valor || isNaN(qtd) || qtd <= 0) {
        delete sugestoesTemp[id];
        if (sugestaoTd) {
          sugestaoTd.textContent = "";
          sugestaoTd.style.color = "";
        }
        setSugestoesSalvas(sugestoesTemp);
        return;
      }
      sugestoesTemp[id] = { valor: `${qtd}`, cor: '#0d6efd' };
      if (sugestaoTd) {
        sugestaoTd.textContent = `${qtd}`;
        sugestaoTd.style.color = '#0d6efd';
      }
      setSugestoesSalvas(sugestoesTemp);
    });
  });
}

window.naoComprar = function(id) {
  const sugestaoTd = document.getElementById(`sugestao-${id}`);
  sugestoesTemp[id] = { valor: 'Não comprar', cor: '#f44336' };
  setSugestoesSalvas(sugestoesTemp);
  sugestaoTd.textContent = "Não comprar";
  sugestaoTd.style.color = '#f44336';
}

carregarItensSugestao();

// Filtro por nome do item
document.getElementById('filtroNomeSugestao')?.addEventListener('input', renderItensSugestao);

document.getElementById('btnSalvarSugestoes').addEventListener('click', async () => {
  const sugestoes = [];
  cacheItensSugestao.forEach(item => {
    const s = sugestoesTemp[item.id];
    if (s && s.valor) {
      sugestoes.push({ item: item.name, categoria: item.category, sugestao: s.valor });
    }
  });
  if (sugestoes.length === 0) {
    showToast('Nenhuma sugestão registrada!', false);
    return;
  }
  const res = await fetch(`${apiBase}/sugestoes-compras`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sugestoes)
  });
  if (res.ok) {
    showToast('Sugestões salvas com sucesso!', true);
    sugestoesTemp = {};
    limparSugestoesSalvas();
    renderItensSugestao();
  } else {
    showToast('Erro ao salvar sugestões.', false);
  }
});

document.getElementById('btnLimparSugestoes')?.addEventListener('click', () => {
  sugestoesTemp = {};
  limparSugestoesSalvas();
  renderItensSugestao();
  showToast('Sugestões temporárias limpas.', true);
});




