import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Pressable,
  ScrollView,
  ActivityIndicator
} from "react-native";
import MapView, { Circle } from "react-native-maps";
import * as Location from "expo-location";

import BrandHeader from "../components/BrandHeader";
import PrimaryButton from "../components/PrimaryButton";
import {
  COLORS,
  RADIUS,
  SPACING,
  SHADOW
} from "../theme";
import {
  WORKER_URL,
  ESPECIES
} from "../config";

export default function MapScreen() {
  const [especieSelecionada, setEspecieSelecionada] =
    useState("guaiamim");

  const [pontosMapa, setPontosMapa] =
    useState([]);

  const [regiaoMapa, setRegiaoMapa] =
    useState(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState(null);

  useEffect(() => {
    inicializarMapa();
  }, []);

  async function inicializarMapa() {
    setCarregando(true);
    setErro(null);

    try {
      const permissao =
        await Location.requestForegroundPermissionsAsync();

      if (permissao.status !== "granted") {
        throw new Error(
          "Permita o acesso à localização para visualizar o mapa."
        );
      }

      const posicao =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });

      const regiaoAtual = {
        latitude: posicao.coords.latitude,
        longitude: posicao.coords.longitude,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025
      };

      setRegiaoMapa(regiaoAtual);

      await carregarPontos(
        "guaiamim"
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o mapa."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function carregarPontos(especie) {
    try {
      const url =
        `${WORKER_URL}/heatmap?species=` +
        encodeURIComponent(especie);

      const resposta = await fetch(url);
      const dados = await resposta.json();

      if (!resposta.ok || !dados.sucesso) {
        throw new Error(
          dados.erro || "Erro ao buscar registros."
        );
      }

      const pontos = (dados.pontos || [])
        .map((ponto) => ({
          latitude: Number(ponto.latitude),
          longitude: Number(ponto.longitude),
          quantidade: Number(ponto.quantidade)
        }))
        .filter(
          (ponto) =>
            Number.isFinite(ponto.latitude) &&
            Number.isFinite(ponto.longitude) &&
            Number.isFinite(ponto.quantidade)
        );

      setPontosMapa(pontos);
    } catch (error) {
      Alert.alert(
        "Erro nos dados",
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os registros."
      );
    }
  }

  async function selecionarEspecie(valor) {
    setEspecieSelecionada(valor);
    setPontosMapa([]);
    await carregarPontos(valor);
  }

  function tentarNovamente() {
    inicializarMapa();
  }

  if (carregando) {
    return (
      <View style={styles.estado}>
        <ActivityIndicator
          size="large"
          color={COLORS.coral}
        />

        <Text style={styles.estadoTexto}>
          Localizando você...
        </Text>
      </View>
    );
  }

  if (erro || !regiaoMapa) {
    return (
      <View style={styles.estado}>
        <Text style={styles.estadoTitulo}>
          Não foi possível abrir o mapa
        </Text>

        <Text style={styles.estadoTexto}>
          {erro || "Localização indisponível."}
        </Text>

        <View style={styles.tentar}>
          <PrimaryButton
            title="Tentar novamente"
            onPress={tentarNovamente}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.cabecalho}
        contentContainerStyle={styles.cabecalhoConteudo}
        showsVerticalScrollIndicator={false}
      >
        <BrandHeader
          eyebrow="EXPLORAÇÃO"
          title="Mapa do mangue"
          description="Veja a concentração provisória de registros próximos à sua localização."
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.seletor}
        >
          {ESPECIES.map((especie) => {
            const ativo =
              especieSelecionada === especie.valor;

            return (
              <Pressable
                key={especie.valor}
                onPress={() =>
                  selecionarEspecie(especie.valor)
                }
                style={[
                  styles.botaoEspecie,
                  ativo && styles.botaoEspecieAtivo
                ]}
              >
                <Text
                  style={[
                    styles.textoEspecie,
                    ativo &&
                      styles.textoEspecieAtivo
                  ]}
                >
                  {especie.nome}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </ScrollView>

      <View style={styles.mapaWrapper}>
        <MapView
          style={styles.mapa}
          region={regiaoMapa}
          showsUserLocation
          showsMyLocationButton
        >
          {pontosMapa.map((ponto, indice) => {
            const raio = Math.min(
              250,
              Math.max(80, ponto.quantidade * 80)
            );

            return (
              <Circle
                key={`${ponto.latitude}-${ponto.longitude}-${indice}`}
                center={{
                  latitude: ponto.latitude,
                  longitude: ponto.longitude
                }}
                radius={raio}
                strokeColor="rgba(210, 82, 64, 0.85)"
                fillColor="rgba(210, 82, 64, 0.32)"
              />
            );
          })}
        </MapView>

        <View style={styles.legenda}>
          <View style={styles.legendaBolinha} />

          <View>
            <Text style={styles.legendaTitulo}>
              Registros de {especieSelecionada}
            </Text>

            <Text style={styles.legendaTexto}>
              Áreas agrupadas: {pontosMapa.length}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.pink
  },

  cabecalho: {
    flexGrow: 0,
    maxHeight: 245
  },

  cabecalhoConteudo: {
    padding: SPACING.lg,
    paddingTop: 58,
    paddingBottom: SPACING.sm
  },

  seletor: {
    paddingVertical: SPACING.sm
  },

  botaoEspecie: {
    borderWidth: 1.5,
    borderColor: COLORS.green,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 9,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.white
  },

  botaoEspecieAtivo: {
    backgroundColor: COLORS.green
  },

  textoEspecie: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "800"
  },

  textoEspecieAtivo: {
    color: COLORS.white
  },

  mapaWrapper: {
    flex: 1,
    marginTop: SPACING.sm,
    overflow: "hidden",
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    ...SHADOW.card
  },

  mapa: {
    flex: 1
  },

  legenda: {
    position: "absolute",
    left: SPACING.md,
    right: SPACING.md,
    bottom: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SHADOW.card
  },

  legendaBolinha: {
    width: 18,
    height: 18,
    borderRadius: 10,
    backgroundColor: COLORS.coral,
    marginRight: SPACING.md
  },

  legendaTitulo: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: "800"
  },

  legendaTexto: {
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 3
  },

  estado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
    backgroundColor: COLORS.pink
  },

  estadoTitulo: {
    color: COLORS.brown,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: SPACING.sm
  },

  estadoTexto: {
    color: COLORS.gray,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22
  },

  tentar: {
    width: "100%",
    marginTop: SPACING.lg
  }
});