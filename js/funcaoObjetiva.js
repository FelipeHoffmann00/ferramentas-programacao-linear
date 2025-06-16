document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvasFuncaoObjetiva');
    const ctx = canvas.getContext('2d');
    const containerRestricoes = document.getElementById('containerRestricoes');
    const adicionarRestricaoBtn = document.getElementById('adicionarRestricao');
    const gerarGraficoBtn = document.getElementById('gerarGrafico');
    const resultadoGraficoDiv = document.getElementById('resultadoGrafico');
    // NOVO: Referência ao seletor de tipo de problema
    const tipoProblemaObjetivaSelect = document.getElementById('tipoProblemaObjetiva');

    // Configurações iniciais do canvas
    canvas.width = 600;
    canvas.height = 400;

    // --- Configurações do Gráfico ---
    const MARGEM = 50; // Margem para os eixos e rótulos
    let escalaX = 0; // Escala X em pixels por unidade
    let escalaY = 0; // Escala Y em pixels por unidade
    let maxX = 0;    // Valor máximo de X a ser exibido no gráfico
    let maxY = 0;    // Valor máximo de Y a ser exibido no gráfico

    // Variáveis para o hover
    let pontosExtremosAtuais = []; // Armazenará os pontos extremos calculados
    let pontoHover = null; // Armazena o ponto sob o mouse
    const RAIO_HOVER = 8; // Raio de detecção de hover em pixels

    // --- Funções Auxiliares de Mapeamento de Coordenadas ---

    // Converte uma coordenada X do problema para uma coordenada de pixel no canvas
    function paraCoordenadaCanvasX(x) {
        return MARGEM + x * escalaX;
    }

    // Converte uma coordenada Y do problema para uma coordenada de pixel no canvas
    // O eixo Y do canvas é invertido (0 no topo, height na base), então precisamos ajustar
    function paraCoordenadaCanvasY(y) {
        return canvas.height - MARGEM - y * escalaY;
    }

    // Converte uma coordenada de pixel do canvas para uma coordenada X do problema
    function paraCoordenadaProblemaX(px) {
        return (px - MARGEM) / escalaX;
    }

    // Converte uma coordenada de pixel do canvas para uma coordenada Y do problema
    function paraCoordenadaProblemaY(py) {
        return (canvas.height - MARGEM - py) / escalaY;
    }

    // --- Funções para gerenciar as restrições na interface ---

    function adicionarNovaRestricao() {
        const restricaoItem = document.createElement('div');
        restricaoItem.classList.add('restricao-item');
        restricaoItem.innerHTML = `
            <label>Restrição ${containerRestricoes.children.length + 1}:</label>
            <input type="number" class="coef-x" value="1">x +
            <input type="number" class="coef-y" value="1">y
            <select class="tipo-restricao">
                <option value="le"><=</option>
                <option value="ge">>=</option>
                <option value="eq">=</option>
            </select>
            <input type="number" class="lado-direito" value="10">
            <button type="button" class="remover-restricao">Remover</button>
        `;
        containerRestricoes.appendChild(restricaoItem);

        restricaoItem.querySelector('.remover-restricao').addEventListener('click', function() {
            restricaoItem.remove();
            atualizarNumeracaoRestricoes();
        });

        atualizarNumeracaoRestricoes();
    }

    function atualizarNumeracaoRestricoes() {
        const itensRestricao = containerRestricoes.querySelectorAll('.restricao-item');
        itensRestricao.forEach((item, index) => {
            item.querySelector('label').textContent = `Restrição ${index + 1}:`;
        });
    }

    adicionarRestricaoBtn.addEventListener('click', adicionarNovaRestricao);

    containerRestricoes.querySelectorAll('.remover-restricao').forEach(button => {
        button.addEventListener('click', function() {
            button.closest('.restricao-item').remove();
            atualizarNumeracaoRestricoes();
        });
    });

    // --- Funções para o Gráfico ---

    // Função para desenhar os eixos X e Y
    function desenharEixos() {
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2; // Linha mais grossa para os eixos

        // Eixo X
        ctx.moveTo(MARGEM, canvas.height - MARGEM);
        ctx.lineTo(canvas.width - MARGEM / 2, canvas.height - MARGEM);
        // Seta do Eixo X
        ctx.lineTo(canvas.width - MARGEM / 2 - 10, canvas.height - MARGEM - 5);
        ctx.moveTo(canvas.width - MARGEM / 2, canvas.height - MARGEM);
        ctx.lineTo(canvas.width - MARGEM / 2 - 10, canvas.height - MARGEM + 5);

        // Eixo Y
        ctx.moveTo(MARGEM, canvas.height - MARGEM);
        ctx.lineTo(MARGEM, MARGEM / 2);
        // Seta do Eixo Y
        ctx.lineTo(MARGEM - 5, MARGEM / 2 + 10);
        ctx.moveTo(MARGEM, MARGEM / 2);
        ctx.lineTo(MARGEM + 5, MARGEM / 2 + 10);

        ctx.stroke();

        ctx.font = '14px Arial';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText("X", canvas.width - MARGEM / 2, canvas.height - MARGEM + 5);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText("Y", MARGEM - 5, MARGEM / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText("0", MARGEM - 10, canvas.height - MARGEM + 5);

        // Desenhar marcadores e rótulos nos eixos
        ctx.font = '10px Arial';
        ctx.fillStyle = '#555';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (let x = 1; x <= maxX; x++) {
            const px = paraCoordenadaCanvasX(x);
            ctx.beginPath();
            ctx.moveTo(px, canvas.height - MARGEM - 3);
            ctx.lineTo(px, canvas.height - MARGEM + 3);
            ctx.stroke();
            ctx.fillText(x.toString(), px, canvas.height - MARGEM + 5);
        }

        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let y = 1; y <= maxY; y++) {
            const py = paraCoordenadaCanvasY(y);
            ctx.beginPath();
            ctx.moveTo(MARGEM - 3, py);
            ctx.lineTo(MARGEM + 3, py);
            ctx.stroke();
            ctx.fillText(y.toString(), MARGEM - 5, py);
        }
    }

    // Função para calcular a escala e os limites dos eixos
    function calcularEscalaELimites(restricoes) {
        let tempMaxX = 0;
        let tempMaxY = 0;

        restricoes.forEach(r => {
            // Apenas consideramos restrições com lado direito positivo para cálculo de limites iniciais
            // e coeficientes não nulos para evitar divisão por zero e linhas paralelas aos eixos em 0.
            if (r.ladoDireito > 0) {
                if (r.coefX !== 0) {
                    tempMaxX = Math.max(tempMaxX, r.ladoDireito / r.coefX);
                }
                if (r.coefY !== 0) {
                    tempMaxY = Math.max(tempMaxY, r.ladoDireito / r.coefY);
                }
            }
        });

        // Garantir um mínimo para o gráfico
        maxX = Math.ceil(tempMaxX * 1.2) + 1;
        maxY = Math.ceil(tempMaxY * 1.2) + 1;

        if (maxX < 10) maxX = 10;
        if (maxY < 10) maxY = 10;

        escalaX = (canvas.width - 2 * MARGEM) / maxX;
        escalaY = (canvas.height - 2 * MARGEM) / maxY;
    }

    // Função para desenhar uma única linha de restrição
    function desenharLinhaRestricao(restricao, cor = 'blue') {
        const { coefX, coefY, ladoDireito } = restricao;

        ctx.beginPath();
        ctx.strokeStyle = cor;
        ctx.lineWidth = 1;

        if (coefX === 0 && coefY === 0) {
            return; // Ignora restrições degeneradas
        }

        if (coefY === 0) { // Linha vertical (x = constante)
            const xVal = ladoDireito / coefX;
            if (xVal >= 0) { // Desenha apenas no primeiro quadrante
                ctx.moveTo(paraCoordenadaCanvasX(xVal), paraCoordenadaCanvasY(0));
                ctx.lineTo(paraCoordenadaCanvasX(xVal), paraCoordenadaCanvasY(maxY));
            }
        }
        else if (coefX === 0) { // Linha horizontal (y = constante)
            const yVal = ladoDireito / coefY;
            if (yVal >= 0) { // Desenha apenas no primeiro quadrante
                ctx.moveTo(paraCoordenadaCanvasX(0), paraCoordenadaCanvasY(yVal));
                ctx.lineTo(paraCoordenadaCanvasX(maxX), paraCoordenadaCanvasY(yVal));
            }
        }
        else { // Linha inclinada (ax + by = c)
            const pontosNaLinha = [];

            // Ponto de intersecção com o eixo Y (x=0)
            const y_at_x0 = ladoDireito / coefY;
            if (y_at_x0 >= 0 && y_at_x0 <= maxY) {
                pontosNaLinha.push({ x: 0, y: y_at_x0 });
            }

            // Ponto de intersecção com o eixo X (y=0)
            const x_at_y0 = ladoDireito / coefX;
            if (x_at_y0 >= 0 && x_at_y0 <= maxX) {
                pontosNaLinha.push({ x: x_at_y0, y: 0 });
            }

            // Ponto de intersecção com a borda x = maxX
            const y_at_maxX = (ladoDireito - coefX * maxX) / coefY;
            if (y_at_maxX >= 0 && y_at_maxX <= maxY) {
                pontosNaLinha.push({ x: maxX, y: y_at_maxX });
            }

            // Ponto de intersecção com a borda y = maxY
            const x_at_maxY = (ladoDireito - coefY * maxY) / coefX;
            if (x_at_maxY >= 0 && x_at_maxY <= maxX) {
                pontosNaLinha.push({ x: x_at_maxY, y: maxY });
            }

            // Filtrar pontos que estão fora dos limites e ordenar para desenhar a linha corretamente
            const pontosValidos = pontosNaLinha.filter(p => p.x >= -1e-9 && p.y >= -1e-9);

            if (pontosValidos.length > 1) {
                // Ordena os pontos para garantir que a linha seja desenhada corretamente
                pontosValidos.sort((p1, p2) => {
                    if (p1.x !== p2.x) return p1.x - p2.x;
                    return p1.y - p2.y;
                });
                
                ctx.moveTo(paraCoordenadaCanvasX(pontosValidos[0].x), paraCoordenadaCanvasY(pontosValidos[0].y));
                ctx.lineTo(paraCoordenadaCanvasX(pontosValidos[pontosValidos.length - 1].x), paraCoordenadaCanvasY(pontosValidos[pontosValidos.length - 1].y));
            }
        }
        ctx.stroke();
    }

    // Verifica se um ponto (x,y) satisfaz uma dada restrição
    function pontoSatisfazRestricao(ponto, restricao) {
        const { x, y } = ponto;
        const { coefX, coefY, tipo, ladoDireito } = restricao;
        const valorCalculado = coefX * x + coefY * y;

        // Usamos uma pequena tolerância para comparações de ponto flutuante
        const epsilon = 1e-9;

        switch (tipo) {
            case 'le': // <=
                return valorCalculado <= ladoDireito + epsilon;
            case 'ge': // >=
                return valorCalculado >= ladoDireito - epsilon;
            case 'eq': // =
                return Math.abs(valorCalculado - ladoDireito) < epsilon;
            default:
                return false;
        }
    }

    // Encontra a intersecção de duas linhas (restrições)
    function encontrarInterseccao(restricao1, restricao2) {
        const { coefX: a1, coefY: b1, ladoDireito: c1 } = restricao1;
        const { coefX: a2, coefY: b2, ladoDireito: c2 } = restricao2;

        const determinante = a1 * b2 - a2 * b1;

        if (Math.abs(determinante) < 1e-9) { // Linhas paralelas ou coincidentes
            return null;
        }

        const x = (c1 * b2 - c2 * b1) / determinante;
        const y = (a1 * c2 - a2 * c1) / determinante;

        return { x: x, y: y };
    }

    // Função principal para calcular pontos extremos e sombrear a região viável
    function calcularERegiaoViável(restricoes) {
        const pontosExtremos = new Set();

        // Adicionar o ponto (0,0) como um possível ponto extremo se for viável
        const origem = { x: 0, y: 0 };
        if (restricoes.every(r => pontoSatisfazRestricao(origem, r))) {
            pontosExtremos.add(JSON.stringify(origem));
        }

        // Adicionar intersecções com os eixos X e Y
        restricoes.forEach(r => {
            // Intersecção com eixo X (y=0)
            if (r.coefX !== 0) {
                const x = r.ladoDireito / r.coefX;
                const ponto = { x: x, y: 0 };
                // Verifica se o ponto está no primeiro quadrante e satisfaz todas as restrições
                if (x >= -1e-9 && restricoes.every(res => pontoSatisfazRestricao(ponto, res))) {
                    pontosExtremos.add(JSON.stringify(ponto));
                }
            }
            // Intersecção com eixo Y (x=0)
            if (r.coefY !== 0) {
                const y = r.ladoDireito / r.coefY;
                const ponto = { x: 0, y: y };
                // Verifica se o ponto está no primeiro quadrante e satisfaz todas as restrições
                if (y >= -1e-9 && restricoes.every(res => pontoSatisfazRestricao(ponto, res))) {
                    pontosExtremos.add(JSON.stringify(ponto));
                }
            }
        });

        // Adicionar intersecções entre pares de restrições
        for (let i = 0; i < restricoes.length; i++) {
            for (let j = i + 1; j < restricoes.length; j++) {
                const pontoInterseccao = encontrarInterseccao(restricoes[i], restricoes[j]);

                if (pontoInterseccao) {
                    // Verifica se o ponto de intersecção está no primeiro quadrante
                    // e se satisfaz TODAS as restrições
                    if (pontoInterseccao.x >= -1e-9 && pontoInterseccao.y >= -1e-9 &&
                        restricoes.every(r => pontoSatisfazRestricao(pontoInterseccao, r))) {
                        pontosExtremos.add(JSON.stringify(pontoInterseccao));
                    }
                }
            }
        }

        const pontosFinais = Array.from(pontosExtremos).map(pStr => JSON.parse(pStr));

        // Filtrar pontos que são numericamente muito próximos (duplicatas)
        const pontosUnicos = [];
        pontosFinais.forEach(p1 => {
            let isUnique = true;
            for (let i = 0; i < pontosUnicos.length; i++) {
                const p2 = pontosUnicos[i];
                if (Math.abs(p1.x - p2.x) < 1e-6 && Math.abs(p1.y - p2.y) < 1e-6) {
                    isUnique = false;
                    break;
                }
            }
            if (isUnique) {
                pontosUnicos.push(p1);
            }
        });

        // Ordenar os pontos para formar um polígono convexo (necessário para sombreamento)
        // Isso é feito calculando o centróide e ordenando os pontos pelo ângulo polar em relação a ele.
        if (pontosUnicos.length > 0) {
            const centroide = pontosUnicos.reduce((acc, p) => ({x: acc.x + p.x, y: acc.y + p.y}), {x: 0, y: 0});
            centroide.x /= pontosUnicos.length;
            centroide.y /= pontosUnicos.length;

            pontosUnicos.sort((a, b) => {
                const angleA = Math.atan2(a.y - centroide.y, a.x - centroide.x);
                const angleB = Math.atan2(b.y - centroide.y, b.x - centroide.x);
                if (angleA !== angleB) return angleA - angleB;
                // Para desempate, o ponto mais próximo do centróide vem primeiro
                return (a.x - centroide.x)**2 + (a.y - centroide.y)**2 - ((b.x - centroide.x)**2 + (b.y - centroide.y)**2);
            });
        }

        // Armazena os pontos extremos para uso no evento de hover
        pontosExtremosAtuais = pontosUnicos;

        return pontosUnicos;
    }

    // Função para sombrear a região viável
    function sombrearRegiaoViável(pontosViáveis) {
        if (pontosViáveis.length < 3) { // Uma região viável deve ter pelo menos 3 pontos (um polígono)
            // console.warn("Não há pontos suficientes para formar uma região viável para sombreamento.");
            return;
        }

        ctx.beginPath();
        ctx.fillStyle = 'rgba(0, 123, 255, 0.2)'; // Cor azul clara com transparência

        ctx.moveTo(paraCoordenadaCanvasX(pontosViáveis[0].x), paraCoordenadaCanvasY(pontosViáveis[0].y));

        for (let i = 1; i < pontosViáveis.length; i++) {
            ctx.lineTo(paraCoordenadaCanvasX(pontosViáveis[i].x), paraCoordenadaCanvasY(pontosViáveis[i].y));
        }

        ctx.closePath(); // Fecha o caminho para formar o polígono
        ctx.fill(); // Preenche o polígono
    }

    // Desenha os pontos extremos
    function desenharPontosExtremos(pontos) {
        ctx.fillStyle = 'black';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        pontos.forEach(p => {
            const px = paraCoordenadaCanvasX(p.x);
            const py = paraCoordenadaCanvasY(p.y);
            ctx.beginPath();
            // Desenha um círculo no ponto, um pouco maior para facilitar o hover
            ctx.arc(px, py, RAIO_HOVER / 2, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    // Desenha o tooltip de hover
    function desenharTooltip(ponto, coefXObj, coefYObj) {
        if (!ponto) return;

        const px = paraCoordenadaCanvasX(ponto.x);
        const py = paraCoordenadaCanvasY(ponto.y);
        const zValue = (coefXObj * ponto.x + coefYObj * ponto.y).toFixed(2);
        const text = `(X: ${ponto.x.toFixed(2)}, Y: ${ponto.y.toFixed(2)}) Z: ${zValue}`;

        ctx.font = '12px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';

        // Desenha um fundo para o tooltip
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = 16; // Aproximado

        // Posição do tooltip (ajustar para não sair da tela)
        let tooltipX = px + RAIO_HOVER;
        let tooltipY = py - RAIO_HOVER;

        if (tooltipX + textWidth + 10 > canvas.width) {
            tooltipX = px - RAIO_HOVER - textWidth;
            ctx.textAlign = 'right';
        }
        if (tooltipY - textHeight - 10 < 0) {
            tooltipY = py + RAIO_HOVER + textHeight;
            ctx.textBaseline = 'top';
        }


        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.fillRect(tooltipX - 5, tooltipY - textHeight - 5, textWidth + 10, textHeight + 10);
        ctx.strokeRect(tooltipX - 5, tooltipY - textHeight - 5, textWidth + 10, textHeight + 10);

        ctx.fillStyle = '#333';
        ctx.fillText(text, tooltipX, tooltipY);
    }

    // MODIFICADO: Avalia a função objetivo e encontra o ponto ótimo (Max ou Min)
    function encontrarSolucaoOtima(pontosExtremos, coefXObj, coefYObj, tipoProblema) {
        let melhorZ = (tipoProblema === 'max') ? -Infinity : Infinity; // Inicializa com valor apropriado
        let pontoOtimo = null;

        if (pontosExtremos.length === 0) {
            return { ponto: null, valorZ: null, mensagem: "Não foi encontrada uma região viável." };
        }

        pontosExtremos.forEach(p => {
            const z = coefXObj * p.x + coefYObj * p.y;
            if (tipoProblema === 'max') {
                if (z > melhorZ) {
                    melhorZ = z;
                    pontoOtimo = p;
                }
            } else { // Minimização
                if (z < melhorZ) {
                    melhorZ = z;
                    pontoOtimo = p;
                }
            }
        });

        if (pontoOtimo) {
            const tipoMsg = (tipoProblema === 'max') ? "Máximo" : "Mínimo";
            return {
                ponto: pontoOtimo,
                valorZ: melhorZ,
                mensagem: `Solução Ótima: Z = ${melhorZ.toFixed(2)} em X = ${pontoOtimo.x.toFixed(2)}, Y = ${pontoOtimo.y.toFixed(2)} (${tipoMsg})`
            };
        } else {
            return { ponto: null, valorZ: null, mensagem: "Não foi possível encontrar uma solução ótima." };
        }
    }


    // MODIFICADO: Função principal para desenhar o gráfico (redesenha tudo)
    function desenharGraficoPL() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpa o canvas

        const coefXObj = parseFloat(document.getElementById('coefXObjetivo').value);
        const coefYObj = parseFloat(document.getElementById('coefYObjetivo').value);
        // NOVO: Obter o tipo de problema
        const tipoProblema = tipoProblemaObjetivaSelect.value;


        const restricoes = [];
        // Restrições de não-negatividade (x >= 0, y >= 0)
        restricoes.push({ coefX: 1, coefY: 0, tipo: 'ge', ladoDireito: 0 }); // x >= 0
        restricoes.push({ coefX: 0, coefY: 1, tipo: 'ge', ladoDireito: 0 }); // y >= 0

        containerRestricoes.querySelectorAll('.restricao-item').forEach(item => {
            const coefX = parseFloat(item.querySelector('.coef-x').value);
            const coefY = parseFloat(item.querySelector('.coef-y').value);
            const tipo = item.querySelector('.tipo-restricao').value;
            const ladoDireito = parseFloat(item.querySelector('.lado-direito').value);
            
            // Validação básica para evitar entradas inválidas
            if (isNaN(coefX) || isNaN(coefY) || isNaN(ladoDireito) || (coefX === 0 && coefY === 0 && ladoDireito !== 0)) {
                // Se a restrição é 0x + 0y = D (com D != 0), ela é inválida (0 = D).
                // Se for 0x + 0y = 0, é redundante. Podemos ignorar ambos ou tratar a inválida.
                // Por simplicidade, vamos ignorar, mas um alerta ao usuário seria bom em uma app real.
                console.warn("Restrição inválida ou degenerada ignorada:", { coefX, coefY, tipo, ladoDireito });
                return; 
            }
            restricoes.push({ coefX, coefY, tipo, ladoDireito });
        });

        calcularEscalaELimites(restricoes);

        const pontosViáveis = calcularERegiaoViável(restricoes);
        
        // Se não houver pontos viáveis, não sombreie e avise o usuário
        if (pontosViáveis.length === 0) {
            resultadoGraficoDiv.innerHTML = "<p>Não foi encontrada uma região viável. Verifique suas restrições.</p>";
            desenharEixos(); // Ainda desenha os eixos
            return; // Sai da função
        }

        sombrearRegiaoViável(pontosViáveis);
        desenharEixos();

        const cores = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1', '#17a2b8'];
        let corIndex = 0;
        restricoes.forEach((r, index) => {
            // Desenha as restrições que não são de não-negatividade (x >= 0, y >= 0)
            // As restrições de não-negatividade são os próprios eixos, que já são desenhados.
            if (!((r.coefX === 1 && r.coefY === 0 && r.ladoDireito === 0 && r.tipo === 'ge') ||
                  (r.coefX === 0 && r.coefY === 1 && r.ladoDireito === 0 && r.tipo === 'ge'))) {
                desenharLinhaRestricao(r, cores[corIndex % cores.length]);
                corIndex++;
            }
        });

        // Desenha os pontos extremos (sem as coordenadas inicialmente)
        desenharPontosExtremos(pontosViáveis);

        // Se houver um ponto sob o mouse, desenha o tooltip dele
        if (pontoHover) {
            desenharTooltip(pontoHover, coefXObj, coefYObj);
        }

        // MODIFICADO: Passar o tipo de problema para a função de solução ótima
        const solucaoOtima = encontrarSolucaoOtima(pontosViáveis, coefXObj, coefYObj, tipoProblema);
        resultadoGraficoDiv.innerHTML = `<p>${solucaoOtima.mensagem}</p>`;

        if (solucaoOtima.ponto) {
            ctx.fillStyle = 'magenta'; // Cor para o ponto ótimo
            const px = paraCoordenadaCanvasX(solucaoOtima.ponto.x);
            const py = paraCoordenadaCanvasY(solucaoOtima.ponto.y);
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, 2 * Math.PI); // Desenha um círculo maior para o ponto ótimo
            ctx.fill();
        }
    }

    gerarGraficoBtn.addEventListener('click', desenharGraficoPL);
    // NOVO: Adiciona um listener para redesenhar o gráfico quando o tipo de problema muda
    tipoProblemaObjetivaSelect.addEventListener('change', desenharGraficoPL);

    // --- Lógica do Hover ---
    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect(); // Obtém a posição e tamanho do canvas na tela
        const mouseX = event.clientX - rect.left; // Posição X do mouse relativa ao canvas
        const mouseY = event.clientY - rect.top;  // Posição Y do mouse relativa ao canvas

        let pontoSobMouse = null;

        // Itera sobre todos os pontos extremos para ver se o mouse está sobre algum deles
        pontosExtremosAtuais.forEach(ponto => {
            const px = paraCoordenadaCanvasX(ponto.x);
            const py = paraCoordenadaCanvasY(ponto.y);

            // Calcula a distância do mouse para o centro do ponto
            const distancia = Math.sqrt((mouseX - px)**2 + (mouseY - py)**2);

            // Se a distância for menor que o raio de detecção, o mouse está sobre o ponto
            if (distancia < RAIO_HOVER) {
                pontoSobMouse = ponto;
            }
        });

        // Se o ponto sob o mouse mudou, ou se não havia ponto e agora há, redesenha
        if (pontoSobMouse !== pontoHover) {
            pontoHover = pontoSobMouse;
            desenharGraficoPL(); // Redesenha o gráfico para exibir/ocultar o tooltip
        }
    });

    // Quando o mouse sai do canvas, garante que o tooltip seja removido
    canvas.addEventListener('mouseout', () => {
        if (pontoHover) {
            pontoHover = null;
            desenharGraficoPL(); // Redesenha para limpar o tooltip
        }
    });

    // Inicializa a numeracao das restrições e o gráfico ao carregar a página
    atualizarNumeracaoRestricoes();
    desenharGraficoPL();
});