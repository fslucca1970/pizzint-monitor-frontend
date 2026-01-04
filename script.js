// ⚠️ IMPORTANTE: Substitua pela URL do seu backend no Render
const BACKEND_URL = 'https://seu-backend.onrender.com/api/pizzas';
const HISTORICO_URL = 'https://seu-backend.onrender.com/api/historico';

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
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🍕 Pentagon Pizza Index Monitor iniciado');
    inicializarGrafico();

    // Carregar histórico de 7 dias
    await carregarHistoricoInicial();

    // Buscar dados atuais
    await buscarDados();

    // Atualizar a cada 5 minutos
    setInterval(buscarDados, UPDATE_INTERVAL);
});

// ========================================
// CARREGAR HISTÓRICO INICIAL (7 DIAS)
// ========================================

async function carregarHistoricoInicial() {
    try {
        console.log('📚 Carregando histórico de 7 dias...');

        const response = await fetch(HISTORICO_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const payload = await response.json();
        const registros = payload.registros || [];

        console.log(`✅ Histórico carregado: ${registros.length} registros`);

        // Converter registros para formato do gráfico
        historico = registros.map(item => {
            const indice = calcularIndice(item.pizzarias);
            const data = new Date(item.timestamp);

            // Formato: "04/01 15:30"
            const label = data.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            return {
                timestamp: label,
                indice: parseFloat(indice.toFixed(2)),
                dados_completos: item
            };
        });

        // Atualizar gráfico com histórico
        atualizarGrafico();

    } catch (erro) {
        console.error('❌ Erro ao carregar histórico:', erro);
        document.getElementById('index-status').textContent = 'Erro ao carregar histórico';
        document.getElementById('index-status').className = 'index-status warning';
    }
}

// ========================================
// BUSCAR DADOS ATUAIS
// ========================================

async function buscarDados() {
    try {
        console.log('🔍 Buscando dados atuais...');

        const response = await fetch(BACKEND_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log('✅ Dados atuais recebidos:', data);

        atualizarInterface(data);

        // Adicionar novo ponto ao histórico
        const indice = calcularIndice(data.pizzarias);
        const agora = new Date();
        const label = agora.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        historico.push({
            timestamp: label,
            indice: parseFloat(indice.toFixed(2)),
            dados_completos: data
        });

        // Manter apenas últimas 288 leituras (5 min × 288 = 1 dia)
        if (historico.length > 288) {
            historico.shift();
        }

        atualizarGrafico();

    } catch (erro) {
        console.error('❌ Erro ao buscar dados:', erro);
        mostrarErro();
    }
}

// ========================================
// ATUALIZAR INTERFACE
// ========================================

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

// ========================================
// CALCULAR ÍNDICE AGREGADO
// ========================================

function calcularIndice(pizzarias) {
    const valores = Object.values(pizzarias).map(p => p.valor);
    const soma = valores.reduce((a, b) => a + b, 0);
    return soma / valores.length;
}

// ========================================
// INICIALIZAR GRÁFICO
// ========================================

function inicializarGrafico() {
    const ctx = document.getElementById('main-chart');

    if (!ctx) {
        console.error('❌ Canvas do gráfico não encontrado');
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
                fill: true,
                pointRadius: 3,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    callbacks: {
                        label: function(context) {
                            return 'Índice: ' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    min: 0,
                    max: 150,
                    title: {
                        display: true,
                        text: 'Índice',
                        font: { size: 12 }
                    },
                    grid: {
                        drawBorder: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Horário',
                        font: { size: 12 }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ========================================
// ATUALIZAR GRÁFICO
// ========================================

function atualizarGrafico() {
    if (!mainChart) return;

    mainChart.data.labels = historico.map(h => h.timestamp);
    mainChart.data.datasets[0].data = historico.map(h => h.indice);
    mainChart.update();
}

// ========================================
// MOSTRAR ERRO
// ========================================

function mostrarErro() {
    document.getElementById('pizza-index').textContent = 'ERRO';
    document.getElementById('index-status').textContent = 'Erro ao carregar dados';
    document.getElementById('index-status').className = 'index-status warning';
}
