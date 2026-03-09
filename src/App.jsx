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

// --- 1. CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAWGQyP2eQAqCU6n0fgO6Duq1V7oOE5B2I",
  authDomain: "app-de-presenca-85a94.firebaseapp.com",
  databaseURL: "https://app-de-presenca-85a94-default-rtdb.firebaseio.com",
  projectId: "app-de-presenca-85a94",
};

// Inicialização (As "chaves" para ligar o banco)
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// --- FUNÇÃO PARA PEGAR AS INICIAIS ---
const pegarIniciais = (nome) => {
  const partes = nome
    .replace(/ e /gi, " & ")
    .split("&")
    .map((p) => p.trim());
  if (partes.length > 1 && partes[1])
    return (partes[0][0] + "&" + partes[1][0]).toUpperCase();
  return nome.substring(0, 2).toUpperCase();
};

// --- 2. PAINEL ADMIN ---
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
      .catch((error) => alert("Erro: " + error.message));
  };

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
          backgroundColor: "#2cbdbd",
          padding: "40px 20px",
          borderBottomLeftRadius: "30px",
          borderBottomRightRadius: "30px",
          color: "white",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "28px" }}>Meus eventos</h1>
      </div>
      <div
        style={{ padding: "20px", maxWidth: "600px", margin: "-20px auto 0" }}
      >
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
              }}
            >
              + Cadastrar
            </button>
          </form>
        </div>
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
              }}
            >
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
                }}
              >
                {pegarIniciais(casal.nomeExibicao)}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>
                  {casal.data.split("-").reverse().join("/")}
                </p>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#333" }}>
                  {casal.nomeExibicao}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- 3. DASHBOARD ---
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
        <h2 style={{ margin: 0 }}>Gestão: {idCasal}</h2>
      </div>
      <div
        style={{
          padding: "20px",
          maxWidth: "600px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "10px",
          }}
        >
          <h3>💌 Link do Convite</h3>
          <input
            readOnly
            value={`${linkBase}#/convite/${idCasal}`}
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
          />
          <Link to={`/convite/${idCasal}`} target="_blank">
            Abrir Convite
          </Link>
        </div>
        <div
          style={{
            backgroundColor: "#1a1a1a",
            padding: "20px",
            borderRadius: "10px",
            color: "white",
          }}
        >
          <h3 style={{ color: "#d4af37" }}>👑 Portaria</h3>
          <Link to={`/portaria/${idCasal}`} style={{ color: "#d4af37" }}>
            Acessar Portaria
          </Link>
        </div>
      </div>
    </div>
  );
}

// --- 4. TELA CONVIDADOS ---
function TelaConvidados() {
  const { idCasal } = useParams();
  const [nome, setNome] = useState("");
  const [status, setStatus] = useState("confirmado");
  const handleSubmit = (e) => {
    e.preventDefault();
    const convidadosRef = ref(database, `convidados_por_casal/${idCasal}`);
    push(convidadosRef, {
      nome,
      status,
      checkin: false,
      data: new Date().toISOString(),
    }).then(() => {
      alert("Confirmado!");
      setNome("");
    });
  };
  return (
    <div style={{ textAlign: "center", padding: "50px", fontFamily: "serif" }}>
      <img src={logo} style={{ maxWidth: "200px" }} alt="logo" />
      <h1>Casamento {idCasal}</h1>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "300px",
          margin: "0 auto",
        }}
      >
        <input
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="confirmado">Confirmado</option>
          <option value="nao">Não vou</option>
        </select>
        <button type="submit">Confirmar</button>
      </form>
    </div>
  );
}

// --- 5. TELA PORTARIA ---
function TelaPortaria() {
  const { idCasal } = useParams();
  const [convidados, setConvidados] = useState([]);
  useEffect(() => {
    const refC = ref(database, `convidados_por_casal/${idCasal}`);
    onValue(refC, (snap) => {
      const d = snap.val();
      if (d) setConvidados(Object.keys(d).map((k) => ({ id: k, ...d[k] })));
    });
  }, [idCasal]);
  const check = (id, c) =>
    update(ref(database, `convidados_por_casal/${idCasal}/${id}`), {
      checkin: !c,
    });
  return (
    <div
      style={{
        backgroundColor: "#1a1a1a",
        color: "white",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <h1>Portaria: {idCasal}</h1>
      {convidados.map((c) => (
        <div
          key={c.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px",
            borderBottom: "1px solid #333",
          }}
        >
          <span>{c.nome}</span>
          <button onClick={() => check(c.id, c.checkin)}>
            {c.checkin ? "Desfazer" : "Entrou"}
          </button>
        </div>
      ))}
    </div>
  );
}

// --- 6. ROTAS ---
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
