export class TTSSpeechService {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;

  public static speak(text: string, onEnd?: () => void): boolean {
    if (!this.synth) return false;
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
    return true;
  }

  public static stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public static pause(): void {
    if (this.synth) {
      this.synth.pause();
    }
  }

  public static resume(): void {
    if (this.synth) {
      this.synth.resume();
    }
  }

  public static isSpeaking(): boolean {
    return !!this.synth && this.synth.speaking;
  }
}
