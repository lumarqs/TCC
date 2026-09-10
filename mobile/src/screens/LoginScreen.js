import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { fazerLogin } from "../api/auth";
import BrandHeader from "../components/BrandHeader";
import PrimaryButton from "../components/PrimaryButton";
import {
  COLORS,
  RADIUS,
  SHADOW,
  SPACING,
  TYPOGRAPHY
} from "../theme";

export default function LoginScreen({
  onNavigate,
  onAuthenticated
}) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    const emailNormalizado = email
      .trim()
      .toLowerCase();

    if (!emailNormalizado || !senha) {
      Alert.alert(
        "Campos obrigatórios",
        "Informe seu e-mail e sua senha."
      );

      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        emailNormalizado
      )
    ) {
      Alert.alert(
        "E-mail inválido",
        "Informe um e-mail válido."
      );

      return;
    }

    setCarregando(true);

    try {
      const dados = await fazerLogin({
        email: emailNormalizado,
        senha
      });

      onAuthenticated(dados);
    } catch (error) {
      Alert.alert(
        "Não foi possível entrar",
        error?.message ||
          "Verifique seu e-mail e sua senha."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <BrandHeader
          eyebrow="RUBRA • GUARÁ"
          title="Bem-vindo de volta"
          description="Entre para continuar acompanhando suas observações do mangue."
        />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Entrar
          </Text>

          <Text style={styles.label}>
            E-mail
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="seuemail@gmail.com"
            placeholderTextColor={COLORS.gray}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!carregando}
            style={styles.input}
          />

          <Text style={styles.label}>
            Senha
          </Text>

          <TextInput
            value={senha}
            onChangeText={setSenha}
            placeholder="Digite sua senha"
            placeholderTextColor={COLORS.gray}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!carregando}
            style={styles.input}
          />

          <Pressable
            onPress={() =>
              Alert.alert(
                "Recuperação de senha",
                "Essa função será adicionada posteriormente."
              )
            }
            style={styles.esqueci}
            disabled={carregando}
          >
            <Text style={styles.esqueciTexto}>
              Esqueci minha senha
            </Text>
          </Pressable>

          <PrimaryButton
            title="Entrar"
            onPress={entrar}
            loading={carregando}
            disabled={carregando}
          />
        </View>

        <View style={styles.rodape}>
          <Text style={styles.rodapeTexto}>
            Ainda não tem uma conta?
          </Text>

          <Pressable
            onPress={() => onNavigate("cadastro")}
            disabled={carregando}
          >
            <Text style={styles.link}>
              Criar cadastro
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },

  container: {
    flexGrow: 1,
    backgroundColor: COLORS.pink,
    padding: SPACING.lg,
    paddingTop: 62,
    paddingBottom: SPACING.xxl
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOW.card
  },

  cardTitle: {
    ...TYPOGRAPHY.sectionTitle,
    marginBottom: SPACING.lg
  },

  label: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm
  },

  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cream,
    color: COLORS.black,
    paddingHorizontal: SPACING.md,
    fontSize: 15
  },

  esqueci: {
    alignSelf: "flex-end",
    marginVertical: SPACING.md
  },

  esqueciTexto: {
    color: COLORS.coral,
    fontSize: 13,
    fontWeight: "800"
  },

  rodape: {
    alignItems: "center",
    marginTop: SPACING.lg
  },

  rodapeTexto: {
    color: COLORS.gray,
    fontSize: 14
  },

  link: {
    color: COLORS.green,
    fontSize: 15,
    fontWeight: "800",
    marginTop: SPACING.sm
  }
});