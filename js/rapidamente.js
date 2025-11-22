/* rapidamente.js (SEM RANKING) */
let rapidoPontos = 0;
let rapidoTempo = 30;
let rapidoInterval = null;
let rapidoStreak = 0;
let rapidoAtivo = false; // <-- impede continuar depois do tempo acabar

function novaConta(dif){
  let max = dif==='facil' ? 10 :
            dif==='medio' ? 40 : 100;

  const a = Math.floor(Math.random() * max);
  const b = Math.floor(Math.random() * max);
  const ops = ['+','-','*'];
  const op = ops[Math.floor(Math.random() * ops.length)];

  return {
    enunciado: `${a} ${op} ${b}`,
    resposta: eval(`${a} ${op} ${b}`)
  };
}

function iniciarRapidamente(){
  const dif = document.getElementById('rapido-dificuldade').value;

  rapidoPontos = 0;
  rapidoTempo = 30;
  rapidoStreak = 0;
  rapidoAtivo = true;

  clearInterval(rapidoInterval);
  atualizarRapidamente(dif);

  rapidoInterval = setInterval(() => {

    if (!rapidoAtivo) return;

    rapidoTempo--;

    const tempoSpan = document.querySelector('#rapido-container #tempo');
    if (tempoSpan) tempoSpan.textContent = rapidoTempo;

    if (rapidoTempo <= 0){
        rapidoAtivo = false;
        clearInterval(rapidoInterval);

        notify('⏳ Tempo esgotado! Pontos: ' + rapidoPontos, 'error', 4000);
        playSound('bad');

        // trava o jogo
        const cont = document.getElementById('rapido-container');
        cont.innerHTML += `<p style="color:#ff6b6b; margin-top:10px;"><strong>Fim do jogo!</strong></p>`;
    }

  }, 1000);
}

function atualizarRapidamente(dif){
  if (!rapidoAtivo) return; // evita continuar depois do fim

  const c = novaConta(dif);

  const cont = document.getElementById('rapido-container');
  cont.innerHTML = `
    <p><strong>Pontos:</strong> <span id="pontos">${rapidoPontos}</span></p>
    <p><strong>Tempo:</strong> <span id="tempo">${rapidoTempo}</span>s</p>

    <h3>${c.enunciado}</h3>

    <input id="resp-rapido" autofocus />
    <button class="btn" onclick="responderRapidamente(${c.resposta}, '${dif}')">OK</button>
  `;

  const msg = document.getElementById('rapido-msg');
  if(msg){
    msg.textContent = '';
    msg.className = 'msg';
  }

  const streak = document.getElementById('rapido-streak');
  if(streak) streak.textContent = rapidoStreak;
}

function responderRapidamente(correta, dif){
  if (!rapidoAtivo) return; // impede responder depois do tempo acabar

  const v = parseInt(document.getElementById('resp-rapido').value);
  const msgEl = document.getElementById('rapido-msg');

  if (v === correta){
    rapidoPontos++;
    rapidoStreak++;

    if(msgEl){
      msgEl.textContent = '✔ Acertou!';
      msgEl.className = 'msg success';
    }

    playSound('ok');
    notify('✔ Acertou!', 'success', 1200);

  } else {
    rapidoStreak = 0;

    if(msgEl){
      msgEl.textContent = '❌ Errou!';
      msgEl.className = 'msg error';
    }

    playSound('bad');
    notify('❌ Errou!', 'error', 1200);
  }

  const sEl = document.getElementById('rapido-streak');
  if(sEl) sEl.textContent = rapidoStreak;

  const pEl = document.querySelector('#rapido-container #pontos');
  if (pEl) pEl.textContent = rapidoPontos;

  // só troca a pergunta se o jogo ainda estiver ativo
  setTimeout(() => {
    if (rapidoAtivo) atualizarRapidamente(dif);
  }, 450);
}
