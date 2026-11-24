import { useState } from "react";
import {
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
  const [erro, setErro] = useState("");

  async function entrar() {
    setErro("");
    const emailNormalizado = email.trim().toLowerCase();

    if (!emailNormalizado || !senha) {
      setErro("Informe seu e-mail e sua senha.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
      setErro("Informe um e-mail válido.");
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
      setErro(
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

        {erro ? (
          <View style={styles.erroCard}>
            <Text style={styles.erroTexto}>{erro}</Text>
          </View>
        ) : null}

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

          <View style={styles.botaoEntrar}>
            <PrimaryButton
              title="Entrar"
              onPress={entrar}
              loading={carregando}
              disabled={carregando}
            />
          </View>
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
  erroCard: {
    backgroundColor: "#B3261E",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg
  },
  erroTexto: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700"
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
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
  botaoEntrar: {
    marginTop: SPACING.lg
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