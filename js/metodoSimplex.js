// Arquivo: js/metodoSimplex.js
// Implementa o Simplex (Maximização e Minimização) usando a biblioteca javascript-lp-solver

document.addEventListener('DOMContentLoaded', () => {
    // --- Referências aos elementos do DOM utilizados ---
    const tipoProblemaSimplexSelect = document.getElementById('tipoProblemaSimplex');
    const numVariaveisSimplexInput = document.getElementById('numVariaveisSimplex');
    const numRestricoesSimplexInput = document.getElementById('numRestricoesSimplex');
    const gerarCamposSimplexBtn = document.getElementById('gerarCamposSimplex');
    const camposSimplexDiv = document.getElementById('camposSimplex');
    const saidaSimplexDiv = document.getElementById('saidaSimplex'); // Onde o resultado será exibido

    /**
     * Função: gerarCamposDeEntradaSimplex
     * Gera dinamicamente os campos de input com base no número de variáveis e restrições informados.
     */
    function gerarCamposDeEntradaSimplex() {
        // Converte inputs em inteiros
        const numVariaveis = parseInt(numVariaveisSimplexInput.value);
        const numRestricoes = parseInt(numRestricoesSimplexInput.value);
        const tipoProblema = tipoProblemaSimplexSelect.value; // 'max' ou 'min'

        // Validação: impede números inválidos
        if (isNaN(numVariaveis) || numVariaveis < 1 || isNaN(numRestricoes) || numRestricoes < 1) {
            saidaSimplexDiv.innerHTML = `<p class="erro">Por favor, insira um número válido para variáveis (mín. 1) e restrições (mín. 1).</p>`;
            return;
        }

        let htmlCampos = '';

        // Geração da seção de Função Objetivo
        htmlCampos += `
            <div class="secao-entrada-simplex">
                <h4>Função Objetivo (${tipoProblema === 'max' ? 'Maximizar' : 'Minimizar'} Z)</h4>
                <div class="linha-coeficientes">
                    <label>Z = </label>
        `;

        // Gera inputs para cada variável de decisão na função objetivo
        for (let i = 0; i < numVariaveis; i++) {
            htmlCampos += `
                <input type="number" class="coef-variavel-objetivo" data-var-index="${i}" value="1">
                <label>X${i + 1}</label>
                ${i < numVariaveis - 1 ? '<label>+</label>' : ''}
            `;
        }
        htmlCampos += `</div></div>`;

        // Geração da seção de Restrições
        htmlCampos += `<div class="secao-entrada-simplex"><h4>Restrições</h4>`;
        for (let i = 0; i < numRestricoes; i++) {
            htmlCampos += `<div class="linha-coeficientes">`;

            // Gera os coeficientes de cada variável dentro da restrição
            for (let j = 0; j < numVariaveis; j++) {
                htmlCampos += `
                    <input type="number" class="coef-variavel-restricao" data-rest-index="${i}" data-var-index="${j}" value="1">
                    <label>X${j + 1}</label>
                    ${j < numVariaveis - 1 ? '<label>+</label>' : ''}
                `;
            }

            // Gera o seletor de operador da restrição e o lado direito
            htmlCampos += `
                <select class="operador-restricao" data-rest-index="${i}">
                    <option value="le"><=</option>
                    <option value="ge">>=</option>
                    <option value="eq">=</option>
                </select>
                <input type="number" class="lado-direito-restricao" data-rest-index="${i}" value="10">
            </div>`;
        }
        htmlCampos += `</div>`;

        // Botão de executar o Simplex
        htmlCampos += `
            <div class="rodape-simplex">
                <button id="executarSimplex">Executar Simplex</button>
            </div>
        `;

        // Insere o HTML gerado na tela
        camposSimplexDiv.innerHTML = htmlCampos;

        // Adiciona o evento no botão gerado dinamicamente
        document.getElementById('executarSimplex').addEventListener('click', executarSimplex);
    }

    /**
     * Função: executarSimplex
     * Coleta os dados preenchidos, monta o modelo e executa o solver.
     */
    function executarSimplex() {
        saidaSimplexDiv.innerHTML = ''; // Limpa resultados anteriores

        const tipoProblema = tipoProblemaSimplexSelect.value;
        const numVariaveis = parseInt(numVariaveisSimplexInput.value);
        const numRestricoes = parseInt(numRestricoesSimplexInput.value);

        // Coleta os coeficientes da função objetivo
        const coeficientesObjetivo = [];
        camposSimplexDiv.querySelectorAll('.coef-variavel-objetivo').forEach(input => {
            coeficientesObjetivo.push(parseFloat(input.value));
        });

        // Coleta as restrições
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

        // Monta o objeto de modelo esperado pela biblioteca js-lp-solver
        const model = {
            optimize: 'Z',
            opType: tipoProblema,
            constraints: {},
            variables: {}
        };

        // Inicializa as variáveis de decisão com seus coeficientes na FO
        for (let i = 0; i < numVariaveis; i++) {
            const varName = `x${i + 1}`;
            model.variables[varName] = { 'Z': coeficientesObjetivo[i] };
        }

        // Adiciona as restrições no modelo
        restricoesInput.forEach((restricao, idx) => {
            const constraintName = `c${idx + 1}`;
            model.constraints[constraintName] = {};

            // Mapeia o tipo de operador
            if (restricao.tipo === 'le') model.constraints[constraintName].max = restricao.ladoDireito;
            else if (restricao.tipo === 'ge') model.constraints[constraintName].min = restricao.ladoDireito;
            else if (restricao.tipo === 'eq') model.constraints[constraintName].equal = restricao.ladoDireito;

            // Associa os coeficientes dessa restrição às variáveis
            restricao.coefs.forEach((coef, varIdx) => {
                const varName = `x${varIdx + 1}`;
                model.variables[varName][constraintName] = coef;
            });
        });

        let resultadoLib;
        try {
            // Resolve o problema usando o solver
            resultadoLib = solver.Solve(model);
        } catch (e) {
            console.error("Erro ao resolver com jsLPSolver:", e);
            saidaSimplexDiv.innerHTML = `<p class="erro">Erro ao resolver o problema: ${e.message || 'Verifique os dados de entrada.'}</p>`;
            return;
        }

        // Exibe o resultado formatado
        let resultadoHTML = `<h3>Resultado Final do Simplex (${tipoProblema === 'max' ? 'Maximização' : 'Minimização'} - Usando jsLPSolver):</h3>`;

        if (resultadoLib.feasible) {
            resultadoHTML += `<p>Tipo de Problema: ${tipoProblema === 'max' ? 'Maximização' : 'Minimização'}</p>`;
            resultadoHTML += `<p>Valor Ótimo de Z: <strong>${resultadoLib.result.toFixed(4)}</strong></p>`;
            resultadoHTML += `<h4>Valores das Variáveis de Decisão:</h4><ul>`;
            for (let i = 0; i < numVariaveis; i++) {
                const varName = `x${i + 1}`;
                resultadoHTML += `<li>X${i + 1} = ${(resultadoLib[varName] || 0).toFixed(4)}</li>`;
            }
            resultadoHTML += `</ul>`;
        } else if (resultadoLib.bounded === false) {
            resultadoHTML += `<p class="erro">Problema ilimitado: solução tende ao infinito.</p>`;
        } else if (resultadoLib.result === null || resultadoLib.is_unbounded || resultadoLib.is_infeasible) {
            resultadoHTML += `<p class="erro">Problema Infactível: não há solução viável.</p>`;
        } else {
            resultadoHTML += `<p class="erro">Status desconhecido.</p>`;
            console.log("Resultado completo:", resultadoLib);
        }

        saidaSimplexDiv.innerHTML = resultadoHTML;
    }

    // --- EVENTOS ---

    // Evento para gerar os campos ao clicar no botão
    if (gerarCamposSimplexBtn) {
        gerarCamposSimplexBtn.addEventListener('click', gerarCamposDeEntradaSimplex);
    } else {
        console.error("Erro: botão #gerarCamposSimplex não encontrado.");
    }

    // Atualiza o rótulo ao alterar o tipo de problema
    tipoProblemaSimplexSelect.addEventListener('change', gerarCamposDeEntradaSimplex);

    // Geração automática ao carregar a página
    gerarCamposDeEntradaSimplex();
});
