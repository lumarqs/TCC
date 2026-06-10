import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Image, Text, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCameraAndLocation } from './hooks/useCameraAndLocation';
import { mlService } from './services/mlService';
import { geolocationService } from './services/geolocationService';
import { dataSchema } from './utils/dataSchema';

export default function CameraScanner() {
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Precisamos de permissão para acessar a câmera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}><Text>Permitir</Text></TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photoData = await cameraRef.current.takePictureAsync();
      setPhoto(photoData.uri);
    }
  };

  const processImage = async () => {
    setLoading(true);
    try {
      const location = await geolocationService.getCurrentLocation();
      const classification = await mlService.classify(photo);
      const entry = dataSchema.createEntry(classification, location, photo);
      await dataSchema.save(entry);
      setResult(classification);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao processar imagem: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {!photo ? (
        <CameraView style={styles.camera} facing={facing} flash={flash} ref={cameraRef}>
          <View style={styles.controls}>
            <TouchableOpacity onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}><Text style={styles.text}>Flip</Text></TouchableOpacity>
            <TouchableOpacity onPress={takePicture} style={styles.captureButton} />
            <TouchableOpacity onPress={() => setFlash(f => f === 'off' ? 'on' : 'off')}><Text style={styles.text}>Flash</Text></TouchableOpacity>
          </View>
        </CameraView>
      ) : (
        <View style={styles.preview}>
          <Image source={{ uri: photo }} style={styles.previewImage} />
          {loading ? <ActivityIndicator size="large" /> : (
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setPhoto(null)}><Text>Descartar</Text></TouchableOpacity>
              <TouchableOpacity onPress={processImage}><Text>Confirmar</Text></TouchableOpacity>
            </View>
          )}
          {result && <Text>Espécie: {result.label} ({Math.round(result.confidence * 100)}%)</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  camera: { flex: 1 },
  controls: { flexDirection: 'row', justifyContent: 'space-around', position: 'absolute', bottom: 30, width: '100%' },
  captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'white' },
  preview: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '90%', height: '70%' },
  actions: { flexDirection: 'row', gap: 20, marginTop: 20 },
  text: { color: 'white' }
});