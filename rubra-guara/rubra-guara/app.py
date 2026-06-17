import os
import io
import base64
import numpy as np
import cv2
from flask import Flask, request, jsonify

# Keras / TensorFlow imports
try:
    from tensorflow.keras.models import load_model
    from tensorflow.keras.layers import DepthwiseConv2D
    from tensorflow.keras.utils import get_custom_objects
except ImportError:
    from keras.models import load_model
    from keras.layers import DepthwiseConv2D
    from keras.utils import get_custom_objects

app = Flask(__name__)

MODEL_PATH = os.path.join('model', 'keras_model.h5')
LABELS_PATH = os.path.join('model', 'labels.txt')
IMAGE_SIZE = (224, 224)


def load_labels(path):
    """Load class labels from a text file, one label per line."""
    labels = []
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    labels.append(line)
    return labels


class DepthwiseConv2DCompat(DepthwiseConv2D):
    """Custom DepthwiseConv2D that ignores unsupported 'groups' argument."""
    def __init__(self, *args, **kwargs):
        # Remove 'groups' if present (not supported by older TensorFlow versions)
        kwargs.pop('groups', None)
        super().__init__(*args, **kwargs)


def load_model_with_workaround(path):
    """
    Load a Keras model with multiple fallback strategies for version compatibility.

    Strategies attempted:
    1. Normal load_model.
    2. load_model with empty custom_objects.
    3. load_model with compile=False.
    4. load_model with a custom DepthwiseConv2D that removes 'groups'.
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"Model file not found: {path}")

    # Strategy 1: Normal loading
    try:
        model = load_model(path)
        print("[INFO] Model loaded successfully with standard load_model.")
        return model
    except Exception as e:
        print(f"[WARN] Standard load_model failed: {e}")

    # Strategy 2: Empty custom_objects
    try:
        model = load_model(path, custom_objects={})
        print("[INFO] Model loaded successfully with empty custom_objects.")
        return model
    except Exception as e:
        print(f"[WARN] load_model with custom_objects={{}} failed: {e}")

    # Strategy 3: compile=False
    try:
        model = load_model(path, compile=False)
        print("[INFO] Model loaded successfully with compile=False.")
        return model
    except Exception as e:
        print(f"[WARN] load_model with compile=False failed: {e}")

    # Strategy 4: Custom DepthwiseConv2D workaround for 'groups' argument
    try:
        custom_objects = {'DepthwiseConv2D': DepthwiseConv2DCompat}
        get_custom_objects().clear()
        model = load_model(path, custom_objects=custom_objects, compile=False)
        print("[INFO] Model loaded successfully with DepthwiseConv2D compatibility workaround.")
        return model
    except Exception as e:
        print(f"[ERROR] All loading strategies failed. Last error: {e}")
        raise RuntimeError(f"Unable to load model '{path}'. All fallback strategies failed.")


# Load model and labels at startup
print("[INFO] Loading Keras model...")
model = load_model_with_workaround(MODEL_PATH)

print("[INFO] Loading labels...")
labels = load_labels(LABELS_PATH)
if not labels:
    print("[WARN] No labels loaded. Using numeric indices as fallback.")


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint to verify the server is running."""
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None,
        'labels_loaded': len(labels)
    }), 200


@app.route('/classify', methods=['POST'])
def classify():
    """
    Classify an image sent as a base64-encoded string.

    Expected JSON body: {"image": "<<base64-encoded image data>"}

    Returns:
    {
        "class": "predicted label",
        "confidence": 0.95,
        "predictions": {"label1": 0.01, "label2": 0.95, ...}
    }
    """
    try:
        data = request.get_json(silent=True)
        if not data or 'image' not in data:
            return jsonify({'error': "Missing 'image' field in JSON body."}), 400

        image_b64 = data['image']
        if not image_b64:
            return jsonify({'error': "Empty image data."}), 400

        # Decode base64 image
        try:
            image_bytes = base64.b64decode(image_b64)
        except Exception as e:
            return jsonify({'error': f"Invalid base64 image data: {str(e)}"}), 400

        # Convert bytes to numpy array and decode with OpenCV
        try:
            image_array = np.frombuffer(image_bytes, dtype=np.uint8)
            image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            if image is None:
                return jsonify({'error': "Could not decode image. Ensure valid image format (JPEG/PNG)."}), 400
        except Exception as e:
            return jsonify({'error': f"OpenCV image decode error: {str(e)}"}), 400

        # Convert BGR to RGB (OpenCV loads images in BGR format)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Resize to the input size expected by the model
        image_resized = cv2.resize(image_rgb, IMAGE_SIZE)

        # Normalize pixel values to [0, 1]
        image_normalized = image_resized.astype(np.float32) / 255.0

        # Add batch dimension: (1, 224, 224, 3)
        input_batch = np.expand_dims(image_normalized, axis=0)

        # Run prediction
        try:
            predictions = model.predict(input_batch, verbose=0)
        except Exception as e:
            return jsonify({'error': f"Model prediction failed: {str(e)}"}), 500

        predictions = predictions[0]

        # Get index of highest confidence
        predicted_index = int(np.argmax(predictions))
        confidence = float(predictions[predicted_index])

        # Map index to label if available
        if labels and predicted_index < len(labels):
            predicted_class = labels[predicted_index]
        else:
            predicted_class = f"class_{predicted_index}"

        # Build full prediction dictionary
        prediction_dict = {}
        for i, score in enumerate(predictions):
            label = labels[i] if labels and i < len(labels) else f"class_{i}"
            prediction_dict[label] = float(score)

        return jsonify({
            'class': predicted_class,
            'confidence': confidence,
            'predictions': prediction_dict
        }), 200

    except Exception as e:
        return jsonify({'error': f"Unexpected server error: {str(e)}"}), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors with a JSON response."""
    return jsonify({'error': 'Endpoint not found.'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors with a JSON response."""
    return jsonify({'error': 'Internal server error.'}), 500


@app.errorhandler(Exception)
def handle_exception(error):
    """Catch-all exception handler for unhandled errors."""
    return jsonify({'error': f"Unhandled error: {str(error)}"}), 500


if __name__ == '__main__':
    # Run Flask server
    # Use host='0.0.0.0' to accept external connections
    app.run(host='0.0.0.0', port=5000, debug=False)