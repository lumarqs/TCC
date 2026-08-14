import { useEffect, useRef, useState } from "react";
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

import {
    reenviarCodigo,
    verificarCadastro,
    verificarLogin
} from "../api/auth";
import BrandHeader from "../components/BrandHeader";
import PrimaryButton from "../components/PrimaryButton";
import {
    COLORS,
    RADIUS,
    SHADOW,
    SPACING
} from "../theme";

export default function VerificationScreen({
  email,
  finalidade,
  mensagem,
  onNavigate,
  onAuthenticated
}) {
  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] =
    useState(false);
  const [reenviando, setReenviando] =
    useState(false);
  const [segundos, setSegundos] =
    useState(60);

  const inputRef = useRef(null);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setSegundos((valor) =>
        valor > 0 ? valor - 1 : 0
      );
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  async function confirmar() {
    if (codigo.length !== 6) {
      Alert.alert(
        "Código incompleto",
        "Digite o código de seis números recebido por e-mail."
      );
      return;
    }

    setCarregando(true);

    try {
      let dados;

      if (finalidade === "cadastro") {
        dados = await verificarCadastro({
          email,
          codigo
        });
      } else {
        dados = await verificarLogin({
          email,
          codigo
        });
      }

      Alert.alert(
        "Verificação concluída",
        dados.mensagem ||
          "Seu e-mail foi confirmado."
      );

      if (finalidade === "login") {
        onAuthenticated(dados);
      } else {
        onNavigate("login");
      }
    } catch (error) {
      Alert.alert(
        "Código inválido",
        error.message
      );
    } finally {
      setCarregando(false);
    }
  }

  async function reenviar() {
    if (segundos > 0 || reenviando) {
      return;
    }

    setReenviando(true);

    try {
      const dados = await reenviarCodigo({
        email,
        finalidade
      });

      setSegundos(60);
      setCodigo("");

      Alert.alert(
        "Código reenviado",
        dados.mensagem ||
          "Um novo código foi enviado."
      );
    } catch (error) {
      Alert.alert(
        "Não foi possível reenviar",
        error.message
      );
    } finally {
      setReenviando(false);
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
          eyebrow="VERIFICAÇÃO"
          title="Confirme seu e-mail"
          description="Digite o código enviado para concluir esta etapa."
        />

        <View style={styles.card}>
          <View style={styles.icone}>
            <Text style={styles.iconeTexto}>
              @
            </Text>
          </View>

          <Text style={styles.titulo}>
            Código de segurança
          </Text>

          <Text style={styles.mensagem}>
            {mensagem ||
              `Enviamos um código para ${email}.`}
          </Text>

          <Text style={styles.email}>
            {email}
          </Text>

          <TextInput
            ref={inputRef}
            value={codigo}
            onChangeText={(valor) =>
              setCodigo(
                valor
                  .replace(/[^0-9]/g, "")
                  .slice(0, 6)
              )
            }
            placeholder="000000"
            placeholderTextColor={COLORS.gray}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
            style={styles.codigoInput}
          />

          <PrimaryButton
            title="Confirmar código"
            onPress={confirmar}
            loading={carregando}
            disabled={carregando}
          />

          <Pressable
            onPress={reenviar}
            disabled={
              segundos > 0 || reenviando
            }
            style={styles.reenviar}
          >
            <Text
              style={[
                styles.reenviarTexto,
                segundos > 0 &&
                  styles.reenviarDesativado
              ]}
            >
              {reenviando
                ? "Reenviando..."
                : segundos > 0
                ? `Reenviar em ${segundos}s`
                : "Reenviar código"}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() =>
            onNavigate(
              finalidade === "cadastro"
                ? "cadastro"
                : "login"
            )
          }
          style={styles.voltar}
        >
          <Text style={styles.voltarTexto}>
            Voltar
          </Text>
        </Pressable>
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
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOW.card
  },

  icone: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 40,
    backgroundColor: COLORS.coral,
    marginBottom: SPACING.md
  },

  iconeTexto: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "800"
  },

  titulo: {
    color: COLORS.green,
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center"
  },

  mensagem: {
    color: COLORS.gray,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: SPACING.sm
  },

  email: {
    color: COLORS.brown,
    fontSize: 14,
    fontWeight: "800",
    marginTop: SPACING.sm
  },

  codigoInput: {
    width: "100%",
    minHeight: 64,
    borderWidth: 1.5,
    borderColor: COLORS.coral,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.cream,
    color: COLORS.green,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 8,
    marginVertical: SPACING.lg
  },

  reenviar: {
    marginTop: SPACING.lg
  },

  reenviarTexto: {
    color: COLORS.coral,
    fontSize: 14,
    fontWeight: "800"
  },

  reenviarDesativado: {
    color: COLORS.gray
  },

  voltar: {
    alignSelf: "center",
    marginTop: SPACING.lg
  },

  voltarTexto: {
    color: COLORS.green,
    fontSize: 15,
    fontWeight: "800"
  }
});