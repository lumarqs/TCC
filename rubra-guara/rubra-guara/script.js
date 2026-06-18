// script.js - Lógica compartilhada para camera.html
// Este arquivo gerencia a câmera, carrega o modelo TensorFlow.js e classifica imagens de aves.

// ============================
// CONSTANTES
// ============================
const CLASSES = [
  'Guarás',
  'Guaiamim',
  'Mangue-Maçã',
  'Colhereiro',
  'Martim-Pescador',
  'Ambiente'
];

const MODEL_PATH = '/model/model.json';
const IMAGE_SIZE = 224; // Tamanho esperado de entrada pelo modelo
const TOP_K = 3; // Número de classes a exibir nos resultados

// ============================
// ELEMENTOS DO DOM
// ============================
let videoElement;
let btnCapture;
let btnToggle;
let statusMessage;
let loadingOverlay;
let loadingText;
let spinnerIcon;
let resultContainer;
let canvasFallback;

// ============================
// VARIÁVEIS DE ESTADO
// ============================
let model = null;
let currentStream = null;
let facingMode = 'environment'; // 'environment' = traseira, 'user' = frontal
let isProcessing = false;

// ============================
// INICIALIZAÇÃO DO DOM
// ============================
function cacheDOMElements() {
  videoElement = document.getElementById('video');
  btnCapture = document.getElementById('btn-capture');
  btnToggle = document.getElementById('btn-toggle');
  statusMessage = document.getElementById('status-message');
  loadingOverlay = document.getElementById('loading-overlay');
  loadingText = document.getElementById('loading-text');
  spinnerIcon = document.getElementById('spinner-icon');
  resultContainer = document.getElementById('result-container');
  canvasFallback = document.createElement('canvas');
  canvasFallback.id = 'capture-canvas';
  canvasFallback.style.display = 'none';
  document.body.appendChild(canvasFallback);
}

// ============================
// STATUS E LOADING
// ============================
function setStatus(message, type = 'info') {
  if (!statusMessage) return;
  statusMessage.textContent = message;
  statusMessage.className = `status-message status-${type}`;
  // Anúncia para leitores de tela
  statusMessage.setAttribute('aria-live', 'polite');
}

function showLoading(message) {
  if (!loadingOverlay || !loadingText) return;
  loadingText.textContent = message || 'Carregando...';
  loadingOverlay.classList.remove('hidden');
  if (spinnerIcon) {
    spinnerIcon.classList.add('spin');
  }
}

function hideLoading() {
  if (!loadingOverlay) return;
  loadingOverlay.classList.add('hidden');
  if (spinnerIcon) {
    spinnerIcon.classList.remove('spin');
  }
}

// ============================
// CARREGAMENTO DO MODELO
// ============================
async function loadModel() {
  if (model) return model;

  showLoading('Carregando modelo de inteligência artificial...');
  setStatus('Inicializando modelo TensorFlow.js', 'info');

  try {
    if (typeof tf === 'undefined') {
      throw new Error('Biblioteca TensorFlow.js não foi carregada. Verifique a conexão ou os scripts.');
    }

    // Força o backend WebGL para melhor desempenho, com fallback para CPU
    try {
      await tf.setBackend('webgl');
      await tf.ready();
    } catch (backendErr) {
      console.warn('WebGL não disponível, tentando CPU:', backendErr);
      await tf.setBackend('cpu');
      await tf.ready();
    }

    model = await tf.loadLayersModel(MODEL_PATH);
    setStatus('Modelo carregado com sucesso!', 'success');
    return model;
  } catch (error) {
    console.error('Erro ao carregar modelo:', error);
    setStatus('Falha ao carregar modelo: ' + error.message, 'error');
    throw error;
  } finally {
    hideLoading();
  }
}

// ============================
// INICIALIZAÇÃO DA CÂMERA
// ============================
async function initCamera() {
  // Libera o stream anterior, se existir
  if (currentStream) {
    currentStream.getTracks().forEach((track) => {
      track.stop();
    });
    currentStream = null;
  }

  showLoading(`Iniciando câmera ${facingMode === 'environment' ? 'traseira' : 'frontal'}...`);
  setStatus('Solicitando permissão de câmera', 'info');

  try {
    const constraints = {
      audio: false,
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    if (videoElement) {
      videoElement.srcObject = currentStream;
    }

    setStatus(`Câmera ${facingMode === 'environment' ? 'traseira' : 'frontal'} ativa`, 'success');
  } catch (error) {
    console.warn('Erro ao acessar câmera ideal:', error);

    // Fallback: tenta qualquer câmera disponível
    try {
      const fallbackConstraints = {
        audio: false,
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }
      };
      currentStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      if (videoElement) {
        videoElement.srcObject = currentStream;
      }
      setStatus('Câmera ativa com configuração padrão', 'success');
    } catch (fallbackError) {
      console.error('Erro no fallback da câmera:', fallbackError);
      setStatus('Não foi possível acessar a câmera. Verifique as permissões.', 'error');
      throw fallbackError;
    }
  } finally {
    hideLoading();
  }
}

// ============================
// PRÉ-PROCESSAMENTO DA IMAGEM
// ============================
function preprocessImage(videoElement) {
  if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
    throw new Error('Vídeo não está pronto para captura.');
  }

  // Canvas temporário para redimensionar o frame da câmera
  const canvas = document.getElementById('capture-canvas');
  canvas.width = IMAGE_SIZE;
  canvas.height = IMAGE_SIZE;
  const ctx = canvas.getContext('2d');

  // Desenha o frame redimensionado para 224x224
  ctx.drawImage(videoElement, 0, 0, IMAGE_SIZE, IMAGE_SIZE);

  // Converte o canvas para tensor, normaliza para [0, 1] e expande dimensão do batch
  const tensor = tf.browser
    .fromPixels(canvas, 3)
    .toFloat()
    .div(tf.scalar(255.0))
    .expandDims(0);

  return tensor;
}

// ============================
// CAPTURA E CLASSIFICAÇÃO
// ============================
async function captureAndClassify() {
  if (!model) {
    setStatus('Modelo ainda não está pronto. Aguarde...', 'warning');
    return;
  }

  if (isProcessing) {
    setStatus('Já existe uma classificação em andamento.', 'warning');
    return;
  }

  if (!currentStream || !currentStream.active) {
    setStatus('Câmera não está ativa. Tente alternar a câmera.', 'error');
    return;
  }

  isProcessing = true;
  showLoading('Analisando imagem...');
  btnCapture.disabled = true;
  btnToggle.disabled = true;
  setStatus('Capturando e classificando imagem', 'info');

  let inputTensor = null;
  let predictionTensor = null;

  try {
    inputTensor = preprocessImage(videoElement);

    // Executa a predição de forma assíncrona
    predictionTensor = model.predict(inputTensor);

    // Converte o resultado para array JavaScript
    const probabilities = await predictionTensor.data();

    // Prepara resultados com nome, probabilidade e índice original
    const results = Array.from(probabilities).map((prob, index) => ({
      className: CLASSES[index] || `Classe ${index}`,
      probability: prob,
      originalIndex: index
    }));

    // Ordena por maior probabilidade e pega os TOP_K
    results.sort((a, b) => b.probability - a.probability);
    const topResults = results.slice(0, TOP_K);

    // Renderiza os resultados na tela
    renderResults(topResults);

    setStatus(
      `Classificação concluída: ${topResults[0].className} (${(topResults[0].probability * 100).toFixed(1)}%)`,
      'success'
    );
  } catch (error) {
    console.error('Erro na classificação:', error);
    setStatus('Erro ao classificar imagem: ' + error.message, 'error');
  } finally {
    // Libera tensores para evitar vazamento de memória
    if (inputTensor) {
      inputTensor.dispose();
    }
    if (predictionTensor) {
      predictionTensor.dispose();
    }

    isProcessing = false;
    btnCapture.disabled = false;
    btnToggle.disabled = false;
    hideLoading();
  }
}

// ============================
// RENDERIZAÇÃO DOS RESULTADOS
// ============================
function renderResults(results) {
  if (!resultContainer) return;

  resultContainer.innerHTML = '';

  results.forEach((result, index) => {
    const percentage = (result.probability * 100).toFixed(1);
    const isWinner = index === 0;

    const row = document.createElement('div');
    row.className = `result-row ${isWinner ? 'result-winner' : ''}`;

    const label = document.createElement('span');
    label.className = 'result-label';
    label.textContent = result.className;

    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container';

    const bar = document.createElement('div');
    bar.className = 'bar-fill';
    bar.style.width = '0%';

    const value = document.createElement('span');
    value.className = 'result-value';
    value.textContent = `${percentage}%`;

    barContainer.appendChild(bar);
    row.appendChild(label);
    row.appendChild(barContainer);
    row.appendChild(value);

    resultContainer.appendChild(row);

    // Animação suave da barra após adicionar ao DOM
    requestAnimationFrame(() => {
      bar.style.width = `${percentage}%`;
    });
  });
}

// ============================
// ALTERNAR CÂMERA
// ============================
async function toggleCamera() {
  if (isProcessing) {
    setStatus('Aguarde a classificação atual terminar.', 'warning');
    return;
  }

  // Alterna o facingMode
  facingMode = facingMode === 'environment' ? 'user' : 'environment';

  // Reinicia a câmera com o novo facingMode
  await initCamera();

  // Atualiza texto do botão, se desejado
  if (btnToggle) {
    btnToggle.textContent = facingMode === 'environment' ? 'Usar câmera frontal' : 'Usar câmera traseira';
  }
}

// ============================
// EVENT LISTENERS
// ============================
function bindEvents() {
  if (btnCapture) {
    btnCapture.addEventListener('click', captureAndClassify);
  }

  if (btnToggle) {
    btnToggle.addEventListener('click', toggleCamera);
  }

  // Tratamento de erros de mídia do vídeo
  if (videoElement) {
    videoElement.addEventListener('error', (event) => {
      console.error('Erro no elemento de vídeo:', event);
      setStatus('Erro no fluxo de vídeo. Tente reiniciar a câmera.', 'error');
    });
  }

  // Libera recursos ao sair da página
  window.addEventListener('beforeunload', () => {
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
    }
  });
}

// ============================
// INICIALIZAÇÃO PRINCIPAL
// ============================
async function initializeApp() {
  cacheDOMElements();

  if (!videoElement || !btnCapture || !btnToggle) {
    console.error('Elementos essenciais do DOM não encontrados. Verifique o HTML.');
    return;
  }

  // Verifica suporte à API de câmera
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus('Seu dispositivo não suporta acesso à câmera.', 'error');
    return;
  }

  bindEvents();

  try {
    await loadModel();
    await initCamera();
  } catch (error) {
    console.error('Falha na inicialização:', error);
  }
}

// ============================
// IIFE / DOMContentLoaded
// ============================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}