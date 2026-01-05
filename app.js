const API_URL = "https://pizzint-monitor-backend.onrender.com/api/atual";

async function carregarDados() {
    try {
        const resposta = await fetch(API_URL);
        const dados = await resposta.json();

        if (!dados || !dados.pizzarias) {
            throw new Error("Dados inválidos");
        }

        document.getElementById("status-geral").innerText = "ONLINE";
        document.getElementById("atualizacao").innerText =
            new Date(dados.timestamp).toLocaleString("pt-BR");

        for (const [key, pizzaria] of Object.entries(dados.pizzarias)) {

            const card = document.getElementById(`card-${key}`);
            if (!card) continue;

            // Nome
            card.querySelector(".nome").innerText = pizzaria.nome;

            // Movimento atual
            let movimento = "--";
            if (pizzaria.movimento_atual && pizzaria.movimento_atual.current_popularity !== null) {
                movimento = pizzaria.movimento_atual.current_popularity + "%";
            }

            card.querySelector(".movimento").innerText = movimento;

            // Status com cor consistente com pizzint
            let statusTexto = "Normal";
            let cor = "#2e7d32"; // verde

            if (pizzaria.status === "QUIET") {
                statusTexto = "Quieto";
                cor = "#0277bd"; // azul
            }
            if (pizzaria.status === "SPIKE") {
                statusTexto = "Alto Movimento";
                cor = "#c62828"; // vermelho
            }

            card.querySelector(".status").innerText = statusTexto;
            card.querySelector(".status").style.color = cor;
        }

    } catch (erro) {
        console.error("Erro carregando dados:", erro);
        document.getElementById("status-geral").innerText = "ERRO";
        document.getElementById("botao-erro").style.display = "inline-block";
    }
}

carregarDados();
setInterval(carregarDados, 60000);
