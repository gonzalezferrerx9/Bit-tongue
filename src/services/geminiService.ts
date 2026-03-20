// —-----------------------------------------------------------
// – IMPORTACIONES / IMPORTS
// —---------------------------------------------------------
import { DubbingState } from "../types";

// —-----------------------------------------------------------
// – CLASE DE SERVICIO PRINCIPAL / MAIN SERVICE CLASS
// —---------------------------------------------------------
export class GeminiDubbingService {
  // —-----------------------------------------------------------
  // – PROPIEDADES DE ESTADO / STATE PROPERTIES
  // —---------------------------------------------------------
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private stream: MediaStream | null = null;
  private processor: AudioWorkletNode | null = null;
  private volume = 1.0;
  private targetLanguage = "EN-US";
  private onStateChange: (state: DubbingState) => void;
  private onError: (error: string) => void;
  private isClosing = false;
  private textBuffer = "";

  // —-----------------------------------------------------------
  // – CONSTRUCTOR / CONSTRUCTOR
  // —---------------------------------------------------------
  constructor(onStateChange: (state: DubbingState) => void, onError: (error: string) => void) {
    this.onStateChange = onStateChange;
    this.onError = onError;
  }

  // —-----------------------------------------------------------
  // – MÉTODOS PÚBLICOS DE CONFIGURACIÓN / PUBLIC CONFIG METHODS
  // —---------------------------------------------------------
  setVolume(value: number) {
    this.volume = value;
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(value, this.audioContext!.currentTime, 0.05);
    }
  }

  setLanguage(lang: string) {
    this.targetLanguage = lang;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'config', language: lang }));
    }
  }

  // —-----------------------------------------------------------
  // – MÉTODOS PÚBLICOS DE CONTROL / PUBLIC CONTROL METHODS
  // —---------------------------------------------------------
  async start() {
    try {
      this.isClosing = false;
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1, height: 1 },
        audio: { echoCancellation: true, noiseSuppression: true }
      });

      if (this.stream.getAudioTracks().length === 0) throw new Error("No hay audio.");

      const source = this.audioContext.createMediaStreamSource(this.stream);


      const workletCode = `
        class RecorderWorklet extends AudioWorkletProcessor {
          constructor() {
            super();
            this.bufferSize = 16000; 
            this.buffer = new Float32Array(this.bufferSize);
            this.offset = 0;
          }
          process(inputs) {
            const input = inputs[0];
            if (input && input.length > 0) {
              const channelData = input[0];
              for (let i = 0; i < channelData.length; i++) {
                this.buffer[this.offset++] = channelData[i];
                if (this.offset >= this.bufferSize) {
                  this.port.postMessage(this.buffer);
                  this.offset = 0;
                }
              }
            }
            return true;
          }
        }
        registerProcessor('recorder-worklet', RecorderWorklet);
      `;

      const blob = new Blob([workletCode], { type: 'application/javascript' });
      await this.audioContext.audioWorklet.addModule(URL.createObjectURL(blob));
      this.processor = new AudioWorkletNode(this.audioContext, 'recorder-worklet');

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.ws = new WebSocket(`${protocol}//${window.location.host}/api/stream`);

      this.ws.onopen = () => {
        if (this.isClosing) return;
        this.onStateChange(DubbingState.ACTIVE);
        this.ws!.send(JSON.stringify({ type: 'config', language: this.targetLanguage }));

        this.processor!.port.onmessage = (e) => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            const pcm = this.convertFloat32ToInt16(e.data);
            this.ws!.send(JSON.stringify({ type: 'audio', data: this.arrayBufferToBase64(pcm.buffer) }));
          }
        };
        source.connect(this.processor!);
      };

      this.ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'text') {
          this.handleIncomingText(msg.data);
        }
      };

      this.ws.onerror = () => this.onError("Error de servidor.");

    } catch (error: any) {
      this.onError(error.message);
      this.stop();
    }
  }

  // —-----------------------------------------------------------
  // – MANEJO DE FLUJO DE TEXTO / TEXT STREAM HANDLING
  // —---------------------------------------------------------
  private handleIncomingText(chunk: string) {
    this.textBuffer += chunk;

    if (this.textBuffer.includes('.') || this.textBuffer.includes(',') || this.textBuffer.length > 40) {
      this.speakText(this.textBuffer.trim());
      this.textBuffer = "";
    }
  }

  stop() {
    this.isClosing = true;
    this.textBuffer = "";
    window.speechSynthesis.cancel();
    if (this.processor) this.processor.disconnect();
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    if (this.audioContext) this.audioContext.close();
    if (this.ws) this.ws.close();
    this.onStateChange(DubbingState.IDLE);
  }

  // —-----------------------------------------------------------
  // – MÉTODOS PRIVADOS / PRIVATE METHODS
  // —---------------------------------------------------------
  private convertFloat32ToInt16(buffer: Float32Array) {
    let l = buffer.length;
    const buf = new Int16Array(l);
    while (l--) { buf[l] = Math.max(-1, Math.min(1, buffer[l])) * 0x7FFF; }
    return buf;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
    return window.btoa(binary);
  }

  private speakText(text: string) {
    if (!text || text.toUpperCase() === "[SILENCE]") return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.targetLanguage.toLowerCase().includes('es') ? 'es-MX' : 'en-US';
    utterance.rate = 1.2;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
  }
}