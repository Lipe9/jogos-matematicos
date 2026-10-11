/* memoria.js - pares: conta x resultado */
(function(){
  const NIV = { facil: { nome: 'Fácil', pares: 6, cols: 4 }, medio: { nome: 'Médio', pares: 8, cols: 4 }, dificil: { nome: 'Difícil', pares: 10, cols: 5 } };
  let root, diff = 'facil', t = null, st;

  function expr(res){
    const f = [];
    for (let a = 2; a <= 12; a++) if (res % a === 0 && res / a >= 2 && res / a <= 12) f.push(`${a} × ${res / a}`);
    if (f.length && Math.random() < .6) return pick(f);
    const a = rnd(1, res - 1); return Math.random() < .5 ? `${a} + ${res - a}` : `${res + a} − ${a}`;
  }

  function tela(){
    clearInterval(t);
    root.innerHTML = `
      <div class="panel center narrow">
        <h3>Encontre cada conta e seu resultado</h3>
        <p class="muted">Vire duas cartas: se a conta bater com o resultado, o par é formado.</p>
        <div class="chips">${Object.entries(NIV).map(([k, v]) => `<button class="chip ${k === diff ? 'active' : ''}" data-d="${k}">${v.nome}</button>`).join('')}</div>
        <p class="best" id="mm-best"></p>
        <button class="btn big" id="mm-start">Começar</button>
      </div>`;
    $$('.chip', root).forEach(b => b.onclick = () => { diff = b.dataset.d; tela(); });
    const r = getRecorde('memoria-' + diff);
    $('#mm-best').textContent = r !== null ? `🏆 Menos jogadas: ${r}` : '';
    $('#mm-start').onclick = jogar;
  }

  function jogar(){
    const n = NIV[diff];
    const res = shuffle(Array.from({ length: 40 }, (_, i) => i + 6)).slice(0, n.pares);
    const cards = shuffle(res.flatMap(r => [{ k: r, txt: expr(r), kind: 'e' }, { k: r, txt: String(r), kind: 'r' }]));
    st = { cards, open: [], found: 0, moves: 0, time: 0, lock: false, n };
    root.innerHTML = `
      <div class="panel">
        <div class="hud"><div class="stat"><small>Jogadas</small><b id="mm-moves">0</b></div><div class="stat"><small>Tempo</small><b id="mm-time">00:00</b></div><div class="stat"><small>Pares</small><b id="mm-found">0/${n.pares}</b></div></div>
        <div class="mem-grid" style="--cols:${n.cols}">${cards.map((c, i) => `<button class="mem-card" data-i="${i}"><span class="front">?</span><span class="back ${c.kind}">${c.txt}</span></button>`).join('')}</div>
      </div>`;
    $$('.mem-card', root).forEach(b => b.onclick = () => virar(+b.dataset.i, b));
    clearInterval(t); t = setInterval(() => { st.time++; $('#mm-time').textContent = fmtTime(st.time); }, 1000);
  }

  function virar(i, b){
    if (st.lock || b.classList.contains('flipped') || b.classList.contains('done')) return;
    b.classList.add('flipped'); st.open.push(i); playSound('flip');
    if (st.open.length < 2) return;
    st.moves++; $('#mm-moves').textContent = st.moves;
    const [a, c] = st.open.map(x => st.cards[x]);
    const els = st.open.map(x => $(`.mem-card[data-i="${x}"]`, root));
    st.open = [];
    if (a.k === c.k && a.kind !== c.kind){
      els.forEach(e => e.classList.add('done')); st.found++; playSound('ok');
      $('#mm-found').textContent = `${st.found}/${st.n.pares}`;
      if (st.found === st.n.pares) setTimeout(fim, 500);
    } else {
      st.lock = true;
      setTimeout(() => { els.forEach(e => e.classList.remove('flipped')); st.lock = false; }, 800);
    }
  }

  function fim(){
    clearInterval(t); playSound('win');
    const nr = recorde('memoria-' + diff, st.moves, false);
    modal({ title: '🧠 Memória perfeita!', html: `<p>${st.moves} jogadas em ${fmtTime(st.time)}.</p>${nr ? '<p class="gold">🏆 Novo recorde!</p>' : ''}`, buttons: [{ text: 'Jogar de novo', onClick: jogar }, { text: 'Menu', cls: 'ghost', onClick: tela }] });
  }

  registerGame({
    id: 'memoria', nome: 'Memória Matemática', icon: '🧠', cor: '#22d3a5', tag: 'Memória',
    desc: 'Combine cada operação com o seu resultado no menor número de jogadas.',
    recordeKeys: [{ key: 'memoria-facil', label: 'Fácil', fmt: v => v + ' jogadas' }],
    mount(el){ root = el; tela(); },
    unmount(){ clearInterval(t); }
  });
})();

