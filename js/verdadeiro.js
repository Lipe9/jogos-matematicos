/* verdadeiro.js - Verdadeiro ou Falso */
(function(){
  const NIV = { facil: { nome: 'Fácil', lv: 1 }, medio: { nome: 'Médio', lv: 3 }, dificil: { nome: 'Difícil', lv: 6 } };
  const DUR = 45;
  let root, diff = 'medio', t = null, keyH = null, st;

  function tela(){
    clearInterval(t);
    root.innerHTML = `
      <div class="panel center narrow">
        <h3>A igualdade é verdadeira?</h3>
        <p class="muted">${DUR} segundos. Cada acerto vale 10 pontos; errar zera a sequência e tira 5 pontos.</p>
        <div class="chips">${Object.entries(NIV).map(([k, v]) => `<button class="chip ${k === diff ? 'active' : ''}" data-d="${k}">${v.nome}</button>`).join('')}</div>
        <p class="best" id="vf-best"></p>
        <button class="btn big" id="vf-start">Começar</button>
      </div>`;
    $$('.chip', root).forEach(b => b.onclick = () => { diff = b.dataset.d; tela(); });
    const r = getRecorde('vf-' + diff);
    $('#vf-best').textContent = r !== null ? `🏆 Recorde: ${r} pts` : '';
    $('#vf-start').onclick = jogar;
  }

  function jogar(){
    st = { score: 0, streak: 0, best: 0, left: DUR, lock: false };
    root.innerHTML = `
      <div class="panel narrow center">
        <div class="hud"><div class="stat"><small>Tempo</small><b id="vf-time">${DUR}</b></div><div class="stat"><small>Pontos</small><b id="vf-score">0</b></div><div class="stat"><small>Sequência</small><b id="vf-streak">0</b></div></div>
        <div class="bar"><i id="vf-bar"></i></div>
        <div class="question" id="vf-q"></div>
        <div class="row vf-btns"><button class="btn vf-true" data-v="1">✔ Verdadeiro</button><button class="btn vf-false" data-v="0">✘ Falso</button></div>
        <p class="muted small">Atalhos: ← falso · → verdadeiro</p>
      </div>`;
    $$('.vf-btns .btn', root).forEach(b => b.onclick = () => resp(b.dataset.v === '1', b));
    prox();
    t = setInterval(() => { st.left--; upd(); if (st.left <= 0) fim(); }, 1000);
  }

  function upd(){
    $('#vf-time').textContent = Math.max(0, st.left); $('#vf-score').textContent = st.score; $('#vf-streak').textContent = st.streak;
    $('#vf-bar').style.width = Math.max(0, st.left / DUR * 100) + '%';
  }

  function prox(){
    st.lock = false;
    const q = mathQuestion(NIV[diff].lv + Math.floor(st.streak / 6));
    const verdade = Math.random() < .5;
    const shown = verdade ? q.answer : q.answer + pick([-1, 1]) * pick([1, 1, 2, 10, q.answer > 20 ? 5 : 3]);
    st.verdade = shown === q.answer;
    $('#vf-q').textContent = `${q.text} = ${shown}`;
  }

  function resp(v, btn){
    if (st.lock || !st.left) return; st.lock = true;
    if (v === st.verdade){ st.score += 10; st.streak++; st.best = Math.max(st.best, st.streak); playSound('ok'); $('#vf-q').classList.add('flash-ok'); }
    else { st.score = Math.max(0, st.score - 5); st.streak = 0; playSound('bad'); $('#vf-q').classList.add('flash-bad'); }
    upd();
    setTimeout(() => { $('#vf-q') && $('#vf-q').classList.remove('flash-ok', 'flash-bad'); if (st.left > 0) prox(); }, 280);
  }

  function fim(){
    clearInterval(t);
    const nr = recorde('vf-' + diff, st.score); playSound('win');
    root.innerHTML = `
      <div class="panel center narrow">
        <h3>Tempo!</h3>
        <div class="big-num">${st.score}<small> pts</small></div>
        <p class="muted">Maior sequência: ${st.best}</p>
        ${nr ? '<p class="gold">🏆 Novo recorde!</p>' : ''}
        <div class="row"><button class="btn" id="vf-again">Jogar de novo</button><button class="btn ghost" id="vf-menu">Menu</button></div>
      </div>`;
    $('#vf-again').onclick = jogar; $('#vf-menu').onclick = tela;
  }

  registerGame({
    id: 'verdadeiro', nome: 'Verdadeiro ou Falso', icon: '≟', cor: '#a3e635', tag: 'Agilidade',
    desc: 'Julgue em segundos se a igualdade está correta antes que o tempo acabe.',
    recordeKeys: [{ key: 'vf-medio', label: 'Médio', fmt: v => v + ' pts' }],
    mount(el){
      root = el; tela();
      keyH = e => { if (!$('.vf-btns')) return; if (e.key === 'ArrowRight') resp(true); if (e.key === 'ArrowLeft') resp(false); };
      document.addEventListener('keydown', keyH);
    },
    unmount(){ clearInterval(t); document.removeEventListener('keydown', keyH); }
  });
})();

