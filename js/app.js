const estado = {
    sala: 1n,
    estante: 1,
    livro: 1,
    par: 1,
    animando: false,
    aberto: false
};

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

function obterPar(endereco, par) {
    const esquerda = par * 2 - 1;
    const direita = par * 2;

    const paginas = {
        esquerda: {
            numero: esquerda,
            texto: gerarPagina(
                endereco.sala,
                endereco.estante,
                endereco.livro,
                esquerda
            )
        },
        direita: {
            numero: direita,
            texto: gerarPagina(
                endereco.sala,
                endereco.estante,
                endereco.livro,
                direita
            )
        }
    };

    const textoCompleto = paginas.esquerda.texto + paginas.direita.texto;

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
}

function renderizar() {
    const paginas = obterPar(estado, estado.par);

    const salaCompleta = formatarSala(estado.sala);

    const salaResumida = salaCompleta.length > 20
        ? `${salaCompleta.slice(0, 8)}…${salaCompleta.slice(-8)}`
        : salaCompleta;

    preencherPagina(paginaEsquerda, paginas.esquerda);
    preencherPagina(paginaDireita, paginas.direita);
    preencherPagina(versoCapa, paginas.esquerda);

    elementoLivro.classList.toggle(
        'fechado',
        !estado.aberto && !estado.animando
    );

    elementoLivro.classList.toggle('aberto', estado.aberto);

    const endereco = document.getElementById('endereco-atual');

    if (estado.aberto) {
        endereco.textContent =
            `Sala ${salaResumida}, estante ${estado.estante}, livro ${estado.livro}, páginas ${paginas.esquerda.numero} e ${paginas.direita.numero}.`;
    } else {
        endereco.textContent = estado.animando
            ? 'Abrindo o livro…'
            : 'O livro está fechado.';
    }

    const bloquearNavegacao = !estado.aberto || estado.animando;

    document.getElementById('anterior').disabled =
        bloquearNavegacao || estado.par <= 1;

    document.getElementById('proxima').disabled =
        bloquearNavegacao || estado.par >= LIMITES.paginas / 2;

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

async function virar(direcao, endereco = null) {
    if (!estado.aberto || estado.animando) {
        return false;
    }

    const destino = endereco
        ? Math.ceil(endereco.pagina / 2)
        : estado.par + direcao;

    if (destino < 1 || destino > LIMITES.paginas / 2) {
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
    const avancando = direcao === 1;

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

        Object.assign(estado, novoEstado);

        return true;
    } catch (erro) {
        console.error('Não foi possível concluir a virada.', erro);

        return false;
    } finally {
        estado.animando = false;
        renderizar();

        folha.style.visibility = 'hidden';

        if (animacao) {
            animacao.cancel();
        }
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
    campoPagina.value = estado.par * 2 - 1;

    erroEndereco.textContent = '';
}

document.getElementById('proxima').addEventListener('click', async () => {
    const concluiu = await virar(1);
    if (concluiu) campoPagina.value = estado.par * 2 - 1;
});

document.getElementById('anterior').addEventListener('click', async () => {
    const concluiu = await virar(-1);
    if (concluiu) campoPagina.value = estado.par * 2 - 1;
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
