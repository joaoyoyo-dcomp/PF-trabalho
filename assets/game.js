// ----------------- Funções utilitárias -----------------

// Gera um número pseudoaleatório e determinístico a partir de uma seed
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
const criarEstadoInicial = () => {
    const modoSalvo = localStorage.getItem("modo");
const modo = (modoSalvo === "dificil" || modoSalvo === "normal") ? modoSalvo : "normal";
return {
  faseAtual: 0,
  atual: inicializarJogo(fasesConfig[0].dim, fasesConfig[0].emojis),
  historico: [],
  player: localStorage.getItem("player") || "Jogador",
  totalJogadas: 0,
  totalAcertos: 0,
  modo,
    tempo: modo === "dificil" ? 60 : null,
  fim: false
}};

// ----------------- Regras do jogo -----------------

//função que permite o timer
const tick = (estado) => {
  if (estado.modo !== "dificil" || estado.tempo === null) return estado;

  const novoTempo = estado.tempo - 1;
  return {
    ...estado,
    tempo: novoTempo,
    fim: novoTempo <= 0 ? true : estado.fim // derrota se tempo chegar a zero
  };
};

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

  if (evento.tipo === "tick") {
  return tick(estado);
}
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
  primeira: novoJogo.primeira,
  bloqueado: novoJogo.bloqueado,
  ultimaJogada: novoJogo.ultimaJogada,
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

  if (jogo.fim || estado.fim) {
    return `
      <h2>${estado.fim && estado.tempo <= 0 
        ? "⏰ Tempo esgotado! Fim de jogo!" 
        : `🎉 Parabéns, ${estado.player}!`}</h2>
      <p>Total de jogadas: ${estado.totalJogadas}</p>
      <p>Total de acertos: ${estado.totalAcertos}</p>
      ${estado.modo === "dificil" ? `<p>Tempo restante: ${Math.max(estado.tempo,0)}s</p>` : ""}
    `;
  }

  return `
    <h2>Fase ${estado.faseAtual + 1}</h2>
    ${estado.modo === "dificil" ? `<p class="contador-tempo">⏱ ${estado.tempo}s</p>` : ""}
    <div class="status">
      <p>Jogadas da fase: ${jogo.jogadas}</p>
      <p>Jogadas totais: ${estado.totalJogadas}</p>
      <p>Acertos totais: ${estado.totalAcertos}</p>
    </div>
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


//função que aplica o timer
// ----------------- Funções impuras -----------------

// Isso é crucial para que os timers e os cliques sempre usem a versão mais recente do estado
let estadoAtual;

// Função central para despachar eventos, atualizar o estado e redesenhar a tela
const dispatch = (evento) => {
  // 1. Calcula o novo estado usando a função pura 'update'
  const novoEstado = update(estadoAtual, evento);

  // 2. Atualiza a referência mutável para o novo estado
  estadoAtual = novoEstado;

  // 3. Renderiza a nova interface com base no novo estado
  loop(estadoAtual);

  // 4. Se o último movimento foi um par incorreto, agenda o desvirar das cartas
  if (estadoAtual.atual.ultimaJogada) {
    setTimeout(() => {
      // Dispara um novo evento para resetar as cartas
      dispatch({ tipo: 'timeout' });
    }, 800); // 800ms para o jogador ver as cartas antes de virarem
  }
};

// Loop principal de renderização. Apenas lê o estado e atualiza o DOM
const loop = (estado) => {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = view(estado);
  aplicarEstiloFase(estado);

  const jogo = estado.atual;

  if (jogo.bloqueado) {
    document.body.classList.add('bloqueado');
  } else {
    document.body.classList.remove('bloqueado');
  }

  // Se o jogo terminou (por vitória ou tempo), aplica a classe final
  if (jogo.fim || estado.fim) {
    document.body.className = 'vitoria-final';
  }
};

// Aplica estilos no DOM com base na fase atual
const aplicarEstiloFase = (estado) => {
  const [rows, cols] = estado.atual.dim;

  // Previne erro caso o jogo já tenha terminado
  if (!estado.fim && !estado.atual.fim) {
      document.body.className = `fase-${estado.faseAtual + 1}`;
  }
  document.documentElement.style.setProperty('--rows', rows);
  document.documentElement.style.setProperty('--cols', cols);
};

// Função de inicialização do jogo
const start = (estadoInicial) => {
  estadoAtual = estadoInicial;

  // Se o modo for 'dificil', iniciamos um intervalo de 1 segundo
  if (estadoAtual.modo === 'dificil') {
    const timerInterval = setInterval(() => {
      // Se o jogo acabou (por vitória ou derrota), paramos o timer
      if (estadoAtual.fim || estadoAtual.atual.fim) {
        clearInterval(timerInterval);
        return;
      }
      // A cada segundo, despacha o evento 'tick'
      dispatch({ tipo: 'tick' });
    }, 1000); // 1000ms = 1 segundo
  }

  // Adiciona um listener de cliques ao container do app (delegação de eventos)
  const appElement = document.getElementById('app');
  appElement.addEventListener('click', (e) => {
    // Encontra o elemento de carta mais próximo do clique
    const carta = e.target.closest('.carta');

    if (carta && !estadoAtual.atual.bloqueado && !estadoAtual.fim) {
      const id = parseInt(carta.dataset.id, 10);
      if (!isNaN(id)) {
        dispatch({ tipo: 'flip', id });
      }
    }
  });

  // Renderiza o estado inicial pela primeira vez
  loop(estadoAtual);
};

// ----------------- Início -----------------
window.onload = () => {
  // Inicia o jogo com o estado inicial criado
  start(criarEstadoInicial());
};
