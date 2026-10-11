/* g2048.js - 2048 */
(function(){
  let root, grid, score, over, won, keyH, tx, ty;

  function vazio(){ return Array.from({ length: 4 }, () => Array(4).fill(0)); }
  function novo(){ grid = vazio(); score = 0; over = false; won = false; add(); add(); draw(); }
  function add(){
    const e = []; grid.forEach((r, y) => r.forEach((v, x) => { if (!v) e.push([x, y]); }));
    if (!e.length) return; const [x, y] = pick(e); grid[y][x] = Math.random() < .9 ? 2 : 4;
  }
  function linha(r){
    const a = r.filter(Boolean), out = [];
    for (let i = 0; i < a.length; i++){
      if (a[i] === a[i + 1]){ out.push(a[i] * 2); score += a[i] * 2; i++; } else out.push(a[i]);
    }
    while (out.length < 4) out.push(0); return out;
  }
  function mover(dir){
    if (over) return;
    const antes = JSON.stringify(grid);
    const g = grid.map(r => r.slice());
    const rot = (m) => m[0].map((_, i) => m.map(r => r[i]).reverse());
    let m = g;
    const times = { left: 0, up: 3, right: 2, down: 1 }[dir];
    for (let i = 0; i < times; i++) m = rot(m);
    m = m.map(linha);
    for (let i = 0; i < (4 - times) % 4; i++) m = rot(m);
    grid = m;
    if (JSON.stringify(grid) === antes) return;
    playSound('tap'); add(); draw();
    if (!won && grid.flat().some(v => v >= 2048)){ won = true; playSound('win'); notify('Você chegou a 2048! 🎉', 'success', 4000); }
    if (!podeMover()){ over = true; draw(); recorde('2048', score); modal({ title: 'Sem movimentos', html: `<p>Pontuação: <b>${score}</b></p>`, buttons: [{ text: 'Novo jogo', onClick: novo }] }); }
  }
  function podeMover(){
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++){
      if (!grid[y][x]) return true;
      if (x < 3 && grid[y][x] === grid[y][x + 1]) return true;
      if (y < 3 && grid[y][x] === grid[y + 1][x]) return true;
    }
    return false;
  }
  function draw(){
    recorde('2048', score);
    $('#g-score').textContent = score; $('#g-best').textContent = getRecorde('2048') || 0;
    $('#g-board').innerHTML = grid.flat().map(v => `<div class="t2048" data-v="${v}">${v || ''}</div>`).join('');
  }

  registerGame({
    id: 'g2048', nome: '2048', icon: '2048', cor: '#fb923c', tag: 'Puzzle',
    desc: 'Deslize e funda potências de 2 até alcançar o lendário 2048.',
    recordeKeys: [{ key: '2048', label: 'Pontos', fmt: v => v + ' pts' }],
    mount(el){
      root = el;
      el.innerHTML = `
        <div class="panel narrow center">
          <div class="hud"><div class="stat"><small>Pontos</small><b id="g-score">0</b></div><div class="stat"><small>Recorde</small><b id="g-best">0</b></div><button class="btn ghost" id="g-new">Novo</button></div>
          <div class="board2048" id="g-board"></div>
          <p class="muted small">Use as setas do teclado ou deslize na tela.</p>
        </div>`;
      $('#g-new').onclick = novo;
      keyH = e => { const d = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[e.key]; if (d){ e.preventDefault(); mover(d); } };
      document.addEventListener('keydown', keyH);
      const b = $('#g-board');
      b.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
      b.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
        mover(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
      });
      novo();
    },
    unmount(){ document.removeEventListener('keydown', keyH); }
  });
})();

