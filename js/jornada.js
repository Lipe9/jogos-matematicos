/* ======================================================
      JORNADA DOS NÚMEROS — SISTEMA COMPLETO
====================================================== */

let jornada = {
    fase: 1,
    xp: 0,
    hp: 20,
    hpMax: 20,
    inimigo: null,
    pergunta: null
};

// ------------------------------------------------------
// ATUALIZA PAINEL
// ------------------------------------------------------
function atualizarPainel() {
    document.getElementById("jornada-hero-hp").innerText = `${jornada.hp}/${jornada.hpMax}`;
    document.getElementById("jornada-hero-xp").innerText = jornada.xp;
    document.getElementById("jornada-phase").innerText = jornada.fase;
}

// ------------------------------------------------------
// GERAR INIMIGO
// ------------------------------------------------------
function gerarInimigo() {
    const nomes = ["Goblin Somador", "Troll da Tabuada", "Esqueleto Algébrico", "Orc Numeral", "Mago Subtrator"];
    const nome = nomes[Math.floor(Math.random() * nomes.length)];

    const hp = 10 + jornada.fase * 5;

    jornada.inimigo = {
        nome: nome,
        hp: hp,
        hpMax: hp
    };

    document.getElementById("jornada-enemy-name").innerText = nome;
    document.getElementById("jornada-enemy-hp").innerText = `${hp}/${hp}`;
}

// ------------------------------------------------------
// GERAR PERGUNTA COM DIFICULDADE ESCALÁVEL
// ------------------------------------------------------
function gerarPergunta() {
    const max = 10 + jornada.fase * 5;

    const a = Math.floor(Math.random() * max) + 1;
    const b = Math.floor(Math.random() * max) + 1;

    jornada.pergunta = {
        texto: `${a} + ${b}`,
        resposta: a + b
    };

    document.getElementById("jornada-question").innerText = "Desafio: " + jornada.pergunta.texto;
    document.getElementById("jornada-answer").value = "";
}

// ------------------------------------------------------
// LOG
// ------------------------------------------------------
function addLog(texto) {
    const log = document.getElementById("jornada-log");
    log.innerHTML += `<p>${texto}</p>`;
    log.scrollTop = log.scrollHeight;
}

// ------------------------------------------------------
// ENFRENTAR DESAFIO
// ------------------------------------------------------
function enfrentarDesafio() {
    gerarInimigo();
    gerarPergunta();
    addLog(`<strong>⚔ Novo inimigo apareceu:</strong> ${jornada.inimigo.nome}`);
}

// ------------------------------------------------------
// DESISTIR — AGORA FUNCIONA
// ------------------------------------------------------
function desistirFase() {
    addLog("❕ Você desistiu da fase. Um novo inimigo aparece...");
    enfrentarDesafio();
}

// ------------------------------------------------------
// RESPONDER
// ------------------------------------------------------
function responderJornada() {
    const resposta = Number(document.getElementById("jornada-answer").value);
    if (!jornada.pergunta) return;

    if (resposta === jornada.pergunta.resposta) {
        // ACERTOU
        jornada.inimigo.hp -= 10;
        document.getElementById("jornada-enemy-hp").innerText = 
            `${Math.max(jornada.inimigo.hp, 0)}/${jornada.inimigo.hpMax}`;

        addLog("✔ Acertou! Você causou 10 de dano.");

        // XP
        jornada.xp += 10 * jornada.fase;
        atualizarPainel();

        // Inimigo derrotado?
        if (jornada.inimigo.hp <= 0) {
            addLog(`🏆 Você derrotou **${jornada.inimigo.nome}**!`);
            jornada.fase++;
            atualizarPainel();
            enfrentarDesafio();
        } else {
            gerarPergunta();
        }

    } else {
        // ERROU
        jornada.hp -= 5;
        addLog("❌ Errou! Você levou 5 de dano.");
        atualizarPainel();

        if (jornada.hp <= 0) {
            addLog("💀 Você caiu em batalha! HP restaurado.");
            jornada.hp = jornada.hpMax;
            jornada.fase = 1;
            jornada.xp = 0;
            atualizarPainel();
        }

        gerarPergunta();
    }
}

// ------------------------------------------------------
// INICIALIZA TUDO
// ------------------------------------------------------
atualizarPainel();
addLog("Aguardando desafio...");

// Permite responder usando ENTER
document.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        const campo = document.activeElement;

        // só responde se o foco estiver no input da jornada
        if (campo && campo.id === "jornada-answer") {
            responderJornada();
        }
    }
});
