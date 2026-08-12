import {
  View,
  Text,
  StyleSheet,
  Pressable
} from "react-native";

import BrandHeader from "../components/BrandHeader";
import {
  COLORS,
  RADIUS,
  SPACING,
  SHADOW,
  TYPOGRAPHY
} from "../theme";

export default function HomeScreen({
  onNavigate
}) {
  return (
    <View style={styles.container}>
      <BrandHeader
        eyebrow="RUBRA • GUARÁ"
        title="Conheça o mangue ao seu redor"
        description="Registre espécies, acompanhe os dados e observe a transformação da região."
      />

      <View style={styles.heroCard}>
        <View style={styles.heroCircle} />

        <Text style={styles.heroEyebrow}>
          OBSERVAÇÃO DE CAMPO
        </Text>

        <Text style={styles.heroTitle}>
          Uma foto pode contar uma história.
        </Text>

        <Text style={styles.heroText}>
          Registre uma espécie com fotografia e localização para ajudar a construir um mapa vivo do mangue.
        </Text>

        <Pressable
          style={styles.heroButton}
          onPress={() => onNavigate("captura")}
        >
          <Text style={styles.heroButtonText}>
            Fazer observação
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>
        O que você pode fazer
      </Text>

      <View style={styles.cardsRow}>
        <Pressable
          style={[
            styles.smallCard,
            styles.blueCard
          ]}
          onPress={() => onNavigate("mapa")}
        >
          <Text style={styles.cardIcon}>
            ◉
          </Text>

          <Text style={styles.cardTitle}>
            Ver o mapa
          </Text>

          <Text style={styles.cardText}>
            Explore os pontos registrados.
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.smallCard,
            styles.greenCard
          ]}
          onPress={() => onNavigate("sobre")}
        >
          <Text style={styles.cardIcon}>
            ?
          </Text>

          <Text style={styles.cardTitle}>
            Sobre o projeto
          </Text>

          <Text style={styles.cardText}>
            Entenda a pesquisa Rubra Guará.
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.pink,
    padding: SPACING.lg,
    paddingTop: 64
  },

  heroCard: {
    backgroundColor: COLORS.coral,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    overflow: "hidden",
    marginBottom: SPACING.xl,
    ...SHADOW.card
  },

  heroCircle: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 100,
    right: -55,
    top: -70,
    backgroundColor: "rgba(255,255,255,0.13)"
  },

  heroEyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "800",
    color: COLORS.pink,
    marginBottom: SPACING.sm
  },

  heroTitle: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "800",
    color: COLORS.white,
    maxWidth: 280
  },

  heroText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.pink,
    marginTop: SPACING.md
  },

  heroButton: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.pink,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.lg
  },

  heroButtonText: {
    color: COLORS.brown,
    fontWeight: "800"
  },

  sectionTitle: {
    ...TYPOGRAPHY.sectionTitle,
    marginBottom: SPACING.md
  },

  cardsRow: {
    flexDirection: "row",
    gap: SPACING.sm
  },

  smallCard: {
    flex: 1,
    minHeight: 160,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SHADOW.card
  },

  blueCard: {
    backgroundColor: COLORS.blueGray
  },

  greenCard: {
    backgroundColor: COLORS.green
  },

  cardIcon: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: "800",
    marginBottom: SPACING.sm
  },

  cardTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: SPACING.sm
  },

  cardText: {
    color: COLORS.white,
    fontSize: 13,
    lineHeight: 18
  }
});