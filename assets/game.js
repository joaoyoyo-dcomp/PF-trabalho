
const nextRandom = seed => {
  const next = (1664525 * seed + 1013904223) >>> 0;
  return { value: next / 2 ** 32, seed: next };
};

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


const inicializarJogo = (dim, emojis, seed = Date.now() >>> 0) => {
  const total = dim * dim;
  const escolhidos = emojis.slice(0, total / 2);
  const pares = shuffle([...escolhidos, ...escolhidos], seed);

  return {
    cartas: pares.map((e, i) => ({ id: i, emoji: e, revelada: false, combinada: false })),
    primeira: null,
    jogadas: 0,
    vitoria: false,
    bloqueado: false,
    ultimaJogada: null,
    seed
  };
};

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

const proximoEstado = (estado) => {
  if (!estado.ultimaJogada) return estado;
  const cartas = estado.cartas.map((c, i) =>
    estado.ultimaJogada.includes(i) ? { ...c, revelada: false } : c
  );
  return { ...estado, cartas, bloqueado: false, ultimaJogada: null };
};


const view = (estado) => `
  <div class="board" style="grid-template-columns: repeat(${Math.sqrt(estado.cartas.length)}, auto)">
    ${estado.cartas.map(c => `
      <div class="card ${c.combinada ? "matched" : ""} ${c.revelada ? "revealed" : ""}" data-id="${c.id}">
        <div class="card-front"></div>
        <div class="card-back">${c.emoji}</div>
      </div>
    `).join("")}
  </div>
  <p>Jogadas: ${estado.jogadas}</p>
  ${estado.vitoria ? "<p>🎉 Você venceu!</p>" : ""}
`;


const update = (estado, evento) => {
  if (evento.tipo === "flip") {
    return virarCarta(estado, evento.id);
  } else if (evento.tipo === "timeout") {
    return proximoEstado(estado);
  } else {
    return estado;
  }
};
const loop = (estado) => {
  document.getElementById("app").innerHTML = view(estado);

  document.querySelectorAll(".card").forEach(el =>
    el.addEventListener("click", () => {
      const id = parseInt(el.dataset.id, 10);
      const novo = update(estado, { tipo: "flip", id });
      loop(novo);

      if (novo.bloqueado && novo.ultimaJogada) {
        setTimeout(() => loop(update(novo, { tipo: "timeout" })), 800);
      }
    })
  );
};


const emojis = ['🥔', '🍒', '🥑', '🌽', '🥕', '🍇', '🍉', '🍌'];
loop(inicializarJogo(4, emojis));
