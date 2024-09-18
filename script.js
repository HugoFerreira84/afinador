let audioContext;
let analyser;
let dataArray;
let microphone;
let isTuning = false;

const frequencies = {
    E2: 82.41,
    A2: 110.00,
    D3: 146.83,
    G3: 196.00,
    B3: 246.94,
    E4: 329.63
};

document.getElementById('start-button').addEventListener('click', startTuner);
document.getElementById('stop-button').addEventListener('click', stopTuner);

// Função para iniciar o afinador
function startTuner() {
    if (isTuning) return;
    isTuning = true;

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    dataArray = new Float32Array(analyser.fftSize);

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function (stream) {
            microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            detectPitch();
        })
        .catch(function (error) {
            console.error('Erro ao acessar o microfone:', error);
            document.getElementById('status').textContent = 'Erro ao acessar o microfone.';
        });
}

// Função para parar o afinador
function stopTuner() {
    if (!isTuning) return;
    isTuning = false;

    if (microphone) {
        microphone.disconnect();
    }
    if (audioContext) {
        audioContext.close();
    }
    
    document.getElementById('status').textContent = 'Afinador parado.';
}

// Função para detectar pitch
function detectPitch() {
    if (!isTuning) return;

    analyser.getFloatTimeDomainData(dataArray);

    const pitch = getFrequencyFromAudioData(dataArray);
    const closestNote = getClosestNoteFromFrequency(pitch);

    document.getElementById('note-detected').textContent = `Nota: ${closestNote}`;
    document.getElementById('frequency-detected').textContent = `Frequência: ${pitch.toFixed(2)} Hz`;

    requestAnimationFrame(detectPitch);
}

// Função fictícia para calcular frequência
function getFrequencyFromAudioData(data) {
    // Algoritmo real para detectar a frequência (usando autocorrelation ou similar)
    return Math.random() * 400;  // Exemplo temporário
}

// Função para encontrar a nota mais próxima
function getClosestNoteFromFrequency(frequency) {
    let closestNote = null;
    let closestFreqDiff = Infinity;

    for (const [note, freq] of Object.entries(frequencies)) {
        const diff = Math.abs(frequency - freq);
        if (diff < closestFreqDiff) {
            closestFreqDiff = diff;
            closestNote = note;
        }
    }

    return closestNote || 'Indefinido';
}
