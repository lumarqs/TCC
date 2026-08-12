import { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

import BrandHeader from "../components/BrandHeader";
import PrimaryButton from "../components/PrimaryButton";
import {
  COLORS,
  RADIUS,
  SPACING,
  SHADOW,
  TYPOGRAPHY
} from "../theme";
import { WORKER_URL } from "../config";

export default function CaptureScreen({
  onNavigate
}) {
  const [foto, setFoto] = useState(null);
  const [localizacao, setLocalizacao] =
    useState(null);
  const [respostaServidor, setRespostaServidor] =
    useState(null);

  const [carregandoFoto, setCarregandoFoto] =
    useState(false);
  const [enviando, setEnviando] =
    useState(false);

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
          "Autorize o acesso à câmera."
        );
        return;
      }

      const permissaoLocalizacao =
        await Location.requestForegroundPermissionsAsync();

      if (permissaoLocalizacao.status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Autorize o acesso à localização."
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

      const fotoCapturada =
        resultadoFoto.assets[0];

      const posicao =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });

      setFoto(fotoCapturada);

      setLocalizacao({
        latitude: posicao.coords.latitude,
        longitude: posicao.coords.longitude,
        precisao: posicao.coords.accuracy
      });

      Alert.alert(
        "Observação pronta",
        "Foto e localização foram capturadas."
      );
    } catch (error) {
      Alert.alert(
        "Erro",
        "Não foi possível capturar a observação."
      );
    } finally {
      setCarregandoFoto(false);
    }
  }

  async function enviarObservacao() {
    if (!foto || !localizacao) {
      Alert.alert(
        "Observação incompleta",
        "Capture uma foto antes de enviar."
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

      if (!resposta.ok || !dados.sucesso) {
        throw new Error(
          dados.erro || "O Worker recusou a observação."
        );
      }

      setRespostaServidor(dados);

      Alert.alert(
        "Observação enviada",
        "Os dados foram salvos no banco."
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

  const deteccao =
    respostaServidor?.deteccao;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <BrandHeader
        eyebrow="NOVA OBSERVAÇÃO"
        title="Registre uma espécie"
        description="Fotografe o ambiente e salve a localização para contribuir com o monitoramento."
      />

      <View style={styles.infoCard}>
        <View style={styles.infoDot} />

        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>
            Como funciona?
          </Text>

          <Text style={styles.infoText}>
            Tire uma foto. O aplicativo captura sua localização e envia os dados para análise.
          </Text>
        </View>
      </View>

      <PrimaryButton
        title={
          carregandoFoto
            ? "Capturando observação..."
            : "Tirar foto"
        }
        onPress={capturarObservacao}
        loading={carregandoFoto}
        disabled={enviando}
      />

      {foto && (
        <View style={styles.previewCard}>
          <Image
            source={{ uri: foto.uri }}
            style={styles.imagem}
          />

          {localizacao && (
            <View style={styles.localizacaoBox}>
              <Text style={styles.localizacaoTitulo}>
                Localização capturada
              </Text>

              <Text style={styles.localizacaoTexto}>
                Precisão aproximada:{" "}
                {localizacao.precisao
                  ? `${Math.round(localizacao.precisao)} m`
                  : "não informada"}
              </Text>
            </View>
          )}
        </View>
      )}

      {foto && localizacao && !respostaServidor && (
        <View style={styles.botaoSecundario}>
          <PrimaryButton
            title={
              enviando
                ? "Enviando observação..."
                : "Enviar observação"
            }
            onPress={enviarObservacao}
            loading={enviando}
            disabled={enviando}
          />
        </View>
      )}

      {enviando && (
        <ActivityIndicator
          size="large"
          color={COLORS.coral}
          style={styles.carregando}
        />
      )}

      {deteccao && (
        <View style={styles.resultadoCard}>
          <Text style={styles.resultadoEyebrow}>
            RESULTADO DA ANÁLISE
          </Text>

          <Text style={styles.especie}>
            {deteccao.especie || "Não identificado"}
          </Text>

          <View style={styles.resultadoLinha}>
            <Text style={styles.resultadoLabel}>
              Confiança
            </Text>

            <Text style={styles.resultadoValor}>
              {(
                Number(deteccao.confianca || 0) * 100
              ).toFixed(1)}
              %
            </Text>
          </View>

          <View style={styles.resultadoLinha}>
            <Text style={styles.resultadoLabel}>
              Status
            </Text>

            <Text
              style={[
                styles.resultadoValor,
                deteccao.especie_aceita
                  ? styles.statusOk
                  : styles.statusPendente
              ]}
            >
              {deteccao.especie_aceita
                ? "Aceita para revisão"
                : "Não reconhecida"}
            </Text>
          </View>

          {!deteccao.especie_aceita && (
            <Text style={styles.aviso}>
              A imagem foi salva, mas a espécie não foi aceita com segurança.
            </Text>
          )}
        </View>
      )}

      {respostaServidor && (
        <View style={styles.botaoSecundario}>
          <PrimaryButton
            title="Nova observação"
            onPress={limparObservacao}
            variant="secondary"
          />
        </View>
      )}

      <View style={styles.linkArea}>
        <Text style={styles.linkTexto}>
          Quer visualizar os registros?
        </Text>

        <PrimaryButton
          title="Abrir mapa"
          onPress={() => onNavigate("mapa")}
          variant="secondary"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.pink,
    padding: SPACING.lg,
    paddingTop: 60,
    paddingBottom: SPACING.xxl
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOW.card
  },

  infoDot: {
    width: 12,
    height: 12,
    borderRadius: 8,
    backgroundColor: COLORS.blueGray,
    marginRight: SPACING.md
  },

  infoContent: {
    flex: 1
  },

  infoTitle: {
    color: COLORS.green,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4
  },

  infoText: {
    color: COLORS.gray,
    fontSize: 13,
    lineHeight: 19
  },

  previewCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    marginTop: SPACING.lg,
    ...SHADOW.card
  },

  imagem: {
    width: "100%",
    height: 280,
    resizeMode: "cover"
  },

  localizacaoBox: {
    padding: SPACING.md,
    backgroundColor: COLORS.cream
  },

  localizacaoTitulo: {
    color: COLORS.green,
    fontWeight: "800",
    marginBottom: 4
  },

  localizacaoTexto: {
    color: COLORS.gray,
    fontSize: 13
  },

  botaoSecundario: {
    marginTop: SPACING.md
  },

  carregando: {
    marginTop: SPACING.md
  },

  resultadoCard: {
    backgroundColor: COLORS.green,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    ...SHADOW.card
  },

  resultadoEyebrow: {
    color: COLORS.pink,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "800"
  },

  especie: {
    color: COLORS.white,
    fontSize: 27,
    fontWeight: "800",
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg
  },

  resultadoLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.18)"
  },

  resultadoLabel: {
    color: COLORS.pink,
    fontSize: 14
  },

  resultadoValor: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800"
  },

  statusOk: {
    color: "#C8E6C9"
  },

  statusPendente: {
    color: "#FFD6A5"
  },

  aviso: {
    color: "#FFD6A5",
    fontSize: 13,
    lineHeight: 19,
    marginTop: SPACING.md
  },

  linkArea: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },

  linkTexto: {
    ...TYPOGRAPHY.body,
    textAlign: "center",
    marginBottom: SPACING.sm
  }
});