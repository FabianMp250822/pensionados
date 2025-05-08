import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import apiClient from '../services/axiosConfig'; // Usa apiClient, no axios directo
import './ChatLegal.css';

const ChatLegal = () => {
  const [messages, setMessages] = useState([
    { 
      sender: 'system', 
      message: 'Bienvenido al asistente legal especializado en derecho pensional. Puedo ayudarte con:\n\n' +
               '- Consultas sobre pensionados específicos (proporcionando nombre o cédula)\n' +
               '- Información sobre pagos de pensión y sus detalles\n' +
               '- Preguntas sobre la Ley 4 de 1976 y derechos de los pensionados\n\n' +
               '¿En qué puedo ayudarte hoy?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contextoActivo, setContextoActivo] = useState(null);
  const chatWindowRef = useRef(null);
  const { userRole } = useSelector((state) => state.auth);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  // Extrae documentos y nombres de la consulta
  const extraerConsulta = (texto) => {
    // Mejoramos la expresión regular para documentos
    const documentosRegex = /\b\d{6,12}\b/g;
    const documentos = texto.match(documentosRegex) || [];
    
    // Mejoramos la extracción de nombres
    let nombres = [];
    
    // Patrones más flexibles para capturar nombres mencionados de diferentes formas
    const patrones = [
      /(?:nombre|sobre|persona|beneficiario|causante|pensionado):?\s+([A-Za-zÁÉÍÓÚáéíóúÑñ\s]{3,30})/gi,
      /(?:de|para|a)\s+([A-Za-zÁÉÍÓÚáéíóúÑñ]{2,15}\s+[A-Za-zÁÉÍÓÚáéíóúÑñ]{2,15}(?:\s+[A-Za-zÁÉÍÓÚáéíóúÑñ]{2,15})?)/gi,
    ];
    
    patrones.forEach(patron => {
      let match;
      while ((match = patron.exec(texto)) !== null) {
        if (match[1] && match[1].trim()) {
          const nombre = match[1].trim().replace(/\s+/g, ' '); // Normaliza espacios
          nombres.push(nombre);
        }
      }
    });
    
    // Elimina duplicados
    nombres = [...new Set(nombres)];
    
    return { documentos, nombres };
  };

  const verificarCalidadRespuesta = (respuesta, contexto) => {
    // Si tenemos contexto activo pero la respuesta parece genérica
    if (contexto?.datos?.encontrados && 
        (respuesta.includes("Ley 4 de 1976 establece") || 
         respuesta.includes("consultar con un abogado especializado"))) {
      return {
        esGenerica: true,
        mensajeAdicional: "*Nota: He encontrado datos específicos sobre esta consulta pero necesito más información para darte detalles precisos.*"
      };
    }
    return { esGenerica: false };
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);

    const currentInput = input;
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', message: currentInput }]);

    try {
      const { documentos, nombres } = extraerConsulta(currentInput);

      // Agrega esto después de extraer la consulta en handleSendMessage
      if (process.env.NODE_ENV === 'development') {
        console.log('Consulta extraída:', { documentos, nombres });
      }

      // Cambia aquí: usa apiClient y la ruta relativa correcta
      const response = await apiClient.post('legalConsulta/consultar', {
        pregunta: currentInput,
        documentos: documentos.length > 0 ? documentos : undefined,
        nombres: nombres.length > 0 ? nombres : undefined,
        contextoActivo: contextoActivo
      });

      if (response.data.success) {
        if (response.data.contexto) {
          setContextoActivo(response.data.contexto);
        }
        
        const { esGenerica, mensajeAdicional } = verificarCalidadRespuesta(
          response.data.respuesta, 
          response.data.contexto
        );
        
        let mensaje = response.data.respuesta;
        if (esGenerica && mensajeAdicional) {
          mensaje = `${mensaje}\n\n${mensajeAdicional}`;
        }
        
        setMessages((prev) => [...prev, {
          sender: 'system',
          message: mensaje
        }]);
      } else {
        throw new Error(response.data.error || 'No se pudo procesar la consulta');
      }
    } catch (err) {
      console.error('Error al enviar consulta legal:', err);
      let errorMessage = 'Hubo un problema al procesar tu consulta.';
      
      if (process.env.NODE_ENV === 'development') {
        errorMessage += ' Detalles: ' + (err.response?.data?.error || err.message || 'Error desconocido');
      }
      
      setError(errorMessage);
      setMessages((prev) => [...prev, {
        sender: 'error',
        message: 'Lo siento, ocurrió un error al procesar tu consulta. Por favor, intenta de nuevo.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleReiniciarConsulta = () => {
    setContextoActivo(null);
    setMessages([
      { sender: 'system', message: 'Bienvenido al asistente legal especializado en derecho pensional. ¿En qué puedo ayudarte hoy? Puedes preguntar sobre una persona específica por su nombre o número de documento.' }
    ]);
  };

  return (
    <div className="legal-chat-container">
      <div className="legal-chat-header">
        <h1>Asistente Legal Pensional</h1>
        <p>Especializado en derecho de los pensionados</p>
        {contextoActivo && (
          <div className="documento-consulta-info">
            <p>
              <span className="contexto-badge">Consulta activa</span> 
              {contextoActivo.descripcion}
            </p>
            <button onClick={handleReiniciarConsulta} className="reiniciar-consulta-btn">
              Nueva consulta
            </button>
          </div>
        )}
      </div>
      <div className="legal-chat-window" ref={chatWindowRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`legal-chat-message ${msg.sender}-message`}>
            <div className="message-content">
              <div className="message-sender">
                {msg.sender === 'user' ? 'Tú' : msg.sender === 'system' ? 'Asistente Legal' : 'Error'}
              </div>
              <div className="message-text">
                <ReactMarkdown>{msg.message}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="legal-chat-message system-message">
            <div className="message-content">
              <div className="message-sender">Asistente Legal</div>
              <div className="message-text loading-indicator">
                <div className="dot-flashing"></div>
              </div>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSendMessage} className="legal-chat-input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu consulta legal aquí..."
          className="legal-chat-input"
          rows={3}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
        />
        <button
          type="submit"
          className="legal-chat-send-button"
          disabled={loading || !input.trim()}
        >
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default ChatLegal;
