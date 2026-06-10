/**
 * Utilitários para processamento de dados de mapa de calor (Heatmap)
 */

/**
 * Calcula a densidade de pontos em uma área específica
 * @param {Array} points - Lista de objetos {latitude, longitude}
 * @param {number} radius - Raio de influência
 */
export const calculateDensity = (points, radius = 0.01) => {
  if (!Array.isArray(points)) throw new Error('Dados de pontos inválidos');
  return points.map(point => ({
    ...point,
    weight: points.filter(p => 
      Math.abs(p.latitude - point.latitude) < radius && 
      Math.abs(p.longitude - point.longitude) < radius
    ).length
  }));
};

/**
 * Agrupa detecções por espécie
 */
export const groupBySpecies = (data) => {
  if (!Array.isArray(data)) return {};
  return data.reduce((acc, item) => {
    const species = item.species || 'Desconhecido';
    if (!acc[species]) acc[species] = [];
    acc[species].push(item);
    return acc;
  }, {});
};

/**
 * Formata dados para o formato esperado por bibliotecas de mapas (ex: react-native-maps)
 */
export const generateHeatmapPoints = (data) => {
  try {
    return data.map(item => ({
      latitude: parseFloat(item.latitude),
      longitude: parseFloat(item.longitude),
      weight: item.weight || 1
    })).filter(p => !isNaN(p.latitude) && !isNaN(p.longitude));
  } catch (error) {
    console.error('Erro ao gerar pontos do mapa:', error);
    return [];
  }
};

/**
 * Normaliza valores de intensidade entre 0 e 1
 */
export const normalizeIntensity = (data) => {
  const weights = data.map(p => p.weight);
  const max = Math.max(...weights, 1);
  const min = Math.min(...weights, 0);
  return data.map(p => ({
    ...p,
    weight: (p.weight - min) / (max - min)
  }));
};

/**
 * Filtra dados por espécie
 */
export const filterBySpecies = (data, species) => {
  if (!species) return data;
  return data.filter(item => item.species === species);
};

/**
 * Filtra dados por intervalo de datas
 */
export const filterByDateRange = (data, startDate, endDate) => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return data.filter(item => {
    const itemDate = new Date(item.timestamp).getTime();
    return itemDate >= start && itemDate <= end;
  });
};