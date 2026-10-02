const containerEstrelas = document.getElementById('stars');

for (let i = 0; i < 70; i++) {
    const estrela = document.createElement('i');
    estrela.className = 's';
    estrela.style.cssText = `
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation-delay: ${Math.random() * 6}s;
        animation-duration: ${4 + Math.random() * 5}s;
    `;
    containerEstrelas.append(estrela);
}