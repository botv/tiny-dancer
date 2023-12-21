export default class Metronome {
  audioContext: AudioContext | null;
  isRunning: boolean;
  tempo: number;
  muted: boolean;
  nextTickTime: number;
  scheduled: { callback: () => void; repeat: boolean }[];
  scheduleInterval: NodeJS.Timeout | null;

  constructor(tempo: number, muted: boolean = true) {
    this.audioContext = null;
    this.isRunning = false;
    this.tempo = tempo;
    this.muted = muted;
    this.nextTickTime = 0;
    this.scheduled = [];
    this.scheduleInterval = null;
  }

  start() {
    if (this.isRunning) {
      this.stop();
    }

    this.isRunning = true;
    this.audioContext = new AudioContext();
    this.nextTickTime = this.audioContext.currentTime;
    this.scheduleInterval = setInterval(() => this.scheduleTick(), 25);
  }

  stop() {
    if (this.scheduleInterval) {
      clearInterval(this.scheduleInterval);
    }
    this.isRunning = false;
    this.audioContext = null;
  }

  setTempo(tempo: number) {
    this.tempo = tempo;
  }

  schedule(callback: () => void, repeat: boolean = false) {
    this.scheduled.push({ callback, repeat });
  }

  scheduleTick() {
    if (!this.audioContext) {
      return;
    }

    while (this.nextTickTime < this.audioContext.currentTime + 0.1) {
      void Promise.all(this.scheduled.map((s) => s.callback()));
      this.scheduled = this.scheduled.filter((s) => s.repeat);

      if (!this.muted) {
        const oscillator = this.audioContext.createOscillator();
        const envelope = this.audioContext.createGain();

        oscillator.frequency.value = 1000;
        envelope.gain.value = 1;
        envelope.gain.exponentialRampToValueAtTime(
          1,
          this.nextTickTime + 0.001,
        );
        envelope.gain.exponentialRampToValueAtTime(
          0.001,
          this.nextTickTime + 0.02,
        );

        oscillator.connect(envelope);
        envelope.connect(this.audioContext.destination);

        oscillator.start(this.nextTickTime);
        oscillator.stop(this.nextTickTime + 0.1); // Duration of the tick sound
      }

      this.nextTickTime += 60.0 / this.tempo;
    }
  }
}
