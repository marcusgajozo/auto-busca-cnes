process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0; // Ignorar a verificação do certificado SSL

var XLSX = require("xlsx");

const buscaTodosCnesMunicipio = (numeroMunicipio) => {
  return fetch(
    "https://cnes.datasus.gov.br/pages/estabelecimentos/consulta.jsp"
  )
    .then(() => {
      const myHeaders = new Headers();

      myHeaders.append(
        "Referer",
        "https://cnes.datasus.gov.br/pages/estabelecimentos/consulta.jsp"
      );

      return fetch(
        `https://cnes.datasus.gov.br/services/estabelecimentos?municipio=${numeroMunicipio}`,
        { method: "GET", headers: myHeaders }
      );
    })
    .then((res) => {
      return res.json();
    })
    .then((json) => json)
    .catch((e) => console.log("Erro na busca cnes: ", e));
};

const buscaTodosMunicipio = () => {
  return fetch(
    "https://cnes.datasus.gov.br/pages/estabelecimentos/consulta.jsp"
  )
    .then(() => {
      const myHeaders = new Headers();

      myHeaders.append(
        "Referer",
        "https://cnes.datasus.gov.br/pages/estabelecimentos/consulta.jsp"
      );

      return fetch(
        `https://cnes.datasus.gov.br/services/municipios?estado=50`,
        { method: "GET", headers: myHeaders }
      );
    })
    .then((res) => {
      return res.json();
    })
    .then((json) => {
      return json;
    })
    .catch((e) => console.log("Erro na busca cnes: ", e));
};

function removerAcentos(palavra) {
  return palavra?.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function compararMunicipio(a, b) {
  const municipioA = a[4].toUpperCase();
  const municipioB = b[4].toUpperCase();

  if (municipioA < municipioB) {
    return -1;
  }
  if (municipioA > municipioB) {
    return 1;
  }
  return 0;
}

function pegaCnesUnidade(listaUnidades, nomeUnidade) {
  let cnes = "9999999";
  for (unidade of listaUnidades) {
    if (unidade.noFantasia === nomeUnidade) {
      cnes = unidade.cnes;
    }
  }
  return cnes;
}

function pegaCodigoMunicipio(municipios, municipio) {
  return Object.keys(municipios).find(
    (codigo) =>
      municipios[codigo] ===
      removerAcentos(municipio)?.toLocaleUpperCase().trim()
  );
}

(async () => {
  try {
    const lerPlanilha = XLSX.readFile("lista_participantes.xlsx");
    const nomePrimeiraPlanilha = lerPlanilha.SheetNames[0];
    const planilha = lerPlanilha.Sheets[nomePrimeiraPlanilha];

    const convertePlanilha = XLSX.utils.sheet_to_csv(planilha);
    const linhasPlanilha = convertePlanilha
      .split("\n")
      .map((row) => row.split(","));
    linhasPlanilha.sort(compararMunicipio);
    const novaPlanilha = [];

    const municipios = await buscaTodosMunicipio();
    let atualCodigoMunicipio = null;
    let atualUnidade = null;
    let todosCnesMunicipios = null;
    for (linha of linhasPlanilha) {
      const nomeMunicipio = removerAcentos(
        linha[4]?.trim().toLocaleUpperCase()
      );
      const codigoMunicipio = pegaCodigoMunicipio(municipios, nomeMunicipio);
      if (codigoMunicipio) {
        //verifica se codigo do municipio é novo
        if (atualCodigoMunicipio !== codigoMunicipio) {
          atualCodigoMunicipio = codigoMunicipio;
          todosCnesMunicipios = await buscaTodosCnesMunicipio(codigoMunicipio);
        }

        // verifica se unidade fosse já foi inserida

        // verifica se unidade é valida
        if (linha[6] !== "OUTROS")
          novaPlanilha?.push([
            linha[4],
            linha[6],
            pegaCnesUnidade(todosCnesMunicipios, linha[6].trim()),
          ]);
      }
    }

    // Criar uma nova planilha
    const workbook = XLSX.utils.book_new();
    // Criar uma nova planilha com nome "Dados"
    const worksheet = XLSX.utils.aoa_to_sheet(novaPlanilha);
    // Adicionar a planilha ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
    // Salvar o workbook como arquivo XLSX
    XLSX.writeFile(workbook, "dados.xlsx", { bookSST: true });
  } catch (error) {
    console.log(error);
  }
})();

console.log("Executei");
