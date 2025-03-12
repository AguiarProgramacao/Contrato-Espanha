document.getElementById("adicionar-requerente").addEventListener("click", () => {
  const form = document.getElementById("requerentes-form");

  const novoRequerente = document.createElement("div");
  novoRequerente.classList.add("requerente");
  novoRequerente.innerHTML = `
    <fieldset>
      <legend>Dados do Requerente</legend>
      <label>Nome Completo:</label>
      <input type="text" name="nome" id="nome" placeholder="Nome completo do requerente" required>
      <label>Nacionalidade:</label>
      <input type="text" name="nacionalidade" placeholder="Nacionalidade do requerente" required>
      <label>Estado Civil:</label>
      <input type="text" name="estadoCivil" placeholder="Estado Civil do requerente" required>
      <label>Data de Nascimento:</label>
      <input type="date" name="dataNascimento" required>
      <label>Cidade do Nascimento:</label>
      <input type="text" name="localNascimento" placeholder="Cidade de Nascimento" required>
      <label>Estado do Nascimento:</label>
      <input type="text" name="estadoNascimento" placeholder="Estado de Nascimento" required>
      <label>CPF:</label>
      <input type="text" name="cpf" placeholder="CPF do Requerente (XXXXXXXXXXX)" required>
      <label>CEP:</label>
      <input class="input" type="text" id="cep" placeholder="Digite o CEP" name="cep">
      <div class="endereco-um">
        <div class="div">
          <label>Endereço:</label>
            <input class="input" type="text" id="endereco" name="endereco" placeholder="Automático" required>
          </div>
        <div class="div">
        <label>Bairro:</label>
        <input class="input" type="text" id="bairro" name="bairro" placeholder="Automático" required>
      </div>
      <div class="div">
        <label>Cidade:</label>
        <input class="input" type="text" id="cidade" name="cidade" placeholder="Automático" required>
      </div>
      </div>
      <div class="endereco-dois">
        <div class="div">
          <label>Número:</label>
          <input type="text" id="numero" placeholder="Preencher">
        </div>
        <div class="div">
          <label>Complemento:</label>
          <input class="input" type="text" id="complemento" name="complemento" placeholder="Preencher" />
        </div>
        <div class="div">
          <label>Estado:</label>
          <input class="input" type="text" id="estado" name="estado" placeholder="Automático" >
        </div>
      </div>
    </fieldset>
  `;

  form.appendChild(novoRequerente);
});

document.getElementById('contratoSelect').addEventListener('change', function() {
  if (this.value) {
      window.location.href = this.value;
  }
});

document.getElementById("forma-pagamento").addEventListener("change", (event) => {
  const container = document.getElementById("inputs-pagamentos-diferentes");
  const parcelasInput = document.getElementById("parcelas");

  container.innerHTML = "";

  if (event.target.value === "pagamentosDiferente") {
    parcelasInput.style.display = "none";

    const div = document.createElement("div");

    div.innerHTML = `
        <label>Forma de Pagamento do Requerente:</label>
        <select name="formaPagamento" class="forma-pagamento-requerente">
          <option value="">Selecionar</option>
          <option value="cartao">Cartão de Crédito</option>
          <option value="boleto">Boleto</option>
          <option value="transferencia">Transferência</option>
        </select>
        <label>Quantidade de Parcelas:</label>
        <input type="number" id="qntd-parcelas" class="parcelas-requerentes" value="0" min="0" />
      `;

    container.appendChild(div);

    div.querySelector(".forma-pagamento-requerente").addEventListener("change", (e) => {
      console.log(`Forma de pagamento selecionada: ${e.target.value}`);
    });
  } else {
    parcelasInput.style.display = "column";
  }
});

document.getElementById("requerentes-form").addEventListener("blur", async function (event) {
  if (event.target.name === "cep") {
    const cep = event.target.value.replace(/\D/g, "");

    if (cep.length !== 8) {
      alert("CEP inválido! Certifique-se de inserir 8 dígitos.");
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        alert("CEP não encontrado!");
        return;
      }

      const fieldset = event.target.closest("fieldset");
      fieldset.querySelector('[name="endereco"]').value = data.logradouro || "Não informado";
      fieldset.querySelector('[name="bairro"]').value = data.bairro || "Não informado";
      fieldset.querySelector('[name="cidade"]').value = data.localidade || "Não informado";
      fieldset.querySelector('[name="estado"]').value = data.uf || "Não informado";
      fieldset.querySelector('[name="complemento"]').value = "";
      fieldset.querySelector('[name="numero"]').value = "";
    } catch (error) {
      console.error("Erro na busca do CEP:", error);
    }
  }
}, true);

const { pdfMake } = window;

document.getElementById("gerar-pdf").addEventListener("click", async () => {
  const loadImageAsBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(`Erro ao carregar a imagem: ${url}`);
    });
  };

  const dataEmissao = new Date().toLocaleDateString();

  const obterCotacaoEuro = async () => {
    try {
      const response = await fetch("https://economia.awesomeapi.com.br/json/last/EUR-BRL");
      if (!response.ok) throw new Error("Erro ao obter a cotação do Euro");
      const data = await response.json();
      return parseFloat(data.EURBRL.bid);
    } catch (error) {
      console.error("Erro:", error);
      return null;
    }
  };

  const calcularDatasPagamento = (dataInicial, intervaloMeses, numParcelas) => {
    const datas = [];
    const data = new Date(dataInicial);
    const diaOriginal = data.getUTCDate();

    for (let i = 0; i < numParcelas; i++) {
      const novoMes = data.getUTCMonth() + intervaloMeses * i;
      const novoAno = data.getUTCFullYear() + Math.floor(novoMes / 12);
      const mesAjustado = novoMes % 12;

      let novaData = new Date(Date.UTC(novoAno, mesAjustado, diaOriginal));

      while (novaData.getUTCMonth() !== mesAjustado) {
        novaData.setUTCDate(novaData.getUTCDate() - 1);
      }

      datas.push(novaData);
    }

    return datas.map((d) =>
      d.toLocaleDateString("pt-BR", {
        timeZone: "UTC",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    );
  };

  try {
    const bgImage = await loadImageAsBase64("/assets/bg.png");
    const cotacaoEuro = await obterCotacaoEuro();
    if (!cotacaoEuro) {
      alert("Não foi possível obter a cotação do Euro. Tente novamente mais tarde.");
      return;
    }

    const requerentes = document.querySelectorAll(".requerente");

    const content = [
      {
        text: "CONTRATO PARA PRESTAÇÃO DE SERVIÇOS DE PATROCÍNIO JUDICIÁRIO E ASSESSORIA JURÍDICA",
        style: "header",
        margin: [0, 20, 0, 10],
      },
      {
        text: "I. DAS PARTES",
        style: "subheader",
        bold: true,
        margin: [0, 10, 0, 10]
      },
      {
        text: "Pelo presente instrumento particular, de um lado:",
        style: "paragraph",
        margin: [0, 10, 0, 10],
      },
    ];

    const nomesRequerentes = [];
    const pagamentosRequerentes = [];
    let textoRequerentes = [];
    let totalAdultos = 0;

    requerentes.forEach((requerente, index) => {
      const campos = requerente.querySelectorAll("input, select");
      const dados = Array.from(campos).map((campo) => campo.value);

      const [
        nome,
        nacionalidade,
        estadoCivil,
        dataNascimento,
        localNascimento,
        estadoNascimento,
        cpf,
        cep,
        endereco,
        bairro,
        cidade,
        numero,
        complemento,
        estado,
      ] = dados;

      function formatarCPF(cpf) {
        return cpf.replace(/\D/g, "")
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d{2})$/, "$1-$2");
      };

      const cpfFormatado = formatarCPF(cpf);
      const dataNascimentoFormatada = new Date(dataNascimento);
      const dataFormatadaItaliana = new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Europe/Rome",
      }).format(dataNascimentoFormatada);

      nomesRequerentes.push(nome);
      totalAdultos += 1;

      const formaPagamentoSelect = requerente.querySelector(".forma-pagamento-requerente");
      const parcelasInput = requerente.querySelector(".parcelas-requerentes");

      pagamentosRequerentes.push({
        nome,
        formaPagamento: formaPagamentoSelect?.value || "",
        quantidadeParcelas: parseInt(parcelasInput?.value || 0, 10),
      });

      // Monta o texto do requerente, deixando o nome em negrito
      textoRequerentes.push(
        { text: `${nome}`, bold: true },
        { text: `, ${nacionalidade}, ${estadoCivil}, nascido(a) aos ${dataFormatadaItaliana} na cidade de ${localNascimento}, estado de ${estadoNascimento}, Brasil. CPF n. ${cpfFormatado}. Residente em ${endereco}, nº${numero}, ${complemento}, bairro ${bairro}, cidade ${cidade} - ${estado} - CEP: ${cep}` }
      );

      if (index < requerentes.length - 1) {
        textoRequerentes.push({ text: "; " }); // Adiciona separação entre requerentes
      } else {
        textoRequerentes.push({ text: "; doravante denominado(s) CONTRATANTE(S)." });
      }
    });

    // Adiciona o bloco dos requerentes ao conteúdo do PDF
    content.push({ text: textoRequerentes, style: "paragraph", margin: [0, 0, 0, 10], alignment: "justify" });

    // Adiciona o bloco da CONTRATADA **apenas uma vez**
    const dadosImigrei = [
      { text: "Imigrei Assessoria de Imigração LTDA", bold: true },
      { text: " CNPJ nº 48.429.887/0001-64, com escritório profissional no Brasil no endereço Lagoa da Conceição, Florianópolis-SC e na Itália no endereço Corso Vittorio Emanuele 75, Soave (VR), CAP 37038, neste ato representada pela advogada" },
      { text: " Ana Caroline Azevedo Michelon", bold: true },
      { text: ", brasileira, italiana, solteira, carteira de identidade nº 45.661.346-8, CPF nº 442.462.388-21, residente e domiciliada na Via Pigna, 22, Soave (VR), CAP 37038, doravante denominada" },
      { text: " CONTRATADA.", bold: true }
    ];

    content.push({ text: dadosImigrei, style: "paragraph", margin: [0, 10, 0, 10], alignment: "justify" });

    // Adiciona a cláusula de contrato
    content.push({ text: "As partes resolvem celebrar o presente contrato nos termos e condições a seguir estipulados:", style: "paragraph", margin: [0, 10, 0, 10] });

    content.push({ text: "________________________________________________________________________________", alignment: "center", margin: [0, 10, 0, 15] });

    content.push(
      { text: "II. DO OBJETO", style: "subHeader", margin: [0, 10, 0, 5] },
      {
        text: "O presente contrato tem por objeto a prestação de serviços advocatícios para análise de documentos e postulação de processo judicial para reconhecimento da nacionalidade espanhola por direito de origem, bem como demais atos necessários para a conclusão do procedimento.",
        style: "paragraph",
        margin: [0, 10, 0, 10]
      }
    );

    content.push({ text: "________________________________________________________________________________", alignment: "center", margin: [0, 10, 0, 15] });

    content.push({ text: "III. DAS RESPONSABILIDADES DAS PARTES", style: "header", margin: [0, 10, 0, 10] });

    const contentPDF = [
      { titulo: "1. DA CONTRATADA:", bold: true, style: "paragraph" },
      { list: ". Análise documental;" },
      { list: ". Propositura e acompanhamento da ação judicial;" },
      { list: ". Comunicação sobre o andamento processual;" },
      { list: ". Registro da nacionalidade espanhola nos órgãos competentes." },

      { titulo: "2. DO CONTRATANTE:" },
      { list: ". Providenciar, traduzir e enviar toda a documentação necessária;" },
      { list: ". Realizar os trâmites necessários junto ao Registro Civil Espanhol;" },
      { list: ". Efetuar os pagamentos conforme pactuado." },

    ];

    contentPDF.forEach((textos) => {
      if (textos.titulo) {
        content.push({ text: textos.titulo, style: "subHeader", margin: [10, 10, 0, 5] });
      }
      if (textos.list) {
        content.push({ text: textos.list, style: "list", margin: [25, 2, 0, 2] });
      }
      if (textos.subtitle) {
        content.push({ text: textos.subtitle, style: "subHeader", margin: [0, 10, 0, 5] });
      }
      if (textos.paragraph) {
        content.push({ text: textos.paragraph, style: "paragraph", margin: [0, 5, 0, 5] });
      }
    });

    content.push({ text: "________________________________________________________________________________", alignment: "center", margin: [0, 10, 0, 15] });

    content.push({ text: "IV. DO PRAZO PARA O RECONHECIMENTO DA NACIONALIDADE ESPANHOLA", style: "header", margin: [0, 10, 0, 10] });

    content.push({ text: "As partes reconhecem que a CONTRATADA não possui qualquer responsabilidade pelos prazos estabelecidos pela legislação espanhola para a conclusão do processo de reconhecimento da nacionalidade, bem como por eventuais exigências adicionais, alterações normativas ou interpretações administrativas dos órgãos competentes.", style: "paragraph", margin: [0, 10, 0, 10] });

    content.push({ text: "Ademais, quaisquer prazos eventualmente informados pela CONTRATADA têm caráter meramente estimativo, baseando-se na experiência profissional e na média dos tempos praticados pelos órgãos competentes. Dessa forma, tais estimativas não configuram compromisso contratual ou garantia de prazo.", style: "paragraph", margin: [0, 10, 0, 10] });

    content.push({ text: "A CONTRATADA compromete-se a acompanhar o andamento do processo e prestar informações ao CONTRATANTE, mas não poderá ser responsabilizada por qualquer demora, suspensão ou alteração nos trâmites administrativos ou judiciais que fujam ao seu controle.", style: "paragraph", margin: [0, 10, 0, 10] });

    content.push({ text: "________________________________________________________________________________", alignment: "center", margin: [0, 10, 0, 15] });

    content.push({ text: "V. DA ALTERAÇÃO LEGISLATIVA", style: "header", margin: [0, 10, 0, 10] });

    content.push({ text: "O CONTRATANTE reconhece que a legislação espanhola, bem como normas administrativas e interpretações jurídicas aplicáveis ao reconhecimento da nacionalidade, podem ser alteradas a qualquer momento, podendo impactar os procedimentos, requisitos e prazos do processo.", style: "paragraph", margin: [0, 10, 0, 10] });

    content.push({
      text: "Caso ocorram modificações que exijam ajustes no serviço contratado, as partes deverão adequar o contrato conforme necessário. Eventuais custos adicionais decorrentes de novas exigências legais, como documentação suplementar, taxas, traduções, legalizações ou outras obrigações impostas pelos órgãos competentes, serão de responsabilidade exclusiva do CONTRATANTE.", style: "paragraph", margin: [0, 10, 0, 10]
    });

    content.push({
      text: "A CONTRATADA compromete-se a informar o CONTRATANTE por escrito sobre eventuais mudanças relevantes, prestando a devida orientação quanto às adaptações necessárias para a continuidade do processo.", style: "paragraph", margin: [0, 10, 0, 10]
    });

    content.push({ text: "________________________________________________________________________________", alignment: "center", margin: [0, 10, 0, 15] });

    const formaPagamento = document.getElementById("forma-pagamento").value;
    const valorDaProposta = parseFloat(document.getElementById("valor-proposta").value);
    const qntdParcelas = parseInt(document.getElementById("qntd-parcelas").value, 10);
    const dataInicialPagamento = document.getElementById("data-inicial-pagamento").value;
    const datasPagamento = calcularDatasPagamento(dataInicialPagamento, 6, 3);
    const valorHonorario = parseFloat(valorDaProposta) - 650;

    let textoFormaPagamento = "";

    if (formaPagamento === "cartao") {
      textoFormaPagamento = [
        "O valor total do contrato é de ",
        { text: `${valorDaProposta} euros`, bold: true },
        ", sendo discriminados da seguinte forma:\n\n",
        "- ",
        { text: `${valorHonorario} euros`, bold: true },
        " referentes aos honorários;\n",
        "- O valor referente à taxa inicial de 650 euros deverá ser pago no momento do protocolo do processo.\n\n",
        `O valor será pago em ${qntdParcelas} parcelas através de cartão de crédito.\n\n`,
        "As partes estão cientes que é possível, até o momento do envio da documentação para a Espanha, acrescentar novos membros no processo, ",
        "cujo valor a acrescentar será de 600,00 euros por pessoa adulta (maior de 18 anos) e/ou menor desacompanhado.\n\n",
        "As partes acordam que será facultado ao contratado o direito de realizar a cobrança do valor contratado por todos os meios admitidos em direito."
      ];
    } else if (formaPagamento === "boleto") {
      const valorRealEuro = (valorDaProposta * cotacaoEuro).toFixed(2);
      const valorParcela = (valorRealEuro / qntdParcelas).toFixed(2);

      textoFormaPagamento = [
        "O valor total do contrato é de ",
        { text: `${valorDaProposta} euros`, bold: true },
        ", sendo discriminados da seguinte forma:\n\n",
        "- ",
        { text: `${valorHonorario} euros`, bold: true },
        " referentes aos honorários\n",
        "- O valor referente à taxa inicial de 650 euros deverá ser pago no momento do protocolo do processo.\n\n",
        "Ficou acordado entre as partes que o contratante fará o pagamento através de transferência bancária da seguinte maneira:\n",
        `Em ${qntdParcelas} parcela(s), no valor de R$ ${valorParcela} reais cada, totalizando no final R$${valorRealEuro} reais, `,
        "através de boleto pelo ASAAS que será gerado com o primeiro vencimento para o dia ",
        { text: `${datasPagamento[0]}`, bold: true },
        " e parcelas subsequentes até a plena quitação contratual."
      ];
    } else if (formaPagamento === "transferencia") {
      textoFormaPagamento = [
        "O valor total do contrato é de ",
        { text: `${valorDaProposta} euros`, bold: true },
        ", sendo discriminados da seguinte forma:\n\n",
        "- ",
        { text: `${valorHonorario} euros`, bold: true },
        " referentes aos honorários\n",
        "- O valor referente à taxa inicial de 650 euros deverá ser pago no momento do protocolo do processo.\n\n",
        "Ficou acordado entre as partes que os contratantes farão o pagamento através de transferência bancária da seguinte maneira:\n",
        "- 50% dos honorários na assinatura do contrato até ",
        { text: `${datasPagamento[0]}`, bold: true },
        ";\n- 25% dos honorários em ",
        { text: `${datasPagamento[1]}`, bold: true },
        ";\n- 25% dos honorários em ",
        { text: `${datasPagamento[2]}`, bold: true },
        "."
      ];
    }

    content.push(
      { text: "VI. DO VALOR E DAS FORMAS DE PAGAMENTO", style: "subHeader", margin: [0, 10, 0, 10] },
      { text: textoFormaPagamento, style: "paragraph", margin: [0, 0, 0, 5], alignment: "justify" }
    );

    content.push(
      {
        text: "A CONTRATADA poderá ajustar os valores das parcelas vincendas em caso de variação cambial superior a 10% (dez por cento) em relação à cotação aplicada na data da assinatura do contrato, mediante comunicação prévia ao CONTRATANTE com pelo menos 30 (trinta) dias de antecedência.",
        style: "paragraph",
        margin: [0, 10, 0, 10]
      }
    );

    const textosFinais = [
      { textPDF: "As partes acordam que o atraso superior a 30 (trinta) dias de qualquer parcela em fase administrativa resultará na aplicação de juros de mora de 1% (um por cento) ao mês, acrescido de multa de 2% sobre o valor da parcela em atraso. Além disso, tal atraso culminará na suspensão dos serviços contratados, os quais somente serão retomados após a regularização integral do débito, incluindo eventuais encargos incidentes." },
      { textPDF: "No caso de pagamento por meio de cartão de crédito, o CONTRATANTE está ciente de que haverá a incidência de encargos financeiros aplicados pela administradora do cartão, os quais são de sua exclusiva responsabilidade." },
      { textPDF: "As partes estão cientes que os atos processuais como, distribuição do processo, e transcrição de sentença, só serão realizados com o pagamento em dia. Caso haja pendências contratuais no momento de tais atos, o mesmo restará suspenso, até a quitação do saldo devedor." },
      { textPDF: "As partes estão cientes de que, até o momento do envio da documentação para a Itália, é possível incluir novos membros no processo. O valor adicional para cada requerente maior de 12 anos será de 500 euros. Caso haja inclusão de um novo requerente, o valor das parcelas subsequentes será ajustado proporcionalmente, considerando o acréscimo inserido e o número de parcelas ainda pendentes." },
      { textPDF: "Requerentes menores de idade 12 anos poderão ser incluídos gratuitamente, desde que acompanhados por pelo menos um dos genitores que também figure como requerente no processo. Caso o menor seja incluído sem a participação do genitor, ele será considerado como requerente individual, e o valor adicional de honorários será aplicado." }
    ];

    content.push({
      ol: textosFinais.map(item => item.textPDF),
      margin: [0, 10, 0, 10]
    });

    content.push({ text: "________________________________________________________________________________", alignment: "center", margin: [0, 10, 0, 15] });

    content.push({
      text: "VII. DA VARIAÇÃO CAMBIAL",
      style: "header",
      margin: [0, 10, 0, 10]
    })

    content.push({
      text: "Os valores contratados em euros serão convertidos para reais conforme a cotação oficial da Wise no dia do pagamento.",
      style: "paragraph",
    });
    content.push({
      text: "O CONTRATANTE poderá optar pela rescisão contratual caso não concorde com a atualização dos valores, ficando responsável apenas pelo pagamento proporcional dos serviços já prestados até a data da solicitação de rescisão.",
      style: "paragraph"
    });

    content.push({ text: "________________________________________________________________________________", alignment: "center", margin: [0, 10, 0, 15] });

    content.push({ text: "VIII. DA CONTINUIDADE EM CASO DE FALECIMENTO", style: "header", margin: [0, 10, 0, 10] });

    content.push({
      text: "1. Em caso de falecimento do CONTRATANTE, seus sucessores legais poderão optar pela continuidade do contrato, devendo formalizar essa decisão por escrito no prazo máximo de 30 (trinta) dias a contar da data do falecimento.",
      style: "list"
    });
    content.push({
      text: "2. Caso os sucessores optem por não prosseguir com o contrato, este será considerado rescindido automaticamente, sem direito a reembolso dos valores já pagos, uma vez que estes se referem a serviços já prestados até a data da rescisão.",
      style: "list"
    });
    content.push({
      text: "3. Em caso de falecimento da advogada responsável, a CONTRATADA se compromete a indicar outro profissional devidamente habilitado para a continuidade do processo.",
      style: "list"
    });

    content.push({ text: "________________________________________________________________________________", alignment: "center", margin: [0, 10, 0, 15] });

    content.push({
      text: "IX. DA RESCISÃO CONTRATUAL",
      style: "header",
      margin: [0, 10, 0, 10]
    });

    content.push({
      text: "A rescisão do presente contrato poderá ocorrer nas seguintes hipóteses:", style: "paragraph", margin: [0, 5, 0, 15]
    });

    const listItemOne = [
      { text: "1. " },
      { text: "Por qualquer das partes", bold: true, style: "paragraph" },
      { text: ", mediante notificação formal, com antecedência mínima de 30 (trinta) dias, sem necessidade de justificativa.", style: "paragraph" }
    ];

    content.push({
      text: listItemOne, style: "list"
    });

    const listItemTwo = [
      { text: "2. " },
      { text: "Por descumprimento contratual;", bold: true },
    ];

    content.push({
      text: listItemTwo, style: "list"
    });

    const listItemTree = [
      { text: "3. " },
      { text: "Por revogação ou cassação do mandato", bold: true },
      { text: ", sem que haja culpa da CONTRATADA. Nesse caso, será devida uma multa correspondente a 50% (cinquenta por cento) do valor total do contrato." }
    ];

    content.push({
      text: listItemTree, style: "list"
    });

    const listItemFour = [
      { text: "4. " },
      { text: "Por iniciativa da CONTRATANTE", bold: true },
      { text: ", sem que haja culpa da CONTRATADA, sem direito ao reembolso dos valores pagos;" }
    ];

    content.push({
      text: listItemFour, style: "list"
    });

    const listItemFive = [
      { text: "5. " },
      { text: "Por motivos de força maior", bold: true },
      { text: ", sem responsabilidade de nenhuma das partes." }
    ];

    content.push({
      text: listItemFive, style: "list"
    });

    content.push({ text: "________________________________________________________________________________", alignment: "center", margin: [0, 10, 0, 15] });

    content.push({
      text: "X. DO FORO",
      style: "header",
      margin: [0, 10, 0, 10]
    });

    content.push({
      text: "As partes elegem, de comum acordo, o foro da Comarca de Florianópolis, Estado de Santa Catarina, como o único competente para dirimir eventuais controvérsias oriundas deste instrumento.",
      style: "paragraph",
      margin: [0, 10, 0, 10]
    });

    content.push({
      text: "Por estarem justos e contratados, assinam o presente instrumento em duas vias de igual teor e forma.",
      style: "paragraph",
      margin: [0, 10, 0, 10]
    });

    content.push(
      { text: `Verona, ${dataEmissao}`, style: "paragraph", margin: [0, 20, 0, 15], bold: true }
    );

    const contratanteSignature = [
      { text: "CONTRATANTE:", bold: true },
      { text: "________________________________________" }
    ];

    content.push({ text: contratanteSignature, style: "paragraph", margin: [0, 10, 0, 10] });

    const contratadaSignature = [
      { text: "CONTRATADA:", bold: true },
      { text: "________________________________________" }
    ];

    content.push(
      { text: contratadaSignature, style: "paragraph", margin: [0, 10, 0, 10] },
    );

    const docDefinition = {
      pageSize: "A4",
      pageMargins: [80, 60, 80, 40],
      content: content,
      styles: {
        header: { bold: true, fontSize: 11 },
        subHeader: { bold: true, fontSize: 11 },
        list: { fontSize: 11, margin: [10, 0, 0, 5] },
        paragraph: { fontSize: 11, alignment: "justify" },
        assinaturaNome: { fontSize: 11, bold: false },
      },
      background: {
        image: bgImage,
        width: 595.28,
        height: 841.89,
      },
    };

    pdfMake.createPdf(docDefinition).getBlob((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);

      const nomePrimeiroRequerente = nomesRequerentes[0] || "Contrato";
      link.download = `Contrato Cidadania Espanhola - ${nomePrimeiroRequerente}.pdf`;

      link.click();
      URL.revokeObjectURL(link.href);
    });
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    alert("Ocorreu um erro ao gerar o PDF.");
  }
});
