/**
 * MEDIHOME VALENCIA • Service Worker de Background (v4.0 IA Multimodal & Catálogo Completo)
 * Procesa Audio y Texto libre con Google Gemini (Flash Latest / 3.8 Flash con redundancia activa)
 * Manejo de demanda con conmutación por error automática ante errores 503/429
 */

const DEFAULT_API_KEY = "YOUR_GEMINI_API_KEY";
const GEMINI_MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-flash-lite-latest"];

const KNOWLEDGE_BASE = `
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "process_voice_note") {
        handleVoiceNote(request)
            .then(result => sendResponse(result))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    if (request.action === "process_text_gemini") {
        handleTextGemini(request)
            .then(result => sendResponse(result))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }
});

// Procesa notas de voz (Audio Multimodal)
async function handleVoiceNote({ audioBase64, mimeType, apiKey }) {
    const key = apiKey || DEFAULT_API_KEY;

    let cleanMime = "audio/ogg";
    if (mimeType) {
        cleanMime = mimeType.split(';')[0].trim().toLowerCase();
        if (cleanMime === "audio/opus" || cleanMime.includes("ogg")) {
            cleanMime = "audio/ogg";
        } else if (cleanMime.includes("mp4") || cleanMime.includes("m4a")) {
            cleanMime = "audio/mp4";
        } else if (cleanMime.includes("wav")) {
            cleanMime = "audio/wav";
        }
    }

    const systemPrompt = `
${KNOWLEDGE_BASE}

INSTRUCCIÓN ESPECIAL PARA NOTA DE VOZ:
Escucha con atención la nota de voz enviada por el paciente en Valencia, Venezuela.
Responde estrictamente en este formato exacto:

[TRANSCRIPCION]
(Escribe aquí textualmente lo que dijo el paciente en su nota de voz)

[RESPUESTA]
(Escribe aquí la respuesta cálida, empática y profesional de Lisa atendiendo puntualmente lo que el paciente solicitó en su nota de voz.
- Si el paciente pregunta qué planes ofrecen o pide ver los planes, presenta ÚNICAMENTE los planes y pregunta cuál le interesa, SIN pedir cédula ni datos de registro en ese mensaje.
- Si pregunta qué plan le recomiendas para sus abuelos o padres, recomienda solo el Plan Salud Sin Fronteras sin listar los 6 planes.
- Si el paciente pregunta cuántos bolívares son, cuál es la tasa oficial del BCV o cómo pagar: ¡ESTÁ ESTRICTAMENTE PROHIBIDO inventar tasas o calcular montos en bolívares! Aclara que, dado que la tasa oficial del BCV varía diariamente, nuestro representante de atención / la Asistente Médico Alejandra Ramones le atenderá prontamente por este mismo chat para brindarle los datos de pago y la cantidad exacta en bolívares calculada a la tasa oficial del día.
- Solo solicita los datos de registro (cédula, nombre, etc.) si el paciente ya indicó cuál plan desea o si está pidiendo datos para pagar/afiliarse.
- Refiérete siempre a Alejandra Ramones como "la Asistente Médico Alejandra Ramones" en texto normal, sin asteriscos (*).
- REGLA DE LONGITUD: Mantén la respuesta ÁGIL, CORTA Y DIRECTA (máximo 2 párrafos breves. Prohibido discursos largos o explicaciones repetidas).
`;

    let lastError = null;

    for (const model of GEMINI_MODELS) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const payload = {
            contents: [{
                role: "user",
                parts: [
                    { inlineData: { mimeType: cleanMime, data: audioBase64 } },
                    { text: systemPrompt }
                ]
            }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 2048
            }
        };

        try {
            console.log(`🎙️ [ServiceWorker] Intentando procesar audio con modelo: ${model}...`);
            const resp = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                const errMsg = errData.error?.message || `HTTP ${resp.status}`;
                console.warn(`⚠️ [ServiceWorker] Modelo ${model} respondió con error: ${errMsg}`);
                lastError = new Error(errMsg);
                // Si es 503 (alta demanda) o 429 (rate limit), pasar al siguiente modelo
                continue;
            }

            const data = await resp.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

            let transcription = "";
            let reply = "";

            if (textResponse.includes("[TRANSCRIPCION]") && textResponse.includes("[RESPUESTA]")) {
                const parts = textResponse.split("[RESPUESTA]");
                transcription = parts[0].replace("[TRANSCRIPCION]", "").trim();
                reply = parts[1].trim();
            } else {
                reply = textResponse.trim();
                transcription = "(Audio analizado)";
            }

            console.log(`✅ [ServiceWorker] Audio procesado exitosamente con ${model}`);
            return { success: true, transcription, reply, modelUsed: model };

        } catch (e) {
            lastError = e;
            console.warn(`⚠️ [ServiceWorker] Falló conexión con ${model}:`, e.message);
        }
    }

    return { success: false, error: lastError?.message || "Error procesando nota de voz." };
}

// Procesa textos libres de pacientes
async function handleTextGemini({ text, history, apiKey }) {
    const key = apiKey || DEFAULT_API_KEY;

    const prompt = `
${KNOWLEDGE_BASE}

HISTORIAL RECIENTE DE LA CONVERSACIÓN CON ESTE PACIENTE EN WHATSAPP:
${history ? history : `Paciente: "${text}"`}

ÚLTIMO MENSAJE DEL PACIENTE:
"${text}"

INSTRUCCIÓN VITAL DE BREVEDAD Y CONCISIÓN (MÁXIMO 2 PÁRRAFOS):
- Redacta la respuesta médica de Lisa de forma ÁGIL, CÁLIDA Y CONCISA (máximo 2 párrafos breves).
- Si el paciente consulta por atención médica a domicilio, urgencia o triaje inicial, responde con un saludo cálido breve y solicita ÚNICAMENTE:
  1. Síntomas o motivo de consulta.
  2. Nombre, edad y urbanización en Valencia.
- ¡ESTÁ ESTRICTAMENTE PROHIBIDO pedir número de teléfono! (Ya te están escribiendo directamente desde su propio WhatsApp).
- ¡ESTÁ ESTRICTAMENTE PROHIBIDO enviar parrafadas largas de bienvenida, discursos extensos o repetir descripciones del equipo médico que aburran o saturen al paciente!
- Sé cálida, directa y resolutiva con emojis médicos simpáticos. Responde directamente sin preámbulos.
`;

    let lastError = null;

    for (const model of GEMINI_MODELS) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2048
            }
        };

        try {
            console.log(`🧠 [ServiceWorker] Consultando texto clínico con modelo: ${model}...`);
            const resp = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                const errMsg = errData.error?.message || `HTTP ${resp.status}`;
                console.warn(`⚠️ [ServiceWorker] Modelo ${model} respondió con error: ${errMsg}`);
                lastError = new Error(errMsg);
                continue;
            }

            const data = await resp.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
            if (reply) {
                console.log(`✅ [ServiceWorker] Texto respondido con éxito por ${model}`);
                return { success: true, reply, modelUsed: model };
            }

        } catch (e) {
            lastError = e;
            console.warn(`⚠️ [ServiceWorker] Error con ${model}:`, e.message);
        }
    }

    return { success: false, error: lastError?.message || "Error procesando consulta de texto." };
}
