import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
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
  get,
} from "firebase/database";
import logo from "./logo.png";

const firebaseConfig = {
  apiKey: "AIzaSyAWGQyP2eQAqCU6n0fgO6Duq1V7oOE5B2I",
  authDomain: "app-de-presenca-85a94.firebaseapp.com",
  databaseURL: "https://app-de-presenca-85a94-default-rtdb.firebaseio.com",
  projectId: "app-de-presenca-85a94",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const pegarIniciais = (nome) => {
  if (!nome) return "??";
  try {
    const partes = nome
      .replace(/ e /gi, " & ")
      .split("&")
      .map((p) => p.trim());
    if (partes.length > 1 && partes[0].length > 0 && partes[1].length > 0)
      return (partes[0][0] + "&" + partes[1][0]).toUpperCase();
    return nome.substring(0, 2).toUpperCase();
  } catch (error) {
    return "??";
  }
};

// --- 1. PAINEL ADMIN ---
function PainelAdmin() {
  const [nomeCasal, setNomeCasal] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [casamentos, setCasamentos] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState("proximos");
  const navigate = useNavigate();

  useEffect(() => {
    onValue(ref(database, "casamentos_cadastrados"), (snapshot) => {
      const dados = snapshot.val();
      setCasamentos(
        dados
          ? Object.keys(dados).map((key) => ({ id: key, ...dados[key] }))
          : []
      );
    });
  }, []);

  const criarNovoCasamento = (e) => {
    e.preventDefault();
    const idUrl = nomeCasal
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    if (!idUrl) return alert("Digite um nome!");
    set(ref(database, `casamentos_cadastrados/${idUrl}`), {
      nomeExibicao: nomeCasal,
      idUrl,
      data: dataEvento || "",
      tipo: "Casamento",
    })
      .then(() => {
        setNomeCasal("");
        setDataEvento("");
      })
      .catch((err) => alert("Erro: " + err.message));
  };

  const deletarEvento = (e, idUrl, nome) => {
    e.stopPropagation();
    if (
      window.confirm(
        `⚠️ Excluir o evento "${nome}" apagará toda a lista. Continuar?`
      )
    ) {
      set(ref(database, `casamentos_cadastrados/${idUrl}`), null);
      set(ref(database, `convidados_por_casal/${idUrl}`), null);
    }
  };

  const hoje = new Date().toISOString().split("T")[0];
  const eventosFiltrados = casamentos.filter((c) =>
    abaAtiva === "proximos"
      ? !c.data || c.data >= hoje
      : c.data && c.data < hoje
  );
  eventosFiltrados.sort((a, b) =>
    abaAtiva === "proximos"
      ? (a.data || "9999") > (b.data || "9999")
        ? 1
        : -1
      : a.data < b.data
      ? 1
      : -1
  );

  const estiloAba = (nomeAba) => ({
    flex: 1,
    padding: "12px",
    textAlign: "center",
    backgroundColor: abaAtiva === nomeAba ? "#2cbdbd" : "white",
    color: abaAtiva === nomeAba ? "white" : "#666",
    fontWeight: "bold",
    cursor: "pointer",
    borderBottom: abaAtiva === nomeAba ? "3px solid #1a8b8b" : "1px solid #eee",
  });

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
        <div
          style={{
            display: "flex",
            backgroundColor: "white",
            borderRadius: "10px",
            overflow: "hidden",
            marginBottom: "20px",
          }}
        >
          <div
            onClick={() => setAbaAtiva("proximos")}
            style={estiloAba("proximos")}
          >
            Próximos Eventos
          </div>
          <div
            onClick={() => setAbaAtiva("anteriores")}
            style={estiloAba("anteriores")}
          >
            Eventos Concluídos
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {eventosFiltrados.map((casal) => (
            <div
              key={casal.id}
              onClick={() => navigate(`/evento/${casal.idUrl}`)}
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "15px",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
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
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: "0 0 5px 0",
                    fontSize: "13px",
                    color: "#888",
                    fontWeight: "bold",
                  }}
                >
                  {casal.data
                    ? casal.data.split("-").reverse().join("/")
                    : "Sem data"}{" "}
                  • Evento
                </p>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    color: "#333",
                    textTransform: "capitalize",
                  }}
                >
                  {casal.nomeExibicao}
                </h3>
              </div>
              <div
                onClick={(e) =>
                  deletarEvento(e, casal.idUrl, casal.nomeExibicao)
                }
                style={{ padding: "10px", fontSize: "20px", cursor: "pointer" }}
              >
                🗑️
              </div>
            </div>
          ))}
          {eventosFiltrados.length === 0 && (
            <p style={{ textAlign: "center", color: "#999" }}>
              Nenhum evento encontrado.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// --- 2. DASHBOARD DO EVENTO ---
function DashboardEvento() {
  const { idCasal } = useParams();
  const navigate = useNavigate();
  const linkConvite = `${window.location.origin}/convite/${idCasal}`;

  const importarPlanilha = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const convidadosRef = ref(database, `convidados_por_casal/${idCasal}`);
      const snapshot = await get(convidadosRef);
      const convidadosAtuais = snapshot.exists()
        ? Object.keys(snapshot.val()).map((k) => ({
            id: k,
            ...snapshot.val()[k],
          }))
        : [];

      const reader = new FileReader();
      reader.onload = (event) => {
        const linhas = event.target.result.split("\n");
        let novos = 0,
          atualizados = 0;

        linhas.forEach((linha, index) => {
          if (index === 0 || !linha.trim()) return;
          const colunas = linha.split(/;|,/);
          const nome = colunas[0] ? colunas[0].trim() : "";
          const telefone = colunas[1] ? colunas[1].trim() : "";
          const mesa = colunas[2] ? colunas[2].trim() : "";
          const familia =
            colunas[3] && colunas[3].trim() !== "" ? colunas[3].trim() : nome; // 🪄 MÁGICA DA FAMÍLIA AQUI

          if (nome) {
            const convidadoExistente = convidadosAtuais.find(
              (c) => c.nome.toLowerCase() === nome.toLowerCase()
            );
            if (convidadoExistente) {
              update(
                ref(
                  database,
                  `convidados_por_casal/${idCasal}/${convidadoExistente.id}`
                ),
                {
                  telefone: telefone || convidadoExistente.telefone,
                  mesa: mesa || convidadoExistente.mesa,
                  familia,
                }
              );
              atualizados++;
            } else {
              push(convidadosRef, {
                nome,
                telefone,
                mesa,
                familia,
                status: "pendente",
                checkin: false,
              });
              novos++;
            }
          }
        });
        alert(
          `🎉 Planilha Lida!\n${novos} novos adicionados.\n${atualizados} atualizados.`
        );
        e.target.value = "";
      };
      reader.readAsText(file, "UTF-8");
    } catch (error) {
      alert("Erro: " + error.message);
    }
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
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "22px",
            cursor: "pointer",
          }}
        >
          ⬅ Voltar
        </button>
      </div>
      <div
        style={{
          padding: "20px",
          maxWidth: "600px",
          margin: "-20px auto 0",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            margin: 0,
            color: "#333",
            textTransform: "capitalize",
            fontSize: "22px",
          }}
        >
          Gestão: {idCasal.replace(/-/g, " ")}
        </h2>
        <div
          style={{
            backgroundColor: "white",
            padding: "25px",
            borderRadius: "15px",
          }}
        >
          <h3 style={{ margin: "0 0 15px", color: "#333" }}>
            📊 Importar Convidados
          </h3>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}>
            Excel colunas: <b>Nome, Telefone, Mesa, Família</b> (.CSV)
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={importarPlanilha}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px dashed #2cbdbd",
              borderRadius: "8px",
              backgroundColor: "#f0fdfc",
              cursor: "pointer",
            }}
          />
        </div>
        <div
          style={{
            backgroundColor: "white",
            padding: "25px",
            borderRadius: "15px",
          }}
        >
          <h3 style={{ margin: "0 0 15px", color: "#333" }}>
            💌 Link Geral (Sem Telefone)
          </h3>
          <input
            type="text"
            readOnly
            value={linkConvite}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#f9f9f9",
              border: "1px solid #eee",
              borderRadius: "8px",
              marginBottom: "15px",
            }}
          />
          <button
            onClick={() =>
              navigator.clipboard
                .writeText(linkConvite)
                .then(() => alert("Copiado!"))
            }
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#2cbdbd",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Copiar Link
          </button>
        </div>
        <div
          style={{
            backgroundColor: "white",
            padding: "25px",
            borderRadius: "15px",
          }}
        >
          <h3 style={{ margin: "0 0 15px", color: "#333" }}>📋 Recepção VIP</h3>
          <Link
            to={`/portaria/${idCasal}`}
            style={{
              display: "block",
              padding: "12px",
              backgroundColor: "#2cbdbd",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            Acessar Check-in
          </Link>
        </div>
      </div>
    </div>
  );
}

// --- 3. TELA DOS CONVIDADOS (AGORA POR FAMÍLIA!) ---
function TelaConvidados() {
  const { idCasal, telefoneUrl } = useParams(); // Pega o telefone escondido no link
  const [membrosFamilia, setMembrosFamilia] = useState([]);
  const [nomeFamilia, setNomeFamilia] = useState("");
  const [loading, setLoading] = useState(true);
  const [ticketFinal, setTicketFinal] = useState(null);
  const [erroBusca, setErroBusca] = useState(false);

  useEffect(() => {
    // Quando a tela abre, ela vasculha o banco de dados procurando o telefone do link
    const buscarFamilia = async () => {
      if (!telefoneUrl) {
        setLoading(false);
        setErroBusca(true);
        return;
      }

      const convidadosRef = ref(database, `convidados_por_casal/${idCasal}`);
      const snapshot = await get(convidadosRef);
      if (snapshot.exists()) {
        const todos = Object.keys(snapshot.val()).map((k) => ({
          id: k,
          ...snapshot.val()[k],
        }));

        // Acha a pessoa dona do celular
        const donoDoCelular = todos.find((c) => c.telefone === telefoneUrl);

        if (donoDoCelular && donoDoCelular.familia) {
          // Pega TODO MUNDO que tem o mesmo nome de família
          const familiaInteira = todos.filter(
            (c) => c.familia === donoDoCelular.familia
          );
          setMembrosFamilia(familiaInteira);
          setNomeFamilia(donoDoCelular.familia);
          setErroBusca(false);
        } else {
          setErroBusca(true);
        }
      } else {
        setErroBusca(true);
      }
      setLoading(false);
    };
    buscarFamilia();
  }, [idCasal, telefoneUrl]);

  // Função para mudar o status de uma pessoa específica na lista
  const atualizarStatusMembro = (index, novoStatus) => {
    const novaLista = [...membrosFamilia];
    novaLista[index].status = novoStatus;
    setMembrosFamilia(novaLista);
  };

  const salvarPresencas = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Salva a decisão de cada membro da família no Firebase
    for (let membro of membrosFamilia) {
      const membroRef = ref(
        database,
        `convidados_por_casal/${idCasal}/${membro.id}`
      );
      await update(membroRef, {
        status: membro.status,
        data_confirmacao: new Date().toISOString(),
      });
    }

    setLoading(false);
    // Cria um ID único para a família gerar o QR Code
    const idQrCodeFam = `FAM-${idCasal}-${nomeFamilia.replace(/\s+/g, "")}`;
    setTicketFinal({ nome: nomeFamilia, id: idQrCodeFam });
  };

  // TELA DE ERRO (Se abrir o link sem telefone)
  if (!loading && erroBusca && !ticketFinal) {
    return (
      <div
        style={{
          backgroundColor: "#f9f6f0",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "40px 30px",
            borderRadius: "15px",
            textAlign: "center",
            border: "1px solid #eee",
            maxWidth: "400px",
          }}
        >
          <h2>Ops! Convite não encontrado.</h2>
          <p style={{ color: "#666" }}>
            Por favor, solicite o seu link pessoal de confirmação para a
            assessoria do evento.
          </p>
        </div>
      </div>
    );
  }

  // TELA DO INGRESSO QR CODE
  if (ticketFinal) {
    return (
      <div
        style={{
          backgroundColor: "#f9f6f0",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "40px 20px",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "40px 30px",
            borderRadius: "15px",
            width: "100%",
            maxWidth: "400px",
            textAlign: "center",
            border: "1px solid #eee",
          }}
        >
          <h2
            style={{ color: "#d4af37", marginBottom: "10px", fontSize: "26px" }}
          >
            Presença Registrada!
          </h2>
          <p style={{ color: "#666", fontSize: "16px", marginBottom: "30px" }}>
            {ticketFinal.nome}, agradecemos a confirmação.
          </p>
          <div
            style={{
              border: "2px dashed #d4af37",
              padding: "20px",
              borderRadius: "10px",
              backgroundColor: "#fffcf5",
              marginBottom: "20px",
            }}
          >
            <p
              style={{
                margin: "0 0 15px",
                fontWeight: "bold",
                color: "#333",
                letterSpacing: "1px",
              }}
            >
              PASSE VIP DA FAMÍLIA
            </p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticketFinal.id}`}
              alt="QR Code VIP"
              style={{ width: "180px" }}
            />
          </div>
          <p style={{ color: "#888", fontSize: "14px" }}>
            Tire um print (foto) e apresente na portaria para entrada rápida de
            todo o grupo.
          </p>
        </div>
      </div>
    );
  }

  // TELA DO FORMULÁRIO DA FAMÍLIA
  return (
    <div
      style={{
        backgroundColor: "#f9f6f0",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px",
        fontFamily: "serif",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "40px 20px",
          borderRadius: "15px",
          width: "100%",
          maxWidth: "450px",
          border: "1px solid #eee",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <span style={{ fontSize: "40px" }}>💍</span>
          <h1
            style={{
              margin: "10px 0 5px",
              fontSize: "24px",
              color: "#333",
              textTransform: "capitalize",
            }}
          >
            {idCasal.replace(/-/g, " ")}
          </h1>
          {loading ? (
            <p>Carregando seu convite...</p>
          ) : (
            <p
              style={{
                color: "#d4af37",
                fontSize: "18px",
                fontWeight: "bold",
                marginTop: "15px",
              }}
            >
              Bem-vindos, {nomeFamilia}!
            </p>
          )}
          <p style={{ color: "#888", fontSize: "14px", fontStyle: "italic" }}>
            Confirme a presença de cada convidado abaixo:
          </p>
        </div>

        {!loading && (
          <form
            onSubmit={salvarPresencas}
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            {membrosFamilia.map((membro, index) => (
              <div
                key={membro.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "15px",
                  backgroundColor: "#fcfcfc",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                }}
              >
                <span
                  style={{
                    fontWeight: "bold",
                    color: "#555",
                    fontSize: "15px",
                    fontFamily: "sans-serif",
                  }}
                >
                  {membro.nome}
                </span>
                <select
                  value={membro.status}
                  onChange={(e) => atualizarStatusMembro(index, e.target.value)}
                  style={{
                    padding: "8px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    outline: "none",
                    backgroundColor:
                      membro.status === "confirmado"
                        ? "#e6f4ea"
                        : membro.status === "nao_vou"
                        ? "#fce8e6"
                        : "white",
                    fontWeight: "bold",
                    color: "#333",
                    fontFamily: "sans-serif",
                  }}
                >
                  <option value="pendente">Responder...</option>
                  <option value="confirmado">Eu Vou!</option>
                  <option value="nao_vou">Não Vou</option>
                </select>
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "20px",
                padding: "18px",
                fontSize: "16px",
                backgroundColor: "#d4af37",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                textTransform: "uppercase",
                boxShadow: "0 4px 10px rgba(212, 175, 55, 0.3)",
                fontFamily: "sans-serif",
              }}
            >
              Salvar Confirmações
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// --- 4. TELA DA PORTARIA ---
function TelaPortaria() {
  const { idCasal } = useParams();
  const navigate = useNavigate();
  const [convidados, setConvidados] = useState([]);
  const [busca, setBusca] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("confirmado");

  useEffect(() => {
    onValue(ref(database, `convidados_por_casal/${idCasal}`), (snapshot) => {
      const dados = snapshot.val();
      setConvidados(
        dados ? Object.keys(dados).map((k) => ({ id: k, ...dados[k] })) : []
      );
    });
  }, [idCasal]);

  const enviarWhatsApp = (telefone, nomeConvidado) => {
    let numeroLimpo = telefone.replace(/\D/g, "");
    if (numeroLimpo.length === 10 || numeroLimpo.length === 11)
      numeroLimpo = "55" + numeroLimpo;

    // 🪄 OLHA A MÁGICA AQUI: O Link agora manda o telefone junto, escondido!
    const linkConvite = `${window.location.origin}/convite/${idCasal}/${numeroLimpo}`;
    const msg = `Olá, ${nomeConvidado}! Aqui é da assessoria. Segue o link para confirmar a presença da sua família:\n🔗 ${linkConvite}`;
    window.open(
      `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  const convidadosDaAba = convidados.filter((c) =>
    abaAtiva === "pendente"
      ? c.status === "pendente" || c.status === "talvez"
      : c.status === abaAtiva
  );
  const filtrados = convidadosDaAba.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (c.familia && c.familia.toLowerCase().includes(busca.toLowerCase()))
  );

  const estiloAba = (nomeAba) => ({
    flex: 1,
    padding: "12px",
    textAlign: "center",
    backgroundColor: abaAtiva === nomeAba ? "#2cbdbd" : "white",
    color: abaAtiva === nomeAba ? "white" : "#666",
    fontWeight: "bold",
    cursor: "pointer",
    borderBottom: abaAtiva === nomeAba ? "3px solid #1a8b8b" : "1px solid #eee",
  });

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
          padding: "20px",
          color: "white",
          display: "flex",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => navigate(`/evento/${idCasal}`)}
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "22px",
            cursor: "pointer",
          }}
        >
          ⬅ Voltar
        </button>
      </div>
      <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          📋 Recepção VIP
        </h2>

        <div
          style={{
            display: "flex",
            backgroundColor: "white",
            borderRadius: "10px",
            overflow: "hidden",
            marginBottom: "20px",
          }}
        >
          <div
            onClick={() => setAbaAtiva("confirmado")}
            style={estiloAba("confirmado")}
          >
            Confirmados
          </div>
          <div
            onClick={() => setAbaAtiva("pendente")}
            style={estiloAba("pendente")}
          >
            Pendentes
          </div>
          <div
            onClick={() => setAbaAtiva("nao_vou")}
            style={estiloAba("nao_vou")}
          >
            Não Vão
          </div>
        </div>

        <input
          type="text"
          placeholder="🔍 Buscar por nome ou família..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "10px",
            border: "1px solid #ddd",
            marginBottom: "20px",
            boxSizing: "border-box",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtrados.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "white",
                padding: "15px",
                borderRadius: "12px",
                borderLeft: c.checkin
                  ? "5px solid #2cbdbd"
                  : "5px solid transparent",
              }}
            >
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "bold",
                    textDecoration: c.checkin ? "line-through" : "none",
                  }}
                >
                  {c.nome}
                </span>
                {c.familia && (
                  <span
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "#888",
                      marginBottom: "4px",
                    }}
                  >
                    👨‍👩‍👧 {c.familia}
                  </span>
                )}
                <span
                  onClick={() => {
                    const mesa = window.prompt("Mesa:", c.mesa || "");
                    if (mesa !== null)
                      update(
                        ref(
                          database,
                          `convidados_por_casal/${idCasal}/${c.id}`
                        ),
                        { mesa }
                      );
                  }}
                  style={{
                    fontSize: "13px",
                    color: "#2cbdbd",
                    cursor: "pointer",
                  }}
                >
                  Mesa: {c.mesa || "Não definida"} ✎
                </span>
                <span
                  onClick={() => {
                    if (window.confirm("Excluir?"))
                      set(
                        ref(
                          database,
                          `convidados_por_casal/${idCasal}/${c.id}`
                        ),
                        null
                      );
                  }}
                  style={{ cursor: "pointer", marginLeft: "10px" }}
                >
                  🗑️
                </span>
                {abaAtiva === "pendente" && c.telefone && (
                  <button
                    onClick={() => enviarWhatsApp(c.telefone, c.nome)}
                    style={{
                      display: "block",
                      marginTop: "8px",
                      backgroundColor: "#25D366",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      cursor: "pointer",
                    }}
                  >
                    💬 Enviar Link
                  </button>
                )}
              </div>
              <div
                onClick={() =>
                  update(
                    ref(database, `convidados_por_casal/${idCasal}/${c.id}`),
                    { checkin: !c.checkin, status: "confirmado" }
                  )
                }
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  border: "2px solid #2cbdbd",
                  backgroundColor: c.checkin ? "#2cbdbd" : "transparent",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                {c.checkin && (
                  <span style={{ color: "white", fontWeight: "bold" }}>✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- 5. ROTAS ---
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PainelAdmin />} />
        <Route path="/evento/:idCasal" element={<DashboardEvento />} />
        <Route path="/convite/:idCasal" element={<TelaConvidados />} />
        {/* A Rota Nova que aceita o telefone escondido no link! */}
        <Route
          path="/convite/:idCasal/:telefoneUrl"
          element={<TelaConvidados />}
        />
        <Route path="/portaria/:idCasal" element={<TelaPortaria />} />
        <Route path="*" element={<PainelAdmin />} />
      </Routes>
    </BrowserRouter>
  );
}
