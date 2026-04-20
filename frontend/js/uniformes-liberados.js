const apiBase = "http://localhost:3000/api/uniformes";
const UNIFORME_LIMITES_MESES = {
  Sapato: 8,
  Camisa: 5,
  "Calça": 5
};

let cacheFuncionarios = [];
let sugestaoIndexMatricula = -1;

async function carregarFuncionariosAutocomplete() {
  // Carrega funcionarios para busca por matricula ou nome.
  const res = await fetch(`${apiBase}/employees`);
  cacheFuncionarios = await res.json();
}

function filtrarSugestoesMatricula(valor) {
  const v = valor.toLowerCase();
  return cacheFuncionarios.filter(f =>
    String(f.registration).toLowerCase().includes(v) ||
    String(f.name).toLowerCase().includes(v)
  );
}

function renderSugestoesMatricula(lista) {
  const ul = document.getElementById('sugestoesMatriculaLiberados');
  ul.innerHTML = '';
  if (!lista.length) {
    ul.style.display = 'none';
    sugestaoIndexMatricula = -1;
    return;
  }
  lista.forEach((f, idx) => {
    const li = document.createElement('li');
    li.textContent = `${f.registration} - ${f.name}`;
    li.style.padding = '6px 10px';
    li.style.cursor = 'pointer';
    li.dataset.index = String(idx);
    li.onmousedown = () => {
      document.getElementById('filtroMatriculaLiberados').value = f.registration;
      ul.style.display = 'none';
      sugestaoIndexMatricula = -1;
      carregarUniformesLiberados();
    };
    ul.appendChild(li);
  });
  sugestaoIndexMatricula = -1;
  ul.style.display = 'block';
}

function mesesEntre(a, b) {
  // Calcula a diferenca aproximada em meses entre duas datas.
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

async function carregarUniformesLiberados() {
  // Cruza funcionarios e entregas para descobrir quem ja pode retirar novamente.
  const [resFuncionarios, resEntregas] = await Promise.all([
    fetch(`${apiBase}/employees`),
    fetch(`${apiBase}/deliveries`)
  ]);

  const funcionarios = await resFuncionarios.json();
  const entregas = await resEntregas.json();
  const tbody = document.querySelector("#tabelaUniformesLiberados tbody");
  tbody.innerHTML = "";

  const porFuncionario = {};
  entregas.forEach(e => {
    // Guarda apenas a ultima entrega de cada item por funcionario.
    const reg = String(e.registration);
    porFuncionario[reg] = porFuncionario[reg] || {};
    const d = new Date(e.delivery_date);
    if (isNaN(d)) return;
    const item = e.item;
    if (!porFuncionario[reg][item] || d > porFuncionario[reg][item]) {
      porFuncionario[reg][item] = d;
    }
  });

  const filtro = document.getElementById("filtroMatriculaLiberados")?.value.trim();
  let adicionados = 0;
  funcionarios.forEach(f => {
    if (filtro && String(f.registration) !== String(filtro)) return;
    Object.keys(UNIFORME_LIMITES_MESES).forEach(item => {
      const ultima = porFuncionario[String(f.registration)]?.[item];
      const agora = new Date();
      if (!ultima) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${f.name}</td>
          <td>${f.registration}</td>
          <td>${item}</td>
          <td class="col-ultima-entrega">Nunca</td>
          <td class="col-meses-desde">-</td>
        `;
        tbody.appendChild(tr);
        adicionados += 1;
        return;
      }
      const diffMeses = mesesEntre(ultima, agora);
      if (diffMeses >= UNIFORME_LIMITES_MESES[item]) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${f.name}</td>
          <td>${f.registration}</td>
          <td>${item}</td>
          <td class="col-ultima-entrega">${ultima.toLocaleDateString()}</td>
          <td class="col-meses-desde">${diffMeses}</td>
        `;
        tbody.appendChild(tr);
        adicionados += 1;
      }
    });
  });

  if (adicionados === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5">Nenhum funcionario liberado para nova retirada.</td>`;
    tbody.appendChild(tr);
  }
}

carregarUniformesLiberados();

document.getElementById("filtroMatriculaLiberados")?.addEventListener("input", (e) => {
  const valor = e.target.value.trim();
  if (valor) {
    renderSugestoesMatricula(filtrarSugestoesMatricula(valor));
  } else {
    document.getElementById("sugestoesMatriculaLiberados").style.display = "none";
    sugestaoIndexMatricula = -1;
  }
  carregarUniformesLiberados();
});

document.getElementById("filtroMatriculaLiberados")?.addEventListener("keydown", (e) => {
  const ul = document.getElementById("sugestoesMatriculaLiberados");
  if (ul.style.display === "none") return;
  const itens = Array.from(ul.querySelectorAll("li"));
  if (!itens.length) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    sugestaoIndexMatricula = (sugestaoIndexMatricula + 1) % itens.length;
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    sugestaoIndexMatricula = (sugestaoIndexMatricula - 1 + itens.length) % itens.length;
  } else if (e.key === "Enter") {
    if (sugestaoIndexMatricula >= 0 && itens[sugestaoIndexMatricula]) {
      e.preventDefault();
      itens[sugestaoIndexMatricula].dispatchEvent(new Event("mousedown"));
    }
    return;
  } else {
    return;
  }
  itens.forEach((li, i) => li.classList.toggle("active", i === sugestaoIndexMatricula));
  itens[sugestaoIndexMatricula].scrollIntoView({ block: "nearest" });
});

document.getElementById("filtroMatriculaLiberados")?.addEventListener("blur", () => {
  setTimeout(() => {
    document.getElementById("sugestoesMatriculaLiberados").style.display = "none";
  }, 150);
});

carregarFuncionariosAutocomplete();

document.addEventListener("keydown", (e) => {
  if (!(e.ctrlKey && e.key.toLowerCase() === "x")) return;
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  const input = document.getElementById("filtroMatriculaLiberados");
  if (input) {
    input.focus();
    input.select();
  }
});

