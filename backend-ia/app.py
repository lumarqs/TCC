import os
import base64
import io
import numpy as np
from flask import Flask, request, jsonify
from PIL import Image, ImageOps
import keras
from keras.models import load_model

app = Flask(__name__)

# Configuração de caminhos
MODEL_PATH = 'model/keras_model.h5'
LABELS_PATH = 'model/labels.txt'

# Carregar modelo e labels
try:
    model = load_model(MODEL_PATH, compile=False)
    with open(LABELS_PATH, 'r', encoding='utf-8') as f:
        class_names = [line.strip().split(' ', 1)[-1] for line in f.readlines()]
except Exception as e:
    print(f"Erro ao carregar modelo ou labels: {e}")
    model = None

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "online", "model_loaded": model is not None}), 200

@app.route('/classify', methods=['POST'])
def classify():
    if model is None:
        return jsonify({"error": "Modelo não carregado"}), 500

    data = request.get_json()
    if not data or 'image' not in data:
        return jsonify({"error": "Nenhuma imagem fornecida"}), 400

    try:
        # Decodificar base64
        image_data = base64.b64decode(data['image'])
        image = Image.open(io.BytesIO(image_data)).convert('RGB')

        # Pré-processamento (Teachable Machine padrão)
        size = (224, 224)
        image = ImageOps.fit(image, size, Image.Resampling.LANCZOS)
        image_array = np.asarray(image)
        normalized_image_array = (image_array.astype(np.float32) / 127.5) - 1
        data_input = np.ndarray(shape=(1, 224, 224, 3), dtype=np.float32)
        data_input[0] = normalized_image_array

        # Predição
        prediction = model.predict(data_input)
        index = np.argmax(prediction)
        class_name = class_names[index]
        confidence_score = float(prediction[0][index])

        # Preparar resultados detalhados
        all_predictions = {class_names[i]: float(prediction[0][i]) for i in range(len(class_names))}

        return jsonify({
            "class": class_name,
            "confidence": confidence_score,
            "all_predictions": all_predictions
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)