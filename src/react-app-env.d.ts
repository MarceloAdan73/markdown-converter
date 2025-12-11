/// <reference types="react-scripts" />

// Extender la interfaz Window para PWA
interface Window {
  deferredPrompt?: any;
}

// Para módulos CSS
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Para módulos de imágenes
declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}
