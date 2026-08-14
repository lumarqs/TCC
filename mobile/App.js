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
import VerificationScreen from "./src/screens/VerificationScreen";
import { COLORS } from "./src/theme";

export default function App() {
  const [tela, setTela] = useState("login");

  const [verificacao, setVerificacao] =
    useState(null);

  const [usuario, setUsuario] =
    useState(null);

  function iniciarVerificacao(dados) {
    setVerificacao(dados);
    setTela("verificacao");
  }

  function concluirAutenticacao(dados) {
    setUsuario(
      dados?.usuario || {
        email: verificacao?.email
      }
    );

    setVerificacao(null);
    setTela("inicio");
  }

  function sair() {
    setUsuario(null);
    setVerificacao(null);
    setTela("login");
  }

  function renderizarTela() {
    if (tela === "login") {
      return (
        <LoginScreen
          onNavigate={setTela}
          onVerification={iniciarVerificacao}
        />
      );
    }

    if (tela === "cadastro") {
      return (
        <SignupScreen
          onNavigate={setTela}
          onVerification={iniciarVerificacao}
        />
      );
    }

    if (tela === "verificacao") {
      return (
        <VerificationScreen
          email={verificacao?.email}
          finalidade={
            verificacao?.finalidade
          }
          mensagem={verificacao?.mensagem}
          onNavigate={setTela}
          onAuthenticated={
            concluirAutenticacao
          }
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
      />
    );
  }

  const telaPublica =
    tela === "login" ||
    tela === "cadastro" ||
    tela === "verificacao";

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