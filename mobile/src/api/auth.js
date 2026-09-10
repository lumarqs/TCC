import { WORKER_URL } from "../config";

let tokenAtual = null;

function obterMensagemErro(dados) {
  return (
    dados?.erro ||
    dados?.mensagem ||
    "Não foi possível concluir a operação."
  );
}

async function transformarResposta(resposta) {
  let dados;

  try {
    dados = await resposta.json();
  } catch {
    throw new Error(
      "O servidor retornou uma resposta inválida."
    );
  }

  if (
    !resposta.ok ||
    dados?.sucesso === false
  ) {
    throw new Error(
      obterMensagemErro(dados)
    );
  }

  return dados;
}

async function requestAuth(path, body) {
  let resposta;

  try {
    resposta = await fetch(
      `${WORKER_URL}${path}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(body)
      }
    );
  } catch {
    throw new Error(
      "Não foi possível conectar ao servidor."
    );
  }

  return transformarResposta(resposta);
}

async function requestProtegida(
  path,
  opcoes = {}
) {
  if (!tokenAtual) {
    throw new Error(
      "Faça login para continuar."
    );
  }

  const headers = {
    Accept: "application/json",
    ...(opcoes.headers || {}),
    Authorization: `Bearer ${tokenAtual}`
  };

  let resposta;

  try {
    resposta = await fetch(
      `${WORKER_URL}${path}`,
      {
        ...opcoes,
        headers
      }
    );
  } catch {
    throw new Error(
      "Não foi possível conectar ao servidor."
    );
  }

  try {
    const dados =
      await transformarResposta(resposta);

    return dados;
  } catch (error) {
    if (resposta.status === 401) {
      tokenAtual = null;
    }

    throw error;
  }
}

export function obterToken() {
  return tokenAtual;
}

export function limparSessao() {
  tokenAtual = null;
}

export function cadastrarUsuario({
  nome,
  email,
  senha
}) {
  return requestAuth(
    "/auth/cadastro",
    {
      nome,
      email,
      senha
    }
  );
}

export async function fazerLogin({
  email,
  senha
}) {
  const dados = await requestAuth(
    "/auth/login",
    {
      email,
      senha
    }
  );

  if (!dados?.token) {
    throw new Error(
      "O servidor não retornou o token de acesso."
    );
  }

  tokenAtual = dados.token;

  return dados;
}

export function obterMeuPerfil() {
  return requestProtegida(
    "/usuarios/me"
  );
}

export function obterMinhasObservacoes() {
  return requestProtegida(
    "/observacoes/minhas"
  );
}

export function analisarImagem(
  formData
) {
  return requestProtegida(
    "/analisar-imagem",
    {
      method: "POST",
      body: formData
    }
  );
}