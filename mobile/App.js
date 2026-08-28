import { useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View
} from "react-native";

import BottomNavigation from "./src/components/BottomNavigation";
import AboutScreen from "./src/screens/AboutScreen";
import CaptureScreen from "./src/screens/CaptureScreen";
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import MapScreen from "./src/screens/MapScreen";
import SignupScreen from "./src/screens/SignupScreen";
import { COLORS } from "./src/theme";

export default function App() {
  const [tela, setTela] = useState("login");
  const [usuario, setUsuario] = useState(null);

  function entrar(dados) {
    setUsuario(dados?.usuario || null);
    setTela("inicio");
  }

  function sair() {
    setUsuario(null);
    setTela("login");
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
        />
      );
    }

    return (
      <HomeScreen
        onNavigate={setTela}
        usuario={usuario}
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