/* sequencia.js - descubra o próximo número */
(function(){
  const NIV = { facil: { nome: 'Fácil', g: ['arit', 'quad'] }, medio: { nome: 'Médio', g: ['arit', 'quad', 'geo', 'alt'] }, dificil: { nome: 'Difícil', g: ['geo', 'alt', 'fib', 'cresc', 'cubo', 'quad'] } };
  const TOTAL = 10;
  let root, diff = 'medio', st;

  const GER = {
    arit(){ const a = rnd(1, 20), d = rnd(2, 9) * pick([1, 1, -1]); return { s: i => a + d * i, dica: `A diferença entre termos é constante.` }; },
    quad(){ const o = rnd(1, 5); return { s: i => (i + o) ** 2, dica: 'Pense em quadrados perfeitos.' }; },
    cubo(){ const o = rnd(1, 3); return { s: i => (i + o) ** 3, dica: 'Pense em cubos perfeitos.' }; },
    geo(){ const a = rnd(1, 4), r = pick([2, 3]); return { s: i => a * r ** i, dica: 'Cada termo é multiplicado pelo mesmo número.' }; },
    alt(){ const a = rnd(1, 10), x = rnd(2, 6), y = rnd(7, 12); return { s: i => a + Math.ceil(i / 2) * x + Math.floor(i / 2) * y, dica: 'Duas somas se alternam.' }; },
    cresc(){ const a = rnd(1, 6), s0 = rnd(1, 3), d = rnd(1, 3); return { s: i => a + s0 * i + d * i * (i - 1) / 2, dica: 'A diferença entre termos também cresce a cada passo.' }; },
    fib(){ const a = rnd(1, 4), b = rnd(1, 6); const arr = [a, b]; for (let i = 2; i < 8; i++) arr.push(arr[i - 1] + arr[i - 2]); return { s: i => arr[i], dica: 'Cada termo é a soma dos dois anteriores.' }; }
  };

  function tela(){
    root.innerHTML = `
      <div class="panel center narrow">
        <h3>Qual é o próximo número?</h3>
        <p class="muted">${TOTAL} sequências. Dica custa metade dos pontos.</p>
        <div class="chips">${Object.entries(NIV).map(([k, v]) => `<button class="chip ${k === diff ? 'active' : ''}" data-d="${k}">${v.nome}</button>`).join('')}</div>
        <p class="best" id="sq-best"></p>
        <button class="btn big" id="sq-start">Começar</button>
      </div>`;
    $$('.chip', root).forEach(b => b.onclick = () => { diff = b.dataset.d; tela(); });
    const r = getRecorde('seq-' + diff);
    $('#sq-best').textContent = r !== null ? `🏆 Recorde: ${r} pts` : '';
    $('#sq-start').onclick = () => { st = { n: 0, score: 0, ok: 0 }; rodada(); };
  }

  function rodada(){
    if (st.n >= TOTAL) return fim();
    const g = GER[pick(NIV[diff].g)]();
    const seq = Array.from({ length: 5 }, (_, i) => g.s(i));
    st.cur = { seq, ans: g.s(5), dica: g.dica, usouDica: false };
    root.innerHTML = `
      <div class="panel center narrow">
        <div class="hud"><div class="stat"><small>Rodada</small><b>${st.n + 1}/${TOTAL}</b></div><div class="stat"><small>Pontos</small><b>${st.score}</b></div></div>
        <div class="seq">${seq.map(v => `<span class="seq-n">${v}</span>`).join('')}<span class="seq-n q">?</span></div>
        <p class="muted" id="sq-hint">&nbsp;</p>
        <input type="number" id="sq-in" class="input" placeholder="Sua resposta" autofocus>
        <div class="row"><button class="btn" id="sq-ok">Responder</button><button class="btn ghost" id="sq-dica">💡 Dica</button></div>
      </div>`;
    const inp = $('#sq-in'); inp.focus();
    inp.onkeydown = e => { if (e.key === 'Enter') responder(); };
    $('#sq-ok').onclick = responder;
    $('#sq-dica').onclick = () => { st.cur.usouDica = true; $('#sq-hint').textContent = '💡 ' + st.cur.dica; };
  }

  function responder(){
    const v = $('#sq-in').value; if (v === '') return;
    const ok = +v === st.cur.ans;
    st.n++;
    if (ok){ const p = st.cur.usouDica ? 5 : 10; st.score += p; st.ok++; playSound('ok'); notify(`Correto! +${p}`, 'success'); }
    else { playSound('bad'); notify(`Era ${st.cur.ans}`, 'error'); }
    setTimeout(rodada, 700);
  }

  function fim(){
    const nr = recorde('seq-' + diff, st.score); playSound('win');
    root.innerHTML = `
      <div class="panel center narrow">
        <h3>Fim das sequências</h3>
        <div class="big-num">${st.score}<small> pts</small></div>
        <p class="muted">${st.ok} de ${TOTAL} acertos</p>
        ${nr ? '<p class="gold">🏆 Novo recorde!</p>' : ''}
        <div class="row"><button class="btn" id="sq-again">Jogar de novo</button><button class="btn ghost" id="sq-menu">Menu</button></div>
      </div>`;
    $('#sq-again').onclick = () => { st = { n: 0, score: 0, ok: 0 }; rodada(); }; $('#sq-menu').onclick = tela;
  }

  registerGame({
    id: 'sequencia', nome: 'Sequências Lógicas', icon: '∞', cor: '#ff5c8a', tag: 'Raciocínio',
    desc: 'Descubra o padrão escondido e complete a sequência numérica.',
    recordeKeys: [{ key: 'seq-medio', label: 'Médio', fmt: v => v + ' pts' }],
    mount(el){ root = el; tela(); }, unmount(){}
  });
})();

