import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View
} from "react-native";

import { limparSessao } from "./src/api/auth";
import BottomNavigation from "./src/components/BottomNavigation";
import AboutScreen from "./src/screens/AboutScreen";
import CaptureScreen from "./src/screens/CaptureScreen";
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import MapScreen from "./src/screens/MapScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import SignupScreen from "./src/screens/SignupScreen";
import { COLORS } from "./src/theme";


const observacoesTeste = [
  {
    id: "teste-1",
    latitude: -23.8519,
    longitude: -46.1417,
    peso: 23,
    especie: "Guará Vermelho",
    descricao: "Observação simulada no manguezal."
  },
  {
    id: "teste-2",
    latitude: -23.8542,
    longitude: -46.1384,
    peso: 10,
    especie: "Martim-Pescador",
    descricao: "Ave observada próxima ao rio."
  },
  {
    id: "teste-3",
    latitude: -23.8487,
    longitude: -46.1451,
    peso: 58,
    especie: "Mangue Maçã",
    descricao: "Vegetação característica do manguezal."
  }
];

export default function App() {
  const [tela, setTela] = useState("login");
  const [usuario, setUsuario] = useState(null);
  const [fotoPerfil, setFotoPerfil] = useState(null);

  function chaveFotoPerfil(usuarioAtual) {
    const email =
      usuarioAtual?.email || "usuario";

    return `@rubra_guara_foto_${email}`;
  }

  async function carregarFotoPerfil(usuarioAtual) {
    if (!usuarioAtual) {
      setFotoPerfil(null);
      return;
    }

    try {
      const fotoSalva =
        await AsyncStorage.getItem(
          chaveFotoPerfil(usuarioAtual)
        );

      setFotoPerfil(fotoSalva || null);
    } catch (erro) {
      console.log(
        "Não foi possível carregar a foto:",
        erro
      );

      setFotoPerfil(null);
    }
  }

  async function entrar(dados) {
    const usuarioAtual =
      dados?.usuario || dados || null;

    setUsuario(usuarioAtual);

    await carregarFotoPerfil(usuarioAtual);

    setTela("inicio");
  }

  function sair() {
    limparSessao();

    setUsuario(null);
    setTela("login");

    // A foto não é apagada do AsyncStorage.
    // Ela reaparecerá quando o usuário entrar novamente.
  }

  function renderizarTela() {
    if (tela === "login") {
      return (
        <LoginScreen
          onNavigate={setTela}
          onAuthenticated={entrar}
        />
      );
    }

    if (tela === "cadastro") {
      return (
        <SignupScreen
          onNavigate={setTela}
        />
      );
    }

    if (tela === "mapa") {
      return (
        <MapScreen
          onNavigate={setTela}
          observacoes={observacoesTeste}
        />
      );
    }

    if (tela === "sobre") {
      return (
        <AboutScreen
          onNavigate={setTela}
          onLogout={sair}
        />
      );
    }

    if (tela === "captura") {
      return (
        <CaptureScreen
          onNavigate={setTela}
          usuario={usuario}
        />
      );
    }

    if (tela === "perfil") {
      return (
        <ProfileScreen
          usuario={usuario}
          fotoPerfil={fotoPerfil}
          onChangeFoto={setFotoPerfil}
          onLogout={sair}
          onNavigate={setTela}
        />
      );
    }

    return (
      <HomeScreen
        onNavigate={setTela}
        usuario={usuario}
        fotoPerfil={fotoPerfil}
      />
    );
  }

  const telaPublica =
    tela === "login" ||
    tela === "cadastro";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.pink}
      />

      <View style={styles.conteudo}>
        {renderizarTela()}
      </View>

      {!telaPublica && (
        <View style={styles.areaNavegacao}>
          <BottomNavigation
            telaAtual={tela}
            onChange={setTela}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.pink
  },

  conteudo: {
    flex: 1
  },

  areaNavegacao: {
    backgroundColor: COLORS.white,
    paddingBottom: 8
  }
});