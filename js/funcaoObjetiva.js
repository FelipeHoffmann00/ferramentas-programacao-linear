// Aguarda o DOM estar completamente carregado para executar o código
document.addEventListener('DOMContentLoaded', () => {

    // --- Referências DOM ---
    // Busca os elementos principais da interface
    const canvas = document.getElementById('canvasFuncaoObjetiva');
    const ctx = canvas.getContext('2d');
    const containerRestricoes = document.getElementById('containerRestricoes');
    const btnAdd = document.getElementById('adicionarRestricao');
    const btnGerar = document.getElementById('gerarGrafico');
    const resultadoDiv = document.getElementById('resultadoGrafico');
    const tipoProblemaSelect = document.getElementById('tipoProblemaObjetiva');

    // --- Configurações do Canvas ---
    const M = 50; // margem do gráfico
    canvas.width = 600;
    canvas.height = 400;
    let escalaX = 1, escalaY = 1, maxX = 10, maxY = 10;
    let pontosViaveis = [], pontoHover = null;

    // Conversões de coordenadas do plano cartesiano para canvas
    const CX = x => M + x * escalaX; // coordenada X no canvas
    const CY = y => canvas.height - M - y * escalaY; // coordenada Y no canvas (invertido)
    const PX = px => (px - M) / escalaX; // pixel X para plano
    const PY = py => (canvas.height - M - py) / escalaY; // pixel Y para plano

    // --- Adição dinâmica de restrições ---
    const addRestricao = () => {
        // Cria a estrutura HTML de uma nova restrição
        const div = document.createElement('div');
        div.className = 'restricao-item';
        div.innerHTML = `
            <label>Restrição:</label>
            <input type="number" class="coef-x" value="1">x +
            <input type="number" class="coef-y" value="1">y
            <select class="tipo-restricao">
                <option value="le"><=</option>
                <option value="ge">>=</option>
                <option value="eq">=</option>
            </select>
            <input type="number" class="lado-direito" value="10">
            <button class="remover-restricao">Remover</button>`;
        containerRestricoes.appendChild(div);

        // Evento para remover a restrição adicionada
        div.querySelector('.remover-restricao').onclick = () => div.remove();
    };

    btnAdd.onclick = addRestricao;

    // --- Parte Matemática ---

    // Função que verifica se um ponto satisfaz uma restrição
    const satisfaz = (p, r) => {
        const v = r.coefX * p.x + r.coefY * p.y, e = 1e-9;
        return r.tipo === 'le' ? v <= r.ladoDireito + e :
               r.tipo === 'ge' ? v >= r.ladoDireito - e :
               Math.abs(v - r.ladoDireito) < e;
    };

    // Calcula o ponto de interseção de duas restrições (duas retas)
    const interseccao = (r1, r2) => {
        const d = r1.coefX * r2.coefY - r2.coefX * r1.coefY;
        if (Math.abs(d) < 1e-9) return null; // paralelas
        const x = (r1.ladoDireito * r2.coefY - r2.ladoDireito * r1.coefY) / d;
        const y = (r1.coefX * r2.ladoDireito - r2.coefX * r1.ladoDireito) / d;
        return { x, y };
    };

    // Calcula todos os pontos viáveis da região
    const calcularViavel = restricoes => {
        const pts = new Set();
        const add = p => (p.x >= 0 && p.y >= 0 && restricoes.every(r => satisfaz(p, r))) && pts.add(JSON.stringify(p));
        add({ x: 0, y: 0 }); // adiciona origem

        // Interseções com eixos
        restricoes.forEach(r => {
            if (r.coefX !== 0) add({ x: r.ladoDireito / r.coefX, y: 0 });
            if (r.coefY !== 0) add({ x: 0, y: r.ladoDireito / r.coefY });
        });

        // Interseção entre restrições
        for (let i = 0; i < restricoes.length; i++) {
            for (let j = i + 1; j < restricoes.length; j++) {
                const p = interseccao(restricoes[i], restricoes[j]);
                if (p) add(p);
            }
        }
        return [...pts].map(JSON.parse);
    };

    // Ordena os pontos para formar o polígono viável (ordenação angular)
    const ordenarPoligono = pts => {
        const c = pts.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
        c.x /= pts.length; c.y /= pts.length;
        return pts.sort((a, b) => Math.atan2(a.y - c.y, a.x - c.x) - Math.atan2(b.y - c.y, b.x - c.x));
    };

    // Encontra a solução ótima com base na função objetivo
    const solucaoOtima = (pts, cx, cy, tipo) => {
        if (pts.length === 0) return { mensagem: 'Sem região viável' };
        let melhor = (tipo === 'max') ? -Infinity : Infinity, ponto = null;
        pts.forEach(p => {
            const z = cx * p.x + cy * p.y;
            if ((tipo === 'max' && z > melhor) || (tipo === 'min' && z < melhor)) {
                melhor = z; ponto = p;
            }
        });
        return { ponto, mensagem: `Z = ${melhor.toFixed(2)} em X = ${ponto.x.toFixed(2)}, Y = ${ponto.y.toFixed(2)}` };
    };

    // --- Parte Gráfica ---

    // Função principal de desenho
    const desenhar = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const cxObj = parseFloat(document.getElementById('coefXObjetivo').value);
        const cyObj = parseFloat(document.getElementById('coefYObjetivo').value);
        const tipo = tipoProblemaSelect.value;

        // Coleta as restrições da interface
        const restricoes = [
            { coefX: 1, coefY: 0, tipo: 'ge', ladoDireito: 0 },
            { coefX: 0, coefY: 1, tipo: 'ge', ladoDireito: 0 },
            ...[...containerRestricoes.querySelectorAll('.restricao-item')].map(div => ({
                coefX: parseFloat(div.querySelector('.coef-x').value),
                coefY: parseFloat(div.querySelector('.coef-y').value),
                tipo: div.querySelector('.tipo-restricao').value,
                ladoDireito: parseFloat(div.querySelector('.lado-direito').value)
            }))
        ];

        // Calcula escalas de desenho
        maxX = maxY = Math.max(...restricoes.map(r => r.ladoDireito || 10), 10);
        escalaX = (canvas.width - 2 * M) / (maxX * 1.2);
        escalaY = (canvas.height - 2 * M) / (maxY * 1.2);

        // Calcula região viável e ordena
        pontosViaveis = ordenarPoligono(calcularViavel(restricoes));
        desenharEixos();

        // Sombreamento da região viável
        if (pontosViaveis.length >= 3) {
            ctx.fillStyle = 'rgba(0,123,255,0.2)';
            ctx.beginPath();
            ctx.moveTo(CX(pontosViaveis[0].x), CY(pontosViaveis[0].y));
            pontosViaveis.forEach(p => ctx.lineTo(CX(p.x), CY(p.y)));
            ctx.closePath();
            ctx.fill();
        }

        // Desenha restrições (excluindo as de não-negatividade)
        restricoes.slice(2).forEach((r, i) => desenharRestricao(r, i));

        desenharPontos(); // desenha os pontos extremos
        if (pontoHover) desenharTooltip(pontoHover, cxObj, cyObj); // hover
        const sol = solucaoOtima(pontosViaveis, cxObj, cyObj, tipo);
        resultadoDiv.innerHTML = sol.mensagem;
        if (sol.ponto) desenharOtimo(sol.ponto);
    };

    // Desenha os eixos cartesianos
    const desenharEixos = () => {
        ctx.beginPath();
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1.5;

        // Eixo X
        ctx.moveTo(M, canvas.height - M);
        ctx.lineTo(canvas.width - M / 2, canvas.height - M);

        // Eixo Y
        ctx.moveTo(M, canvas.height - M);
        ctx.lineTo(M, M / 2);
        ctx.stroke();

        ctx.font = '10px Arial';
        ctx.fillStyle = '#cccccc';
        ctx.textAlign = 'center';
        for (let x = 1; x <= maxX; x++) {
            const px = CX(x);
            ctx.beginPath();
            ctx.moveTo(px, canvas.height - M - 3);
            ctx.lineTo(px, canvas.height - M + 3);
            ctx.stroke();
            ctx.fillText(x.toString(), px, canvas.height - M + 12);
        }

        ctx.textAlign = 'right';
        for (let y = 1; y <= maxY; y++) {
            const py = CY(y);
            ctx.beginPath();
            ctx.moveTo(M - 3, py);
            ctx.lineTo(M + 3, py);
            ctx.stroke();
            ctx.fillText(y.toString(), M - 8, py + 3);
        }
    };

    // Desenha cada restrição (linha de reta)
    const desenharRestricao = (r, i) => {
        ctx.strokeStyle = ['#007bff', '#28a745', '#dc3545', '#ffc107'][i % 4];
        ctx.beginPath();
        if (r.coefY === 0) {
            const x = r.ladoDireito / r.coefX;
            ctx.moveTo(CX(x), CY(0));
            ctx.lineTo(CX(x), CY(maxY));
        } else if (r.coefX === 0) {
            const y = r.ladoDireito / r.coefY;
            ctx.moveTo(CX(0), CY(y));
            ctx.lineTo(CX(maxX), CY(y));
        } else {
            const y0 = r.ladoDireito / r.coefY;
            const x0 = r.ladoDireito / r.coefX;
            ctx.moveTo(CX(0), CY(y0));
            ctx.lineTo(CX(x0), CY(0));
        }
        ctx.stroke();
    };

    // Desenha todos os pontos extremos calculados
    const desenharPontos = () => {
        ctx.fillStyle = '#f5f5f5';
        pontosViaveis.forEach(p => {
            ctx.beginPath();
            ctx.arc(CX(p.x), CY(p.y), 4, 0, 2 * Math.PI);
            ctx.fill();
        });
    };

    // Destaca o ponto ótimo encontrado
    const desenharOtimo = p => {
        ctx.fillStyle = 'magenta';
        ctx.beginPath();
        ctx.arc(CX(p.x), CY(p.y), 6, 0, 2 * Math.PI);
        ctx.fill();
    };

    // Desenha o tooltip de hover sobre o ponto
    const desenharTooltip = (p, cxObj, cyObj) => {
        const z = (cxObj * p.x + cyObj * p.y).toFixed(2);
        const text = `X: ${p.x.toFixed(2)}  Y: ${p.y.toFixed(2)}  Z: ${z}`;

        const px = CX(p.x);
        const py = CY(p.y);
        ctx.font = '12px Arial';
        const metrics = ctx.measureText(text);
        const w = metrics.width + 10;
        const h = 20;

        let tx = px + 10, ty = py - 10;
        if (tx + w > canvas.width) tx = px - w - 10;
        if (ty - h < 0) ty = py + 10;

        ctx.fillStyle = 'white';
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.fillRect(tx, ty - h, w, h);
        ctx.strokeRect(tx, ty - h, w, h);

        ctx.fillStyle = '#000';
        ctx.textAlign = 'left';
        ctx.fillText(text, tx + 5, ty - 5);
    };

    // --- Eventos principais ---

    // Botão de gerar gráfico
    btnGerar.onclick = desenhar;
    tipoProblemaSelect.onchange = desenhar;

    // Evento hover no canvas
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        pontoHover = pontosViaveis.find(p => {
            const dx = CX(p.x) - mx, dy = CY(p.y) - my;
            return Math.hypot(dx, dy) < 8;
        });
        desenhar();
    });

    // Remove hover quando sai do canvas
    canvas.addEventListener('mouseout', () => {
        pontoHover = null;
        desenhar();
    });

    // Inicialização automática ao carregar
    addRestricao();
    desenhar();
});
