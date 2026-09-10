import {
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

import {
  COLORS,
  RADIUS,
  SPACING
} from "../theme";

const ITEMS = [
  {
    id: "inicio",
    label: "Início",
    icon: "⌂"
  },
  {
    id: "captura",
    label: "Observar",
    icon: "+"
  },
  {
    id: "mapa",
    label: "Mapa",
    icon: "◎"
  },
  {
    id: "perfil",
    label: "Perfil",
    icon: "●"
  },
  {
    id: "sobre",
    label: "Sobre",
    icon: "i"
  }
];

export default function BottomNavigation({
  telaAtual,
  onChange
}) {
  return (
    <View style={styles.container}>
      {ITEMS.map((item) => {
        const ativo =
          telaAtual === item.id;

        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            style={[
              styles.item,
              ativo && styles.itemAtivo
            ]}
          >
            <Text
              style={[
                styles.icon,
                ativo && styles.iconAtivo
              ]}
            >
              {item.icon}
            </Text>

            <Text
              style={[
                styles.label,
                ativo && styles.labelAtivo
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.xs,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md
  },

  item: {
    flex: 1,
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md
  },

  itemAtivo: {
    backgroundColor: COLORS.pink
  },

  icon: {
    fontSize: 21,
    color: COLORS.gray,
    fontWeight: "700"
  },

  iconAtivo: {
    color: COLORS.coral
  },

  label: {
    fontSize: 10,
    marginTop: 3,
    color: COLORS.gray
  },

  labelAtivo: {
    color: COLORS.green,
    fontWeight: "800"
  }
});