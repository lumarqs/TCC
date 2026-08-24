import { WORKER_URL } from "../config";

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
      dados?.erro ||
        dados?.mensagem ||
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
  return requestAuth(
    "/auth/cadastro",
    {
      nome,
      email,
      senha
    }
  );
}

export function fazerLogin({
  email,
  senha
}) {
  return requestAuth(
    "/auth/login",
    {
      email,
      senha
    }
  );
}