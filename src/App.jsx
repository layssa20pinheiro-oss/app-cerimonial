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
// ATENÇÃO: Adicionei o "get" aqui em cima para o escudo anti-clones funcionar!
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

// --- 1. CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAWGQyP2eQAqCU6n0fgO6Duq1V7oOE5B2I",
  authDomain: "app-de-presenca-85a94.firebaseapp.com",
  databaseURL: "https://app-de-presenca-85a94-default-rtdb.firebaseio.com",
  projectId: "app-de-presenca-85a94",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// --- PROTEÇÃO DAS INICIAIS ---
const pegarIniciais = (nome) => {
  if (!nome) return "??";
  try {
    const partes = nome
      .replace(/ e /gi, " & ")
      .split("&")
      .map((p) => p.trim());
    if (partes.length > 1 && partes[0].length > 0 && partes[1].length > 0) {
      return (partes[0][0] + "&" + partes[1][0]).toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  } catch (error) {
    return "??";
  }
};

// --- 2. PAINEL ADMIN ---
function PainelAdmin() {
  const [nomeCasal, setNomeCasal] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [casamentos, setCasamentos] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState("proximos"); // Abas para organizar eventos!
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
      data: dataEvento || "",
      tipo: "Casamento",
    })
      .then(() => {
        setNomeCasal("");
        setDataEvento("");
      })
      .catch((error) => alert("Erro ao criar: " + error.message));
  };

  // --- NOVA FUNÇÃO: DELETAR EVENTO ---
  const deletarEvento = (e, idUrl, nome) => {
    e.stopPropagation(); // Impede de abrir a página do evento ao clicar na lixeira
    if (
      window.confirm(
        `⚠️ Tem certeza que deseja excluir o evento "${nome}"? Isso apagará a lista inteira deste evento!`
      )
    ) {
      const eventoRef = ref(database, `casamentos_cadastrados/${idUrl}`);
      set(eventoRef, null); // Apaga o evento

      const convidadosRef = ref(database, `convidados_por_casal/${idUrl}`);
      set(convidadosRef, null); // Bônus: Limpa os convidados desse evento também!
    }
  };

  // --- LÓGICA DE EVENTOS PASSADOS E PRÓXIMOS ---
  const hoje = new Date().toISOString().split("T")[0]; // Pega a data de hoje!

  const eventosFiltrados = casamentos.filter((casal) => {
    if (abaAtiva === "proximos") {
      // Aparece aqui se não tiver data OU se a data for hoje ou no futuro
      return !casal.data || casal.data >= hoje;
    } else {
      // Aparece na aba de passados se a data for menor que hoje
      return casal.data && casal.data < hoje;
    }
  });

  // Ordena para o evento mais próximo aparecer primeiro!
  if (abaAtiva === "proximos") {
    eventosFiltrados.sort((a, b) =>
      (a.data || "9999") > (b.data || "9999") ? 1 : -1
    );
  } else {
    eventosFiltrados.sort((a, b) => (a.data < b.data ? 1 : -1));
  }

  const estiloAba = (nomeAba) => ({
    flex: 1,
    padding: "12px",
    textAlign: "center",
    backgroundColor: abaAtiva === nomeAba ? "#2cbdbd" : "white",
    color: abaAtiva === nomeAba ? "white" : "#666",
    fontWeight: "bold",
    cursor: "pointer",
    borderBottom: abaAtiva === nomeAba ? "3px solid #1a8b8b" : "1px solid #eee",
    transition: "all 0.3s",
    fontSize: "14px",
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
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "28px" }}>Meus eventos</h1>
      </div>

      <div
        style={{ padding: "20px", maxWidth: "600px", margin: "-20px auto 0" }}
      >
        {/* Formulário de Criar */}
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

        {/* ABAS INTELIGENTES */}
        <div
          style={{
            display: "flex",
            backgroundColor: "white",
            borderRadius: "10px",
            overflow: "hidden",
            marginBottom: "20px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
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
            Eventos Anteriores
          </div>
        </div>

        {/* Lista de Eventos */}
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {eventosFiltrados.map((casal) => (
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
                gap: "15px",
                cursor: "pointer",
                transition: "transform 0.2s",
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
                  flexShrink: 0,
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
                  {casal.data && casal.data.includes("-")
                    ? casal.data.split("-").reverse().join("/")
                    : "Sem data"}{" "}
                  • Evento
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

              {/* BOTÃO DE LIXEIRA DO EVENTO! */}
              <div
                onClick={(e) =>
                  deletarEvento(e, casal.idUrl, casal.nomeExibicao)
                }
                style={{
                  padding: "10px",
                  fontSize: "20px",
                  color: "#ff4d4d",
                  cursor: "pointer",
                  borderRadius: "50%",
                }}
                title="Excluir Evento"
              >
                🗑️
              </div>
            </div>
          ))}

          {eventosFiltrados.length === 0 && (
            <p
              style={{ textAlign: "center", color: "#999", marginTop: "20px" }}
            >
              {abaAtiva === "proximos"
                ? "Nenhum evento agendado."
                : "Nenhum evento passado arquivado."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
// --- 3. DASHBOARD DO EVENTO ---
function DashboardEvento() {
  const { idCasal } = useParams();
  const navigate = useNavigate();
  const linkConvite = `${window.location.origin}/convite/${idCasal}`;

  const copiarLink = () => {
    navigator.clipboard.writeText(linkConvite).then(() => {
      alert("Link copiado! Agora é só colar no WhatsApp.");
    });
  };

  // --- A MÁGICA ANTI-CLONES ---
  const importarPlanilha = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // 1. Pega os convidados que JÁ ESTÃO no banco
      const convidadosRef = ref(database, `convidados_por_casal/${idCasal}`);
      const snapshot = await get(convidadosRef);
      const convidadosAtuais = [];
      if (snapshot.exists()) {
        const dados = snapshot.val();
        Object.keys(dados).forEach((key) => {
          convidadosAtuais.push({ id: key, ...dados[key] });
        });
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const texto = event.target.result;
        const linhas = texto.split("\n");
        let totalNovos = 0;
        let totalAtualizados = 0;

        linhas.forEach((linha, index) => {
          if (index === 0) return; // Pula o cabeçalho
          if (!linha.trim()) return;

          const colunas = linha.split(/;|,/);
          const nomeConvidado = colunas[0] ? colunas[0].trim() : "";
          const telefoneConvidado = colunas[1] ? colunas[1].trim() : "";
          const mesaConvidado = colunas[2] ? colunas[2].trim() : "";

          if (nomeConvidado) {
            // Procura se o nome já existe (ignorando letras maiúsculas/minúsculas)
            const nomeNormalizado = nomeConvidado.toLowerCase();
            const convidadoExistente = convidadosAtuais.find(
              (c) => c.nome.toLowerCase() === nomeNormalizado
            );

            if (convidadoExistente) {
              // SE JÁ EXISTE: Apenas atualiza a mesa e o telefone, não duplica!
              const refParaAtualizar = ref(
                database,
                `convidados_por_casal/${idCasal}/${convidadoExistente.id}`
              );
              update(refParaAtualizar, {
                telefone: telefoneConvidado || convidadoExistente.telefone,
                mesa: mesaConvidado || convidadoExistente.mesa,
              });
              totalAtualizados++;
            } else {
              // SE NÃO EXISTE: Cria um novo na lista
              push(convidadosRef, {
                nome: nomeConvidado,
                telefone: telefoneConvidado,
                mesa: mesaConvidado,
                status: "pendente",
                checkin: false,
              });
              totalNovos++;
            }
          }
        });

        alert(
          `🎉 Lista processada! \n${totalNovos} novos convidados adicionados. \n${totalAtualizados} convidados atualizados.`
        );
        e.target.value = "";
      };

      reader.readAsText(file, "UTF-8");
    } catch (error) {
      alert("Erro ao ler a planilha: " + error.message);
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
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
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
            fontSize: "22px",
            cursor: "pointer",
            padding: "0",
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
        <div
          style={{
            textAlign: "center",
            marginBottom: "5px",
            marginTop: "10px",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#333",
              textTransform: "capitalize",
              fontSize: "22px",
            }}
          >
            Gestão: {idCasal.replace(/-/g, " ")}
          </h2>
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: "25px",
            borderRadius: "15px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "15px",
            }}
          >
            <span style={{ fontSize: "22px" }}>📊</span>
            <h3 style={{ margin: 0, color: "#333", fontSize: "18px" }}>
              Importar Convidados
            </h3>
          </div>
          <p
            style={{
              fontSize: "14px",
              color: "#666",
              marginTop: 0,
              marginBottom: "15px",
            }}
          >
            Crie um Excel com <b>Nome</b>, <b>Telefone</b> e <b>Mesa</b>, salve
            como <b>.CSV</b> e envie aqui. (Atualizações não duplicam os nomes!)
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
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "15px",
            }}
          >
            <span style={{ fontSize: "22px" }}>💌</span>
            <h3 style={{ margin: 0, color: "#333", fontSize: "18px" }}>
              Link do Convite
            </h3>
          </div>
          <p
            style={{
              fontSize: "14px",
              color: "#666",
              marginTop: 0,
              marginBottom: "15px",
            }}
          >
            Envie o link abaixo para os convidados confirmarem presença:
          </p>
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
              fontSize: "14px",
              color: "#555",
              marginBottom: "15px",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={copiarLink}
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor: "#2cbdbd",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Copiar Link
            </button>
            <Link
              to={`/convite/${idCasal}`}
              target="_blank"
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "12px",
                backgroundColor: "#f0f2f5",
                color: "#333",
                textDecoration: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              Testar Convite
            </Link>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: "25px",
            borderRadius: "15px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "15px",
            }}
          >
            <span style={{ fontSize: "22px" }}>📋</span>
            <h3 style={{ margin: 0, color: "#333", fontSize: "18px" }}>
              Recepção dos convidados
            </h3>
          </div>
          <p
            style={{
              fontSize: "14px",
              color: "#666",
              marginTop: 0,
              marginBottom: "15px",
            }}
          >
            Acesse a lista para dar o check-in na porta do evento.
          </p>
          <Link
            to={`/portaria/${idCasal}`}
            style={{
              display: "block",
              padding: "12px 20px",
              backgroundColor: "#2cbdbd",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              textAlign: "center",
              fontSize: "14px",
            }}
          >
            Acessar Check-in VIP
          </Link>
        </div>
      </div>
    </div>
  );
}

// --- 4. TELA DOS CONVIDADOS ---
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

// --- 5. TELA DA PORTARIA ---
function TelaPortaria() {
  const { idCasal } = useParams();
  const navigate = useNavigate();
  const [convidados, setConvidados] = useState([]);
  const [busca, setBusca] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("confirmado");

  useEffect(() => {
    const convidadosRef = ref(database, `convidados_por_casal/${idCasal}`);
    onValue(convidadosRef, (snapshot) => {
      const dados = snapshot.val();
      if (dados) {
        const lista = Object.keys(dados).map((key) => ({
          id: key,
          ...dados[key],
        }));
        setConvidados(lista);
      } else {
        setConvidados([]);
      }
    });
  }, [idCasal]);

  const fazerCheckin = (id, jaEntrou) => {
    const convidadoRef = ref(database, `convidados_por_casal/${idCasal}/${id}`);
    update(convidadoRef, { checkin: !jaEntrou, status: "confirmado" });
  };

  const definirMesa = (id, mesaAtual) => {
    const novaMesa = window.prompt(
      "Digite o número ou nome da mesa para este convidado:",
      mesaAtual || ""
    );
    if (novaMesa !== null) {
      const convidadoRef = ref(
        database,
        `convidados_por_casal/${idCasal}/${id}`
      );
      update(convidadoRef, { mesa: novaMesa });
    }
  };

  const deletarConvidado = (id, nome) => {
    if (window.confirm(`Tem certeza que deseja excluir ${nome} da lista?`)) {
      const convidadoRef = ref(
        database,
        `convidados_por_casal/${idCasal}/${id}`
      );
      set(convidadoRef, null);
    }
  };

  // --- 🪄 A MÁGICA DO WHATSAPP AQUI (CORRIGIDA) ---
  const enviarWhatsApp = (telefone, nomeConvidado) => {
    // 1. Limpa tudo que não for número
    let numeroLimpo = telefone.replace(/\D/g, "");

    // 2. Coloca o 55 do Brasil se precisar
    if (numeroLimpo.length === 10 || numeroLimpo.length === 11) {
      numeroLimpo = "55" + numeroLimpo;
    }

    // 3. Formata o nome do Casal
    const nomeCasalFormatado = idCasal
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    // 🎯 O LINK PERFEITO (Sem a hashtag!)
    const linkConvite = `${window.location.origin}/convite/${idCasal}`;

    // 4. A mensagem Pronta!
    const mensagem = `Olá, ${nomeConvidado}! Tudo bem? Aqui é da assessoria do casamento de ${nomeCasalFormatado}. \n\nSegue o seu link exclusivo para confirmar a sua presença e ver as informações do nosso grande dia: \n🔗 ${linkConvite}`;

    // 5. Cria o link oficial do WhatsApp e abre
    const url = `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(
      mensagem
    )}`;
    window.open(url, "_blank");
  };

  const convidadosDaAba = convidados.filter((c) => {
    if (abaAtiva === "pendente")
      return c.status === "pendente" || c.status === "talvez";
    return c.status === abaAtiva;
  });

  const filtrados = convidadosDaAba.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const totalConfirmados = convidados.filter(
    (c) => c.status === "confirmado"
  ).length;
  const totalPresentes = convidados.filter((c) => c.checkin).length;
  const totalPendentes = convidados.filter(
    (c) => c.status === "pendente" || c.status === "talvez"
  ).length;
  const totalNaoVao = convidados.filter((c) => c.status === "nao_vou").length;

  const estiloAba = (nomeAba) => ({
    flex: 1,
    padding: "12px",
    textAlign: "center",
    backgroundColor: abaAtiva === nomeAba ? "#2cbdbd" : "white",
    color: abaAtiva === nomeAba ? "white" : "#666",
    fontWeight: "bold",
    cursor: "pointer",
    borderBottom: abaAtiva === nomeAba ? "3px solid #1a8b8b" : "1px solid #eee",
    transition: "all 0.3s",
    fontSize: "13px",
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
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          display: "flex",
          alignItems: "center",
          gap: "15px",
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
            padding: "0",
          }}
        >
          ⬅ Voltar
        </button>
      </div>

      <div
        style={{ padding: "20px", maxWidth: "600px", margin: "-20px auto 0" }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "20px",
            marginTop: "10px",
          }}
        >
          <h2 style={{ margin: 0, color: "#333", fontSize: "22px" }}>
            📋 Recepção VIP
          </h2>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "15px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              flex: 1,
              borderRight: "1px solid #eee",
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: "24px",
                fontWeight: "bold",
                color: "#333",
              }}
            >
              {totalConfirmados}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: "#888",
                textTransform: "uppercase",
              }}
            >
              Confirmados
            </span>
          </div>
          <div style={{ textAlign: "center", flex: 1 }}>
            <span
              style={{
                display: "block",
                fontSize: "24px",
                fontWeight: "bold",
                color: "#2cbdbd",
              }}
            >
              {totalPresentes}
            </span>
            <span
              style={{
                fontSize: "12px",
                color: "#888",
                textTransform: "uppercase",
              }}
            >
              Já Entraram
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            backgroundColor: "white",
            borderRadius: "10px",
            overflow: "hidden",
            marginBottom: "20px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
          }}
        >
          <div
            onClick={() => setAbaAtiva("confirmado")}
            style={estiloAba("confirmado")}
          >
            Confirmados ({totalConfirmados})
          </div>
          <div
            onClick={() => setAbaAtiva("pendente")}
            style={estiloAba("pendente")}
          >
            Pendentes ({totalPendentes})
          </div>
          <div
            onClick={() => setAbaAtiva("nao_vou")}
            style={estiloAba("nao_vou")}
          >
            Não Vão ({totalNaoVao})
          </div>
        </div>

        <input
          type="text"
          placeholder="🔍 Buscar pelo nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "10px",
            border: "1px solid #ddd",
            marginBottom: "20px",
            boxSizing: "border-box",
            fontSize: "16px",
            outline: "none",
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
                padding: "15px 20px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                borderLeft: c.checkin
                  ? "5px solid #2cbdbd"
                  : "5px solid transparent",
                transition: "all 0.2s",
              }}
            >
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: c.checkin ? "#aaa" : "#333",
                    textDecoration: c.checkin ? "line-through" : "none",
                  }}
                >
                  {c.nome}
                </span>

                <span
                  onClick={() => definirMesa(c.id, c.mesa)}
                  style={{
                    display: "inline-block",
                    fontSize: "13px",
                    color: c.mesa ? "#2cbdbd" : "#999",
                    marginTop: "4px",
                    cursor: "pointer",
                    backgroundColor: "#f0f2f5",
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  Mesa: {c.mesa ? c.mesa : "Não definida"} ✎
                </span>

                <span
                  onClick={() => deletarConvidado(c.id, c.nome)}
                  style={{
                    cursor: "pointer",
                    marginLeft: "10px",
                    fontSize: "14px",
                  }}
                  title="Excluir Convidado"
                >
                  🗑️
                </span>

                {abaAtiva === "pendente" && c.telefone && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginTop: "8px",
                    }}
                  >
                    <span style={{ fontSize: "13px", color: "#888" }}>
                      📞 {c.telefone}
                    </span>
                    <button
                      onClick={() => enviarWhatsApp(c.telefone, c.nome)}
                      style={{
                        backgroundColor: "#25D366",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        boxShadow: "0 2px 4px rgba(37, 211, 102, 0.3)",
                      }}
                    >
                      <span>💬</span> Enviar Link
                    </button>
                  </div>
                )}
              </div>

              <div
                onClick={() => fazerCheckin(c.id, c.checkin)}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  border: c.checkin ? "2px solid #2cbdbd" : "2px solid #ccc",
                  backgroundColor: c.checkin ? "#2cbdbd" : "transparent",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {c.checkin && (
                  <span
                    style={{
                      color: "white",
                      fontSize: "18px",
                      fontWeight: "bold",
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
            </div>
          ))}

          {filtrados.length === 0 && (
            <p
              style={{ textAlign: "center", color: "#999", marginTop: "20px" }}
            >
              Nenhum convidado nesta aba.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// --- 6. ROTAS ---
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PainelAdmin />} />
        <Route path="/evento/:idCasal" element={<DashboardEvento />} />
        <Route path="/convite/:idCasal" element={<TelaConvidados />} />
        <Route path="/portaria/:idCasal" element={<TelaPortaria />} />
        <Route path="*" element={<PainelAdmin />} />
      </Routes>
    </BrowserRouter>
  );
}
