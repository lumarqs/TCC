import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@animal_detections_data';

/**
 * Salva uma nova detecção no AsyncStorage
 * @param {Object} detection - Objeto contendo animal, coordenadas e timestamp
 */
export const saveDetection = async (detection) => {
  try {
    if (!detection.animal || !detection.coordenadas) {
      throw new Error('Dados de detecção inválidos: animal e coordenadas são obrigatórios.');
    }

    const existingData = await getAllDetections();
    const newData = [...existingData, { ...detection, id: Date.now().toString() }];
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    return true;
  } catch (error) {
    console.error('Erro ao salvar detecção:', error);
    throw error;
  }
};

/**
 * Recupera todas as detecções salvas
 * @returns {Promise<Array>} Lista de detecções
 */
export const getAllDetections = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Erro ao recuperar detecções:', error);
    return [];
  }
};

/**
 * Deleta uma detecção específica pelo ID
 * @param {string} id - ID da detecção a ser removida
 */
export const deleteDetection = async (id) => {
  try {
    const detections = await getAllDetections();
    const filteredData = detections.filter((item) => item.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredData));
    return true;
  } catch (error) {
    console.error('Erro ao deletar detecção:', error);
    throw error;
  }
};

/**
 * Limpa todos os dados armazenados
 */
export const clearAllData = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Erro ao limpar todos os dados:', error);
    throw error;
  }
};

/**
 * Exporta os dados como uma string JSON para compartilhamento
 */
export const exportDataAsJSON = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data || '[]';
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    throw error;
  }
};