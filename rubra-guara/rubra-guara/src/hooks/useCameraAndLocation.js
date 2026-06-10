import { useState, useRef, useEffect } from 'react';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';

/**
 * Hook customizado para gerenciar permissões e funcionalidades de Câmera e GPS
 */
export const useCameraAndLocation = () => {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
        setHasCameraPermission(cameraStatus === 'granted');

        const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
        setHasLocationPermission(locationStatus === 'granted');
      } catch (err) {
        setError('Erro ao solicitar permissões: ' + err.message);
      }
    })();
  }, []);

  const takePhoto = async () => {
    if (!cameraRef.current) return null;
    try {
      setIsLoading(true);
      const photo = await cameraRef.current.takePictureAsync();
      return photo;
    } catch (err) {
      setError('Erro ao capturar foto: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getLocation = async () => {
    try {
      setIsLoading(true);
      const location = await Location.getCurrentPositionAsync({});
      return location;
    } catch (err) {
      setError('Erro ao obter localização: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cameraRef,
    hasCameraPermission,
    hasLocationPermission,
    takePhoto,
    getLocation,
    isLoading,
    error
  };
};