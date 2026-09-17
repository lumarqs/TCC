import { useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View
} from "react-native";
import { WebView } from "react-native-webview";

import BrandHeader from "../components/BrandHeader";
import {
  COLORS,
  RADIUS,
  SHADOW,
  SPACING
} from "../theme";

export default function MapScreen({
  onNavigate,
  observacoes = []
}) {
  const marcadores = useMemo(() => {
    return observacoes
      .filter((item) => {
        const latitude = Number(
          item?.latitude ??
          item?.lat ??
          item?.localizacao?.latitude
        );

        const longitude = Number(
          item?.longitude ??
          item?.lng ??
          item?.localizacao?.longitude
        );

        return (
          Number.isFinite(latitude) &&
          Number.isFinite(longitude)
        );
      })
      .map((item) => ({
        latitude: Number(
          item?.latitude ??
          item?.lat ??
          item?.localizacao?.latitude
        ),

        longitude: Number(
          item?.longitude ??
          item?.lng ??
          item?.localizacao?.longitude
        ),

        titulo:
          item?.especie ||
          item?.nome_especie ||
          item?.nome ||
          "Observação",

        descricao:
          item?.descricao ||
          item?.observacao ||
          "Registro de biodiversidade"
      }));
  }, [observacoes]);

  const mapaHtml = useMemo(() => {
    // Localização fixa na região de Cubatão/Bertioga.
    const centroFixo = [
      -23.8519,
      -46.1417
    ];

    const marcadoresJson =
      JSON.stringify(marcadores);

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
  />

  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  />

  <style>
    html,
    body,
    #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: #fff1f1;
    }

    .leaflet-control-attribution {
      font-size: 9px;
    }

    .leaflet-popup-content-wrapper {
      border-radius: 12px;
    }

    .popup-titulo {
      margin-bottom: 4px;
      color: #542b25;
      font-weight: 700;
    }

    .popup-texto {
      color: #666;
      font-size: 12px;
    }
  </style>
</head>

<body>
  <div id="map"></div>

  <script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js">
  </script>
  <script
  src="https://unpkg.com/leaflet.heat/dist/leaflet-heat.js">
</script>

  <script>
    const centro = ${JSON.stringify(centroFixo)};
    const dados = ${marcadoresJson};

    const mapa = L.map("map", {
      zoomControl: true,
      attributionControl: true
    }).setView(centro, 13);

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          "&copy; OpenStreetMap contributors"
      }
    ).addTo(mapa);

    const pontosCalor = dados.map((item) => [
  item.latitude,
  item.longitude,
  item.peso || 1
]);

L.heatLayer(pontosCalor, {
  radius: 35,
  blur: 25,
  maxZoom: 17,
  max: 1.0,
  minOpacity: 0.35,
  gradient: {
    0.2: "#38a169",
    0.45: "#f6e05e",
    0.7: "#ed8936",
    1.0: "#e53e3e"
  }
}).addTo(mapa);
  </script>
</body>
</html>
`;
  }, [marcadores]);

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <BrandHeader
          eyebrow="RUBRA • GUARÁ"
          title="Mapa do mangue"
          description="Explore os pontos registrados na região."
        />
      </View>

      <View style={styles.mapaCard}>
        <WebView
          originWhitelist={["*"]}
          source={{ html: mapaHtml }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={styles.carregando}>
              <ActivityIndicator
                size="large"
                color={COLORS.coral}
              />

              <Text style={styles.carregandoTexto}>
                Carregando mapa...
              </Text>
            </View>
          )}
          onError={(evento) => {
            console.log(
              "Erro ao carregar mapa:",
              evento.nativeEvent
            );
          }}
        />
      </View>

      <View style={styles.rodape}>
        <Text style={styles.rodapeTexto}>
          {marcadores.length}{" "}
          {marcadores.length === 1
            ? "registro encontrado"
            : "registros encontrados"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: COLORS.pink,
    padding: SPACING.lg,
    paddingTop: 48
  },

  cabecalho: {
    marginBottom: SPACING.md
  },

  mapaCard: {
    flex: 1,
    minHeight: 360,
    overflow: "hidden",
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white,
    ...SHADOW.card
  },

  webview: {
    flex: 1,
    backgroundColor: COLORS.pink
  },

  carregando: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.pink
  },

  carregandoTexto: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: "700",
    marginTop: SPACING.sm
  },

  rodape: {
    alignItems: "center",
    paddingVertical: SPACING.md
  },

  rodapeTexto: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "700"
  }
});