import React, { useState, useEffect, useRef } from 'react';
import ResultModal from './ResultModal';

function Scanner({ onSave, language, onChangeLanguage }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [model, setModel] = useState(null);
  const [labels, setLabels] = useState([]);
  const continuousScanRef = useRef(false);
  const detectionStreakRef = useRef({ name: '', count: 0 });

  useEffect(() => {
    async function loadModel() {
      try {
        console.log("loadModel: Starting loading sequence...");
        if (!window.tf) {
          throw new Error("window.tf is undefined. Check index.html CDN scripts or network connection.");
        }
        
        // Initialize TFJS core backend first
        window.tf.wasm.setWasmPaths('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@4.9.0/dist/');
        console.log("loadModel: Setting WASM backend...");
        await window.tf.setBackend('wasm');
        await window.tf.ready();
        console.log("loadModel: TFJS WASM backend is ready.");

        if (!window.tflite) {
          throw new Error("window.tflite is undefined. Check index.html CDN scripts or network connection.");
        }
        window.tflite.setWasmPath('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.9/dist/');
        
        // Helper to load files via XHR (bypasses Android WebView fetch() file:/// CORS issues)
        const loadViaXHR = (url, type) => new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', url);
          xhr.responseType = type;
          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 0) {
              resolve(xhr.response);
            } else {
              reject(new Error("Status " + xhr.status));
            }
          };
          xhr.onerror = () => reject(new Error("Network Error"));
          xhr.send();
        });

        // Load model as ArrayBuffer
        console.log("loadModel: Fetching model buffer...");
        const modelBuffer = await loadViaXHR('./model/model_unquant.tflite', 'arraybuffer');
        console.log("loadModel: Model buffer loaded successfully, parsing TFLite model...");
        const loadedModel = await window.tflite.loadTFLiteModel(modelBuffer);
        console.log("loadModel: TFLite model parsed successfully.");
        
        // Load labels as text
        console.log("loadModel: Fetching labels...");
        const text = await loadViaXHR('./model/labels.txt', 'text');
        console.log("loadModel: Labels text loaded successfully.");
        const loadedLabels = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        setLabels(loadedLabels);
        setModel(loadedModel);
        console.log("loadModel: Loading sequence complete! Model is ready.");
      } catch (err) {
        console.error("Error loading TFLite model:", err);
        setError((language === 'en' ? "Error loading AI: " : "Error cargando IA: ") + err.message);
      }
    }
    loadModel();
  }, []);

  useEffect(() => {
    // Start camera when component mounts
    async function startCamera() {
      try {
        let mediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: "environment",
              width: { ideal: 1920, min: 1280 },
              height: { ideal: 1080, min: 720 },
              advanced: [{ focusMode: "continuous" }]
            } 
          });
        } catch (firstErr) {
          console.warn("Back camera with advanced features not available, falling back:", firstErr);
          mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: {
              facingMode: "environment"
            }
          });
        }
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setError(null);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError(language === 'en' ? "Could not access the camera. Please make sure to grant permissions." : "No se pudo acceder a la cámara. Por favor, asegúrate de otorgar los permisos.");
      }
    }

    startCamera();

    return () => {
      // Clean up stream when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef]);

  const handleScan = async (fileImage = null) => {
    // Si ya estamos escaneando y presionan el botón sin ser foto de galería, lo detenemos
    if (isScanning && !fileImage) {
      continuousScanRef.current = false;
      setIsScanning(false);
      return;
    }

    if (scanResult) return;
    
    setIsScanning(true);
    continuousScanRef.current = true;
    
    // Unlock SpeechSynthesis engine during the click event (required by Android WebView)
    try {
      if (window.speechSynthesis) {
        const unlock = new SpeechSynthesisUtterance('');
        unlock.volume = 0;
        window.speechSynthesis.speak(unlock);
      }
    } catch (e) {}
    
    if (!model || labels.length === 0) {
      if (error) {
        alert((language === 'en' ? "Model loading error: " : "Error de carga del modelo: ") + error);
      } else {
        alert(language === 'en' ? "The AI model is still loading. Please wait a second." : "El modelo de IA aún se está cargando. Espera un segundo.");
      }
      setIsScanning(false);
      continuousScanRef.current = false;
      return;
    }

    const runInference = async () => {
      // Si el usuario canceló el escaneo, detenemos el loop
      if (!continuousScanRef.current && !fileImage) return;

      try {
        let tfImg;
        if (fileImage) {
          // Run inference on uploaded image
          tfImg = window.tf.browser.fromPixels(fileImage);
        } else {
          // 1. Capture frame from camera
          tfImg = window.tf.browser.fromPixels(videoRef.current);
        }
        
        // Safety check: Is the image too dark? (only for camera)
        if (!fileImage) {
          const meanTensor = window.tf.mean(tfImg);
          const meanValue = await meanTensor.data();
          window.tf.dispose(meanTensor);
          
          if (meanValue[0] < 15) { 
            // Si está oscuro, esperamos un poco y volvemos a intentar, sin alertas molestosas
            window.tf.dispose(tfImg);
            if (continuousScanRef.current) setTimeout(runInference, 500);
            return;
          }
        }
        
        let variations = [];
        let allTensorsToDispose = [tfImg];

        if (fileImage) {
          // Gallery images are already squared and white-padded by handleFileUpload
          const resized = window.tf.image.resizeBilinear(tfImg, [224, 224]);
          const expanded = window.tf.expandDims(resized, 0);
          variations.push(expanded);
          allTensorsToDispose.push(resized, expanded);
        } else {
          // Multi-Crop: Evaluamos el 100% y el 55% de la pantalla al mismo tiempo.
          // El 55% actúa como un "auto-zoom" que ignora los fondos vacíos.
          const [h, w] = tfImg.shape;
          const scales = [1.0, 0.55]; 
          
          for (let scale of scales) {
            const size = Math.floor(Math.min(h, w) * scale); 
            const startY = Math.floor((h - size) / 2);
            const startX = Math.floor((w - size) / 2);
            const crop = window.tf.slice(tfImg, [startY, startX, 0], [size, size, 3]);
            
            // Resize the square to 224x224
            const resized = window.tf.image.resizeBilinear(crop, [224, 224]);
            const expanded = window.tf.expandDims(resized, 0);

            // Transponer para rotación horizontal
            const transposed = window.tf.transpose(expanded, [0, 2, 1, 3]);

            // Test-Time Augmentation (TTA) Variations
            const v2 = window.tf.reverse(expanded, [2]);
            const v3 = window.tf.reverse(expanded, [1, 2]);
            const v4 = window.tf.reverse(expanded, [1]);
            const v5 = window.tf.reverse(transposed, [2]);
            const v6 = window.tf.reverse(transposed, [1]);

            variations.push(expanded, v2, v3, v4, v5, v6);
            allTensorsToDispose.push(crop, resized, expanded, transposed, v2, v3, v4, v5, v6);
          }
        }
        
        let bestResult = { prob: 0, name: '', top3: [] };

        // Dynamic model input check
        const inputInfo = model.inputs[0];
        const isQuantized = inputInfo.dtype !== 'float32';

        for (let i = 0; i < variations.length; i++) {
          let inputTensor;
          let floatTensor, divTensor;

          if (isQuantized) {
            inputTensor = window.tf.cast(variations[i], 'int32');
          } else {
            floatTensor = window.tf.cast(variations[i], 'float32');
            divTensor = window.tf.div(floatTensor, window.tf.scalar(127.5));
            inputTensor = window.tf.sub(divTensor, window.tf.scalar(1));
          }
          
          // 2. Run Inference
          const prediction = model.predict(inputTensor);
          const values = await prediction.data();
          
          // 3. Find top classes
          const currentTop3 = Array.from(values)
            .map((prob, idx) => ({ prob, idx, name: labels[idx] }))
            .sort((a, b) => b.prob - a.prob)
            .slice(0, 3);
            
          if (currentTop3[0].prob > bestResult.prob) {
            bestResult = { 
              prob: currentTop3[0].prob, 
              name: currentTop3[0].name, 
              top3: currentTop3 
            };
          }

          // Queue tensors for cleanup
          if (i !== 0) allTensorsToDispose.push(variations[i]); // Don't push expanded twice
          allTensorsToDispose.push(inputTensor, prediction);
          if (floatTensor) allTensorsToDispose.push(floatTensor);
          if (divTensor) allTensorsToDispose.push(divTensor);
        }
          
        const maxProb = bestResult.prob;
        const detectedName = bestResult.name;
        
        // Clean label: Teachable machine prefixes with "0 ", "1 ", etc.
        // And convert to lowercase to handle any uppercase from new labels.txt
        let cleanName = detectedName.replace(/^\d+\s+/, '').trim().toLowerCase();
        
        // Map names to match PokeAPI standards or fix typos in labels.txt
        const pokeApiMap = {
          "mrmime": "mr-mime",
          "mr mime": "mr-mime",
          "alolan sandslash": "sandslash-alola",
          "class 130": "staryu", 
          "class 149": "zubat",  
          "farfetchd": "farfetchd",
          "drowze": "drowzee"
        };
        if (pokeApiMap[cleanName]) {
          cleanName = pokeApiMap[cleanName];
        }
        
        // Cleanup all tensors to prevent memory leaks
        window.tf.dispose(allTensorsToDispose);

        const debugString = bestResult.top3.map(t => `${t.name.replace(/^\d+\s+/, '')} (${(t.prob*100).toFixed(1)}%)`).join(', ');

        // Threshold súper estricto (90%) para evitar falsos positivos
        if (maxProb < 0.90 || cleanName === "fondo" || cleanName === "nada" || cleanName === "background") {
          detectionStreakRef.current = { name: '', count: 0 };
          if (fileImage) {
            alert(language === 'en' ? 
              `No clear Pokémon detected. \nDebug: ${debugString}\nDtype: ${inputInfo.dtype}` : 
              `No se detectó un Pokémon con seguridad. \nDebug: ${debugString}\nDtype: ${inputInfo.dtype}`);
            setIsScanning(false);
            continuousScanRef.current = false;
          } else {
            // Continúa intentando sin molestar al usuario en un loop infinito
            if (continuousScanRef.current) setTimeout(runInference, 150);
          }
          return;
        }

        // Sistema de Racha: Exigir 6 lecturas seguidas del mismo Pokémon
        if (!fileImage) {
          if (detectionStreakRef.current.name === cleanName) {
            detectionStreakRef.current.count += 1;
          } else {
            detectionStreakRef.current = { name: cleanName, count: 1 };
          }

          if (detectionStreakRef.current.count < 6) {
            if (continuousScanRef.current) setTimeout(runInference, 150);
            return;
          }
        }
        
        // Reiniciar racha para el proximo escaneo
        detectionStreakRef.current = { name: '', count: 0 };

        // Si llegó aquí, encontró un Pokémon con buena probabilidad y racha
        try {
          // 4. Fetch the real pokemon data from PokeAPI
          const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${cleanName}`);
          if (!response.ok) {
            throw new Error(language === 'en' ? `Pokémon "${cleanName}" does not exist in PokeAPI database.` : `Pokémon "${cleanName}" no existe en la base de datos de PokeAPI.`);
          }
          const data = await response.json();
          
          setScanResult({
            id: data.id,
            name: data.name,
            types: data.types.map(t => t.type.name),
            stats: {
              hp: data.stats.find(s => s.stat.name === 'hp').base_stat,
              atk: data.stats.find(s => s.stat.name === 'attack').base_stat,
              def: data.stats.find(s => s.stat.name === 'defense').base_stat,
            },
            image: data.sprites.other['official-artwork'].front_default || data.sprites.front_default
          });
          
          // Detener el loop una vez que encuentra exitosamente al Pokémon
          setIsScanning(false);
          continuousScanRef.current = false;

        } catch (fetchErr) {
          console.error("PokeAPI Error:", fetchErr);
          if (fileImage) {
            alert((language === 'en' ? "Scanning error: " : "Error al escanear: ") + fetchErr.message);
            setIsScanning(false);
            continuousScanRef.current = false;
          } else {
            // Si falla la API, seguimos escaneando si es cámara (quizás fue un falso positivo)
            if (continuousScanRef.current) setTimeout(runInference, 1000);
          }
        }
        
      } catch (err) {
        console.error("Error recognizing Pokemon:", err);
        if (fileImage) alert((language === 'en' ? "Scanning error: " : "Error al escanear: ") + err.message);
        setIsScanning(false);
        continuousScanRef.current = false;
      }
    };

    runInference();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      // Create a square canvas to letterbox the image and add a white background.
      // This perfectly matches how Teachable Machine handles transparent PNGs and non-square images.
      const canvas = document.createElement('canvas');
      const size = Math.max(img.width, img.height);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      // Fill with white
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
      
      // Draw image in the center
      const offsetX = (size - img.width) / 2;
      const offsetY = (size - img.height) / 2;
      ctx.drawImage(img, offsetX, offsetY);
      
      handleScan(canvas);
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  };

  const closeResult = () => {
    setScanResult(null);
  };

  return (
    <main className="relative z-10 flex flex-col items-center justify-center min-h-screen overflow-hidden">
      {/* Live Camera Feed Simulation */}
      <div className="fixed inset-0 z-0 bg-black">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-white/50 px-8 text-center font-body-md">
            {error}
          </div>
        ) : (
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"
          />
        )}
        {/* Digital Overlay Mask */}
        <div className="absolute inset-0 bg-black/20 backdrop-grayscale-[0.2]"></div>
      </div>

      {/* Top Navigation / Search */}
      <header className="fixed top-0 left-0 w-full z-30 px-margin-mobile pt-stack-md flex flex-col gap-unit pointer-events-auto">
        <div className="flex justify-between items-center w-full max-w-7xl mx-auto py-unit">
          <span className="font-headline-md text-headline-md font-bold text-secondary-container dark:text-secondary-fixed">PokéScan</span>
          <div className="flex items-center gap-4">
            <div 
              onClick={() => onChangeLanguage(language === 'es' ? 'en' : 'es')}
              className="flex items-center gap-1.5 px-3 py-1.5 glass-panel rounded-full hover:bg-white/5 transition-colors cursor-pointer select-none text-secondary-fixed"
            >
              <span className="material-symbols-outlined text-secondary-fixed text-lg">language</span>
              <span className="text-secondary-fixed text-xs font-bold font-data-num">{language.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Holographic Focus Frame */}
      <div className={`relative w-72 h-72 md:w-96 md:h-96 ${isScanning ? 'scanner-frame-animate' : ''}`}>
        {/* Corners */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-secondary-fixed rounded-tl-xl holographic-glow"></div>
        <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-secondary-fixed rounded-tr-xl holographic-glow"></div>
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-secondary-fixed rounded-bl-xl holographic-glow"></div>
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-secondary-fixed rounded-br-xl holographic-glow"></div>
        
        {/* Scanning Line (Animated CSS) */}
        {isScanning && (
          <div className="absolute left-4 right-4 h-[1px] bg-secondary-fixed opacity-50 shadow-[0_0_10px_#00fbfb]" 
               style={{
                 animation: 'move-scan-line 1.5s linear infinite alternate',
               }}>
          </div>
        )}
        <style>{`
          @keyframes move-scan-line {
            0% { top: 0; }
            100% { top: 100%; }
          }
        `}</style>
        
        {/* Technical Data Dots */}
        <div className="absolute -top-8 -left-4 text-[10px] font-data-num text-secondary-fixed/70 uppercase">
          {language === 'en' ? 'Tracking Active' : 'Escaneo Activo'}
        </div>
        <div className="absolute -bottom-8 -right-4 text-[10px] font-data-num text-secondary-fixed/70 uppercase">ID-7492-PKMN</div>
      </div>

      {/* Bottom Action Panel */}
      <section className="fixed bottom-0 left-0 w-full z-40 mb-24 pointer-events-auto">
        <div className="flex flex-col items-center pb-8">
          <p className="text-secondary-fixed text-label-caps font-label-caps mb-6 bg-black/40 px-4 py-1 rounded-full backdrop-blur-md border border-secondary-fixed/20">
            {language === 'en' ? 'Point at the Pokémon to identify it' : 'Apunta al Pokémon para identificarlo'}
          </p>
          {/* Primary Scan Button */}
          <button 
            onClick={() => handleScan()}
            className={`relative group active:scale-95 transition-transform duration-200 ${isScanning ? 'opacity-50 animate-pulse' : ''}`}
          >
            {/* Button Glow Effect */}
            <div className="absolute inset-0 bg-[#FF0000] rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
            <img 
              src="/media__1782224996310.png" 
              alt={language === 'en' ? "Scan" : "Escanear"} 
              className="relative w-28 h-28 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
            />
          </button>
          
          {/* Debug: Image Upload Button */}
          <div className="mt-4 flex items-center justify-center">
            <label className="text-white text-xs opacity-70 border border-white/30 rounded-full px-4 py-1 cursor-pointer hover:bg-white/10 transition-colors">
              {language === 'en' ? "Test Image from Gallery" : "Probar imagen de galería"}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      </section>

      {scanResult && (
        <ResultModal 
          pokemon={scanResult} 
          onClose={closeResult} 
          onSave={() => {
            onSave(scanResult);
            closeResult();
          }} 
          language={language}
        />
      )}
    </main>
  );
}

export default Scanner;
