// Frequências base das notas para afinação padrão EADGBE
const notas = {
    "E2": 82.41,
    "F2": 87.31,
    "F#2": 92.50,
    "G2": 98.00,
    "G#2": 103.83,
    "A2": 110.00,
    "A#2": 116.54,
    "B2": 123.47,
    "C3": 130.81,
    "C#3": 138.59,
    "D3": 146.83,
    "D#3": 155.56,
    "E3": 164.81,
    "F3": 174.61,
    "F#3": 185.00,
    "G3": 196.00,
    "G#3": 207.65,
    "A3": 220.00,
    "A#3": 233.08,
    "B3": 246.94,
    "C4": 261.63,
    "C#4": 277.18,
    "D4": 293.66,
    "D#4": 311.13,
    "E4": 329.63,
    "F4": 349.23,
    "F#4": 369.99,
    "G4": 392.00,
    "G#4": 415.30,
    "A4": 440.00
};

// Função que identifica a nota mais próxima com base na frequência detectada
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

// Atualiza o ponteiro e exibe o desvio da frequência
function atualizarPonteiro(frequencia, nota) {
    const freqAlvo = notas[nota];
    if (!freqAlvo) return;

    const diferenca = frequencia - freqAlvo;
    const maxDif = 25; // Limite máximo de desvio em Hz
    const rotacao = Math.min(Math.max(diferenca / maxDif, -1), 1) * 45; // Rotação em graus

    pointerElement.style.transform = `rotate(${rotacao}deg)`;

    // Alterar cor do ponteiro dependendo da proximidade
    if (Math.abs(diferenca) < 1) {
        pointerElement.style.backgroundColor = 'green';
    } else {
        pointerElement.style.backgroundColor = 'red';
    }
}

// Função que compara a frequência capturada com a frequência padrão
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

// Função que calcula a frequência baseada na entrada do microfone
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
