const apiBase = "http://localhost:3000/api";

async function carregarItensSugestao() {
  const res = await fetch(`${apiBase}/items`);
  const itens = await res.json();
  const tbody = document.querySelector("#tabelaSugestaoCompras tbody");
  tbody.innerHTML = "";
  itens.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td><input type="number" min="0" style="width:80px" id="qtd-${item.id}" placeholder="Qtd"></td>
      <td><div class="acoes-btns">
        <button onclick="adicionarQuantidade(${item.id})">Adicionar</button>
        <button onclick="naoComprar(${item.id})" style="background:#f44336;color:#fff;">Não comprar</button>
      </div></td>
      <td id="sugestao-${item.id}"></td>
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
  sugestaoTd.textContent = `${qtd}`;
  sugestaoTd.style.color = '#0d6efd';
  input.value = "";
}

window.naoComprar = function(id) {
  const sugestaoTd = document.getElementById(`sugestao-${id}`);
  sugestaoTd.textContent = "Não comprar";
  sugestaoTd.style.color = '#f44336';
}

carregarItensSugestao();

document.getElementById('btnSalvarSugestoes').addEventListener('click', async () => {
  const linhas = document.querySelectorAll('#tabelaSugestaoCompras tbody tr');
  const sugestoes = [];
  linhas.forEach(tr => {
    const nome = tr.children[0].textContent;
    const categoria = tr.children[1].textContent;
    const sugestao = tr.children[4].textContent;
    if (sugestao) {
      sugestoes.push({ item: nome, categoria, sugestao });
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
