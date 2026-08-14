import { WORKER_URL } from "../config";

async function requestAuth(path, body) {
  const resposta = await fetch(
    `${WORKER_URL}${path}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }
  );

  const dados = await resposta.json();

  if (!resposta.ok || dados.sucesso === false) {
    throw new Error(
      dados.erro ||
        dados.mensagem ||
        "Não foi possível concluir a operação."
    );
  }

  return dados;
}

export function cadastrarUsuario({
  nome,
  email,
  senha
}) {
  return requestAuth("/auth/cadastro", {
    nome,
    email,
    senha
  });
}

export function verificarCadastro({
  email,
  codigo
}) {
  return requestAuth("/auth/verificar-cadastro", {
    email,
    codigo
  });
}

export function fazerLogin({
  email,
  senha
}) {
  return requestAuth("/auth/login", {
    email,
    senha
  });
}

export function verificarLogin({
  email,
  codigo
}) {
  return requestAuth("/auth/verificar-login", {
    email,
    codigo
  });
}

export function reenviarCodigo({
  email,
  finalidade
}) {
  return requestAuth("/auth/reenviar-codigo", {
    email,
    finalidade
  });
}