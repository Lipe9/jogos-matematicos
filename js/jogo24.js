/* jogo24.js - use os 4 números e as operações para chegar a 24 */
(function(){
  let root, nums, score = 0, rounds = 0;

  function solve(list){
    if (list.length === 1) return Math.abs(list[0].v - 24) < 1e-6 ? list[0].e : null;
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++){
      const a = list[i], b = list[j], rest = list.filter((_, k) => k !== i && k !== j);
      const c = [[a.v + b.v, `(${a.e} + ${b.e})`], [a.v * b.v, `(${a.e} × ${b.e})`], [a.v - b.v, `(${a.e} − ${b.e})`], [b.v - a.v, `(${b.e} − ${a.e})`]];
      if (b.v) c.push([a.v / b.v, `(${a.e} ÷ ${b.e})`]);
      if (a.v) c.push([b.v / a.v, `(${b.e} ÷ ${a.e})`]);
      for (const [v, e] of c){ const r = solve([...rest, { v, e }]); if (r) return r; }
    }
    return null;
  }
  const resolver = n => solve(n.map(v => ({ v, e: String(v) })));

  function novo(){
    do { nums = Array.from({ length: 4 }, () => rnd(1, 13)); } while (!resolver(nums));
    root.innerHTML = `
      <div class="panel center narrow">
        <div class="hud"><div class="stat"><small>Resolvidos</small><b>${rounds}</b></div><div class="stat"><small>Pontos</small><b>${score}</b></div></div>
        <p class="muted">Use os quatro números, cada um uma vez, para chegar a <b>24</b>.</p>
        <div class="tiles" id="g24-tiles">${nums.map((n, i) => `<button class="tile" data-n="${n}">${n}</button>`).join('')}</div>
        <input id="g24-in" class="input mono" autocomplete="off" placeholder="ex.: (8 ÷ 2 + 2) × 4" inputmode="text">
        <p class="g24-val" id="g24-val">&nbsp;</p>
        <div class="ops">${['+', '−', '×', '÷', '(', ')'].map(o => `<button class="op">${o}</button>`).join('')}<button class="op wide" id="g24-del">⌫</button></div>
        <div class="row"><button class="btn" id="g24-ok">Verificar</button><button class="btn ghost" id="g24-skip">Pular</button><button class="btn ghost" id="g24-sol">Ver solução</button></div>
      </div>`;
    const inp = $('#g24-in');
    const norm = () => inp.value.replace(/x|\*/gi, '×').replace(/\//g, '÷').replace(/-/g, '−');
    const refresh = () => {
      inp.value = norm();
      const pool = [...(inp.value.match(/\d+/g) || [])].map(Number);
      $$('.tile', root).forEach(t => { const k = pool.indexOf(+t.dataset.n); t.classList.toggle('used', k >= 0); if (k >= 0) pool.splice(k, 1); });
      try { const v = avaliar(inp.value); $('#g24-val').textContent = isFinite(v) ? `= ${+v.toFixed(3)}` : '\u00a0'; } catch (e){ $('#g24-val').innerHTML = '&nbsp;'; }
    };
    inp.oninput = refresh;
    inp.onkeydown = e => { if (e.key === 'Enter') verificar(); };
    $$('.tile', root).forEach(t => t.onclick = () => { inp.value += t.dataset.n; refresh(); inp.focus(); });
    $$('.op:not(.wide)', root).forEach(o => o.onclick = () => { inp.value += o.textContent; refresh(); inp.focus(); });
    $('#g24-del').onclick = () => { inp.value = inp.value.slice(0, -1); refresh(); };
    $('#g24-ok').onclick = verificar;
    $('#g24-skip').onclick = novo;
    $('#g24-sol').onclick = () => { notify('Solução: ' + resolver(nums).replace(/^\((.*)\)$/, '$1'), 'normal', 6000); score = Math.max(0, score - 5); };
    inp.focus();
  }

  function avaliar(s){
    const js = s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
    if (!/^[\d+\-*/() .]+$/.test(js) || /\*\*|\/\//.test(js)) throw 0;
    return Function('"use strict";return (' + js + ')')();
  }

  function verificar(){
    const s = $('#g24-in').value;
    const usados = (s.match(/\d+/g) || []).map(Number).sort((a, b) => a - b).join();
    if (usados !== [...nums].sort((a, b) => a - b).join()) return notify('Use exatamente os quatro números, uma vez cada.', 'error');
    let v; try { v = avaliar(s); } catch (e){ return notify('Expressão inválida.', 'error'); }
    if (Math.abs(v - 24) < 1e-9){ score += 10; rounds++; playSound('win'); recorde('g24', score); notify('Perfeito! +10', 'success'); setTimeout(novo, 600); }
    else { playSound('bad'); notify(`Resultou em ${+v.toFixed(3)}, não 24.`, 'error'); }
  }

  registerGame({
    id: 'jogo24', nome: 'Jogo do 24', icon: '24', cor: '#38bdf8', tag: 'Estratégia',
    desc: 'Combine quatro números com + − × ÷ para chegar exatamente a 24.',
    recordeKeys: [{ key: 'g24', label: 'Pontos', fmt: v => v + ' pts' }],
    mount(el){ root = el; score = 0; rounds = 0; novo(); }, unmount(){}
  });
})();

