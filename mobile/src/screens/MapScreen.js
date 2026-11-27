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
import { obterToken } from "../api/auth";
import BrandHeader from "../components/BrandHeader";
import { WORKER_URL } from "../config";
import { COLORS, RADIUS, SHADOW, SPACING } from "../theme";

let WebView = null;
if (Platform.OS !== "web") {
  WebView = require("react-native-webview").WebView;
}

const NOMES_ESPECIES = {
  "colhereiro": "Colhereiro",
  "guará-vermelho": "Guará-vermelho",
  "martim-pescador": "Martim-pescador",
  "guaiamum": "Guaiamum",
  "mangue-maçã": "Mangue-maçã"
};

function nomeEspecie(valor) {
  const chave = String(valor || "").trim().toLowerCase();
  return NOMES_ESPECIES[chave] || "Não identificado";
}

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
  const latitude = obterNumero(item?.latitude, item?.lat);
  const longitude = obterNumero(item?.longitude, item?.lng);
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
    especie: nomeEspecie(
      item?.especie_corrigida || item?.especie_detectada || item?.especie
    ),
    capturadoEm: String(
      item?.capturado_em || item?.criado_em || "Data não informada"
    )
  };
}

// Neste arquivo, o HTML do mapa usa @ no lugar de <.
// A função criarMapaHtml converte todos os @ em < no final.
function criarMapaHtml(marcadores) {
  const centro = marcadores.length
    ? [marcadores[0].latitude, marcadores[0].longitude]
    : [-1.4558, -48.4902];

  // Soma os registros que caem no mesmo ponto (cerca de 10 m).
  const agrupados = {};
  marcadores.forEach((item) => {
    const chave = item.latitude.toFixed(4) + "," + item.longitude.toFixed(4);
    if (!agrupados[chave]) {
      agrupados[chave] = {
        latitude: item.latitude,
        longitude: item.longitude,
        quantidade: 0
      };
    }
    agrupados[chave].quantidade += 1;
  });

  const pontos = Object.values(agrupados).map((p) => [
    p.latitude,
    p.longitude,
    p.quantidade
  ]);
  const maximo = pontos.reduce((m, p) => Math.max(m, p[2]), 1);
  const dados = JSON.stringify({ centro, pontos, maximo }).replace(
    /</g,
    "\\u003c"
  );

  return `@!DOCTYPE html>
@html lang="pt-BR">
@head>
  @meta charset="UTF-8" />
  @meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  @link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  @style>
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #fff1f1; }
    .leaflet-control-attribution { font-size: 9px; }
    .leaflet-control-layers { font: 14px sans-serif; color: #325543; }
    .leaflet-control-layers label { display: block; margin: 4px 0; }
    .legenda-incidencia { background: #fff; padding: 8px 10px; border-radius: 10px; font: 13px sans-serif; color: #325543; box-shadow: 0 1px 4px rgba(0,0,0,.2); }
    .barra-incidencia { width: 130px; height: 10px; border-radius: 5px; margin: 4px 0; background: linear-gradient(to right, #325543, #e8b84a, #d25240); }
    .escala-incidencia { display: flex; justify-content: space-between; }
  @/style>
@/head>
@body>
  @div id="map">@/div>
  @script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js">@/script>
  @script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js">@/script>
  @script>
    var dados = ${dados};

    var mapa = L.map("map", { zoomControl: true }).setView(dados.centro, 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(mapa);

    var camadaCalor = null;
    if (typeof L.heatLayer === "function" && dados.pontos.length > 0) {
      camadaCalor = L.heatLayer(
        dados.pontos.map(function (p) {
          return [p[0], p[1], p[2] / dados.maximo];
        }),
        {
          radius: 40,
          blur: 30,
          maxZoom: 17,
          max: 1,
          minOpacity: 0.3,
          gradient: { 0.0: "#325543", 0.5: "#e8b84a", 1.0: "#d25240" }
        }
      ).addTo(mapa);
    }

    if (dados.pontos.length > 1) {
      mapa.fitBounds(
        L.latLngBounds(dados.pontos.map(function (p) { return [p[0], p[1]]; })),
        { padding: [30, 30] }
      );
    }

    var camadaUsuario = L.layerGroup().addTo(mapa);
    var centralizou = dados.pontos.length > 0;

    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        function (pos) {
          var ponto = [pos.coords.latitude, pos.coords.longitude];
          camadaUsuario.clearLayers();
          L.circleMarker(ponto, {
            radius: 9,
            color: "#FFFFFF",
            weight: 3,
            fillColor: "#6c9ea9",
            fillOpacity: 1
          }).bindTooltip("Você está aqui").addTo(camadaUsuario);
          if (!centralizou) {
            mapa.setView(ponto, 16);
            centralizou = true;
          }
        },
        function () {},
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    }

    var sobreposicoes = { "Minha localização": camadaUsuario };
    if (camadaCalor) {
      sobreposicoes["Mapa de calor"] = camadaCalor;
    }
    L.control.layers(null, sobreposicoes, { collapsed: false }).addTo(mapa);

    var legenda = L.control({ position: "bottomright" });
    legenda.onAdd = function () {
      var div = L.DomUtil.create("div", "legenda-incidencia");
      div.innerHTML =
        "@b>Incidência@/b>" +
        "@div class='barra-incidencia'>@/div>" +
        "@div class='escala-incidencia'>@span>menor@/span>@span>maior@/span>@/div>";
      return div;
    };
    legenda.addTo(mapa);

    setTimeout(function () { mapa.invalidateSize(); }, 300);
  @/script>
@/body>
@/html>`.replace(/@/g, "<");
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
    if (observacoes.length > 0) {
      return;
    }
    setErro("");
    try {
      const token = obterToken();
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
      setObservacoesBuscadas(
        Array.isArray(dados?.observacoes) ? dados.observacoes : []
      );
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
    const nomes = [...new Set(marcadores.map((item) => item.especie))];
    return ["Todas", ...nomes];
  }, [marcadores]);

  const marcadoresFiltrados = useMemo(() => {
    if (especieSelecionada === "Todas") {
      return marcadores;
    }
    return marcadores.filter((item) => item.especie === especieSelecionada);
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
          description="Veja sua localização e a incidência de registros na região."
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
          <Text style={styles.botaoAtualizarTexto}>Atualizar</Text>
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
              style={[styles.filtro, selecionada && styles.filtroSelecionado]}
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
            allow="geolocation"
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
            geolocationEnabled
            mixedContentMode="always"
            startInLoadingState
            renderLoading={() => (
              <View style={styles.carregando}>
                <ActivityIndicator size="large" color={COLORS.coral} />
                <Text style={styles.carregandoTexto}>Carregando mapa...</Text>
              </View>
            )}
          />
        )}
      </View>

      <View style={styles.rodape}>
        <Text style={styles.rodapeTexto}>
          {marcadoresFiltrados.length}{" "}
          {marcadoresFiltrados.length === 1
            ? "registro encontrado"
            : "registros encontrados"}
          {especieSelecionada !== "Todas" ? ` de ${especieSelecionada}` : ""}
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