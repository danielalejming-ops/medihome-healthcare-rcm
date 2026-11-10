/**
 * MEDIHOME VALENCIA • Audio Blob Interceptor (Contexto Principal / MAIN World)
 * Captura todos los audios y notas de voz que WhatsApp Web procesa o reproduce,
 * extrayendo el contenido binario directamente antes de que sea enrutado o revocado.
 */

(function() {
    'use strict';

    if (window.__medihome_interceptor_loaded) return;
    window.__medihome_interceptor_loaded = true;

    console.log("🩺 [MediHome] Audio Interceptor activo en contexto principal (MAIN World)");

    window.__medihome_audio_cache = window.__medihome_audio_cache || [];

    // 1. Interceptar URL.createObjectURL para capturar blobs de audio apenas WhatsApp los crea
    const origCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = function(obj) {
        const url = origCreateObjectURL.apply(this, arguments);
        try {
            if (obj instanceof Blob && (
                obj.type.includes('audio') ||
                obj.type.includes('ogg') ||
                obj.type.includes('opus') ||
                obj.type.includes('mp4') ||
                obj.type.includes('aac') ||
                (obj.size > 300 && obj.size < 25000000 && !obj.type.includes('image') && !obj.type.includes('video'))
            )) {
                console.log("🎙️ [MediHome Interceptor] Capturado Audio Blob:", obj.type, "Tamaño:", obj.size, "URL:", url);

                const cleanMime = obj.type ? obj.type.split(';')[0].trim() : 'audio/ogg';
                const reader = new FileReader();
                reader.onloadend = function() {
                    if (reader.result && typeof reader.result === 'string') {
                        const base64 = reader.result.split(',')[1];
                        const entry = {
                            url: url,
                            mimeType: cleanMime,
                            base64: base64,
                            size: obj.size,
                            time: Date.now()
                        };

                        window.__medihome_audio_cache.unshift(entry);
                        if (window.__medihome_audio_cache.length > 25) {
                            window.__medihome_audio_cache.pop();
                        }

                        // Notificar a lisa_bot.js mediante evento en window y document
                        const evt = new CustomEvent('medihome_audio_captured', { detail: entry });
                        window.dispatchEvent(evt);
                        document.dispatchEvent(evt);
                    }
                };
                reader.readAsDataURL(obj);
            }
        } catch(e) {
            console.warn("[MediHome Interceptor] Error interceptando blob:", e);
        }
        return url;
    };

    // 2. Interceptar constructor window.Audio
    const origAudio = window.Audio;
    window.Audio = function(src) {
        const audioInstance = new origAudio(src);
        if (src && typeof src === 'string' && src.startsWith('blob:')) {
            console.log("🎙️ [MediHome Interceptor] new Audio instanciado con blob:", src);
            // Intentar fetch del blob por si acaso no entró por createObjectURL
            fetch(src).then(r => r.blob()).then(blob => {
                const reader = new FileReader();
                reader.onloadend = function() {
                    if (reader.result) {
                        const entry = {
                            url: src,
                            mimeType: blob.type ? blob.type.split(';')[0].trim() : 'audio/ogg',
                            base64: reader.result.split(',')[1],
                            size: blob.size,
                            time: Date.now()
                        };
                        window.__medihome_audio_cache.unshift(entry);
                        window.dispatchEvent(new CustomEvent('medihome_audio_captured', { detail: entry }));
                    }
                };
                reader.readAsDataURL(blob);
            }).catch(() => {});
        }
        return audioInstance;
    };
    window.Audio.prototype = origAudio.prototype;

})();
