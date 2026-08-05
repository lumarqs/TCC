import { useState } from "react";
import {
  View,
  Text,
  Button,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

const WORKER_URL =
  "https://green-union-3fea.analuiza-oliveira13.workers.dev";

export default function App() {
  const [foto, setFoto] = useState(null);
  const [localizacao, setLocalizacao] = useState(null);
  const [carregandoFoto, setCarregandoFoto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [respostaServidor, setRespostaServidor] = useState(null);

  async function capturarObservacao() {
    setCarregandoFoto(true);
    setFoto(null);
    setLocalizacao(null);
    setRespostaServidor(null);

    try {
      const permissaoCamera =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permissaoCamera.granted) {
        Alert.alert(
          "Permissão necessária",
          "Autorize o acesso à câmera para tirar fotos."
        );
        return;
      }

      const permissaoLocalizacao =
        await Location.requestForegroundPermissionsAsync();

      if (permissaoLocalizacao.status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Autorize o acesso à localização para registrar a observação."
        );
        return;
      }

      const resultadoFoto =
        await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          allowsEditing: false
        });

      if (resultadoFoto.canceled) {
        return;
      }

      const fotoCapturada = resultadoFoto.assets[0];

      const resultadoLocalizacao =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });

      const coordenadas = {
        latitude: resultadoLocalizacao.coords.latitude,
        longitude: resultadoLocalizacao.coords.longitude,
        precisao: resultadoLocalizacao.coords.accuracy
      };

      setFoto(fotoCapturada);
      setLocalizacao(coordenadas);

      Alert.alert(
        "Observação pronta",
        "A foto e a localização foram capturadas."
      );
    } catch (error) {
      Alert.alert(
        "Erro",
        "Não foi possível registrar a foto e a localização."
      );
    } finally {
      setCarregandoFoto(false);
    }
  }

  async function enviarObservacao() {
    if (!foto || !localizacao) {
      Alert.alert(
        "Observação incompleta",
        "Tire uma foto antes de enviar."
      );
      return;
    }

    setEnviando(true);
    setRespostaServidor(null);

    try {
      const formData = new FormData();

      formData.append("image", {
        uri: foto.uri,
        name: foto.fileName || "observacao.jpg",
        type: foto.mimeType || "image/jpeg"
      });

      formData.append(
        "latitude",
        String(localizacao.latitude)
      );

      formData.append(
        "longitude",
        String(localizacao.longitude)
      );

      formData.append(
        "precisao_metros",
        String(localizacao.precisao || "")
      );

      formData.append(
        "regiao",
        "mangue-principal"
      );

      formData.append(
        "capturado_em",
        new Date().toISOString()
      );

      const resposta = await fetch(WORKER_URL, {
        method: "POST",
        body: formData
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro || "O servidor recusou a observação."
        );
      }

      setRespostaServidor(dados);

      Alert.alert(
        "Enviado com sucesso",
        "A observação foi processada pelo servidor."
      );
    } catch (error) {
      Alert.alert(
        "Erro no envio",
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a observação."
      );
    } finally {
      setEnviando(false);
    }
  }

  function limparObservacao() {
    setFoto(null);
    setLocalizacao(null);
    setRespostaServidor(null);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>
        Monitoramento do Mangue
      </Text>

      <Text style={styles.descricao}>
        Tire uma foto de um animal encontrado no mangue.
      </Text>

      <Button
        title={
          carregandoFoto
            ? "Capturando observação..."
            : "Tirar foto"
        }
        onPress={capturarObservacao}
        disabled={carregandoFoto || enviando}
      />

      {carregandoFoto && (
        <ActivityIndicator
          size="large"
          color="#1976d2"
          style={styles.carregando}
        />
      )}

      {foto && (
        <Image
          source={{ uri: foto.uri }}
          style={styles.imagem}
        />
      )}

      {foto && localizacao && !respostaServidor && (
        <View style={styles.areaBotao}>
          <Button
            title={
              enviando
                ? "Enviando observação..."
                : "Enviar observação"
            }
            onPress={enviarObservacao}
            disabled={enviando}
          />
        </View>
      )}

      {enviando && (
        <ActivityIndicator
          size="large"
          color="#1976d2"
          style={styles.carregando}
        />
      )}

      {respostaServidor?.deteccao && (
        <View style={styles.resultado}>
          <Text style={styles.resultadoTitulo}>
            Resultado da análise
          </Text>

          <Text style={styles.resultadoTexto}>
            Animal identificado:{" "}
            {respostaServidor.deteccao.especie}
          </Text>

          {respostaServidor.deteccao.confianca !== null &&
            respostaServidor.deteccao.confianca !== undefined && (
              <Text style={styles.resultadoTexto}>
                Confiança:{" "}
                {(
                  respostaServidor.deteccao.confianca * 100
                ).toFixed(1)}
                %
              </Text>
            )}
        </View>
      )}

      {respostaServidor && (
        <View style={styles.areaBotao}>
          <Button
            title="Nova observação"
            onPress={limparObservacao}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 70,
    backgroundColor: "#ffffff"
  },

  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 12
  },

  descricao: {
    fontSize: 16,
    color: "#555555",
    marginBottom: 24
  },

  imagem: {
    width: "100%",
    height: 300,
    marginTop: 24,
    resizeMode: "contain",
    backgroundColor: "#eeeeee"
  },

  carregando: {
    marginTop: 20
  },

  areaBotao: {
    marginTop: 24
  },

  resultado: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#e3f2fd"
  },

  resultadoTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8
  },

  resultadoTexto: {
    fontSize: 16,
    marginTop: 4
  }
});