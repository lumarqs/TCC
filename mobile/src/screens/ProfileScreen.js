import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";

import BrandHeader from "../components/BrandHeader";
import {
    COLORS,
    RADIUS,
    SHADOW,
    SPACING,
    TYPOGRAPHY
} from "../theme";

export default function ProfileScreen({
  usuario,
  fotoPerfil,
  onChangeFoto,
  onLogout
}) {
  const [carregandoFoto, setCarregandoFoto] =
    useState(false);

  async function escolherFoto() {
    setCarregandoFoto(true);

    try {
      const permissao =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissao.granted) {
        Alert.alert(
          "Permissão necessária",
          "Permita o acesso às fotos para escolher uma imagem de perfil."
        );
        return;
      }

      const resultado =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8
        });

      if (
        !resultado.canceled &&
        resultado.assets?.length > 0
      ) {
        onChangeFoto(
          resultado.assets[0].uri
        );
      }
    } catch {
      Alert.alert(
        "Não foi possível escolher a foto",
        "Tente novamente."
      );
    } finally {
      setCarregandoFoto(false);
    }
  }

  function confirmarSaida() {
    Alert.alert(
      "Sair da conta",
      "Deseja realmente sair?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Sair",
          style: "destructive",
          onPress: onLogout
        }
      ]
    );
  }

  const nome =
    usuario?.nome || "Usuário";

  const email =
    usuario?.email || "E-mail não informado";

  const cargo =
    usuario?.cargo || "membro";

  const pontos =
    usuario?.pontos ?? 0;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <BrandHeader
        eyebrow="RUBRA • GUARÁ"
        title="Meu perfil"
        description="Acompanhe seus dados e personalize sua conta."
      />

      <View style={styles.perfilCard}>
        <Pressable
          onPress={escolherFoto}
          disabled={carregandoFoto}
          style={styles.fotoArea}
        >
          {fotoPerfil ? (
            <Image
              source={{ uri: fotoPerfil }}
              style={styles.foto}
            />
          ) : (
            <View style={styles.fotoPadrao}>
              <Text style={styles.iconePessoa}>
                👤
              </Text>
            </View>
          )}

          <View style={styles.botaoFoto}>
            <Text style={styles.botaoFotoTexto}>
              {carregandoFoto
                ? "..."
                : "＋"}
            </Text>
          </View>
        </Pressable>

        <Text style={styles.nome}>
          {nome}
        </Text>

        <Text style={styles.email}>
          {email}
        </Text>

        <Pressable
          onPress={escolherFoto}
          disabled={carregandoFoto}
          style={styles.botaoEscolher}
        >
          <Text style={styles.botaoEscolherTexto}>
            {carregandoFoto
              ? "Abrindo galeria..."
              : "Escolher foto de perfil"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.tituloSecao}>
          Informações da conta
        </Text>

        <View style={styles.infoLinha}>
          <Text style={styles.infoLabel}>
            Nome
          </Text>

          <Text style={styles.infoValor}>
            {nome}
          </Text>
        </View>

        <View style={styles.infoLinha}>
          <Text style={styles.infoLabel}>
            E-mail
          </Text>

          <Text style={styles.infoValor}>
            {email}
          </Text>
        </View>

        <View style={styles.infoLinha}>
          <Text style={styles.infoLabel}>
            Cargo
          </Text>

          <Text style={styles.infoValorDestaque}>
            {cargo}
          </Text>
        </View>

        <View style={styles.infoLinha}>
          <Text style={styles.infoLabel}>
            Pontos
          </Text>

          <Text style={styles.infoValorDestaque}>
            {pontos}
          </Text>
        </View>
      </View>

      <View style={styles.pontosCard}>
        <Text style={styles.pontosTitulo}>
          Sua participação
        </Text>

        <Text style={styles.pontosNumero}>
          {pontos}
        </Text>

        <Text style={styles.pontosTexto}>
          pontos acumulados nas observações do mangue
        </Text>
      </View>

      <Pressable
        onPress={confirmarSaida}
        style={styles.botaoSair}
      >
        <Text style={styles.botaoSairTexto}>
          Sair da conta
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.pink,
    padding: SPACING.lg,
    paddingTop: 52,
    paddingBottom: SPACING.xxl
  },

  perfilCard: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOW.card
  },

  fotoArea: {
    position: "relative",
    marginBottom: SPACING.md
  },

  foto: {
    width: 116,
    height: 116,
    borderRadius: 58
  },

  fotoPadrao: {
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.green
  },

  iconePessoa: {
    fontSize: 52
  },

  botaoFoto: {
    position: "absolute",
    right: -2,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.coral,
    borderWidth: 3,
    borderColor: COLORS.white
  },

  botaoFotoTexto: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 24
  },

  nome: {
    color: COLORS.brown,
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center"
  },

  email: {
    color: COLORS.gray,
    fontSize: 14,
    marginTop: SPACING.xs,
    textAlign: "center"
  },

  botaoEscolher: {
    backgroundColor: COLORS.pink,
    borderRadius: RADIUS.pill,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm
  },

  botaoEscolherTexto: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "800"
  },

  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    ...SHADOW.card
  },

  tituloSecao: {
    ...TYPOGRAPHY.sectionTitle,
    marginBottom: SPACING.md
  },

  infoLinha: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACING.md
  },

  infoLabel: {
    color: COLORS.gray,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4
  },

  infoValor: {
    color: COLORS.brown,
    fontSize: 16
  },

  infoValorDestaque: {
    color: COLORS.green,
    fontSize: 16,
    fontWeight: "800"
  },

  pontosCard: {
    backgroundColor: COLORS.coral,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    alignItems: "center",
    ...SHADOW.card
  },

  pontosTitulo: {
    color: COLORS.pink,
    fontSize: 15,
    fontWeight: "800"
  },

  pontosNumero: {
    color: COLORS.white,
    fontSize: 46,
    fontWeight: "800",
    marginTop: SPACING.sm
  },

  pontosTexto: {
    color: COLORS.pink,
    fontSize: 13,
    textAlign: "center"
  },

  botaoSair: {
    alignItems: "center",
    borderColor: COLORS.coral,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md
  },

  botaoSairTexto: {
    color: COLORS.coral,
    fontSize: 15,
    fontWeight: "800"
  }
});