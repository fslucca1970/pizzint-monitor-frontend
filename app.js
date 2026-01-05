const API_URL = "https://pizzint-monitor-backend.onrender.com/api/atual";

const PIZZARIAS = [
    { id: "domino_s_pizza", nome: "Domino's Pizza" },
    { id: "extreme_pizza", nome: "Extreme Pizza" },
    { id: "district_pizza_palace", nome: "District Pizza Palace" },
    { id: "we__the_pizza", nome: "We, the Pizza" },
    { id: "pizzato_pizza", nome: "Pizzato Pizza" },
    { id: "papa_john_s_pizza", nome: "Papa John's Pizza" }
];

function criarCards() {
    const container = document.getElementById("cards-container");
    container.innerHTML = "";

    PIZZARIAS.forEach(pizzaria => {
        const card = document.createElement("div");
        card.className = "card";
        card.id = `card-${pizzaria.id}`;
        card.innerHTML = `
            <div class="nome">${pizzaria.nome}</div>
            <div class="info">
                <span class="label">Movimento Atual</span>
                <span class="movimento">--</span>
            </div>
            <div class="status">Carregando...</div>
        `;
        container.appendChild(card);
    });
}

async function carregarDados() {
    try {
        const resposta = await fetch(API_URL);

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        const dados = await resposta.json();

        if (!dados || !dados.pizzarias) {
            throw new Error("Dados inválidos recebidos da API");
        }

        // Atualiza status geral
        document.getElementById("status-geral").innerText = "ONLINE";
        document.getElementById("status-geral").style.color = "#2e7d32";

  document.getElementById("atualizacao").innerText = 
    "Hora Local: " + new Date(dados.timestamp).toLocaleString("pt-BR", {
        timeZone: "America/New_York"
    });


        // Limpa mensagem de erro
        document.getElementById("erro-container").innerHTML = "";

        // Atualiza cada card
        PIZZARIAS.forEach(pizzaria => {
            const dadosPizzaria = dados.pizzarias[pizzaria.id];

            if (!dadosPizzaria) return;

            const card = document.getElementById(`card-${pizzaria.id}`);
            if (!card) return;

            // Movimento atual
            let movimento = "--";
            if (dadosPizzaria.movimento_atual) {
                if (typeof dadosPizzaria.movimento_atual === 'object') {
                    movimento = dadosPizzaria.movimento_atual.current_popularity !== null 
                        ? dadosPizzaria.movimento_atual.current_popularity + "%" 
                        : "--";
                } else {
                    movimento = dadosPizzaria.movimento_atual + "%";
                }
            }

            card.querySelector(".movimento").innerText = movimento;

            // Status com cores
            let statusTexto = "Normal";
            let cor = "#2e7d32"; // verde

            if (dadosPizzaria.status === "QUIET") {
                statusTexto = "Quieto";
                cor = "#0277bd"; // azul
            } else if (dadosPizzaria.status === "SPIKE") {
                statusTexto = "Alto Movimento";
                cor = "#c62828"; // vermelho
            } else if (dadosPizzaria.status === "NOMINAL") {
                statusTexto = "Normal";
                cor = "#2e7d32"; // verde
            }

            const statusElement = card.querySelector(".status");
            statusElement.innerText = statusTexto;
            statusElement.style.color = cor;
            statusElement.style.borderLeft = `4px solid ${cor}`;
        });

    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);

        document.getElementById("status-geral").innerText = "OFFLINE";
        document.getElementById("status-geral").style.color = "#c62828";

        document.getElementById("erro-container").innerHTML = `
            <div class="erro">
                <strong>⚠️ Erro ao carregar dados</strong>
                <p style="margin-top: 10px;">${erro.message}</p>
                <p style="margin-top: 10px; font-size: 0.9em;">Tentando novamente em 60 segundos...</p>
            </div>
        `;
    }
}

// Inicialização
criarCards();
carregarDados();
setInterval(carregarDados, 60000); // Atualiza a cada 60 segundos
