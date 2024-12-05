import React, { useState, useEffect, useRef } from "react";
import { model } from "../firebase/firebaseConfig";
import ReactMarkdown from "react-markdown"; // Para renderizar Markdown
import './ChatPension.css'; // Importamos los estilos

const ChatPension = ({ pagos }) => {
  const [input, setInput] = useState(""); // Manejo del input del usuario
  const [chat, setChat] = useState([]); // Historial del chat
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatWindowRef = useRef(null); // Referencia para el chat

  useEffect(() => {
    setChat([]); // Reinicia el chat al cambiar los pagos
  }, [pagos]);

  const enviarPregunta = async () => {
    if (!input.trim()) return; // Evita preguntas vacías

    setLoading(true);
    setError(null);

    setChat((prevChat) => [...prevChat, { sender: "user", message: input }]);

    const prompt = generarPrompt(input); // Crear el prompt con los datos

    try {
      const result = await model.generateContent(prompt);
      const respuesta = await result.response.text();

      setChat((prevChat) => [
        ...prevChat,
        { sender: "ia", message: respuesta },
      ]);
    } catch (error) {
      console.error(error);
      setError("Hubo un error al procesar tu pregunta.");
    } finally {
      setLoading(false);
      setInput(""); // Limpiar input
    }
  };

  const generarPrompt = (pregunta) => {
    const textoPagos = pagos
      .map((pago, index) => {
        const detalles = pago.detalles
          .map(
            (detalle) =>
              `Concepto: ${
                detalle.nombre
              }, Ingresos: ${detalle.ingresos.toLocaleString("es-CO", {
                style: "currency",
                currency: "COP",
              })}, Egresos: ${detalle.egresos.toLocaleString("es-CO", {
                style: "currency",
                currency: "COP",
              })}`
          )
          .join("\n");

        return `Pago ${index + 1}:
Año: ${pago.año}
Mesada Pensional: ${pago.basico}
Valor Neto: ${pago.valorNeto.toLocaleString("es-CO", {
          style: "currency",
          currency: "COP",
        })}
Valor Liquidado: ${pago.valorLiquidado.toLocaleString("es-CO", {
          style: "currency",
          currency: "COP",
        })}
Periodo de Pago: ${pago.periodoPago}
Fecha de Liquidación: ${pago.fechaLiquidacion}
Detalles:
${detalles}\n`;
      })
      .join("\n");

    return `El usuario ha preguntado: "${pregunta}".
Estos son los datos de pensión disponibles:
${textoPagos}
Por favor, responde a la pregunta del usuario con base en estos datos.`;
  };

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [chat]);

  return (
    <div>
      <h2>Chat sobre Pensiones</h2>

      <div className="chat-window" ref={chatWindowRef}>
        {chat.map((msg, index) => (
          <div
            key={index}
            className={msg.sender === "user" ? "user-message" : "ia-message"}
          >
            <strong>{msg.sender === "user" ? "Tú" : "IA"}:</strong>
            <ReactMarkdown>{msg.message}</ReactMarkdown>
          </div>
        ))}
      </div>

      {loading && <p>Procesando tu pregunta...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ display: "flex", alignItems: "center", marginTop: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta sobre las pensiones"
          onKeyDown={(e) => e.key === "Enter" && enviarPregunta()}
          className="modern-select" // Aplicamos el estilo del selector
        />
        <button onClick={enviarPregunta} disabled={loading} className="modern-button">
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </div>
  );
};

export default ChatPension;
