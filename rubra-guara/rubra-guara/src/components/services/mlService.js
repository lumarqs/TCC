import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO, decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as FileSystem from 'expo-file-system';

// Caminhos para os arquivos do modelo exportado do Teachable Machine
const modelJson = require('../../assets/model/model.json');
const modelWeights = require('../../assets/model/weights.bin');

let model = null;

/**
 * Carrega o modelo do Teachable Machine para a memória
 */
export const loadModel = async () => {
  try {
    await tf.ready();
    model = await tf.loadLayersModel(bundleResourceIO(modelJson, modelWeights));
    return model;
  } catch (error) {
    console.error('Erro ao carregar o modelo:', error);
    throw error;
  }
};

/**
 * Converte a imagem (URI) em um tensor processável pelo modelo
 * @param {string} imageUri - URI da imagem capturada
 */
export const processImageToTensor = async (imageUri) => {
  try {
    const imgBase64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const imgBuffer = tf.util.encodeString(imgBase64, 'base64').buffer;
    const raw = new Uint8Array(imgBuffer);
    const imageTensor = decodeJpeg(raw);

    // Redimensiona a imagem para o tamanho esperado pelo modelo (ex: 224x224)
    const resized = tf.image.resizeBilinear(imageTensor, [224, 224]);
    const normalized = resized.div(255.0).expandDims(0);

    return normalized;
  } catch (error) {
    console.error('Erro ao processar imagem:', error);
    throw error;
  }
};

/**
 * Classifica a imagem fornecida
 * @param {string} imageUri - URI da imagem
 */
export const classifyImage = async (imageUri) => {
  if (!model) {
    throw new Error('Modelo não carregado. Chame loadModel() primeiro.');
  }

  try {
    const tensor = await processImageToTensor(imageUri);
    const predictions = await model.predict(tensor).data();
    
    // Limpeza de memória
    tensor.dispose();

    return predictions;
  } catch (error) {
    console.error('Erro na classificação:', error);
    throw error;
  }
};