import puppeteer from "puppeteer";

export async function consultarCA(numeroCA) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto("https://caepi.mte.gov.br/internet/ConsultaCAInternet.aspx", {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  await page.waitForSelector("#txtNumeroCA");

  await page.type("#txtNumeroCA", numeroCA);
  await page.click("#btnConsultar");

  // Espera mais longa e tentativas para o botão Detalhar
  let detalharBtn = null;
  let tentativas = 0;
  const maxTentativas = 4;
  const delayTentativa = 4000;
  while (!detalharBtn && tentativas < maxTentativas) {
    detalharBtn = await page.$('input[id^="PlaceHolderConteudo_grdListaResultado_btnDetalhar_"]');
    if (!detalharBtn) {
      await new Promise(r => setTimeout(r, delayTentativa));
      tentativas++;
    }
  }
  if (!detalharBtn) {
    await browser.close();
    throw new Error("CA não encontrado ou resultado não carregou (site pode estar lento ou fora do ar).");
  }

  await detalharBtn.click();
  // Espera mais longa para detalhes carregarem
  await new Promise(r => setTimeout(r, 7000));

  await page.waitForSelector("#PlaceHolderConteudo_lblNOEquipamento", {timeout: 20000});

  const dados = await page.evaluate(() => {
    function get(id) {
      const el = document.getElementById(id);
      return el ? el.innerText.trim() : "";
    }

    return {
      equipamento: get("PlaceHolderConteudo_lblNOEquipamento"),
      descricao: get("PlaceHolderConteudo_lblEquipamentoDSEquipamentoTexto"),
      aprovado_para: get("PlaceHolderConteudo_lblDSAprovadoParaLaudo"),
      empresa: get("PlaceHolderConteudo_lblNORazaoSocial"),
      cnpj: get("PlaceHolderConteudo_lblNRCNPJ"),
      validade: get("PlaceHolderConteudo_lblDTValidade")
    };
  });

  await browser.close();

  return dados;
}