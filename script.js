const notas = {
    "E2": 82.41,
    "A2": 110.00,
    "D3": 146.83,
    "G3": 196.00,
    "B3": 246.94,
    "E4": 329.63
};

let audioContext;
let analyser;
let dataArray;
let running = false;

const statusElement = document.getElementById('status');
const frequencyElement = document.getElementById('frequency');
const noteElement = document.getElementById('note');
const pointerElement = document.getElementById('pointer');
const toggleButton = document.getElementById('toggle-btn');
const errorMsg = document.getElementById('error-msg');

toggleButton.addEventListener('click', () => {
    if (running) {
        pararAfinador();
    } else {
        iniciarAfinador();
    }
});

function iniciarAfinador() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioContext.createMediaStreamSource(stream);
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 2048;

                const bufferLength = analyser.fftSize;
                dataArray = new Float32Array(bufferLength);

                source.connect(analyser);
                statusElement.textContent = "Afinando...";
                errorMsg.textContent = ''; // Limpar mensagem de erro
                running = true;
                toggleButton.textContent = "Parar";

                detectarFrequencia();
            })
            .catch(error => {
                console.error('Erro ao acessar o microfone:', error);
                errorMsg.textContent = 'Erro ao acessar o microfone. Verifique as permissões.';
            });
    } else {
        errorMsg.textContent = 'Navegador não suporta acesso ao microfone.';
    }
}

function pararAfinador() {
    if (audioContext) {
        audioContext.close();
        statusElement.textContent = "Afinador parado.";
        toggleButton.textContent = "Iniciar";
        running = false;
    }
}

function detectarFrequencia() {
    if (!running) return;

    analyser.getFloatTimeDomainData(dataArray);

    const frequencia = calcularFrequencia(dataArray);
    if (frequencia !== null && isFinite(frequencia)) {
        const notaMaisProxima = obterNotaMaisProxima(frequencia);
        frequencyElement.textContent = `Frequência: ${frequencia.toFixed(2)} Hz`;
        noteElement.textContent = `Nota: ${notaMaisProxima || 'Desconhecida'}`;

        atualizarPonteiro(frequencia, notaMaisProxima);
    } else {
        frequencyElement.textContent = 'Frequência: -- Hz';
        noteElement.textContent = 'Nota: --';
    }

    requestAnimationFrame(detectarFrequencia);
}

function calcularFrequencia(buffer) {
    let maxCorr = 0;
    let bestOffset = -1;
    const rms = buffer.reduce((sum, val) => sum + val * val, 0) / buffer.length;

    if (rms < 0.01) return null; // Sem som detectado

    for (let offset = 1; offset < buffer.length / 2; offset++) {
        let corr = 0;

        for (let i = 0; i < buffer.length / 2; i++) {
            corr += buffer[i] * buffer[i + offset];
        }

        if (corr > maxCorr) {
            maxCorr = corr;
            bestOffset = offset;
        }
    }

    if (bestOffset > 0) {
        const freq = audioContext.sampleRate / bestOffset;
        return freq;
    }
    return null;
}

function obterNotaMaisProxima(frequencia) {
    let notaMaisProxima = null;
    let menorDiferenca = Infinity;

    for (const [nota, freqAlvo] of Object.entries(notas)) {
        const diferenca = Math.abs(frequencia - freqAlvo);
        if (diferenca < menorDiferenca) {
            menorDiferenca = diferenca;
            notaMaisProxima = nota;
        }
    }

    return notaMaisProxima;
}

function atualizarPonteiro(frequencia, nota) {
    const freqAlvo = notas[nota];
    if (!freqAlvo) return;

    const diferenca = frequencia - freqAlvo;
    const maxDif = 20; // Limite máximo de desvio em Hz
    const rotacao = Math.min(Math.max(diferenca / maxDif, -1), 1) * 45; // Rotação em graus

    pointerElement.style.transform = `rotate(${rotacao}deg)`;

    // Alterar cor do ponteiro dependendo da proximidade
    if (Math.abs(diferenca) < 1) {
        pointerElement.style.backgroundColor = 'green';
    } else {
        pointerElement.style.backgroundColor = 'red';
    }
}
