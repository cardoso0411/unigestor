// Função para desenhar gráfico de barras simples
const apiBase = "http://localhost:3000/api";
let animGrafico = { adequados: 0, baixo: 0, animating: false };

function desenharGraficoPizzaEstoque(adequados, baixoEstoque) {
  const canvas = document.getElementById('graficoPizzaEstoque');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const total = adequados + baixoEstoque;

  // Animação: transição dos valores
  const duracao = 600; // ms
  const frames = 30;
  const passoAdequados = (adequados - animGrafico.adequados) / frames;
  const passoBaixo = (baixoEstoque - animGrafico.baixo) / frames;
  let frame = 0;
  if (animGrafico.animating) return;
  animGrafico.animating = true;
  function animar() {
    frame++;
    animGrafico.adequados += passoAdequados;
    animGrafico.baixo += passoBaixo;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const t = animGrafico.adequados + animGrafico.baixo;
    if (t === 0) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#888';
      ctx.fillText('Sem dados', 100, 110);
      return;
    }
    // Ângulos
    const angAdequados = (animGrafico.adequados / t) * 2 * Math.PI;
    const angBaixo = (animGrafico.baixo / t) * 2 * Math.PI;
    // Desenha fatia "adequados"
    ctx.beginPath();
    ctx.moveTo(160,110);
    ctx.arc(160,110,80,0,angAdequados);
    ctx.closePath();
    ctx.fillStyle = '#4caf50';
    ctx.fill();
    // Desenha fatia "abaixo do mínimo"
    ctx.beginPath();
    ctx.moveTo(160,110);
    ctx.arc(160,110,80,angAdequados,angAdequados+angBaixo);
    ctx.closePath();
    ctx.fillStyle = '#f44336';
    ctx.fill();
    // Legenda
    ctx.font = '15px Arial';
    ctx.fillStyle = '#4caf50';
    ctx.fillText(`Adequados: ${Math.round(animGrafico.adequados)}`, 20, 200);
    ctx.fillStyle = '#f44336';
    ctx.fillText(`Abaixo do mínimo: ${Math.round(animGrafico.baixo)}`, 170, 200);
    if (frame < frames) {
      requestAnimationFrame(animar);
    } else {
      animGrafico.adequados = adequados;
      animGrafico.baixo = baixoEstoque;
      animGrafico.animating = false;
    }
  }
  animar();
}

async function carregarDashboard() {
  const res = await fetch(`${apiBase}/items`);
  const itens = await res.json();

  document.getElementById("totalItens").innerText = itens.length;
  const baixoEstoque = itens.filter(i => i.quantity < i.min_stock_level).length;
  document.getElementById("itensBaixoEstoque").innerText = baixoEstoque;

  // Indicador de itens adequados
  const adequados = itens.length - baixoEstoque;
  document.getElementById("itensAdequados").innerText = adequados;
  const proporcao = itens.length > 0 ? Math.round((adequados / itens.length) * 100) : 0;
  document.getElementById("proporcaoAdequados").innerText = proporcao + "%";

  // Gráfico de pizza (adequados vs abaixo do mínimo)
  desenharGraficoPizzaEstoque(adequados, baixoEstoque);

  // Preenche select de resumo
  const select = document.getElementById('selectItemResumo');
  if (select) {
    // limpa e adiciona opções
    select.innerHTML = '<option value="">— selecione —</option>';
    itens.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = `${item.code} — ${item.name}`;
      select.appendChild(opt);
    });
    select.addEventListener('change', () => {
      const id = select.value;
      if (id) carregarResumoSaidasMensais(id);
      else document.querySelector('#tabelaResumoSaidas tbody').innerHTML = '';
    });
  }
}

carregarDashboard();

// Popula tabela simples com saídas por mês para o item selecionado (sem gráfico)
async function carregarResumoSaidasMensais(itemId) {
  const res = await fetch(`${apiBase}/movements`);
  const movs = await res.json();
  // filtra apenas saídas do item
  const saidas = movs.filter(m => String(m.item_id) === String(itemId) && m.type === 'OUT');
  // agrupa por ano-mês
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
  meses.forEach(mes => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${mes}</td><td>${porMes[mes]}</td>`;
    tbody.appendChild(tr);
  });
}