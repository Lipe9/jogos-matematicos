/* sudoku.js – versão robusta com sanitização de input e feedback visual */

let sudokuCompleto = [];
let sudokuInicial = [];
let sudokuTimer = null;
let sudokuSeconds = 0;

/* === GERA TABULEIRO VAZIO === */
function gerarTabuleiroVazio() {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

/* === PREENCHE SUDOKU (BACKTRACKING) === */
function preencherSudoku(grid) {

  function ehValido(r, c, n) {
    for (let i = 0; i < 9; i++) {
      if (grid[r][i] === n || grid[i][c] === n) return false;
    }
    const br = r - (r % 3);
    const bc = c - (c % 3);
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        if (grid[br + i][bc + j] === n) return false;
    return true;
  }

  function solve(pos = 0) {
    if (pos === 81) return true;
    const r = Math.floor(pos / 9), c = pos % 9;
    if (grid[r][c] !== 0) return solve(pos + 1);
    const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
    for (const n of nums) {
      if (ehValido(r, c, n)) {
        grid[r][c] = n;
        if (solve(pos + 1)) return true;
      }
    }
    grid[r][c] = 0;
    return false;
  }

  solve();
}

/* === REMOVE NÚMEROS PARA DIFICULDADE === */
function removerParaDificuldade(grid, dif) {
  let remover = dif === "facil" ? 40 : dif === "medio" ? 50 : 60;
  while (remover > 0) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    if (grid[r][c] !== 0) {
      grid[r][c] = 0;
      remover--;
    }
  }
}

/* === GERAR SUDOKU === */
function gerarSudoku() {
  stopSudokuTimer();
  sudokuSeconds = 0;

  const difEl = document.getElementById("sudoku-dificuldade");
  const dif = difEl ? difEl.value : "medio";

  const g = gerarTabuleiroVazio();
  preencherSudoku(g);
  sudokuCompleto = JSON.parse(JSON.stringify(g));

  removerParaDificuldade(g, dif);
  sudokuInicial = JSON.parse(JSON.stringify(g));

  renderSudoku(g);
  startSudokuTimer();

  const msg = document.getElementById("sudoku-msg"); 
  if (msg) msg.textContent = "";
  
  const status = document.getElementById("sudoku-status"); 
  if (status) status.textContent = "Boa sorte!";
}

/* === RENDERIZA GRID (com sanitização) === */
function renderSudoku(grid) {
  const cont = document.getElementById("sudoku-container");
  cont.innerHTML = "";

  grid.forEach((linha, r) => {
    linha.forEach((val, c) => {
      const inp = document.createElement("input");

      inp.type = "tel";
      inp.inputMode = "numeric";
      inp.pattern = "[1-9]";
      inp.maxLength = 1;

      inp.dataset.row = r;
      inp.dataset.col = c;
      inp.classList.remove("incorrect");

      if (val !== 0) {
        inp.value = String(val);
        inp.disabled = true;
        inp.classList.add("given");
      } else {
        inp.value = "";
        inp.disabled = false;

        inp.addEventListener("input", (e) => {
          const v = e.target.value.replace(/[^1-9]/g, "").slice(0,1);
          e.target.value = v;
          e.target.classList.remove("incorrect");
        });

        inp.addEventListener("paste", (e) => {
          e.preventDefault();
          const paste = (e.clipboardData || window.clipboardData)
            .getData("text")
            .replace(/[^1-9]/g, "");
          if (paste && paste.length) inp.value = paste[0];
        });

        inp.addEventListener("keydown", (e) => {
          const key = e.key;
          if (key === "ArrowRight") { focusNeighbor(r, c+1); e.preventDefault(); }
          if (key === "ArrowLeft")  { focusNeighbor(r, c-1); e.preventDefault(); }
          if (key === "ArrowUp")    { focusNeighbor(r-1, c); e.preventDefault(); }
          if (key === "ArrowDown")  { focusNeighbor(r+1, c); e.preventDefault(); }
        });
      }

      cont.appendChild(inp);
    });
  });
}

/* foco seguro na célula vizinha */
function focusNeighbor(r, c) {
  if (r < 0 || r > 8 || c < 0 || c > 8) return;
  const selector = `#sudoku-container input[data-row="${r}"][data-col="${c}"]`;
  const el = document.querySelector(selector);
  if (el && !el.disabled) el.focus();
}

/* === TIMER === */
function startSudokuTimer() {
  stopSudokuTimer();
  sudokuSeconds = 0;

  const timerEl = document.getElementById("sudoku-timer");
  if (timerEl) timerEl.textContent = formatTime(sudokuSeconds);

  // Timer Fullscreen também inicia zerado
  const timerFull = document.getElementById("sudoku-timer-full");
  if (timerFull) timerFull.textContent = formatTime(sudokuSeconds);

  sudokuTimer = setInterval(() => {
    sudokuSeconds++;

    // Atualiza timer normal
    if (timerEl) timerEl.textContent = formatTime(sudokuSeconds);

    // Atualiza timer fullscreen sincronizado
    const timerFullLive = document.getElementById("sudoku-timer-full");
    if (timerFullLive) timerFullLive.textContent = formatTime(sudokuSeconds);

  }, 1000);
}

function stopSudokuTimer() {
  if (sudokuTimer) clearInterval(sudokuTimer);
  sudokuTimer = null;
}

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

/* === CORRIGIR SUDOKU === */
function corrigirSudoku() {
  stopSudokuTimer();

  const inputs = Array.from(document.querySelectorAll("#sudoku-container input"));
  let erros = 0;

  inputs.forEach(inp => {
    inp.classList.remove("incorrect");
    const r = Number(inp.dataset.row);
    const c = Number(inp.dataset.col);
    const vStr = inp.value.trim();

    if (vStr === "") {
      erros++;
      inp.classList.add("incorrect");
      return;
    }

    const v = Number(vStr);
    if (v !== sudokuCompleto[r][c]) {
      erros++;
      inp.classList.add("incorrect");
    }
  });

  const msg = document.getElementById("sudoku-msg");

  if (erros === 0) {
    if (msg) { 
      msg.textContent = `✔ Sudoku concluído! Tempo: ${formatTime(sudokuSeconds)}`;
      msg.className = "msg success"; 
    }
    if (typeof notify === "function") notify("🎉 Parabéns! Sudoku perfeito!");
  } else {
    if (msg) { 
      msg.textContent = `❌ Há ${erros} erro(s).`; 
      msg.className = "msg error"; 
    }
    if (typeof notify === "function") notify(`⚠ Existem ${erros} erro(s).`, "error");

    const firstWrong = document.querySelector("#sudoku-container input.incorrect");
    if (firstWrong) firstWrong.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

/* === FULLSCREEN === */
let fullscreenAtivo = false;

function toggleFullscreen() {
  const area = document.getElementById("sudoku");
  const headerFS = document.getElementById("fullscreen-top");
  const timerNormal = document.getElementById("sudoku-timer");
  const timerFull = document.getElementById("sudoku-timer-full");

  if (!fullscreenAtivo) {
    area.classList.add("sudoku-fullscreen");
    headerFS.style.display = "flex";

    // Copiar o tempo atual para o timer fullscreen
    timerFull.textContent = timerNormal.textContent;

    fullscreenAtivo = true;

    setTimeout(() => window.scrollTo(0, 0), 50);

  } else {
    area.classList.remove("sudoku-fullscreen");
    headerFS.style.display = "none";

    fullscreenAtivo = false;
  }
}
