import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { obterMinhasObservacoes } from "../api/auth";
import BrandHeader from "../components/BrandHeader";
import {
  COLORS,
  RADIUS,
  SHADOW,
  SPACING,
  TYPOGRAPHY
} from "../theme";

// Enciclopédia das espécies do projeto.
const ENCICLOPEDIA = {
  "colhereiro": {
    nome: "Colhereiro",
    cientifico: "Platalea ajaja",
    grupo: "Ave aquática",
    descricao:
      "Ave de plumagem rosada e bico achatado em formato de colher, que usa para vasculhar a lama em busca de pequenos crustáceos e peixes. Frequenta manguezais, marismas e bordas de rios.",
    curiosidade:
      "A cor rosada vem dos carotenoides dos crustáceos que come, assim como no flamingo."
  },
  "guará-vermelho": {
    nome: "Guará-vermelho",
    cientifico: "Eudocimus ruber",
    grupo: "Ave aquática",
    descricao:
      "Ave de cor vermelha intensa, pernas longas e bico curvado para baixo. Vive em manguezais e restingas do litoral norte do Brasil, alimentando-se de caranguejos e moluscos.",
    curiosidade:
      "É uma das aves mais simbólicas dos manguezais brasileiros — e dá nome a este projeto."
  },
  "martim-pescador": {
    nome: "Martim-pescador",
    cientifico: "Megaceryle torquata",
    grupo: "Ave pescadora",
    descricao:
      "Ave de peito ruivo e dorso azul-acinzentado, especialista em pescar: paira sobre a água e mergulha em alta velocidade para capturar peixes pequenos.",
    curiosidade:
      "Costuma usar poleiros fixos à beira da água, de onde observa os peixes antes do mergulho."
  },
  "guaiamum": {
    nome: "Guaiamum",
    cientifico: "Cardisoma guanhumi",
    grupo: "Crustáceo",
    descricao:
      "Caranguejo terrestre de coloração azulada, muito comum em áreas de mangue. Cava tocas profundas no solo e se alimenta principalmente de folhas em decomposição.",
    curiosidade:
      "Tem importância cultural e econômica para as comunidades pesqueiras do litoral brasileiro."
  }
};

function normalizarEspecie(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase();
}

function rotuloEspecie(valor) {
  const texto = String(valor || "").trim();
  if (!texto) {
    return "Não identificada";
  }
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function MeuMangueScreen({
  onNavigate
}) {
  const [carregando, setCarregando] =
    useState(true);
  const [descobertas, setDescobertas] =
    useState({});

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const dados = await obterMinhasObservacoes();
        if (ativo && Array.isArray(dados?.observacoes)) {
          const mapa = {};
          for (const observacao of dados.observacoes) {
            const chave = normalizarEspecie(
              observacao.especie_corrigida ||
                observacao.especie_detectada
            );
            if (!chave || chave === "não identificado") {
              continue;
            }
            if (!mapa[chave]) {
              mapa[chave] = {
                registros: 0,
                primeiraVez: observacao.criado_em
              };
            }
            mapa[chave].registros += 1;
          }
          setDescobertas(mapa);
        }
      } catch {
        // Sem conexão: mostra a coleção vazia.
      }
      if (ativo) {
        setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const chavesDescobertas = Object.keys(descobertas);
  const totalEspecies = Object.keys(ENCICLOPEDIA).length;
  const totalRegistros = chavesDescobertas.reduce(
    (soma, chave) => soma + descobertas[chave].registros,
    0
  );

  function renderizarCard(chave) {
    const info = ENCICLOPEDIA[chave];
    const descoberta = descobertas[chave];
    if (!descoberta) {
      return (
        <View
          key={chave}
          style={[styles.card, styles.cardBloqueado]}
        >
          <View style={styles.topoBloqueado}>
            <Text style={styles.interrogacao}>
              ???
            </Text>
            <Text style={styles.grupoBloqueado}>
              Espécie não descoberta
            </Text>
          </View>
          <Text style={styles.dicaBloqueado}>
            Escaneie esta espécie no scanner para revelar as informações aqui.
          </Text>
        </View>
      );
    }
    const primeiraData = descoberta.primeiraVez
      ? new Date(descoberta.primeiraVez).toLocaleDateString("pt-BR")
      : "";
    return (
      <View key={chave} style={styles.card}>
        <View style={styles.cardTopo}>
          <View style={styles.cardTitulos}>
            <Text style={styles.cardNome}>
              {info.nome}
            </Text>
            <Text style={styles.cardCientifico}>
              {info.cientifico}
            </Text>
          </View>
          <View style={styles.selo}>
            <Text style={styles.seloTexto}>
              ✅
            </Text>
          </View>
        </View>
        <Text style={styles.cardGrupo}>
          {info.grupo}
        </Text>
        <Text style={styles.cardDescricao}>
          {info.descricao}
        </Text>
        <View style={styles.curiosidadeBox}>
          <Text style={styles.curiosidadeTitulo}>
            Você sabia?
          </Text>
          <Text style={styles.curiosidadeTexto}>
            {info.curiosidade}
          </Text>
        </View>
        <View style={styles.cardRodape}>
          <Text style={styles.cardRegistro}>
            {descoberta.registros === 1
              ? "1 registro seu"
              : `${descoberta.registros} registros seus`}
          </Text>
          {primeiraData ? (
            <Text style={styles.cardData}>
              Descoberta em {primeiraData}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <BrandHeader
        eyebrow="RUBRA • GUARÁ"
        title="Meu Mangue"
        description="Sua coleção de espécies do mangue. Escaneie para descobrir!"
      />
      <View style={styles.progressoCard}>
        <Text style={styles.progressoNumero}>
          {carregando
            ? "..."
            : `${chavesDescobertas.length} de ${totalEspecies}`}
        </Text>
        <Text style={styles.progressoTexto}>
          espécies descobertas por você
          {totalRegistros > 0
            ? ` • ${totalRegistros} registros no total`
            : ""}
        </Text>
      </View>
      {carregando ? (
        <Text style={styles.vazio}>
          Carregando sua coleção...
        </Text>
      ) : chavesDescobertas.length === 0 ? (
        <Text style={styles.vazio}>
          Nenhuma espécie descoberta ainda. Abra o scanner e registre sua primeira observação!
        </Text>
      ) : null}
      {Object.keys(ENCICLOPEDIA).map(renderizarCard)}
      <View style={styles.linkArea}>
        <Text style={styles.linkTexto}>
          Quer descobrir mais espécies?
        </Text>
        <Text
          style={styles.linkEscaneie}
          onPress={() => onNavigate("observar")}
        >
          Abrir o scanner
        </Text>
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
  progressoCard: {
    backgroundColor: COLORS.green,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
    ...SHADOW.card
  },
  progressoNumero: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: "800"
  },
  progressoTexto: {
    color: COLORS.pink,
    fontSize: 13,
    textAlign: "center",
    marginTop: 4
  },
  vazio: {
    color: COLORS.gray,
    fontSize: 13,
    lineHeight: 19,
    marginTop: SPACING.lg,
    textAlign: "center"
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    ...SHADOW.card
  },
  cardBloqueado: {
    backgroundColor: COLORS.cream
  },
  cardTopo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  cardTitulos: {
    flex: 1
  },
  cardNome: {
    color: COLORS.brown,
    fontSize: 21,
    fontWeight: "800"
  },
  cardCientifico: {
    color: COLORS.gray,
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 2
  },
  selo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center"
  },
  seloTexto: {
    fontSize: 16
  },
  cardGrupo: {
    color: COLORS.coral,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: SPACING.sm,
    textTransform: "uppercase"
  },
  cardDescricao: {
    color: COLORS.brown,
    fontSize: 14,
    lineHeight: 21,
    marginTop: SPACING.sm
  },
  curiosidadeBox: {
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md
  },
  curiosidadeTitulo: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4
  },
  curiosidadeTexto: {
    color: COLORS.gray,
    fontSize: 13,
    lineHeight: 19
  },
  cardRodape: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  cardRegistro: {
    color: COLORS.green,
    fontSize: 12,
    fontWeight: "800"
  },
  cardData: {
    color: COLORS.gray,
    fontSize: 12
  },
  topoBloqueado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  interrogacao: {
    color: COLORS.gray,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: 2
  },
  grupoBloqueado: {
    color: COLORS.gray,
    fontSize: 12,
    fontWeight: "800"
  },
  dicaBloqueado: {
    color: COLORS.gray,
    fontSize: 13,
    lineHeight: 19,
    marginTop: SPACING.sm
  },
  linkArea: {
    alignItems: "center",
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  linkTexto: {
    color: COLORS.gray,
    fontSize: 14
  },
  linkEscaneie: {
    color: COLORS.green,
    fontSize: 15,
    fontWeight: "800",
    marginTop: SPACING.sm
  }
});