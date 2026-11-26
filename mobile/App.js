import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View
} from "react-native";

import {
  limparSessao,
  obterMeuPerfil,
  obterToken
} from "./src/api/auth";
import BottomNavigation from "./src/components/BottomNavigation";
import AboutScreen from "./src/screens/AboutScreen";
import CaptureScreen from "./src/screens/CaptureScreen";
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import MapScreen from "./src/screens/MapScreen";
import MeuMangueScreen from "./src/screens/MeuMangueScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import SignupScreen from "./src/screens/SignupScreen";
import { COLORS } from "./src/theme";


export default function App() {
  const [tela, setTela] = useState("login");
  const [usuario, setUsuario] = useState(null);
  const [fotoPerfil, setFotoPerfil] = useState(null);
    // Atualiza pontos e dados do usuário ao abrir Início ou Perfil.
  useEffect(() => {
    if (!usuario || !obterToken()) {
      return;
    }
    if (tela !== "inicio" && tela !== "perfil") {
      return;
    }
    let ativo = true;
    obterMeuPerfil()
      .then((dados) => {
        if (ativo && dados?.usuario) {
          setUsuario((atual) => ({ ...atual, ...dados.usuario }));
        }
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [tela]);

  // Ao abrir o app, verifica se existe uma sessão salva.
  // Se houver, valida com o servidor e entra direto —
  // sem passar pela tela de login.
  useEffect(() => {
    let ativo = true;
    (async () => {
      // Aguarda o auth.js restaurar o token do armazenamento.
      for (let tentativa = 0; tentativa < 5; tentativa++) {
        if (!ativo) {
          return;
        }
        if (obterToken()) {
          break;
        }
        await new Promise((resolver) =>
          setTimeout(resolver, 200)
        );
      }
      if (!obterToken()) {
        // Sem sessão salva: permanece no login.
        return;
      }
      try {
        const perfil = await obterMeuPerfil();
        if (ativo) {
          entrar(perfil);
        }
      } catch {
        // Token inválido ou servidor inacessível:
        // permanece no login.
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

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

    if (tela === "meumangue") {
      return (
        <MeuMangueScreen
          onNavigate={setTela}
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