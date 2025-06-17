document.addEventListener('DOMContentLoaded', () => {

    // Seleciona todos os links de navegação com a classe 'nav-item'
    const navItems = document.querySelectorAll('.nav-item');
    
    // Seleciona todas as seções dentro do <main> que serão controladas
    const sections = document.querySelectorAll('main section');

    /**
     * Função responsável por alternar visibilidade das seções
     * Ela usa classList.toggle para deixar o código enxuto
     */
    const mostrarSecao = id => {
        sections.forEach(secao => {
            // Se o id da seção for igual ao solicitado, ativa a classe 'secao-visivel'
            secao.classList.toggle('secao-visivel', secao.id === id);
            // Se for diferente, ativa a classe 'secao-oculta'
            secao.classList.toggle('secao-oculta', secao.id !== id);
        });
    };

    // Para cada item de navegação (link), adiciona o evento de clique
    navItems.forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault(); // Impede o comportamento padrão do link (não navega)
            
            // Lê o atributo 'data-target' do elemento clicado, que contém o id da seção alvo
            const idAlvo = e.target.dataset.target;

            // Se houver um id válido, chama a função para exibir a seção
            if (idAlvo) mostrarSecao(idAlvo);
        });
    });

});
