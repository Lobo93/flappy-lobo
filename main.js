// Canvas
const contexto = canvas.getContext('2d')

// Efeitos sonoros
const somPulo = new Audio('audio/pulo.wav')
const somPontos = new Audio('audio/pontos.wav')
const somBatida = new Audio('audio/batida.wav')

// Carregar sprites
const folhaDeSprites = {
	fonte: new Image,
	lobo: [0,0,256,256],
	canoTopo: [264,0,256,64],
	canoBase: [264,72,256,64],
	grama: [264,144,256,128],
	cidade: [0,280,512,256],
	nuvens: [0,544,512,256]
}
folhaDeSprites.fonte.src = 'images/folha-de-sprites.png'

// Desenhar sprites
function desenharSprite(imagem, posicaoX = 0, posicaoY = 0, largura = 0, altura = 0, angulo = 0) {
	angulo *= Math.PI / 180
 	contexto.save();
	contexto.translate(posicaoX, posicaoY);
	contexto.rotate(angulo);
	contexto.translate(-largura/2, -altura/2);
	contexto.drawImage(folhaDeSprites.fonte, ...folhaDeSprites[imagem], 0, 0, largura, altura)
	contexto.restore();
}

// Gerar imagens de fundo
const canvasAuxiliar = document.createElement('canvas')
const contextoAuxiliar = canvasAuxiliar.getContext('2d')
const imagensDeFundo = {}

function gerarImagemDeFundo(imagem, largura, altura, paralaxe) {
	canvasAuxiliar.width = largura
	canvasAuxiliar.height = altura
	contextoAuxiliar.clearRect(0,0,canvasAuxiliar.width,canvasAuxiliar.height)
	contextoAuxiliar.drawImage(folhaDeSprites.fonte, ...folhaDeSprites[imagem], 0, 0, largura, altura)
	imagensDeFundo[imagem] = {
		textura: contextoAuxiliar.createPattern(canvasAuxiliar, 'repeat-x'),
		largura: largura,
		altura: altura,
		posicaoX: 0,
		paralaxe: paralaxe
	}
}

// Desenhar imagens de fundo
function desenharImagemDeFundo(imagem, posicaoY) {
	imagensDeFundo[imagem].posicaoX -= velocidade * imagensDeFundo[imagem].paralaxe * tempoDelta
	imagensDeFundo[imagem].posicaoX = imagensDeFundo[imagem].posicaoX % imagensDeFundo[imagem].largura
	imagensDeFundo[imagem].textura.setTransform(new DOMMatrix().translate(imagensDeFundo[imagem].posicaoX,posicaoY))
	contexto.fillStyle = imagensDeFundo[imagem].textura
	contexto.fillRect(0, posicaoY, 400, imagensDeFundo[imagem].altura)
}

// Lobo
const lobo = {
	posicaoX: -64,
	posicaoY: 100,
	velocidade: 0,
	velocidadeMaxima: 1000,
	aceleracao: 1200,
	angulo: 0,
	pulo: 400
}

function cicloLobo() {
	// Velocidade e posição Y
	lobo.velocidade = Math.min(lobo.velocidade + lobo.aceleracao * tempoDelta, lobo.velocidadeMaxima)
	lobo.posicaoY = Math.max(-40, Math.min(lobo.posicaoY + lobo.velocidade * tempoDelta, canvas.height + 40))

	// Posição e ângulo jogando
	if (jogando) {
		lobo.angulo += (lobo.velocidade * 0.05 - lobo.angulo) * tempoDelta * 10
		lobo.posicaoX = lobo.posicaoX + (100 - lobo.posicaoX) * tempoDelta
	}

	// Posição e ângulo quando não estiver jogando
	else {
		lobo.angulo -= tempoDelta * 200
		lobo.posicaoX = Math.max(lobo.posicaoX - velocidade * tempoDelta, -64)
	}

	// Bater no chão
	if (jogando && lobo.posicaoY > 380) colisao()

	// Desenhar sprite
	desenharSprite('lobo', lobo.posicaoX, lobo.posicaoY, 80, 80, lobo.angulo)
}

// Colisão
function colisao() {
	somBatida.play()
	jogando = false
	lobo.velocidade = -lobo.pulo
	tempoDeFlash = 1
	setTimeout(() => {
		prontoParaComecar = true
	}, 1000)
}

// Toque na tela
window.addEventListener('mousedown', eventoToque) // Mouse
window.addEventListener('touchstart', eventoToque) // Toque
window.addEventListener('touchend', evento => evento.preventDefault()) // evitar evento de mouse ao tocar na tela
window.addEventListener('keydown', ({code,repeat}) => {if (!repeat && code === 'Space') eventoToque()}) // Barra de espaço

function eventoToque() {
	// Pular
	if (jogando) {
		somPulo.currentTime = 0
		somPulo.play()
		lobo.velocidade = -lobo.pulo
		return
	}
	// Começar jogo
	if (prontoParaComecar) {
		mostrarTitulo = false
		canos.length = 0
		lobo.posicaoX = -40
		lobo.posicaoY = 200
		lobo.angulo = 0
		lobo.velocidade = -lobo.pulo
		prontoParaComecar = false
		jogando = true
		tempoDeFlash = 1
		pontos = 0
		canos.unshift(new Cano(600, Math.random() * 120 + 120, 180))
	}
}

// Canos
const canos = []
class Cano {
	constructor(posicao, altura, abertura) {
		this.posicao = posicao,
		this.altura = altura,
		this.abertura = abertura,
		this.proximoCano = true,
		this.ultrapassado = false,
		this.desenhar = () => {
			desenharSprite('canoBase', this.posicao, this.posicaoCanoDeCima, 64, this.alturaCanoDeCima)
			desenharSprite('canoBase', this.posicao, this.posicaoCanoDeBaixo, 64, this.alturaCanoDeBaixo)
			desenharSprite('canoTopo', this.posicao, this.altura + this.abertura / 2 + 8, 64, 16)
			desenharSprite('canoTopo', this.posicao, this.altura - this.abertura / 2 - 8, 64, -16)
		}
	}
	get alturaCanoDeCima() {
		return this.altura - this.abertura / 2 - 8
	}
	get posicaoCanoDeCima() {
		return this.alturaCanoDeCima / 2
	}
	get alturaCanoDeBaixo() {
		return canvas.height - this.altura - this.abertura / 2 - 8
	}
	get posicaoCanoDeBaixo() {
		return canvas.height - this.alturaCanoDeBaixo / 2
	}
}

function cicloCanos() {
	canos.forEach(cano => {
		// Mudar posição do cano
		cano.posicao -= velocidade * tempoDelta

		// Remover cano quando sair da tela
		if (cano.posicao < -32) canos.pop()

		// Criar próximo cano
		if (jogando && cano.proximoCano && cano.posicao < 200) {
			cano.proximoCano = false
			canos.unshift(new Cano(cano.posicao + 240, Math.random() * 120 + 120, 180))
		}
	
		// Verificar colisão
		if (jogando && Math.abs(cano.posicao - lobo.posicaoX) < 48 && Math.abs(cano.altura - lobo.posicaoY) > cano.abertura / 2 - 40) {
			colisao()
		}

		// Somar pontos
		if (jogando && !cano.ultrapassado && cano.posicao < lobo.posicaoX - 48) {
			somPontos.play()
			cano.ultrapassado = true
			pontos++
		}

		// Desenhar canos
		cano.desenhar()
	})
}

// Variáveis de tempo
let tempoDelta = 0
let tempoAnterior = 0

// Variáveis de jogo
let mostrarTitulo = true
let jogando = false
let prontoParaComecar = true
let velocidade = 160
let tempoDeFlash = 0
let pontos = 0

// Executar ações ao carregar imagens
folhaDeSprites.fonte.addEventListener('load', () => {
	gerarImagemDeFundo('grama',64,32,1)
	gerarImagemDeFundo('cidade',128,80,.2)
	gerarImagemDeFundo('nuvens',256,128,.1)
	window.requestAnimationFrame(frame)
})

// Evitar erros de tempo delta ao mudar de aba/janela
window.addEventListener('visibilitychange', ({timeStamp}) => tempoAnterior = timeStamp)

// Eventos que se repetem a cada frame
function frame(tempoAtual) {
	// Tempo delta (tempo decorrido desde o último frame)
	tempoDelta = (tempoAtual - tempoAnterior) * 0.001
	tempoAnterior = tempoAtual

	// Desenhar céu
	contexto.fillStyle = '#48c'
	contexto.fillRect(0,0,canvas.width,canvas.height)

	// Cidade e nuvens
	desenharImagemDeFundo('nuvens', 240)
	desenharImagemDeFundo('cidade', 310)

	// Canos
	cicloCanos()

	// Grama
	desenharImagemDeFundo('grama', 368)

	// Lobo
	cicloLobo()

	// Texto na tela
	contexto.font = '28px sans-serif';
	contexto.fillStyle = '#efefef'
	contexto.textAlign = 'center'
	if (mostrarTitulo) contexto.fillText('Flappy Lobo', 200, 32)
	else contexto.fillText(pontos, 200, 32)
	if (prontoParaComecar) contexto.fillText('Clique para jogar', 200, 200)

	// Efeito de flash
	if (tempoDeFlash > 0) {
		contexto.fillStyle = `rgba(255,255,255,${tempoDeFlash})`
		contexto.fillRect(0,0,canvas.width,canvas.height)
		tempoDeFlash -= tempoDelta * 2
	}

	// Chamar próximo frame
	window.requestAnimationFrame(frame)
}
