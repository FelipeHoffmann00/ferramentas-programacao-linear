document.addEventListener('DOMContentLoaded', () => {
    // Seleciona todos os links de navegação com a classe 'nav-item'
    const navItems = document.querySelectorAll('.nav-item');
    // Seleciona todas as seções que queremos controlar a visibilidade
    const sections = document.querySelectorAll('main section');

    // Função para ocultar todas as seções e mostrar apenas a selecionada
    function mostrarSecao(idSecao) {
        // Oculta todas as seções
        sections.forEach(section => {
            section.classList.remove('secao-visivel');
            section.classList.add('secao-oculta');
        });

        // Mostra apenas a seção desejada
        const secaoAlvo = document.getElementById(idSecao);
        if (secaoAlvo) {
            secaoAlvo.classList.remove('secao-oculta');
            secaoAlvo.classList.add('secao-visivel');
        }
    }

    // Adiciona um 'click listener' a cada item de navegação
    navItems.forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault(); // Impede o comportamento padrão do link (rolar para a âncora)

            // Obtém o ID da seção alvo a partir do atributo 'data-target'
            const idAlvo = event.target.dataset.target;
            mostrarSecao(idAlvo);
        });
    });

    // Opcional: Se quiser que a primeira seção seja exibida por padrão ao carregar a página
    // (já fizemos isso no HTML com a classe 'secao-visivel', mas esta linha garantiria caso mudasse o padrão)
    // const primeiraSecaoId = sections[0] ? sections[0].id : null;
    // if (primeiraSecaoId) {
    //     mostrarSecao(primeiraSecaoId);
    // }
});