// Definição das frequências padrão das cordas do violão (E2, A2, D3, G3, B3, E4)
const guitarStrings = {
    E4: 329.63, // Mi 1ª corda
    B3: 246.94, // Si 2ª corda
    G3: 196.00, // Sol 3ª corda
    D3: 146.83, // Ré 4ª corda
    A2: 110.00, // Lá 5ª corda
    E2: 82.41   // Mi 6ª corda
};

let audioContext;
let analyser;
let microphone;
let dataArray;
let rafId;

// Função para iniciar a captura do microfone
async function startMicrophone() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);

        dataArray = new Float32Array(analyser.fftSize);
        updateStatus("Microfone ativado. Afinador pronto!");

        detectPitch();
    } catch (err) {
        console.error("Erro ao acessar o microfone:", err);
        updateStatus("Erro ao acessar o microfone.");
    }
}

// Função para detectar a frequência do som
function detectPitch() {
    analyser.getFloatTimeDomainData(dataArray);
    const frequency = getFrequencyFromAudioData(dataArray);

    if (frequency && frequency > 50 && frequency < 500) { // Filtro para frequências válidas de notas de violão
        const closestNote = getClosestNoteFromFrequency(frequency);
        updateDetectedNote(closestNote, frequency);
    } else {
        updateDetectedNote("Nenhum som válido", "...");
    }

    rafId = requestAnimationFrame(detectPitch);
}

// Função para parar a detecção de som
function stopMicrophone() {
    if (rafId) {
        cancelAnimationFrame(rafId);
    }
    if (audioContext) {
        audioContext.close();
        updateStatus("Afinador parado.");
    }
}

// Função para obter a frequência do áudio (algoritmo básico)
function getFrequencyFromAudioData(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        sum += data[i] ** 2;
    }
    const rms = Math.sqrt(sum / data.length);
    if (rms < 0.01) return null; // Se o volume for muito baixo, ignore

    const bufferLength = analyser.fftSize;
    const sampleRate = audioContext.sampleRate;
    let bestOffset = -1;
    let bestCorrelation = 0;

    for (let offset = 0; offset < bufferLength; offset++) {
        let correlation = 0;
        for (let i = 0; i < bufferLength - offset; i++) {
            correlation += data[i] * data[i + offset];
        }

        if (correlation > bestCorrelation) {
            bestCorrelation = correlation;
            bestOffset = offset;
        }
    }

    if (bestOffset === -1 || bestCorrelation < 0.01) return null; // Se não houver uma boa correspondência, retorna null

    const frequency = sampleRate / bestOffset;
    return frequency;
}

// Função para obter a nota mais próxima com base na frequência
function getClosestNoteFromFrequency(frequency) {
    let closestNote = null;
    let minDiff = Infinity;

    for (const [note, freq] of Object.entries(guitarStrings)) {
        const diff = Math.abs(frequency - freq);
        if (diff < minDiff) {
            minDiff = diff;
            closestNote = note;
        }
    }

    return closestNote;
}

// Funções de interface de usuário
function updateStatus(message) {
    const statusEl = document.getElementById('status');
    if (statusEl) statusEl.textContent = message;
}

function updateDetectedNote(note, frequency) {
    const noteEl = document.getElementById('note-detected');
    if (noteEl) {
        noteEl.textContent = `${note} (${frequency} Hz)`;
    }
}

// Eventos de clique dos botões
document.getElementById('start-btn').addEventListener('click', startMicrophone);
document.getElementById('stop-btn').addEventListener('click', stopMicrophone);
