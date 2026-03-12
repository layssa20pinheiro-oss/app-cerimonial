import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set, onValue, update, get } from "firebase/database";
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

const pegarIniciais = (nome) => {
  if (!nome) return "??";
  try {
    const partes = nome.replace(/ e /gi, " & ").split("&").map((p) => p.trim());
    if (partes.length > 1 && partes[0].length > 0 && partes[1].length > 0) {
      return (partes[0][0] + "&" + partes[1][0]).toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  } catch (error) {
    return "??";
  }
};

// --- 2. PAINEL ADMIN (Com "Eventos Concluídos") ---
function PainelAdmin() {
  const [nomeCasal, setNomeCasal] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [casamentos, setCasamentos] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState("proximos"); 
  const navigate = useNavigate();

  useEffect(() => {
    const casamentosRef = ref(database, "casamentos_cadastrados");
    onValue(casamentosRef, (snapshot) => {
      const dados = snapshot.val();
      if (dados) {
        const lista = Object.keys(dados).map((key) => ({ id: key, ...dados[key] }));
        setCasamentos(lista);
      } else {
        setCasamentos([]);
      }
    });
  }, []);

  const criarNovoCasamento = (e) => {
    e.preventDefault();
    const idUrl = nomeCasal.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    if (!idUrl) return alert("Digite um nome válido!");

    const novoRef = ref(database, `casamentos_cadastrados/${idUrl}`);
    set(novoRef, { 
      nomeExibicao: nomeCasal, 
      idUrl: idUrl, 
      data: dataEvento || "", 
      tipo: "Casamento" 
    })
      .then(() => { setNomeCasal(""); setDataEvento(""); })
      .catch((error) => alert("Erro ao criar: " + error.message));
  };

  const deletarEvento = (e, idUrl, nome) => {
    e.stopPropagation(); 
    if (window.confirm(`⚠️ Tem certeza que deseja excluir o evento "${nome}"? Isso apagará a lista inteira deste evento!`)) {
      const eventoRef = ref(database, `casamentos_cadastrados/${idUrl}`);
      set(eventoRef, null); 
      
      const convidadosRef = ref(database, `convidados_por_casal/${idUrl}`);
      set(convidadosRef, null); 
    }
  };

  const hoje = new Date().toISOString().split("T")[0]; 

  const eventosFiltrados = casamentos.filter((casal) => {
    if (abaAtiva === "proximos") {
      return !casal.data || casal.data >= hoje;
    } else {
      return casal.data && casal.data < hoje;
    }
  });

  if (abaAtiva === "proximos") {
    eventosFiltrados.sort((a, b) => (a.data || "9999") > (b.data || "9999") ? 1 : -1);
  } else {
    eventosFiltrados.sort((a, b) => a.data < b.data ? 1 : -1);
  }

  const estiloAba = (nomeAba) => ({
    flex: 1, padding: "12px", textAlign: "center", backgroundColor: abaAtiva === nomeAba ? "#2cbdbd" : "white", color: abaAtiva === nomeAba ? "white" : "#666", fontWeight: "bold", cursor: "pointer", borderBottom: abaAtiva === nomeAba ? "3px solid #1a8b8b" : "1px solid #eee", transition: "all 0.3s", fontSize: "14px"
  });

  return (
    <div style={{ backgroundColor: "#f5f7fa", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ backgroundColor: "#2cbdbd", padding: "40px 20px", borderBottomLeftRadius: "30px", borderBottomRightRadius: "30px", color: "white", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
        <h1 style={{ margin: 0, fontSize: "28px" }}>Meus eventos</h1>
      </div>

      <div style={{ padding: "20px", maxWidth: "600px", margin: "-20px auto 0" }}>
        
        <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", marginBottom: "30px" }}>
          <form onSubmit={criarNovoCasamento} style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <input type="text" placeholder="Nome dos Noivos" value={nomeCasal} onChange={(e) => setNomeCasal(e.target.value)} required style={{ flex: "1 1 100%", padding: "12px", borderRadius: "5px", border: "1px solid #ddd" }} />
            <input type="date" value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} required style={{ flex: "1 1 calc(50% - 5px)", padding: "12px", borderRadius: "5px", border: "1px solid #ddd" }} />
            <button type="submit" style={{ flex: "1 1 calc(50% - 5px)", padding: "12px", backgroundColor: "#2cbdbd", color: "white", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer" }}>+ Cadastrar</button>
          </form>
        </div>

        <div style={{ display: "flex", backgroundColor: "white", borderRadius: "10px", overflow: "hidden", marginBottom: "20px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
          <div onClick={() => setAbaAtiva("proximos")} style={estiloAba("proximos")}>Próximos Eventos</div>
          {/* O NOME MUDOU AQUI EMBAIXO: */}
          <div onClick={() => setAbaAtiva("anteriores")} style={estiloAba("anteriores")}>Eventos Concluídos</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {eventosFiltrados.map((casal) => (
            <div key={casal.id} onClick={() => navigate(`/evento/${casal.idUrl}`)} style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "15px", cursor: "pointer", transition: "transform 0.2s" }}>
              
              <div style={{ width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "#f0f0f0", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "20px", fontWeight: "bold", color: "#666", flexShrink: 0 }}>
                {pegarIniciais(casal.nomeExibicao)}
              </div>
              
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 5px 0", fontSize: "13px", color: "#888", fontWeight: "bold" }}>
                  {casal.data && casal.data.includes("-") ? casal.data.split("-").reverse().join("/") : "Sem data"} • Evento
                </p>
                <h3 style={{ margin: "0", fontSize: "18px", color: "#333", textTransform: "capitalize" }}>{casal.nomeExibicao}</h3>
              </div>

              <div 
                onClick={(e) => deletarEvento(e, casal.idUrl, casal.nomeExibicao)} 
                style={{ padding: "10px", fontSize: "20px", color: "#ff4d4d", cursor: "pointer", borderRadius: "50%" }}
                title="Excluir Evento"
              >
                🗑️
              </div>

            </div>
          ))}
          
          {eventosFiltrados.length === 0 && (
            <p style={{ textAlign: "center", color: "#999", marginTop: "20px" }}>
              {abaAtiva === "proximos" ? "Nenhum evento agendado." : "Nenhum evento concluído."}
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

  const importarPlanilha = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const convidadosRef = ref(database, `convidados_por_casal/${idCasal}`);
      const snapshot = await get(convidadosRef);
      const convidadosAtuais = [];
      if (snapshot.exists()) {
        const dados = snapshot.val();
        Object.keys(dados).forEach(key => {
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
          if (index === 0) return; 
          if (!linha.trim()) return; 

          const colunas = linha.split(/;|,/); 
          const nomeConvidado = colunas[0] ? colunas[0].trim() : "";
          const telefoneConvidado = colunas[1] ? colunas[1].trim() : "";
          const mesaConvidado = colunas[2] ? colunas[2].trim() : "";

          if (nomeConvidado) {
            const nomeNormalizado = nomeConvidado.toLowerCase();
            const convidadoExistente = convidadosAtuais.find(c => c.nome.toLowerCase() === nomeNormalizado);

            if (convidadoExistente) {
              const refParaAtualizar = ref(database, `convidados_por_casal/${idCasal}/${convidadoExistente.id}`);
              update(refParaAtualizar, {
                telefone: telefoneConvidado || convidadoExistente.telefone,
                mesa: mesaConvidado || convidadoExistente.mesa
              });
              totalAtualizados++;
            } else {
              push(convidadosRef, {
                nome: nomeConvidado,
                telefone: telefoneConvidado,
                mesa: mesaConvidado,
                status: "pendente", 
                checkin: false
              });
              totalNovos++;
            }
          }
        });

        alert(`🎉 Lista processada! \n${totalNovos} novos convidados adicionados. \n${totalAtualizados} convidados atualizados.`);
        e.target.value = ""; 
      };
      
      reader.readAsText(file, "UTF-8"); 
    } catch (error) {
      alert("Erro ao ler a planilha: " + error.message);
    }
  };

  return (
    <div style={{ backgroundColor: "#f5f7fa", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ backgroundColor: "#2cbdbd",