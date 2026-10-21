import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator
} from "react-native";

import {
  COLORS,
  RADIUS,
  SPACING
} from "../theme";

export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary"
}) {
  const secondary =
    variant === "secondary";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            secondary
              ? COLORS.green
              : COLORS.white
          }
        />
      ) : (
        <Text
          style={[
            styles.text,
            secondary && styles.secondaryText
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.coral,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg
  },

  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.green
  },

  text: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800"
  },

  secondaryText: {
    color: COLORS.green
  },

  pressed: {
    opacity: 0.78,
    transform: [
      {
        scale: 0.98
      }
    ]
  },

  disabled: {
    opacity: 0.5
  }
});