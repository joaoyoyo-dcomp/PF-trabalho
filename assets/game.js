// ----------------- Funções utilitárias -----------------

// Gera um número pseudoaleatório e determinístico a partir de uma seed.
const nextRandom = seed => {
  const next = (1664525 * seed + 1013904223) >>> 0;
  return { value: next / 2 ** 32, seed: next };
};

// Embaralha um array usando a seed.
const shuffle = (array, seed = Date.now() >>> 0) => {
  const { mapped } = array.reduce(
    ({ mapped, seed: s }, value) => {
      const { value: r, seed: newSeed } = nextRandom(s);
      return { mapped: [...mapped, { value, sort: r }], seed: newSeed };
    },
    { mapped: [], seed }
  );
  return mapped.sort((a, b) => a.sort - b.sort).map(({ value }) => value);
};

// ----------------- Configuração das Fases -----------------

// Estrutura de dados que separa a configuração das fases da lógica do jogo
const fasesConfig = [
  { dim: [2, 2], emojis: ["🐍", "🐊"] },
  { dim: [4, 2], emojis: ["🦎", "🐉", "🐲", "🐸"] },
  { dim: [4, 4], emojis: ["🐢", "🐊", "🐸", "🦎", "🐍", "🥚", "🌿", "🌊"] },
  { dim: [6, 4], emojis: ["🦖", "🦕", "🐉", "🐲", "🌋", "☄️", "🐢", "🐊", "🐍", "🦎", "🥚", "🦴"] }
];

// ----------------- Inicializa o estado -----------------

// Cria e retorna o estado inicial de uma fase do jogo
const inicializarJogo = (dim, emojis, seed = Date.now() >>> 0) => {
  const [rows, cols] = dim;
  const total = rows * cols;
  const escolhidos = emojis.slice(0, total / 2);
  const pares = shuffle([...escolhidos, ...escolhidos], seed);

  return {
    cartas: pares.map((e, i) => ({ id: i, emoji: e, revelada: false, combinada: false })),
    primeira: null, jogadas: 0, vitoria: false, bloqueado: false, ultimaJogada: null, seed
  };
};

// ----------------- Regras do jogo -----------------

// Recebe um estado e retorna um novo estado após a jogada
const virarCarta = (estado, id) => {
  if (estado.bloqueado || estado.cartas[id].revelada || estado.cartas[id].combinada) return estado;

  const novasCartas = estado.cartas.map((c, i) => i === id ? { ...c, revelada: true } : c);

  if (estado.primeira == null) {
    return { ...estado, cartas: novasCartas, primeira: id };
  }

  const primeiraCarta = novasCartas[estado.primeira];
  if (primeiraCarta.emoji === novasCartas[id].emoji) {
    const combinadas = novasCartas.map((c, i) => i === id || i === estado.primeira ? { ...c, combinada: true } : c);
    return { ...estado, cartas: combinadas, primeira: null, jogadas: estado.jogadas + 1, vitoria: combinadas.every(c => c.combinada) };
  } else {
    return { ...estado, cartas: novasCartas, bloqueado: true, ultimaJogada: { id1: estado.primeira, id2: id }, jogadas: estado.jogadas + 1 };
  }
};

// Retorna um novo estado com as cartas erradas desviradas
const resetarCartas = estado => {
  if (!estado.ultimaJogada) return estado;
  const { id1, id2 } = estado.ultimaJogada;
  const novasCartas = estado.cartas.map((c, i) => i === id1 || i === id2 ? { ...c, revelada: false } : c);
  return { ...estado, cartas: novasCartas, primeira: null, bloqueado: false, ultimaJogada: null };
};

// ----------------- Renderização -----------------

// Função impura que renderiza a interface do usuário com base no estado atual
const render = (estado, fase, config, reiniciarFase) => {
  const app = document.getElementById("app");
  const [rows, cols] = config.dim;

  document.body.className = `fase-${fase}`;
  document.documentElement.style.setProperty("--rows", rows);
  document.documentElement.style.setProperty("--cols", cols);
  
  app.innerHTML = `<h2>Fase ${fase}</h2><div class="tabuleiro">${estado.cartas.map(c => `<div class="carta ${c.revelada ? "revelada" : ""} ${c.combinada ? "combinada" : ""}" data-id="${c.id}"><div class="carta-inner"><div class="carta-front">?</div><div class="carta-back">${c.emoji}</div></div></div>`).join("")}</div>`;

  app.querySelectorAll(".carta").forEach(cartaEl => {
    cartaEl.addEventListener("click", () => {
      const novoEstado = virarCarta(estado, parseInt(cartaEl.dataset.id));
      render(novoEstado, fase, config, reiniciarFase);

      if (novoEstado.bloqueado) setTimeout(() => render(resetarCartas(novoEstado), fase, config, reiniciarFase), 800);
      if (novoEstado.vitoria) setTimeout(() => reiniciarFase(), 1500);
    });
  });
};

// ----------------- Controle de fases -----------------

// Variável que controla a fase atual do jogo
let faseAtual = 0;

// Monta a inicialização de cada fase, criando o estado e renderizando a tela
const iniciarFase = () => {
  if (faseAtual >= fasesConfig.length) {
    document.getElementById("app").innerHTML = `<h2>Parabéns! Você completou todas as fases 🎉</h2>`;
    document.body.className = `vitoria-final`;
    return;
  }

  const config = fasesConfig[faseAtual];
  const estado = inicializarJogo(config.dim, config.emojis);
  
  render(estado, faseAtual + 1, config, () => {
    faseAtual++;
    iniciarFase();
  });
};

// Início do jogo quando a página carrega
window.onload = () => {
  iniciarFase();
};
