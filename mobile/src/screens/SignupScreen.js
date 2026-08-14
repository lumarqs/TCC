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

export default function SignupScreen({
  onNavigate,
  onVerification
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] =
    useState("");
  const [carregando, setCarregando] =
    useState(false);

    function validarNomeCompleto(nome) {
        const partes = nome
          .trim()
          .split(/\s+/)
          .filter(Boolean);
      
        return (
          partes.length >= 2 &&
          partes.every((parte) => parte.length >= 2)
        );
      }
      
      function validarEmailGmail(email) {
        return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(
          email.trim()
        );
      }
      
      function validarSenha(senha) {
        return (
          senha.length >= 8 &&
          /[A-Z]/.test(senha) &&
          /[0-9]/.test(senha) &&
          /[^A-Za-z0-9]/.test(senha)
        );
      }

  async function cadastrar() {
  const nomeNormalizado = nome
    .trim()
    .replace(/\s+/g, " ");

  const emailNormalizado = email
    .trim()
    .toLowerCase();

  if (!validarNomeCompleto(nomeNormalizado)) {
    Alert.alert(
      "Nome completo obrigatório",
      "Digite pelo menos nome e sobrenome."
    );
    return;
  }

  if (!validarEmailGmail(emailNormalizado)) {
    Alert.alert(
      "E-mail inválido",
      "Use obrigatoriamente um endereço terminado em @gmail.com."
    );
    return;
  }

  if (!validarSenha(senha)) {
    Alert.alert(
      "Senha inválida",
      "A senha precisa ter pelo menos 8 caracteres, uma letra maiúscula, um número e um caractere especial."
    );
    return;
  }

  if (senha !== confirmacao) {
    Alert.alert(
      "Senhas diferentes",
      "A confirmação precisa ser igual à senha."
    );
    return;
  }

  setCarregando(true);

  try {
    const dados = await cadastrarUsuario({
      nome: nomeNormalizado,
      email: emailNormalizado,
      senha
    });

    onVerification({
      email: emailNormalizado,
      finalidade: "cadastro",
      mensagem:
        dados.mensagem ||
        "Enviamos um código de verificação para seu e-mail."
    });
  } catch (error) {
    Alert.alert(
      "Não foi possível cadastrar",
      error.message
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
          description="Cadastre-se para registrar e acompanhar observações ambientais."
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
            placeholder="Digite seu nome"
            placeholderTextColor={COLORS.gray}
            autoCapitalize="words"
            style={styles.input}
          />

          <Text style={styles.label}>
            E-mail
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="seuemail@exemplo.com"
            placeholderTextColor={COLORS.gray}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <Text style={styles.label}>
            Senha
          </Text>

          <TextInput
            value={senha}
            onChangeText={setSenha}
            placeholder="Mínimo de 8 caracteres"
            placeholderTextColor={COLORS.gray}
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />

          <Text style={styles.label}>
            Confirmar senha
          </Text>

          <TextInput
            value={confirmacao}
            onChangeText={setConfirmacao}
            placeholder="Digite a senha novamente"
            placeholderTextColor={COLORS.gray}
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />

<View style={styles.regrasSenha}>
  <Text style={styles.regrasTitulo}>
    A senha deve conter:
  </Text>

  <Text style={styles.regra}>
    • Pelo menos 8 caracteres
  </Text>

  <Text style={styles.regra}>
    • Uma letra maiúscula
  </Text>

  <Text style={styles.regra}>
    • Um número
  </Text>

  <Text style={styles.regra}>
    • Um caractere especial
  </Text>
</View>

          <View style={styles.aviso}>
            <Text style={styles.avisoTexto}>
              Enviaremos um código para confirmar seu e-mail.
            </Text>
          </View>

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
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm
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

  aviso: {
    backgroundColor: COLORS.pink,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.lg
  },

  avisoTexto: {
    color: COLORS.brown,
    fontSize: 13,
    lineHeight: 19
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
regrasSenha: {
    backgroundColor: COLORS.pink,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md
  },
  
  regrasTitulo: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: SPACING.sm
  },
  
  regra: {
    color: COLORS.brown,
    fontSize: 12,
    lineHeight: 19
  }