// ⚠️ IMPORTANTE: Substitua pela URL do seu backend no Render
const BACKEND_URL = 'https://SEU-BACKEND.onrender.com/api/pizzas';

// Configuração
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutos
let historico = [];
let mainChart = null;

// Mapeamento das pizzarias
const PIZZARIAS = {
    dominos: 'Domino\'s Pizza',
    extreme: 'Extreme Pizza',
    district: 'District Pizza Palace',
    we_the_pizza: 'We, The Pizza',
    pizzero: 'Pizzero Pizza',
    papa_johns: 'Papa Johns Pizza'
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('🍕 Pentagon Pizza Index Monitor iniciado');
    inicializarGrafico();
    buscarDados();
    setInterval(buscarDados, UPDATE_INTERVAL);
});

// Buscar dados do backend
async function buscarDados() {
    try {
        console.log('🔍 Buscando dados...');

        const response = await fetch(BACKEND_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log('✅ Dados recebidos:', data);

        atualizarInterface(data);
        atualizarHistorico(data);

    } catch (erro) {
        console.error('❌ Erro ao buscar dados:', erro);
        mostrarErro();
    }
}

// Atualizar interface
function atualizarInterface(data) {
    // Atualizar índice principal
    const indice = calcularIndice(data.pizzarias);
    document.getElementById('pizza-index').textContent = indice.toFixed(2);

    // Atualizar status
    const statusElement = document.getElementById('index-status');
    if (data.temAnomalia) {
        statusElement.textContent = 'ANOMALIA DETECTADA';
        statusElement.className = 'index-status alert';
        document.getElementById('defcon-alert').classList.remove('hidden');
    } else {
        statusElement.textContent = 'Normal';
        statusElement.className = 'index-status normal';
        document.getElementById('defcon-alert').classList.add('hidden');
    }

    // Atualizar timestamp
    const agora = new Date().toLocaleString('pt-BR');
    document.getElementById('last-update').textContent = `Última atualização: ${agora}`;

    // Atualizar cada pizzaria
    Object.keys(data.pizzarias).forEach(key => {
        const pizzaria = data.pizzarias[key];
        const card = document.getElementById(key);

        if (card) {
            card.querySelector('.pizzaria-value').textContent = pizzaria.valor;

            const statusEl = card.querySelector('.pizzaria-status');
            if (pizzaria.anomalia) {
                statusEl.textContent = 'ANOMALIA';
                statusEl.className = 'pizzaria-status anomaly';
            } else {
                statusEl.textContent = 'Normal';
                statusEl.className = 'pizzaria-status normal';
            }
        }
    });
}

// Calcular índice agregado
function calcularIndice(pizzarias) {
    const valores = Object.values(pizzarias).map(p => p.valor);
    const soma = valores.reduce((a, b) => a + b, 0);
    return soma / valores.length;
}

// Atualizar histórico e gráfico
function atualizarHistorico(data) {
    const indice = calcularIndice(data.pizzarias);
    const timestamp = new Date().toLocaleTimeString('pt-BR');

    historico.push({
        timestamp,
        indice
    });

    // Manter apenas últimas 50 leituras
    if (historico.length > 50) {
        historico.shift();
    }

    atualizarGrafico();
}

// Inicializar gráfico
function inicializarGrafico() {
    const ctx = document.getElementById('main-chart');

    if (!ctx) {
        console.error('Canvas do gráfico não encontrado');
        return;
    }

    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Pentagon Pizza Index',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Índice'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Horário'
                    }
                }
            }
        }
    });
}

// Atualizar gráfico
function atualizarGrafico() {
    if (!mainChart) return;

    mainChart.data.labels = historico.map(h => h.timestamp);
    mainChart.data.datasets[0].data = historico.map(h => h.indice);
    mainChart.update();
}

// Mostrar erro
function mostrarErro() {
    document.getElementById('pizza-index').textContent = 'ERRO';
    document.getElementById('index-status').textContent = 'Erro ao carregar dados';
    document.getElementById('index-status').className = 'index-status warning';
}
