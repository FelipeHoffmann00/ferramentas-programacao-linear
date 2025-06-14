document.addEventListener('DOMContentLoaded', () => {
    const entradaCantoNoroesteDiv = document.getElementById('entradaCantoNoroeste');
    const saidaCantoNoroesteDiv = document.getElementById('saidaCantoNoroeste');
    const entradaMenorCustoDiv = document.getElementById('entradaMenorCusto');
    const saidaMenorCustoDiv = document.getElementById('saidaMenorCusto');

    // Funções para renderizar inputs de transporte (fontes/destinos)
    function renderizarEntradasTransporte(targetDiv, metodo) {
        const numFontesInputId = `numFontes${metodo === 'noroeste' ? 'Noroeste' : 'MenorCusto'}`;
        const numDestinosInputId = `numDestinos${metodo === 'noroeste' ? 'Noroeste' : 'MenorCusto'}`;
        const criarMatrizBtnId = `criarMatrizTransporte${metodo === 'noroeste' ? 'Noroeste' : 'MenorCusto'}`;
        const camposMatrizContainerId = `campos${metodo === 'noroeste' ? 'CantoNoroeste' : 'MenorCusto'}`;

        const configHtml = `
            <div class="config-transporte">
                <div class="config-item-transporte">
                    <label for="${numFontesInputId}">Número de Fontes:</label>
                    <input type="number" id="${numFontesInputId}" min="1" value="2">
                </div>
                <div class="config-item-transporte">
                    <label for="${numDestinosInputId}">Número de Destinos:</label>
                    <input type="number" id="${numDestinosInputId}" min="1" value="2">
                </div>
                <button id="${criarMatrizBtnId}">Criar Matriz</button>
            </div>
            <div class="matriz-transporte-campos" id="${camposMatrizContainerId}">
                </div>
        `;
        targetDiv.innerHTML = configHtml;

        document.getElementById(criarMatrizBtnId).addEventListener('click', (event) => {
            const currentNumFontes = parseInt(document.getElementById(numFontesInputId).value);
            const currentNumDestinos = parseInt(document.getElementById(numDestinosInputId).value);
            criarMatrizTransporte(currentNumFontes, currentNumDestinos, camposMatrizContainerId, metodo);
        });

        const defaultNumFontes = parseInt(document.getElementById(numFontesInputId).value);
        const defaultNumDestinos = parseInt(document.getElementById(numDestinosInputId).value);
        criarMatrizTransporte(defaultNumFontes, defaultNumDestinos, camposMatrizContainerId, metodo);
    }

    // Função para criar a matriz de custos, oferta e demanda
    function criarMatrizTransporte(numFontes, numDestinos, camposMatrizContainerId, metodo) {
        if (isNaN(numFontes) || numFontes < 1 || isNaN(numDestinos) || numDestinos < 1) {
            alert('Por favor, insira um número válido para fontes e destinos (mín. 1).');
            return;
        }

        const camposMatrizContainer = document.getElementById(camposMatrizContainerId);
        let matrizHtml = '<h4>Matriz de Custos</h4><table>';
        matrizHtml += '<thead><tr><th></th>';
        for (let j = 0; j < numDestinos; j++) {
            matrizHtml += `<th>D${j + 1}</th>`;
        }
        matrizHtml += `<th>Oferta</th></tr></thead><tbody>`;

        for (let i = 0; i < numFontes; i++) {
            matrizHtml += `<tr><th>F${i + 1}</th>`;
            for (let j = 0; j < numDestinos; j++) {
                matrizHtml += `<td><input type="number" class="custo-celula" data-fonte="${i}" data-dest="${j}" value="10" min="0"></td>`;
            }
            matrizHtml += `<td><input type="number" class="oferta-celula" data-fonte="${i}" value="100" min="0"></td></tr>`;
        }

        matrizHtml += `<tr><th>Demanda</th>`;
        for (let j = 0; j < numDestinos; j++) {
            matrizHtml += `<td><input type="number" class="demanda-celula" data-dest="${j}" value="80" min="0"></td>`;
        }
        matrizHtml += `<td></td></tr></tbody></table>`;

        matrizHtml += `<div class="botoes-transporte">`;
        if (metodo === 'noroeste') {
            matrizHtml += `<button id="executarCantoNoroeste">Executar Canto Noroeste</button>`;
        } else {
            matrizHtml += `<button id="executarMenorCusto">Executar Menor Custo</button>`;
        }
        matrizHtml += `</div>`;

        camposMatrizContainer.innerHTML = matrizHtml;

        // Adiciona listeners para os botões de execução APÓS a criação
        if (metodo === 'noroeste') {
            // Adicionado console.log para depuração do listener
            const btnNoroeste = document.getElementById('executarCantoNoroeste');
            if (btnNoroeste) {
                btnNoroeste.addEventListener('click', () => {
                    console.log("DEBUG_TRANSPORTE: Botão 'Executar Canto Noroeste' clicado."); // DEBUG
                    runTransportationMethod(camposMatrizContainerId, metodo);
                });
            } else {
                console.error("DEBUG_TRANSPORTE: Botão 'executarCantoNoroeste' não encontrado!"); // DEBUG
            }
        } else {
            const btnMenorCusto = document.getElementById('executarMenorCusto');
            if (btnMenorCusto) {
                btnMenorCusto.addEventListener('click', () => {
                    console.log("DEBUG_TRANSPORTE: Botão 'Executar Menor Custo' clicado."); // DEBUG
                    runTransportationMethod(camposMatrizContainerId, metodo);
                });
            } else {
                console.error("DEBUG_TRANSPORTE: Botão 'executarMenorCusto' não encontrado!"); // DEBUG
            }
        }
    }

    // Função para coletar os dados da matriz
    function getTransportationData(camposMatrizContainerId) {
        console.log("DEBUG_TRANSPORTE: Coletando dados de transporte..."); // DEBUG
        const container = document.getElementById(camposMatrizContainerId);
        if (!container) {
            console.error("DEBUG_TRANSPORTE: Container de campos da matriz não encontrado:", camposMatrizContainerId); // DEBUG
            return null; // Retorna null se o container não for encontrado
        }

        const custosInputs = container.querySelectorAll('.custo-celula');
        const ofertaInputs = container.querySelectorAll('.oferta-celula');
        const demandaInputs = container.querySelectorAll('.demanda-celula');

        const numFontes = ofertaInputs.length;
        const numDestinos = demandaInputs.length;

        const custos = [];
        for (let i = 0; i < numFontes; i++) {
            // ERRO AQUI: costs.push([]) deveria ser custos.push([])
            custos.push([]); // Inicializa a sub-array para a fonte 'i'
            for (let j = 0; j < numDestinos; j++) {
                const input = container.querySelector(`.custo-celula[data-fonte="${i}"][data-dest="${j}"]`);
                // Adicione uma verificação de NaN aqui
                const valor = parseFloat(input.value);
                if (isNaN(valor)) {
                    console.error(`DEBUG_TRANSPORTE: Valor inválido para custo na Fonte ${i+1}, Destino ${j+1}.`); // DEBUG
                    // Pode retornar null ou lançar um erro
                    return null;
                }
                custos[i].push(valor);
            }
        }

        const oferta = Array.from(ofertaInputs).map(input => {
            const valor = parseFloat(input.value);
            if (isNaN(valor)) {
                console.error(`DEBUG_TRANSPORTE: Valor inválido para oferta da Fonte ${input.dataset.fonte}.`); // DEBUG
                return NaN; // Marcar como NaN para a verificação de erro
            }
            return valor;
        });
        const demanda = Array.from(demandaInputs).map(input => {
            const valor = parseFloat(input.value);
            if (isNaN(valor)) {
                console.error(`DEBUG_TRANSPORTE: Valor inválido para demanda do Destino ${input.dataset.dest}.`); // DEBUG
                return NaN; // Marcar como NaN para a verificação de erro
            }
            return valor;
        });

        // Verifique se algum NaN foi retornado
        if (oferta.includes(NaN) || demanda.includes(NaN) || custos.some(row => row.includes(NaN))) {
            alert("Por favor, insira apenas valores numéricos válidos em todos os campos.");
            return null;
        }

        console.log("DEBUG_TRANSPORTE: Dados coletados - Custos:", custos, "Oferta:", oferta, "Demanda:", demanda); // DEBUG
        return { custos, oferta, demanda, numFontes, numDestinos };
    }

    // Função unificada para executar o método de transporte (Canto Noroeste ou Menor Custo)
    function runTransportationMethod(camposMatrizContainerId, metodo) {
        console.log(`DEBUG_TRANSPORTE: Executando método ${metodo}...`); // DEBUG
        const data = getTransportationData(camposMatrizContainerId);
        if (!data) { // Se a coleta de dados falhou (retornou null)
            console.error("DEBUG_TRANSPORTE: Coleta de dados falhou, abortando execução."); // DEBUG
            return;
        }
        const { custos, oferta, demanda, numFontes, numDestinos } = data;
        
        const saidaDiv = metodo === 'noroeste' ? saidaCantoNoroesteDiv : saidaMenorCustoDiv;

        const totalOferta = oferta.reduce((sum, val) => sum + val, 0);
        const totalDemanda = demanda.reduce((sum, val) => sum + val, 0);
        console.log(`DEBUG_TRANSPORTE: Oferta Total: ${totalOferta}, Demanda Total: ${totalDemanda}`); // DEBUG

        if (Math.abs(totalOferta - totalDemanda) > 1e-9) {
            saidaDiv.innerHTML = `<p class="erro">Erro: O problema não está balanceado! Oferta Total (${totalOferta}) ≠ Demanda Total (${totalDemanda}).</p>`;
            console.error("DEBUG_TRANSPORTE: Problema não balanceado."); // DEBUG
            return;
        }

        let alocacoes; // Matriz de alocações (x_ij)
        let custoTotal = 0;

        if (metodo === 'noroeste') {
            console.log("DEBUG_TRANSPORTE: Chamando metodoCantoNoroeste..."); // DEBUG
            alocacoes = metodoCantoNoroeste(custos, oferta, demanda, numFontes, numDestinos);
            custoTotal = calcularCustoTotal(alocacoes, custos, numFontes, numDestinos);
            saidaDiv.innerHTML = `
                <h4>Resultados do Método do Canto Noroeste</h4>
                ${formatarTabelaAlocacoes(alocacoes, numFontes, numDestinos)}
                <p>Custo Total: <strong>${custoTotal.toFixed(2)}</strong></p>
            `;
            console.log("DEBUG_TRANSPORTE: Método Canto Noroeste concluído. Custo:", custoTotal); // DEBUG
        } else { // Menor Custo
            console.log("DEBUG_TRANSPORTE: Chamando metodoMenorCusto..."); // DEBUG
            alocacoes = metodoMenorCusto(custos, oferta, demanda, numFontes, numDestinos);
            custoTotal = calcularCustoTotal(alocacoes, custos, numFontes, numDestinos);
            saidaDiv.innerHTML = `
                <h4>Resultados do Método do Menor Custo</h4>
                ${formatarTabelaAlocacoes(alocacoes, numFontes, numDestinos)}
                <p>Custo Total: <strong>${custoTotal.toFixed(2)}</strong></p>
            `;
            console.log("DEBUG_TRANSPORTE: Método Menor Custo concluído. Custo:", custoTotal); // DEBUG
        }
    }

    // --- Algoritmos do Método de Transporte ---

    function metodoCantoNoroeste(custos, ofertaOriginal, demandaOriginal, numFontes, numDestinos) {
        console.log("DEBUG_TRANSPORTE: Dentro de metodoCantoNoroeste."); // DEBUG
        const oferta = [...ofertaOriginal];
        const demanda = [...demandaOriginal];
        const alocacoes = Array.from({ length: numFontes }, () => Array(numDestinos).fill(0));

        let i = 0; // Índice da fonte (linha)
        let j = 0; // Índice do destino (coluna)

        while (i < numFontes && j < numDestinos) {
            const quantidadeAlocada = Math.min(oferta[i], demanda[j]);
            alocacoes[i][j] = quantidadeAlocada;

            oferta[i] -= quantidadeAlocada;
            demanda[j] -= quantidadeAlocada;

            console.log(`DEBUG_TRANSPORTE: CN - Alocado ${quantidadeAlocada} de F${i+1} para D${j+1}. Oferta F${i+1}: ${oferta[i]}, Demanda D${j+1}: ${demanda[j]}`); // DEBUG

            if (oferta[i] === 0) {
                i++;
            }
            if (demanda[j] === 0) {
                j++;
            }
        }
        return alocacoes;
    }

    function metodoMenorCusto(custosOriginal, ofertaOriginal, demandaOriginal, numFontes, numDestinos) {
        console.log("DEBUG_TRANSPORTE: Dentro de metodoMenorCusto."); // DEBUG
        const custos = custosOriginal.map(row => [...row]);
        const oferta = [...ofertaOriginal];
        const demanda = [...demandaOriginal];
        const alocacoes = Array.from({ length: numFontes }, () => Array(numDestinos).fill(0));

        const celulas = [];
        for (let i = 0; i < numFontes; i++) {
            for (let j = 0; j < numDestinos; j++) {
                celulas.push({ fonte: i, destino: j, custo: custos[i][j] });
            }
        }

        celulas.sort((a, b) => a.custo - b.custo);

        for (const celula of celulas) {
            const { fonte: i, destino: j } = celula;

            if (oferta[i] > 0 && demanda[j] > 0) {
                const quantidadeAlocada = Math.min(oferta[i], demanda[j]);
                alocacoes[i][j] = quantidadeAlocada;

                oferta[i] -= quantidadeAlocada;
                demanda[j] -= quantidadeAlocada;
                console.log(`DEBUG_TRANSPORTE: MC - Alocado ${quantidadeAlocada} de F${i+1} para D${j+1} (Custo ${celula.custo}). Oferta F${i+1}: ${oferta[i]}, Demanda D${j+1}: ${demanda[j]}`); // DEBUG
            }
        }
        return alocacoes;
    }

    function calcularCustoTotal(alocacoes, custos, numFontes, numDestinos) {
        console.log("DEBUG_TRANSPORTE: Calculando custo total..."); // DEBUG
        let custoTotal = 0;
        for (let i = 0; i < numFontes; i++) {
            for (let j = 0; j < numDestinos; j++) {
                custoTotal += alocacoes[i][j] * custos[i][j];
            }
        }
        return custoTotal;
    }

    function formatarTabelaAlocacoes(alocacoes, numFontes, numDestinos) {
        console.log("DEBUG_TRANSPORTE: Formatando tabela de alocações para HTML."); // DEBUG
        let html = '<table class="tabela-alocacoes"><thead><tr><th></th>';
        for (let j = 0; j < numDestinos; j++) {
            html += `<th>D${j + 1}</th>`;
        }
        html += `</tr></thead><tbody>`;

        for (let i = 0; i < numFontes; i++) {
            html += `<tr><th>F${i + 1}</th>`;
            for (let j = 0; j < numDestinos; j++) {
                html += `<td>${alocacoes[i][j]}</td>`;
            }
            html += `</tr>`;
        }
        html += `</tbody></table>`;
        return html;
    }


    renderizarEntradasTransporte(entradaCantoNoroesteDiv, 'noroeste');
    renderizarEntradasTransporte(entradaMenorCustoDiv, 'menorCusto');
});