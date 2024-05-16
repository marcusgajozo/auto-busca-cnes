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
  return palavra.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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

function pegaCodigoMunicipio(municipios, municipio) {
  return Object.keys(municipios).find(
    (codigo) =>
      municipios[codigo] ===
      removerAcentos(municipio)?.toLocaleUpperCase().trim()
  );
}

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

  buscaTodosMunicipio().then((municipios) => {
    let municipioAtual = "";
    let todosCnesMunicipio = null;
    linhasPlanilha.forEach(async (linha) => {
      const codigoMunicipio = pegaCodigoMunicipio(municipios, linha[4]);

      if (municipioAtual !== linha[4]) {
        municipioAtual = linha[4];
        if (codigoMunicipio) {
          todosCnesMunicipio = await buscaTodosCnesMunicipio(codigoMunicipio);
        }
      }

      if (todosCnesMunicipio) {
        console.log("entrei");
      }
    });
  });
} catch (error) {
  console.log(error);
}
