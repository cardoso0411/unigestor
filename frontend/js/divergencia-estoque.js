const apiBase = "http://localhost:3000/api";
const STORAGE_KEY = "inventarioFisico";

function getInventarioFisico() {
  // Recupera a contagem fisica salva no navegador em visitas anteriores.
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function setInventarioFisico(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function limparColunaFisico() {
  // Remove do navegador todos os valores digitados na coluna 'fisico'.
  localStorage.removeItem(STORAGE_KEY);
  const inputs = document.querySelectorAll(".input-fisico");
  inputs.forEach(input => {
    input.value = "";
    const tr = input.closest("tr");
    if (tr) {
      tr.querySelector(".col-diferenca").textContent = "-";
    }
  });
}

function calcularDiferenca(sistema, fisico) {
  // Retorna o quanto o estoque fisico esta acima ou abaixo do sistema.
  if (fisico === null || fisico === "") return "-";
  const f = Number(fisico);
  if (Number.isNaN(f)) return "-";
  return f - Number(sistema || 0);
}

async function carregarDivergencia() {
  // Monta a tabela comparando estoque do sistema com a contagem manual.
  const res = await fetch(`${apiBase}/items`);
  const itens = await res.json();
  const tbody = document.querySelector("#tabelaDivergenciaEstoque tbody");
  tbody.innerHTML = "";

  const inventario = getInventarioFisico();

  itens.forEach(item => {
    const tr = document.createElement("tr");
    const valorFisico = inventario[String(item.id)] ?? "";
    const diff = calcularDiferenca(item.quantity, valorFisico);
    const diffTxt = diff === "-" ? "-" : String(diff);

    tr.innerHTML = `
      <td>${item.name}</td>
      <td class="col-sistema">${item.quantity}</td>
      <td class="col-fisico">
        <input type="number" class="input-fisico" data-item-id="${item.id}" value="${valorFisico}" style="width:90px; text-align:center;">
      </td>
      <td class="col-diferenca">${diffTxt}</td>
    `;
    tbody.appendChild(tr);
  });

  const inputs = document.querySelectorAll(".input-fisico");
  inputs.forEach(input => {
    input.addEventListener("input", e => {
      const id = e.target.getAttribute("data-item-id");
      const valor = e.target.value;
      const data = getInventarioFisico();
      if (valor === "") {
        delete data[id];
      } else {
        data[id] = Number(valor);
      }
      setInventarioFisico(data);

      const tr = e.target.closest("tr");
      const sistema = tr.querySelector(".col-sistema").textContent;
      const diff = calcularDiferenca(sistema, valor);
      tr.querySelector(".col-diferenca").textContent = diff === "-" ? "-" : String(diff);
    });
  });

  const filtroInput = document.querySelector("#filtroItem");
  if (filtroInput) {
    const aplicarFiltro = () => {
      const termo = filtroInput.value.trim().toLowerCase();
      const linhas = tbody.querySelectorAll("tr");
      linhas.forEach(tr => {
        const nome = tr.querySelector("td")?.textContent?.toLowerCase() || "";
        tr.style.display = nome.includes(termo) ? "" : "none";
      });
    };

    filtroInput.addEventListener("input", aplicarFiltro);
    aplicarFiltro();

    document.addEventListener("keydown", e => {
      if (e.ctrlKey && (e.key === "x" || e.key === "X")) {
        e.preventDefault();
        filtroInput.focus();
        filtroInput.select();
      }
    });
  }

  const btnLimpar = document.querySelector("#btnLimparFisico");
  if (btnLimpar) {
    btnLimpar.addEventListener("click", () => {
      limparColunaFisico();
    });
  }
}

carregarDivergencia();

