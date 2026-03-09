import React, { useState, useEffect } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";
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

// --- FUNÇÃO PARA PEGAR AS INICIAIS (Ex: "Camila e Lucas" vira "C&L") ---
const pegarIniciais = (nome) => {
  const partes = nome
    .replace(/ e /gi, " & ")
    .split("&")
    .map((p) => p.trim());
  if (partes.length > 1 && partes[1])
    return (partes[0][0] + "&" + partes[1][0]).toUpperCase();
  return nome.substring(0, 2).toUpperCase();
};

// --- 2. NOVO PAINEL CENTRAL (Estilo Assessoria VIP) ---
function PainelAdmin() {
  const [nomeCasal, setNomeCasal] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [casamentos, setCasamentos] = useState([]);
  const navigate = useNavigate();

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
    const idUrl = nomeCasal
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    if (!idUrl) return alert("Digite um nome válido!");

    const novoRef = ref(database, `casamentos_cadastrados/${idUrl}`);
    set(novoRef, {
      nomeExibicao: nomeCasal,
      idUrl: idUrl,
      data: dataEvento || "Data não definida",
      tipo: "Casamento",
    })
      .then(() => {
        setNomeCasal("");
        setDataEvento("");
      })
      .catch((error) => alert("Erro ao criar: " + error.message));
  };

  return (
    <div
      style={{
        backgroundColor: "#f5f7fa",
        minHeight: "100vh",
        fontFamily: "sans-serif",
      }}
    >
      {/* Cabeçalho Verde Água estilo Assessoria VIP */}
      <div
        style={{
          backgroundColor: "#2cbdbd",
          padding: "40px 20px",
          borderBottomLeftRadius: "30px",
          borderBottomRightRadius: "30px",
          color: "white",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "28px" }}>Meus eventos</h1>
      </div>

      <div
        style={{ padding: "20px", maxWidth: "600px", margin: "-20px auto 0" }}
      >
        {/* Formulário de Criação Escondidinho */}
        <div
          style={{
            backgroundColor: "white",
            padding: "15px",
            borderRadius: "10px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            marginBottom: "30px",
          }}
        >
          <form
            onSubmit={criarNovoCasamento}
            style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
          >
            <input
              type="text"
              placeholder="Nome dos Noivos"
              value={nomeCasal}
              onChange={(e) => setNomeCasal(e.target.value)}
              required
              style={{
                flex: "1 1 100%",
                padding: "12px",
                borderRadius: "5px",
                border: "1px solid #ddd",
              }}
            />
            <input
              type="date"
              value={dataEvento}
              onChange={(e) => setDataEvento(e.target.value)}
              required
              style={{
                flex: "1 1 calc(50% - 5px)",
                padding: "12px",
                borderRadius: "5px",
                border: "1px solid #ddd",
              }}
            />
            <button
              type="submit"
              style={{
                flex: "1 1 calc(50% - 5px)",
                padding: "12px",
                backgroundColor: "#2cbdbd",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              + Cadastrar
            </button>
          </form>
        </div>

        {/* Lista de Cartões (O visual que você pediu!) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {casamentos.map((casal) => (
            <div
              key={casal.id}
              onClick={() => navigate(`/evento/${casal.idUrl}`)}
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                display: "flex",
                alignItems: "center",
                gap: "20px",
                cursor: "pointer",
                transition: "transform 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.transform = "scale(1.02)")
              }
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {/* Bolinha com Iniciais */}
              <div
                style={{
                  width: "65px",
                  height: "65px",
                  borderRadius: "50%",
                  backgroundColor: "#f0f0f0",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#666",
                  flexShrink: 0,
                }}
              >
                {pegarIniciais(casal.nomeExibicao)}
              </div>

              {/* Textos do Cartão */}
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: "0 0 5px 0",
                    fontSize: "13px",
                    color: "#888",
                    fontWeight: "bold",
                  }}
                >
                  {casal.data.split("-").reverse().join("/")} • Evento
                </p>
                <p
                  style={{
                    margin: "0 0 2px 0",
                    fontSize: "14px",
                    color: "#888",
                  }}
                >
                  {casal.tipo}
                </p>
                <h3
                  style={{
                    margin: "0",
                    fontSize: "18px",
                    color: "#333",
                    textTransform: "capitalize",
                  }}
                >
                  {casal.nomeExibicao}
                </h3>
              </div>
            </div>
          ))}
          {casamentos.length === 0 && (
            <p
              style={{ textAlign: "center", color: "#999", marginTop: "20px" }}
            >
              Nenhum evento criado ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// --- 3. DASHBOARD DO EVENTO (A Tela das Opções) ---
function DashboardEvento() {
  const { idCasal } = useParams();
  const navigate = useNavigate();
  const linkBase = window.location.origin + window.location.pathname;

  return (
    <div
      style={{
        backgroundColor: "#f5f7fa",
        minHeight: "100vh",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#333",
          padding: "20px",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: "15px",
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          ⬅ Voltar
        </button>
        <h2 style={{ margin: 0, textTransform: "capitalize" }}>
          Gestão: {idCasal.replace(/-/g, " ")}
        </h2>
      </div>

      <div
        style={{
          padding: "30px 20px",
          maxWidth: "600px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Bloco do Convite */}
        <div
          style={{
            backgroundColor: "white",
            padding: "25px",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>
            💌 Formulário de Presença
          </h3>
          <p style={{ fontSize: "14px", color: "#666" }}>
            Envie este link para os convidados confirmarem presença:
          </p>
          <input
            type="text"
            readOnly
            value={`${linkBase}#/convite/${idCasal}`}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#f0f0f0",
              border: "1px solid #ddd",
              borderRadius: "5px",
              marginBottom: "15px",
              boxSizing: "border-box",
            }}
          />
          <Link
            to={`/convite/${idCasal}`}
            target="_blank"
            style={{
              display: "inline-block",
              padding: "12px 20px",
              backgroundColor: "#007bff",
              color: "white",
              textDecoration: "none",
              borderRadius: "5px",
              fontWeight: "bold",
            }}
          >
            Abrir Formulário
          </Link>
        </div>

        {/* Bloco da Portaria VIP */}
        <div
          style={{
            backgroundColor: "#1a1a1a",
            padding: "25px",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            color: "white",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0", color: "#d4af37" }}>
            👑 Área VIP (Portaria)
          </h3>
          <p style={{ fontSize: "14px", color: "#ccc" }}>
            Área exclusiva para a equipe do cerimonial dar o check-in na porta.
          </p>
          <Link
            to={`/portaria/${idCasal}`}
            style={{
              display: "inline-block",
              padding: "12px 20px",
              backgroundColor: "#d4af37",
              color: "#1a1a1a",
              textDecoration: "none",
              borderRadius: "5px",
              fontWeight: "bold",
              marginTop: "10px",
            }}
          >
            Acessar Portaria
          </Link>
        </div>
      </div>
    </div>
  );
}

// --- 4. TELA DOS CONVIDADOS (Intacta) ---
function TelaConvidados() {
  const { idCasal } = useParams();
  const [nome, setNome] = useState("");
  const [status, setStatus] = useState("confirmado");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    const convidadosRef = ref(database, `convidados_por_casal/${idCasal}`);
    const novoConvidadoRef = push(convidadosRef);

    set(novoConvidadoRef, {
      nome,
      status,
      data_confirmacao: new Date().toISOString(),
      checkin: false,
    })
      .then(() => {
        alert(`Obrigado, ${nome}! Sua resposta foi registrada.`);
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
          Preencha para confirmar presença.
        </p>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "18px" }}
        >
          <input
            type="text"
            placeholder="Seu Nome Completo"
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
            }}
          >
            {loading ? "Enviando..." : "Confirmar Presença"}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- 5. TELA DA PORTARIA (Intacta) ---
function TelaPortaria() {
  const { idCasal } = useParams();
  const [convidados, setConvidados] = useState([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const convidadosRef = ref(database, `convidados_por_casal/${idCasal}`);
    onValue(convidadosRef, (snapshot) => {
      const dados = snapshot.val();
      if (dados) {
        const lista = Object.keys(dados).map((key) => ({
          id: key,
          ...dados[key],
        }));
        setConvidados(lista.filter((c) => c.status === "confirmado"));
      } else {
        setConvidados([]);
      }
    });
  }, [idCasal]);

  const fazerCheckin = (id, jaEntrou) => {
    const convidadoRef = ref(database, `convidados_por_casal/${idCasal}/${id}`);
    update(convidadoRef, { checkin: !jaEntrou });
  };

  const filtrados = convidados.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  );

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
            <strong>Já Entraram:</strong>{" "}
            {convidados.filter((c) => c.checkin).length}
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
            marginBottom: "20px",
            boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtrados.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: c.checkin ? "#2e4a2e" : "#333",
                padding: "15px",
                borderRadius: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  textDecoration: c.checkin ? "line-through" : "none",
                }}
              >
                {c.nome}
              </span>
              <button
                onClick={() => fazerCheckin(c.id, c.checkin)}
                style={{
                  padding: "10px 15px",
                  borderRadius: "5px",
                  border: "none",
                  fontWeight: "bold",
                  cursor: "pointer",
                  backgroundColor: c.checkin ? "#ff4d4d" : "#4CAF50",
                  color: "white",
                }}
              >
                {c.checkin ? "Desfazer" : "✅ Entrou"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- 6. O CÉREBRO MESTRE DAS ROTAS ---
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<PainelAdmin />} />
        <Route path="/evento/:idCasal" element={<DashboardEvento />} />
        <Route path="/convite/:idCasal" element={<TelaConvidados />} />
        <Route path="/portaria/:idCasal" element={<TelaPortaria />} />
      </Routes>
    </HashRouter>
  );
}
