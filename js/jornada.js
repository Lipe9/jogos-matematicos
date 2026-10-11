/* jornada.js - RPG: derrote monstros resolvendo contas */
(function(){
  const INIMIGOS = [['🟢', 'Slime Aritmético'], ['🦇', 'Morcego do Mais'], ['🐺', 'Lobo da Subtração'], ['🧌', 'Troll da Tabuada'], ['👻', 'Fantasma Fracionário'], ['🐉', 'Dragão Divisor'], ['🧙', 'Mago Algébrico'], ['👑', 'Rei do Infinito']];
  const LOJA = { pocao: { nome: '🧪 Poção', desc: 'Cura 12 HP', preco: 6 }, escudo: { nome: '🛡 Escudo', desc: 'Bloqueia o próximo dano', preco: 8 }, dica: { nome: '🔍 Lupa', desc: 'Remove 2 alternativas erradas', preco: 5 } };
  let root, H, E, Q;

  function novoHeroi(){ return { hp: 24, max: 24, xp: 0, lvl: 1, moedas: 5, fase: 1, escudo: false, itens: { pocao: 1, escudo: 0, dica: 1 }, mortos: 0 }; }
  function novoInimigo(){
    const [emoji, nome] = INIMIGOS[(H.fase - 1) % INIMIGOS.length];
    const boss = H.fase % 5 === 0;
    const hp = 3 + Math.floor(H.fase * 1.2) + (boss ? 4 : 0);
    E = { emoji: boss ? '👹' : emoji, nome: boss ? 'Chefe: ' + nome : nome, hp, max: hp, atk: 3 + Math.floor(H.fase / 2) + (boss ? 2 : 0) };
  }
  function pergunta(){
    const q = mathQuestion(1 + Math.floor((H.fase - 1) / 2));
    Q = { ...q, opts: numOptions(q.answer), lock: false };
  }

  function comecar(){ H = novoHeroi(); log = []; novoInimigo(); pergunta(); draw(); addLog('Sua jornada começa! Um inimigo se aproxima…'); }
  let log = [];
  function addLog(t, c = ''){ log.unshift(`<div class="${c}">${t}</div>`); log = log.slice(0, 40); const l = $('#jn-log'); if (l) l.innerHTML = log.join(''); }

  function draw(){
    const bar = (v, m, c) => `<div class="hbar"><i style="width:${Math.max(0, v / m * 100)}%;background:${c}"></i><span>${Math.max(0, v)}/${m}</span></div>`;
    root.innerHTML = `
      <div class="jn">
        <div class="panel jn-hero">
          <div class="avatar">🧙‍♂️</div>
          <h3>Herói · Nível ${H.lvl}</h3>
          ${bar(H.hp, H.max, 'linear-gradient(90deg,#22d3a5,#a3e635)')}
          ${bar(H.xp, H.lvl * 25, 'linear-gradient(90deg,#7c5cff,#38bdf8)')}
          <p class="muted small">❤ HP · ✨ XP${H.escudo ? ' · 🛡 protegido' : ''}</p>
          <div class="coin">🪙 ${H.moedas}</div>
          <div class="inv">${Object.entries(LOJA).map(([k, v]) => `
            <div class="item"><div><b>${v.nome}</b> ×${H.itens[k]}<small>${v.desc}</small></div>
            <div class="row tight"><button class="btn sm" data-use="${k}" ${H.itens[k] ? '' : 'disabled'}>Usar</button><button class="btn sm ghost" data-buy="${k}" ${H.moedas >= v.preco ? '' : 'disabled'}>🪙${v.preco}</button></div></div>`).join('')}
          </div>
        </div>
        <div class="panel jn-battle">
          <p class="eyebrow">Fase ${H.fase}</p>
          <div class="enemy"><div class="e-emoji" id="jn-emoji">${E.emoji}</div><h3>${E.nome}</h3>${bar(E.hp, E.max, 'linear-gradient(90deg,#ff5c8a,#fb923c)')}</div>
          <div class="question">${Q.text} = ?</div>
          <div class="opts" id="jn-opts">${Q.opts.map(o => `<button class="opt" data-v="${o}">${o}</button>`).join('')}</div>
          <div class="log" id="jn-log">${log.join('')}</div>
        </div>
      </div>`;
    $$('#jn-opts .opt').forEach(b => b.onclick = () => responder(b));
    $$('[data-use]').forEach(b => b.onclick = () => usar(b.dataset.use));
    $$('[data-buy]').forEach(b => b.onclick = () => { const k = b.dataset.buy; H.moedas -= LOJA[k].preco; H.itens[k]++; playSound('ok'); draw(); });
  }

  function usar(k){
    if (!H.itens[k]) return;
    if (k === 'pocao'){ if (H.hp >= H.max) return notify('HP já está cheio'); H.hp = Math.min(H.max, H.hp + 12); addLog('🧪 Você recuperou 12 HP.', 'good'); }
    if (k === 'escudo'){ if (H.escudo) return; H.escudo = true; addLog('🛡 Escudo ativado.', 'good'); }
    if (k === 'dica'){
      const erradas = $$('#jn-opts .opt:not([disabled])').filter(b => +b.dataset.v !== Q.answer);
      if (erradas.length < 3) return; shuffle(erradas).slice(0, 2).forEach(b => b.disabled = true);
      H.itens.dica--; addLog('🔍 Duas alternativas eliminadas.', 'good'); playSound('tap');
      const l = $('#jn-log'); l.innerHTML = log.join(''); // atualiza só o log e inventário
      const cur = $('[data-use="dica"]'); if (cur){ cur.disabled = !H.itens.dica; cur.closest('.item').querySelector('b').nextSibling.textContent = ` ×${H.itens.dica}`; }
      return;
    }
    H.itens[k]--; playSound('ok');
    const dis = $$('#jn-opts .opt').map(b => b.disabled);
    draw(); $$('#jn-opts .opt').forEach((b, i) => b.disabled = dis[i]);
  }

  function responder(b){
    if (Q.lock) return; Q.lock = true;
    const certo = +b.dataset.v === Q.answer;
    if (certo){
      const dano = 1 + Math.floor(H.lvl / 3);
      E.hp -= dano; b.classList.add('right'); playSound('ok');
      addLog(`⚔ Acertou! Causou ${dano} de dano.`, 'good');
      $('#jn-emoji').classList.add('hit');
      if (E.hp <= 0) return setTimeout(vitoria, 500);
    } else {
      b.classList.add('wrong'); playSound('bad');
      $$('#jn-opts .opt').forEach(x => { if (+x.dataset.v === Q.answer) x.classList.add('right'); });
      if (H.escudo){ H.escudo = false; addLog('🛡 O escudo absorveu o golpe!', 'good'); }
      else { H.hp -= E.atk; addLog(`💥 Errou! ${E.nome} causou ${E.atk} de dano.`, 'bad'); }
      if (H.hp <= 0) return setTimeout(derrota, 600);
    }
    setTimeout(() => { pergunta(); draw(); }, 650);
  }

  function vitoria(){
    const xp = 6 + H.fase * 2, moedas = 2 + Math.floor(H.fase / 2) + rnd(0, 2);
    H.xp += xp; H.moedas += moedas; H.mortos++;
    addLog(`🏆 ${E.nome} derrotado! +${xp} XP, +${moedas} 🪙`, 'good');
    while (H.xp >= H.lvl * 25){ H.xp -= H.lvl * 25; H.lvl++; H.max += 5; H.hp = H.max; addLog(`⬆ Nível ${H.lvl}! HP restaurado.`, 'gold'); playSound('win'); notify(`Nível ${H.lvl}!`, 'success'); }
    if (Math.random() < .3){ const k = pick(Object.keys(LOJA)); H.itens[k]++; addLog(`🎁 Item encontrado: ${LOJA[k].nome}`, 'gold'); }
    H.fase++; recorde('jornada', H.fase - 1);
    novoInimigo(); pergunta(); draw();
  }

  function derrota(){
    recorde('jornada', H.fase - 1);
    modal({ title: '💀 Fim da jornada', html: `<p>Você chegou à <b>fase ${H.fase}</b> e derrotou ${H.mortos} inimigo(s).</p>`, buttons: [{ text: 'Recomeçar', onClick: comecar }] });
  }

  registerGame({
    id: 'jornada', nome: 'A Jornada dos Números', icon: '⚔', cor: '#f43f5e', tag: 'RPG',
    desc: 'Evolua seu herói, enfrente monstros e chefes usando cálculo como arma.',
    recordeKeys: [{ key: 'jornada', label: 'Fase', fmt: v => 'fase ' + v }],
    mount(el){ root = el; comecar(); }, unmount(){}
  });
})();

