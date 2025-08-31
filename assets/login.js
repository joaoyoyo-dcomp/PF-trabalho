// Seletores parametrizados: recebem um "root" (ex: document) 
// e retornam funções que localizam elementos específicos no DOM.
// Isso evita acoplamento direto com o objeto global "document".
const select = root => ({
  input:  () => root.querySelector('.login__input'),
  button: () => root.querySelector('.login__button'),
  form:   () => root.querySelector('.login-form'),
})

// Valida um valor de entrada
// Retorna "true" se o valor tem ao menos 1 caractere.
const isValid = value => value.length >= 1;

// Descreve o estado de um botão.
const buttonState = valid => valid ? { disabled: false } : { disabled: true };

// Descreve o estado do login.
const loginState = value => isValid(value) ? { player: value } : null;

// Recebe se é válido ou não e retorna atributos do botão
const buttonAttrs = valid => valid ? {} : { disabled: true }

// Gera uma string de HTML descrevendo o botão
// Isso permite separar a "descrição" do botão da manipulação real do DOM
const buttonView = attrs =>
  `<button class="login__button" ${attrs.disabled ? "disabled" : ""}>Jogar</button>`

// Responsável por renderizar o botão no DOM
const renderButton = attrs => {
  const btn = document.querySelector('.login__button')
  btn.outerHTML = buttonView(attrs)  // substitui pelo HTML gerado
}

// Descreve qual "efeito de login" deve acontecer
const loginEffect = state =>
  state ? { type: 'LOGIN', player: state.player, modo: state.modo } : { type: 'NOOP' }

// Para que o sistema funcione (salvar o nome do jogador e mudar de página), essas ações são obrigatórias. Em vez de misturar lógica com efeitos, usamos `loginEffect` (função pura) para apenas DESCREVER o que deve ser feito. Assim, `runEffect` é o único ponto realmente impuro, centralizando todos os efeitos e mantendo o resto do código dentro do paradigma funcional.
const runEffect = effect => {
  if (effect.type === 'LOGIN') {
    localStorage.setItem('player', effect.player)
    window.location = 'pagina/page1.html'
  }
}

// Manipulador de evento: chamado quando o usuário digita no input
const handleInput = event => {
  const attrs = buttonAttrs(isValid(event.target.value))
  renderButton(attrs)
}

// Manipulador de evento: chamado no envio do formulário
const handleSubmit = event => {
  event.preventDefault()
  const effect = loginEffect(loginState(event.target.querySelector('.login__input').value))
  runEffect(effect)
}

// Cria o objeto de seletores a partir do "document"
const dom = select(document)

dom.input().addEventListener('input', handleInput)
dom.form().addEventListener('submit', handleSubmit)
