/* sudoku.js - Sudoku completo (estilo app): notas, dicas, desfazer, limite de erros, pausa, salvamento */
(function(){
  const DIFF = {
    facil:   { nome: 'Fácil',   clues: 42 },
    medio:   { nome: 'Médio',   clues: 34 },
    dificil: { nome: 'Difícil', clues: 29 },
    expert:  { nome: 'Expert',  clues: 24 }
  };
  const MAXERR = 3, MAXHINT = 3;
  let S = null, root = null, timer = null, keyH = null;

  const boxOf = i => ((i / 27) | 0) * 3 + (((i % 9) / 3) | 0);
  const pop = m => { let n = 0; while (m){ m &= m - 1; n++; } return n; };
  const peers = (a, b) => a !== b && (((a / 9) | 0) === ((b / 9) | 0) || a % 9 === b % 9 || boxOf(a) === boxOf(b));

  /* busca com MRV: conta soluções (até limit) ou preenche aleatoriamente */
  function search(g, limit, random){
    const r = Array(9).fill(0), c = Array(9).fill(0), b = Array(9).fill(0);
    for (let i = 0; i < 81; i++) if (g[i]){ const m = 1 << g[i]; r[(i / 9) | 0] |= m; c[i % 9] |= m; b[boxOf(i)] |= m; }
    let count = 0;
    function rec(){
      let best = -1, bm = 0, bn = 10;
      for (let i = 0; i < 81; i++){
        if (g[i]) continue;
        const m = ~(r[(i / 9) | 0] | c[i % 9] | b[boxOf(i)]) & 0x3FE, n = pop(m);
        if (n < bn){ bn = n; best = i; bm = m; if (n <= 1) break; }
      }
      if (best < 0){ count++; return count >= limit; }
      if (bn === 0) return false;
      const ds = []; for (let d = 1; d <= 9; d++) if (bm & (1 << d)) ds.push(d);
      if (random) shuffle(ds);
      const ri = (best / 9) | 0, ci = best % 9, bi = boxOf(best);
      for (const d of ds){
        const m = 1 << d; g[best] = d; r[ri] |= m; c[ci] |= m; b[bi] |= m;
        if (rec()) return true;
        r[ri] &= ~m; c[ci] &= ~m; b[bi] &= ~m; g[best] = 0;
      }
      return false;
    }
    rec();
    return count;
  }

  function generate(clues){
    const sol = Array(81).fill(0); search(sol, 1, true);
    const p = sol.slice(); let left = 81;
    for (const i of shuffle([...Array(81).keys()])){
      if (left <= clues) break;
      const v = p[i]; p[i] = 0;
      if (search(p.slice(), 2, false) !== 1) p[i] = v; else left--;
    }
    return { puzzle: p, solution: sol };
  }

  function novo(diff){
    const { puzzle, solution } = generate(DIFF[diff].clues);
    S = { diff, puzzle, solution, grid: puzzle.slice(), notes: Array(81).fill(0), sel: -1, notesMode: false, errors: 0, hints: MAXHINT, time: 0, history: [], over: false, won: false, paused: false };
    salvar();
  }
  const salvar = () => { if (S && !S.over && !S.won) store.set('sudoku', S); else store.del('sudoku'); };
  const correto = i => S.grid[i] === S.solution[i];

  function mount(el){
    root = el;
    const saved = store.get('sudoku', null);
    if (saved && saved.grid) { S = saved; S.paused = false; } else novo(store.get('sudoku-diff', 'facil'));
    el.innerHTML = `
      <div class="sdk">
        <div class="sdk-main">
          <div class="chips" id="sdk-diff">${Object.entries(DIFF).map(([k, v]) => `<button class="chip" data-d="${k}">${v.nome}</button>`).join('')}</div>
          <div class="sdk-info">
            <span>Erros <b id="sdk-err"></b></span>
            <span class="sdk-timer">⏱ <b id="sdk-time">00:00</b></span>
            <button class="icon-btn sm" id="sdk-pause" title="Pausar">⏸</button>
          </div>
          <div class="sdk-board-wrap">
            <div class="sdk-board" id="sdk-board"></div>
            <div class="sdk-pause hidden" id="sdk-pauseov"><p>Jogo pausado</p><button class="btn" id="sdk-resume">Continuar</button></div>
          </div>
        </div>
        <div class="sdk-side">
          <div class="sdk-tools">
            <button class="tool" data-t="undo"><span>↶</span>Desfazer</button>
            <button class="tool" data-t="erase"><span>⌫</span>Apagar</button>
            <button class="tool" data-t="notes"><span>✎</span>Notas <i id="sdk-notes-state">off</i></button>
            <button class="tool" data-t="hint"><span>💡</span>Dica <i id="sdk-hint-n"></i></button>
          </div>
          <div class="sdk-pad" id="sdk-pad"></div>
          <div class="sdk-actions">
            <button class="btn ghost" id="sdk-auto">Notas automáticas</button>
            <button class="btn" id="sdk-new">Novo jogo</button>
          </div>
          <p class="sdk-best" id="sdk-best"></p>
        </div>
      </div>`;

    $('#sdk-board').onclick = e => {
      const c = e.target.closest('.cell'); if (!c || S.paused) return;
      S.sel = +c.dataset.i; render(); playSound('tap');
    };
    $('#sdk-pad').onclick = e => { const b = e.target.closest('button'); if (b) place(+b.dataset.n); };
    $$('.tool', el).forEach(b => b.onclick = () => tool(b.dataset.t));
    $$('#sdk-diff .chip').forEach(b => b.onclick = () => confirmarNovo(b.dataset.d));
    $('#sdk-new').onclick = () => confirmarNovo(S.diff);
    $('#sdk-auto').onclick = autoNotas;
    $('#sdk-pause').onclick = () => setPause(!S.paused);
    $('#sdk-resume').onclick = () => setPause(false);

    keyH = e => {
      if (e.ctrlKey && e.key.toLowerCase() === 'z'){ e.preventDefault(); return tool('undo'); }
      if (/^[1-9]$/.test(e.key)) return place(+e.key);
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') return tool('erase');
      if (e.key.toLowerCase() === 'n') return tool('notes');
      if (e.key.toLowerCase() === 'h') return tool('hint');
      const mv = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (mv){
        e.preventDefault(); if (S.sel < 0) S.sel = 40;
        else {
          const x = S.sel % 9 + (mv === -1 ? -1 : mv === 1 ? 1 : 0), y = ((S.sel / 9) | 0) + (mv === -9 ? -1 : mv === 9 ? 1 : 0);
          if (x >= 0 && x < 9 && y >= 0 && y < 9) S.sel = y * 9 + x;
        }
        render();
      }
    };
    document.addEventListener('keydown', keyH);
    timer = setInterval(() => { if (!S.paused && !S.over && !S.won){ S.time++; $('#sdk-time').textContent = fmtTime(S.time); if (S.time % 5 === 0) salvar(); } }, 1000);
    document.addEventListener('visibilitychange', visH);
    render();
    if (S.over) fimDeJogo();
  }
  const visH = () => { if (document.hidden && S && !S.over && !S.won) setPause(true); };

  function unmount(){
    clearInterval(timer); document.removeEventListener('keydown', keyH); document.removeEventListener('visibilitychange', visH);
    if (S) salvar(); S = null; root = null;
  }

  function setPause(p){
    if (S.over || S.won) return;
    S.paused = p; $('#sdk-pauseov').classList.toggle('hidden', !p); $('#sdk-board').classList.toggle('blur', p);
    $('#sdk-pause').textContent = p ? '▶' : '⏸';
  }

  function confirmarNovo(diff){
    const rodando = !S.over && !S.won && S.grid.some((v, i) => v && !S.puzzle[i]);
    const go = () => { store.set('sudoku-diff', diff); novo(diff); setPause(false); $('#sdk-pauseov').classList.add('hidden'); render(); };
    if (rodando) modal({ title: 'Novo jogo?', html: `<p>O progresso atual será perdido. Iniciar um jogo <b>${DIFF[diff].nome}</b>?</p>`, buttons: [{ text: 'Cancelar', cls: 'ghost' }, { text: 'Iniciar', onClick: go }] });
    else { go(); }
  }

  function push(){ S.history.push({ grid: S.grid.slice(), notes: S.notes.slice() }); if (S.history.length > 200) S.history.shift(); }

  function place(d){
    if (!S || S.paused || S.over || S.won || S.sel < 0) return;
    const i = S.sel;
    if (S.puzzle[i] || correto(i)) return;
    if (S.notesMode){
      if (S.grid[i]) return;
      push(); S.notes[i] ^= (1 << d); playSound('tap');
    } else {
      push(); S.grid[i] = d; S.notes[i] = 0;
      if (d !== S.solution[i]){
        S.errors++; playSound('bad');
        if (S.errors >= MAXERR){ S.over = true; render(); salvar(); return fimDeJogo(); }
      } else {
        playSound('ok');
        for (let j = 0; j < 81; j++) if (peers(i, j)) S.notes[j] &= ~(1 << d);
      }
    }
    render(); salvar(); checarVitoria();
  }

  function tool(t){
    if (!S || S.paused || S.over || S.won) return;
    if (t === 'undo'){
      const h = S.history.pop(); if (!h) return notify('Nada para desfazer');
      S.grid = h.grid; S.notes = h.notes; playSound('tap');
    } else if (t === 'erase'){
      const i = S.sel; if (i < 0 || S.puzzle[i] || correto(i) || (!S.grid[i] && !S.notes[i])) return;
      push(); S.grid[i] = 0; S.notes[i] = 0;
    } else if (t === 'notes'){ S.notesMode = !S.notesMode; }
    else if (t === 'hint'){
      if (S.hints <= 0) return notify('Sem dicas restantes', 'error');
      let i = S.sel;
      if (i < 0 || correto(i)){
        const vazias = [...Array(81).keys()].filter(k => !correto(k));
        if (!vazias.length) return; i = pick(vazias);
      }
      push(); S.hints--; S.sel = i; S.grid[i] = S.solution[i]; S.notes[i] = 0;
      for (let j = 0; j < 81; j++) if (peers(i, j)) S.notes[j] &= ~(1 << S.solution[i]);
      playSound('ok');
    }
    render(); salvar(); checarVitoria();
  }

  function autoNotas(){
    if (!S || S.paused || S.over || S.won) return;
    push();
    for (let i = 0; i < 81; i++){
      if (S.grid[i]) { S.notes[i] = 0; continue; }
      let m = 0;
      for (let d = 1; d <= 9; d++){
        let ok = true;
        for (let j = 0; j < 81 && ok; j++) if (peers(i, j) && correto(j) && S.grid[j] === d) ok = false;
        if (ok) m |= 1 << d;
      }
      S.notes[i] = m;
    }
    render(); salvar(); notify('Notas preenchidas');
  }

  function checarVitoria(){
    if (S.grid.every((v, i) => v === S.solution[i])){
      S.won = true; salvar(); render(); playSound('win');
      const novoRec = recorde('sudoku-' + S.diff, S.time, false);
      modal({ title: '🎉 Sudoku resolvido!', html: `<p>Dificuldade <b>${DIFF[S.diff].nome}</b> em <b>${fmtTime(S.time)}</b> com ${S.errors} erro(s).</p>${novoRec ? '<p class="gold">🏆 Novo recorde!</p>' : ''}`, buttons: [{ text: 'Novo jogo', onClick: () => { novo(S.diff); render(); } }, { text: 'Ver tabuleiro', cls: 'ghost' }] });
    }
  }

  function fimDeJogo(){
    playSound('bad');
    modal({ title: 'Fim de jogo', html: `<p>Você cometeu ${MAXERR} erros.</p>`, buttons: [{ text: 'Novo jogo', onClick: () => { novo(S.diff); render(); } }] });
  }

  function render(){
    if (!root || !S) return;
    const sv = S.sel >= 0 ? S.grid[S.sel] : 0;
    let h = '';
    for (let i = 0; i < 81; i++){
      const v = S.grid[i], cls = ['cell'];
      if (S.puzzle[i]) cls.push('given');
      if (i === S.sel) cls.push('sel');
      else if (S.sel >= 0 && peers(S.sel, i)) cls.push('peer');
      if (v && v === sv && i !== S.sel) cls.push('same');
      if (v && !correto(i)) cls.push('err');
      if (i % 9 === 2 || i % 9 === 5) cls.push('br');
      if (((i / 9) | 0) === 2 || ((i / 9) | 0) === 5) cls.push('bb');
      let inner = '';
      if (v) inner = v;
      else if (S.notes[i]){
        inner = '<div class="notes">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<i class="${S.notes[i] & (1 << d) ? (d === sv ? 'on hl' : 'on') : ''}">${S.notes[i] & (1 << d) ? d : ''}</i>`).join('') + '</div>';
      }
      h += `<div class="${cls.join(' ')}" data-i="${i}">${inner}</div>`;
    }
    $('#sdk-board').innerHTML = h;
    $('#sdk-err').textContent = `${S.errors}/${MAXERR}`;
    $('#sdk-err').className = S.errors ? 'bad' : '';
    $('#sdk-time').textContent = fmtTime(S.time);
    $('#sdk-pad').innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => {
      const n = S.grid.filter((v, i) => v === d && correto(i)).length;
      return `<button data-n="${d}" ${n >= 9 ? 'disabled' : ''}>${d}<small>${9 - n}</small></button>`;
    }).join('');
    $('#sdk-notes-state').textContent = S.notesMode ? 'on' : 'off';
    $('.tool[data-t="notes"]', root).classList.toggle('active', S.notesMode);
    $('#sdk-pad').classList.toggle('notes-mode', S.notesMode);
    $('#sdk-hint-n').textContent = S.hints;
    $$('#sdk-diff .chip').forEach(b => b.classList.toggle('active', b.dataset.d === S.diff));
    const best = getRecorde('sudoku-' + S.diff);
    $('#sdk-best').textContent = best !== null ? `🏆 Melhor tempo (${DIFF[S.diff].nome}): ${fmtTime(best)}` : '';
  }

  registerGame({
    id: 'sudoku', nome: 'Sudoku', icon: '▦', cor: '#7c5cff', tag: 'Lógica',
    desc: 'Tabuleiro clássico com notas, dicas, desfazer e 4 níveis de dificuldade.',
    recordeKeys: [{ key: 'sudoku-facil', label: 'Fácil', fmt: fmtTime }],
    mount, unmount
  });
})();

