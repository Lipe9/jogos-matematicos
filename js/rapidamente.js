/* rapidamente.js - cálculo relâmpago com combo */
(function(){
  const NIV = { facil: { nome: 'Fácil', lv: 1 }, medio: { nome: 'Médio', lv: 3 }, dificil: { nome: 'Difícil', lv: 6 } };
  const DUR = 60;
  let t = null, keyH = null, root, diff = 'facil', st;

  function tela(){
    clearInterval(t);
    root.innerHTML = `
      <div class="panel center narrow">
        <h3>Calcule o máximo em ${DUR}s</h3>
        <p class="muted">Acertos em sequência aumentam o combo (até ×5). Errar custa 3 segundos.</p>
        <div class="chips">${Object.entries(NIV).map(([k, v]) => `<button class="chip ${k === diff ? 'active' : ''}" data-d="${k}">${v.nome}</button>`).join('')}</div>
        <p class="best" id="rp-best"></p>
        <button class="btn big" id="rp-start">Começar</button>
      </div>`;
    $$('.chip', root).forEach(b => b.onclick = () => { diff = b.dataset.d; tela(); });
    const r = getRecorde('rapido-' + diff);
    $('#rp-best').textContent = r !== null ? `🏆 Recorde: ${r} pts` : '';
    $('#rp-start').onclick = jogar;
  }

  function jogar(){
    st = { score: 0, combo: 0, left: DUR, acertos: 0, erros: 0, lock: false };
    root.innerHTML = `
      <div class="panel narrow">
        <div class="hud"><div class="stat"><small>Tempo</small><b id="rp-time">${DUR}</b></div><div class="stat"><small>Pontos</small><b id="rp-score">0</b></div><div class="stat"><small>Combo</small><b id="rp-combo">×1</b></div></div>
        <div class="bar"><i id="rp-bar"></i></div>
        <div class="question" id="rp-q"></div>
        <div class="opts" id="rp-opts"></div>
        <p class="muted center small">Dica: use as teclas 1–4</p>
      </div>`;
    proxima();
    t = setInterval(() => {
      st.left--; atualiza();
      if (st.left <= 0) fim();
    }, 1000);
  }

  function atualiza(){
    $('#rp-time').textContent = Math.max(0, st.left);
    $('#rp-score').textContent = st.score;
    $('#rp-combo').textContent = '×' + Math.min(5, 1 + Math.floor(st.combo / 3));
    $('#rp-bar').style.width = Math.max(0, st.left / DUR * 100) + '%';
  }

  function proxima(){
    st.lock = false;
    const q = mathQuestion(NIV[diff].lv + (st.acertos > 12 ? 1 : 0));
    st.q = q;
    $('#rp-q').textContent = q.text + ' = ?';
    $('#rp-opts').innerHTML = numOptions(q.answer).map((o, i) => `<button class="opt" data-v="${o}"><kbd>${i + 1}</kbd>${o}</button>`).join('');
    $$('#rp-opts .opt').forEach(b => b.onclick = () => responder(b));
    atualiza();
  }

  function responder(b){
    if (st.lock) return; st.lock = true;
    if (+b.dataset.v === st.q.answer){
      const mult = Math.min(5, 1 + Math.floor(st.combo / 3));
      st.score += 10 * mult; st.combo++; st.acertos++; b.classList.add('right'); playSound('ok');
    } else {
      st.combo = 0; st.erros++; st.left -= 3; b.classList.add('wrong'); playSound('bad');
      $$('#rp-opts .opt').forEach(x => { if (+x.dataset.v === st.q.answer) x.classList.add('right'); });
    }
    atualiza();
    if (st.left <= 0) return fim();
    setTimeout(proxima, 350);
  }

  function fim(){
    clearInterval(t); t = null;
    const nr = recorde('rapido-' + diff, st.score);
    playSound('win');
    root.innerHTML = `
      <div class="panel center narrow">
        <h3>Tempo esgotado!</h3>
        <div class="big-num">${st.score}<small> pts</small></div>
        <p class="muted">${st.acertos} acertos · ${st.erros} erros</p>
        ${nr ? '<p class="gold">🏆 Novo recorde!</p>' : ''}
        <div class="row"><button class="btn" id="rp-again">Jogar de novo</button><button class="btn ghost" id="rp-menu">Mudar nível</button></div>
      </div>`;
    $('#rp-again').onclick = jogar; $('#rp-menu').onclick = tela;
  }

  registerGame({
    id: 'rapidamente', nome: 'RápidaMente', icon: '⚡', cor: '#ffb020', tag: 'Cálculo mental',
    desc: 'Resolva o máximo de contas em 60 segundos e acumule combos.',
    recordeKeys: [{ key: 'rapido-facil', label: 'Fácil', fmt: v => v + ' pts' }],
    mount(el){
      root = el; tela();
      keyH = e => { if (/^[1-4]$/.test(e.key) && $('#rp-opts')){ const b = $$('#rp-opts .opt')[+e.key - 1]; if (b) responder(b); } };
      document.addEventListener('keydown', keyH);
    },
    unmount(){ clearInterval(t); document.removeEventListener('keydown', keyH); }
  });
})();

