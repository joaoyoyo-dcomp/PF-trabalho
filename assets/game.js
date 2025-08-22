const getBoardContainer = () => document.querySelector('.board-container')
const getBoard          = () => document.querySelector('.board')
const getMoves          = () => document.querySelector('.moves')
const getTimer          = () => document.querySelector('.timer')
const getStartButton    = () => document.querySelector('button')
const getWin            = () => document.querySelector('.win')

const state = {
    gameStarted: false,
    flippedCards: 0,
    totalFlips: 0,
    totalTime: 0,
    loop: null
}

const nextRandom = seed => {
  const next = (1664525 * seed + 1013904223) >>> 0;
  return { value: next / 2 ** 32, seed: next };
};

const shuffle = (array, seed = (Date.now() >>> 0)) => {
  const { mapped } = array.reduce(
    ({ mapped, seed: s }, value) => {
      const { value: r, seed: newSeed } = nextRandom(s);
      return { mapped: [...mapped, { value, sort: r }], seed: newSeed };
    },
    { mapped: [], seed }
  );
  return mapped.sort((a, b) => a.sort - b.sort).map(({ value }) => value);
};

const pickRandom = (array, items, seed = (Date.now() >>> 0)) => {
  const n = Math.min(Math.max(items | 0, 0), array.length);

  const { picks } = Array.from({ length: n }).reduce(
    ({ picks, pool, seed: s }) => {
      const { value: r, seed: newSeed } = nextRandom(s);
      const idx = Math.floor(r * pool.length);
      const chosen = pool[idx];
      const newPool = pool.filter((_, i) => i !== idx);

      return {
        picks: [...picks, chosen],
        pool: newPool,
        seed: newSeed
      };
    },
    { picks: [], pool: [...array], seed }
  );

  return picks;
}

const generateGame = () => {
    const dimensions = getBoard().getAttribute('data-dimension')


    if (dimensions % 2 !== 0) {
        throw new Error("The dimension of the board must be an even number.")
    }

    const emojis = ['🥔', '🍒', '🥑', '🌽', '🥕', '🍇', '🍉', '🍌', '🥭', '🍍']
    const picks = pickRandom(emojis, (dimensions * dimensions) / 2) 
    const items = shuffle([...picks, ...picks])
    const cards = `
        <div class="board" style="grid-template-columns: repeat(${dimensions}, auto)">
            ${items.map(item => `
              <div class="card">
    <input type="checkbox" />
    <div class="card-front"></div>
    <div class="card-back">${item}</div>
</div>

            `).join('')}
       </div>
    `
    
    const parser = new DOMParser().parseFromString(cards, 'text/html')
    getBoard().replaceWith(parser.querySelector('.board'))
}

const startGame = () => {
    state.gameStarted = true
    getStartButton().classList.add('disabled')

    state.loop = setInterval(() => {
        state.totalTime++

        getMoves().innerText = `${state.totalFlips} moves`
        getTimer().innerText = `time: ${state.totalTime} sec`
    }, 1000)
}
const flipBackCards = () => {
    document.querySelectorAll('.card:not(.matched) input').forEach(input => {
        input.checked = false
    })
    state.flippedCards = 0
}

const flipCard = card => {
     // Se já existem 2 cartas viradas, não vira mais nenhuma
    if (state.flippedCards >= 2) return 
    const input = card.querySelector('input')
    if (input.checked) return // impede virar a mesma carta duas vezes
    input.checked = true   // agora só o JS controla isso

    state.flippedCards++
    state.totalFlips++

    if (!state.gameStarted) {
        startGame()
    }

    if (state.flippedCards === 2) {
        const flippedInputs = document.querySelectorAll('.card:not(.matched) input:checked')
        const flippedCards = Array.from(flippedInputs).map(input => input.parentElement)

        const value1 = flippedCards[0].querySelector('.card-back').innerText
        const value2 = flippedCards[1].querySelector('.card-back').innerText

if (value1 === value2) {
    flippedCards[0].classList.add('matched')
    flippedCards[1].classList.add('matched')
}

        setTimeout(() => {
            flipBackCards()
        }, 1000)
    }

    // verificar vitória
    if (!document.querySelectorAll('.card input:not(:checked)').length) {
        setTimeout(() => {
            getBoardContainer().classList.add('flipped')
            getWin().innerHTML =
            `
                <span class="win-text">
                    Você ganhou!<br />
                    com <span class="highlight">${state.totalFlips}</span> movimentos<br />
                    em <span class="highlight">${state.totalTime}</span> segundos
                </span>
            `
            clearInterval(state.loop)
        }, 1000)
    }
    }


const attachEventListeners = () => {
    document.addEventListener('click', event => {
        const card = event.target.closest('.card')
        
        if (card && !card.classList.contains('matched')) {
            flipCard(card)
        } else if (event.target.nodeName === 'BUTTON' && !event.target.classList.contains('disabled')) {
            startGame()
        }
    })
}


generateGame()
attachEventListeners()
