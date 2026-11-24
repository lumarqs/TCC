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
  // { tipo: "erro" | "ok", texto: string }
  const [aviso, setAviso] = useState(null);

  async function cadastrar() {
    setAviso(null);
    const nomeNormalizado = nome
      .trim()
      .replace(/\s+/g, " ");
    const emailNormalizado = email
      .trim()
      .toLowerCase();

    if (!nomeNormalizado || !emailNormalizado || !senha) {
      setAviso({
        tipo: "erro",
        texto: "Preencha todos os campos."
      });
      return;
    }
    if (!nomeCompletoValido(nomeNormalizado)) {
      setAviso({
        tipo: "erro",
        texto: "Informe seu nome e sobrenome."
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
      setAviso({
        tipo: "erro",
        texto: "Informe um e-mail válido."
      });
      return;
    }
    if (!senhaValida(senha)) {
      setAviso({
        tipo: "erro",
        texto:
          "A senha precisa ter 8 caracteres, com maiúscula, minúscula, número e caractere especial."
      });
      return;
    }
    if (senha !== confirmarSenha) {
      setAviso({
        tipo: "erro",
        texto: "A confirmação de senha não coincide."
      });
      return;
    }

    setCarregando(true);
    try {
      await cadastrarUsuario({
        nome: nomeNormalizado,
        email: emailNormalizado,
        senha
      });
      setNome("");
      setEmail("");
      setSenha("");
      setConfirmarSenha("");
      setAviso({
        tipo: "ok",
        texto:
          "Conta criada com sucesso! Toque abaixo para entrar."
      });
    } catch (error) {
      setAviso({
        tipo: "erro",
        texto:
          error?.message ||
          "Não foi possível cadastrar. Tente novamente."
      });
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

        {aviso ? (
          <View
            style={
              aviso.tipo === "ok"
                ? styles.avisoOk
                : styles.avisoErro
            }
          >
            <Text style={styles.avisoTexto}>
              {aviso.texto}
            </Text>
          </View>
        ) : null}

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

          <View style={styles.botao}>
            <PrimaryButton
              title="Criar cadastro"
              onPress={cadastrar}
              loading={carregando}
              disabled={carregando}
            />
          </View>

          {aviso?.tipo === "ok" ? (
            <View style={styles.botao}>
              <PrimaryButton
                title="Ir para o login"
                onPress={() => onNavigate("login")}
                variant="secondary"
              />
            </View>
          ) : null}
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
  avisoErro: {
    backgroundColor: "#B3261E",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg
  },
  avisoOk: {
    backgroundColor: COLORS.green,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg
  },
  avisoTexto: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
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
  dica: {
    color: COLORS.gray,
    fontSize: 12,
    lineHeight: 17,
    marginTop: SPACING.sm
  },
  botao: {
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