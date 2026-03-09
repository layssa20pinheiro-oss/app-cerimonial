import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Link, useParams } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  update,
} from "firebase/database";
import logo from "./logo.png";

// --- 1. CONFIGURAÇÃO DO BANCO DE DADOS ---
const firebaseConfig = {
  apiKey: "AIzaSyAWGQyP2eQAqCU6n0fgO6Duq1V7oOE5B2I",
  authDomain: "app-de-presenca-85a94.firebaseapp.com",
  databaseURL: "https://app-de-presenca-85a94-default-rtdb.firebaseio.com",
  projectId: "app-de-presenca-85a94",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// --- 2. PAINEL CENTRAL (Onde você cria os casamentos) ---
function PainelAdmin() {
  const [nomeCasal, setNomeCasal] = useState("");
  const [casamentos, setCasamentos] = useState([]);

  // Puxa a lista de casamentos já criados
  useEffect(() => {
    const casamentosRef = ref(database, "casamentos_cadastrados");
    onValue(casamentosRef, (snapshot) => {
      const dados = snapshot.val();
      if (dados) {
        const lista = Object.keys(dados).map((key) => ({
          id: key,
          ...dados[key],
        }));
        setCasamentos(lista);
      } else {
        setCasamentos([]);
      }
    });
  }, []);

  const criarNovoCasamento = (e) => {
    e.preventDefault();
    // Cria um link limpo (ex: "Ana e Carlos" vira "ana-e-carlos")
    const idUrl = nomeCasal
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    if (!idUrl) return alert("Digite um nome válido!");

    const novoRef = ref(database, `casamentos_cadastrados/${idUrl}`);
    set(novoRef, { nomeExibicao: nomeCasal, idUrl: idUrl })
      .then(() => setNomeCasal(""))
      .catch((error) => alert("Erro ao criar: " + error.message));
  };

  const linkBase = window.location.origin + window.location.pathname;

  return (
    <div
      style={{
        backgroundColor: "#f0f2f5",
        minHeight: "100vh",
        padding: "40px 20px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#333",
            borderBottom: "2px solid #eee",
            paddingBottom: "10px",
          }}
        >
          🏢 Meu Sistema de Cerimonial
        </h1>

        <form
          onSubmit={criarNovoCasamento}
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "30px",
            marginBottom: "40px",
          }}
        >
          <input
            type="text"
            placeholder="Nome dos Noivos (Ex: Ana & Carlos)"
            value={nomeCasal}
            onChange={(e) => setNomeCasal(e.target.value)}
            required
            style={{
              flex: 1,
              padding: "15px",
              fontSize: "16px",
              borderRadius: "5px",
              border: "1px solid #ccc",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "15px 25px",
              fontSize: "16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ➕ Criar Evento
          </button>
        </form>

        <h3 style={{ color: "#555" }}>Casamentos Ativos:</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {casamentos.map((casal) => (
            <div
              key={casal.id}
              style={{
                border: "1px solid #ddd",
                padding: "20px",
                borderRadius: "8px",
                backgroundColor: "#fafafa",
              }}
            >
              <h2 style={{ margin: "0 0 15px 0", color: "#333" }}>
                {casal.nomeExibicao}
              </h2>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <Link
                  to={`/convite/${casal.idUrl}`}
                  target="_blank"
                  style={{
                    padding: "10px 15px",
                    backgroundColor: "#7f807f",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "5px",
                    fontWeight: "bold",
                  }}
                >
                  💌 Ver Convite
                </Link>
                <Link
                  to={`/portaria/${casal.idUrl}`}
                  target="_blank"
                  style={{
                    padding: "10px 15px",
                    backgroundColor: "#1a1a1a",
                    color: "#d4af37",
                    textDecoration: "none",
                    borderRadius: "5px",
                    fontWeight: "bold",
                  }}
                >
                  👑 Área VIP (Portaria)
                </Link>
              </div>
              <p style={{ marginTop: "15px", fontSize: "13px", color: "#666" }}>
                <strong>Link para os noivos enviarem:</strong>
                <br />
                {linkBase}#/convite/{casal.idUrl}
              </p>
            </div>
          ))}
          {casamentos.length === 0 && (
            <p style={{ color: "#888" }}>Nenhum casamento cadastrado ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// --- 3. TELA DOS CONVIDADOS (Agora é Dinâmica!) ---
function TelaConvidados() {
  const { idCasal } = useParams(); // Pega o nome do casal lá do link!
  const [nome, setNome] = useState("");
  const [status, setStatus] = useState("confirmado");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Salva na gaveta exata desse casal específico!
    const convidadosRef = ref(database, `convidados_por_casal/${idCasal}`);
    const novoConvidadoRef = push(convidadosRef);

    set(novoConvidadoRef, {
      nome: nome,
      status: status,
      data_confirmacao: new Date().toISOString(),
      checkin: false,
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
        alt="Logo"
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
          style={{
            textAlign: "center",
            margin: "0 0 10px",
            fontSize: "26px",
            textTransform: "capitalize",
          }}
        >
          Casamento {idCasal.replace(/-/g, " ")} 💍
        </h1>
        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: "30px",
            fontSize: "16px",
          }}
        >
          Por favor, preencha os dados abaixo para confirmar sua presença.
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

// --- 4. TELA VIP DA PORTARIA (Dinâmica também!) ---
function TelaPortaria() {
  const { idCasal } = useParams(); // Pega o nome do casal do link
  const [convidados, setConvidados] = useState([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    // Puxa só a lista desse casamento específico
    const convidadosRef = ref(database, `convidados_por_casal/${idCasal}`);
    onValue(convidadosRef, (snapshot) => {
      const dados = snapshot.val();
      if (dados) {
        const lista = Object.keys(dados).map((key) => ({
          id: key,
          ...dados[key],
        }));
        const confirmados = lista.filter((c) => c.status === "confirmado");
        setConvidados(confirmados);
      } else {
        setConvidados([]);
      }
    });
  }, [idCasal]);

  const fazerCheckin = (id, jaEntrou) => {
    const convidadoRef = ref(database, `convidados_por_casal/${idCasal}/${id}`);
    update(convidadoRef, { checkin: !jaEntrou });
  };

  const convidadosFiltrados = convidados.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  );
  const totalPresentes = convidados.filter((c) => c.checkin).length;

  return (
    <div
      style={{
        backgroundColor: "#1a1a1a",
        minHeight: "100vh",
        padding: "20px",
        fontFamily: "sans-serif",
        color: "white",
      }}
    >
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h1
          style={{
            textAlign: "center",
            color: "#d4af37",
            textTransform: "capitalize",
          }}
        >
          👑 VIP Portaria - {idCasal.replace(/-/g, " ")}
        </h1>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            backgroundColor: "#333",
            padding: "15px",
            borderRadius: "10px",
            marginBottom: "20px",
          }}
        >
          <div>
            <strong>Confirmados:</strong> {convidados.length}
          </div>
          <div>
            <strong>Já Entraram:</strong> {totalPresentes}
          </div>
        </div>
        <input
          type="text"
          placeholder="🔍 Buscar convidado..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: "8px",
            border: "none",
            fontSize: "16px",
            marginBottom: "20px",
            boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {convidadosFiltrados.map((convidado) => (
            <div
              key={convidado.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: convidado.checkin ? "#2e4a2e" : "#333",
                padding: "15px",
                borderRadius: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  textDecoration: convidado.checkin ? "line-through" : "none",
                }}
              >
                {convidado.nome}
              </span>
              <button
                onClick={() => fazerCheckin(convidado.id, convidado.checkin)}
                style={{
                  padding: "10px 15px",
                  borderRadius: "5px",
                  border: "none",
                  fontWeight: "bold",
                  cursor: "pointer",
                  backgroundColor: convidado.checkin ? "#ff4d4d" : "#4CAF50",
                  color: "white",
                }}
              >
                {convidado.checkin ? "Desfazer" : "✅ Entrou"}
              </button>
            </div>
          ))}
          {convidadosFiltrados.length === 0 && (
            <p style={{ textAlign: "center", color: "#888" }}>
              Nenhum convidado encontrado.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// --- 5. O CÉREBRO MESTRE (Distribui os Links) ---
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<PainelAdmin />} />
        <Route path="/convite/:idCasal" element={<TelaConvidados />} />
        <Route path="/portaria/:idCasal" element={<TelaPortaria />} />
      </Routes>
    </HashRouter>
  );
}
