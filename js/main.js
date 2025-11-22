/* main.js - UI helpers, showGame & audio (SEM RANKING) */

/* Mostrar o jogo selecionado */
function showGame(id){
  document.querySelectorAll('.game').forEach(g => g.classList.add('hidden'));
  const s = document.getElementById(id);
  if (s) {
    s.classList.remove('hidden');
    if(id === 'quiz' && typeof iniciarQuiz === 'function'){
      iniciarQuiz();
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* === NOTIFICAÇÕES (toast canto superior direito) === */
function notify(text, type='normal', tempo=3000){
  // cria container se não existir
  let cont = document.getElementById('notify-container');
  if(!cont){
    cont = document.createElement('div');
    cont.id = 'notify-container';
    document.body.appendChild(cont);
  }

  const el = document.createElement('div');
  el.className = 'notify ' + (type==='success' ? 'success' : (type==='error' ? 'error' : ''));
  el.innerHTML = `<div class="notify-body">${text}</div><button class="notify-close" aria-label="Fechar">✕</button>`;

  // fechar ao clicar no X
  el.querySelector('.notify-close').addEventListener('click', () => {
    hideNotify(el);
  });

  cont.appendChild(el);

  // auto remover
  setTimeout(()=> hideNotify(el), tempo);

  // show animation
  requestAnimationFrame(()=> el.classList.add('visible'));
}

function hideNotify(el){
  if(!el) return;
  el.classList.remove('visible');
  el.style.animation = 'notify-out .28s forwards';
  setTimeout(()=> el.remove(), 300);
}

/* simple webaudio beeps */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type='ok'){
  // resume context on user interaction (some browsers)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(()=>{/* ignore */});
  }

  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination);

  if(type==='ok'){
    o.frequency.value = 880;
    g.gain.value = 0.06;
  } else if(type==='bad'){
    o.frequency.value = 180;
    g.gain.value = 0.06;
  } else {
    o.frequency.value = 440;
    g.gain.value = 0.04;
  }

  o.type='sine';
  o.start();
  setTimeout(()=>{ try{ o.stop(); } catch(e){} }, 140);
}