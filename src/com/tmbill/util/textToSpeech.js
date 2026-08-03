window.playPaymentSound = (text) => {
  let speech = new SpeechSynthesisUtterance();
  speech.lang = 'en';

  window.speechSynthesis.onvoiceschanged = () => {
    voices = window.speechSynthesis.getVoices();
    speech.voice = voices[1];
  };

  speech.rate = 0.6;
  speech.volume = 1;
  speech.pitch = 1;

  speech.text = text;

  window.speechSynthesis.speak(speech);
};

const hello = 'abc';
module.exports = {
  playPaymentSound,
  hello,
};
