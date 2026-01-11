const apiBase = "http://localhost:3000/api";


let cacheItensSugestao = [];
let sugestoesTemp = {};
async function carregarItensSugestao() {
  const res = await fetch(`${apiBase}/items`);
  cacheItensSugestao = await res.json();
  renderItensSugestao();
}

function renderItensSugestao() {
  const filtro = document.getElementById('filtroNomeSugestao')?.value?.toLowerCase() || '';
  const tbody = document.querySelector("#tabelaSugestaoCompras tbody");
  tbody.innerHTML = "";
  cacheItensSugestao
    .filter(item => item.name.toLowerCase().includes(filtro))
    .forEach(item => {
      const tr = document.createElement("tr");
      const sugestao = sugestoesTemp[item.id] || { valor: '', cor: '' };
      tr.innerHTML = `
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td><input type="number" min="0" style="width:80px" id="qtd-${item.id}" placeholder="Qtd"></td>
        <td><div class="acoes-btns">
          <button onclick="adicionarQuantidade(${item.id})">Adicionar</button>
          <button onclick="naoComprar(${item.id})" style="background:#f44336;color:#fff;">Não comprar</button>
        </div></td>
        <td id="sugestao-${item.id}" style="${sugestao.cor ? `color:${sugestao.cor}` : ''}">${sugestao.valor || ''}</td>
      `;
      tbody.appendChild(tr);
    });
}

window.adicionarQuantidade = function(id) {
  const input = document.getElementById(`qtd-${id}`);
  const qtd = parseInt(input.value);
  const sugestaoTd = document.getElementById(`sugestao-${id}`);
  if (isNaN(qtd) || qtd <= 0) {
    alert("Digite uma quantidade válida para adicionar!");
    return;
  }
  sugestoesTemp[id] = { valor: `${qtd}`, cor: '#0d6efd' };
  sugestaoTd.textContent = `${qtd}`;
  sugestaoTd.style.color = '#0d6efd';
  input.value = "";
}

window.naoComprar = function(id) {
  const sugestaoTd = document.getElementById(`sugestao-${id}`);
  sugestoesTemp[id] = { valor: 'Não comprar', cor: '#f44336' };
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
    alert('Nenhuma sugestão registrada!');
    return;
  }
  const res = await fetch(`${apiBase}/sugestoes-compras`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sugestoes)
  });
  if (res.ok) {
    alert('Sugestões salvas com sucesso!');
  } else {
    alert('Erro ao salvar sugestões.');
  }
});
