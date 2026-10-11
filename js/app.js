/* app.js - hub, navegação e fundo */
let atual = null;

function recordeTexto(g){
  if (!g.recordeKeys) return '';
  const parts = g.recordeKeys.map(k => { const v = getRecorde(k.key); return v === null ? null : `${k.label}: ${k.fmt ? k.fmt(v) : v}`; }).filter(Boolean);
  return parts.length ? parts[0] : 'Sem recorde ainda';
}

function renderHub(){
  $('#cards').innerHTML = GAMES.map(g => `
    <article class="card" tabindex="0" data-id="${g.id}" style="--c:${g.cor}">
      <div class="card-icon">${g.icon}</div>
      <h3>${g.nome}</h3>
      <p>${g.desc}</p>
      <div class="card-foot"><span class="tag">${g.tag}</span><span class="rec">🏆 ${recordeTexto(g)}</span></div>
    </article>`).join('');
  $$('.card').forEach(c => {
    const go = () => { location.hash = '#' + c.dataset.id; };
    c.onclick = go;
    c.onkeydown = e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } };
  });
}

function sair(){
  if (atual && atual.unmount) atual.unmount();
  atual = null;
  $('#game-root').innerHTML = '';
}

function route(){
  const id = location.hash.replace('#', '');
  const g = GAMES.find(x => x.id === id);
  sair();
  if (!g){
    $('#stage').classList.add('hidden');
    $('#hub').classList.remove('hidden');
    renderHub();
    document.title = 'Mathverse · Jogos de Matemática';
    return;
  }
  $('#hub').classList.add('hidden');
  $('#stage').classList.remove('hidden');
  $('#stage-title').textContent = g.nome;
  document.title = g.nome + ' · Mathverse';
  atual = g;
  g.mount($('#game-root'));
  window.scrollTo({ top: 0 });
}

function initBg(){
  const syms = ['+', '−', '×', '÷', '=', 'π', '√', '∑', '∞', '%', '²', '≠', '∫', '7', '3', '9'];
  $('#symbols').innerHTML = Array.from({ length: 26 }, () => {
    const s = pick(syms), x = rnd(0, 100), d = rnd(14, 34), dl = -rnd(0, 30), sz = rnd(22, 64);
    return `<span style="left:${x}%;font-size:${sz}px;animation-duration:${d}s;animation-delay:${dl}s">${s}</span>`;
  }).join('');
}

function initSound(){
  const b = $('#btn-sound');
  const upd = () => b.textContent = soundOn ? '🔊' : '🔇';
  upd();
  b.onclick = () => { soundOn = !soundOn; store.set('sound', soundOn); upd(); playSound('tap'); };
}

window.addEventListener('hashchange', route);
$('#btn-back').onclick = () => { location.hash = ''; };
$('#brand').onclick = e => { e.preventDefault(); location.hash = ''; };
initBg(); initSound(); route();

