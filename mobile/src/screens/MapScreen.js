import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

let WebView = null;

if (Platform.OS !== "web") {
  WebView = require("react-native-webview").WebView;
}

import BrandHeader from "../components/BrandHeader";
import {
  COLORS,
  RADIUS,
  SHADOW,
  SPACING
} from "../theme";

const WORKER_URL =
  "https://green-union-3fea.analuiza-oliveira13.workers.dev";

const TOKEN_STORAGE_KEYS = ["authToken", "token", "accessToken"];

function obterNumero(...valores) {
  const valor = valores.find(
    (item) => item !== null && item !== undefined && item !== ""
  );

  if (valor === undefined) {
    return null;
  }

  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : null;
}

function normalizarObservacao(item, indice) {
  const latitude = obterNumero(
    item?.latitude,
    item?.lat,
    item?.localizacao?.latitude
  );

  const longitude = obterNumero(
    item?.longitude,
    item?.lng,
    item?.localizacao?.longitude
  );

  if (
    latitude === null ||
    longitude === null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return {
    id: String(item?.id ?? `registro-${indice}`),
    latitude,
    longitude,
    especie: String(
      item?.especie_corrigida ||
        item?.especie_detectada ||
        item?.rotulo_original ||
        item?.especie ||
        item?.nome_especie ||
        item?.nome ||
        "Não identificada"
    ),
    descricao: String(
      item?.observacao_revisao ||
        item?.descricao ||
        item?.observacao ||
        "Registro de biodiversidade"
    ),
    capturadoEm: String(
      item?.capturado_em || item?.criado_em || "Data não informada"
    ),
    regiao: String(item?.regiao || ""),
    confianca: obterNumero(item?.confianca)
  };
}

function criarMapaHtml(marcadores) {
  const centro = marcadores.length
    ? [marcadores[0].latitude, marcadores[0].longitude]
    : [-1.4558, -48.4902];

  const dadosJson = JSON.stringify(marcadores).replace(/</g, "\u003c");

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

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet.heat/dist/leaflet-heat.js"></script>

  <script>
    const centro = ${JSON.stringify(centro)};
    const dados = ${dadosJson};

    function escapar(valor) {
      return String(valor ?? "").replace(/[&<>"']/g, function (c) {
        const s = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        };

        return s[c];
      });
    }

    const mapa = L.map("map", {
      zoomControl: true,
      attributionControl: true
    }).setView(centro, 13);

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
      }
    ).addTo(mapa);

    const camadaMarcadores = L.layerGroup();
    const pontosCalor = [];

    dados.forEach(function (item) {
      const popup =
        '<div class="popup-titulo">' +
        escapar(item.especie) +
        "</div>" +
        '<div class="popup-texto">' +
        escapar(item.descricao) +
        "</div>" +
        '<div class="popup-texto">Data: ' +
        escapar(item.capturadoEm) +
        "</div>";

      L.marker([item.latitude, item.longitude])
        .bindPopup(popup)
        .addTo(camadaMarcadores);

      const peso = Number(item.confianca);

      pontosCalor.push([
        item.latitude,
        item.longitude,
        Number.isFinite(peso)
          ? Math.max(0.25, Math.min(peso, 1))
          : 0.7
      ]);
    });

    camadaMarcadores.addTo(mapa);

    const sobreposicoes = {
      "Registros": camadaMarcadores
    };

    if (typeof L.heatLayer === "function" && pontosCalor.length > 0) {
      const camadaCalor = L.heatLayer(pontosCalor, {
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
      });

      camadaCalor.addTo(mapa);
      sobreposicoes["Mapa de calor"] = camadaCalor;
    }

    L.control.layers(null, sobreposicoes, {
      collapsed: true
    }).addTo(mapa);

    if (dados.length > 1) {
      mapa.fitBounds(
        L.latLngBounds(
          dados.map(function (item) {
            return [item.latitude, item.longitude];
          })
        ),
        { padding: [30, 30] }
      );
    }
  </script>
</body>
</html>
`;
}

export default function MapScreen({
  onNavigate,
  observacoes = []
}) {
  const [observacoesBuscadas, setObservacoesBuscadas] = useState([]);
  const [erro, setErro] = useState("");
  const [especieSelecionada, setEspecieSelecionada] = useState("Todas");
  const [atualizacao, setAtualizacao] = useState(0);

  const buscarObservacoes = useCallback(async () => {
    // Se o componente pai já passou observações, não busca sozinho.
    if (observacoes.length > 0) {
      return;
    }

    setErro("");

    try {
      let token = "";

      for (const chave of TOKEN_STORAGE_KEYS) {
        const valor = await AsyncStorage.getItem(chave);

        if (valor) {
          token = valor;
          break;
        }
      }

      if (!token) {
        setErro("Faça login para ver o mapa.");
        return;
      }

      const resposta = await fetch(`${WORKER_URL}/observacoes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados?.erro || `Erro ${resposta.status} ao buscar registros.`);
        return;
      }

      setObservacoesBuscadas(Array.isArray(dados?.observacoes) ? dados.observacoes : []);
    } catch (e) {
      setErro(e?.message || "Não foi possível carregar os registros.");
    }
  }, [observacoes.length]);

  useEffect(() => {
    buscarObservacoes();
  }, [buscarObservacoes, atualizacao]);

  const listaObservacoes = useMemo(
    () => (observacoes.length > 0 ? observacoes : observacoesBuscadas),
    [observacoes, observacoesBuscadas]
  );

  const marcadores = useMemo(
    () =>
      listaObservacoes
        .map((item, indice) => normalizarObservacao(item, indice))
        .filter(Boolean),
    [listaObservacoes]
  );

  const especies = useMemo(() => {
    const nomes = [
      ...new Set(
        marcadores
          .map((item) => item.especie.trim())
          .filter(Boolean)
      )
    ];

    return ["Todas", ...nomes];
  }, [marcadores]);

  const marcadoresFiltrados = useMemo(() => {
    if (especieSelecionada === "Todas") {
      return marcadores;
    }

    return marcadores.filter(
      (item) => item.especie === especieSelecionada
    );
  }, [marcadores, especieSelecionada]);

  const mapaHtml = useMemo(
    () => criarMapaHtml(marcadoresFiltrados),
    [marcadoresFiltrados]
  );

  return (
    <View style={styles.tela}>
      <View style={styles.cabecalho}>
        <BrandHeader
          eyebrow="RUBRA • GUARÁ"
          title="Mapa do mangue"
          description="Explore os pontos registrados na região."
        />
      </View>

      <View style={styles.acoes}>
        <Pressable
          onPress={() => setAtualizacao((valor) => valor + 1)}
          style={({ pressed }) => [
            styles.botaoAtualizar,
            pressed && styles.botaoPressionado
          ]}
        >
          <Text style={styles.botaoAtualizarTexto}>
            Atualizar
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtros}
      >
        {especies.map((especie) => {
          const selecionada = especieSelecionada === especie;

          return (
            <Pressable
              key={especie}
              onPress={() => setEspecieSelecionada(especie)}
              style={[
                styles.filtro,
                selecionada && styles.filtroSelecionado
              ]}
            >
              <Text
                style={[
                  styles.filtroTexto,
                  selecionada && styles.filtroTextoSelecionado
                ]}
              >
                {especie}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <View style={styles.mapaCard}>
        {Platform.OS === "web" ? (
          <iframe
            srcDoc={mapaHtml}
            title="Mapa do mangue"
            style={styles.iframe}
          />
        ) : (
          <WebView
            key={`${atualizacao}-${especieSelecionada}-${marcadoresFiltrados.length}`}
            originWhitelist={["*"]}
            source={{ html: mapaHtml }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={styles.carregando}>
                <ActivityIndicator size="large" color={COLORS.coral} />
                <Text style={styles.carregandoTexto}>
                  Carregando mapa...
                </Text>
              </View>
            )}
            onError={(evento) => {
              console.log("Erro ao carregar mapa:", evento.nativeEvent);
            }}
          />
        )}
      </View>

      <View style={styles.rodape}>
        <Text style={styles.rodapeTexto}>
          {marcadoresFiltrados.length}{" "}
          {marcadoresFiltrados.length === 1
            ? "registro encontrado"
            : "registros encontrados"}
          {especieSelecionada !== "Todas"
            ? ` de ${especieSelecionada}`
            : ""}
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

  acoes: {
    alignItems: "flex-end",
    marginBottom: SPACING.sm
  },

  botaoAtualizar: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.green
  },

  botaoPressionado: {
    opacity: 0.75
  },

  botaoAtualizarTexto: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700"
  },

  filtros: {
    alignItems: "center",
    gap: 8,
    paddingVertical: SPACING.sm
  },

  filtro: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.green,
    backgroundColor: COLORS.white
  },

  filtroSelecionado: {
    backgroundColor: COLORS.green
  },

  filtroTexto: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "700"
  },

  filtroTextoSelecionado: {
    color: COLORS.white
  },

  erro: {
    color: COLORS.coral,
    fontSize: 12,
    marginBottom: SPACING.sm
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

  iframe: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderWidth: 0
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