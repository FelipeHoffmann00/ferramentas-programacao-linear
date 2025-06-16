// js/metodoSimplex.js - Simplex para Maximização e Minimização (Usando javascript-lp-solver)

document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos do DOM para a seção Simplex
    const tipoProblemaSimplexSelect = document.getElementById('tipoProblemaSimplex');
    const numVariaveisSimplexInput = document.getElementById('numVariaveisSimplex');
    const numRestricoesSimplexInput = document.getElementById('numRestricoesSimplex');
    const gerarCamposSimplexBtn = document.getElementById('gerarCamposSimplex');
    const camposSimplexDiv = document.getElementById('camposSimplex');
    const saidaSimplexDiv = document.getElementById('saidaSimplex'); // A div onde o resultado será exibida

    /**
     * Gera os campos de entrada dinamicamente com base no número de variáveis e restrições.
     * Atualiza os rótulos de maximização/minimização na função objetivo.
     */
    function gerarCamposDeEntradaSimplex() {
        const numVariaveis = parseInt(numVariaveisSimplexInput.value);
        const numRestricoes = parseInt(numRestricoesSimplexInput.value);
        const tipoProblema = tipoProblemaSimplexSelect.value; // 'max' ou 'min'

        // Validação básica dos inputs
        if (isNaN(numVariaveis) || numVariaveis < 1 || isNaN(numRestricoes) || numRestricoes < 1) {
            // Usamos um modal ou mensagem na UI em vez de alert(), conforme instruções.
            saidaSimplexDiv.innerHTML = `<p class="erro">Por favor, insira um número válido para variáveis (mín. 1) e restrições (mín. 1).</p>`;
            return;
        }

        let htmlCampos = '';

        // Seção da Função Objetivo
        htmlCampos += `
            <div class="secao-entrada-simplex">
                <h4>Função Objetivo (${tipoProblema === 'max' ? 'Maximizar' : 'Minimizar'} Z)</h4>
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

        // Seção das Restrições
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

        // Botão de Execução
        htmlCampos += `
            <div class="rodape-simplex">
                <button id="executarSimplex">Executar Simplex</button>
            </div>
        `;

        camposSimplexDiv.innerHTML = htmlCampos;
        // Adiciona o listener para o botão de execução depois que ele é criado
        document.getElementById('executarSimplex').addEventListener('click', executarSimplex);
    }

    /**
     * Coleta os dados do formulário e chama o solver da biblioteca.
     * Esta função unifica a lógica para maximização e minimização.
     */
    function executarSimplex() {
        saidaSimplexDiv.innerHTML = ''; // Limpa saídas anteriores

        const tipoProblema = tipoProblemaSimplexSelect.value;
        const numVariaveis = parseInt(numVariaveisSimplexInput.value);
        const numRestricoes = parseInt(numRestricoesSimplexInput.value);

        const coeficientesObjetivo = [];
        camposSimplexDiv.querySelectorAll('.coef-variavel-objetivo').forEach(input => {
            coeficientesObjetivo.push(parseFloat(input.value));
        });

        const restricoesInput = [];
        for (let i = 0; i < numRestricoes; i++) {
            const linhaCoeficientes = [];
            camposSimplexDiv.querySelectorAll(`.coef-variavel-restricao[data-rest-index="${i}"]`).forEach(input => {
                linhaCoeficientes.push(parseFloat(input.value));
            });
            const tipo = camposSimplexDiv.querySelector(`.operador-restricao[data-rest-index="${i}"]`).value;
            const ladoDireito = parseFloat(camposSimplexDiv.querySelector(`.lado-direito-restricao[data-rest-index="${i}"]`).value);
            restricoesInput.push({ coefs: linhaCoeficientes, tipo: tipo, ladoDireito: ladoDireito });
        }

        // Constrói o modelo para a biblioteca javascript-lp-solver
        const model = {
            optimize: 'Z', // Nome da variável que representa a Função Objetivo
            opType: tipoProblema, // 'max' ou 'min'
            constraints: {},
            variables: {}
        };

        // Adiciona as variáveis de decisão e seus coeficientes na Função Objetivo
        for (let i = 0; i < numVariaveis; i++) {
            const varName = `x${i + 1}`;
            model.variables[varName] = { 'Z': coeficientesObjetivo[i] }; // Coeficiente na FO
        }

        // Adiciona as restrições e os coeficientes das variáveis nas restrições
        restricoesInput.forEach((restricao, idx) => {
            const constraintName = `c${idx + 1}`; // Nome da restrição (e.g., c1, c2)
            model.constraints[constraintName] = {};

            // Mapeia o operador da restrição
            if (restricao.tipo === 'le') {
                model.constraints[constraintName].max = restricao.ladoDireito; // <=
            } else if (restricao.tipo === 'ge') {
                model.constraints[constraintName].min = restricao.ladoDireito; // >=
            } else if (restricao.tipo === 'eq') {
                model.constraints[constraintName].equal = restricao.ladoDireito; // =
            }

            // Adiciona os coeficientes das variáveis para esta restrição
            restricao.coefs.forEach((coef, varIdx) => {
                const varName = `x${varIdx + 1}`;
                // Adiciona o coeficiente da variável na restrição ao objeto da variável
                model.variables[varName][constraintName] = coef;
            });
        });

        // Opcional: Para depuração, descomente a linha abaixo para ver o modelo gerado
        // console.log("Modelo para jsLPSolver:", model);

        let resultadoLib;
        try {
            // Chama o resolvedor da biblioteca
            resultadoLib = solver.Solve(model);
        } catch (e) {
            console.error("Erro ao resolver com jsLPSolver:", e);
            saidaSimplexDiv.innerHTML = `<p class="erro">Erro ao resolver o problema: ${e.message || 'Verifique os dados de entrada.'}</p>`;
            return;
        }

        // --- Exibir Resultados da Biblioteca ---
        let resultadoHTML = `<h3>Resultado Final do Simplex (${tipoProblema === 'max' ? 'Maximização' : 'Minimização'} - Usando jsLPSolver):</h3>`;

        // Verifica o status do resultado
        if (resultadoLib.feasible) { // Se encontrou uma solução viável
            resultadoHTML += `<p>Tipo de Problema: ${tipoProblema === 'max' ? 'Maximização' : 'Minimização'}</p>`;
            resultadoHTML += `<p>Valor Ótimo de Z: <strong>${resultadoLib.result.toFixed(4)}</strong></p>`;
            resultadoHTML += `<h4>Valores das Variáveis de Decisão:</h4><ul>`;
            for (let i = 0; i < numVariaveis; i++) {
                const varName = `x${i + 1}`;
                // Garante que o valor existe, caso a variável não esteja na solução ótima
                resultadoHTML += `<li>X${i + 1} = ${(resultadoLib[varName] || 0).toFixed(4)}</li>`;
            }
            resultadoHTML += `</ul>`;
        } else if (resultadoLib.bounded === false) { // Problema ilimitado (unbounded)
            resultadoHTML += `<p class="erro">Problema ${tipoProblema === 'max' ? 'Ilimitado: A função objetivo pode crescer indefinidamente.' : 'Ilimitado: A função objetivo pode decrescer indefinidamente.'}</p>`;
        } else if (resultadoLib.result === null || resultadoLib.is_unbounded || resultadoLib.is_infeasible) { // Problema infactível ou ilimitado detectado pela lib
             resultadoHTML += `<p class="erro">Problema Infactível: Nenhuma solução satisfaz todas as restrições.</p>`;
        } else {
             resultadoHTML += `<p class="erro">Status do Solver Desconhecido ou Erro.</p>`;
             console.log("Resultado detalhado da biblioteca:", resultadoLib); // Para depuração
        }

        saidaSimplexDiv.innerHTML = resultadoHTML;
    }

    // --- Listeners de Eventos ---
    // Listener para o botão "Gerar Campos de Entrada"
    if (gerarCamposSimplexBtn) {
        gerarCamposSimplexBtn.addEventListener('click', gerarCamposDeEntradaSimplex);
    } else {
        console.error("Erro DOM: Botão #gerarCamposSimplex não encontrado. Verifique o HTML.");
    }

    // Listener para a mudança no tipo de problema (Maximização/Minimização)
    // Isso garante que o rótulo da Função Objetivo seja atualizado e os campos sejam regenerados.
    tipoProblemaSimplexSelect.addEventListener('change', gerarCamposDeEntradaSimplex);

    // Gera os campos iniciais ao carregar a página para que eles apareçam automaticamente.
    gerarCamposDeEntradaSimplex();
});
