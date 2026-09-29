const ALFABETO = '0123456789abcdefghijklmnopqrstuvwxyzáàâãéêíóôõúüç- .,';
const ALFABETO_SALAS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const TAMANHO_PAGINA = 1000;
const TAMANHO_PAR = TAMANHO_PAGINA * 2;

const LIMITES = {
    estantes: 5000,
    livros: 1000,
    paginas: 700
}

const BASE = BigInt(ALFABETO.length);
const TOTAL_TEXTOS = BASE ** BigInt(TAMANHO_PAR);

function criarNumeroFixo(semente) {
    let numero = 0n;

    for (let i = 0; i < TAMANHO_PAR; i++) {
        semente ^= semente << 13;
        semente ^= semente >>> 17;
        semente ^= semente << 5;

        numero = numero * BASE + BigInt(semente >>> 0) % BASE;
    }

    return numero;
}

function inversoModular(valor, modulo) {
    let a = valor;
    let b = modulo;
    let x = 1n;
    let y = 0n;

    while (b !== 0n) {
        const quociente = a / b;
        [a, b] = [b, a % b];
        [x, y] = [y, x - quociente * y];
    }

    if (a !== 1n) {
        throw new Error('O multiplicador não possui inverso.');
    }

    return (x % modulo + modulo) % modulo;
}

const MULTIPLICADOR =
    criarNumeroFixo(123456789) / BASE * BASE + 1n;

const DESLOCAMENTO =
    criarNumeroFixo(987654321);

const MULTIPLICADOR_INVERSO =
    inversoModular(MULTIPLICADOR, TOTAL_TEXTOS);

function embaralharNumero(numero) {
    return (
        (numero % TOTAL_TEXTOS) * MULTIPLICADOR + DESLOCAMENTO
    ) % TOTAL_TEXTOS;
}

function numeroDoTexto(texto) {
    let numero = 0n;

    for (const caractere of texto) {
        numero = numero * BASE + BigInt(ALFABETO.indexOf(caractere));
    }

    return numero;
}

function textoDoNumero(numero) {
    let texto = '';

    for (let i = 0; i < TAMANHO_PAR; i++) {
        texto = ALFABETO[Number(numero % BASE)] + texto;
        numero /= BASE;
    }

    return texto;
}

function localizarTexto(entrada) {
    const texto = entrada
        .normalize('NFC')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

    if (texto.length == 0 || texto.length > TAMANHO_PAR) {
        throw new Error(
            `Digite de 1 a ${TAMANHO_PAR} caracteres.`
        );
    }

    for (const caractere of texto) {
        if (!ALFABETO.includes(caractere)) {
            throw new Error(
                `Caractere não permitido: ${caractere}`
            );
        }
    }

    const numeroFundo = embaralharNumero(
        numeroDoTexto(texto.padEnd(TAMANHO_PAR, ' '))
    );
    const fundo = textoDoNumero(numeroFundo);
    const espaco = TAMANHO_PAR - texto.length;
    const inicio = espaco > 1
        ? Number(numeroFundo % BigInt(espaco - 1)) + 1
        : 0;
    const parCompleto = fundo.slice(0, inicio)
        + texto
        + fundo.slice(inicio + texto.length);

    let numero = (
        (numeroDoTexto(parCompleto) - DESLOCAMENTO) * MULTIPLICADOR_INVERSO
    ) % TOTAL_TEXTOS;

    if (numero < 0n) {
        numero += TOTAL_TEXTOS;
    }

    const par = Number(numero % BigInt(LIMITES.paginas / 2));
    const pagina = par * 2 + 1 + Math.floor(inicio / TAMANHO_PAGINA);
    numero /= BigInt(LIMITES.paginas / 2);

    const livro = Number(numero % BigInt(LIMITES.livros)) + 1;
    numero /= BigInt(LIMITES.livros);

    const estante = Number(numero % BigInt(LIMITES.estantes)) + 1;
    numero /= BigInt(LIMITES.estantes);

    return {
        sala: numero + 1n,
        estante,
        livro,
        pagina,
        texto
    };
}

function gerarPagina(sala, estante, livro, pagina) {
    validarEndereco(sala, estante, livro, pagina);

    let numero = sala - 1n;

    numero = numero * BigInt(LIMITES.estantes) + BigInt(estante - 1);
    numero = numero * BigInt(LIMITES.livros) + BigInt(livro - 1);
    numero = numero * BigInt(LIMITES.paginas / 2)
        + BigInt(Math.floor((pagina - 1) / 2));

    const texto = textoDoNumero(embaralharNumero(numero));
    const inicio = (pagina - 1) % 2 * TAMANHO_PAGINA;

    return texto.slice(inicio, inicio + TAMANHO_PAGINA);
}

function validarEndereco(sala, estante, livro, pagina) {
    if (typeof sala !== 'bigint' || sala < 1n) {
        throw new Error('A sala deve ser um inteiro positivo.');
    }

    for (const [valor, maximo] of [
        [estante, LIMITES.estantes],
        [livro, LIMITES.livros],
        [pagina, LIMITES.paginas]
    ]) {
        if (!Number.isInteger(valor) || valor < 1 || valor > maximo) {
            throw new Error(
                'Estante, livro ou página fora dos limites da biblioteca.'
            );
        }
    }
}

function formatarSala(sala) {
    let codigo = '';

    do {
        codigo = ALFABETO_SALAS[Number(sala % 62n)] + codigo;
        sala /= 62n;
    } while (sala > 0n);

    return codigo;
}

function lerSala(entrada) {
    const codigo = entrada.trim();

    if (!/^[0-9a-zA-Z]+$/.test(codigo)) {
        throw new Error(
            'Use apenas letras de a a z, A a Z e números de 0 a 9 na sala.'
        );
    }

    let sala = 0n;

    for (const caractere of codigo) {
        sala = sala * 62n + BigInt(ALFABETO_SALAS.indexOf(caractere));
    }

    if (sala < 1n) {
        throw new Error('A sala deve ser maior que zero.');
    }

    return sala;
}