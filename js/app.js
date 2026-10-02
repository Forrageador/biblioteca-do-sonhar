const estado = {
    sala: 1n,
    estante: 1,
    livro: 1,
    par: 1,
    animando: false,
    aberto: false
};

const MAX_VIRADAS = 4;
const INCLINACAO_FOLHEAR = 20;

let textoPesquisado = '';

const formularioPesquisa = document.getElementById('form-pesquisa');
const campoPesquisa = document.getElementById('pesquisa');
const erroPesquisa = document.getElementById('erro-pesquisa');

const formularioEndereco = document.getElementById('form-endereco');

const campoSala = document.getElementById('sala');
const campoEstante = document.getElementById('estante');
const campoLivro = document.getElementById('numero-livro');
const campoPagina = document.getElementById('numero-pagina');

const erroEndereco = document.getElementById('erro-endereco');

campoPesquisa.maxLength = TAMANHO_PAR;
campoEstante.max = LIMITES.estantes;
campoLivro.max = LIMITES.livros;
campoPagina.max = LIMITES.paginas;

const paginaEsquerda = document.getElementById('pagina-esquerda');
const paginaDireita = document.getElementById('pagina-direita');

const elementoLivro = document.getElementById('livro');
const capa = document.getElementById('capa');
const versoCapa = capa.querySelector('.capa-verso');

const folha = document.getElementById('folha');
const frente = folha.querySelector('.frente');
const verso = folha.querySelector('.verso');

const botaoAnterior = document.getElementById('anterior');
const botaoProxima = document.getElementById('proxima');
const enderecoAtual = document.getElementById('endereco-atual');

function obterPar(endereco, par) {
    const esquerda = par * 2 - 1;
    const direita = par * 2;

    const textoCompleto = gerarTextoDoPar(
        endereco.sala,
        endereco.estante,
        endereco.livro,
        esquerda
    );

    const paginas = {
        esquerda: {
            numero: esquerda,
            texto: textoCompleto.slice(0, TAMANHO_PAGINA)
        },
        direita: {
            numero: direita,
            texto: textoCompleto.slice(TAMANHO_PAGINA)
        }
    };

    const ocorrencias = [];
    if (textoPesquisado) {
        let posicao = textoCompleto.indexOf(textoPesquisado);
        while (posicao !== -1) {
            ocorrencias.push(posicao);
            posicao = textoCompleto.indexOf(textoPesquisado, posicao + textoPesquisado.length);
        }
    }

    [paginas.esquerda, paginas.direita].forEach((pagina, indice) => {
        pagina.destaques = [];
        const inicioPagina = indice * TAMANHO_PAGINA;

        for (const posicao of ocorrencias) {
            const inicio = Math.max(0, posicao - inicioPagina);
            const fim = Math.min(
                TAMANHO_PAGINA,
                posicao + textoPesquisado.length - inicioPagina
            );

            if (inicio < fim) {
                pagina.destaques.push({ inicio, fim });
            }
        }
    });

    return paginas;
}

function ajustarFonte(container) {
    if (
        !container.textContent ||
        container.clientWidth === 0 ||
        container.clientHeight === 0
    ) {
        return;
    }

    const tamanhoMinimo = 4;
    let tamanho = 28;

    container.style.fontSize = `${tamanho}px`;

    while (
        tamanho > tamanhoMinimo &&
        (
            container.scrollHeight > container.clientHeight ||
            container.scrollWidth > container.clientWidth
        )
    ) {
        tamanho -= 0.5;
        container.style.fontSize = `${tamanho}px`;
    }
}

function preencherPagina(elemento, dados) {
    const container = elemento.querySelector('.texto-pagina');
    const conteudo = document.createDocumentFragment();
    let posicao = 0;

    dados.destaques.forEach(({ inicio, fim }) => {
        conteudo.append(document.createTextNode(dados.texto.slice(posicao, inicio)));

        const destaque = document.createElement('mark');
        destaque.textContent = dados.texto.slice(inicio, fim);
        conteudo.append(destaque);
        posicao = fim;
    });

    conteudo.append(document.createTextNode(dados.texto.slice(posicao)));
    container.replaceChildren(conteudo);
    elemento.querySelector('.numero-pagina').textContent = dados.numero;

    ajustarFonte(container);
}

function atualizarControles() {
    elementoLivro.classList.toggle('animando', estado.animando);
    elementoLivro.classList.toggle(
        'fechado',
        !estado.aberto && !estado.animando
    );
    elementoLivro.classList.toggle('aberto', estado.aberto);

    const salaCompleta = formatarSala(estado.sala);
    const salaResumida = salaCompleta.length > 20
        ? `${salaCompleta.slice(0, 8)}…${salaCompleta.slice(-8)}`
        : salaCompleta;

    const esquerda = estado.par * 2 - 1;
    const direita = estado.par * 2;
    const endereco = document.getElementById('endereco-atual');

    if (estado.aberto) {
        enderecoAtual.textContent =
            `Sala ${salaResumida}, estante ${estado.estante}, livro ${estado.livro}, páginas ${esquerda} e ${direita}.`;
    } else {
        enderecoAtual.textContent = estado.animando
            ? 'Abrindo o livro…'
            : 'O livro está fechado.';
    }

    const bloquearNavegacao = !estado.aberto || estado.animando;

    botaoAnterior.disabled =
        bloquearNavegacao || estado.par <= 1;

    botaoProxima.disabled =
        bloquearNavegacao || estado.par >= PARES_POR_LIVRO;
}

function renderizar(paginas = obterPar(estado, estado.par)) {
    atualizarControles();
    preencherPagina(paginaEsquerda, paginas.esquerda);
    preencherPagina(paginaDireita, paginas.direita);
    preencherPagina(versoCapa, paginas.esquerda);
}

async function abrirLivro() {
    if (estado.aberto || estado.animando) {
        return;
    }

    let animacao;

    estado.animando = true;

    try {
        renderizar();

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

        estado.aberto = true;
        campoPagina.value = estado.par * 2 - 1;
    } catch (erro) {
        console.error('Não foi possível abrir o livro.', erro);
    } finally {
        estado.animando = false;
        atualizarControles();

        if (animacao) {
            animacao.cancel();
        }
    }
}

async function ajustarInclinacao(angulo) {
    elementoLivro.style.setProperty(
        '--inclinacao',
        `${angulo}deg`
    );

    const animacoes = [
        ...paginaEsquerda.getAnimations(),
        ...paginaDireita.getAnimations()
    ];

    await Promise.allSettled(
        animacoes.map(animacao => animacao.finished)
    );
}

async function animarFolha(anguloInicial, anguloFinal, duracao){
    const animacao = folha.animate(
        [
            {
                transform: `translateZ(2px) rotateY(${anguloInicial}deg)`
            },
            {
                transform: `translateZ(2px) rotateY(${anguloFinal}deg)`
            }
        ],
        {
            duration: duracao,
            easing: 'ease-in-out',
            fill: 'forwards'
        }
    );

    try {
        await animacao.finished;
    } finally {
        animacao.cancel();
    }
}

async function virar(direcao, endereco = null) {
    if (!estado.aberto || estado.animando) {
        return false;
    }

    const destino = endereco
        ? Math.ceil(endereco.pagina / 2)
        : estado.par + direcao;

    if (destino < 1 || destino > PARES_POR_LIVRO) {
        return false;
    }

    const alvo = endereco ?? estado;

    const novoEstado = {
        sala: alvo.sala,
        estante: alvo.estante,
        livro: alvo.livro,
        par: destino
    };

    const atual = obterPar(estado, estado.par);
    const proximo = obterPar(novoEstado, destino);
    let paginasFinais = atual;
    const mesmoLivro =
        alvo.sala === estado.sala &&
        alvo.estante === estado.estante &&
        alvo.livro === estado.livro;

    const distancia = Math.abs(destino - estado.par);

    const quantidade = mesmoLivro
        ? Math.min(MAX_VIRADAS, Math.max(1, distancia))
        : MAX_VIRADAS;

    const inclinacao = quantidade > 1 ? INCLINACAO_FOLHEAR : 0;

    const avancando = mesmoLivro
        ? destino >= estado.par
        : direcao === 1;

    estado.animando = true;

    try {
        renderizar(atual);
        await ajustarInclinacao(inclinacao);

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

        const anguloInicial = avancando
            ? -inclinacao
            : inclinacao;

        const anguloFinal = avancando
            ? -180 + inclinacao
            : 180 - inclinacao;

        folha.style.visibility = 'visible';

        for (let i = 0; i < quantidade; i++) {
            const ultima = i === quantidade - 1;

            let duracao = 150;

            if (quantidade === 1) {
                duracao = 900;
            } else if (ultima) {
                duracao = 600;
            }

            await animarFolha(anguloInicial, anguloFinal, duracao);
        }

        Object.assign(estado, novoEstado);
        campoPagina.value = estado.par * 2 - 1;
        paginasFinais = proximo;

        return true;
    } catch (erro) {
        console.error('Não foi possível concluir a virada.', erro);

        return false;
    } finally {
        folha.style.visibility = 'hidden';

        renderizar(paginasFinais);

        await ajustarInclinacao(0);

        elementoLivro.style.removeProperty('--inclinacao');

        estado.animando = false;
        atualizarControles();
    }
}

async function irParaEndereco(endereco) {
    if (estado.animando) {
        return;
    }

    const { sala, estante, livro, pagina } = endereco;

    validarEndereco(sala, estante, livro, pagina);

    if (estado.aberto) {
        const concluiu = await virar(1, endereco);

        if (!concluiu) {
            throw new Error(
                'Não foi possível mostrar o resultado. Tente novamente.'
            );
        }
    } else {
        estado.sala = sala;
        estado.estante = estante;
        estado.livro = livro;
        estado.par = Math.ceil(pagina / 2);

        await abrirLivro();

        if (!estado.aberto) {
            throw new Error(
                'Não foi possível abrir o livro. Tente novamente.'
            );
        }
    }

    campoSala.value = formatarSala(sala);
    campoEstante.value = estante;
    campoLivro.value = livro;

    erroEndereco.textContent = '';
}

botaoProxima.addEventListener('click', () => {
    virar(1);
});

botaoAnterior.addEventListener('click', () => {
    virar(-1);
});

formularioEndereco.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (estado.animando) {
        return;
    }

    erroEndereco.textContent = '';

    if (!formularioEndereco.reportValidity()) {
        return;
    }

    try {
        const endereco = {
            sala: lerSala(campoSala.value),
            estante: campoEstante.valueAsNumber,
            livro: campoLivro.valueAsNumber,
            pagina: campoPagina.valueAsNumber
        };

        await irParaEndereco(endereco);
    } catch (erro) {
        erroEndereco.textContent = erro.message;
    }
});

formularioPesquisa.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (estado.animando) {
        return;
    }

    erroPesquisa.textContent = '';

    if (!formularioPesquisa.reportValidity()) {
        return;
    }

    const pesquisaAnterior = textoPesquisado;

    try {
        const endereco = localizarTexto(campoPesquisa.value);
        textoPesquisado = endereco.texto;

        await irParaEndereco(endereco);
    } catch (erro) {
        textoPesquisado = pesquisaAnterior;
        renderizar();
        erroPesquisa.textContent = erro.message;
    }
});

renderizar();

function ajustarFontesDoLivro() {
    elementoLivro
        .querySelectorAll('.texto-pagina')
        .forEach(ajustarFonte);
}

const observadorLivro = new ResizeObserver(ajustarFontesDoLivro);

observadorLivro.observe(elementoLivro);

document.fonts.ready.then(ajustarFontesDoLivro);