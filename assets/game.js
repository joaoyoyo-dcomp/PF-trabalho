// ----------------- Funções utilitárias -----------------

// Gera um número pseudoaleatório e determinístico a partir de uma seed.
const nextRandom = seed => {
  const next = (1664525 * seed + 1013904223) >>> 0;
  return { value: next / 2 ** 32, seed: next };
};
// Embaralha um array de forma pseudoaleatória (puro, pois só depende da entrada)
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

// ----------------- Configuração de fases -----------------
// Estrutura de dados que separa a configuração das fases da lógica do jogo
const fasesConfig = [
  { dim: [2, 2], emojis: ["🐍", "🐊"] },
  { dim: [2, 4], emojis: ["🦎", "🐉", "🐲", "🐸"] },
  { dim: [4, 4], emojis: ["🐢", "🐊", "🐸", "🦎", "🐍", "🥚", "🌿", "🌊"] },
  { dim: [4, 6], emojis: ["🦖", "🦕", "🐉", "🐲", "🌋", "☄️", "🐢", "🐊", "🐍", "🦎", "🥚", "🦴"] }
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
    primeira: null,
    jogadas: 0,
    vitoria: false,
    bloqueado: false,
    ultimaJogada: null,
    seed,
    dim
  };
};

// Cria o estado global inicial do jogo
const criarEstadoInicial = () => ({
  faseAtual: 0,
  atual: inicializarJogo(fasesConfig[0].dim, fasesConfig[0].emojis),
  historico: [],
  player: localStorage.getItem("player") || "Jogador",
  totalJogadas: 0,
  totalAcertos: 0
});

// ----------------- Regras do jogo -----------------

// Vira uma carta e retorna o novo estado
const virarCarta = (estado, id) => {
  if (estado.bloqueado) return estado;
  const carta = estado.cartas[id];
  if (carta.revelada || carta.combinada) return estado;

  const cartas = estado.cartas.map((c, i) =>
    i === id ? { ...c, revelada: true } : c
  );

  if (estado.primeira === null) {
    return { ...estado, cartas, primeira: id };
  }

  const primeira = estado.primeira;
  const segunda = id;
  const combinou = cartas[primeira].emoji === cartas[segunda].emoji;

  if (combinou) {
    const cartas2 = cartas.map((c, i) =>
      i === primeira || i === segunda ? { ...c, combinada: true } : c
    );
    return {
      ...estado,
      cartas: cartas2,
      primeira: null,
      jogadas: estado.jogadas + 1,
      vitoria: cartas2.every(c => c.combinada)
    };
  } else {
    return {
      ...estado,
      cartas,
      primeira: null,
      jogadas: estado.jogadas + 1,
      bloqueado: true,
      ultimaJogada: [primeira, segunda]
    };
  }
};

// Desvira as cartas erradas
const resetarCartas = estado => {
  if (!estado.ultimaJogada) return estado;
  const cartas = estado.cartas.map((c, i) =>
    estado.ultimaJogada.includes(i) ? { ...c, revelada: false } : c
  );
  return { ...estado, cartas, bloqueado: false, ultimaJogada: null };
};

// ----------------- Update -----------------

// Função pura de transição de estados baseada em eventos
const update = (estado, evento) => {
  const jogo = estado.atual;

  if (evento.tipo === "flip") {
    const novoJogo = virarCarta(jogo, evento.id);

    // calcula se houve jogada nova
    const jogadasGlobais =
      estado.totalJogadas + (novoJogo.jogadas > jogo.jogadas ? 1 : 0);

    // calcula se houve novo acerto
    const acertosAntes = jogo.cartas.filter(c => c.combinada).length;
    const acertosDepois = novoJogo.cartas.filter(c => c.combinada).length;
    const acertosGlobais = estado.totalAcertos + (acertosDepois > acertosAntes ? 1 : 0);

    // --- Vitória da fase ---
    if (novoJogo.vitoria) {
      const proxFase = estado.faseAtual + 1;

      if (proxFase < fasesConfig.length) {
        // avança para próxima fase
        return {
          ...estado,
          faseAtual: proxFase,
          historico: [...estado.historico, novoJogo],
          atual: inicializarJogo(fasesConfig[proxFase].dim, fasesConfig[proxFase].emojis),
          totalJogadas: jogadasGlobais,
          totalAcertos: acertosGlobais
        };
      } else {
        // fim do jogo
        return {
          ...estado,
          historico: [...estado.historico, { ...novoJogo, fim: true }],
          atual: { ...novoJogo, fim: true },
          faseAtual: proxFase,
          totalJogadas: jogadasGlobais,
          totalAcertos: acertosGlobais
        };
      }
    }

    // caso normal (sem vitória ainda)
    return {
      ...estado,
      atual: novoJogo,
      totalJogadas: jogadasGlobais,
      totalAcertos: acertosGlobais
    };
  }

  // --- Evento: timeout (resetar cartas erradas) ---
  if (evento.tipo === "timeout") {
    return { ...estado, atual: resetarCartas(jogo) };
  }

  // caso padrão
  return estado;
};

// ----------------- View -----------------

// Gera o HTML a partir do estado 
const view = (estado) => {
  const jogo = estado.atual;

  if (jogo.fim) {
  const player = localStorage.getItem('player') || "Jogador";
  return `
    <h2>🎉 Parabéns, ${player}! Você completou todas as fases! 🏆</h2>
    <p>Total de jogadas: ${estado.totalJogadas}</p>
    <p>Total de acertos: ${estado.totalAcertos}</p>
  `;
}

  return `
    <h2>Fase ${estado.faseAtual + 1}</h2>
  <div class="status">
    <p>Jogadas da fase: ${jogo.jogadas}</p>
    <p>Jogadas totais: ${estado.totalJogadas}</p>
    <p>Acertos totais: ${estado.totalAcertos}</p> </div>
    <div class="tabuleiro">
      ${jogo.cartas.map(c => `
        <div class="carta ${c.revelada ? "revelada" : ""} ${c.combinada ? "combinada" : ""}" data-id="${c.id}">
          <div class="carta-inner">
            <div class="carta-front">?</div>
            <div class="carta-back">${c.emoji}</div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
};

// ----------------- Funções impuras -----------------

// Aplica estilos no DOM -> IMPURA (manipula o ambiente externo, não só entrada/saída)
const aplicarEstiloFase = (estado) => {
  const [rows, cols] = estado.atual.dim;
  document.body.className = `fase-${estado.faseAtual + 1}`;
  document.documentElement.style.setProperty("--rows", rows);
  document.documentElement.style.setProperty("--cols", cols);
  document.documentElement.style.setProperty("--gap-size", "15px");
};


// Loop principal do jogo -> IMPURA (renderiza no DOM e captura eventos do usuário)
const loop = (estado) => {
  const app = document.getElementById("app");
  app.innerHTML = view(estado);
  aplicarEstiloFase(estado);

  const jogo = estado.atual;

  if (jogo.bloqueado) {
    document.body.classList.add("bloqueado");
  } else {
    document.body.classList.remove("bloqueado");
  }

  if (jogo.fim) {
    document.body.className = "vitoria-final";
    return;
  }
  // evento de clique -> interação com usuário é sempre impura
  app.onclick = (e) => {
    const cartaEl = e.target.closest(".carta");
    if (!cartaEl) return;

    const id = parseInt(cartaEl.dataset.id, 10);
    const novo = update(estado, { tipo: "flip", id });
    loop(novo);

    if (novo.atual.bloqueado && novo.atual.ultimaJogada) {
      setTimeout(() => {
        loop(update(novo, { tipo: "timeout" }));
      }, 800);
    }
  };
};



// ----------------- Início -----------------
  loop(criarEstadoInicial());
