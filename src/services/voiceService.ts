/**
 * Voice Service - Enhanced for Streaming TTS
 * Handles audio recording, transcription, and real-time text-to-speech
 */

import { transcribeAudio, textToSpeech } from "./openclawApi";

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let audioStream: MediaStream | null = null;

/**
 * Start recording audio from the microphone
 */
export async function startRecording(): Promise<void> {
  try {
    // Request microphone access
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Create MediaRecorder with webm/opus format
    const options: MediaRecorderOptions = {
      mimeType: 'audio/webm;codecs=opus'
    };
    
    // Fallback if webm/opus not supported
    if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
      options.mimeType = 'audio/webm';
    }
    
    mediaRecorder = new MediaRecorder(audioStream, options);
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    
    mediaRecorder.start();
  } catch (error) {
    console.error("Failed to start recording:", error);
    if (error instanceof Error && error.name === "NotAllowedError") {
      throw new Error("Microphone permission denied. Please allow microphone access.");
    }
    throw new Error("Failed to start recording: " + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Stop recording and return the audio blob
 */
export async function stopRecording(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) {
      reject(new Error("No active recording"));
      return;
    }
    
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      
      // Clean up
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        audioStream = null;
      }
      mediaRecorder = null;
      audioChunks = [];
      
      resolve(audioBlob);
    };
    
    mediaRecorder.onerror = (error) => {
      reject(new Error("Recording failed: " + error));
    };
    
    mediaRecorder.stop();
  });
}

/**
 * Check if currently recording
 */
export function isRecording(): boolean {
  return mediaRecorder !== null && mediaRecorder.state === "recording";
}

/**
 * Transcribe audio blob using Whisper API
 */
export async function transcribe(audioBlob: Blob): Promise<string> {
  return await transcribeAudio(audioBlob);
}

/**
 * Convert text to speech and auto-play
 * Returns the audio element for control
 */
export async function speak(text: string): Promise<HTMLAudioElement> {
  const audioBlob = await textToSpeech(text);
  const audioUrl = URL.createObjectURL(audioBlob);
  
  const audio = new Audio(audioUrl);
  audio.play();
  
  // Clean up URL after playback
  audio.onended = () => {
    URL.revokeObjectURL(audioUrl);
  };
  
  return audio;
}

/**
 * Sentence buffer for streaming TTS
 * Accumulates text and yields complete sentences in real-time
 */
export class SentenceBuffer {
  private buffer = "";
  
  /**
   * Add text to the buffer and extract complete sentences
   * Returns an array of complete sentences found
   */
  add(text: string): string[] {
    this.buffer += text;
    const sentences: string[] = [];
    
    // Match complete sentences ending with . ! ? followed by space or end
    // This regex captures sentences including their punctuation
    const sentenceRegex = /[^.!?]+[.!?]+(?=\s|$)/g;
    let match;
    let lastIndex = 0;
    
    while ((match = sentenceRegex.exec(this.buffer)) !== null) {
      const sentence = match[0].trim();
      if (sentence.length > 10) { // Minimum sentence length to avoid fragments
        sentences.push(sentence);
        lastIndex = sentenceRegex.lastIndex;
      }
    }
    
    // Remove extracted sentences from buffer
    if (lastIndex > 0) {
      this.buffer = this.buffer.slice(lastIndex).trimStart();
    }
    
    return sentences;
  }
  
  /**
   * Flush remaining buffer as a sentence (for end of stream)
   */
  flush(): string | null {
    const remaining = this.buffer.trim();
    this.buffer = "";
    return remaining.length > 10 ? remaining : null;
  }
  
  /**
   * Clear the buffer
   */
  clear(): void {
    this.buffer = "";
  }
}

/**
 * Streaming TTS Player - Plays sentences as they arrive
 * Minimizes latency by starting playback before the full response is done
 */
export class StreamingTTSPlayer {
  private queue: string[] = [];
  private isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;
  private onCompleteCallback: (() => void) | null = null;
  private onStartCallback: (() => void) | null = null;
  private isStopped = false;
  
  /**
   * Add a sentence to the TTS queue
   * Will start playing immediately if not already playing
   */
  async addSentence(sentence: string): Promise<void> {
    if (this.isStopped) return;
    
    this.queue.push(sentence);
    
    // Start playing if not already playing
    if (!this.isPlaying) {
      await this.playNext();
    }
  }
  
  /**
   * Play the next sentence in the queue
   */
  private async playNext(): Promise<void> {
    if (this.isStopped) {
      this.isPlaying = false;
      return;
    }
    
    if (this.queue.length === 0) {
      this.isPlaying = false;
      if (this.onCompleteCallback) {
        this.onCompleteCallback();
      }
      return;
    }
    
    this.isPlaying = true;
    
    // Notify that we're starting to speak
    if (this.onStartCallback && this.queue.length > 0) {
      this.onStartCallback();
    }
    
    const sentence = this.queue.shift()!;
    
    try {
      const audioBlob = await textToSpeech(sentence);
      
      if (this.isStopped) {
        this.isPlaying = false;
        return;
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      this.currentAudio = new Audio(audioUrl);
      
      this.currentAudio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        this.playNext(); // Continue with next sentence
      };
      
      this.currentAudio.onerror = (e) => {
        console.error("TTS playback error:", e);
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        this.playNext(); // Continue despite error
      };
      
      await this.currentAudio.play();
    } catch (error) {
      console.error("TTS generation error:", error);
      // Continue with next sentence even if this one failed
      this.playNext();
    }
  }
  
  /**
   * Stop current playback and clear queue
   */
  stop(): void {
    this.isStopped = true;
    
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    
    this.queue = [];
    this.isPlaying = false;
  }
  
  /**
   * Resume playback (after being stopped)
   */
  resume(): void {
    this.isStopped = false;
  }
  
  /**
   * Set callback for when entire queue is complete
   */
  onComplete(callback: () => void): void {
    this.onCompleteCallback = callback;
  }
  
  /**
   * Set callback for when playback starts
   */
  onStart(callback: () => void): void {
    this.onStartCallback = callback;
  }
  
  /**
   * Check if currently playing
   */
  get playing(): boolean {
    return this.isPlaying;
  }
  
  /**
   * Get remaining queue length
   */
  get queueLength(): number {
    return this.queue.length;
  }
}

/**
 * Audio visualizer for recording and playback
 * Returns cleanup function
 */
export function createAudioVisualizer(
  canvas: HTMLCanvasElement,
  stream?: MediaStream,
  audio?: HTMLAudioElement
): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  
  let source: MediaStreamAudioSourceNode | MediaElementAudioSourceNode;
  
  if (stream) {
    source = audioContext.createMediaStreamSource(stream);
  } else if (audio) {
    source = audioContext.createMediaElementSource(audio);
  } else {
    return () => {};
  }
  
  source.connect(analyser);
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  let animationId: number;
  
  function draw() {
    animationId = requestAnimationFrame(draw);
    
    analyser.getByteFrequencyData(dataArray);
    
    ctx.fillStyle = "rgb(10, 10, 10)"; // Match background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
      
      // Sol orange gradient
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
      gradient.addColorStop(0, "#F97316");
      gradient.addColorStop(1, "#FFA500");
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      
      x += barWidth + 1;
    }
  }
  
  draw();
  
  // Cleanup function
  return () => {
    cancelAnimationFrame(animationId);
    source.disconnect();
    audioContext.close();
  };
}
