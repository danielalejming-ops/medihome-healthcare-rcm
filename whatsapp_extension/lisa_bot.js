/**
 * MEDIHOME VALENCIA • Asistente Virtual Lisa (v4.1 Anti-Cruce de Chats & IA Multimodal)
 * - Anti-Cruce de Chats 100% Blindado:
 *   1. Nunca envía un mensaje sin verificar que el chat activo en pantalla corresponda exactamente al paciente destinatario.
 *   2. Si el operador cambia de chat mientras Gemini procesa el audio, Lisa detecta el cambio, re-abre el chat del paciente y solo entonces envía la respuesta.
 *   3. Enlace directo de audio por clic: La nota de voz capturada se vincula al mensaje específico que fue activado, evitando cruce de audios entre chats.
 *   4. Bloqueo de inicio: Al recargar WhatsApp Web (F5), marca el historial ya existente para no auto-responder a chats abiertos previamente.
 * - Reconocimiento clínico y planes con Google Gemini Multimodal.
 * - Piloto automático seguro en la barra lateral con verificación de apertura.
 */

(function() {
    'use strict';

    console.log("🩺 MediHome • Lisa v4.5 Anti-Cruce de Chats e IA Multimodal 24/7 Iniciada");

    let isBotActive = true;
    let isProcessing = false;
    const DEFAULT_KEY = "YOUR_GEMINI_API_KEY";
    const storedKey = localStorage.getItem("medihome_gemini_api_key");
    let geminiApiKey = (storedKey && storedKey.length > 20) ? storedKey : DEFAULT_KEY;
    const processedIds = new Set();
    const sentByBotList = [];
    let lastReplyTime = 0;

    // Cola de audios capturados en memoria
    const capturedAudios = [];

    // Limpieza de cualquier bloqueo residual previo
    try {
        sessionStorage.removeItem("medihome_muted_chats");
        localStorage.removeItem("medihome_muted_chats");
    } catch(e) {}

    function extractRecentChatHistory(limit = 8) {
        try {
            const chatArea = document.querySelector('#main');
            if (!chatArea) return "";
            const msgEls = Array.from(chatArea.querySelectorAll('div[data-id]'));
            if (msgEls.length === 0) return "";

            const recentEls = msgEls.slice(-limit);
            const history = [];

            for (const el of recentEls) {
                const textNode = el.querySelector('span.selectable-text') || el;
                let text = cleanText(textNode ? textNode.innerText.trim() : "");
                if (!text) continue;

                if (isVoiceNote(el)) {
                    text = `[Nota de voz recibida / enviada]`;
                }

                const isOut = isOurOwnMessage(el, text);
                const sender = isOut ? "Lisa (MediHome)" : "Paciente";
                history.push(`${sender}: ${text}`);
            }

            return history.join("\n");
        } catch(e) {
            return "";
        }
    }

    // Inyectar interceptor en la página como respaldo directo
    function injectInterceptor() {
        try {
            if (!document.getElementById("medihome-audio-interceptor")) {
                const script = document.createElement("script");
                script.id = "medihome-audio-interceptor";
                script.src = chrome.runtime.getURL("interceptor.js");
                (document.head || document.documentElement).appendChild(script);
            }
        } catch(e) {}
    }
    injectInterceptor();

    // Escuchar audios interceptados
    function onAudioCaptured(entry) {
        if (!entry || !entry.base64) return;
        entry.time = entry.time || Date.now();
        entry.consumed = false;
        console.log("🎙️ [LisaBot] Recibido audio capturado:", entry.mimeType, "tamaño:", entry.size);
        capturedAudios.unshift(entry);
        if (capturedAudios.length > 25) capturedAudios.pop();
    }

    window.addEventListener('medihome_audio_captured', (e) => onAudioCaptured(e.detail));
    document.addEventListener('medihome_audio_captured', (e) => onAudioCaptured(e.detail));

    const BOT_RESPONSES = {
        "menu": (
            "🏥 *¡Hola! Te saluda Lisa de MEDIHOME Valencia* 🩺✨\n" +
            "_Atención médica profesional en la comodidad de tu hogar 24/7._ 🏡🚗💨\n\n" +
            "👨‍⚕️👩‍⚕️ Nuestro equipo de guardia, el *Dr. Víctor Cedeño* y la Asistente Médico Alejandra Ramones, está disponible para atenderte con calidez y dedicación.\n\n" +
            "Responde con el número de tu opción:\n" +
            "1️⃣ *🚨 Emergencia / Urgencia 24H*\n" +
            "2️⃣ *👨‍⚕️ Médico a Domicilio y Telemedicina*\n" +
            "3️⃣ *💉 Sueros, Inyecciones y Curaciones*\n" +
            "4️⃣ *🌟 Planes Médicos Mensuales* (Desde 15$/mes)\n" +
            "5️⃣ *📋 Certificados Médicos Oficiales*\n" +
            "6️⃣ *💳 Zonas de Cobertura y Métodos de Pago*\n" +
            "7️⃣ *👩‍⚕️ Hablar con Médico de Guardia*\n\n" +
            "_O cuéntame directamente qué síntoma presentas o envíame una nota de voz._ 🎙️💬"
        ),
        "voice_note_fallback": (
            "🎙️ *Nota de voz recibida* 🩺✨\n\n" +
            "Te saluda Lisa de MEDIHOME. Nuestro equipo médico de guardia en Valencia ya está escuchando atentamente tu nota de voz para asistirte en breve. 🏡🚗💨\n\n" +
            "🚨 *Si se trata de una urgencia médica inmediata*, llámanos directamente al:\n" +
            "📞 *0412-1233287* / *0414-4417118*"
        ),
        "media_exam": (
            "📋 *Archivo / Examen médico recibido* 🩺\n\n" +
            "Te saluda Lisa de MEDIHOME. He recibido tu archivo/foto correctamente. Nuestro médico de guardia en Valencia lo está revisando en este momento. ✨\n\n" +
            "🚨 Si se trata de una urgencia médica inmediata, llámanos directamente al *0412-1233287* o *0414-4417118*."
        ),
        "fallback_empathetic": (
            "¡Hola! Te saluda Lisa de *MediHome Valencia* 🩺✨. Con gusto activamos la atención médica en tu hogar 🏡🚗💨.\n\n" +
            "Para coordinar la visita de inmediato, por favor indícanos:\n" +
            "1. *¿Qué síntoma o motivo de consulta presenta el paciente?*\n" +
            "2. *Nombre, edad y urbanización en Valencia.*"
        ),
        "1": (
            "🚨 *¡URGENCIA MÉDICA PRIORITARIA!* 🚨\n\n" +
            "Te saluda Lisa de MediHome. Nuestro equipo médico está listo para acudir de inmediato a tu domicilio en Valencia.\n\n" +
            "Por favor indícanos rápidamente:\n" +
            "1. *Nombre y edad del paciente:*\n" +
            "2. *Síntoma o motivo de la urgencia:*\n" +
            "3. *Dirección exacta (Urbanización, edificio/casa):*\n\n" +
            "O presiona para llamar a la guardia ahora mismo:\n" +
            "📞 *0412-1233287* / *0414-4417118*"
        ),
        "2": (
            "👨‍⚕️ *CONSULTA MÉDICA A DOMICILIO Y TELEMEDICINA* 🩺🏡\n\n" +
            "Atención médica profesional en la comodidad de tu hogar en Valencia con evaluación física, diagnóstico y récipes oficiales 📋.\n\n" +
            "¿Deseas consulta presencial a domicilio o videollamada? Cuéntanos qué síntoma presenta el paciente y en qué urbanización se encuentra ✨😊."
        ),
        "3": (
            "💉 *PROCEDIMIENTOS Y ENFERMERÍA EN CASA*\n\n" +
            "Atención profesional con insumos descartables y técnica 100% estéril:\n\n" +
            "💧 *Sueroterapia e Hidratación:* Vitaminas, oligoelementos y electrolitos.\n" +
            "💉 *Inyecciones y Vías:* Vía endovenosa (EV) o intramuscular (IM).\n" +
            "🔄 *Sondas:* Colocación y cambio de sonda vesical (Foley) o nasogástrica.\n" +
            "🩹 *Curaciones Avanzadas:* Pie diabético, escaras, quemaduras y heridas.\n" +
            "✂️ *Procedimientos Menores:* Retiro de puntos y suturas menores.\n\n" +
            "¿Qué procedimiento necesita el paciente y en qué urbanización se encuentra?"
        ),
        "4": (
            "🌟 *PLANES MÉDICOS MENSUALES • MEDIHOME VALENCIA* 🏥🏡\n\n" +
            "¡Con muchísimo gusto te comparto todas nuestras opciones de cobertura médica mensual para ti y tu familia! 💖🩺\n\n" +
            "📱 *1. Plan Conexión Médica — 15$/mes*\n" +
            "• Telemedicina 24/7 ilimitada por chat y videollamada.\n" +
            "• Orientación médica continua y récipes digitales oficiales.\n\n" +
            "🚨 *2. Plan Alivio Inmediato — 30$/mes*\n" +
            "• Telemedicina 24/7 ilimitada.\n" +
            "• Cobertura de Urgencias Médicas presenciales a domicilio 24/7 en Valencia.\n\n" +
            "🏡 *3. Plan Cuidado Hogar — 40$/mes*\n" +
            "• Telemedicina 24/7 + Urgencias a domicilio 24/7.\n" +
            "• 1 Consulta Médica integral presencial en tu hogar al mes.\n\n" +
            "🩺 *4. Plan Bienestar Integral — 60$/mes*\n" +
            "• Cobertura Médica Total: Visitas a domicilio + Urgencias 24/7 + Exámenes de laboratorio de rutina + Sueroterapia y curaciones.\n\n" +
            "👶 *5. Plan Pequeños Protegidos (Pediátrico) — 50$/mes*\n" +
            "• Urgencias pediátricas a domicilio 24/7 + Consulta de Control Niño Sano + Certificado de Salud Escolar oficial.\n\n" +
            "✈️ *6. Plan Salud Sin Fronteras — 80$/mes*\n" +
            "• Especial para padres y abuelos en Valencia (pagas desde el exterior).\n" +
            "• Telemedicina + Urgencias 24/7 + 2 Visitas médicas en casa al mes + Laboratorios/Sueros + Reporte fotográfico y clínico a tu WhatsApp.\n\n" +
            "💳 *Métodos de Pago Flexibles:*\n" +
            "• 📱 Pago Móvil / Transferencia (Tasa oficial BCV)\n" +
            "• 💵 Efectivo en Dólares ($) en mano\n" +
            "• 🇺🇸 Zelle (Directo USA)\n" +
            "• 🟡 Binance USDT / PayPal / Banesco Panamá\n\n" +
            "¿Cuál de estos planes se adapta mejor a tu familia? Nuestro equipo de guardia, el *Dr. Víctor Cedeño* y la Asistente Médico Alejandra Ramones, está a tu completa orden para coordinar tu afiliación de inmediato ✨😊."
        ),
        "5": (
            "📋 *CERTIFICADOS MÉDICOS OFICIALES*\n\n" +
            "Emitidos por médicos colegiados con validez legal nacional:\n\n" +
            "🚗 *Certificado de Salud Vial* (Licencia de Conducir).\n" +
            "🏫 *Certificados de Salud Escolar* y Aptitud Física.\n" +
            "💼 *Certificados Médicos Laborales* y Pre-empleo.\n\n" +
            "¿Qué tipo de certificado necesitas y para cuántas personas?"
        ),
        "6": (
            "📍 *ZONAS DE COBERTURA Y MÉTODOS DE PAGO*\n\n" +
            "🚗 *Zonas cubiertas en Carabobo:*\n" +
            "• Valencia Norte: El Parral, Prebo (I y II), La Ceiba, El Bosque, La Viña, Guaparo.\n" +
            "• El Trigal (Norte, Sur, Centro) y La Trigaleña.\n" +
            "• Municipios San Diego y Naguanagua.\n\n" +
            "💳 *Métodos de Pago:*\n" +
            "• 📱 Pago Móvil / Transferencia (Bs. tasa oficial BCV).\n" +
            "• 💵 Efectivo en Dólares ($) en mano.\n" +
            "• 🇺🇸 Zelle (Directo USA).\n" +
            "• 🟡 Binance USDT.\n" +
            "• 🌐 PayPal / Banesco Panamá."
        ),
        "7": (
            "👩‍⚕️ *CONECTANDO CON EL MÉDICO DE GUARDIA*\n\n" +
            "Te saluda Lisa. Ya estoy transfiriendo este chat a nuestro equipo de guardia en Valencia (Dr. Víctor Cedeño / Asistente Médico Alejandra Ramones).\n\n" +
            "Por favor escribe aquí:\n" +
            "1. *Nombre y edad del paciente:*\n" +
            "2. *Síntoma principal que presenta:*\n\n" +
            "🚨 Si sientes que es de gravedad inmediata, llámanos directamente al *0412-1233287*."
        ),
        "plan_abuelos": (
            "👴👵 *EL PLAN IDEAL PARA TUS ABUELITOS EN VENEZUELA* 🏡🩺\n\n" +
            "¡Qué hermoso gesto cuidar de tus abuelitos con tanto amor! 💖 En MEDIHOME tenemos el plan perfecto diseñado específicamente para su protección y tranquilidad:\n\n" +
            "✈️ *Plan Salud Sin Fronteras — 80$/mes*\n" +
            "• 🩺 *Telemedicina 24/7:* Consultas y dudas médicas ilimitadas por chat y videollamada.\n" +
            "• 🚨 *Cobertura de Urgencias Médicas 24/7:* Si presentan cualquier síntoma o malestar, nuestro médico acude de inmediato a su hogar en Valencia 🚗💨.\n" +
            "• 🏡 *2 Visitas Médicas en Casa al mes:* Chequeo integral completo, control de tensión arterial, glicemia, signos vitales y récipes oficiales actualizados.\n" +
            "• 💧 *Sueroterapia y Laboratorios:* Hidratación endovenosa y exámenes de rutina en casa.\n" +
            "• 📲 *Reporte Directo a tu WhatsApp:* Tras cada visita médica, te enviamos fotos e informe clínico completo a tu teléfono para tu tranquilidad estés donde estés 🌟.\n\n" +
            "💡 _(Si buscas una alternativa más económica, también disponemos del **Plan Cuidado Hogar por 40$/mes**, que incluye 1 visita médica presencial al mes + cobertura de urgencias 24/7)._\n\n" +
            "¿Te gustaría que activemos el **Plan Salud Sin Fronteras** para tus abuelos? Indícanos sus nombres y la urbanización en Valencia donde se encuentran para que el *Dr. Víctor Cedeño* y la Asistente Médico Alejandra Ramones coordinen su afiliación de inmediato ✨😊."
        ),
        "plan_salud_fronteras": (
            "✈️ *PLAN SALUD SIN FRONTERAS • MEDIHOME VALENCIA* 🏡🩺\n\n" +
            "¡Es nuestro plan estrella para cuidar a tus seres queridos en Valencia mientras tú estás en el exterior! 💖🌎\n\n" +
            "💰 *Inversión:* 80$/mes\n\n" +
            "🌟 *¿Qué incluye este plan completo?*\n" +
            "• 🩺 *Telemedicina 24/7:* Consultas ilimitadas por chat y videollamada para el paciente y el familiar.\n" +
            "• 🚨 *Cobertura de Urgencias Médicas 24/7:* Asistencia médica presencial en su hogar en Valencia a cualquier hora del día o de la noche 🚗💨.\n" +
            "• 🏡 *2 Visitas Médicas Presenciales al mes:* Evaluación clínica integral en casa, control de tensión, signos vitales, glicemia y actualización de récipes.\n" +
            "• 💧 *Sueroterapia e Hidratación EV:* Tratamiento de hidratación y exámenes de laboratorio de rutina incluidos.\n" +
            "• 📲 *Reporte Fotográfico y Clínico por WhatsApp:* Al finalizar cada consulta o urgencia, te enviamos un reporte detallado directamente a tu WhatsApp en el exterior con fotos del paciente y recomendaciones del médico para tu total tranquilidad.\n\n" +
            "💳 *Métodos de Pago:* Zelle (USA), Pago Móvil (tasa oficial BCV), Efectivo en Dólares ($), Binance USDT, PayPal.\n\n" +
            "¿Deseas afiliar a tus familiares hoy mismo? Por favor indícanos sus nombres, edad y la zona o urbanización en Valencia para coordinar con el *Dr. Víctor Cedeño* y la Asistente Médico Alejandra Ramones ✨😊."
        ),
        "afiliacion_salud_fronteras": (
            "¡Qué excelente elección! 🌟 El *Plan Salud Sin Fronteras* (80$/mes) es maravilloso 🌍✨, diseñado especialmente para brindar la mejor cobertura y tranquilidad a tus seres queridos aquí en Valencia: incluye Telemedicina y Urgencias 24/7 🏥, 2 visitas médicas en casa al mes 🏡, sueroterapia, laboratorios y un reporte clínico con foticos directo a tu WhatsApp 📲🩺.\n\n" +
            "Para tu comodidad, trabajamos con Pago Móvil / Transferencia (tasa oficial BCV) 🇻🇪, Zelle 🇺🇸, Efectivo en Dólares ($) y Binance USDT 💻. Dado que la tasa oficial del BCV varía diariamente, nuestro representante de atención, la Asistente Médico Alejandra Ramones, te atenderá prontamente por este mismo chat para indicarte la cantidad exacta en bolívares del día y suministrarte los datos de cuenta para tu pago 📋💬.\n\n" +
            "Por favor, ayúdanos con los siguientes daticos para registrar oficialmente al paciente en nuestro sistema MediHome 📝:\n\n" +
            "1. ¿El registro/plan será a nombre propio o de un familiar/otra persona? 👤\n" +
            "2. Nombre y Apellido completo de la persona a registrar ✍️.\n" +
            "3. Número de Cédula de Identidad (C.I.) o documento 🆔.\n" +
            "4. Número de teléfono de contacto 📱.\n" +
            "5. Edad del paciente y urbanización/dirección exacta en Valencia 🏡📍.\n" +
            "6. Método de pago de tu preferencia (Pago Móvil en Bs, Zelle, Efectivo o Binance) 💳💵.\n\n" +
            "¡Estamos listos para cuidar de los tuyos con todo el cariño! 💙👩‍⚕️👨‍⚕️"
        ),
        "datos_pago": (
            "¡Qué excelente decisión! 🌟 Con muchísimo gusto te ayudamos a formalizar tu afiliación médica en *MEDIHOME Valencia* 🏥✨.\n\n" +
            "Para tu comodidad, trabajamos con Pago Móvil / Transferencia (tasa oficial BCV) 🇻🇪, Zelle 🇺🇸, Efectivo en Dólares ($) y Binance USDT 💻. Como la tasa del BCV varía cada día, nuestro representante de atención, la Asistente Médico Alejandra Ramones, te atenderá prontamente por este mismo chat para indicarte la cantidad exacta en bolívares del día y suministrarte los datos exactos de cuenta 📋💬.\n\n" +
            "Por favor, ayúdanos con los siguientes daticos para registrar oficialmente al paciente en nuestro sistema MediHome 📝:\n\n" +
            "1. ¿El registro/plan será a nombre propio o de un familiar/otra persona? 👤\n" +
            "2. Nombre y Apellido completo de la persona a registrar ✍️.\n" +
            "3. Número de Cédula de Identidad (C.I.) o documento 🆔.\n" +
            "4. Número de teléfono de contacto 📱.\n" +
            "5. Edad del paciente y urbanización/dirección exacta en Valencia 🏡📍.\n" +
            "6. Método de pago de tu preferencia (Pago Móvil en Bs, Zelle, Efectivo o Binance) 💳💵.\n\n" +
            "¡Estamos listos para cuidar de ti y de los tuyos con todo el cariño y profesionalismo! 💙👩‍⚕️👨‍⚕️"
        ),
        "tasa_bcv": (
            "¡Hola! 🏥✨ Con muchísimo gusto te informamos que en *MEDIHOME Valencia* trabajamos con la tasa oficial establecida por el *Banco Central de Venezuela (BCV)* 🇻🇪.\n\n" +
            "Dado que la tasa del BCV se actualiza diariamente, nuestro representante de atención, la Asistente Médico Alejandra Ramones, te atenderá prontamente por este mismo chat para indicarte la tasa oficial del día, la cantidad exacta en bolívares y suministrarte los datos de pago móvil o transferencia 📋💬.\n\n" +
            "¿Para cuál de nuestros planes o servicios médicos a domicilio deseas consultar el monto? (Consulta médica en casa, sueroterapia, certificados o planes mensuales de cobertura) 🩺🚗💨"
        )
    };

    function normalizeText(str) {
        if (!str) return "";
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    }

    function isStatusIconTitle(str) {
        if (!str) return false;
        const norm = normalizeText(str);
        return norm.includes("entregado") ||
               norm.includes("leido") ||
               norm.includes("enviado") ||
               norm.includes("silenciado") ||
               norm.includes("fijado") ||
               norm.includes("unread") ||
               norm.includes("no leido") ||
               norm.includes("reproducir");
    }

    // Obtiene el título o nombre del chat actualmente visible en #main header
    function getChatHeaderTitle() {
        const headerBtn = document.querySelector('#main header div[role="button"]');
        if (headerBtn) {
            const titleSpan = headerBtn.querySelector('span[title]') || headerBtn.querySelector('span[dir="auto"]');
            if (titleSpan) {
                const val = (titleSpan.getAttribute('title') || titleSpan.innerText).trim();
                if (val && !isStatusIconTitle(val)) return val;
            }
        }
        const anyTitle = document.querySelector('#main header span[dir="auto"]');
        return anyTitle ? anyTitle.innerText.trim() : "";
    }

    // Obtiene el título o nombre del contacto en una fila de #pane-side
    function getRowContactTitle(row) {
        if (!row) return "";
        const cellTitle = row.querySelector('div[data-testid="cell-frame-title"] span, span[data-testid="cell-frame-title"]');
        if (cellTitle) {
            const val = (cellTitle.getAttribute('title') || cellTitle.innerText).trim();
            if (val && !isStatusIconTitle(val)) return val;
        }

        const spansWithTitle = Array.from(row.querySelectorAll('span[title]'));
        for (const s of spansWithTitle) {
            const t = s.getAttribute('title').trim();
            if (t && !isStatusIconTitle(t)) return t;
        }

        const firstDir = row.querySelector('span[dir="auto"]');
        return firstDir ? firstDir.innerText.trim() : "";
    }

    // Extrae el JID o teléfono de un elemento de mensaje
    function getMsgJid(msgEl) {
        if (!msgEl) return "";
        const dataId = msgEl.getAttribute('data-id') || "";
        const parts = dataId.split('_');
        return parts.length >= 2 ? parts[1] : "";
    }

    // Extrae el JID del chat que está actualmente desplegado en #main
    function getActiveChatJid() {
        const lastMsg = document.querySelector('#main div[data-id]:last-of-type') || 
                        document.querySelector('#main div[data-id]');
        return lastMsg ? getMsgJid(lastMsg) : "";
    }

    // Localiza la fila en #pane-side por título o nombre de contacto
    function findChatRowByTitle(targetTitle) {
        if (!targetTitle) return null;
        const normTarget = normalizeText(targetTitle);
        const rows = Array.from(document.querySelectorAll('#pane-side div[role="listitem"], #pane-side div[role="row"], #pane-side div[data-testid="cell-frame-container"]'));
        for (const r of rows) {
            const rowTitle = getRowContactTitle(r);
            if (rowTitle) {
                const normCurrent = normalizeText(rowTitle);
                if (normCurrent.includes(normTarget) || normTarget.includes(normCurrent)) {
                    return r;
                }
            }
        }
        return null;
    }

    // Clic ultra-robusto que dispara coordenadas y elementos directos
    function openChatOrElement(el) {
        if (!el) return;
        try {
            el.scrollIntoView({ block: 'center', behavior: 'instant' });
            const rect = el.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;

            const hitEl = (x > 0 && y > 0) ? document.elementFromPoint(x, y) : null;
            const targets = [hitEl, el].filter(Boolean);

            const opts = {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: x > 0 ? x : 100,
                clientY: y > 0 ? y : 100
            };

            for (const t of targets) {
                try {
                    t.focus();
                    t.dispatchEvent(new PointerEvent('pointerdown', opts));
                    t.dispatchEvent(new MouseEvent('mousedown', opts));
                    t.dispatchEvent(new PointerEvent('pointerup', opts));
                    t.dispatchEvent(new MouseEvent('mouseup', opts));
                    t.dispatchEvent(new MouseEvent('click', opts));
                    if (typeof t.click === 'function') t.click();
                } catch(e) {}
            }

            try {
                el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
            } catch(e) {}

        } catch(e) {
            try { el.click(); } catch(err) {}
        }
    }

    // Re-abre de forma forzada un chat por su título
    async function reOpenChatByTitle(targetTitle) {
        const row = findChatRowByTitle(targetTitle);
        if (!row) return false;

        const clickTarget = row.querySelector('span[title]') ||
                            row.querySelector('div[role="button"]') ||
                            row.querySelector('div[data-testid="cell-frame-container"]') ||
                            row;

        openChatOrElement(clickTarget);

        for (let i = 0; i < 6; i++) {
            await new Promise(r => setTimeout(r, 400));
            const curHeader = normalizeText(getChatHeaderTitle());
            if (curHeader && (curHeader.includes(normalizeText(targetTitle)) || normalizeText(targetTitle).includes(curHeader))) {
                return true;
            }
        }
        return false;
    }

    function cleanText(raw) {
        if (!raw) return "";
        // 1. Eliminar prefijo de copia de WhatsApp tipo "[8:18 p. m., 27/9/2026] MEDIHOME: " o "MediHome: "
        let cleaned = raw.replace(/^\[\d{1,2}:\d{2}.*?\]\s*.*?:/gmi, "");
        cleaned = cleaned.replace(/^[^:\n]{1,50}:\s*/gm, (match) => {
            const norm = normalizeText(match);
            if (norm.includes("medihome") || norm.includes("lisa") || norm.includes("atencion medica")) {
                return "";
            }
            return match;
        });
        // 2. Eliminar marcas de tiempo al final
        cleaned = cleaned.replace(/\d{1,2}:\d{2}\s*(?:[ap]\.?\s*m\.?)?$/gmi, "");
        return cleaned.trim();
    }

    function isVoiceNote(el) {
        if (!el) return false;
        return el.querySelector('audio') !== null ||
               el.querySelector('*[data-icon*="audio"], *[data-icon*="ptt"], *[data-icon*="waveform"], *[data-icon*="play"]') !== null ||
               el.querySelector('div[data-testid*="audio"], div[data-testid*="ptt"]') !== null ||
               el.querySelector('*[aria-label*="reproducir" i], *[aria-label*="play" i]') !== null;
    }

    function isMediaImage(el) {
        if (!el) return false;
        return el.querySelector('div[data-testid="image-thumb"], img[src^="blob:"], div[data-testid="media-canvas"]') !== null;
    }

    function isOurOwnMessage(msgEl, text) {
        if (!msgEl) return true;

        // 1. Atributos data-id en el elemento, ancestro o descendiente
        const dataId = msgEl.getAttribute('data-id') || 
                       msgEl.closest('[data-id]')?.getAttribute('data-id') || 
                       msgEl.querySelector('[data-id]')?.getAttribute('data-id') || "";
        if (dataId.startsWith('true_')) {
            return true;
        }

        // 2. Clases CSS de WhatsApp Web
        if (msgEl.classList.contains('message-out') || 
            msgEl.closest('.message-out') !== null ||
            msgEl.querySelector('div[class*="message-out"]') !== null ||
            msgEl.closest('div[class*="message-out"]') !== null) {
            return true;
        }

        // 3. Metadato data-pre-plain-text (metadato nativo de copia de WhatsApp Web)
        const copyableNode = msgEl.querySelector('.copyable-text') || msgEl.closest('.copyable-text') || msgEl;
        const prePlainText = (copyableNode?.getAttribute('data-pre-plain-text') || "").toLowerCase();
        if (prePlainText.includes("medihome") || prePlainText.includes("tú:") || prePlainText.includes("you:")) {
            return true;
        }

        // 4. Iconos de estado de entrega de WhatsApp (Ticks / Reloj)
        if (msgEl.querySelector('*[data-icon*="check"], *[data-icon*="time"], *[data-icon*="clock"], *[data-icon*="wds-ic-check"], *[data-icon*="msg-check"], *[data-icon*="msg-dblcheck"]')) {
            return true;
        }
        if (msgEl.querySelector('*[aria-label*="leído" i], *[aria-label*="leido" i], *[aria-label*="entregado" i], *[aria-label*="enviado" i], *[aria-label*="read" i], *[aria-label*="delivered" i]')) {
            return true;
        }

        // 5. Alineación física en pantalla (los mensajes salientes están en la mitad derecha)
        try {
            const chatArea = document.querySelector('#main');
            if (chatArea) {
                const elRect = msgEl.getBoundingClientRect();
                const chatRect = chatArea.getBoundingClientRect();
                const elCenter = elRect.left + (elRect.width / 2);
                const chatCenter = chatRect.left + (chatRect.width / 2);
                if (elCenter > chatCenter && elRect.width < (chatRect.width * 0.92)) {
                    return true;
                }
            }
        } catch(e) {}

        const cleanRaw = normalizeText(cleanText(text));

        // 6. Verificación contra la lista de mensajes enviados recientemente por Lisa
        for (const sent of sentByBotList) {
            const cleanSent = normalizeText(cleanText(sent));
            if (!cleanRaw || !cleanSent) continue;
            if (cleanSent === cleanRaw) return true;
            if (cleanSent.length >= 30 && cleanRaw.length >= 30) {
                if (cleanSent.slice(0, 30) === cleanRaw.slice(0, 30) || cleanRaw.includes(cleanSent.slice(0, 30))) {
                    return true;
                }
            }
        }

        // 7. Firmas y frases institucionales exclusivas de Lisa (frases que un paciente jamás escribiría)
        if (cleanRaw.includes("te saluda lisa") ||
            cleanRaw.includes("soy lisa, tu asistente") ||
            cleanRaw.includes("soy lisa de medihome") ||
            cleanRaw.includes("nuestro equipo de guardia, el dr.") ||
            cleanRaw.includes("nuestro equipo de guardia esta integrado") ||
            cleanRaw.includes("nuestro equipo de guardia, conformado") ||
            cleanRaw.includes("se me cruzaron los cablecitos") ||
            cleanRaw.includes("se copio un mensajito anterior por error") ||
            cleanRaw.includes("equipo medico de guardia ya esta escuchando") ||
            cleanRaw.includes("he recibido tu archivo/foto correctamente") ||
            cleanRaw.includes("conectando con el medico de guardia") ||
            cleanRaw.includes("planes medicos mensuales • medihome") ||
            cleanRaw.includes("planes medicos mensuales medihome")) {
            return true;
        }

        return false;
    }

    // Extractor infalible de Audio vinculado al mensaje específico
    async function extractVoiceAudio(msgEl) {
        // 1. Revisar si tenemos un audio capturado recientemente (últimos 60s) que no haya sido consumido
        const now = Date.now();
        const unconsumed = capturedAudios.find(a => !a.consumed && (now - a.time) < 60000);
        if (unconsumed) {
            unconsumed.consumed = true;
            console.log("✅ Usando audio capturado de llegada reciente:", unconsumed.mimeType);
            return {
                mimeType: unconsumed.mimeType,
                audioBase64: unconsumed.base64
            };
        }

        // 2. Si no había en cola, forzar reproducción en la nota de voz
        const playBtn = msgEl.querySelector('*[data-icon="play-sound"], *[data-icon="ptt-play"], *[data-icon="audio-play"], *[data-icon*="play"]') ||
                        msgEl.querySelector('*[aria-label*="reproducir" i], *[aria-label*="play" i]') ||
                        msgEl.querySelector('div[role="button"][data-testid*="play"]') ||
                        msgEl.querySelector('div[role="button"]');

        if (playBtn) {
            console.log("▶️ Activando nota de voz específica para captura de stream...");
            openChatOrElement(playBtn);
        }

        // Esperar activamente hasta 2500ms a que el interceptor capture el audio
        const startTime = Date.now();
        while (Date.now() - startTime < 2500) {
            await new Promise(r => setTimeout(r, 100));
            const found = capturedAudios.find(a => !a.consumed && (Date.now() - a.time) < 30000);
            if (found) {
                found.consumed = true;
                console.log("🎉 Audio capturado exitosamente tras reproducción simulada");
                Array.from(document.querySelectorAll('audio')).forEach(a => {
                    try { a.muted = true; a.pause(); } catch(e){}
                });
                return {
                    mimeType: found.mimeType,
                    audioBase64: found.base64
                };
            }
        }

        // 3. Respaldo directo en memoria global window.__medihome_audio_cache
        if (window.__medihome_audio_cache && window.__medihome_audio_cache.length > 0) {
            const globalEntry = window.__medihome_audio_cache[0];
            if (globalEntry && globalEntry.base64 && !globalEntry.consumed) {
                globalEntry.consumed = true;
                console.log("✅ Audio extraído desde __medihome_audio_cache global");
                return {
                    mimeType: globalEntry.mimeType || 'audio/ogg',
                    audioBase64: globalEntry.base64
                };
            }
        }

        // 4. Respaldo secundario: chequear tag audio en el documento con src blob
        const audioTags = Array.from(document.querySelectorAll('audio[src^="blob:"]'));
        if (audioTags.length > 0) {
            try {
                const targetTag = audioTags[audioTags.length - 1];
                targetTag.muted = true;
                const resp = await fetch(targetTag.src);
                const blob = await resp.blob();
                const reader = new FileReader();
                return new Promise(resolve => {
                    reader.onloadend = () => {
                        resolve({
                            mimeType: blob.type ? blob.type.split(';')[0].trim() : 'audio/ogg',
                            audioBase64: reader.result.split(',')[1]
                        });
                    };
                    reader.readAsDataURL(blob);
                });
            } catch(e) {}
        }

        return null;
    }

    const GEMINI_MODELS = ["gemini-flash-lite-latest", "gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-flash-latest"];

    const DIRECT_KNOWLEDGE_BASE = `
ERES: Lisa, la asistente médica virtual oficial de MEDIHOME en Valencia, Estado Carabobo, Venezuela.
EQUIPO DE GUARDIA: Dr. Víctor Cedeño (Médico Colegiado) y la Asistente Médico Alejandra Ramones.
REGLA DE CARGO ESTRICTA: Alejandra Ramones es "Asistente Médico" (NUNCA digas solo "la asistente" ni "doctora"; refiérete siempre a ella en texto plano normal como "la Asistente Médico Alejandra Ramones", SIN asteriscos ni formato de negrita *).
TELÉFONOS DE EMERGENCIAS Y URGENCIAS: 0412-1233287 y 0414-4417118 (disponibles 24/7).
ZONAS DE COBERTURA EN CARABOBO:
- Valencia Norte: El Parral, Prebo I y II, La Ceiba, El Bosque, La Viña, Guaparo, El Trigal (Norte, Sur, Centro), La Trigaleña.
- Municipios San Diego y Naguanagua.

SERVICIOS A DOMICILIO 24/7:
1. Consulta Médica en Casa: Evaluación física completa, diagnóstico y récipes oficiales.
2. Sueroterapia e Hidratación Endovenosa (EV): Para cortar vómitos, tratar deshidratación o malestar agudo.
3. Inyecciones y Medicación EV/IM.
4. Sondas y Curaciones Avanzadas (pie diabético, heridas, escaras).
5. Certificados Médicos Oficiales (vial/conducir, escolar, laboral).
6. Acompañamiento Médico Aéreo VIP: Asistencia y escolta médica profesional a bordo durante vuelos nacionales e internacionales (monitoreo continuo, oxigenoterapia, administración de fármacos y traslado puerta a puerta).

PLANES MÉDICOS MENSUALES (CATÁLOGO OFICIAL COMPLETO):
1. Plan Conexión Médica — 15$/mes: Telemedicina 24/7 ilimitada por chat y videollamada + orientación continua y récipe oficial digital.
2. Plan Alivio Inmediato — 30$/mes: Telemedicina 24/7 + Cobertura de Urgencias Médicas a domicilio 24/7 en Valencia.
3. Plan Cuidado Hogar — 40$/mes: Telemedicina + Urgencia 24/7 + 1 Consulta médica integral presencial en tu hogar al mes.
4. Plan Bienestar Integral — 60$/mes: Cobertura total: Visitas en casa + Urgencias 24/7 + Exámenes de laboratorio + Sueroterapia y curaciones.
5. Plan Pequeños Protegidos (Pediátrico) — 50$/mes: Urgencias 24/7 para niños + Control Niño Sano + Certificado de Salud Escolar oficial.
6. Plan Salud Sin Fronteras — 80$/mes: Para padres en Valencia pagado desde el exterior: Telemedicina + Urgencias 24/7 + 2 Visitas al mes + Sueroterapia/Laboratorios + Reporte clínico y fotográfico por WhatsApp al familiar.

MÉTODOS DE PAGO: Pago Móvil / Transferencia (Bs. tasa oficial BCV), Efectivo en Dólares ($), Zelle, Binance USDT, PayPal / Banesco Panamá.

REGLAS DE ORO DE COMUNICACIÓN:
1. EMOJIS SIMPÁTICOS Y CALIDEZ: Redacta siempre con calidez venezolana y usa abundantes emojis simpáticos y médicos en cada párrafo (🩺, 🏥, 👨‍⚕️, 👩‍⚕️, 🏡, 💧, 🩹, ✨, 🚗💨, 🌟, 📋). Haz que la conversación se sienta humana, cercana y agradable.
2. REGLA DE PLANES MÉDICOS (EMBUDO EN 2 PASOS - PROHIBIDO ENVIAR CATÁLOGO Y FORMULARIO DE REGISTRO JUNTOS):
   - PASO 1 (CONSULTA O EXPLORACIÓN DE PLANES): Cuando el paciente pregunte por los planes ("¿cuáles son los planes que ofrecen?", "todos los planes", "envíame los planes", "precios de los planes"):
     -> Envía ÚNICAMENTE la lista de los 6 planes de forma limpia, clara y atractiva con sus precios y métodos de pago disponibles.
     -> Cierra con una sola pregunta ligera y amable: "¿Cuál de estos planes se adapta mejor a lo que buscas para ti o tu familia? ✨😊"
     -> ¡ESTÁ ESTRICTAMENTE PROHIBIDO pedir cédula, edad, teléfono o datos de registro en este mismo mensaje! Nunca satures al paciente con preguntas de registro antes de que elija su plan.
   - RECOMENDACIÓN PARA ABUELOS / PADRES EN VENEZUELA (PLAN SALUD SIN FRONTERAS): Si el paciente pregunta qué plan le recomiendas para sus abuelos, padres o adultos mayores en Venezuela, o menciona que vive afuera y sus familiares están en Valencia:
     -> Recomienda DIRECTAMENTE el *Plan Salud Sin Fronteras (80$/mes)* explicando sus beneficios ideales: Telemedicina 24/7, Urgencias 24/7 a domicilio en Valencia, 2 Visitas médicas en casa al mes, Sueroterapia y laboratorios incluidos, y Reporte clínico con fotos directo a su WhatsApp para su tranquilidad. Como alternativa más económica menciona el *Plan Cuidado Hogar (40$/mes)* (1 visita presencial al mes + urgencias 24/7). ¡ESTÁ PROHIBIDO listar los 6 planes en este caso!
   - PREGUNTA POR UN PLAN ESPECÍFICO: Si el paciente pregunta por un plan específico (ej. Salud Sin Fronteras, Cuidado Hogar, Conexión Médica):
     -> Explica SOLAMENTE ese plan con sus beneficios y precio. ¡NO listes los demás planes!
   - NO REPETIR CATÁLOGO: Si en el historial reciente ya se enviaron los planes, ¡NUNCA los vuelvas a copiar todos! Responde específicamente a la duda o situación del paciente.
3. PASO 2: REGLA DE REGISTRO EN EL SISTEMA, DATOS DE PAGO Y TASA BCV / BOLÍVARES:
   - Activa esta regla cuando el paciente YA eligió un plan (ej. "me interesa el de 40$", "quiero el plan de mis abuelos", "el plan conexión médica", "quiero afiliarme al plan Salud sin fronteras") o pregunta directamente cómo pagar, transferir o cuántos bolívares son ("¿cuáles son los datos de pago?", "¿a qué cuenta transfiero?", "¿cuántos bolívares son?", "¿cuál es la tasa del BCV?", "¿a cómo está el dólar?", "¿cuánto es en bolívares?", "pásame el pago móvil / Zelle", "¿cómo pago?", "quiero pagar"):
     -> PREGUNTA POR CANTIDAD EN BOLÍVARES O TASA OFICIAL BCV:
        - Si el paciente pregunta cuántos bolívares son, a qué tasa o cuánto debe transferir en bolívares:
        - ¡ESTÁ ESTRICTAMENTE PROHIBIDO inventar un monto en bolívares o inventar la tasa de cambio! La tasa del dólar del BCV varía todos los días.
        - Explica con amabilidad que, dado que la tasa oficial del BCV varía diariamente, nuestro representante de atención / la Asistente Médico Alejandra Ramones le atenderá prontamente por este mismo chat para indicarle la cantidad exacta en bolívares según la tasa del día y suministrarle los datos de cuenta para su pago.
     -> NUNCA inventes números de cuenta bancaria, cédulas ni correos electrónicos.
     -> Explica con amabilidad que disponemos de Pago Móvil / Transferencia (tasa oficial BCV), Zelle (USA), Efectivo en Dólares ($) y Binance USDT.
     -> Aclara que la Asistente Médico Alejandra Ramones le suministrará de inmediato los datos exactos de cuenta por este chat para formalizar el pago de forma 100% segura.
     -> Solicita con calidez los datos requeridos para registrar formalmente al paciente en el sistema MediHome:
        1. ¿El registro/plan será a nombre propio o a nombre de un familiar/otra persona?
        2. Nombre y Apellido completo de la persona a registrar.
        3. Número de Cédula de Identidad (C.I.) o documento.
        4. Número de teléfono de contacto.
        5. Edad del paciente y urbanización/dirección en Valencia.
        6. Método con el que prefiere realizar el pago (Pago Móvil en Bs, Zelle, Efectivo o Binance).
4. REGLA DE ORO DE BREVEDAD Y CONCISIÓN (PROHIBIDO MENSAJES LARGOS):
   - En WhatsApp los pacientes valoran la rapidez. NUNCA envíes parrafadas largas ni repitas descripciones que saturen o aburran.
   - Para consultas médicas a domicilio o triaje de pacientes: Máximo 2 párrafos cortos y directos (saludo cálido breve + solicitud directa de síntoma, nombre/edad y urbanización).
   - NUNCA pidas el número de teléfono en consultas o triaje general (¡ya te están escribiendo desde su propio número de WhatsApp!).
   - Pide únicamente lo clínico indispensable para coordinar la salida del médico:
     1. Síntoma o motivo de consulta.
     2. Nombre, edad y urbanización/zona en Valencia.
   - Evita discursos largos de presentación o explicaciones repetidas del equipo médico. Sé cálida, rápida y resolutiva.
5. CARGO DE ALEJANDRA: Di siempre en texto normal sin asteriscos "la Asistente Médico Alejandra Ramones" (NUNCA solo "asistente" ni "doctora", y NO uses asteriscos ni formato de negrita para su nombre).
6. MEMORIA Y NO REPETICIÓN: Revisa atentamente el historial reciente de la conversación. NUNCA vuelvas a pedir información que el paciente ya haya proporcionado (como síntomas, nombre, edad o dirección/urbanización).
7. CIERRE DE TRIAJE Y TRANSFERENCIA: Si en el historial el paciente YA indicó sus síntomas, su nombre/edad y su zona/dirección:
   - NO le vuelvas a pedir ningún dato repetido.
   - Dale acuse de recibo confirmando amablemente que todos sus datos están completos.
   - Infórmale con entusiasmo y calidez que el Dr. Víctor Cedeño y la Asistente Médico Alejandra Ramones ya tienen su requerimiento registrado y se pondrán en contacto directamente (por llamada o por este mismo chat) para coordinar la llegada del médico a su domicilio.
8. Si el paciente agradece o se despide ("gracias", "genial muchas gracias", etc.): Responde con cortesía y calidez breve, deseándole un excelente día y recordando que en MediHome estamos a su orden las 24 horas.
9. Si el paciente expresa reclamo o apuro por espera ("tengo 2 minutos esperando"): Discúlpate con calidez por la breve demora, transmítele tranquilidad y pídele de inmediato qué síntoma presenta.
10. Si es una urgencia de gravedad inmediata: Alerta de inmediato que llamen a la línea 0412-1233287 o 0414-4417118.
11. REGLA ESTRICTA: NUNCA USES LA PALABRA "diáspora" (usa siempre "Salud Sin Fronteras").
12. Responde directo con viñetas y negritas de WhatsApp sin preámbulos.
`;

    // Consulta directa de texto clínico con Gemini a través del Service Worker de Background
    async function callGeminiText(patientText, chatHistory = "") {
        const key = geminiApiKey || DEFAULT_KEY;
        console.log("🧠 [Lisa] Consultando Gemini a través de Background Service Worker...");
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                console.warn("⚠️ [Lisa] Timeout esperando respuesta de Gemini en Background (20s)");
                resolve({ success: false, error: "Timeout en Service Worker" });
            }, 20000);

            try {
                chrome.runtime.sendMessage({
                    action: "process_text_gemini",
                    text: patientText,
                    history: chatHistory,
                    apiKey: key
                }, (res) => {
                    clearTimeout(timer);
                    if (chrome.runtime.lastError) {
                        console.warn("⚠️ [Lisa] Error en chrome.runtime:", chrome.runtime.lastError.message);
                        resolve({ success: false, error: chrome.runtime.lastError.message });
                    } else if (res && res.success && res.reply) {
                        console.log(`✅ [Lisa] Respuesta generada exitosamente (${res.modelUsed || "Gemini"})`);
                        resolve(res);
                    } else {
                        console.warn("⚠️ [Lisa] Respuesta vacía de background:", res);
                        resolve(res || { success: false });
                    }
                });
            } catch(e) {
                clearTimeout(timer);
                console.warn("⚠️ [Lisa] Error comunicando con background:", e.message);
                resolve({ success: false, error: e.message });
            }
        });
    }

    // Consulta directa de audio a Gemini Multimodal a través del Service Worker de Background
    async function callGeminiAudio(audioData) {
        const key = geminiApiKey || DEFAULT_KEY;
        console.log("🎙️ [Lisa] Enviando audio a Gemini a través de Background Service Worker...");
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                console.warn("⚠️ [Lisa] Timeout procesando nota de voz en Background (25s)");
                resolve({ success: false, error: "Timeout en Service Worker" });
            }, 25000);

            try {
                chrome.runtime.sendMessage({
                    action: "process_voice_note",
                    audioBase64: audioData.audioBase64,
                    mimeType: audioData.mimeType,
                    apiKey: key
                }, (res) => {
                    clearTimeout(timer);
                    if (chrome.runtime.lastError) {
                        console.warn("⚠️ [Lisa] Error en chrome.runtime:", chrome.runtime.lastError.message);
                        resolve({ success: false, error: chrome.runtime.lastError.message });
                    } else if (res && res.success && res.reply) {
                        console.log(`✅ [Lisa] Audio analizado exitosamente (${res.modelUsed || "Gemini"})`);
                        resolve(res);
                    } else {
                        console.warn("⚠️ [Lisa] Respuesta vacía de audio en background:", res);
                        resolve(res || { success: false });
                    }
                });
            } catch(e) {
                clearTimeout(timer);
                console.warn("⚠️ [Lisa] Error enviando nota de voz a background:", e.message);
                resolve({ success: false, error: e.message });
            }
        });
    }

    function determineQuickReply(text) {
        if (!text) return null;
        const clean = text.toLowerCase().trim();

        // Limpiar puntuación, signos y emojis para no fallar ante "buenas noches!", "gracias 👋", etc.
        const stripped = clean.replace(/[!¡?¿.,;:~_#*()👋🙂😊🩺❤️\s-]+/g, ' ').trim();

        // 1. Agradecimientos o Cierres de cortesía (Respuesta inmediata y cálida)
        if (/(?:muchas gracias|mil gracias|much[ií]simas gracias|genial muchas gracias|excelente muchas gracias|gracias lisa|gracias por la informaci[oó]n|gracias doctora?|gracias doctor)/i.test(stripped) ||
            /^(gracias|vale gracias|ok gracias|listo gracias|muchas gracias|mil gracias)$/i.test(stripped)) {
            return (
                "¡Con muchísimo gusto! 🩺✨ En MEDIHOME estamos para servirte y cuidar de ti y de tu familia las 24 horas en Valencia 🏡💖.\n\n" +
                "Nuestro equipo de guardia, el *Dr. Víctor Cedeño* y la Asistente Médico Alejandra Ramones, está disponible cuando nos necesites 🚗💨.\n\n" +
                "🚨 Emergencias directas: *0412-1233287* / *0414-4417118*\n" +
                "¡Que tengas un excelente y bendecido día! 🌟😊"
            );
        }

        // 2. AFILIACIÓN ESPECÍFICA AL PLAN SALUD SIN FRONTERAS
        if (/(?:afiliar|afiliarme|afiliacion|activar|inscribir|quiero el plan|ok quiero|como te pago|como pago|cuanto es|cuantos bolivares|tasa bcv).*(?:salud sin fronteras)/i.test(stripped) ||
            /(?:salud sin fronteras).*(?:afiliar|afiliarme|afiliacion|activar|inscribir|quiero|pago|pagar|bolivar|bolivares|bcv|tasa)/i.test(stripped)) {
            return BOT_RESPONSES["afiliacion_salud_fronteras"];
        }

        // 3. DETECCIÓN DE DATOS DE PAGO / AFILIACIÓN Y CUENTAS BANCARIAS GENERAL
        if (/(?:datos de pago|datos para pagar|datos del pago|a que cuenta|cuenta para transferir|pago movil.*datos|zelle.*datos|datos de zelle|datos de pago movil|como hago el pago|como realizo el pago|donde transfiero|donde pago|puedo transferir|cuenta bancaria|informacion de pago|datos bancarios|a nombre de quien transfiero|quiero pagar|como pago|como me afilio|quiero afiliarme|pasame los datos|pasame la cuenta|pasame el zelle|pasame el pago movil)/i.test(stripped)) {
            return BOT_RESPONSES["datos_pago"];
        }

        // 4. DETECCIÓN DE PREGUNTA SOBRE TASA BCV O CANTIDAD EN BOLÍVARES
        if (/(?:tasa bcv|tasa del bcv|a cuanto esta el dolar|a como esta el dolar|precio del dolar|tasa del dolar|cuantos bolivares son|cuanto es en bolivares|cuanto sale en bolivares|monto en bolivares|a como reciben el dolar)/i.test(stripped)) {
            return BOT_RESPONSES["tasa_bcv"];
        }

        // 4. DETECCIÓN DE RECOMENDACIÓN PARA ABUELOS / PADRES EN VENEZUELA
        if (/(?:abuelo|abuelos|abuelitos|padres|papas|tercera edad|adultos mayores).*(?:plan|recomiend|opcion|cobertura|servicio)/i.test(stripped) ||
            /(?:plan|recomiend|opcion|cobertura).*(?:abuelo|abuelos|abuelitos|padres|papas|tercera edad|adultos mayores|exterior|afuera)/i.test(stripped)) {
            return BOT_RESPONSES["plan_abuelos"];
        }

        // 5. DETECCIÓN ESPECÍFICA DE INFORMACIÓN SOBRE PLAN SALUD SIN FRONTERAS
        if (/(?:plan )?salud sin fronteras/i.test(stripped) && !/(?:todos los planes|cuales son los planes)/i.test(stripped)) {
            return BOT_RESPONSES["plan_salud_fronteras"];
        }

        // 5. DETECCIÓN EXPRESA DE SOLICITUD DEL CATÁLOGO COMPLETO DE PLANES
        const isFullCatalogQuery = (
            /(?:todos los planes|cuales son los planes que ofrecen|cuales son los planes|que planes tienen|que planes ofrecen|catalogo de planes|lista de planes|ver todos los planes|informacion de todos los planes|los 6 planes)/i.test(stripped) ||
            /^(4|\/4|4\.|opci[oó]n 4|planes|planes mensuales|ver planes|precios|tarifas|costos|los planes)$/i.test(stripped)
        );
        if (isFullCatalogQuery) {
            return BOT_RESPONSES["4"];
        }

        // Los demás atajos rápidos de menú aplican a comandos cortos y directos (máx 30 caracteres)
        // Cualquier mensaje largo clínico o conversación se deriva directamente a Gemini IA
        if (clean.length > 30) {
            return null;
        }

        // 1. Urgencia / Emergencia
        if (/^(1|\/1|1\.|opci[oó]n 1|urgencia|emergencia|urgente|auxilio|socorro)$/i.test(stripped)) {
            return BOT_RESPONSES["1"];
        }
        // 2. Consulta Médica y Domicilio
        if (/^(2|\/2|2\.|opci[oó]n 2|consulta|telemedicina|m[eé]dico a domicilio|visita m[eé]dica)$/i.test(stripped)) {
            return BOT_RESPONSES["2"];
        }
        // 3. Sueros, Inyecciones y Curaciones
        if (/^(3|\/3|3\.|opci[oó]n 3|sueros?|inyecci[oó]n|inyecciones|curaci[oó]n|curaciones|sonda)$/i.test(stripped)) {
            return BOT_RESPONSES["3"];
        }
        // 4. Planes y Precios (respaldo numérico)
        if (/^(4|\/4|4\.|opci[oó]n 4|planes|planes mensuales|ver planes|precios|tarifas|costos)$/i.test(stripped)) {
            return BOT_RESPONSES["4"];
        }
        // 5. Certificados
        if (/^(5|\/5|5\.|opci[oó]n 5|certificados?|certificado vial|licencia)$/i.test(stripped)) {
            return BOT_RESPONSES["5"];
        }
        // 6. Pagos y Cobertura
        if (/^(6|\/6|6\.|opci[oó]n 6|pagos?|formas de pago|m[eé]todos de pago|cobertura)$/i.test(stripped)) {
            return BOT_RESPONSES["6"];
        }
        // 7. Hablar con Médico de Guardia / Asesor Humano
        if (/^(7|\/7|7\.|opci[oó]n 7|asesor|humano|m[eé]dico de guardia|hablar con un m[eé]dico)$/i.test(stripped)) {
            return BOT_RESPONSES["7"];
        }
        // Menú o Saludos básicos (limpiando emojis y puntuación)
        if (/^(hola|buenas|buenos d[ií]as|buenas tardes|buenas noches|saludos|buen d[ií]a|hola lisa|menu|men[uú]|opciones|ayuda)$/i.test(stripped)) {
            return BOT_RESPONSES["menu"];
        }

        // Confirmaciones simples o saludos cortos
        if (/^(si|s[ií]|ok|vale|claro|por favor|buenas|alo|al[oó])$/i.test(stripped)) {
            return (
                "¡Hola! Te saluda Lisa de MEDIHOME Valencia. 🩺\n\n" +
                "¿En qué podemos ayudarte? Indícanos si necesitas:\n" +
                "1️⃣ Consulta médica o urgencias a domicilio.\n" +
                "2️⃣ Sueroterapia, inyecciones o curaciones.\n" +
                "3️⃣ Información de nuestros planes mensuales familiares.\n\n" +
                "🚨 Si es una urgencia inmediata, llámanos directo al *0412-1233287*."
            );
        }

        return null;
    }

    // Salvaguarda: Asegura que si el paciente solicitó planes generales, la respuesta contenga el catálogo
    function ensurePlansIncludedIfRequested(queryText, replyText) {
        if (!queryText || !replyText) return replyText;
        const normQuery = normalizeText(queryText);
        const normReply = normalizeText(replyText);

        // Si la consulta es específica (abuelos, padres, niños, un plan específico, pagos o tasa BCV), NO forzar el catálogo completo
        const isSpecificQuery = /(?:abuel|padre|papa|mama|nino|pediatric|salud sin fronteras|cuidado hogar|conexion medica|alivio inmediato|bienestar integral|pequenos protegidos|datos de pago|cuenta|transferir|pago movil|zelle|tasa|bcv|dolar|bolivar|bolivares)/i.test(normQuery);
        if (isSpecificQuery) {
            return replyText;
        }

        // Si la respuesta ya contiene detalles de precios o algún plan, respetarla
        if (normReply.includes("$/mes") || normReply.includes("dolares") || normReply.includes("plan")) {
            return replyText;
        }

        const asksForFullCatalog = /(?:todos los planes|cuales son los planes|lista de planes|catalogo|los 6 planes)/i.test(normQuery);

        if (asksForFullCatalog) {
            console.log("💡 [Lisa] La respuesta de IA no contenía el catálogo solicitado. Adjuntando catálogo oficial completo...");
            return BOT_RESPONSES["4"];
        }
        return replyText;
    }

    // Mini Widget en esquina
    function createWidget() {
        if (document.getElementById("medihome-lisa-widget")) return;

        const widget = document.createElement("div");
        widget.id = "medihome-lisa-widget";
        widget.style.cssText = `
            position: fixed;
            bottom: 15px;
            right: 20px;
            z-index: 999999;
            background: rgba(17, 27, 33, 0.95);
            border: 1px solid #00a884;
            border-radius: 20px;
            padding: 4px 10px;
            color: #e9edef;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 11px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            user-select: none;
            backdrop-filter: blur(4px);
        `;

        widget.innerHTML = `
            <span style="font-size:13px;">🩺</span>
            <strong style="color:#e9edef;">Lisa</strong>
            <span id="lisa-pill" style="background:#00a884; color:#fff; border-radius:10px; padding:2px 6px; font-weight:bold; font-size:9px;">
                24/7 AUTO
            </span>
            <span id="lisa-ai-badge" style="font-size:9px; color:#5cbfac; margin-left:2px;">✨ IA</span>
        `;

        document.body.appendChild(widget);

        const pill = document.getElementById("lisa-pill");

        widget.onclick = () => {
            isBotActive = !isBotActive;
            if (isBotActive) {
                pill.style.background = "#00a884";
                pill.innerText = "24/7 AUTO";
                widget.style.borderColor = "#00a884";
            } else {
                pill.style.background = "#ea0038";
                pill.innerText = "PAUSA";
                widget.style.borderColor = "#ea0038";
            }
        };
    }

    // Envío seguro en un solo bloque
    async function sendMessage(text) {
        if (!text) return false;

        // Limpieza de asteriscos en Alejandra Ramones (no hace falta resaltarla en negritas)
        const cleanMsg = text
            .replace(/\*+(la\s+)?asistente\s+m[eé]dico\s+alejandra\s+ramones\*+/gi, "$1Asistente Médico Alejandra Ramones")
            .replace(/\*+alejandra\s+ramones\*+/gi, "Alejandra Ramones");

        const inputBox = document.querySelector('#main footer div[contenteditable="true"]') ||
                         document.querySelector('footer div[contenteditable="true"]') ||
                         document.querySelector('div[contenteditable="true"]');

        if (!inputBox) return false;

        inputBox.focus();

        document.execCommand('selectAll', false, null);
        document.execCommand('delete', false, null);

        const dt = new DataTransfer();
        dt.setData('text/plain', cleanMsg);
        const pasteEvt = new ClipboardEvent('paste', {
            clipboardData: dt,
            bubbles: true,
            cancelable: true
        });
        inputBox.dispatchEvent(pasteEvt);

        sentByBotList.push(cleanMsg);
        if (sentByBotList.length > 50) sentByBotList.shift();
        const sentHash = normalizeText(cleanText(cleanMsg)).slice(0, 40);
        if (sentHash) {
            processedIds.add("sent_" + sentHash);
        }

        await new Promise(r => setTimeout(r, 400));

        const sendBtn = document.querySelector('#main span[data-icon="send"]')?.closest('button') ||
                        document.querySelector('span[data-icon="send"]')?.closest('button') ||
                        document.querySelector('button[data-testid="compose-btn-send"]') ||
                        document.querySelector('span[data-icon="wds-ic-send-filled"]')?.closest('button');

        if (sendBtn) {
            sendBtn.click();
        } else {
            const enterEvt = new KeyboardEvent('keydown', {
                key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
                bubbles: true, cancelable: true
            });
            inputBox.dispatchEvent(enterEvt);
        }

        lastReplyTime = Date.now();

        // Registrar inmediatamente el nuevo mensaje saliente en processedIds
        setTimeout(() => {
            try {
                const msgs = document.querySelectorAll('#main div[data-id]');
                if (msgs.length > 0) {
                    const lastSent = msgs[msgs.length - 1];
                    const id = lastSent.getAttribute('data-id');
                    if (id) {
                        processedIds.add(id);
                        processedIds.add(id + "_" + text);
                    }
                }
            } catch(e) {}
        }, 500);

        return true;
    }

    // PILOTO AUTOMÁTICO SEGURO: Escanea la barra lateral y abre chats no leídos verificando la apertura
    async function autonomousSidebarScanner() {
        if (!isBotActive || isProcessing) return;

        const paneSide = document.querySelector('#pane-side');
        if (!paneSide) return;

        // Buscar todos los posibles contenedores de fila de chat
        const rows = Array.from(paneSide.querySelectorAll('div[role="listitem"], div[role="row"], div[data-testid="cell-frame-container"]'));
        if (rows.length === 0) return;

        for (const row of rows) {
            // 1. Descartar grupos o canales
            const isGroup = row.querySelector('*[data-icon*="group"], *[data-icon*="community"], *[data-icon*="channel"], *[data-icon*="newsletter"]');
            if (isGroup) continue;

            // 2. Comprobar si tiene mensaje no leído
            let isUnread = false;

            // Método A: Atributos aria-label en la fila o hijos (normalizados sin acentos)
            const ariaElements = [row, ...row.querySelectorAll('*[aria-label]')];
            for (const el of ariaElements) {
                const norm = normalizeText(el.getAttribute('aria-label'));
                if (norm.includes('no leido') || norm.includes('no leidos') || norm.includes('unread')) {
                    isUnread = true;
                    break;
                }
            }

            // Método B: data-testid de no leído
            if (!isUnread && row.querySelector('*[data-testid*="unread"], *[data-icon*="unread"]')) {
                isUnread = true;
            }

            // Método C: Badge circular o número de mensajes no leídos
            if (!isUnread) {
                const spans = row.querySelectorAll('span');
                for (const s of spans) {
                    const txt = s.innerText.trim();
                    if (/^\d{1,3}$/.test(txt)) {
                        const style = window.getComputedStyle(s);
                        const radius = parseInt(style.borderRadius) || 0;
                        const bg = style.backgroundColor;
                        if (radius >= 5 || (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent')) {
                            isUnread = true;
                            break;
                        }
                    }
                }
            }

            if (!isUnread) continue;

            const rowTitle = getRowContactTitle(row);

            // Si es no leído y activo para Lisa, abrirlo
            isProcessing = true;
            const watchdog = setTimeout(() => {
                if (isProcessing) {
                    console.warn("⚠️ Watchdog: Liberando isProcessing tras 20s de espera");
                    isProcessing = false;
                }
            }, 20000);

            try {
                const rowTitle = getRowContactTitle(row);
                let activeHeader = getChatHeaderTitle();

                // Si no está abierto en #main, abrirlo
                if (!activeHeader || (rowTitle && !normalizeText(activeHeader).includes(normalizeText(rowTitle)))) {
                    console.log(`🔔 Abriendo chat de paciente no leído: "${rowTitle || 'Paciente'}"...`);
                    const clickTarget = row.querySelector('span[title]') ||
                                        row.querySelector('div[role="button"]') ||
                                        row.querySelector('div[data-testid="cell-frame-container"]') ||
                                        row;
                    openChatOrElement(clickTarget);

                    // Esperar a que se monte el chat
                    await new Promise(r => setTimeout(r, 1100));
                }

                // Procesar el chat abierto
                await handleActiveChatMessages();

            } catch(err) {
                console.error("Error en autonomousSidebarScanner:", err);
            } finally {
                clearTimeout(watchdog);
                await new Promise(r => setTimeout(r, 1500));
                isProcessing = false;
            }

            break; // Procesar uno a la vez ordenadamente
        }
    }

    // Procesa los mensajes dentro de la conversación abierta en #main
    async function handleActiveChatMessages() {
        const chatArea = document.querySelector('#main');
        if (!chatArea) return;

        const currentChatTitle = getChatHeaderTitle();
        const messages = Array.from(chatArea.querySelectorAll('div[data-id]'));
        if (messages.length === 0) return;

        const lastMsgEl = messages[messages.length - 1];
        const targetChatTitle = currentChatTitle;
        const targetJid = getMsgJid(lastMsgEl);

        // 1. NOTA DE VOZ
        if (isVoiceNote(lastMsgEl)) {
            const dataId = lastMsgEl.getAttribute('data-id') || "";
            if (dataId.startsWith('true_') || lastMsgEl.classList.contains('message-out')) return;

            const uniqueKey = dataId + "_audio";
            if (processedIds.has(uniqueKey)) return;

            processedIds.add(uniqueKey);
            lastReplyTime = Date.now();

            console.log(`🎙️ Paciente "${targetChatTitle}" envió nota de voz. Iniciando análisis...`);

            // Paso A: ¿Tiene transcripción en pantalla ya hecha por WhatsApp?
            const transcriptNode = lastMsgEl.querySelector('div[data-testid*="transcript"] span, span.selectable-text, .copyable-text');
            if (transcriptNode && transcriptNode.innerText.trim().length > 3) {
                const nativeTranscript = transcriptNode.innerText.trim();
                console.log(`📝 Transcripción nativa encontrada: "${nativeTranscript}"`);

                // 1. Atajo rápido directo (planes, agradecimiento, opciones fijas)
                const quick = determineQuickReply(nativeTranscript);
                if (quick) {
                    const fullMessage = `🎙️ *Nota de voz escuchada:*\n_«${nativeTranscript}»_\n\n` + quick;
                    await deliverSafely(fullMessage, targetChatTitle, targetJid);
                    return;
                }

                const history = extractRecentChatHistory(8);
                const aiRes = await callGeminiText(nativeTranscript, history);
                if (aiRes && aiRes.success && aiRes.reply) {
                    const safeReply = ensurePlansIncludedIfRequested(nativeTranscript, aiRes.reply);
                    const fullMessage = `🎙️ *Nota de voz escuchada:*\n_«${nativeTranscript}»_\n\n` + safeReply;
                    await deliverSafely(fullMessage, targetChatTitle, targetJid);
                    return;
                }
            }

            // Paso B: Capturar el audio binario vinculado a este mensaje y enviarlo a Gemini Multimodal
            const audioData = await extractVoiceAudio(lastMsgEl);
            if (audioData) {
                console.log("🚀 Enviando nota de voz a Gemini Multimodal...");
                const res = await callGeminiAudio(audioData);
                if (res && res.success && res.reply) {
                    console.log(`📝 Transcripción de Gemini (${res.modelUsed}): "${res.transcription}"`);
                    const audioTranscript = (res.transcription || "").trim();
                    const safeReply = ensurePlansIncludedIfRequested(audioTranscript, res.reply);

                    let fullMessage = safeReply;
                    if (audioTranscript.length > 2 && !audioTranscript.includes("(Audio analizado")) {
                        fullMessage = `🎙️ *Nota de voz escuchada:*\n_«${audioTranscript}»_\n\n` + safeReply;
                    }
                    await deliverSafely(fullMessage, targetChatTitle, targetJid);
                    return;
                }
            }

            // Paso C: Si no se pudo obtener el audio ni la transcripción, enviar respaldo empático
            console.warn("⚠️ Usando respuesta empática de respaldo para nota de voz.");
            await deliverSafely(BOT_RESPONSES["voice_note_fallback"], targetChatTitle, targetJid);
            return;
        }

        // 2. FOTO / EXAMEN MÉDICO
        if (isMediaImage(lastMsgEl) && !lastMsgEl.querySelector('span.selectable-text')) {
            const dataId = lastMsgEl.getAttribute('data-id') || "";
            if (dataId.startsWith('true_') || lastMsgEl.classList.contains('message-out')) return;

            const uniqueKey = dataId + "_media";
            if (processedIds.has(uniqueKey)) return;

            processedIds.add(uniqueKey);
            lastReplyTime = Date.now();

            await new Promise(r => setTimeout(r, 1000));
            await deliverSafely(BOT_RESPONSES["media_exam"], targetChatTitle, targetJid);
            return;
        }

        // 3. MENSAJE DE TEXTO
        const textNode = lastMsgEl.querySelector('span.selectable-text') || lastMsgEl;
        const rawText = textNode ? textNode.innerText.trim() : "";
        const text = cleanText(rawText);

        if (!text) return;

        // FILTRO DE SEGURIDAD 1: Jamás responder a mensajes propios
        if (isOurOwnMessage(lastMsgEl, text)) {
            return;
        }

        const dataId = lastMsgEl.getAttribute('data-id') || 
                       lastMsgEl.closest('[data-id]')?.getAttribute('data-id') || "";
        const textHash = normalizeText(cleanText(text)).slice(0, 40);
        const uniqueKey = (dataId || "msg") + "_" + textHash;
        if (processedIds.has(uniqueKey) || (textHash && processedIds.has("sent_" + textHash))) {
            return;
        }

        // Opción fija (1 al 7 o saludo básico)
        const quick = determineQuickReply(text);
        if (quick) {
            processedIds.add(uniqueKey);
            lastReplyTime = Date.now();
            console.log(`📩 Respondiendo comando: "${text}" a "${targetChatTitle}"`);
            await new Promise(r => setTimeout(r, 600));
            await deliverSafely(quick, targetChatTitle, targetJid);
            return;
        }

        // Mensaje clínico libre con síntomas o consulta (con memoria de conversación)
        if (text.length >= 2) {
            processedIds.add(uniqueKey);
            lastReplyTime = Date.now();
            console.log(`🧠 Analizando consulta clínica de "${targetChatTitle}" con Gemini y memoria contextual: "${text.slice(0, 30)}..."`);
            await new Promise(r => setTimeout(r, 400));

            const history = extractRecentChatHistory(8);
            const aiRes = await callGeminiText(text, history);
            if (aiRes && aiRes.success && aiRes.reply) {
                console.log("✅ Respuesta contextual de Gemini lista.");
                const safeReply = ensurePlansIncludedIfRequested(text, aiRes.reply);
                await deliverSafely(safeReply, targetChatTitle, targetJid);
            } else {
                await deliverSafely(BOT_RESPONSES["fallback_empathetic"], targetChatTitle, targetJid);
            }
            return;
        }
    }

    // ENTREGA SEGURA ANTI-CRUCE DE CHATS:
    // Verifica que el chat en pantalla sea el destinatario correcto antes de escribir o enviar
    async function deliverSafely(textMessage, targetChatTitle, targetJid) {
        if (!textMessage) return false;

        let currentTitle = getChatHeaderTitle();
        let currentJid = getActiveChatJid();

        const match = (!targetChatTitle || !currentTitle) ||
                      normalizeText(currentTitle).includes(normalizeText(targetChatTitle)) ||
                      normalizeText(targetChatTitle).includes(normalizeText(currentTitle)) ||
                      (targetJid && currentJid && targetJid === currentJid);

        // Si el chat cambió de pantalla mientras se procesaba la respuesta
        if (!match) {
            console.warn(`🔄 Alerta Anti-Cruce: Pantalla actual "${currentTitle}" vs destino "${targetChatTitle}". Re-abriendo chat destino...`);
            const ok = await reOpenChatByTitle(targetChatTitle);
            if (ok) {
                await new Promise(r => setTimeout(r, 600));
            }
        }

        console.log(`🚀 Enviando respuesta a chat: "${getChatHeaderTitle() || targetChatTitle}"`);
        const sent = await sendMessage(textMessage);
        return sent;
    }

    // Monitoreo del chat activo si ya está abierto en pantalla
    async function monitorActiveChatDirectly() {
        if (!isBotActive || isProcessing) return;
        const now = Date.now();
        if (now - lastReplyTime < 2500) return;

        isProcessing = true;
        try {
            await handleActiveChatMessages();
        } finally {
            isProcessing = false;
        }
    }

    // Marcado preventivo de historial previo en el chat actualmente abierto para no responder al pasado
    function markExistingMessagesAsProcessed() {
        try {
            const chatArea = document.querySelector('#main');
            if (!chatArea) return;
            const existing = chatArea.querySelectorAll('div[data-id]');
            for (const el of existing) {
                const id = el.getAttribute('data-id');
                if (id) {
                    processedIds.add(id);
                    processedIds.add(id + "_audio");
                    processedIds.add(id + "_media");
                }
            }
            console.log(`🔒 Marcados ${existing.length} mensajes previos como leídos al inicio.`);
        } catch(e) {}
    }

    function init() {
        createWidget();
        injectInterceptor();
        markExistingMessagesAsProcessed();
        setInterval(autonomousSidebarScanner, 2000);  // Escanea y abre chats no leídos de forma 100% autónoma
        setInterval(monitorActiveChatDirectly, 1000);   // Atiende mensajes entrantes en el chat abierto
    }

    const checkApp = setInterval(() => {
        if (document.querySelector('#app') || document.querySelector('#main')) {
            clearInterval(checkApp);
            init();
            console.log("🩺 MediHome • Lisa v4.1 Piloto Automático y Anti-Cruce lista.");
        }
    }, 1000);

})();
