const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const PORT = 3000;

// Servir arquivos estáticos da pasta 'model/' (raiz do projeto) para que
// o TensorFlow.js possa carregar /model/model.json e seus binários
app.use(express.static('model'));

// Servir a pasta 'certs' também pode ser útil em alguns casos,
// mas não é obrigatório para o funcionamento do app.
// A pasta certs/ deve conter key.pem e cert.pem.

// Página HTML inline com câmera e TensorFlow.js
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Classificador de Aves com TensorFlow.js</title>
  <!-- TensorFlow.js CDN compatível com Chrome, Safari, Firefox, iOS e Android -->
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #f4f7f9;
      margin: 0;
      padding: 16px;
      text-align: center;
      color: #333;
    }
    h1 { margin-top: 0; font-size: 1.5rem; }
    .container { max-width: 600px; margin: 0 auto; }
    #video, #canvas { width: 100%; max-width: 400px; border-radius: 12px; margin-top: 12px; }
    #video { background: #000; display: block; margin-left: auto; margin-right: auto; }
    #canvas { display: none; margin-left: auto; margin-right: auto; }
    .btn {
      background: #007bff;
      color: #fff;
      border: none;
      padding: 14px 28px;
      font-size: 1.1rem;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 16px;
      width: 100%;
      max-width: 400px;
    }
    .btn:disabled { background: #6c757d; cursor: not-allowed; }
    .status {
      margin-top: 12px;
      font-size: 0.95rem;
      color: #555;
      min-height: 1.5em;
    }
    .results { margin-top: 18px; text-align: left; max-width: 400px; margin-left: auto; margin-right: auto; }
    .class-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 14px; margin-bottom: 8px; background: #fff;
      border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .class-row.best { background: #d4edda; border: 2px solid #28a745; color: #155724; font-weight: bold; }
    .class-name { text-transform: capitalize; }
    .class-bar { flex: 1; height: 8px; background: #e9ecef; border-radius: 4px; margin: 0 10px; overflow: hidden; }
    .class-fill { height: 100%; background: #28a745; width: 0%; transition: width 0.4s ease; }
    .class-value { min-width: 44px; text-align: right; }
    .footer { margin-top: 24px; font-size: 0.8rem; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Classificador de Aves</h1>
    <p>Posicione a ave na câmera e toque em "Capturar".</p>

    <!-- Vídeo ao vivo da câmera -->
    <video id="video" autoplay playsinline muted></video>
    <!-- Canvas oculto usado para processar o frame capturado -->
    <canvas id="canvas" width="224" height="224"></canvas>

    <div>
      <button id="btn-capture" class="btn" disabled>Capturar</button>
    </div>

    <div id="status" class="status">Inicializando câmera e modelo...</div>

    <div id="results" class="results"></div>

    <div class="footer">Modelo local: /model/model.json · 6 classes</div>
  </div>

  <script>
    // Nomes das 6 classes, na ordem esperada pelo modelo.
    const CLASSES = [
      'Guarás',
      'Guaiamim',
      'Mangue-Maçã',
      'Colhereiro',
      'Martim-Pescador',
      'Ambiente'
    ];

    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const btnCapture = document.getElementById('btn-capture');
    const statusEl = document.getElementById('status');
    const resultsEl = document.getElementById('results');

    let model = null;
    let isProcessing = false;

    // Inicializa câmera e modelo em paralelo.
    async function init() {
      try {
        await startCamera();
        await loadModel();
        btnCapture.disabled = false;
        statusEl.textContent = 'Pronto! Toque em "Capturar" para classificar.';
      } catch (err) {
        console.error(err);
        statusEl.textContent = 'Erro: ' + err.message;
      }
    }

    // Acessa a câmera traseira (mobile) ou a webcam padrão, com constraints
    // que funcionam em iOS Safari e Android Chrome.
    async function startCamera() {
      const constraints = {
        audio: false,
        video: {
          facingMode: 'environment', // câmera traseira no celular
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });
    }

    // Carrega o modelo TensorFlow.js local salvo em /model/model.json.
    // O servidor Express serve os arquivos de model/ como estáticos na raiz.
    async function loadModel() {
      statusEl.textContent = 'Carregando modelo TensorFlow.js...';
      model = await tf.loadLayersModel('/model.json');
      statusEl.textContent = 'Modelo carregado. Aguardando câmera...';
      // Warm-up: executa uma predição dummy para acelerar a primeira classificação.
      const dummy = tf.zeros([1, 224, 224, 3]);
      model.predict(dummy).dispose();
      dummy.dispose();
    }

    // Captura o frame atual do vídeo, redimensiona para 224x224, normaliza
    // para [0, 1] e executa a predição.
    async function classify() {
      if (!model || isProcessing) return;
      isProcessing = true;
      btnCapture.disabled = true;
      statusEl.textContent = 'Classificando...';

      const ctx = canvas.getContext('2d');
      // Desenha o frame do vídeo no canvas de 224x224.
      ctx.drawImage(video, 0, 0, 224, 224);

      // Lê os pixels do canvas e converte para tensor.
      const imageTensor = tf.browser.fromPixels(canvas);

      // Normaliza de [0, 255] para [0, 1] e expande a dimensão do batch (1, 224, 224, 3).
      const input = tf.expandDims(tf.div(imageTensor, 255.0), 0);

      // Executa a predição.
      const prediction = model.predict(input);
      const scores = await prediction.data();

      // Libera memória da GPU/WebGL.
      imageTensor.dispose();
      input.dispose();
      prediction.dispose();

      showResults(scores);
      statusEl.textContent = 'Classificação concluída.';
      isProcessing = false;
      btnCapture.disabled = false;
    }

    // Renderiza as 6 classes com confiança em porcentagem, destacando a maior.
    function showResults(scores) {
      resultsEl.innerHTML = '';

      // Cria array de {classe, valor} e encontra o índice de maior confiança.
      const results = Array.from(scores).map((value, idx) => ({ name: CLASSES[idx], value }));
      const maxIndex = results.reduce((bestIdx, curr, idx, arr) =>
        curr.value > arr[bestIdx].value ? idx : bestIdx, 0);

      results.forEach((item, idx) => {
        const percentage = (item.value * 100).toFixed(2);
        const isBest = idx === maxIndex;
        const row = document.createElement('div');
        row.className = 'class-row' + (isBest ? ' best' : '');

        const name = document.createElement('span');
        name.className = 'class-name';
        name.textContent = item.name;

        const barWrap = document.createElement('div');
        barWrap.className = 'class-bar';
        const fill = document.createElement('div');
        fill.className = 'class-fill';
        fill.style.width = percentage + '%';
        barWrap.appendChild(fill);

        const val = document.createElement('span');
        val.className = 'class-value';
        val.textContent = percentage + '%';

        row.appendChild(name);
        row.appendChild(barWrap);
        row.appendChild(val);
        resultsEl.appendChild(row);
      });
    }

    btnCapture.addEventListener('click', classify);

    // Inicia tudo quando a página carregar.
    init();
  </script>
</body>
</html>`);
});

// Caminho dos certificados HTTPS na pasta certs/ (raiz do projeto).
const options = {
  key: fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem'))
};

// Cria o servidor HTTPS com Express e inicia na porta 3000.
https.createServer(options, app).listen(PORT, () => {
  console.log('Servidor HTTPS rodando em https://localhost:' + PORT);
  console.log('Certificados carregados de: certs/key.pem e certs/cert.pem');
  console.log('Modelo servido em: https://localhost:' + PORT + '/model.json');
});