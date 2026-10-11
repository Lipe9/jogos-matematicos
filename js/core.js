/* core.js - utilidades compartilhadas entre os jogos */
const GAMES = [];
function registerGame(g){ GAMES.push(g); }

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function shuffle(a){ for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function fmtTime(s){ s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }

/* ---------- armazenamento ---------- */
const store = {
  get(k, d){ try { const v = localStorage.getItem('mv:' + k); return v === null ? d : JSON.parse(v); } catch (e){ return d; } },
  set(k, v){ try { localStorage.setItem('mv:' + k, JSON.stringify(v)); } catch (e){} },
  del(k){ try { localStorage.removeItem('mv:' + k); } catch (e){} }
};
/* grava recorde; retorna true se for novo. higher=false => menor é melhor */
function recorde(key, val, higher = true){
  const old = store.get('best:' + key, null);
  if (old === null || (higher ? val > old : val < old)){ store.set('best:' + key, val); return true; }
  return false;
}
const getRecorde = key => store.get('best:' + key, null);

/* ---------- notificações ---------- */
function notify(text, type = 'normal', tempo = 2600){
  const cont = $('#notify-container');
  const el = document.createElement('div');
  el.className = 'notify ' + type;
  el.textContent = text;
  cont.appendChild(el);
  requestAnimationFrame(() => el.classList.add('visible'));
  setTimeout(() => { el.classList.remove('visible'); setTimeout(() => el.remove(), 300); }, tempo);
}

/* ---------- modal ---------- */
function modal({ title, html = '', buttons = [] }){
  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.innerHTML = `<div class="modal"><h3>${title}</h3><div class="modal-body">${html}</div><div class="modal-actions"></div></div>`;
  const close = () => { ov.classList.remove('show'); setTimeout(() => ov.remove(), 200); };
  const act = $('.modal-actions', ov);
  buttons.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'btn ' + (b.cls || '');
    btn.textContent = b.text;
    btn.onclick = () => { close(); b.onClick && b.onClick(); };
    act.appendChild(btn);
  });
  document.body.appendChild(ov);
  requestAnimationFrame(() => ov.classList.add('show'));
  return close;
}

/* ---------- som ---------- */
let audioCtx = null;
let soundOn = store.get('sound', true);
function playSound(type = 'ok'){
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const seq = { ok: [[660, 0], [880, .09]], bad: [[220, 0], [160, .1]], tap: [[500, 0]], win: [[523, 0], [659, .1], [784, .2], [1046, .3]], flip: [[400, 0]] }[type] || [[440, 0]];
    seq.forEach(([f, d]) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      const t = audioCtx.currentTime + d;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.07, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(t); o.stop(t + 0.16);
    });
  } catch (e){}
}

/* ---------- gerador de perguntas (níveis 1..8) ---------- */
function mathQuestion(level){
  level = Math.max(1, level);
  const kinds = [];
  if (level <= 1) kinds.push('add', 'sub');
  else { kinds.push('add', 'sub'); if (level >= 2) kinds.push('mul'); if (level >= 3) kinds.push('div'); if (level >= 4) kinds.push('mix'); if (level >= 5) kinds.push('pct'); if (level >= 6) kinds.push('par', 'sq'); }
  const k = pick(kinds);
  const s = Math.min(level, 8);
  let text, answer, a, b, c;
  switch (k){
    case 'add': a = rnd(2, 10 * s + 8); b = rnd(2, 10 * s + 8); text = `${a} + ${b}`; answer = a + b; break;
    case 'sub': a = rnd(5, 10 * s + 15); b = rnd(1, a); text = `${a} − ${b}`; answer = a - b; break;
    case 'mul': a = rnd(2, 6 + s); b = rnd(2, 9 + Math.min(s, 4)); text = `${a} × ${b}`; answer = a * b; break;
    case 'div': b = rnd(2, 6 + s); answer = rnd(2, 9 + s); a = b * answer; text = `${a} ÷ ${b}`; break;
    case 'mix': a = rnd(2, 9 + s); b = rnd(2, 9); c = rnd(2, 9); text = `${a} + ${b} × ${c}`; answer = a + b * c; break;
    case 'pct': { const p = pick([10, 20, 25, 50, 75]); const base = pick([20, 40, 60, 80, 100, 120, 200]); text = `${p}% de ${base}`; answer = p * base / 100; break; }
    case 'par': a = rnd(2, 9); b = rnd(2, 9); c = rnd(2, 9); text = `(${a} + ${b}) × ${c}`; answer = (a + b) * c; break;
    case 'sq': a = rnd(3, 9 + s); text = `${a}²`; answer = a * a; break;
  }
  return { text, answer };
}
/* alternativas numéricas plausíveis */
function numOptions(answer, n = 4){
  const set = new Set([answer]);
  const spread = Math.max(3, Math.round(Math.abs(answer) * 0.15));
  let guard = 0;
  while (set.size < n && guard++ < 200){
    let v = answer + pick([-1, 1]) * rnd(1, spread + 2);
    if (v === answer) continue;
    set.add(v);
  }
  return shuffle([...set]);
}

