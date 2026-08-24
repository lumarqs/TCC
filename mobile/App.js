import { useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet
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
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.pink}
      />

      {renderizarTela()}

      {!telaPublica && (
        <BottomNavigation
          telaAtual={tela}
          onChange={setTela}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.pink
  }
});