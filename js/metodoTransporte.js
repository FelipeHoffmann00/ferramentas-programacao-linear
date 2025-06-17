document.addEventListener('DOMContentLoaded', () => {

    // Referências aos containers de entrada e saída
    const entradaCantoNoroesteDiv = document.getElementById('entradaCantoNoroeste');
    const saidaCantoNoroesteDiv = document.getElementById('saidaCantoNoroeste');
    const entradaMenorCustoDiv = document.getElementById('entradaMenorCusto');
    const saidaMenorCustoDiv = document.getElementById('saidaMenorCusto');

    // Função genérica para montar o bloco de input de transporte
    function criarInterfaceTransporte(container, metodo) {
        const prefixo = metodo === 'noroeste' ? 'Noroeste' : 'MenorCusto';

        // Geração do HTML inicial com inputs de número de fontes e destinos
        container.innerHTML = `
            <div class="config-transporte">
                <label>Fontes:</label>
                <input type="number" id="numFontes${prefixo}" value="2" min="1">
                <label>Destinos:</label>
                <input type="number" id="numDestinos${prefixo}" value="2" min="1">
                <button id="criarMatriz${prefixo}">Criar Matriz</button>
            </div>
            <div class="matriz-container" id="matrizCampos${prefixo}"></div>
        `;

        // Adiciona listener ao botão "Criar Matriz"
        document.getElementById(`criarMatriz${prefixo}`).addEventListener('click', () => {
            const numFontes = parseInt(document.getElementById(`numFontes${prefixo}`).value);
            const numDestinos = parseInt(document.getElementById(`numDestinos${prefixo}`).value);
            criarMatriz(numFontes, numDestinos, `matrizCampos${prefixo}`, metodo);
        });

        // Cria uma matriz inicial ao carregar
        criarMatriz(2, 2, `matrizCampos${prefixo}`, metodo);
    }

    // Função para montar dinamicamente a matriz de inputs (custos, oferta, demanda)
    function criarMatriz(numFontes, numDestinos, containerId, metodo) {
        const container = document.getElementById(containerId);
        let html = '<h4>Matriz de Custos</h4><table><thead><tr><th></th>';

        // Cabeçalho (Destinos)
        for (let j = 0; j < numDestinos; j++)
            html += `<th>D${j+1}</th>`;
        html += '<th>Oferta</th></tr></thead><tbody>';

        // Linhas de fontes com inputs
        for (let i = 0; i < numFontes; i++) {
            html += `<tr><th>F${i+1}</th>`;
            for (let j = 0; j < numDestinos; j++) {
                html += `<td><input type="number" class="custo" data-i="${i}" data-j="${j}" value="10" min="0"></td>`;
            }
            html += `<td><input type="number" class="oferta" data-i="${i}" value="80" min="0"></td></tr>`;
        }

        // Linha de demanda
        html += '<tr><th>Demanda</th>';
        for (let j = 0; j < numDestinos; j++) {
            html += `<td><input type="number" class="demanda" data-j="${j}" value="80" min="0"></td>`;
        }
        html += '<td></td></tr></tbody></table>';

        // Botão de execução do método
        html += `<button id="executar${metodo}">Executar ${metodo === 'noroeste' ? 'Canto Noroeste' : 'Menor Custo'}</button>`;
        container.innerHTML = html;

        // Adiciona listener ao botão de execução
        document.getElementById(`executar${metodo}`).addEventListener('click', () => {
            executarTransporte(containerId, metodo);
        });
    }

    // Coleta os dados da matriz preenchida
    function obterDados(containerId) {
        const container = document.getElementById(containerId);
        const custos = [];
        const oferta = [];
        const demanda = [];

        const numFontes = container.querySelectorAll('.oferta').length;
        const numDestinos = container.querySelectorAll('.demanda').length;

        // Coletar custos
        for (let i = 0; i < numFontes; i++) {
            custos[i] = [];
            for (let j = 0; j < numDestinos; j++) {
                const input = container.querySelector(`.custo[data-i="${i}"][data-j="${j}"]`);
                const val = parseFloat(input.value);
                if (isNaN(val)) return null;
                custos[i][j] = val;
            }
        }

        // Coletar oferta
        container.querySelectorAll('.oferta').forEach(input => {
            const val = parseFloat(input.value);
            if (isNaN(val)) return null;
            oferta.push(val);
        });

        // Coletar demanda
        container.querySelectorAll('.demanda').forEach(input => {
            const val = parseFloat(input.value);
            if (isNaN(val)) return null;
            demanda.push(val);
        });

        return { custos, oferta, demanda, numFontes, numDestinos };
    }

    // Função unificada de execução
    function executarTransporte(containerId, metodo) {
        const dados = obterDados(containerId);
        if (!dados) {
            alert("Preencha todos os campos corretamente.");
            return;
        }

        const { custos, oferta, demanda, numFontes, numDestinos } = dados;

        // Balanceamento (validação básica)
        const totalOferta = oferta.reduce((a, b) => a + b, 0);
        const totalDemanda = demanda.reduce((a, b) => a + b, 0);
        if (totalOferta !== totalDemanda) {
            alert(`Oferta (${totalOferta}) e Demanda (${totalDemanda}) não estão balanceadas.`);
            return;
        }

        let alocacao, custoTotal;

        if (metodo === 'noroeste') {
            alocacao = cantoNoroeste(custos, oferta, demanda, numFontes, numDestinos);
        } else {
            alocacao = menorCusto(custos, oferta, demanda, numFontes, numDestinos);
        }

        custoTotal = calcularCusto(alocacao, custos);
        mostrarResultado(alocacao, metodo, custoTotal, numFontes, numDestinos);
    }

    // Algoritmo do Canto Noroeste
    function cantoNoroeste(custos, ofertaIn, demandaIn, linhas, colunas) {
        const oferta = [...ofertaIn];
        const demanda = [...demandaIn];
        const aloc = Array.from({ length: linhas }, () => Array(colunas).fill(0));

        let i = 0, j = 0;
        while (i < linhas && j < colunas) {
            const alocar = Math.min(oferta[i], demanda[j]);
            aloc[i][j] = alocar;
            oferta[i] -= alocar;
            demanda[j] -= alocar;

            if (oferta[i] === 0) i++;
            if (demanda[j] === 0) j++;
        }
        return aloc;
    }

    // Algoritmo do Menor Custo
    function menorCusto(custosIn, ofertaIn, demandaIn, linhas, colunas) {
        const oferta = [...ofertaIn];
        const demanda = [...demandaIn];
        const custos = custosIn.map(row => [...row]);
        const aloc = Array.from({ length: linhas }, () => Array(colunas).fill(0));

        const celulas = [];
        for (let i = 0; i < linhas; i++)
            for (let j = 0; j < colunas; j++)
                celulas.push({ i, j, custo: custos[i][j] });

        celulas.sort((a, b) => a.custo - b.custo);

        for (const { i, j } of celulas) {
            if (oferta[i] > 0 && demanda[j] > 0) {
                const alocar = Math.min(oferta[i], demanda[j]);
                aloc[i][j] = alocar;
                oferta[i] -= alocar;
                demanda[j] -= alocar;
            }
        }
        return aloc;
    }

    // Calcula o custo total da solução
    function calcularCusto(aloc, custos) {
        let total = 0;
        for (let i = 0; i < aloc.length; i++)
            for (let j = 0; j < aloc[0].length; j++)
                total += aloc[i][j] * custos[i][j];
        return total;
    }

    // Exibição dos resultados na tela
    function mostrarResultado(aloc, metodo, custo, linhas, colunas) {
        const divSaida = metodo === 'noroeste' ? saidaCantoNoroesteDiv : saidaMenorCustoDiv;
        let html = `<h4>Resultado - ${metodo === 'noroeste' ? 'Canto Noroeste' : 'Menor Custo'}</h4>`;
        html += '<table><thead><tr><th></th>';
        for (let j = 0; j < colunas; j++)
            html += `<th>D${j+1}</th>`;
        html += '</tr></thead><tbody>';
        for (let i = 0; i < linhas; i++) {
            html += `<tr><th>F${i+1}</th>`;
            for (let j = 0; j < colunas; j++)
                html += `<td>${aloc[i][j]}</td>`;
            html += '</tr>';
        }
        html += '</tbody></table>';
        html += `<p><strong>Custo Total: ${custo.toFixed(2)}</strong></p>`;
        divSaida.innerHTML = html;
    }

    // Inicialização: renderiza as interfaces dos dois métodos
    criarInterfaceTransporte(entradaCantoNoroesteDiv, 'noroeste');
    criarInterfaceTransporte(entradaMenorCustoDiv, 'menorCusto');
});
