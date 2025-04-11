import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux"; // Acceso al store
import {
  Box,
  Fab,
  Paper,
  Typography,
  TextField,
  Button,
  Slide,
  Divider,
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import axios from "axios";

const ChatWidget = () => {
  const user = useSelector((state) => state.user);
  const pensiones = useSelector((state) => state.pensiones);
  const contabilidad = useSelector((state) => state.contabilidad);
  const causantes = useSelector((state) => state.causantes);
  const procesos = useSelector((state) => state.procesos);
  const pensionado = useSelector((state) => state.pensionado);

  // Saludo inicial: si el usuario tiene nombre, se personaliza
  const saludoInicial = user && user.nombre 
    ? `Hola, ¿cómo estás ${user.nombre}?`
    : "Hola, ¿en qué puedo ayudarte?";

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "Asistente", text: saludoInicial },
  ]);
  const [input, setInput] = useState("");

  // Actualiza el saludo inicial si se obtiene la información del usuario después
  useEffect(() => {
    if (user && user.nombre && messages[0]?.text !== `Hola, ¿cómo estás ${user.nombre}?`) {
      setMessages((prev) => {
        const nuevos = [...prev];
        nuevos[0] = { sender: "Asistente", text: `Hola, ¿cómo estás ${user.nombre}?` };
        return nuevos;
      });
    }
  }, [user]);

  const toggleChat = () => setOpen((prev) => !prev);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Agrega el mensaje del usuario
    const userMessage = { sender: "Usuario", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      // Incluye la información de usuario, de los slices y la información de la empresa
      const context = `
        Datos del usuario: ${JSON.stringify(user)}
        Datos de pensiones: ${JSON.stringify(pensiones)}
        Datos de contabilidad: ${JSON.stringify(contabilidad)}
        Datos de causantes: ${JSON.stringify(causantes)}
        Datos de procesos: ${JSON.stringify(procesos)}
        Datos de pensionado: ${JSON.stringify(pensionado)}
        Información de la empresa: Dirección cra 46 #90-46 oficina 501, Distrito 90, 
        Correo: director.dajusticia@gmail.com, Teléfonos: +57 6054036322, 3016817480.
      `;

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4",
          messages: [
            { role: "system", content: "Eres un asistente útil que responde basado en los datos proporcionados." },
            { role: "system", content: context },
            ...messages.map((msg) => ({
              role: msg.sender === "Usuario" ? "user" : "assistant",
              content: msg.text,
            })),
            { role: "user", content: input },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer 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",
          },
        }
      );

      const assistantMessage = {
        sender: "Asistente",
        text: response.data.choices[0].message.content,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error al comunicarse con la API:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "Asistente", text: "Lo siento, ocurrió un error." },
      ]);
    }
  };

  return (
    <>
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Paper
          elevation={3}
          sx={{
            position: "fixed",
            bottom: "80px",
            right: "20px",
            width: "320px",
            height: "400px",
            display: "flex",
            flexDirection: "column",
            borderRadius: "8px",
            backgroundColor: "#fff",
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            zIndex: "1300",
          }}
        >
          {/* Cabecera del chat */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 16px",
              borderBottom: "1px solid #eee",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: "#333",
                fontWeight: "bold",
                fontSize: "1rem",
              }}
            >
              Chat en línea
            </Typography>
            <Typography
              onClick={toggleChat}
              sx={{
                cursor: "pointer",
                color: "#333",
                fontWeight: "bold",
                fontSize: "1.2rem",
              }}
            >
              X
            </Typography>
          </Box>

          {/* Área de mensajes */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              padding: "16px",
              backgroundColor: "#f9f9f9",
            }}
          >
            {messages.map((msg, index) => (
              <Typography
                key={index}
                variant="body2"
                gutterBottom
                sx={{
                  color: "#333",
                  marginBottom: "8px",
                  textAlign: msg.sender === "Usuario" ? "right" : "left",
                }}
              >
                <strong>
                  {msg.sender === "Usuario" 
                    ? (user && user.nombre ? user.nombre : "Usuario") 
                    : msg.sender}
                  :
                </strong> {msg.text}
              </Typography>
            ))}
          </Box>

          <Divider sx={{ margin: "0" }} />

          {/* Área de entrada de mensaje */}
          <Box
            component="form"
            onSubmit={handleSendMessage}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
            }}
          >
            <TextField
              variant="outlined"
              size="small"
              fullWidth
              placeholder="Escribe tu mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              sx={{
                backgroundColor: "#fff",
                "& .MuiOutlinedInput-root": {
                  borderRadius: "4px",
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="small"
              sx={{
                textTransform: "none",
                fontWeight: "600",
                backgroundColor: "#0077B5",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "#005C82",
                },
              }}
            >
              Enviar
            </Button>
          </Box>
        </Paper>
      </Slide>

      <Fab
        onClick={toggleChat}
        sx={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: "1301",
          backgroundColor: "#0077B5",
          color: "#fff",
          "&:hover": {
            backgroundColor: "#005C82",
          },
        }}
      >
        <ChatIcon />
      </Fab>
    </>
  );
};

export default ChatWidget;
