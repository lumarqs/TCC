import {
  View,
  Text,
  StyleSheet
} from "react-native";

import {
  COLORS,
  SPACING,
  TYPOGRAPHY
} from "../theme";

export default function BrandHeader({
  eyebrow = "RUBRA",
  title = "Monitoramento do mangue",
  description
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>
        {eyebrow}
      </Text>

      <Text style={styles.title}>
        {title}
      </Text>

      {description ? (
        <Text style={styles.description}>
          {description}
        </Text>
      ) : null}

      <View style={styles.decorativeLine}>
        <View style={styles.lineCoral} />
        <View style={styles.lineBlue} />
        <View style={styles.lineGreen} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg
  },

  eyebrow: {
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: "800",
    color: COLORS.coral,
    marginBottom: SPACING.sm
  },

  title: {
    ...TYPOGRAPHY.title
  },

  description: {
    ...TYPOGRAPHY.subtitle,
    marginTop: SPACING.sm
  },

  decorativeLine: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.md,
    gap: 5
  },

  lineCoral: {
    width: 42,
    height: 5,
    borderRadius: 5,
    backgroundColor: COLORS.coral
  },

  lineBlue: {
    width: 24,
    height: 5,
    borderRadius: 5,
    backgroundColor: COLORS.blueGray
  },

  lineGreen: {
    width: 14,
    height: 5,
    borderRadius: 5,
    backgroundColor: COLORS.green
  }
});