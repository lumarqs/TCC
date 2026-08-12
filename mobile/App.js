import { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  StatusBar
} from "react-native";

import HomeScreen from "./src/screens/HomeScreen";
import CaptureScreen from "./src/screens/CaptureScreen";
import MapScreen from "./src/screens/MapScreen";
import AboutScreen from "./src/screens/AboutScreen";
import BottomNavigation from "./src/components/BottomNavigation";
import { COLORS } from "./src/theme";

export default function App() {
  const [tela, setTela] = useState("inicio");

  function renderizarTela() {
    if (tela === "inicio") {
      return (
        <HomeScreen
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
        />
      );
    }

    return (
      <CaptureScreen
        onNavigate={setTela}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.pink}
      />

      {renderizarTela()}

      <BottomNavigation
        telaAtual={tela}
        onChange={setTela}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.pink
  }
});