"""
MEDIHOME • Servidor de Webhook para Bot de WhatsApp (Python Zero-Dependencies)
Asistente Virtual Oficial: Lisa 🩺
Compatible con: WhatsApp Cloud API (Meta), Render, VPS, Railway, Twilio, Evolution API.
"""

import os
import json
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler

# Puerto dinámico asignado por el VPS o Render (por defecto 5000)
PORT = int(os.environ.get("PORT", 5000))

BOT_RESPONSES = {
    "menu": (
        "🏥 *¡Hola! Te saluda Lisa de MEDIHOME Valencia* 🩺\n"
        "_Atención médica profesional en tu hogar 24/7._\n\n"
        "Responde con el número de tu opción:\n"
        "1️⃣ *🚨 Emergencia / Urgencia 24H*\n"
        "2️⃣ *👨‍⚕️ Médico a Domicilio y Telemedicina*\n"
        "3️⃣ *💉 Sueros, Inyecciones y Curaciones*\n"
        "4️⃣ *🌟 Planes Mensuales* (Desde 15$/mes)\n"
        "5️⃣ *📋 Certificados Médicos Oficiales*\n"
        "6️⃣ *💳 Zonas de Cobertura y Pagos*\n"
        "7️⃣ *👩‍⚕️ Hablar con Médico de Guardia*\n\n"
        "_O déjanos una nota de voz con tu síntoma._"
    ),
    "1": (
        "🚨 *¡URGENCIA MÉDICA PRIORITARIA!* 🚨\n\n"
        "Te saluda Lisa de MediHome. Nuestro equipo médico está listo para acudir de inmediato a tu domicilio en Valencia.\n\n"
        "Por favor indícanos rápidamente:\n"
        "1. *Nombre y edad del paciente:*\n"
        "2. *Síntoma o motivo de la urgencia:*\n"
        "3. *Dirección exacta (Urbanización, edificio/casa):*\n\n"
        "O presiona para llamar a la guardia ahora mismo:\n"
        "📞 *0412-1233287* / *0414-4417118*"
    ),
    "0": (
        "🚨 *¡URGENCIA MÉDICA PRIORITARIA!* 🚨\n\n"
        "Te saluda Lisa de MediHome. Nuestro equipo médico está listo para acudir de inmediato a tu domicilio en Valencia.\n\n"
        "Por favor indícanos rápidamente:\n"
        "1. *Nombre y edad del paciente:*\n"
        "2. *Síntoma o motivo de la urgencia:*\n"
        "3. *Dirección exacta (Urbanización, edificio/casa):*\n\n"
        "O presiona para llamar a la guardia ahora mismo:\n"
        "📞 *0412-1233287* / *0414-4417118*"
    ),
    "2": (
        "👨‍⚕️ *CONSULTA MÉDICA Y TELEMEDICINA*\n\n"
        "Un médico colegiado acude a tu hogar con instrumental de diagnóstico estéril, o te atendemos por videollamada:\n\n"
        "🏡 *Consulta en Domicilio:*\n"
        "✅ Evaluación física completa y signos vitales.\n"
        "✅ Diagnóstico certero y plan de tratamiento.\n"
        "✅ Récipes médicos oficiales con código QR.\n"
        "✅ Aplicación de primera dosis de tratamiento (si aplica).\n\n"
        "📱 *Telemedicina:*\n"
        "✅ Consulta médica por videollamada y triaje.\n"
        "✅ Revisión de exámenes y récipe digital.\n\n"
        "¿Prefieres visita a domicilio en Valencia o consulta virtual? Indícanos tu zona y síntoma."
    ),
    "3": (
        "💉 *PROCEDIMIENTOS Y ENFERMERÍA EN CASA*\n\n"
        "Atención profesional con insumos descartables y técnica 100% estéril:\n\n"
        "💧 *Sueroterapia e Hidratación:* Vitaminas, oligoelementos y electrolitos.\n"
        "💉 *Inyecciones y Vías:* Vía endovenosa (EV) o intramuscular (IM).\n"
        "🔄 *Sondas:* Colocación y cambio de sonda vesical (Foley) o nasogástrica.\n"
        "🩹 *Curaciones Avanzadas:* Pie diabético, escaras, quemaduras y heridas.\n"
        "✂️ *Procedimientos Menores:* Retiro de puntos y suturas menores.\n\n"
        "¿Qué procedimiento necesita el paciente y en qué urbanización se encuentra?"
    ),
    "4": (
        "🌟 *PLANES MÉDICOS MENSUALES MEDIHOME VALENCIA*\n\n"
        "Protege a tu familia todo el mes sin sorpresas:\n\n"
        "📱 *1. Plan Conexión Médica — 15$/mes*\n"
        "• Telemedicina 24/7 ilimitada por chat y videollamada.\n\n"
        "🚨 *2. Plan Alivio Inmediato — 30$/mes*\n"
        "• Telemedicina 24/7 + Cobertura de Urgencias Médicas a domicilio 24/7.\n\n"
        "🏡 *3. Plan Cuidado Hogar — 40$/mes*\n"
        "• Telemedicina + Urgencia 24/7 + Evaluación Médica presencial en casa.\n\n"
        "🩺 *4. Plan Bienestar Integral — 60$/mes*\n"
        "• Todo incluido: Visitas + Urgencias + Laboratorios + Sueros/Curaciones.\n\n"
        "👶 *5. Plan Pequeños Protegidos (Pediátrico) — 50$/mes*\n"
        "• Urgencias 24/7 + Consulta Niño Sano + Constancia Médica Escolar.\n\n"
        "✈️ *6. Plan Salud Sin Fronteras — 80$/mes*\n"
        "• Para padres en Valencia (pagas desde el exterior): Telemedicina + Urgencias 24/7 + 2 Visitas al mes + Laboratorios/Sueros + Reporte fotográfico a tu WhatsApp.\n\n"
        "¿Cuál de estos planes te interesa activar para tu familia?"
    ),
    "5": (
        "📋 *CERTIFICADOS MÉDICOS OFICIALES*\n\n"
        "Emitidos por médicos colegiados con validez legal nacional:\n\n"
        "🚗 *Certificado de Salud Vial* (Licencia de Conducir).\n"
        "🏫 *Certificados de Salud Escolar* y Aptitud Física.\n"
        "💼 *Certificados Médicos Laborales* y Pre-empleo.\n\n"
        "¿Qué tipo de certificado necesitas y para cuántas personas?"
    ),
    "6": (
        "📍 *ZONAS DE COBERTURA Y MÉTODOS DE PAGO*\n\n"
        "🚗 *Zonas cubiertas en Carabobo:*\n"
        "• Valencia Norte: El Parral, Prebo (I y II), La Ceiba, El Bosque, La Viña, Guaparo.\n"
        "• El Trigal (Norte, Sur, Centro) y La Trigaleña.\n"
        "• Municipios San Diego y Naguanagua.\n\n"
        "💳 *Métodos de Pago:*\n"
        "• 📱 Pago Móvil / Transferencia (Bs. tasa oficial BCV).\n"
        "• 💵 Efectivo en Dólares ($) en mano.\n"
        "• 🇺🇸 Zelle (Directo USA).\n"
        "• 🟡 Binance USDT.\n"
        "• 🌐 PayPal / Banesco Panamá."
    ),
    "7": (
        "👩‍⚕️ *CONECTANDO CON EL MÉDICO DE GUARDIA*\n\n"
        "Te saluda Lisa. Ya estoy transfiriendo este chat a nuestro equipo de guardia en Valencia (Dr. Víctor Cedeño / Asistente Médico Alejandra Ramones).\n\n"
        "Por favor escribe aquí:\n"
        "1. *Nombre y edad del paciente:*\n"
        "2. *Síntoma principal que presenta:*\n\n"
        "🚨 Si sientes que es de gravedad inmediata, llámanos directamente al *0412-1233287*."
    ),
    "voice_note": (
        "🎙️ *Nota de voz recibida*\n\n"
        "Te saluda Lisa de MEDIHOME. Nuestro equipo médico de guardia en Valencia está escuchando tu nota de voz en este momento para responderte enseguida.\n\n"
        "🚨 *Si se trata de una urgencia de gravedad inmediata*, por favor llámanos directamente al *0412-1233287* / *0414-4417118*."
    ),
    "fallback_empathetic": (
        "🩺 *Hola, te saluda Lisa de MEDIHOME Valencia.*\n\n"
        "He recibido tu mensaje y comprendo perfectamente tu necesidad. La salud y tranquilidad de tu familia es nuestra prioridad número uno.\n\n"
        "👨‍⚕️ *Ya le he notificado a nuestro médico de guardia en Valencia.* En unos minutos un miembro de nuestro equipo médico te atenderá directamente.\n\n"
        "Mientras tanto, si puedes decirme:\n"
        "1. *¿En qué urbanización de Valencia te encuentras?*\n"
        "2. *¿Nombre y edad del paciente?*\n\n"
        "🚨 *Si se trata de una urgencia inmediata*, no esperes un mensaje de texto, llámanos directamente ahora mismo:\n"
        "📞 *0412-1233287* o *0414-4417118*"
    )
}

def get_bot_reply(user_msg, msg_type="text"):
    if msg_type in ["audio", "voice"]:
        return BOT_RESPONSES["voice_note"]
        
    clean = user_msg.strip().lower()
    
    # 1. Emergencia
    if clean in ["1", "0"] or any(w in clean for w in ["emergencia", "urgente", "grave", "desmay", "pecho", "ahogo", "convuls"]):
        return BOT_RESPONSES["1"]
    
    # 2. Médico a domicilio y telemedicina
    elif clean in ["2"] or any(w in clean for w in ["medico", "doctor", "consulta", "telemedicina", "videollamada", "visita"]):
        return BOT_RESPONSES["2"]
        
    # 3. Procedimientos y enfermería
    elif clean in ["3"] or any(w in clean for w in ["enfermera", "suero", "inyeccion", "inyectar", "sonda", "curacion", "escara", "puntos"]):
        return BOT_RESPONSES["3"]
        
    # 4. Planes mensuales
    elif clean in ["4"] or any(w in clean for w in ["plan", "planes", "precio", "precios", "cuanto", "tarifa", "membresia", "mensualidad", "frontera", "exterior"]):
        return BOT_RESPONSES["4"]
        
    # 5. Certificados
    elif clean in ["5"] or any(w in clean for w in ["certificado", "conducir", "vial", "escolar"]):
        return BOT_RESPONSES["5"]
        
    # 6. Zonas y pagos
    elif clean in ["6"] or any(w in clean for w in ["pago", "pagos", "zelle", "zona", "cobertura", "trigal", "parral", "prebo", "san diego", "naguanagua"]):
        return BOT_RESPONSES["6"]
        
    # 7. Asesor / médico de guardia
    elif clean in ["7"] or any(w in clean for w in ["asesor", "humano", "persona", "operador", "guardia"]):
        return BOT_RESPONSES["7"]
        
    # Saludos / Menú
    elif any(w in clean for w in ["hola", "buenas", "buenos dias", "buenas tardes", "menu", "lisa"]):
        return BOT_RESPONSES["menu"]
        
    # Fallback empático
    else:
        return BOT_RESPONSES["fallback_empathetic"]

WHATSAPP_TOKEN = os.environ.get("WHATSAPP_TOKEN", "")
PHONE_NUMBER_ID = os.environ.get("PHONE_NUMBER_ID", "")

def send_meta_whatsapp_message(to_number, text):
    """Envía la respuesta de Lisa a WhatsApp a través de Meta Graph API"""
    if not WHATSAPP_TOKEN or not PHONE_NUMBER_ID or not to_number:
        return False
    try:
        import urllib.request
        url = f"https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages"
        headers = {
            "Authorization": f"Bearer {WHATSAPP_TOKEN}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_number,
            "type": "text",
            "text": {"body": text}
        }
        req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"✅ Lisa respondió a {to_number} vía Meta Cloud API (HTTP {resp.status})")
            return True
    except Exception as e:
        print(f"⚠️ Error enviando a Meta Graph API: {e}")
        return False

class WhatsAppHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)
        
        mode = params.get('hub.mode', [''])[0]
        token = params.get('hub.verify_token', [''])[0]
        challenge = params.get('hub.challenge', [''])[0]
        
        VERIFY_TOKEN = "medihome_valencia_2026"
        
        if mode == 'subscribe' and token == VERIFY_TOKEN:
            print("✅ Webhook verificado con éxito por Meta / WhatsApp.")
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(challenge.encode('utf-8'))
        else:
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            html = """<!DOCTYPE html>
<html>
<head><title>MEDIHOME Bot Status</title><meta charset='utf-8'></head>
<body style='font-family:sans-serif; text-align:center; padding:50px; background:#0b141a; color:#fff;'>
  <h1 style='color:#5cbfac;'>🩺 MEDIHOME • Asistente Virtual Lisa</h1>
  <p style='color:#a0aec0;'>Servidor Webhook 24/7 Activo y Listo en la Nube</p>
  <p>Valencia, Estado Carabobo, Venezuela</p>
</body>
</html>"""
            self.wfile.write(html.encode('utf-8'))

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        
        try:
            data = json.loads(body)
            user_text = ""
            msg_type = "text"
            sender_id = ""
            is_meta = False
            
            # Formato Meta Cloud API
            if "entry" in data:
                is_meta = True
                for entry in data.get("entry", []):
                    for change in entry.get("changes", []):
                        val = change.get("value", {})
                        # Si es solo una notificación de entrega o lectura, responder 200 OK y no hacer nada
                        if "messages" not in val:
                            self.send_response(200)
                            self.send_header('Content-Type', 'text/plain')
                            self.end_headers()
                            self.wfile.write(b"EVENT_RECEIVED")
                            return
                            
                        messages = val.get("messages", [])
                        if messages:
                            msg_obj = messages[0]
                            sender_id = msg_obj.get("from", "")
                            msg_type = msg_obj.get("type", "text")
                            if msg_type == "text":
                                user_text = msg_obj.get("text", {}).get("body", "")
                            elif msg_type in ["audio", "voice"]:
                                user_text = "[Nota de Voz]"
                            else:
                                user_text = "hola"
            
            # Formato genérico webhook / Evolution API
            elif "message" in data:
                user_text = data.get("message", "")
                sender_id = data.get("sender", "Desconocido")
            
            if not user_text and not is_meta:
                user_text = "hola"
                
            reply_text = get_bot_reply(user_text, msg_type)
            print(f"[{sender_id}] Mensaje ({msg_type}): '{user_text}' -> Lisa respondió.")
            
            # Si viene de Meta Cloud API, despachar el mensaje al usuario
            if is_meta and sender_id and WHATSAPP_TOKEN:
                send_meta_whatsapp_message(sender_id, reply_text)
            
            response_payload = {
                "status": "success",
                "recipient": sender_id,
                "reply": reply_text
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(response_payload, ensure_ascii=False).encode('utf-8'))
            
        except Exception as e:
            print(f"⚠️ Error procesando mensaje POST: {e}")
            self.send_response(200) # Siempre responder 200 a Meta para evitar reintentos infinitos
            self.end_headers()
            self.wfile.write(b"ERROR_HANDLED")

def run_server():
    server = HTTPServer(('0.0.0.0', PORT), WhatsAppHandler)
    print(f"🚀 MEDIHOME • Servidor de Lisa iniciado en puerto {PORT}")
    print(f"📌 Webhook endpoint listo para recibir eventos.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")

if __name__ == '__main__':
    run_server()
