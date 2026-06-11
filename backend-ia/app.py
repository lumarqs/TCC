from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import base64
import os

app = Flask(__name__)
CORS(app)

# Carregar o modelo Teachable Machine
model = None

def load_model():
    global model
    try:
        # Caminho para o modelo exportado do Teachable Machine
        model_path = './model/keras_model.h5'
        labels_path = './model/labels.txt'
        
        model = tf.keras.models.load_model(model_path)
        
        with open(labels_path, 'r') as f:
            class_names = [line.strip() for line in f.readlines()]
        
        return class_names
    except Exception as e:
        print(f"Erro ao carregar modelo: {e}")
        return None

class_names = load_model()

@app.route('/classify', methods=['POST'])
def classify():
    try:
        # Receber a imagem em base64
        data = request.json
        image_data = data.get('image')
        
        # Decodificar a imagem
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Redimensionar para 224x224 (tamanho esperado pelo modelo)
        image = image.resize((224, 224))
        image_array = np.array(image) / 255.0
        image_array = np.expand_dims(image_array, axis=0)
        
        # Fazer a predição
        predictions = model.predict(image_array)
        
        # Encontrar a classe com maior confiança
        class_index = np.argmax(predictions[0])
        confidence = float(predictions[0][class_index])
        class_name = class_names[class_index]
        
        return jsonify({
            'success': True,
            'class': class_name,
            'confidence': confidence,
            'all_predictions': {
                class_names[i]: float(predictions[0][i]) 
                for i in range(len(class_names))
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)