const estado = {
    sala: 1,
    estante: 1,
    livro: 1,
    par: 1,
    animando: false,
    aberto: false
};

const paginaEsquerda = document.getElementById('pagina-esquerda');
const paginaDireita = document.getElementById('pagina-direita');

const elementoLivro = document.getElementById('livro');
const capa = document.getElementById('capa');
const botaoAbrir = document.getElementById('abrir-livro');

const folha = document.getElementById('folha');
const frente = folha.querySelector('.frente');
const verso = folha.querySelector('.verso');

const numeroEsquerdo = estado.par * 2 - 1;
const numeroDireito = estado.par *2;

function obterPar(endereco, par) {
    const esquerda = par * 2 - 1;
    const direita = par * 2;

    return {
        esquerda: { numero: esquerda, texto: `Texto da página ${esquerda}.`},
        direita: { numero: direita, texto: `Texto da página ${direita}.`}
    };
}

function preencherPagina(elemento, dados) {
    elemento.querySelector('.texto-pagina').textContent = dados.texto;
    elemento.querySelector('.numero-pagina').textContent = dados.numero;
}

function renderizar() {
    const paginas = obterPar(estado, estado.par);

    preencherPagina(paginaEsquerda, paginas.esquerda);
    preencherPagina(paginaDireita, paginas.direita);

    elementoLivro.classList.toggle(
        'fechado',
        !estado.aberto && !estado.animando
    );

    elementoLivro.classList.toggle('aberto', estado.aberto);

    const endereco = document.getElementById('endereco-atual');

    if (estado.aberto) {
        endereco.textContent =
            `Sala ${estado.sala}, estante ${estado.estante}, livro ${estado.livro}, páginas ${paginas.esquerda.numero} e ${paginas.direita.numero}.`;
    } else {
        endereco.textContent = estado.animando
            ? 'Abrindo o livro…'
            : 'O livro está fechado.';
    }

    const bloquearNavegacao = !estado.aberto || estado.animando;

    document.getElementById('anterior').disabled =
        bloquearNavegacao || estado.par <= 1;

    document.getElementById('proxima').disabled =
        bloquearNavegacao || estado.par >= 205;

    botaoAbrir.disabled = estado.aberto || estado.animando;

    botaoAbrir.textContent = estado.aberto
        ? 'Livro aberto'
        : 'Abrir livro';
}

async function abrirLivro() {
    if (estado.aberto || estado.animando) {
        return;
    }

    let animacao;

    estado.animando = true;

    try {
        renderizar();

        const reduzirMovimento = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;

        if (!reduzirMovimento) {
            animacao = capa.animate(
                [
                    {
                        transform: 'translateZ(4px) rotateY(0deg)'
                    },
                    {
                        transform: 'translateZ(4px) rotateY(-180deg)'
                    }
                ],
                {
                    duration: 1400,
                    easing: 'ease-in-out',
                    fill: 'forwards'
                }
            );

            await animacao.finished;
        }

        estado.aberto = true;
    } catch (erro) {
        console.error('Não foi possível abrir o livro.', erro);
    } finally {
        estado.animando = false;
        renderizar();

        if (animacao) {
            animacao.cancel();
        }
    }
}

async function virar(direcao) {
    if (!estado.aberto || estado.animando) {
        return;
    }

    const destino = estado.par + direcao;

    if (destino < 1 || destino > 205) {
        return;
    }

    // const reduzirMovimento = window.matchMedia(
    //     '(prefers-reduced-motion: reduce)'
    // ).matches;

    // if (reduzirMovimento) {
    //     estado.par = destino;
    //     renderizar();
    //     return;
    // }

    const atual = obterPar(estado, estado.par);
    const proximo = obterPar(estado, destino);
    const avancando = direcao == 1;

    let animacao;

    estado.animando = true;

    try {
        renderizar();

        folha.classList.toggle('vai-adiante', avancando);
        folha.classList.toggle('vai-atras', !avancando);

        if (avancando) {
            preencherPagina(frente, atual.direita);
            preencherPagina(verso, proximo.esquerda);

            preencherPagina(paginaDireita, proximo.direita);
        } else {
            preencherPagina(frente, atual.esquerda);
            preencherPagina(verso, proximo.direita);

            preencherPagina(paginaEsquerda, proximo.esquerda);
        }

        const angulo = avancando ? -180 : 180;

        folha.style.visibility = 'visible';

        animacao = folha.animate(
            [
                {
                    transform: 'translateZ(2px) rotateY(0deg)'
                },
                {
                    transform: `translateZ(2px) rotateY(${angulo}deg)`
                }
            ],
            {
                duration: 900,
                easing: 'ease-in-out',
                fill: 'forwards'
            }
        );

        await animacao.finished;

        estado.par = destino;
    } catch (erro) {
        console.error('Não foi possível concluir a virada de página.', erro);
    } finally {
        estado.animando = false;
        renderizar();

        folha.style.visibility = 'hidden';

        if (animacao) {
            animacao.cancel();
        }
    }
}

document.getElementById('proxima').addEventListener('click', () => {
    virar(1);
});

document.getElementById('anterior').addEventListener('click', () => {
    virar(-1);
});

botaoAbrir.addEventListener('click', abrirLivro);

renderizar();