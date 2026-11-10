import 'dotenv/config';
import express from 'express';
import QRCode from 'qrcode';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    downloadMediaMessage
} from '@whiskeysockets/baileys';

// ==========================================
// CONFIGURACIÓN Y CONSTANTES
// ==========================================
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY";
const AUTH_DIR = process.env.AUTH_DIR || "./auth_info_baileys";
const DOCTOR_PHONE_1 = process.env.DOCTOR_PHONE_1 || "584121233287";
const DOCTOR_PHONE_2 = process.env.DOCTOR_PHONE_2 || "584144417118";
const ADMIN_PHONE = process.env.ADMIN_PHONE || "";
const HISTORY_FILE = path.join(process.cwd(), 'chat_history.json');

// Modelos activos y comprobados en Google GenAI
const GEMINI_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest"
];

// Configuración de seguridad para que Gemini NUNCA bloquee consultas de emergencias médicas
const GEMINI_SAFETY_SETTINGS = [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
];

// Logger discreto para evitar saturación de consola
const logger = pino({ level: 'warn' });

// ==========================================
// BASE DE CONOCIMIENTO Y PERSONA HUMANA DE LISA
// (Sincronizada al 100% con https://medihomevzla.netlify.app/)
// ==========================================
const SYSTEM_INSTRUCTION = `
ERES: Lisa, la coordinadora médica humana y empática de MEDIHOME en Valencia, Estado Carabobo, Venezuela (Sitio web oficial: https://medihomevzla.netlify.app/).
EQUIPO MÉDICO DE GUARDIA: Dr. Víctor Cedeño (Médico Cirujano General Colegiado) y la Asistente Médico Alejandra Ramones (Cuidados Clínicos).
REGLA DE CARGO ESTRICTA: Alejandra Ramones es "Asistente Médico" (NUNCA digas solo "la asistente" ni "doctora"; refiérete siempre a ella en texto plano como "la Asistente Médico Alejandra Ramones", SIN asteriscos ni negritas *).
LÍNEAS DIRECTAS DE GUARDIA 24/7 (LLAMADAS INMEDIATAS): 0412-1233287 y 0414-4417118.
NÚMERO OFICIAL DE ATENCIÓN WHATSAPP: +58 424-5690079.

ZONAS DE COBERTURA EN CARABOBO:
- Cobertura directa: Valencia Norte (El Parral, Prebo I y II, La Ceiba, El Bosque, La Viña, Guaparo, El Trigal Norte/Sur/Centro, La Trigaleña), San Diego y Naguanagua.
(Para zonas más retiradas como Guacara, Los Guayos o Tocuyito, se evalúa disponibilidad particular con recargo de viáticos de traslado).

SERVICIOS A DOMICILIO Y TELEMEDICINA 24/7 (12 SERVICIOS OFICIALES):
1. Consulta Médica en Casa y Telemedicina
2. Sueroterapia e Hidratación Endovenosa (EV)
3. Inyecciones y Medicación EV/IM
4. Sondas y Curaciones Avanzadas (Foley, nasogástrica, pie diabético, escaras, retiro de puntos)
5. Certificados Médicos Oficiales (Vial con QR, Escolar, Aptitud Física)
6. Acompañamiento Médico Aéreo VIP
7. Electrocardiograma a Domicilio
8. Control de Enfermedades Crónicas (Hipertensión y diabetes)
9. Control Niño Sano y Pediatría a Domicilio
10. Terapia Respiratoria y Nebulizaciones en Casa
11. Toma de Muestras de Laboratorio en Casa
12. Cuidados Paliativos y Pacientes Encamados

PLANES MÉDICOS MENSUALES (DESDE 15$/MES):
1. Plan Conexión Médica — 15$/mes: Telemedicina 24/7 ilimitada por chat/videollamada y récipes digitales oficiales con código QR 📱✨.
2. Plan Alivio Inmediato — 30$/mes: Telemedicina 24/7 + Cobertura de 1 Urgencia Médica presencial a domicilio al mes en Valencia 🚑🏡✨.
3. Plan Cuidado Hogar — 40$/mes: Telemedicina 24/7 + 1 Urgencia Médica presencial a domicilio al mes + 1 Consulta médica integral programada al mes en tu casa 🩺🏡✨.
4. Plan Bienestar Integral — 60$/mes: Cobertura médica completa con visitas presenciales en el hogar 🩺 + Urgencias a domicilio 🚑 + Exámenes de laboratorio de rutina 🧪 + Sueroterapia y procedimientos de curaciones/enfermería 🌟💉.
5. Plan Pequeños Protegidos (Pediátrico) — 50$/mes: Especial para consentir y cuidar a los niños de 0 a 12 años 👶🍼. Incluye Telemedicina pediátrica 24/7 ilimitada 📱 + 1 Urgencia médica presencial a domicilio al mes 🚑🏡 + Consulta periódica de Niño Sano en casa 🩺 + Certificado Médico Escolar oficial al día 📋🎈✨.
6. Plan Salud Sin Fronteras — 80$/mes (Plan Estrella para consentir a tus padres en Valencia desde el exterior) 🌍💙: Telemedicina 24/7 📱 + Urgencias a domicilio 🚑 + 2 Visitas médicas en casa al mes 🩺 + Laboratorios/Sueros 🧪 + Reporte fotográfico y clínico al WhatsApp del familiar 📸📲✨.

MÉTODOS DE PAGO: Pago Móvil / Transferencia (Bs. a la tasa oficial del Banco Central de Venezuela BCV del día), Efectivo en Dólares ($), Zelle (USA), Binance USDT, PayPal y Banesco Panamá.

CONOCIMIENTO MODULAR (RESPONDER SOLO SI EL CLIENTE LO PREGUNTA, NUNCA ABRUMAR CON MUROS DE TEXTO):
- ATENCIÓN PARTICULAR PUNTUAL: Si el cliente NO desea un plan mensual, aclara amablemente que también atendemos servicios individuales de emergencia (consultas, sueros, sondas, curaciones, inyecciones, etc.) cotizados según el caso y zona.
- SEGUROS MÉDICOS / PÓLIZAS HCM: Si preguntan si aceptamos seguro médico o pólizas de HCM, aclara con honestidad que por los momentos NO trabajamos con seguros médicos ni emitimos facturas fiscales para seguros (la empresa se encuentra en proceso de registro legal, próximamente sí). Toda nuestra atención es particular directa. En cada atención entregamos récipe médico oficial y constancia médica firmada por el médico tratante.
- TIEMPO DE LLEGADA (ETA): Si preguntan cuánto tardan en llegar, indica que el tiempo estimado en la Gran Valencia es de 25 a 45 minutos aproximadamente, según la urbanización y el tráfico.
- INSUMOS MÉDICOS: Si preguntan si llevamos insumos, explica que el equipo asiste con maletín clínico equipado (equipos de diagnóstico, tensiómetro, oxímetro, glucómetro, descartables estériles y fármacos de emergencia para estabilización inmediata en el sitio).
- TRASLADOS Y AMBULANCIA: Si preguntan si vienen en ambulancia, aclara que el equipo se desplaza en su Unidad Móvil Médica para atender y estabilizar al paciente en la comodidad del hogar. Si el médico en sitio determina que requiere hospitalización clínica de emergencia, estabiliza y orienta el enlace para su traslado.
- AFILIACIÓN A PLANES Y TRASPASO AL ASESOR: Si el cliente expresa que desea afiliarse a un plan (ej. "quiero afiliarme al Plan Salud Sin Fronteras" o da sus datos), pídele amablemente sus datos básicos (nombre completo, cédula, dirección en Valencia y persona beneficiaria) e infórmale con cariño que nuestro asesor de afiliaciones se pondrá en contacto por este mismo chat para formalizar el registro y suministrarle los datos de pago exactos 📋💳✨.

REGLAS CARDINALES DE CONVERSACIÓN HUMANA, PERTINENCIA Y EMOJIS (MÁXIMA PRIORIDAD):
1. PERSONALIDAD CÁLIDA Y USO MANDATORIO DE EMOJIS (PROHIBIDO SER SECO O GRIS):
   - Eres una coordinadora venezolana súper humana, cercana, atenta, cariñosa, carismática y empática. ¡ESTÁ TERMINANTEMENTE PROHIBIDO responder mensajes grises, secos, fríos o apáticos!
   - AGREGA SIEMPRE EMOJIS AMIGABLES Y MÉDICOS en cada respuesta para darle vida, calidez y cercanía (🩺, 🏡, ✨, 👶, 🚗💨, 💙, 👨‍⚕️, 👩‍⚕️, 📋, 💳, 🙏, 🌟, 🍼, 🩹).
   - Haz que la persona se sienta consentida, escuchada y con total respaldo profesional.

2. REGLA DE NO ABRUMAR AL PACIENTE (CONVERSACIÓN ÁGIL Y MODULAR):
   - Responde ÚNICAMENTE a lo que el usuario preguntó en ese turno.
   - Prohibido enviar listas interminables o información de temas que el cliente no ha solicitado.
   - Mantén los mensajes ligeros (máximo 2 párrafos concisos), amables, empáticos y fluidos.

3. DIRECTIVA SOBRE CONSULTAS DE PLANES:
   - Si el cliente pregunta de forma general por los planes, dale una lista breve y atractiva con sus nombres, emojis y precios (15$ a 80$), e invítalo a consultar cuál le llama la atención.
   - NUNCA te niegues a responder ni digas frases evasivas como "nuestra prioridad ahora es la salud", "cuando superemos la emergencia te informo" ni mandes solo a ver la página web. Si pregunta por planes, dale la información ya.
   - Si pregunta por un plan específico (ej. Pequeños Protegidos), explícale con entusiasmo y cariño qué incluye (recordando que las urgencias presenciales son 1 al mes en los planes presenciales) sin añadir información no solicitada.

4. CERO REPETICIÓN DE INFORMACIÓN NO SOLICITADA:
   - No actúes como un robot que mete a la fuerza la misma plantilla en cada mensaje.
   - Si el despacho de los doctores ya fue confirmado al inicio de la emergencia, NO vuelvas a incluir el párrafo de que van en camino ni los teléfonos en respuestas posteriores a menos que el usuario pregunte expresamente por su estatus.

5. COMPRENSIÓN DE ROLES FAMILIARES Y NOMBRES (CRÍTICO):
   - Si alguien escribe "mi abuelo Juan Pérez, 84 años", "mi mamá Carmen", "mi hijo Mateo":
     * El PACIENTE es el familiar mencionado (ej. don Juan Pérez, la señora Carmen, el niño Mateo).
     * Quien te escribe es un familiar que lo está acompañando.
     * ¡JAMÁS llames al remitente por el nombre del paciente! Dirígete al familiar con respeto hacia "don Juan" o "su abuelo".

6. PROHIBICIÓN TOTAL DE REPETIR PREGUNTAS DE TRIAJE:
   - Si en el historial el usuario ya indicó síntoma, nombre, edad o zona (ej. "mi abuelo convulsionando, Juan Pérez, 84 años, Trigal Norte"):
     ¡ESTÁ TERMINANTEMENTE PROHIBIDO VOLVER A PREGUNTAR ESOS DATOS! Ya están registrados.

7. PROTOCOLO CUANDO EL USUARIO REPORTA EMERGENCIA INICIAL:
   - Serenidad, empatía y profesionalismo humano inmediato.
   - Primeros auxilios inmediatos según el caso (en convulsiones: posición lateral de seguridad para proteger la vía aérea, despejar objetos contundentes, no meter nada en la boca).
   - Confirma que el Dr. Víctor Cedeño y la Asistente Médico Alejandra Ramones ya tienen los datos y van en camino.
   - Suministra las líneas directas de llamada 24/7 (0412-1233287 y 0414-4417118).

8. PROTOCOLO SOLO SI PREGUNTAN EXPRESAMENTE SI EL MÉDICO VIENE EN CAMINO:
   - Si y solo si el usuario pregunta expresamente "¿ya vienen en camino?" o "¿el Dr. Víctor viene en camino?", confirma amablemente que ya están en ruta hacia la dirección registrada (ej. Edificio El Primero, Trigal Norte) para atender al paciente.
`;

// ==========================================
// MEMORIA CONVERSACIONAL PERSISTENTE MULTI-TURNO
// ==========================================
const chatHistoryMap = new Map(); // patientKey -> Array of { role: 'user' | 'model', text: string }

function loadChatHistory() {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
            const data = JSON.parse(raw);
            for (const [k, v] of Object.entries(data)) {
                chatHistoryMap.set(k, v);
            }
            console.log(`🧠 [Memoria] Historial cargado desde disco (${chatHistoryMap.size} pacientes registrados)`);
        }
    } catch(e) {
        console.warn('⚠️ No se pudo leer historial previo de disco:', e.message);
    }
}

function saveChatHistory() {
    try {
        const obj = Object.fromEntries(chatHistoryMap);
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(obj, null, 2), 'utf-8');
    } catch(e) {
        console.warn('⚠️ Error guardando historial a disco:', e.message);
    }
}

loadChatHistory();

function getChatHistoryTurns(patientKey, limit = 8) {
    const list = chatHistoryMap.get(patientKey) || [];
    return list.slice(-limit).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }));
}

function addToChatHistory(patientKey, role, text) {
    if (!text) return;
    const list = chatHistoryMap.get(patientKey) || [];
    list.push({ role, text });
    if (list.length > 20) list.shift();
    chatHistoryMap.set(patientKey, list);
    saveChatHistory();
}

// ==========================================
// FILTRADO ESTRICTO DE PERSONAL MÉDICO
// ==========================================
function isStaffOrDoctor(jidOrPhone) {
    if (!jidOrPhone) return false;
    const clean = jidOrPhone.split('@')[0].replace(/\D/g, '');
    const staffList = [
        DOCTOR_PHONE_1, 
        DOCTOR_PHONE_2, 
        ADMIN_PHONE,
        "584121233287",
        "584144417118",
        "04121233287",
        "04144417118",
        "4121233287",
        "4144417118"
    ].map(p => p.replace(/\D/g, '')).filter(Boolean);

    return staffList.some(staffNum => clean.endsWith(staffNum.slice(-10)) || staffNum.endsWith(clean.slice(-10)));
}

// ==========================================
// ESTADO GLOBAL DEL BOT
// ==========================================
let sock = null;
let currentQR = null;
let connectionStatus = 'init';
let connectedNumber = null;
const activityLogs = [];
const alertsCooldown = new Map(); // patientKey -> timestamp

function addLog(type, message) {
    const timestamp = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    activityLogs.unshift({ timestamp, type, message });
    if (activityLogs.length > 50) activityLogs.pop();
    console.log(`[${timestamp}] [${type}] ${message}`);
}

// Extractor robusto de texto de mensajes de Baileys
function extractMessageText(msg) {
    if (!msg || !msg.message) return "";
    const m = msg.message;
    return m.conversation || 
           m.extendedTextMessage?.text || 
           m.imageMessage?.caption || 
           m.videoMessage?.caption ||
           m.ephemeralMessage?.message?.conversation ||
           m.ephemeralMessage?.message?.extendedTextMessage?.text ||
           m.viewOnceMessage?.message?.conversation ||
           m.viewOnceMessage?.message?.extendedTextMessage?.text ||
           m.viewOnceMessageV2?.message?.conversation ||
           m.viewOnceMessageV2?.message?.extendedTextMessage?.text ||
           "";
}

// ==========================================
// LLAMADAS MULTI-TURNO A GOOGLE GEMINI
// ==========================================
async function consultGeminiMultiTurn({ patientKey, currentText, audioBase64, mimeType }) {
    const historyTurns = getChatHistoryTurns(patientKey, 8);

    const userParts = [];
    if (audioBase64) {
        userParts.push({
            inline_data: {
                mime_type: mimeType || "audio/ogg; codecs=opus",
                data: audioBase64
            }
        });
        userParts.push({
            text: `[Nota de voz del usuario]: Transcribe con exactitud lo que dice el audio y responde con profunda empatía y naturalidad humana en máximo 2 párrafos breves. Si el usuario pregunta por planes o servicios, responde de inmediato con la información solicitada sin postergar y sin añadir coletillas de estatus no pedidas. Si pregunta si el médico va en camino, responde sobre el estatus de la visita sin repetir preguntas ni pedir datos que ya se hayan dado.
Formato obligatorio:
[TRANSCRIPCION]
(lo que dijo el paciente o familiar)
[RESPUESTA]
(tu respuesta humana, empática y resolutiva)`
        });
    } else {
        userParts.push({ text: currentText });
    }

    const contents = [
        ...historyTurns,
        { role: "user", parts: userParts }
    ];

    for (const model of GEMINI_MODELS) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        
        const payload = {
            system_instruction: {
                parts: [{ text: SYSTEM_INSTRUCTION }]
            },
            contents,
            generationConfig: {
                temperature: 0.35,
                maxOutputTokens: 1024
            },
            safetySettings: GEMINI_SAFETY_SETTINGS
        };

        try {
            const resp = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                console.warn(`[Gemini] Error con ${model}:`, errData.error?.message || resp.status);
                continue;
            }

            const data = await resp.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

            if (rawText) {
                if (audioBase64 && rawText.includes("[RESPUESTA]")) {
                    const splitted = rawText.split("[RESPUESTA]");
                    const transcription = splitted[0].replace("[TRANSCRIPCION]", "").trim();
                    const reply = splitted[1].trim();
                    return { success: true, reply, transcription, modelUsed: model };
                }
                return { success: true, reply: rawText, modelUsed: model };
            }
        } catch (err) {
            console.warn(`[Gemini] Error de conexión con ${model}:`, err.message);
        }
    }

    return { success: false, error: "Modelos de Gemini no respondieron." };
}

// ==========================================
// MÓDULO DE ALERTA A DOCTORES DE GUARDIA
// ==========================================
async function dispatchDoctorAlert(patientKey, patientMsg, detectedDetails) {
    if (!sock) return;

    // Cooldown para no saturar con alertas repetidas al mismo caso en menos de 10 minutos
    const lastAlert = alertsCooldown.get(patientKey);
    const now = Date.now();
    if (lastAlert && (now - lastAlert) < 10 * 60 * 1000) {
        addLog("ALERTA_OMITIDA", `Alerta en enfriamiento para +${patientKey}`);
        return;
    }
    alertsCooldown.set(patientKey, now);

    const alertText = 
`🚨 *[ALERTA DE GUARDIA MEDIHOME 24/7]* 🚨

Se ha registrado una solicitud médica urgente en Valencia:

📱 *Contacto:* +${patientKey}
💬 *Mensaje del usuario:*
_«${patientMsg.slice(0, 350)}»_

${detectedDetails ? `📋 *Detalles:* ${detectedDetails}\n` : ''}
🔗 *Abrir chat directo en WhatsApp:*
https://wa.me/${patientKey}

_Lisa ya realizó el triaje clínico en el chat y suministró las líneas telefónicas de guardia directas._ 🚗💨`;

    const doctorTargets = [DOCTOR_PHONE_1, DOCTOR_PHONE_2];
    if (ADMIN_PHONE) {
        doctorTargets.push(ADMIN_PHONE);
    }

    for (const docNumber of doctorTargets) {
        try {
            const cleanNumber = docNumber.replace(/\D/g, '');
            if (!cleanNumber) continue;

            let targetJid = `${cleanNumber}@s.whatsapp.net`;
            try {
                const [waUser] = await sock.onWhatsApp(cleanNumber);
                if (waUser && waUser.jid) {
                    targetJid = waUser.jid;
                }
            } catch(e) {}

            await sock.sendMessage(targetJid, { text: alertText });
            addLog("ALERTA", `✅ Alerta enviada con éxito a +${cleanNumber} para caso +${patientKey}`);
        } catch (e) {
            console.warn(`⚠️ Error enviando alerta a ${docNumber}:`, e.message);
            addLog("ALERTA_ERROR", `Fallo enviando a +${docNumber}: ${e.message}`);
        }
    }
}

// Detecta si el mensaje amerita alerta inmediata a guardia
function checkShouldAlertDoctors(text) {
    const norm = (text || "").toLowerCase();
    const isUrgent = /(?:pecho|ahogo|dificultad respiratoria|asfixia|convulsi|inconsciente|desmay|sangr|180|170|urgencia|emergencia|grave|enviar un mensaje a los doctores|avisa a los doctores|avisale por favor a los doctores)/i.test(norm);
    const isVisitRequest = /(?:prebo|trigal|parral|guaparo|viña|bosque|ceiba|san diego|naguanagua).*(?:años|anos|paciente|fiebre|dolor|visita|domicilio|abuelo|abuela|mama|papa)/i.test(norm);
    return isUrgent || isVisitRequest;
}

// Respaldo inteligente en caso de que Gemini tarde o tenga latencia
function generateIntelligentFallback(userText, historyText) {
    const norm = (userText || "").toLowerCase();
    const hist = (historyText || "").toLowerCase();

    // 1. Si preguntan si vienen en camino o estatus
    if (/(?:camino|cuanto falta|llegar|ruta|donde vienen|donde estan)/i.test(norm)) {
        return (
            "¡Sí, no te preocupes! El Dr. Víctor Cedeño y la Asistente Médico Alejandra Ramones ya se encuentran en ruta hacia la dirección registrada para atender al paciente 🚗💨🩺.\n\n" +
            "Para cualquier consulta inmediata de guardia, puedes llamar directo al *0412-1233287* o al *0414-4417118* 🙏✨."
        );
    }

    // 2. Si piden avisar a los doctores o reportan emergencia
    if (/(?:doctores|medicos|avisa|alerta|inmediatamente|convulsi|pecho|ahogo|desmay)/i.test(norm) || /(?:convulsi|emergencia)/i.test(hist)) {
        return (
            "¡Tranquilo, mantén la calma! 🤍 El Dr. Víctor Cedeño y la Asistente Médico Alejandra Ramones ya tienen la alerta completamente activa sobre tu caso 🚗💨.\n\n" +
            "Por favor, mantén al paciente en posición lateral de seguridad (de lado si tiene convulsiones o dificultad respiratoria) y llámanos directamente ahora mismo a nuestras líneas de emergencia 24/7:\n" +
            "📞 *0412-1233287* o *0414-4417118* 🙏✨"
        );
    }

    // 3. Si preguntan por seguros
    if (/(?:seguro|poliza|hcm|caracas|mercantil|sanitas|reembolso|factura)/i.test(norm)) {
        return (
            "¡Hola! Por el momento en MediHome no trabajamos con seguros médicos ni procesamos facturas para pólizas de HCM (próximamente sí). Toda nuestra atención es particular directa 🩺✨.\n\n" +
            "Aceptamos Pago Móvil (tasa BCV), efectivo $, Zelle y Binance. En cada atención entregamos récipe médico oficial y constancia médica de atención firmada por el doctor."
        );
    }

    // 4. Si piden planes
    if (/(?:plan|planes|precio|costo|tarifa|mensual)/i.test(norm)) {
        return (
            "¡Con muchísimo gusto! En MediHome contamos con planes mensuales diseñados con todo el amor para proteger a tu familia en Valencia 🏡✨:\n\n" +
            "1. *Plan Conexión Médica* (15$/mes): Telemedicina 24/7 ilimitada y récipes digitales oficiales con código QR 📱✨.\n" +
            "2. *Plan Alivio Inmediato* (30$/mes): Telemedicina 24/7 + 1 Urgencia médica presencial a domicilio al mes en Valencia 🚑🏡.\n" +
            "3. *Plan Cuidado Hogar* (40$/mes): Urgencias + 1 Consulta médica integral programada al mes en tu casa 🩺🏡✨.\n" +
            "4. *Plan Bienestar Integral* (60$/mes): Cobertura médica total con visitas presenciales, laboratorios, sueros y curaciones 🌟💉.\n" +
            "5. *Plan Pequeños Protegidos* (50$/mes): Para consentir a los niños: Telemedicina 24/7 + 1 Urgencia médica presencial a domicilio al mes + Control Niño Sano y Certificado escolar 👶🍼📋.\n" +
            "6. *Plan Salud Sin Fronteras* (80$/mes): Plan Estrella desde el exterior: 2 visitas al mes, laboratorios y reporte con fotos a tu WhatsApp 🌍💙📸.\n\n" +
            "¿Te gustaría conocer más detalles de alguno de ellos o afiliarte de una vez? ¡Estoy aquí para ayudarte con mucho cariño! 🩺😊✨"
        );
    }

    // 5. Si ya dieron datos de ubicación en el historial
    if (/(?:prebo|trigal|parral|guaparo|viña|bosque|ceiba|san diego|naguanagua)/i.test(hist)) {
        return (
            "¡Comprendido perfectamente! 🩺 Todos los datos ya están registrados en MediHome Valencia. El Dr. Víctor Cedeño y la Asistente Médico Alejandra Ramones están organizando la asistencia en tu domicilio 🏡🚗💨.\n\n" +
            "Línea de guardia directa 24/7: *0412-1233287* / *0414-4417118* 🙏✨."
        );
    }

    // 6. Saludo inicial si es un chat nuevo sin datos previos
    return (
        "¡Hola! Te saluda Lisa de MediHome Valencia 🩺✨. Con gusto coordinamos tu atención médica a domicilio 🏡🚗💨.\n\n" +
        "Por favor indícanos qué síntoma presenta el paciente, su nombre/edad y en qué urbanización de Valencia se encuentra para asistirlo de inmediato con mucho cariño 💙🙏."
    );
}

// Detecta si el cliente está proporcionando datos para afiliarse o solicitando el asesor
function checkShouldAlertAffiliation(text) {
    const norm = (text || "").toLowerCase();
    const hasIdOrName = /(?:cédula|cedula|\b\d{7,8}\b)/i.test(norm);
    const hasPlanWord = /(?:plan|afilia|pequeños|conexión|alivio|hogar|bienestar|fronteras|protegidos)/i.test(norm);
    const asksAdvisor = /(?:asesor|pagar|métodos de pago|afiliación al programa|realizar el pago)/i.test(norm);
    return (hasIdOrName && hasPlanWord) || asksAdvisor;
}

// Notifica al equipo/asesor cuando hay un lead caliente de afiliación
async function dispatchAffiliationAlert(patientKey, patientMsg) {
    if (!sock) return;

    const alertKey = `aff_${patientKey}`;
    const lastAlert = alertsCooldown.get(alertKey);
    const now = Date.now();
    if (lastAlert && (now - lastAlert) < 5 * 60 * 1000) return;
    alertsCooldown.set(alertKey, now);

    const alertText = 
`📋 *[SOLICITUD DE AFILIACIÓN A PLAN - MEDIHOME]* 📋

Un cliente ha solicitado afiliarse o suministró sus datos en WhatsApp:

📱 *Contacto:* +${patientKey}
💬 *Mensaje del cliente:*
_«${patientMsg.slice(0, 300)}»_

🔗 *Abrir chat directo para cobro/cierre:*
https://wa.me/${patientKey}

_Lisa ya tomó nota y le indicó al cliente que el asesor le escribirá para suministrar los datos de pago._ 💳✨`;

    const doctorTargets = [DOCTOR_PHONE_1, DOCTOR_PHONE_2];
    if (ADMIN_PHONE) doctorTargets.push(ADMIN_PHONE);

    for (const docNumber of doctorTargets) {
        try {
            const cleanNumber = docNumber.replace(/\D/g, '');
            if (!cleanNumber) continue;
            let targetJid = `${cleanNumber}@s.whatsapp.net`;
            try {
                const [waUser] = await sock.onWhatsApp(cleanNumber);
                if (waUser && waUser.jid) targetJid = waUser.jid;
            } catch(e) {}
            await sock.sendMessage(targetJid, { text: alertText });
            addLog("AFILIACION", `📋 Notificación de afiliación enviada a +${cleanNumber} para cliente +${patientKey}`);
        } catch(e) {}
    }
}

// ==========================================
// INICIALIZACIÓN DE CONEXIÓN BAILEYS
// ==========================================
async function startWhatsAppBot() {
    connectionStatus = 'connecting';
    addLog("SISTEMA", "Iniciando motor de WhatsApp Baileys...");

    if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: state,
        browser: ["MediHome Cloud 24/7", "Chrome", "1.0.0"],
        defaultQueryTimeoutMs: 60000
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            currentQR = await QRCode.toDataURL(qr);
            connectionStatus = 'qr_ready';
            addLog("QR", "Nuevo código QR generado. Listo para escanear en panel web.");
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            connectionStatus = 'disconnected';
            connectedNumber = null;
            currentQR = null;

            addLog("DESCONEXION", `Conexión cerrada (Código: ${statusCode}). Reconectar: ${shouldReconnect}`);

            if (shouldReconnect) {
                setTimeout(startWhatsAppBot, 5000);
            } else {
                addLog("SESION", "Sesión cerrada por el usuario. Limpiando credenciales para nuevo QR...");
                try {
                    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
                } catch(e) {}
                setTimeout(startWhatsAppBot, 3000);
            }
        } else if (connection === 'open') {
            connectionStatus = 'connected';
            currentQR = null;
            const userJid = sock.user?.id || "";
            connectedNumber = userJid.split(':')[0] || userJid.split('@')[0];
            addLog("CONEXION", `✅ ¡Conectado exitosamente con WhatsApp! Número activo: +${connectedNumber}`);
        }
    });

    // ESCUCHA DE MENSAJES ENTRANTES
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            // 1. Ignorar mensajes vacíos o enviados por el propio bot
            if (!msg.message || msg.key.fromMe) continue;

            const fromJid = msg.key.remoteJid || "";

            // 2. Ignorar grupos y difusiones de estado
            if (fromJid.endsWith('@g.us') || fromJid === 'status@broadcast') continue;

            const patientKey = fromJid.split('@')[0];

            // 3. REGLA FUNDAMENTAL: Ignorar al personal médico y administradores
            // Lisa NUNCA debe responderle a los números de los doctores ni al administrador.
            if (isStaffOrDoctor(fromJid)) {
                addLog("STAFF", `Mensaje de doctor/personal ignorado (+${patientKey}) para no interferir.`);
                continue;
            }

            // 4. Ignorar eventos técnicos de sistema, recibos, protocolos y reacciones
            if (msg.messageStubType || 
                msg.message.protocolMessage || 
                msg.message.reactionMessage ||
                msg.message.pollUpdateMessage ||
                msg.message.keepInChatMessage) {
                continue;
            }

            const isAudio = Boolean(msg.message.audioMessage);
            const textContent = extractMessageText(msg);

            // 5. Ignorar si no es audio y no contiene texto sustancial
            if (!isAudio && (!textContent || textContent.trim().length < 2)) {
                continue;
            }

            addLog("MENSAJE", `Recibido ${isAudio ? '🎙️ Audio' : `"${textContent.slice(0, 45)}..."`} de +${patientKey}`);

            try {
                // Indicador de "Escribiendo..."
                await sock.sendPresenceUpdate('composing', fromJid);

                let reply = "";
                let recognizedText = textContent;

                if (isAudio) {
                    addLog("PROCESANDO", `Descargando y transcribiendo audio con Gemini...`);
                    const audioBuffer = await downloadMediaMessage(msg, 'buffer', {});
                    const audioBase64 = audioBuffer.toString('base64');
                    const mimeType = msg.message.audioMessage.mimetype || "audio/ogg; codecs=opus";

                    const geminiRes = await consultGeminiMultiTurn({ patientKey, audioBase64, mimeType });
                    if (geminiRes.success && geminiRes.reply) {
                        recognizedText = geminiRes.transcription || "[Audio analizado]";
                        reply = (recognizedText && !recognizedText.includes("Audio analizado")) 
                            ? `🎙️ *Nota de voz escuchada:*\n_«${recognizedText}»_\n\n${geminiRes.reply}`
                            : geminiRes.reply;
                    }
                } else if (textContent) {
                    const geminiRes = await consultGeminiMultiTurn({ patientKey, currentText: textContent });
                    if (geminiRes.success && geminiRes.reply) {
                        reply = geminiRes.reply;
                    }
                }

                // Si la IA no respondió, usar respaldo inteligente
                if (!reply) {
                    const recentTurns = getChatHistoryTurns(patientKey, 4).map(t => t.parts[0]?.text).join(' ');
                    reply = generateIntelligentFallback(recognizedText, recentTurns);
                }

                // Limpieza de formato para Alejandra Ramones
                reply = reply
                    .replace(/la\s+asistente\s+alejandra\s+ramones/gi, "la Asistente Médico Alejandra Ramones")
                    .replace(/\*+(la\s+)?asistente\s+m[eé]dico\s+alejandra\s+ramones\*+/gi, "$1Asistente Médico Alejandra Ramones")
                    .replace(/\*+alejandra\s+ramones\*+/gi, "Alejandra Ramones");

                // Enviar respuesta al paciente/familiar de forma directa y limpia (sin cita repetitiva)
                await sock.sendMessage(fromJid, { text: reply });
                addLog("RESPUESTA", `Lisa respondió a +${patientKey}`);

                // Guardar en la memoria conversacional estructurada (texto limpio)
                addToChatHistory(patientKey, "user", recognizedText);
                addToChatHistory(patientKey, "model", reply.replace(/^🎙️ \*Nota de voz escuchada:\*[\s\S]*?\n\n/, ''));

                // Evaluar y despachar alertas médicas o de afiliación comercial
                if (checkShouldAlertDoctors(recognizedText)) {
                    dispatchDoctorAlert(patientKey, recognizedText, "Triaje urgente detectado por Lisa en la nube");
                } else if (checkShouldAlertAffiliation(recognizedText)) {
                    dispatchAffiliationAlert(patientKey, recognizedText);
                }

            } catch (err) {
                console.error(`Error procesando mensaje de ${patientKey}:`, err);
                addLog("ERROR", `Fallo con +${patientKey}: ${err.message}`);
            }
        }
    });
}

// Iniciar WhatsApp
startWhatsAppBot();

// ==========================================
// SERVIDOR WEB Y PANEL DE CONTROL
// ==========================================
const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({
        status: "ok",
        connection: connectionStatus,
        number: connectedNumber,
        uptime: process.uptime()
    });
});

app.post('/api/test-alert', async (req, res) => {
    try {
        await dispatchDoctorAlert("584245690079", "Prueba de alerta de guardia desde panel web", "Prueba de sistema 24/7");
        res.json({ success: true, message: "Alerta enviada a los números de guardia" });
    } catch(e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/', (req, res) => {
    const isConn = connectionStatus === 'connected';
    const statusColor = isConn ? '#00d19d' : (connectionStatus === 'qr_ready' ? '#f59e0b' : '#ef4444');
    const statusText = isConn 
        ? `🟢 Conectado a WhatsApp (+${connectedNumber})` 
        : (connectionStatus === 'qr_ready' ? '🟡 Esperando Escaneo de Código QR' : '🔴 Conectando con WhatsApp...');

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MediHome • Servidor de WhatsApp Lisa 24/7</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background: #0a0f1d; color: #f8fafc; padding: 24px 16px; min-height: 100vh; }
    .container { max-width: 860px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 28px; }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; }
    .card { background: rgba(18, 26, 47, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 28px; margin-bottom: 20px; backdrop-filter: blur(12px); }
    .qr-box { text-align: center; padding: 20px; }
    .qr-img { width: 260px; height: 260px; border-radius: 16px; border: 4px solid #00d19d; background: #fff; padding: 8px; box-shadow: 0 10px 30px rgba(0,209,157,0.25); }
    .btn { padding: 10px 18px; border-radius: 10px; font-weight: 700; font-size: 0.85rem; cursor: pointer; border: none; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s; }
    .btn-primary { background: #00d19d; color: #041017; }
    .btn-outline { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.15); }
    .log-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-top: 12px; }
    .log-table th, .log-table td { padding: 8px 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .log-table th { color: #94a3b8; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge" style="background: rgba(0, 209, 157, 0.15); color: #00d19d; border: 1px solid rgba(0, 209, 157, 0.3);">
        MediHome Valencia • Servidor Cloud 24/7
      </div>
      <h1 style="font-size: 1.8rem; margin-bottom: 6px;">Asistente Virtual Lisa (v5.5 Humana & Multi-Turno)</h1>
      <p style="color: #94a3b8; font-size: 0.9rem;">IA Multimodal y Despacho Clínico en Tiempo Real</p>
    </div>

    <!-- ESTADO DE CONEXIÓN -->
    <div class="card" style="border-left: 4px solid ${statusColor};">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <span style="font-size:0.75rem; color:#94a3b8; text-transform:uppercase; font-weight:700;">Estado de la Línea</span>
          <h2 style="font-size:1.3rem; color:${statusColor}; margin-top:2px;">${statusText}</h2>
        </div>
        <div>
          <button class="btn btn-outline" onclick="location.reload()">🔄 Actualizar</button>
          <button class="btn btn-primary" onclick="testAlert()">🚨 Probar Alerta a Doctores</button>
        </div>
      </div>
    </div>

    <!-- QR CODE O SESIÓN ACTIVA -->
    <div class="card qr-box">
      ${isConn ? `
        <div style="padding: 20px 0;">
          <div style="font-size: 3rem; margin-bottom: 12px;">🩺✨</div>
          <h3 style="font-size: 1.3rem; margin-bottom: 8px;">¡Lisa está conectada y activa en la Nube!</h3>
          <p style="color: #94a3b8; max-width: 500px; margin: 0 auto 16px; font-size: 0.88rem;">
            Tu computadora y navegador pueden estar apagados. El servidor responderá mensajes, notas de voz y despachará alertas automáticamente las 24 horas.
          </p>
          <div style="display: inline-block; background: rgba(0,209,157,0.1); border: 1px solid rgba(0,209,157,0.25); border-radius: 12px; padding: 10px 18px; font-size: 0.82rem; color: #00d19d;">
            Guardia configurada: <strong>0412-1233287</strong> y <strong>0414-4417118</strong>
          </div>
        </div>
      ` : (currentQR ? `
        <div>
          <h3 style="margin-bottom: 6px;">Vincula tu WhatsApp en la Nube</h3>
          <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 16px;">
            Abre WhatsApp en tu teléfono ➔ Menú / Dispositivos vinculados ➔ <strong>Vincular un dispositivo</strong> y escanea este código:
          </p>
          <img src="${currentQR}" class="qr-img" alt="Código QR WhatsApp" />
          <p style="color: #64748b; font-size: 0.75rem; margin-top: 12px;">Este código se actualiza automáticamente cada 20 segundos.</p>
        </div>
      ` : `
        <div style="padding: 30px;">
          <p style="color: #94a3b8;">Iniciando motor de WhatsApp y generando código QR...</p>
        </div>
      `)}
    </div>

    <!-- REGISTRO DE ACTIVIDAD EN TIEMPO REAL -->
    <div class="card">
      <h3 style="font-size:1.05rem; margin-bottom:10px;">📋 Registro de Actividad Reciente</h3>
      <div style="max-height: 240px; overflow-y: auto;">
        <table class="log-table">
          <thead>
            <tr>
              <th style="width:90px;">Hora</th>
              <th style="width:110px;">Tipo</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            ${activityLogs.map(l => `
              <tr>
                <td style="color:#64748b;">${l.timestamp}</td>
                <td><strong style="color:#00d19d;">${l.type}</strong></td>
                <td style="color:#cbd5e1;">${l.message}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    ${!isConn ? 'setTimeout(() => location.reload(), 15000);' : ''}

    async function testAlert() {
      try {
        const res = await fetch('/api/test-alert', { method: 'POST' });
        const data = await res.json();
        alert(data.message || 'Alerta enviada');
        location.reload();
      } catch (e) {
        alert('Error: ' + e.message);
      }
    }
  </script>
</body>
</html>
    `;
    res.send(html);
});

app.listen(PORT, () => {
    console.log(`🌐 [MediHome] Servidor web y panel de control activo en puerto ${PORT}`);
    console.log(`📌 Abre http://localhost:${PORT} para ver el estado o escanear el QR.`);
});

// ==========================================
// AUTO-PING / KEEP-ALIVE (EVITAR SUSPENSIÓN DE INACTIVIDAD)
// ==========================================
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || "https://medihome-cloud-bot.onrender.com";
setInterval(async () => {
    try {
        const resp = await fetch(`${RENDER_EXTERNAL_URL}/health`);
        const data = await resp.json().catch(() => ({}));
        console.log(`⏱️ [Keep-Alive] Auto-ping activo (Estado: ${data.connection}, Uptime: ${Math.round(data.uptime || 0)}s)`);
    } catch(err) {
        console.warn('⚠️ [Keep-Alive] Aviso en ping automático:', err.message);
    }
}, 8 * 60 * 1000); // Cada 8 minutos

