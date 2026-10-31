/**
 * PCM Audio utilities for Gemini Live API (gemini-3.8-live)
 * - Mic capture at 16kHz PCM (input)
 * - Gapless scheduled playback at 24kHz PCM (output)
 */

export class LiveAudioPlayer {
  private audioCtx: AudioContext | null = null;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  public isPlaying: boolean = false;
  public onVolumeUpdate?: (volume: number) => void;

  constructor() {
    // Lazy initialized on first user interaction or connect
  }

  private initContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx({ sampleRate: 24000 });
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Queue and seamlessly schedule raw 24kHz 16-bit PCM chunk from Gemini Live
   */
  queueAudioChunk(base64Pcm: string) {
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const binary = atob(base64Pcm);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // Convert 16-bit signed PCM to Float32 [-1.0, 1.0]
      const int16Array = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
      const float32Array = new Float32Array(int16Array.length);

      let sumSquare = 0;
      for (let i = 0; i < int16Array.length; i++) {
        const val = int16Array[i] / 32768.0;
        float32Array[i] = val;
        sumSquare += val * val;
      }

      // Approximate volume for visualizer
      const rms = Math.sqrt(sumSquare / int16Array.length);
      if (this.onVolumeUpdate) {
        this.onVolumeUpdate(Math.min(1.0, rms * 4.5));
      }

      const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      // Start immediately if fallen behind, otherwise schedule back-to-back
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.02;
      }

      source.start(this.nextStartTime);
      this.isPlaying = true;
      this.activeSources.push(source);

      const chunkDuration = audioBuffer.duration;
      this.nextStartTime += chunkDuration;

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }
        if (this.activeSources.length === 0) {
          this.isPlaying = false;
          if (this.onVolumeUpdate) this.onVolumeUpdate(0);
        }
      };
    } catch (err) {
      console.error('Error queuing Live PCM audio:', err);
    }
  }

  /**
   * Stop all audio immediately on model interruption
   */
  interrupt() {
    for (const src of this.activeSources) {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // Source may already have stopped
      }
    }
    this.activeSources = [];
    if (this.audioCtx) {
      this.nextStartTime = this.audioCtx.currentTime;
    }
    this.isPlaying = false;
    if (this.onVolumeUpdate) this.onVolumeUpdate(0);
  }

  close() {
    this.interrupt();
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}

export class LiveMicRecorder {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private isRecording: boolean = false;
  public onVolume?: (vol: number) => void;

  async start(onAudioChunk: (base64Pcm: string) => void) {
    if (this.isRecording) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    this.mediaStream = stream;

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioCtx({ sampleRate: 16000 });

    const source = this.audioCtx.createMediaStreamSource(stream);
    // 4096 buffer size gives ~250ms chunks at 16kHz
    const processor = this.audioCtx.createScriptProcessor(4096, 1, 1);
    this.processor = processor;

    source.connect(processor);
    processor.connect(this.audioCtx.destination);

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const l = inputData.length;

      let sumSquare = 0;
      // Convert Float32 to Int16 PCM little endian
      const pcm16 = new Int16Array(l);
      for (let i = 0; i < l; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        sumSquare += s * s;
      }

      const rms = Math.sqrt(sumSquare / l);
      if (this.onVolume) {
        this.onVolume(Math.min(1.0, rms * 5.0));
      }

      // Convert uint8 buffer to base64
      const uint8 = new Uint8Array(pcm16.buffer);
      let binary = '';
      const len = uint8.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      const base64 = btoa(binary);
      onAudioChunk(base64);
    };

    this.isRecording = true;
  }

  stop() {
    this.isRecording = false;
    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
      this.processor = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    if (this.onVolume) this.onVolume(0);
  }
}
