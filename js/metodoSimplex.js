document.addEventListener('DOMContentLoaded', () => {
    const tipoProblemaSimplexSelect = document.getElementById('tipoProblemaSimplex');
    const numVariaveisSimplexInput = document.getElementById('numVariaveisSimplex');
    const numRestricoesSimplexInput = document.getElementById('numRestricoesSimplex');
    const gerarCamposSimplexBtn = document.getElementById('gerarCamposSimplex');
    const camposSimplexDiv = document.getElementById('camposSimplex');
    const saidaSimplexDiv = document.getElementById('saidaSimplex');

    // Valor para 'M' no Método Big M. Usado para penalizar variáveis artificiais.
    const M_GRANDE = 100000; // Um número suficientemente grande

    function gerarCamposDeEntradaSimplex() {
        const numVariaveis = parseInt(numVariaveisSimplexInput.value);
        const numRestricoes = parseInt(numRestricoesSimplexInput.value);

        if (isNaN(numVariaveis) || numVariaveis < 2 || isNaN(numRestricoes) || numRestricoes < 1) {
            alert('Por favor, insira um número válido para variáveis (mín. 2) e restrições (mín. 1).');
            return;
        }

        let htmlCampos = '';

        // --- Seção da Função Objetivo ---
        htmlCampos += `
            <div class="secao-entrada-simplex">
                <h4>Função Objetivo (${tipoProblemaSimplexSelect.value === 'max' ? 'Maximizar' : 'Minimizar'} Z)</h4>
                <div class="linha-coeficientes">
                    <label>Z = </label>
        `;
        for (let i = 0; i < numVariaveis; i++) {
            htmlCampos += `
                <input type="number" class="coef-variavel-objetivo" data-var-index="${i}" value="1">
                <label>X${i + 1}</label>
                ${i < numVariaveis - 1 ? '<label>+</label>' : ''}
            `;
        }
        htmlCampos += `
                </div>
            </div>
        `;

        // --- Seção das Restrições ---
        htmlCampos += `
            <div class="secao-entrada-simplex">
                <h4>Restrições</h4>
        `;
        for (let i = 0; i < numRestricoes; i++) {
            htmlCampos += `
                <div class="linha-coeficientes">
            `;
            for (let j = 0; j < numVariaveis; j++) {
                htmlCampos += `
                    <input type="number" class="coef-variavel-restricao" data-rest-index="${i}" data-var-index="${j}" value="1">
                    <label>X${j + 1}</label>
                    ${j < numVariaveis - 1 ? '<label>+</label>' : ''}
                `;
            }
            htmlCampos += `
                    <select class="operador-restricao" data-rest-index="${i}">
                        <option value="le"><=</option>
                        <option value="ge">>=</option>
                        <option value="eq">=</option>
                    </select>
                    <input type="number" class="lado-direito-restricao" data-rest-index="${i}" value="10">
                </div>
            `;
        }
        htmlCampos += `
            </div>
        `;

        // --- Botão de Executar Simplex ---
        htmlCampos += `
            <div class="rodape-simplex">
                <button id="executarSimplex">Executar Simplex</button>
            </div>
        `;

        camposSimplexDiv.innerHTML = htmlCampos;
        document.getElementById('executarSimplex').addEventListener('click', executarMetodoSimplex);
    }

    // --- FUNÇÃO PRINCIPAL: Executa o Método Simplex ---
    function executarMetodoSimplex() {
        saidaSimplexDiv.innerHTML = ''; // Limpa saídas anteriores

        const tipoProblema = tipoProblemaSimplexSelect.value;
        const numVariaveis = parseInt(numVariaveisSimplexInput.value);
        const numRestricoes = parseInt(numRestricoesSimplexInput.value);

        const coeficientesObjetivo = [];
        camposSimplexDiv.querySelectorAll('.coef-variavel-objetivo').forEach(input => {
            coeficientesObjetivo.push(parseFloat(input.value));
        });

        const restricoes = [];
        for (let i = 0; i < numRestricoes; i++) {
            const linhaCoeficientes = [];
            camposSimplexDiv.querySelectorAll(`.coef-variavel-restricao[data-rest-index="${i}"]`).forEach(input => {
                linhaCoeficientes.push(parseFloat(input.value));
            });
            const tipo = camposSimplexDiv.querySelector(`.operador-restricao[data-rest-index="${i}"]`).value;
            const ladoDireito = parseFloat(camposSimplexDiv.querySelector(`.lado-direito-restricao[data-rest-index="${i}"]`).value);
            restricoes.push({ coefs: linhaCoeficientes, tipo: tipo, ladoDireito: ladoDireito });
        }

        // --- 1. Preparar o Problema para a Forma Padrão (incluindo Método Big M) ---
        const foParaSimplex = [...coeficientesObjetivo];
        if (tipoProblema === 'min') {
            for (let i = 0; i < foParaSimplex.length; i++) {
                foParaSimplex[i] *= -1; // Converte para maximização
            }
        }

        let numSlackVars = 0;
        let numSurplusVars = 0;
        let numArtificialVars = 0;

        restricoes.forEach(r => {
            if (r.tipo === 'le') { // <=
                numSlackVars++;
            } else if (r.tipo === 'ge') { // >=
                numSurplusVars++;
                numArtificialVars++;
            } else if (r.tipo === 'eq') { // =
                numArtificialVars++;
            }
        });

        const numColunasTabela = numVariaveis + numSlackVars + numSurplusVars + numArtificialVars + 1; // +1 para o RHS

        const tabelaSimplex = [];

        // Criar a linha da Função Objetivo (linha 0)
        const linhaFO = new Array(numColunasTabela).fill(0);
        for (let i = 0; i < numVariaveis; i++) {
            linhaFO[i] = -foParaSimplex[i]; // Coeficientes da FO negativos
        }
        // Adicionar penalidade -M para as variáveis artificiais na linha FO
        let tempArtificialIndex = numVariaveis + numSlackVars + numSurplusVars;
        for (let i = 0; i < numArtificialVars; i++) {
            linhaFO[tempArtificialIndex + i] = -M_GRANDE; // Penalidade -M para maximização (pois já convertemos minimização para maximização)
        }
        linhaFO[numColunasTabela - 1] = 0; // Valor de Z inicial
        tabelaSimplex.push(linhaFO);

        let slackIndex = numVariaveis; // Onde as variáveis de folga começam
        let surplusIndex = numVariaveis + numSlackVars; // Onde as variáveis de excesso começam
        let artificialIndex = numVariaveis + numSlackVars + numSurplusVars; // Onde as variáveis artificiais começam
        const basicVariables = new Array(numRestricoes + 1).fill(null); // Para rastrear as variáveis básicas
        basicVariables[0] = "Z"; // A variável básica da linha FO é Z

        // Para dar nomes A1, A2, etc., corretos para as variáveis artificiais
        let currentArtificialVarCount = 0; 

        restricoes.forEach((r, i) => {
            const linhaRestricao = new Array(numColunasTabela).fill(0);
            for (let j = 0; j < numVariaveis; j++) {
                linhaRestricao[j] = r.coefs[j];
            }

            if (r.tipo === 'le') {
                linhaRestricao[slackIndex] = 1;
                basicVariables[i + 1] = `S${slackIndex - numVariaveis + 1}`; // S1, S2...
                slackIndex++;
            } else if (r.tipo === 'ge') {
                linhaRestricao[surplusIndex] = -1; // Variável de Excesso
                linhaRestricao[artificialIndex] = 1; // Variável Artificial
                basicVariables[i + 1] = `A${currentArtificialVarCount + 1}`; // A1, A2...
                currentArtificialVarCount++;
                surplusIndex++;
                artificialIndex++;
            } else if (r.tipo === 'eq') {
                linhaRestricao[artificialIndex] = 1; // Variável Artificial
                basicVariables[i + 1] = `A${currentArtificialVarCount + 1}`; // A1, A2...
                currentArtificialVarCount++;
                artificialIndex++;
            }
            linhaRestricao[numColunasTabela - 1] = r.ladoDireito; // RHS
            tabelaSimplex.push(linhaRestricao);
        });

        // DEBUG: Verifique a tabela antes do ajuste Big M
        console.log("DEBUG_BIGM: Tabela Simplex ANTES do ajuste Big M inicial:");
        console.table(tabelaSimplex.map(row => row.map(val => parseFloat(val.toFixed(2)))));
        console.log("DEBUG_BIGM: Variáveis Básicas Iniciais:", basicVariables);

        // *** Fase 0 (Ajuste Big M): Zerar os coeficientes das variáveis artificiais básicas na linha FO ***
        for (let i = 1; i < tabelaSimplex.length; i++) { // Itera sobre as linhas de restrição (da linha 1 em diante)
            // Verifica se a variável básica desta linha é uma variável artificial
            if (basicVariables[i] && basicVariables[i].startsWith('A')) {
                let colunaDaArtificialBasica = -1;
                
                // Calcula o índice da coluna para esta variável artificial específica
                // A primeira artificial criada (A1) estará na coluna de índice 'numVariaveis + numSlackVars + numSurplusVars'
                // A segunda (A2) estará na coluna '... + 1', e assim por diante.
                const numArtificial = parseInt(basicVariables[i].substring(1)); // Pega o número da artificial (1 para A1, 2 para A2, etc.)
                colunaDaArtificialBasica = (numVariaveis + numSlackVars + numSurplusVars) + (numArtificial - 1);
                
                // OPCIONAL: Verificação extra para ter certeza que é um '1' na célula
                // (Isso é mais uma validação para a lógica de construção da tabela)
                if (colunaDaArtificialBasica >= numColunasTabela - 1 || Math.abs(tabelaSimplex[i][colunaDaArtificialBasica] - 1) > 1e-9) {
                    console.warn(`DEBUG_BIGM: Alerta: A variável ${basicVariables[i]} (coluna ${colunaDaArtificialBasica}) não tem 1 na sua célula esperada na linha ${i} ou o índice está fora do limite.`);
                    // Em caso de alerta, podemos decidir se queremos parar a execução ou tentar continuar.
                    // Por enquanto, vamos permitir que continue, mas o alerta é importante.
                    // Se o 1 não estiver lá, o fator pode ser incorreto e corromper a FO.
                }

                if (colunaDaArtificialBasica !== -1) {
                    const coeficienteNaFO = tabelaSimplex[0][colunaDaArtificialBasica]; // Pega o coeficiente da FO para essa coluna
                    console.log(`DEBUG_BIGM: Linha ${i}, Variável Básica: ${basicVariables[i]}, Coluna CORRETA encontrada: ${colunaDaArtificialBasica}, Coeficiente na FO: ${coeficienteNaFO.toFixed(2)}`);
                    console.log("DEBUG_BIGM: Linha FO ANTES da operação:", tabelaSimplex[0].map(val => val.toFixed(2)));
                    console.log("DEBUG_BIGM: Linha da Restrição (para operação):", tabelaSimplex[i].map(val => val.toFixed(2)));

                    // Se o coeficiente na FO não é zero (deveria ser -M, mas queremos que seja 0)
                    if (Math.abs(coeficienteNaFO) > 1e-9) {
                        const fatorParaAplicar = coeficienteNaFO; // O fator é o próprio coeficiente que queremos zerar
                        console.log(`DEBUG_BIGM: Aplicando operação de linha: Linha FO = Linha FO - (${fatorParaAplicar.toFixed(2)} * Linha ${i})`);
                        for (let j = 0; j < numColunasTabela; j++) { // Itera por todas as colunas, incluindo RHS
                            tabelaSimplex[0][j] -= fatorParaAplicar * tabelaSimplex[i][j];
                        }
                        console.log("DEBUG_BIGM: Linha FO após ajuste:", tabelaSimplex[0].map(val => val.toFixed(2)));
                    } else {
                        console.log(`DEBUG_BIGM: Coeficiente da Variável Artificial ${basicVariables[i]} na FO já é zero.`);
                    }
                } else {
                    console.warn(`DEBUG_BIGM: ERRO de Lógica: Não foi possível determinar a coluna CORRETA para a variável artificial básica na linha ${i}: ${basicVariables[i]}. Isso indica um problema na atribuição de colunas.`);
                }
            }
        }
        console.log("DEBUG_BIGM: Tabela Simplex APÓS ajuste Big M inicial (Fase 0 concluída):");
        console.table(tabelaSimplex.map(row => row.map(val => parseFloat(val.toFixed(2)))));


        // --- 2. Iterações do Simplex ---
        let iteracao = 0;
        const maxIteracoes = 100; // Limite para evitar loops infinitos

        while (iteracao < maxIteracoes) {
            // A. Encontrar a Coluna Pivô (Variável de Entrada)
            let colunaPivo = -1;
            let menorValorFO = 0; // Para maximização: busca o valor mais negativo
            for (let j = 0; j < numColunasTabela - 1; j++) {
                // Apenas considere valores negativos para a coluna pivô
                if (tabelaSimplex[0][j] < menorValorFO - 1e-9) { // Usar tolerância para garantir que é menor que zero
                    menorValorFO = tabelaSimplex[0][j];
                    colunaPivo = j;
                }
            }

            if (colunaPivo === -1) {
                // Se não há valores negativos na linha da FO, a solução é ótima.
                // Mas antes, verificar se alguma variável artificial ainda está na base com valor > 0
                // Se sim, e não há mais negativos na FO, o problema é infactível.
                let problemaInfactivel = false;
                for (let i = 1; i < tabelaSimplex.length; i++) {
                    if (basicVariables[i] && basicVariables[i].startsWith('A') && Math.abs(tabelaSimplex[i][numColunasTabela - 1]) > 1e-9) {
                        problemaInfactivel = true;
                        break;
                    }
                }
                if (problemaInfactivel) {
                    saidaSimplexDiv.innerHTML = `<p class="erro">Problema Infactível: Nenhuma solução satisfaz todas as restrições.</p>`;
                    return;
                }
                break; // Solução ótima encontrada
            }

            // B. Encontrar a Linha Pivô (Variável de Saída)
            let linhaPivo = -1;
            let menorRazao = Infinity;

            for (let i = 1; i < tabelaSimplex.length; i++) {
                const elementoColunaPivo = tabelaSimplex[i][colunaPivo];
                const rhs = tabelaSimplex[i][numColunasTabela - 1];

                // Apenas se o elemento da coluna pivô for estritamente positivo e a razão não-negativa.
                if (elementoColunaPivo > 1e-9) { 
                    const razao = rhs / elementoColunaPivo;
                    if (razao >= -1e-9 && razao < menorRazao) { // A razão deve ser >= 0 e menor que a atual
                        menorRazao = razao;
                        linhaPivo = i;
                    }
                }
            }

            if (linhaPivo === -1) {
                // Se não encontrou linha pivô válida (todos negativos ou zero na coluna pivô), é ilimitado.
                saidaSimplexDiv.innerHTML = `<p class="erro">Problema Ilimitado: A função objetivo pode crescer indefinidamente.</p>`;
                return;
            }

            // C. Realizar Operações de Pivoteamento
            const elementoPivo = tabelaSimplex[linhaPivo][colunaPivo];

            // Atualiza a variável básica da linha pivô
            let varDeEntradaNome = '';
            if (colunaPivo < numVariaveis) {
                varDeEntradaNome = `X${colunaPivo + 1}`;
            } else if (colunaPivo < numVariaveis + numSlackVars) {
                varDeEntradaNome = `S${colunaPivo - numVariaveis + 1}`;
            } else if (colunaPivo < numVariaveis + numSlackVars + numSurplusVars) {
                varDeEntradaNome = `E${colunaPivo - (numVariaveis + numSlackVars) + 1}`;
            } else {
                varDeEntradaNome = `A${colunaPivo - (numVariaveis + numSlackVars + numSurplusVars) + 1}`;
            }
            basicVariables[linhaPivo] = varDeEntradaNome;

            // 1. Dividir a linha pivô
            for (let j = 0; j < numColunasTabela; j++) {
                tabelaSimplex[linhaPivo][j] /= elementoPivo;
            }

            // 2. Zerar os outros elementos da coluna pivô
            for (let i = 0; i < tabelaSimplex.length; i++) {
                if (i !== linhaPivo) {
                    const fator = tabelaSimplex[i][colunaPivo];
                    for (let j = 0; j < numColunasTabela; j++) {
                        tabelaSimplex[i][j] -= fator * tabelaSimplex[linhaPivo][j];
                    }
                }
            }
            iteracao++;
        }

        // Se exceder o número máximo de iterações
        if (iteracao >= maxIteracoes) {
            saidaSimplexDiv.innerHTML = `<p class="erro">Limite de ${maxIteracoes} iterações atingido. O problema pode ser degenerado, ilimitado ou infactível, ou requer mais iterações.</p>`;
            return;
        }

        // --- 3. Ler a Solução Final ---
        const resultadosVariaveis = new Array(numVariaveis).fill(0);
        let valorZ = 0;

        valorZ = tabelaSimplex[0][numColunasTabela - 1];
        if (tipoProblema === 'min') {
            valorZ *= -1; // Reverter o sinal para problemas de minimização
        }

        // Verificar se alguma variável artificial ainda está na base com valor > 0
        // Se sim, o problema é infactível.
        let problemaInfactivelFinal = false;
        for (let i = 1; i < tabelaSimplex.length; i++) {
            if (basicVariables[i] && basicVariables[i].startsWith('A') && Math.abs(tabelaSimplex[i][numColunasTabela - 1]) > 1e-9) {
                problemaInfactivelFinal = true;
                break;
            }
        }
        if (problemaInfactivelFinal) {
             saidaSimplexDiv.innerHTML = `<p class="erro">Problema Infactível: Nenhuma solução satisfaz todas as restrições (variável artificial na base).</p>`;
             return;
        }

        // Encontrar os valores das variáveis de decisão (X1, X2, ...)
        for (let j = 0; j < numVariaveis; j++) {
            let basicVarRow = -1;
            let countOnes = 0;

            for (let i = 1; i < tabelaSimplex.length; i++) { // Começa da linha 1 (restrições)
                if (Math.abs(tabelaSimplex[i][j] - 1) < 1e-9) { // Se for 1
                    countOnes++;
                    basicVarRow = i;
                } else if (Math.abs(tabelaSimplex[i][j]) > 1e-9) { // Se não for 0 (tolerância)
                    countOnes = 0; // Não é uma coluna básica limpa
                    break;
                }
            }

            if (countOnes === 1) { // Se achou exatamente um 1 e o resto zero
                resultadosVariaveis[j] = tabelaSimplex[basicVarRow][numColunasTabela - 1]; // Valor do RHS
            }
        }

        // --- Exibir os Resultados Finais ---
        let resultadoHTML = `<h3>Resultado Final do Simplex:</h3>`;
        resultadoHTML += `<p>Tipo de Problema: ${tipoProblema === 'max' ? 'Maximização' : 'Minimização'}</p>`;
        resultadoHTML += `<p>Valor Ótimo de Z: <strong>${valorZ.toFixed(4)}</strong></p>`;
        resultadoHTML += `<h4>Valores das Variáveis de Decisão:</h4><ul>`;
        for (let i = 0; i < numVariaveis; i++) {
            const val = Math.abs(resultadosVariaveis[i]) < 1e-9 ? 0 : resultadosVariaveis[i];
            resultadoHTML += `<li>X${i + 1} = ${val.toFixed(4)}</li>`;
        }
        resultadoHTML += `</ul>`;

        saidaSimplexDiv.innerHTML = resultadoHTML;
    }

    // Listener para o botão "Gerar Campos de Entrada"
    gerarCamposSimplexBtn.addEventListener('click', gerarCamposDeEntradaSimplex);

    // Gera os campos iniciais ao carregar a página
    gerarCamposDeEntradaSimplex();
});