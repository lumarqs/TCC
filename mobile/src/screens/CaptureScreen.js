import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import BrandHeader from "../components/BrandHeader";
import PrimaryButton from "../components/PrimaryButton";
import { obterToken } from "../api/auth";
import { WORKER_URL } from "../config";
import {
  COLORS,
  RADIUS,
  SHADOW,
  SPACING,
  TYPOGRAPHY
} from "../theme";

function pareceToken(valor) {
  if (typeof valor !== "string") {
    return false;
  }
  const partes = valor.split(".");
  if (partes.length !== 2) {
    return false;
  }
  return (
    partes[0].length >= 40 &&
    partes[1].length >= 20 &&
    /^[A-Za-z0-9_-]+$/.test(partes[0]) &&
    /^[A-Za-z0-9_-]+$/.test(partes[1])
  );
}

function procurarTokenEmValor(valor, profundidade = 0) {
  if (profundidade > 4) {
    return null;
  }
  if (typeof valor === "string") {
    return pareceToken(valor) ? valor : null;
  }
  if (Array.isArray(valor)) {
    for (const item of valor) {
      const achado = procurarTokenEmValor(item, profundidade + 1);
      if (achado) {
        return achado;
      }
    }
    return null;
  }
  if (valor && typeof valor === "object") {
    if (typeof valor.token === "string" && valor.token.length > 10) {
      return valor.token;
    }
    for (const chave in valor) {
      const achado = procurarTokenEmValor(valor[chave], profundidade + 1);
      if (achado) {
        return achado;
      }
    }
  }
  return null;
}

// Varre TODAS as chaves salvas e acha o token pelo formato dele,
// sem depender do nome que a tela de login usou para salvar.
async function obterTokenSalvo() {
  try {
    const chaves = await AsyncStorage.getAllKeys();
    for (const chave of chaves) {
      try {
        const bruto = await AsyncStorage.getItem(chave);
        if (!bruto) {
          continue;
        }
        if (pareceToken(bruto)) {
          return bruto;
        }
        try {
          const dados = JSON.parse(bruto);
          const achado = procurarTokenEmValor(dados);
          if (achado) {
            return achado;
          }
        } catch {
          // Não era JSON.
        }
      } catch {
        // Chave ilegível: segue para a próxima.
      }
    }
  } catch {
    // Varredura indisponível: tenta as chaves clássicas.
    for (const chave of ["token", "authToken", "auth_token", "sessao", "usuario"]) {
      try {
        const bruto = await AsyncStorage.getItem(chave);
        if (!bruto) {
          continue;
        }
        if (pareceToken(bruto)) {
          return bruto;
        }
        try {
          const dados = JSON.parse(bruto);
          const achado = procurarTokenEmValor(dados);
          if (achado) {
            return achado;
          }
        } catch {
          // Não era JSON.
        }
      } catch {
        // Chave inexistente.
      }
    }
  }
  return null;
}

function comLimiteDeTempo(promessa, limiteMs) {
  return Promise.race([
    promessa,
    new Promise((_, rejeitar) =>
      setTimeout(
        () =>
          rejeitar(
            new Error("A localização demorou demais para responder.")
          ),
        limiteMs
      )
    ),
  ]);
}

function formatarEspecie(nome) {
  const texto = String(nome || "").trim();
  if (!texto) {
    return "";
  }
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

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
  const [aviso, setAviso] = useState(null);

  // Alert.alert não existe no navegador: no site o aviso
  // aparece como banner na própria tela; no app usa o Alert.
  function avisar(titulo, texto) {
    if (Platform.OS === "web") {
      setAviso({ titulo, texto });
    } else {
      Alert.alert(titulo, texto);
    }
  }

  async function capturarObservacao() {
    setAviso(null);
    setCarregandoFoto(true);
    setFoto(null);
    setLocalizacao(null);
    setRespostaServidor(null);
    try {
      let resultadoFoto;
      if (Platform.OS === "web") {
        // No navegador, o seletor PRECISA abrir no toque direto,
        // antes de qualquer espera, senão o Chrome bloqueia o diálogo.
        resultadoFoto =
          await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.8,
            base64: true,
            allowsEditing: false
          });
      } else {
        const permissaoCamera =
          await ImagePicker.requestCameraPermissionsAsync();
        if (!permissaoCamera.granted) {
          avisar(
            "Permissão necessária",
            "Autorize o acesso à câmera."
          );
          return;
        }
        resultadoFoto =
          await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.8,
            base64: true,
            allowsEditing: false
          });
      }
      if (resultadoFoto.canceled) {
        return;
      }
      const fotoCapturada =
        resultadoFoto.assets[0];
      // Localização depois da foto, com limite de tempo
      // (no PC o GPS pode demorar muito).
      const permissaoLocalizacao =
        await Location.requestForegroundPermissionsAsync();
      if (permissaoLocalizacao.status !== "granted") {
        avisar(
          "Permissão necessária",
          "Autorize o acesso à localização."
        );
        return;
      }
      const precisao =
        Platform.OS === "web"
          ? Location.Accuracy.Balanced
          : Location.Accuracy.High;
      const posicao = await comLimiteDeTempo(
        Location.getCurrentPositionAsync({
          accuracy: precisao
        }),
        20000
      );
      setFoto(fotoCapturada);
      setLocalizacao({
        latitude: posicao.coords.latitude,
        longitude: posicao.coords.longitude,
        precisao: posicao.coords.accuracy
      });
    } catch (error) {
      const mensagem = error instanceof Error
        ? error.message
        : "";
      avisar(
        "Erro",
        mensagem.includes("demorou")
          ? "Não foi possível obter sua localização. Autorize o acesso no navegador e tente de novo."
          : "Não foi possível capturar a observação."
      );
    } finally {
      setCarregandoFoto(false);
    }
  }

  async function enviarObservacao() {
    setAviso(null);
    if (!foto || !localizacao) {
      avisar(
        "Observação incompleta",
        "Capture uma foto antes de enviar."
      );
      return;
    }
    setEnviando(true);
    try {
      const token = obterToken() || (await obterTokenSalvo());
      if (!token) {
        avisar(
          "Sessão necessária",
          "Faça login no site antes de enviar observações. Volte à tela Início e entre com sua conta."
        );
        return;
      }
      if (!foto.base64) {
        avisar(
          "Foto inválida",
          "Não conseguimos ler os dados da foto. Tente novamente."
        );
        return;
      }
      if (foto.base64.length > 4500000) {
        avisar(
          "Foto muito grande",
          "Escolha outra foto ou tire novamente."
        );
        return;
      }
      setRespostaServidor(null);
      const resposta = await fetch(
        `${WORKER_URL}/analisar-imagem`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            imageBase64: foto.base64,
            mimeType: foto.mimeType || "image/jpeg",
            latitude: localizacao.latitude,
            longitude: localizacao.longitude,
            precisao_metros: localizacao.precisao,
            regiao: "mangue-principal",
            capturado_em: new Date().toISOString()
          })
        }
      );
      const dados = await resposta.json();
      if (!resposta.ok || !dados.sucesso) {
        throw new Error(
          dados.erro || "O Worker recusou a observação."
        );
      }
      setRespostaServidor(dados);
    } catch (error) {
      avisar(
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
    setAviso(null);
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
      {aviso && (
        <View style={styles.avisoCard}>
          <Text style={styles.avisoTitulo}>
            {aviso.titulo}
          </Text>
          <Text style={styles.avisoTexto}>
            {aviso.texto}
          </Text>
          <Text
            style={styles.avisoFechar}
            onPress={() => setAviso(null)}
          >
            Fechar
          </Text>
        </View>
      )}
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
            {deteccao.especie
              ? formatarEspecie(deteccao.especie)
              : "Não identificado"}
          </Text>
          {deteccao.nome_cientifico ? (
            <Text style={styles.cientifico}>
              {deteccao.nome_cientifico}
            </Text>
          ) : null}
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
            <Text style={styles.avisoInterno}>
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
  avisoCard: {
    backgroundColor: "#B3261E",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg
  },
  avisoTitulo: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
    marginBottom: 4
  },
  avisoTexto: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
    lineHeight: 19
  },
  avisoFechar: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
    marginTop: SPACING.sm,
    textDecorationLine: "underline"
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
    marginBottom: 4
  },
  cientifico: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontStyle: "italic",
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
  avisoInterno: {
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