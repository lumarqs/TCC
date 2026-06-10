import * as Location from 'expo-location';

/**
 * Solicita permissão de acesso à localização do usuário.
 * @returns {Promise<boolean>} Retorna true se a permissão foi concedida.
 */
export const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Permissão de localização negada');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Erro ao solicitar permissão:', error);
    return false;
  }
};

/**
 * Obtém a localização atual do dispositivo.
 * @returns {Promise<Object|null>} Retorna o objeto com latitude e longitude ou null em caso de erro.
 */
export const getCurrentLocation = async () => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Erro ao obter localização atual:', error);
    return null;
  }
};

/**
 * Calcula a distância em metros entre dois pontos geográficos usando a fórmula de Haversine.
 * @param {number} lat1 Latitude do ponto 1
 * @param {number} lon1 Longitude do ponto 1
 * @param {number} lat2 Latitude do ponto 2
 * @param {number} lon2 Longitude do ponto 2
 * @returns {number} Distância em metros
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || typeof lat2 !== 'number' || typeof lon2 !== 'number') {
    throw new Error('Coordenadas inválidas: devem ser números.');
  }

  const R = 6371e3; // Raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};