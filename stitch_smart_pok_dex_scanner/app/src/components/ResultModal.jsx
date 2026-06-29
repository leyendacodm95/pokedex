import React, { useState } from 'react';

const typeTranslations = {
  fire: 'FUEGO',
  water: 'AGUA',
  grass: 'PLANTA',
  electric: 'ELÉCTRICO',
  ice: 'HIELO',
  fighting: 'LUCHA',
  poison: 'VENENO',
  ground: 'TIERRA',
  flying: 'VOLADOR',
  psychic: 'PSÍQUICO',
  bug: 'BICHO',
  rock: 'ROCA',
  ghost: 'FANTASMA',
  dragon: 'DRAGÓN',
  dark: 'SINIESTRO',
  steel: 'ACERO',
  fairy: 'HADA',
  normal: 'NORMAL'
};

function ResultModal({ pokemon, onClose, onSave, showSave = true, language = 'es' }) {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const ttsSpokenRef = React.useRef(false);

  const fallbackToLocalTTS = React.useCallback((textToSpeak) => {
    // A. Respaldo: Interfaz nativa de Android
    if (window.NativeTTS) {
      try {
        window.NativeTTS.speak(textToSpeak, language);
        return;
      } catch (err) {
        console.error("Native TTS Error:", err);
      }
    }

    // B. Respaldo: Síntesis de voz estándar del navegador
    if (!window.speechSynthesis) return;
    try {
      const voices = window.speechSynthesis.getVoices();
      window.speechSynthesis.cancel();
      const speech = new SpeechSynthesisUtterance();
      
      let selectedVoice = null;
      const isEn = language === 'en';
      const langPrefix = isEn ? 'en' : 'es';
      
      // Cues for female voices
      const femaleCues = isEn 
        ? ['female', 'zira', 'samantha', 'siri', 'karen', 'moira', 'tessa', 'veena', 'hazel', 'susan', 'en-us-x-sfg', 'google', 'a']
        : ['female', 'mujer', 'femenino', 'ana', 'eed', 'sfy', 'paulina', 'mónica', 'monica', 'luciana', 'sara', 'marisol', 'soledad', 'zoraida', 'helena', 'sabina', 'yolanda', 'samantha', 'sabrina'];

      // 1. Try to find a female voice for target language
      selectedVoice = voices.find(v => {
        const vLang = (v.lang || '').toLowerCase();
        if (!vLang.startsWith(langPrefix)) return false;
        if (!isEn && vLang.includes('es-es')) return false; // Prefer latam Spanish
        
        const nameLower = (v.name || '').toLowerCase();
        return femaleCues.some(cue => nameLower.includes(cue));
      });

      // 2. Try to find any female voice for target language including Spain if Spanish
      if (!selectedVoice && !isEn) {
        selectedVoice = voices.find(v => {
          const vLang = (v.lang || '').toLowerCase();
          if (!vLang.startsWith('es')) return false;
          const nameLower = (v.name || '').toLowerCase();
          return femaleCues.some(cue => nameLower.includes(cue));
        });
      }

      // 3. Try to find any voice for target language (non-Spain if Spanish)
      if (!selectedVoice) {
        selectedVoice = voices.find(v => {
          const vLang = (v.lang || '').toLowerCase();
          if (isEn) {
            return vLang.startsWith('en');
          } else {
            return vLang.startsWith('es') && !vLang.includes('es-es');
          }
        });
      }

      // 4. Try to find any voice for target language
      if (!selectedVoice) {
        selectedVoice = voices.find(v => {
          const vLang = (v.lang || '').toLowerCase();
          return vLang.startsWith(langPrefix);
        });
      }

      if (selectedVoice) {
        speech.voice = selectedVoice;
        speech.lang = selectedVoice.lang;
      } else {
        speech.lang = isEn ? 'en-US' : 'es-MX';
      }
      
      speech.pitch = 1.15; // Tono más agudo para que suene femenino
      speech.rate = 0.95;  // Velocidad moderada
      speech.text = textToSpeak;
      
      window.speechSynthesis.speak(speech);
    } catch (err) {
      console.error("Web TTS Error:", err);
    }
  }, [language]);

  const speak = React.useCallback(() => {
    const isEn = language === 'en';
    let textToSpeak = '';
    
    if (isEn) {
      const typeNamesEn = pokemon.types && Array.isArray(pokemon.types)
        ? pokemon.types.map(t => typeof t === 'string' ? t.toLowerCase() : '').join(' and ')
        : '';
      textToSpeak = `${pokemon.name || 'Unknown Pokémon'}. ${typeNamesEn}-type Pokémon. It has ${pokemon.stats?.hp || 0} health points, ${pokemon.stats?.atk || 0} attack and ${pokemon.stats?.def || 0} defense.`;
    } else {
      const typeNames = pokemon.types && Array.isArray(pokemon.types) 
        ? pokemon.types.map(t => typeTranslations[t] || (typeof t === 'string' ? t.toUpperCase() : '')).join(' y ').toLowerCase()
        : '';
      textToSpeak = `${pokemon.name || 'Pokémon desconocido'}. Pokémon de tipo ${typeNames}. Tiene ${pokemon.stats?.hp || 0} puntos de vida, ${pokemon.stats?.atk || 0} de ataque y ${pokemon.stats?.def || 0} de defensa.`;
    }

    ttsSpokenRef.current = true;

    // 1. Intentar usar la API Online de Google Translate (Voz femenina latina de excelente calidad por defecto)
    try {
      if (window.currentAudio) {
        window.currentAudio.pause();
      }
      const ttsLang = isEn ? 'en-us' : 'es-mx';
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${ttsLang}&client=tw-ob&q=${encodeURIComponent(textToSpeak)}`;
      const audio = new Audio(url);
      window.currentAudio = audio;
      
      audio.play()
        .then(() => {
          console.log(`Voz femenina ${isEn ? 'inglesa' : 'latina'} online reproducida con éxito`);
        })
        .catch((playErr) => {
          console.warn("Voz online bloqueada o falló, usando respaldo local:", playErr);
          fallbackToLocalTTS(textToSpeak);
        });
      return;
    } catch (err) {
      console.warn("Error al inicializar audio online, usando respaldo local:", err);
      fallbackToLocalTTS(textToSpeak);
    }
  }, [pokemon, language, fallbackToLocalTTS]);

  React.useEffect(() => {
    ttsSpokenRef.current = false;
    
    // Hablar inmediatamente al montar el modal
    speak();

    // Soportar carga tardía de voces del navegador si no es en Android
    if (!window.NativeTTS && window.speechSynthesis) {
      try {
        window.speechSynthesis.onvoiceschanged = () => {
          if (!ttsSpokenRef.current) {
            speak();
          }
        };
      } catch (err) {
        console.error("Web TTS setup error:", err);
      }
    }

    return () => {
      try {
        if (window.currentAudio) {
          window.currentAudio.pause();
        }
        if (window.NativeTTS) {
          window.NativeTTS.stop();
        } else if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      } catch (e) {}
    };
  }, [pokemon, speak]);


  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setSaved(true);
      setTimeout(() => {
        onSave();
      }, 800);
    }, 1200);
  };

  const getStatWidth = (baseStat) => {
    // Max stats roughly 255 for HP, ATK, DEF
    return `${Math.min(100, (baseStat / 150) * 100)}%`;
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-margin-mobile bg-black/60 backdrop-blur-sm pointer-events-auto">
      {/* Result Card Modal */}
      <div className="glass-modal w-full max-w-md rounded-3xl overflow-hidden flex flex-col items-center animate-in fade-in zoom-in duration-300">
        
        {/* Image Container */}
        <div className="relative w-full aspect-square p-6 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary-container/10 to-transparent"></div>
          
          <div className="relative w-[300px] h-[300px] rounded-2xl overflow-hidden bg-white/5 border border-white/10 holographic-glow">
            <img 
              src={pokemon.image}
              alt={pokemon.name} 
              className="w-full h-full object-contain p-4 drop-shadow-[0_0_20px_rgba(255,85,64,0.4)]" 
            />
            
            {/* Scanner Bracket Details inside card image */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-secondary-container/50"></div>
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-secondary-container/50"></div>
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-secondary-container/50"></div>
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-secondary-container/50"></div>
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full px-8 pb-10 flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
            <h2 className="font-headline-lg text-headline-lg text-secondary capitalize">{pokemon.name}</h2>
            <button 
              onClick={() => {
                ttsSpokenRef.current = false;
                speak();
              }}
              className="p-1 text-secondary hover:bg-white/10 rounded-full active:scale-90 transition-all flex items-center justify-center"
              title={language === 'en' ? "Listen to description" : "Escuchar descripción"}
            >
              <span className="material-symbols-outlined text-[22px]">volume_up</span>
            </button>
            <span className="font-data-num text-data-num text-tertiary-container ml-1">#{String(pokemon.id).padStart(3, '0')}</span>
          </div>
          
          {/* Badge */}
          <div className="mb-stack-md flex gap-2 flex-wrap justify-center">
            {pokemon.types.map((type, idx) => (
              <span key={idx} className="inline-block px-4 py-1.5 rounded-full bg-primary-container text-white font-label-caps text-label-caps tracking-widest shadow-lg">
                {language === 'en' ? type.toUpperCase() : (typeTranslations[type] || type.toUpperCase())}
              </span>
            ))}
          </div>

          {/* Stats Preview (Holographic style) */}
          <div className="w-full grid grid-cols-3 gap-4 mb-stack-lg">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-label-caps text-on-surface-variant/60 mb-1">{language === 'en' ? 'HP' : 'PS'}</span>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-secondary-container holographic-glow" style={{width: getStatWidth(pokemon.stats.hp)}}></div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-label-caps text-on-surface-variant/60 mb-1">{language === 'en' ? 'ATK' : 'ATQ'}</span>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-secondary-container holographic-glow" style={{width: getStatWidth(pokemon.stats.atk)}}></div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-label-caps text-on-surface-variant/60 mb-1">DEF</span>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-secondary-container holographic-glow" style={{width: getStatWidth(pokemon.stats.def)}}></div>
              </div>
            </div>
          </div>

          {/* Primary Action */}
          {showSave ? (
            <button 
              onClick={handleSave}
              disabled={isSaving || saved}
              className={`w-full py-5 rounded-2xl ${saved ? 'bg-green-500' : 'bg-secondary-container'} text-on-secondary-fixed font-headline-md text-headline-md font-bold flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,251,251,0.3)] transition-all hover:brightness-110 active:scale-95 duration-200`}
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span> {language === 'en' ? 'Registering...' : 'Registrando...'}
                </>
              ) : saved ? (
                <>
                  <span className="material-symbols-outlined">check_circle</span> {language === 'en' ? 'Registered!' : '¡Registrado!'}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
                  {language === 'en' ? 'Save to my Pokédex' : 'Guardar en mi Pokédex'}
                </>
              )}
            </button>
          ) : (
            <button 
              onClick={onClose}
              className="w-full py-5 rounded-2xl bg-secondary-container text-on-secondary-fixed font-headline-md text-headline-md font-bold flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,251,251,0.3)] transition-all hover:brightness-110 active:scale-95 duration-200"
            >
              {language === 'en' ? 'Close Details' : 'Cerrar Detalles'}
            </button>
          )}
          
          {/* Secondary Action */}
          {showSave && (
            <button 
              onClick={onClose}
              className="mt-4 text-on-surface-variant font-label-caps text-label-caps hover:text-white transition-colors"
            >
              {language === 'en' ? 'DISCARD SCAN' : 'DESCARTAR ESCANEO'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResultModal;
