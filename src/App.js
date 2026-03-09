import React, { useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set } from "firebase/database";
import logo from "./logo.png";

const firebaseConfig = {
  apiKey: "AIzaSyAWGQyP2eQAqCU6n0fgO6Duq1V7oOE5B2I",
  authDomain: "app-de-presenca-85a94.firebaseapp.com",
  databaseURL: "https://app-de-presenca-85a94-default-rtdb.firebaseio.com",
  projectId: "app-de-presenca-85a94",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export default function App() {
  const [nome, setNome] = useState("");
  const [status, setStatus] = useState("confirmado");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    const convidadosRef = ref(database, "layssa_jefferson");
    const novoConvidadoRef = push(convidadosRef);

    set(novoConvidadoRef, {
      nome: nome,
      status: status,
      data_confirmacao: new Date().toISOString(),
    })
      .then(() => {
        alert(`Obrigado, ${nome}! Sua resposta foi registrada com sucesso.`);
        setNome("");
        setLoading(false);
      })
      .catch((error) => {
        alert("Erro ao salvar: " + error.message);
        setLoading(false);
      });
  };

  return (
    <div
      style={{
        backgroundColor: "#7f807f",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px",
        fontFamily: "serif",
        boxSizing: "border-box",
      }}
    >
      <img
        src={logo}
        alt="Logo Cerimonial"
        style={{ width: "100%", maxWidth: "300px", marginBottom: "30px" }}
      />

      <div
        style={{
          backgroundColor: "white",
          padding: "35px",
          borderRadius: "15px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
          width: "100%",
          maxWidth: "430px",
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{ textAlign: "center", margin: "0 0 10px", fontSize: "26px" }}
        >
          Casamento Layssa & Jefferson 💍
        </h1>
        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: "30px",
            fontSize: "16px",
          }}
        >
          Por favor, preencha os dados abaixo para confirmar sua presença no
          evento.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "18px" }}
        >
          <label
            style={{ fontSize: "14px", color: "#555", marginBottom: "-10px" }}
          >
            Seu Nome Completo:
          </label>
          <input
            type="text"
            placeholder="Ex: João Silva da Costa"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            style={{
              padding: "14px",
              fontSize: "16px",
              borderRadius: "5px",
              border: "1px solid #ccc",
            }}
          />

          <label
            style={{ fontSize: "14px", color: "#555", marginBottom: "-10px" }}
          >
            Sua Resposta:
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              padding: "14px",
              fontSize: "16px",
              borderRadius: "5px",
              border: "1px solid #ccc",
              backgroundColor: "white",
            }}
          >
            <option value="confirmado">Vou com certeza!</option>
            <option value="talvez">Ainda não sei</option>
            <option value="nao_vou">Não poderei ir</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "16px",
              fontSize: "18px",
              backgroundColor: "#7f807f",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
              marginTop: "10px",
            }}
          >
            {loading ? "Enviando..." : "Confirmar Presença"}
          </button>
        </form>
      </div>
    </div>
  );
}
