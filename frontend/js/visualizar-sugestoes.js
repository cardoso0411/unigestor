const apiBase = "http://localhost:3000/api";

async function carregarSugestoes() {
  // Busca do backend as sugestoes ja salvas para exibicao em tabela.
  const res = await fetch(`${apiBase}/sugestoes-compras`);
  const sugestoes = await res.json();
  const tbody = document.querySelector("#tabelaVisualizarSugestoes tbody");
  tbody.innerHTML = "";
  if (!sugestoes.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan='2'>Nenhuma sugestÃ£o registrada.</td>`;
    tbody.appendChild(tr);
    return;
  }
  sugestoes.forEach(s => {
    const tr = document.createElement("tr");
    let classeSugestao = "";
    let estiloSugestao = "";
    if (s.sugestao && s.sugestao.toLowerCase().includes('nÃ£o comprar')) {
      classeSugestao = "sugestao-nao-comprar";
    } else if (s.sugestao && s.sugestao.match(/\d+/)) {
      classeSugestao = "sugestao-qtd";
    }
    tr.innerHTML = `
      <td>${s.item}</td>
      <td class="${classeSugestao}">${s.sugestao}</td>
    `;
    tbody.appendChild(tr);
  });
}

carregarSugestoes();

