// Audio and Soundbox voice synthesizer for Indian merchant experience

export const playPaymentChime = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const now = audioCtx.currentTime;
    
    // Two-tone payment notification chime (E5 -> G#5 -> B5)
    const tones = [659.25, 830.61, 987.77];
    tones.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      
      gain.gain.setValueAtTime(0, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.4);
    });
  } catch {
    // AudioContext may be restricted before user interaction
  }
};

export const announceSoundbox = (
  amount: number,
  language: 'hi' | 'en' = 'en',
  storeName?: string,
  volume: number = 1
) => {
  if (typeof window === 'undefined') return;

  playPaymentChime();

  if (!('speechSynthesis' in window) || volume <= 0) return;

  setTimeout(() => {
    try {
      window.speechSynthesis.cancel();
      let text = '';
      if (language === 'hi') {
        text = storeName
          ? `${storeName} पर ${amount} रुपये प्राप्त हुए`
          : `${amount} रुपये प्राप्त हुए`;
      } else {
        text = storeName
          ? `Payment of ${amount} rupees received on ${storeName}`
          : `Payment of ${amount} rupees received`;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      utterance.volume = Math.min(1, Math.max(0, volume));

      if (language === 'hi') {
        utterance.lang = 'hi-IN';
      } else {
        utterance.lang = 'en-IN';
      }

      // Try to select an Indian English or Hindi voice if available
      const voices = window.speechSynthesis.getVoices();
      const matchVoice = voices.find(
        (v) =>
          (language === 'hi' && (v.lang.includes('hi') || v.lang.includes('Hindi'))) ||
          v.lang.includes('IN') ||
          v.name.toLowerCase().includes('india')
      );
      if (matchVoice) {
        utterance.voice = matchVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // speech fallback
    }
  }, 450);
};
