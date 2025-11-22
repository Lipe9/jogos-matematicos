/* quiz.js (SEM RANKING) */
let quizStreak = 0;

function gerarPergunta(dificuldade){
  let max = dificuldade==='facil'?10: dificuldade==='medio'?30:80;
  const a = Math.floor(Math.random()*max);
  const b = Math.floor(Math.random()*max);
  const ops = ['+','-','*'];
  const op = ops[Math.floor(Math.random()*ops.length)];
  const resp = eval(`${a}${op}${b}`);
  return {enunciado:`${a} ${op} ${b} = ?`, resposta:resp};
}

function iniciarQuiz(){
  const dif = document.getElementById('quiz-dificuldade').value;
  const p = gerarPergunta(dif);
  const cont = document.getElementById('quiz-container');
  cont.innerHTML = `
    <h3>${p.enunciado}</h3>
    <input id="quiz-resposta" type="number" />
    <button class="btn" onclick="verificarQuiz(${p.resposta})">Responder</button>
  `;
  const msg = document.getElementById('quiz-msg'); if(msg) msg.textContent = '';
}

function verificarQuiz(correta){
  const r = parseInt(document.getElementById('quiz-resposta').value);
  const msgEl = document.getElementById('quiz-msg');
  const streakEl = document.getElementById('quiz-streak');

  if (r === correta){
    quizStreak++;
    if(msgEl){ msgEl.textContent = '✔ Acertou!'; msgEl.className = 'msg success'; }
    playSound('ok');
    notify('✔ Acertou!', 'success', 2000);
  } else {
    quizStreak = 0;
    if(msgEl){ msgEl.textContent = `❌ Errou! Resposta: ${correta}`; msgEl.className = 'msg error'; }
    playSound('bad');
    notify(`❌ Errou! Resposta: ${correta}`, 'error', 3000);
  }

  if(streakEl) streakEl.textContent = quizStreak;

  setTimeout(() => iniciarQuiz(), 550);
}
