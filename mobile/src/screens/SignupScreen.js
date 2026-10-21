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

import { cadastrarUsuario } from "../api/auth";
import BrandHeader from "../components/BrandHeader";
import PrimaryButton from "../components/PrimaryButton";
import {
  COLORS,
  RADIUS,
  SHADOW,
  SPACING,
  TYPOGRAPHY
} from "../theme";

function nomeCompletoValido(nome) {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return partes.length >= 2;
}

function senhaValida(senha) {
  return (
    senha.length >= 8 &&
    /[A-Z]/.test(senha) &&
    /[a-z]/.test(senha) &&
    /[0-9]/.test(senha) &&
    /[^A-Za-z0-9]/.test(senha)
  );
}

export default function SignupScreen({
  onNavigate
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] =
    useState("");
  const [carregando, setCarregando] =
    useState(false);

  async function cadastrar() {
    const nomeNormalizado = nome
      .trim()
      .replace(/\s+/g, " ");

    const emailNormalizado = email
      .trim()
      .toLowerCase();

    if (!nomeNormalizado || !emailNormalizado || !senha) {
      Alert.alert(
        "Campos obrigatórios",
        "Preencha todos os campos."
      );
      return;
    }

    if (!nomeCompletoValido(nomeNormalizado)) {
      Alert.alert(
        "Nome inválido",
        "Informe seu nome e sobrenome."
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+$/.test(emailNormalizado)) {
      Alert.alert(
        "E-mail inválido",
        "Informe um e-mail válido."
      );
      return;
    }

    if (!senhaValida(senha)) {
      Alert.alert(
        "Senha fraca",
        "A senha precisa ter pelo menos 8 caracteres, uma letra maiúscula, uma letra minúscula, um número e um caractere especial."
      );
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert(
        "Senhas diferentes",
        "A confirmação de senha não coincide."
      );
      return;
    }

    setCarregando(true);

    try {
      await cadastrarUsuario({
        nome: nomeNormalizado,
        email: emailNormalizado,
        senha
      });

      Alert.alert(
        "Cadastro realizado",
        "Sua conta foi criada com sucesso.",
        [
          {
            text: "Ir para o login",
            onPress: () => onNavigate("login")
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        "Não foi possível cadastrar",
        error?.message ||
          "Tente novamente."
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
          title="Crie sua conta"
          description="Cadastre-se para registrar e acompanhar suas observações."
        />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Cadastro
          </Text>

          <Text style={styles.label}>
            Nome completo
          </Text>

          <TextInput
            value={nome}
            onChangeText={setNome}
            placeholder="Seu nome e sobrenome"
            placeholderTextColor={COLORS.gray}
            autoCapitalize="words"
            editable={!carregando}
            style={styles.input}
          />

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
            placeholder="Crie uma senha"
            placeholderTextColor={COLORS.gray}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!carregando}
            style={styles.input}
          />

          <Text style={styles.dica}>
            Mínimo de 8 caracteres, com maiúscula,
            minúscula, número e caractere especial.
          </Text>

          <Text style={styles.label}>
            Confirmar senha
          </Text>

          <TextInput
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            placeholder="Digite a senha novamente"
            placeholderTextColor={COLORS.gray}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!carregando}
            style={styles.input}
          />

          <PrimaryButton
            title="Criar cadastro"
            onPress={cadastrar}
            loading={carregando}
            disabled={carregando}
          />
        </View>

        <View style={styles.rodape}>
          <Text style={styles.rodapeTexto}>
            Já possui uma conta?
          </Text>

          <Pressable
            onPress={() => onNavigate("login")}
            disabled={carregando}
          >
            <Text style={styles.link}>
              Voltar para o login
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

  dica: {
    color: COLORS.gray,
    fontSize: 12,
    lineHeight: 17,
    marginTop: SPACING.sm
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