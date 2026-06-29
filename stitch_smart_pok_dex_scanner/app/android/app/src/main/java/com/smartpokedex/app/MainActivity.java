package com.smartpokedex.app;

import android.media.MediaPlayer;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.Voice;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    private TextToSpeech tts;
    private MediaPlayer mediaPlayer;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Initialize Android Native TextToSpeech (Fallback offline)
        tts = new TextToSpeech(this, new TextToSpeech.OnInitListener() {
            @Override
            public void onInit(int status) {
                if (status == TextToSpeech.SUCCESS) {
                    // Try to set language to Latin American Spanish (Mexico) by default
                    Locale latamLocale = new Locale("es", "MX");
                    int result = tts.setLanguage(latamLocale);
                    if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                        tts.setLanguage(new Locale("es"));
                    }
                    
                    try {
                        Voice selectedVoice = null;
                        
                        // First pass: Find a female voice in Latin American Spanish (not Spain)
                        for (Voice voice : tts.getVoices()) {
                            Locale locale = voice.getLocale();
                            if (locale.getLanguage().equals("es") && !locale.getCountry().equalsIgnoreCase("ES")) {
                                String name = voice.getName().toLowerCase();
                                if (name.contains("female") || name.contains("mujer") || name.contains("femenino")
                                    || name.contains("ana") || name.contains("eed") || name.contains("sfy") 
                                    || name.contains("paulina") || name.contains("monica") || name.contains("sara") 
                                    || name.contains("samantha") || name.contains("sabrina") || name.contains("soledad")) {
                                    selectedVoice = voice;
                                    break;
                                }
                            }
                        }
                        
                        // Second pass: If no Latam female voice, find ANY female Spanish voice (including Spain)
                        if (selectedVoice == null) {
                            for (Voice voice : tts.getVoices()) {
                                if (voice.getLocale().getLanguage().equals("es")) {
                                    String name = voice.getName().toLowerCase();
                                    if (name.contains("female") || name.contains("mujer") || name.contains("femenino")
                                        || name.contains("ana") || name.contains("eed") || name.contains("sfy") 
                                        || name.contains("paulina") || name.contains("monica") || name.contains("sara")) {
                                        selectedVoice = voice;
                                        break;
                                    }
                                }
                            }
                        }
                        
                        // Third pass: If still null, find ANY Latin American Spanish voice
                        if (selectedVoice == null) {
                            for (Voice voice : tts.getVoices()) {
                                Locale locale = voice.getLocale();
                                if (locale.getLanguage().equals("es") && !locale.getCountry().equalsIgnoreCase("ES")) {
                                    selectedVoice = voice;
                                    break;
                                }
                            }
                        }
                        
                        if (selectedVoice != null) {
                            tts.setVoice(selectedVoice);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        });

        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
            
            // Register JavaScript bridge interface "NativeTTS"
            webView.addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void speak(final String text, final String lang) {
                    new Thread(new Runnable() {
                        @Override
                        public void run() {
                            try {
                                // Stop and reset MediaPlayer if playing
                                if (mediaPlayer != null) {
                                    try {
                                        if (mediaPlayer.isPlaying()) {
                                            mediaPlayer.stop();
                                        }
                                    } catch (Exception e) {}
                                    mediaPlayer.reset();
                                } else {
                                    mediaPlayer = new MediaPlayer();
                                }

                                String ttsLang = "en".equalsIgnoreCase(lang) ? "en-us" : "es-mx";

                                // 1. Attempt to stream Google Translate TTS with desktop User-Agent
                                String encodedText = URLEncoder.encode(text, "UTF-8");
                                String urlStr = "https://translate.google.com/translate_tts?ie=UTF-8&tl=" + ttsLang + "&client=tw-ob&q=" + encodedText;
                                
                                URL url = new URL(urlStr);
                                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                                connection.setRequestMethod("GET");
                                // Emulate a desktop Chrome browser to bypass mobile webview 403 Forbidden block
                                connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                                connection.setConnectTimeout(5000);
                                connection.setReadTimeout(5000);
                                
                                int responseCode = connection.getResponseCode();
                                if (responseCode == HttpURLConnection.HTTP_OK) {
                                    InputStream inputStream = connection.getInputStream();
                                    File tempFile = File.createTempFile("tts_temp", ".mp3", getCacheDir());
                                    tempFile.deleteOnExit();
                                    
                                    FileOutputStream outputStream = new FileOutputStream(tempFile);
                                    byte[] buffer = new byte[1024];
                                    int bytesRead;
                                    while ((bytesRead = inputStream.read(buffer)) != -1) {
                                        outputStream.write(buffer, 0, bytesRead);
                                    }
                                    outputStream.close();
                                    inputStream.close();
                                    
                                    // Play the MP3 natively
                                    mediaPlayer.setDataSource(tempFile.getAbsolutePath());
                                    mediaPlayer.prepare();
                                    mediaPlayer.start();
                                    return; // Success, skip fallback
                                }
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                            
                            // 2. Offline/Error Fallback: use Android native system TextToSpeech
                            if (tts != null) {
                                if ("en".equalsIgnoreCase(lang)) {
                                    tts.setLanguage(Locale.US);
                                    try {
                                        for (Voice voice : tts.getVoices()) {
                                            if (voice.getLocale().getLanguage().equals("en")) {
                                                String name = voice.getName().toLowerCase();
                                                if (name.contains("female") || name.contains("a") || name.contains("en-us-x-sfg")) {
                                                    tts.setVoice(voice);
                                                    break;
                                                }
                                            }
                                        }
                                    } catch (Exception e) {}
                                } else {
                                    Locale latamLocale = new Locale("es", "MX");
                                    tts.setLanguage(latamLocale);
                                    try {
                                        for (Voice voice : tts.getVoices()) {
                                            if (voice.getLocale().getLanguage().equals("es")) {
                                                String name = voice.getName().toLowerCase();
                                                if (name.contains("female") || name.contains("mujer") || name.contains("femenino")
                                                    || name.contains("ana") || name.contains("eed") || name.contains("sfy") 
                                                    || name.contains("paulina") || name.contains("monica") || name.contains("sara")) {
                                                    tts.setVoice(voice);
                                                    break;
                                                }
                                            }
                                        }
                                    } catch (Exception e) {}
                                }
                                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "PokedexTTS");
                            }
                        }
                    }).start();
                }
                
                @JavascriptInterface
                public void stop() {
                    try {
                        if (mediaPlayer != null && mediaPlayer.isPlaying()) {
                            mediaPlayer.stop();
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                    if (tts != null) {
                        tts.stop();
                    }
                }
            }, "NativeTTS");
        }
    }

    @Override
    public void onDestroy() {
        if (mediaPlayer != null) {
            try {
                mediaPlayer.release();
            } catch (Exception e) {}
            mediaPlayer = null;
        }
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        super.onDestroy();
    }
}
