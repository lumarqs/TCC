import {
  ScrollView,
  View,
  Text,
  StyleSheet
} from "react-native";

import BrandHeader from "../components/BrandHeader";
import PrimaryButton from "../components/PrimaryButton";
import {
  COLORS,
  RADIUS,
  SPACING,
  SHADOW,
  TYPOGRAPHY
} from "../theme";

export default function AboutScreen({
  onNavigate
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <BrandHeader
        eyebrow="RUBRA • GUARÁ"
        title="Sobre o projeto"
        description="Tecnologia, ciência cidadã e preservação conectadas pelo território."
      />

      <View style={styles.destaque}>
        <Text style={styles.destaqueTitulo}>
          Observar para preservar
        </Text>

        <Text style={styles.destaqueTexto}>
          O aplicativo apoia o registro de espécies e a visualização de ocorrências em áreas de mangue.
        </Text>
      </View>

      <Text style={styles.tituloSecao}>
        Objetivo
      </Text>

      <Text style={styles.texto}>
        Registrar fotografias, localizações e identificações de espécies para organizar informações sobre a biodiversidade da região.
      </Text>

      <Text style={styles.tituloSecao}>
        Como funciona
      </Text>

      <View style={styles.etapa}>
        <View style={styles.numero}>
          <Text style={styles.numeroTexto}>
            1
          </Text>
        </View>

        <View style={styles.etapaConteudo}>
          <Text style={styles.etapaTitulo}>
            Registre
          </Text>

          <Text style={styles.etapaTexto}>
            Capture uma foto pelo aplicativo e permita o acesso à localização.
          </Text>
        </View>
      </View>

      <View style={styles.etapa}>
        <View style={styles.numero}>
          <Text style={styles.numeroTexto}>
            2
          </Text>
        </View>

        <View style={styles.etapaConteudo}>
          <Text style={styles.etapaTitulo}>
            Analise
          </Text>

          <Text style={styles.etapaTexto}>
            O Worker processa a imagem e organiza os dados da observação.
          </Text>
        </View>
      </View>

      <View style={styles.etapa}>
        <View style={styles.numero}>
          <Text style={styles.numeroTexto}>
            3
          </Text>
        </View>

        <View style={styles.etapaConteudo}>
          <Text style={styles.etapaTitulo}>
            Explore
          </Text>

          <Text style={styles.etapaTexto}>
            Consulte o mapa para visualizar a concentração provisória dos registros.
          </Text>
        </View>
      </View>

        <View></View>
      <View style={styles.citacao}>
        <Text style={styles.citacaoTexto}>
          “Cada registro ajuda a revelar a vida que existe no mangue.”
        </Text>
      </View>

      <View style={styles.botao}>
        <PrimaryButton
          title="Fazer uma observação"
          onPress={() => onNavigate("captura")}
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

  destaque: {
    backgroundColor: COLORS.blueGray,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOW.card
  },

  destaqueTitulo: {
    color: COLORS.white,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "800",
    marginBottom: SPACING.sm
  },

  destaqueTexto: {
    color: COLORS.white,
    fontSize: 15,
    lineHeight: 22
  },

  tituloSecao: {
    ...TYPOGRAPHY.sectionTitle,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm
  },

  texto: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.lg
  },

  etapa: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.md
  },

  numero: {
    width: 36,
    height: 36,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.coral,
    marginRight: SPACING.md
  },

  numeroTexto: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800"
  },

  etapaConteudo: {
    flex: 1,
    paddingTop: 2
  },

  etapaTitulo: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 3
  },

  etapaTexto: {
    color: COLORS.gray,
    fontSize: 14,
    lineHeight: 20
  },

  citacao: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.coral,
    backgroundColor: COLORS.cream,
    padding: SPACING.md,
    marginTop: SPACING.lg
  },

  citacaoTexto: {
    color: COLORS.brown,
    fontSize: 16,
    lineHeight: 23,
    fontStyle: "italic",
    fontWeight: "600"
  },

  botao: {
    marginTop: SPACING.lg
  }
});