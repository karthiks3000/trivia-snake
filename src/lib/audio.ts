// Audio file paths
export const AUDIO_PATHS = {
  GAME_MUSIC: '/audio/game-level-music.wav',
  CRASH_SOUND: '/audio/player-losing.wav',
  VICTORY_SOUND: '/audio/player-correct-answer.wav',
  WRONG_ANSWER: '/audio/player-losing.wav',
  GAME_COMPLETED: '/audio/game-completed.wav'
};

class AudioManager {
  private static instance: AudioManager;
  private gameMusic: HTMLAudioElement;
  private crashSound: HTMLAudioElement;
  private correctAnswerSound: HTMLAudioElement;
  private wrongAnswerSound: HTMLAudioElement;
  private gameCompletedSound: HTMLAudioElement;


  private constructor() {
    this.gameMusic = new Audio(AUDIO_PATHS.GAME_MUSIC);
    this.crashSound = new Audio(AUDIO_PATHS.CRASH_SOUND);
    this.correctAnswerSound = new Audio(AUDIO_PATHS.VICTORY_SOUND);
    this.wrongAnswerSound = new Audio(AUDIO_PATHS.WRONG_ANSWER);
    this.gameCompletedSound = new Audio(AUDIO_PATHS.GAME_COMPLETED);

    // Configure game music to loop
    this.gameMusic.loop = true;
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public startGameMusic() {
    this.gameMusic.play().catch(error => console.error('Error playing game music:', error));
  }

  public stopGameMusic() {
    this.gameMusic.pause();
    this.gameMusic.currentTime = 0;
  }

  public playCrashSound() {
    this.crashSound.currentTime = 0;
    this.crashSound.play().catch(error => console.error('Error playing crash sound:', error));
  }

  public playCorrectAnswerSound() {
    this.correctAnswerSound.currentTime = 0;
    this.correctAnswerSound.play().catch(error => console.error('Error playing victory sound:', error));
  }

  public playWrongAnswerSound() {
    this.wrongAnswerSound.currentTime = 0;
    this.wrongAnswerSound.play().catch(error => console.error('Error playing wrong answer sound:', error));
  }

  public playGameCompletedSound() {
    this.gameCompletedSound.currentTime = 0;
    this.gameCompletedSound.play().catch(error => console.error('Error playing game completed sound:', error));
  }
}

export default AudioManager;