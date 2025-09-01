// Seletores parametrizados
const select = root => ({
  input:  () => root.querySelector('.login__input'),
  button: () => root.querySelector('.login__button'),
  form:   () => root.querySelector('.login-form'),
  // Novo seletor para os modos de jogo
  modo:   () => root.querySelector('input[name="modo"]:checked'),
});

// Valida um valor de entrada (pelo menos 3 caracteres)
const isValid = value => value.length > 0;

// Descreve o estado do login com base nos valores do formulário
const getLoginState = (formElement) => {
  const dom = select(formElement);
  const playerName = dom.input().value;
  const gameMode = dom.modo().value; // Captura o valor do modo (ex: "dificil")

  if (isValid(playerName)) {
    return { player: playerName, modo: gameMode };
  }
  return null;
};

// Descreve os atributos do botão com base na validade
const getButtonAttrs = (valid) => (valid ? {} : { disabled: true });

// Gera a string de HTML para o botão
const buttonView = (attrs) =>
  `<button type="submit" class="login__button" ${attrs.disabled ? "disabled" : ""}>Jogar</button>`;

// Renderiza (substitui) o botão no DOM
const renderButton = (attrs) => {
  const btn = document.querySelector('.login__button');
  if (btn) {
    btn.outerHTML = buttonView(attrs);
  }
};

// Descreve o efeito colateral que deve acontecer
const getLoginEffect = (state) =>
  state ? { type: 'LOGIN', player: state.player, modo: state.modo } : { type: 'NOOP' };

// Executa o efeito colateral (único ponto impuro)
const runEffect = (effect) => {
  if (effect.type === 'LOGIN') {
    localStorage.setItem('player', effect.player);
    localStorage.setItem('modo', effect.modo); 
    window.location.href = 'pagina/page1.html'; // Usar href para maior compatibilidade
  }
};

// --- Manipuladores de Eventos ---

const handleInput = (event) => {
  const valid = isValid(event.target.value);
  const attrs = getButtonAttrs(valid);
  renderButton(attrs);
};

const handleSubmit = (event) => {
  event.preventDefault();
  const state = getLoginState(event.target);
  const effect = getLoginEffect(state);
  runEffect(effect);
};

// --- Inicialização ---
const dom = select(document);
dom.input().addEventListener('input', handleInput);
dom.form().addEventListener('submit', handleSubmit);
