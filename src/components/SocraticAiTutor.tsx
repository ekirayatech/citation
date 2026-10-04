import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RotateCcw,
  HelpCircle,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Loader2,
  X,
} from 'lucide-react';
import { CitationFormData } from '../types/citation';
import { SOURCE_TYPE_LABELS, STYLE_LABELS } from '../utils/citationEngine';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

interface SocraticAiTutorProps {
  formData: CitationFormData;
  className?: string;
  onClose?: () => void;
}

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'msg-welcome',
  role: 'model',
  content: `¡Hola! Soy tu **Tutor Socrático de Citación** del Colegio Ekirayá 🦉.

Mi misión **no es darte la cita armada para copiar y pegar**, sino acompañarte y hacerte preguntas para que tú mismo descubras cómo estructurarla según las normas (**APA 7.ª**, MLA, Chicago o Icontec).

¿Qué tipo de fuente estás consultando hoy o qué duda tienes con los datos de tu referencia?`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const QUICK_PROMPTS = [
  {
    label: '✨ Revisar mi formulario actual',
    prompt: 'Por favor revisa los datos que tengo ingresados en el formulario de la izquierda. ¿Qué elementos tengo bien y qué me faltaría o debería verificar según las normas?',
  },
  {
    label: '🌐 Página web sin autor',
    prompt: 'Tengo una página web o artículo en línea pero no tiene un autor con nombre y apellido. ¿Qué debo poner como autor?',
  },
  {
    label: '👥 3 o más autores en el texto',
    prompt: 'Mi fuente tiene 4 autores. ¿Cómo los menciono en una cita entre paréntesis dentro del texto según APA 7.ª edición?',
  },
  {
    label: '📅 No encuentro la fecha',
    prompt: 'No encuentro el año ni la fecha de publicación en el documento. ¿Qué debo colocar y dónde puedo verificar?',
  },
  {
    label: '✍️ Cita narrativa vs. parentética',
    prompt: '¿Cuál es la diferencia entre una cita narrativa y una cita parentética, y cómo elijo cuál usar en mi redacción?',
  },
  {
    label: '📖 ¿Qué va en cursiva?',
    prompt: '¿Cómo sé qué parte de la referencia bibliográfica debe llevar formato en cursiva (itálica)?',
  },
];

export const SocraticAiTutor: React.FC<SocraticAiTutorProps> = ({
  formData,
  className = '',
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    setErrorMessage(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    try {
      // Build conversation history for context
      const historyPayload = messages
        .filter((m) => m.id !== 'msg-welcome')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const response = await fetch('/api/gestor/ai-tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          context: {
            style: formData.style,
            sourceType: formData.sourceType,
            title: formData.title,
            authors: formData.authors,
            isInstitutionalAuthor: formData.isInstitutionalAuthor,
            institutionalName: formData.institutionalName,
            year: formData.year,
            publisher: formData.publisher,
            url: formData.url,
            doi: formData.doi,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok && !data.fallbackReply) {
        throw new Error(data.error || 'Error al comunicarse con el Tutor');
      }

      const botReply = data.reply || data.fallbackReply || 'No pude procesar la respuesta en este momento.';

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Error in Socratic Tutor:', err);
      setErrorMessage(
        err.message || 'No fue posible conectar con el Tutor IA. Por favor intenta de nuevo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setErrorMessage(null);
    setInputValue('');
  };

  // Helper to format simple markdown-like text (bold, lists, paragraphs)
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1.5" />;
          }

          // Bullet list items
          if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
            const cleanText = trimmed.replace(/^[\s•\-\*]+\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-1.5">
                <span className="text-violet-600 font-bold shrink-0 mt-0.5">•</span>
                <span>{renderInlineStyles(cleanText)}</span>
              </div>
            );
          }

          // Numbered lists like 1. 2.
          const numberedMatch = trimmed.match(/^(\d+[\.\)])\s+(.*)$/);
          if (numberedMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1.5">
                <span className="text-violet-700 font-bold shrink-0 text-xs mt-0.5">
                  {numberedMatch[1]}
                </span>
                <span>{renderInlineStyles(numberedMatch[2])}</span>
              </div>
            );
          }

          return <p key={idx}>{renderInlineStyles(trimmed)}</p>;
        })}
      </div>
    );
  };

  // Simple parser for **bold** text
  const renderInlineStyles = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div
      className={`flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs h-full min-h-[580px] max-h-[750px] ${className}`}
    >
      {/* Encabezado del Tutor Socrático */}
      <div className="bg-gradient-to-r from-[#533e6f] via-[#664d88] to-[#533e6f] text-white p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#f8c62e] text-slate-950 flex items-center justify-center font-bold shadow-xs shrink-0">
            <Bot className="w-5 h-5 text-slate-950" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm sm:text-base tracking-tight truncate">
                Tutor Socrático IA
              </h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[#f8c62e] text-[10px] font-semibold uppercase tracking-wider shrink-0">
                <Sparkles className="w-3 h-3" />
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-violet-100 text-xs truncate">
              Orientación paso a paso · No da respuestas servidas, te enseña a formularlas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleResetChat}
            className="p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 transition-colors"
            title="Reiniciar conversación con el tutor"
            aria-label="Reiniciar conversación"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 transition-colors"
              title="Cerrar ventana del Tutor"
              aria-label="Cerrar ventana del Tutor"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Indicador del Contexto del Formulario Activo */}
      <div className="bg-violet-50/70 border-b border-violet-100 px-4 py-2 text-[11px] flex flex-wrap items-center justify-between gap-2 text-violet-900 shrink-0">
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-semibold">Contexto actual:</span>
          <span className="bg-white border border-violet-200 px-1.5 py-0.5 rounded text-violet-800 font-medium">
            {STYLE_LABELS[formData.style]?.split(' ·')[0]}
          </span>
          <span className="text-slate-400">·</span>
          <span className="truncate text-slate-700">
            {SOURCE_TYPE_LABELS[formData.sourceType] || formData.sourceType}
          </span>
          {formData.title && (
            <>
              <span className="text-slate-400">·</span>
              <span className="truncate italic text-slate-600 max-w-[140px]">
                &quot;{formData.title}&quot;
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleSendMessage(QUICK_PROMPTS[0].prompt)}
          disabled={isLoading}
          className="text-violet-700 hover:text-violet-950 font-semibold flex items-center gap-1 underline decoration-violet-300 hover:decoration-violet-700 disabled:opacity-50"
        >
          <Sparkles className="w-3 h-3 text-[#b8860b]" />
          Revisar mis campos
        </button>
      </div>

      {/* Área de Mensajes del Chat */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/40">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold ${
                  isUser
                    ? 'bg-[#664d88] text-white shadow-xs'
                    : 'bg-white border border-violet-200 text-violet-800 shadow-xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-violet-700" />}
              </div>

              <div className={`max-w-[85%] space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-3.5 rounded-2xl shadow-xs ${
                    isUser
                      ? 'bg-[#664d88] text-white rounded-tr-none'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none'
                  }`}
                >
                  {isUser ? (
                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  ) : (
                    renderFormattedContent(msg.content)
                  )}
                </div>
                <div
                  className={`text-[10px] text-slate-400 px-1 ${
                    isUser ? 'text-right' : 'text-left'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Indicador de carga / pensando */}
        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white border border-violet-200 text-violet-800 flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-4 h-4 text-violet-700" />
            </div>
            <div className="p-3.5 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-2 text-xs text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
              <span>El tutor está formulando tus preguntas de orientación...</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Aviso de conexión</div>
              <div>{errorMessage}</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sugerencias Rápidas / Pills de Preguntas Frecuentes */}
      <div className="border-t border-slate-200 bg-white p-2.5 overflow-x-auto shrink-0">
        <div className="flex items-center gap-1.5 pb-1">
          <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap pl-1">
            Preguntas clave:
          </span>
          {QUICK_PROMPTS.slice(1).map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSendMessage(item.prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-violet-50 text-slate-700 hover:text-violet-900 border border-slate-200/80 hover:border-violet-300 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Barra de Entrada de Consulta */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2 shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Escribe tu duda sobre autor, año, título, editorial o formato..."
          disabled={isLoading}
          className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#664d88] focus:border-transparent disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="px-4 py-2.5 rounded-xl bg-[#664d88] hover:bg-[#533e6f] text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          aria-label="Enviar pregunta al tutor"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Consultar</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
