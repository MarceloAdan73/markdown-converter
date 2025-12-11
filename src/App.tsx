// @encoding UTF-8
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

// Sistema de notificaciones mejorado
type NotificationType = 'success' | 'error' | 'info';
interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

// Utilidades PWA
const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true ||
         document.referrer.includes('android-app://');
};

const setupOfflineHandler = () => {
  window.addEventListener('online', () => {
    console.log('Conectado a internet');
  });
  
  window.addEventListener('offline', () => {
    console.log('Sin conexión a internet');
  });
};

const registerServiceWorkerUpdates = () => {
  if ('serviceWorker' in navigator) {
    let refreshing = false;
    
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
    
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        if (confirm('¡Nueva versión disponible! ¿Recargar para actualizar?')) {
          window.location.reload();
        }
      }
    });
  }
};

// Utilidad de conversión optimizada
class MarkdownConverter {
  static convertText(text: string): string {
    if (!text.trim()) return "";

    let result = text;
    result = this.detectHeaders(result);
    result = this.detectLists(result);
    result = this.detectCode(result);
    result = this.detectEmphasis(result);
    result = this.detectLinks(result);
    return result;
  }

  static detectHeaders(text: string): string {
    const lines = text.split("\n");
    const processedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.length > 0 && trimmed.length < 50) {
        const prevLine = i > 0 ? lines[i - 1].trim() : "";
        if (prevLine === "" || i === 0) {
          if (trimmed.length < 30) {
            processedLines.push(`# ${line}`);
            continue;
          } else if (trimmed.length < 60) {
            processedLines.push(`## ${line}`);
            continue;
          }
        }
      }
      processedLines.push(line);
    }
    return processedLines.join("\n");
  }

  static detectLists(text: string): string {
    const lines = text.split("\n");
    const processedLines: string[] = [];
    let inList = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.match(/^[-*o]\s+/)) {
        if (!inList) inList = true;
        processedLines.push(`- ${trimmed.substring(1).trim()}`);
      } else if (trimmed.match(/^\d+[.)]\s+/)) {
        if (!inList) inList = true;
        processedLines.push(line);
      } else if (trimmed === "") {
        inList = false;
        processedLines.push("");
      } else if (inList && trimmed.length > 0) {
        processedLines.push(`  ${line}`);
      } else {
        processedLines.push(line);
        inList = false;
      }
    }
    return processedLines.join("\n");
  }

  static detectCode(text: string): string {
    let result = text.replace(/(^|\n)( {4,}[^\n]+\n?)+/g, (match) => {
      return "\n```\n" + match.trim() + "\n```\n";
    });
    result = result.replace(/`([^`]+)`/g, "`$1`");
    return result;
  }

  static detectEmphasis(text: string): string {
    let result = text.replace(/(\*{2}|_{2})([^*_]+?)\1/g, "**$2**");
    result = result.replace(/(\*|_)([^*_\n]+?)\1/g, "*$2*");
    return result;
  }

  static detectLinks(text: string): string {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlPattern, "[$1]($1)");
  }

  static formatAs(type: string, text: string): string {
    switch (type) {
      case "h1":
        return `# ${text}`;
      case "h2":
        return `## ${text}`;
      case "bold":
        return `**${text}**`;
      case "italic":
        return `*${text}*`;
      case "code":
        return `\`${text}\``;
      case "link":
        return `[${text}](url)`;
      case "list":
        return `- ${text}`;
      case "codeBlock":
        return `\`\`\`\n${text}\n\`\`\``;
      default:
        return text;
    }
  }
}

// Componente principal mejorado
function App() {
  const [inputText, setInputText] = useState<string>(
    "¡Bienvenido al Markdown Converter!\n\nEscribe tu texto común aquí y observa cómo se transforma automáticamente en Markdown.\n\nCaracterísticas principales:\n- Conversión inteligente en tiempo real\n- Preview estilo GitHub exacto\n- Interfaz moderna y responsiva\n- Modo claro/oscuro\n- Exportación fácil\n\nTecnologías utilizadas:\nReact, TypeScript, Electron, CSS Custom Properties\n\nPruébalo escribiendo:\n1. Títulos cortos al principio\n2. Listas con guiones\n3. URLs como https://github.com\n4. Texto entre **asteriscos**\n5. Código con indentación"
  );
  const [convertedText, setConvertedText] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({ chars: 0, lines: 0, words: 0 });
  const [isConverting, setIsConverting] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const notificationId = useRef(0);

  // Efecto para modo oscuro persistente
  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  // Efecto para PWA
  useEffect(() => {
    // Configurar manejo de estado offline
    setupOfflineHandler();
    
    // Registrar actualizaciones del Service Worker
    registerServiceWorkerUpdates();
    
    // Detectar si está instalado como PWA
    if (isPWAInstalled()) {
      console.log('Aplicación ejecutándose como PWA');
    }
    
    // Manejar el evento beforeinstallprompt
    let deferredPrompt: any;
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Podrías mostrar un botón de instalación aquí
      console.log('PWA puede ser instalada');
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Efecto para conversión optimizada
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (inputText.trim()) {
      setIsConverting(true);
      timeoutId = setTimeout(() => {
        const converted = MarkdownConverter.convertText(inputText);
        setConvertedText(converted);
        setIsConverting(false);
      }, 150);
    } else {
      setConvertedText("");
    }

    // Calcular estadísticas
    const chars = inputText.length;
    const lines = inputText.split('\n').length;
    const words = inputText.trim().split(/\s+/).filter(word => word.length > 0).length;
    setStats({ chars, lines, words });

    return () => clearTimeout(timeoutId);
  }, [inputText]);

  // Sistema de notificaciones mejorado
  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    const id = notificationId.current++;
    const notification: Notification = { id, message, type };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remover notificación después de 3 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!convertedText.trim()) {
      showNotification("⚠️ Nada que copiar", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(convertedText);
      showNotification("✅ ¡Markdown copiado al portapapeles!", "success");
    } catch (err) {
      console.error("Error al copiar:", err);
      showNotification("❌ Error al copiar", "error");
    }
  }, [convertedText, showNotification]);

  const formatText = useCallback((type: string) => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = inputText.substring(start, end);

    let formattedText = selectedText
      ? MarkdownConverter.formatAs(type, selectedText)
      : MarkdownConverter.formatAs(type, "texto");

    const newText =
      inputText.substring(0, start) + formattedText + inputText.substring(end);
    setInputText(newText);

    // Focus y selección optimizada
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start, start + formattedText.length);
      } else {
        const textStart = formattedText.indexOf("texto");
        if (textStart !== -1) {
          textarea.setSelectionRange(start + textStart, start + textStart + 5);
        }
      }
    }, 0);
  }, [inputText]);

  const clearEditor = useCallback(() => {
    setInputText("");
    if (editorRef.current) {
      setTimeout(() => editorRef.current?.focus(), 0);
    }
    showNotification("✅ Editor limpiado", "info");
  }, [showNotification]);

  // Auto-scroll del preview al final
  useEffect(() => {
    if (previewRef.current && convertedText) {
      previewRef.current.scrollTop = previewRef.current.scrollHeight;
    }
  }, [convertedText]);

  return (
    <div className={`app ${isDarkMode ? "dark-mode" : ""}`}>
      {/* Sistema de notificaciones */}
      <div className="notifications-container">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`notification notification-${notification.type}`}
            onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
          >
            <div className="notification-content">
              <span className="notification-message">{notification.message}</span>
              <button className="notification-close">×</button>
            </div>
          </div>
        ))}
      </div>

      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 3V7C14 7.26522 14.1054 7.51957 14.2929 7.70711C14.4804 7.89464 14.7348 8 15 8H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H14L19 8V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M9 13H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M9 17H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="logo-text">
                <h1>Markdown Converter</h1>
                <p className="tagline">Transforma texto plano en Markdown profesional</p>
              </div>
            </div>
            <div className="header-actions">
              <div className="stats-badge">
                <span className="stats-icon">📊</span>
                <span className="stats-count">{stats.chars} chars</span>
              </div>
              <button
                className="theme-toggle"
                onClick={() => setIsDarkMode(!isDarkMode)}
                title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                aria-label={isDarkMode ? "Modo claro" : "Modo oscuro"}
              >
                <div className="theme-switch">
                  <div className={`theme-icon ${isDarkMode ? 'sun' : 'moon'}`}>
                    {isDarkMode ? (
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 1V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M12 21V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M4.22 4.22L5.64 5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M18.36 18.36L19.78 19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M1 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M21 12H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M4.22 19.78L5.64 18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 12.79C20.8427 14.4922 20.2039 16.1144 19.1582 17.4668C18.1125 18.8192 16.7035 19.8458 15.0957 20.4265C13.4879 21.0073 11.7479 21.1181 10.0795 20.7461C8.41108 20.3741 6.88299 19.5345 5.67422 18.3258C4.46545 17.117 3.62594 15.5889 3.2539 13.9205C2.88186 12.2521 2.99274 10.5121 3.57348 8.9043C4.15423 7.29651 5.18085 5.88752 6.53323 4.84183C7.88561 3.79614 9.50779 3.15731 11.21 3C10.2134 4.34827 9.73385 6.00945 9.85853 7.68141C9.98322 9.35338 10.7039 10.9251 11.8894 12.1106C13.0749 13.2961 14.6466 14.0168 16.3186 14.1415C17.9906 14.2662 19.6517 13.7866 21 12.79Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="theme-label">{isDarkMode ? "Claro" : "Oscuro"}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="app-layout">
            {/* Columna izquierda - Editor */}
            <div className="editor-column">
              <div className="editor-section">
                <div className="section-header">
                  <div className="section-title">
                    <div className="title-icon">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 19H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M12 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M12 5H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M5 19L5 19.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M5 12L5 12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M5 5L5 5.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="title-content">
                      <h2>Editor de Texto</h2>
                      <p className="section-subtitle">Escribe tu texto común aquí</p>
                    </div>
                  </div>
                  <div className="stats-display">
                    <div className="stat-item">
                      <span className="stat-label">Caracteres</span>
                      <span className="stat-value">{stats.chars}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Palabras</span>
                      <span className="stat-value">{stats.words}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Líneas</span>
                      <span className="stat-value">{stats.lines}</span>
                    </div>
                  </div>
                </div>

                <div className="format-toolbar">
                  <div className="toolbar-container">
                    {/* Grupo 1: Títulos */}
                    <div className="toolbar-group">
                      <button
                        className="format-btn"
                        onClick={() => formatText("h1")}
                        title="Título H1"
                        aria-label="Título H1"
                      >
                        <span className="format-icon">H1</span>
                      </button>
                      <button
                        className="format-btn"
                        onClick={() => formatText("h2")}
                        title="Título H2"
                        aria-label="Título H2"
                      >
                        <span className="format-icon">H2</span>
                      </button>
                    </div>
                    
                    {/* Grupo 2: Énfasis de texto */}
                    <div className="toolbar-group">
                      <button
                        className="format-btn"
                        onClick={() => formatText("bold")}
                        title="Negrita"
                        aria-label="Negrita"
                      >
                        <span className="format-icon">B</span>
                      </button>
                      <button
                        className="format-btn"
                        onClick={() => formatText("italic")}
                        title="Cursiva"
                        aria-label="Cursiva"
                      >
                        <span className="format-icon">I</span>
                      </button>
                    </div>
                    
                    {/* Grupo 3: Listas */}
                    <div className="toolbar-group">
                      <button
                        className="format-btn"
                        onClick={() => formatText("list")}
                        title="Lista"
                        aria-label="Lista"
                      >
                        <span className="format-icon">•</span>
                      </button>
                    </div>
                    
                    {/* Grupo 4: Código */}
                    <div className="toolbar-group">
                      <button
                        className="format-btn"
                        onClick={() => formatText("code")}
                        title="Código"
                        aria-label="Código"
                      >
                        <span className="format-icon">&lt;/&gt;</span>
                      </button>
                      <button
                        className="format-btn"
                        onClick={() => formatText("codeBlock")}
                        title="Bloque"
                        aria-label="Bloque"
                      >
                        <span className="format-icon">```</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Grupo 5: Acciones */}
                  <div className="toolbar-actions">
                    <button
                      className="format-btn danger"
                      onClick={clearEditor}
                      title="Borrar todo"
                      aria-label="Borrar todo"
                    >
                      <span className="format-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </button>
                    <button
                      className="format-btn primary"
                      onClick={handleCopy}
                      disabled={!convertedText.trim()}
                      title="Copiar texto"
                      aria-label="Copiar texto"
                    >
                      <span className="format-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </span>
                    </button>
                  </div>
                </div>

                <div className="editor-wrapper">
                  <textarea
                    id="markdown-editor"
                    ref={editorRef}
                    className="editor"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Escribe tu texto común aquí...

Ejemplos que se convierten automáticamente:

• Títulos cortos → # Título
• Listas con guiones → - Item de lista
• URLs → [https://...](https://...)
• Texto **entre asteriscos** → **negrita**
• Código indentado → ```bloque de código```
• Texto *entre asteriscos simples* → *cursiva*"
                    spellCheck="true"
                    autoFocus
                  />
                  <div className="editor-hint">
                    <span className="hint-icon">💡</span>
                    <span className="hint-text">La conversión se realiza automáticamente mientras escribes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha - Preview */}
            <div className="preview-column">
              <div className="preview-section">
                <div className="section-header">
                  <div className="section-title">
                    <div className="title-icon">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div className="title-content">
                      <h2>Vista Previa</h2>
                      <p className="section-subtitle">Estilo GitHub exacto</p>
                    </div>
                  </div>
                  <div className="preview-status">
                    <div className={`status-indicator ${isConverting ? 'converting' : 'active'}`}></div>
                    <span className="status-text">
                      {isConverting ? 'Convirtiendo...' : 'Conversión activa'}
                    </span>
                  </div>
                </div>

                <div className="preview-wrapper" ref={previewRef}>
                  {convertedText ? (
                    <div className="markdown-preview">
                      <div className="preview-header">
                        <div className="github-badge">
                          <span className="github-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2C10.6868 2 9.38642 2.25866 8.17317 2.7612C6.95991 3.26375 5.85752 4.00035 4.92893 4.92893C3.05357 6.8043 2 9.34784 2 12C2 16.42 4.87 20.17 8.84 21.5C9.34 21.58 9.5 21.27 9.5 21V19.31C6.73 19.91 6.14 17.97 6.14 17.97C5.68 16.81 5.03 16.5 5.03 16.5C4.12 15.88 5.1 15.9 5.1 15.9C6.1 15.97 6.63 16.93 6.63 16.93C7.5 18.45 8.97 18 9.54 17.76C9.63 17.11 9.89 16.67 10.17 16.42C7.95 16.17 5.62 15.31 5.62 11.5C5.62 10.39 6 9.5 6.65 8.79C6.55 8.54 6.2 7.5 6.75 6.15C6.75 6.15 7.59 5.88 9.5 7.17C10.29 6.95 11.15 6.84 12 6.84C12.85 6.84 13.71 6.95 14.5 7.17C16.41 5.88 17.25 6.15 17.25 6.15C17.8 7.5 17.45 8.54 17.35 8.79C18 9.5 18.38 10.39 18.38 11.5C18.38 15.32 16.04 16.16 13.81 16.41C14.17 16.72 14.5 17.33 14.5 18.26V21C14.5 21.27 14.66 21.59 15.17 21.5C19.14 20.16 22 16.42 22 12C22 10.6868 21.7413 9.38642 21.2388 8.17317C20.7362 6.95991 19.9997 5.85752 19.0711 4.92893C18.1425 4.00035 17.0401 3.26375 15.8268 2.7612C14.6136 2.25866 13.3132 2 12 2Z" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          </span>
                          <span className="github-text">GitHub Preview</span>
                        </div>
                      </div>
                      <div className="preview-content">
                        <pre className="converted-text">{convertedText}</pre>
                      </div>
                    </div>
                  ) : (
                    <div className="welcome-screen">
                      <div className="welcome-content">
                        <div className="welcome-icon-container">
                          <div className="welcome-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                        <h3 className="welcome-title">¡Comienza a convertir!</h3>
                        <p className="welcome-subtitle">
                          Escribe texto en el editor izquierdo y observa la magia de la conversión automática
                        </p>

                        <div className="features-grid">
                          <div className="feature-card">
                            <div className="feature-icon">⚡</div>
                            <div className="feature-content">
                              <h4>Conversión en Tiempo Real</h4>
                              <p>Observa los cambios instantáneamente mientras escribes</p>
                            </div>
                          </div>
                          <div className="feature-card">
                            <div className="feature-icon">🎯</div>
                            <div className="feature-content">
                              <h4>Detección Inteligente</h4>
                              <p>Identifica automáticamente títulos, listas, código y más</p>
                            </div>
                          </div>
                          <div className="feature-card">
                            <div className="feature-icon">📋</div>
                            <div className="feature-content">
                              <h4>Copiado Fácil</h4>
                              <p>Un clic para copiar el Markdown resultante</p>
                            </div>
                          </div>
                          <div className="feature-card">
                            <div className="feature-icon">🎨</div>
                            <div className="feature-content">
                              <h4>Interfaz Moderna</h4>
                              <p>Diseño limpio con modo claro/oscuro</p>
                            </div>
                          </div>
                        </div>

                        <div className="quick-start">
                          <h4>Comienza rápidamente:</h4>
                          <div className="quick-steps">
                            <div className="step">
                              <span className="step-number">1</span>
                              <span className="step-text">Escribe texto común en el editor</span>
                            </div>
                            <div className="step">
                              <span className="step-number">2</span>
                              <span className="step-text">Usa los botones para formatear</span>
                            </div>
                            <div className="step">
                              <span className="step-number">3</span>
                              <span className="step-text">Copia el Markdown resultante</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-info">
              <span className="footer-icon">★</span>
              <span className="footer-text">
                <strong>Markdown Converter</strong> · {stats.words} palabras · {isDarkMode ? "🌙 Modo oscuro" : "☀️ Modo claro"}
              </span>
            </div>
            <div className="footer-actions">
              <button
                className="footer-btn"
                onClick={clearEditor}
                title="Limpiar"
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                  <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Limpiar
              </button>
              <button
                className="footer-btn primary"
                onClick={handleCopy}
                disabled={!convertedText.trim()}
                title="Copiar"
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
                  <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Copiar
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;