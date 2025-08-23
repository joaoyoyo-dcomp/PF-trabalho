// Seletores parametrizados: recebem um "root" (ex: document) 
// e retornam funções que localizam elementos específicos no DOM.
// Isso evita acoplamento direto com o objeto global "document".
const select = root => ({
  input:  () => root.querySelector('.login__input'),
  button: () => root.querySelector('.login__button'),
  form:   () => root.querySelector('.login-form'),
})

// Função pura que valida um valor de entrada.
// Retorna "true" se o valor tem ao menos 1 caractere.
const isValid = value => value.length >= 1;
// Função pura que descreve o estado de um botão.
// Se válido → { disabled: false }, senão → { disabled: true }.
const buttonState = valid => valid ? { disabled: false } : { disabled: true };

// Função pura que descreve o estado do login.
// Se o valor for válido → retorna { player: valor }, senão → null.
const loginState = value => isValid(value) ? { player: value } : null;

// Função pura: recebe se é válido ou não e retorna atributos do botão.
// Exemplo: { disabled: true } caso o input seja inválido.
const buttonAttrs = valid => valid ? {} : { disabled: true }

// Função pura: gera uma string de HTML descrevendo o botão.
// Isso permite separar a "descrição" do botão da manipulação real do DOM.
const buttonView = attrs =>
  `<button class="login__button" ${attrs.disabled ? "disabled" : ""}>Play</button>`
// Função impura responsável por renderizar o botão no DOM.
// No contexto de aplicações web, é necessário que em algum momento as mudanças descritas (HTML do botão) sejam aplicadas no navegador. Ou seja, a interação com o DOM é inevitavelmente imperativa.
// Mantivemos a parte "pura" em `buttonView` (gera HTML como string) e isolamos os efeitos aqui. Isso garante que só um ponto do código é responsável por alterar o DOM, reduzindo a propagação do imperativo.
const renderButton = attrs => {
  const btn = document.querySelector('.login__button')
  btn.outerHTML = buttonView(attrs)  // substitui pelo HTML gerado
}

// Função pura: descreve qual "efeito de login" deve acontecer.
// Se houver estado → { type: 'LOGIN', player: ... }, senão → { type: 'NOOP' }.
const loginEffect = state => 
  state ? { type: 'LOGIN', player: state.player } : { type: 'NOOP' }

// Para que o sistema funcione (salvar o nome do jogador e mudar de página), essas ações são obrigatórias. Em vez de misturar lógica com efeitos, usamos `loginEffect` (função pura) para apenas DESCREVER o que deve ser feito. Assim, `runEffect` é o único ponto realmente impuro, centralizando todos os efeitos e mantendo o resto do código dentro do paradigma funcional.
const runEffect = effect => {
  if (effect.type === 'LOGIN') {
    localStorage.setItem('player', effect.player)
    window.location = 'pagina/page1.html'
  }
}

// Manipulador de evento: chamado quando o usuário digita no input.
// Passos: valida o valor → gera atributos → renderiza botão.
const handleInput = event => {
  const attrs = buttonAttrs(isValid(event.target.value))
  renderButton(attrs)
}

// Manipulador de evento: chamado no envio do formulário.
// Passos: previne recarregamento → cria estado de login → gera efeito → executa efeito.
const handleSubmit = event => {
  event.preventDefault()
  const effect = loginEffect(loginState(event.target.querySelector('.login__input').value))
  runEffect(effect)
}

// Cria o objeto de seletores a partir do "document".
const dom = select(document)
//  Aqui é necessário reagir a cliques, digitação, etc. Isso força o uso de callbacks e, portanto, de efeitos colaterais. Mantivemos as funções chamadas pelos eventos (`handleInput`, `handleSubmit`) o mais puras possível, e concentramos o imperativo somente neste ponto: a "ponte" entre o mundo funcional (descrições) e o navegador (execução real).
dom.input().addEventListener('input', handleInput)
dom.form().addEventListener('submit', handleSubmit)



