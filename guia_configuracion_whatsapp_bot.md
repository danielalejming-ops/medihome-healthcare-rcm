# Guía de Implementación del Bot de Respuestas Automáticas en WhatsApp • MEDIHOME

**Números de Contacto:** `0412-1233287` / `0414-4417118`  
**Ubicación:** Valencia, Edo. Carabobo

---

## 🚀 Las 3 Opciones para Activar tu Bot (Elige la que mejor se adapte a ti)

Para una empresa médica en Valencia, existen 3 formas de poner a funcionar este bot:

| Método | Dificultad | Costo | Tiempo de Activación | Para quién es ideal |
| :--- | :--- | :--- | :--- | :--- |
| **Opción 1: WhatsApp Business Nativo** | Muy Fácil | 100% Gratis | **5 Minutos** | Para empezar hoy mismo desde el teléfono sin instalar programas. |
| **Opción 2: App Auto-Respondedora (Android)** | Fácil | Gratis / Freemium | **10 Minutos** | Para que el teléfono responda solo las 24 horas usando palabras clave y números. |
| **Opción 3: Servidor Python / API Oficial** | Intermedio | Requiere hosting | **1 Hora** | Para cuando manejes más de 50 mensajes diarios o múltiples médicos en línea. |

---

## 📱 Opción 1: Configuración Inmediata en WhatsApp Business (5 Minutos)

Esta opción es la más recomendada para iniciar hoy. No requiere programar ni pagar servidores.

### Paso 1: Configurar el Mensaje de Bienvenida Automático
1. Abre **WhatsApp Business** en el teléfono de MediHome.
2. Toca en los tres puntos superiores `⋮` ➔ **Herramientas para la empresa** ➔ **Mensaje de bienvenida**.
3. Activa la casilla *"Enviar mensaje de bienvenida"*.
4. En el texto, pega exactamente lo siguiente:

```text
🏥 ¡Hola! Te saluda Lisa de MEDIHOME Valencia 🩺
Atención médica profesional en tu hogar 24/7.

Responde con el número de tu opción:
1️⃣ 🚨 Emergencia / Urgencia 24H
2️⃣ 👨‍⚕️ Médico a Domicilio y Telemedicina
3️⃣ 💉 Sueros, Inyecciones y Curaciones
4️⃣ 🌟 Planes Mensuales (Desde 15$)
5️⃣ 📋 Certificados Médicos Oficiales
6️⃣ 💳 Zonas de Cobertura y Pagos
7️⃣ 👩‍⚕️ Hablar con Médico de Guardia

O déjanos una nota de voz con tu síntoma.
```

---

### Paso 2: Crear las "Respuestas Rápidas" (Atajos con `/`)
En WhatsApp Business, ve a **Herramientas para la empresa** ➔ **Respuestas rápidas**. Crea estos 7 atajos para responder en 2 segundos cuando el paciente elija un número:

#### Atajo 1: `/1` o `/urgencia`
```text
🚨 ¡URGENCIA MÉDICA PRIORITARIA! 🚨

Te saluda Lisa de MediHome. Nuestro equipo médico está listo para acudir de inmediato a tu domicilio en Valencia.

Por favor indícanos rápidamente:
1. Nombre y edad del paciente:
2. Síntoma o motivo de la urgencia:
3. Dirección exacta (Urbanización, edificio/casa):

O presiona para llamar a la guardia ahora mismo:
📞 0412-1233287 / 0414-4417118
```

#### Atajo 2: `/2` o `/medico`
```text
👨‍⚕️ CONSULTA MÉDICA Y TELEMEDICINA

Un médico colegiado acude a tu hogar con instrumental de diagnóstico estéril, o te atendemos por videollamada:

🏡 Consulta en Domicilio:
✅ Evaluación física completa y signos vitales.
✅ Diagnóstico certero y plan de tratamiento.
✅ Récipes médicos oficiales con código QR.
✅ Aplicación de primera dosis de tratamiento (si aplica).

📱 Telemedicina:
✅ Consulta médica por videollamada y triaje.
✅ Revisión de exámenes y récipe digital.

¿Prefieres visita a domicilio en Valencia o consulta virtual? Indícanos tu zona y síntoma.
```

#### Atajo 3: `/3` o `/enfermeria`
```text
💉 PROCEDIMIENTOS Y ENFERMERÍA EN CASA

Atención profesional con insumos descartables y técnica 100% estéril:

💧 Sueroterapia e Hidratación: Vitaminas, oligoelementos y electrolitos.
💉 Inyecciones y Vías: Vía endovenosa (EV) o intramuscular (IM).
🔄 Sondas: Colocación y cambio de sonda vesical (Foley) o nasogástrica.
🩹 Curaciones Avanzadas: Pie diabético, escaras, quemaduras y heridas.
✂️ Procedimientos Menores: Retiro de puntos y suturas menores.

¿Qué procedimiento necesita el paciente y en qué urbanización se encuentra?
```

#### Atajo 4: `/4` o `/planes`
```text
🌟 PLANES MÉDICOS MENSUALES MEDIHOME VALENCIA

Protege a tu familia todo el mes sin sorpresas:

📱 1. Plan Conexión Médica — 15$/mes
• Telemedicina 24/7 ilimitada por chat y videollamada.

🚨 2. Plan Alivio Inmediato — 30$/mes
• Telemedicina 24/7 + Cobertura de Urgencias Médicas a domicilio 24/7.

🏡 3. Plan Cuidado Hogar — 40$/mes
• Telemedicina + Urgencia 24/7 + Evaluación Médica presencial en casa.

🩺 4. Plan Bienestar Integral — 60$/mes
• Todo incluido: Visitas + Urgencias + Laboratorios + Sueros/Curaciones.

👶 5. Plan Pequeños Protegidos (Pediátrico) — 50$/mes
• Urgencias 24/7 + Consulta Niño Sano + Constancia Médica Escolar.

✈️ 6. Plan Salud Sin Fronteras — 80$/mes
• Para padres en Valencia (pagas desde el exterior): Telemedicina + Urgencias 24/7 + 2 Visitas al mes + Laboratorios/Sueros + Reporte fotográfico a tu WhatsApp.

¿Cuál de estos planes te interesa activar para tu familia?
```

#### Atajo 5: `/5` o `/certificados`
```text
📋 CERTIFICADOS MÉDICOS OFICIALES

Emitidos por médicos colegiados con validez legal nacional:

🚗 Certificado de Salud Vial (Licencia de Conducir).
🏫 Certificados de Salud Escolar y Aptitud Física.
💼 Certificados Médicos Laborales y Pre-empleo.

¿Qué tipo de certificado necesitas y para cuántas personas?
```

#### Atajo 6: `/6` o `/pagos`
```text
📍 ZONAS DE COBERTURA Y MÉTODOS DE PAGO

🚗 Zonas cubiertas en Carabobo:
• Valencia Norte: El Parral, Prebo (I y II), La Ceiba, El Bosque, La Viña, Guaparo.
• El Trigal (Norte, Sur, Centro) y La Trigaleña.
• Municipios San Diego y Naguanagua.

💳 Métodos de Pago:
• 📱 Pago Móvil / Transferencia (Bs. tasa oficial BCV).
• 💵 Efectivo en Dólares ($) en mano.
• 🇺🇸 Zelle (Directo USA).
• 🟡 Binance USDT.
• 🌐 PayPal / Banesco Panamá.
```

#### Atajo 7: `/7` o `/asesor`
```text
👩‍⚕️ CONECTANDO CON EL MÉDICO DE GUARDIA

Te saluda Lisa. Ya estoy transfiriendo este chat a nuestro equipo de guardia en Valencia (Dr. Víctor Cedeño / Asistente Médico Alejandra Ramones).

Por favor escribe aquí:
1. Nombre y edad del paciente:
2. Síntoma principal que presenta:

🚨 Si sientes que es de gravedad inmediata, llámanos directamente al 0412-1233287.
```

---

## 🤖 Opción 2: Bot Automático en Android con "AutoResponder for WA"

Si deseas que el teléfono **responda solo al 100% sin intervención humana**:
1. Descarga en la Play Store la app **"AutoResponder para WhatsApp"** (icono verde con robot blanco).
2. Dale los permisos de notificación que la app solicita.
3. Agrega las reglas:
   - **Regla 1:** Mensaje recibido: `*` (cualquier mensaje) ➔ Mensaje de respuesta: El menú principal de bienvenida.
   - **Regla 2:** Mensaje recibido: `0` o `emergencia` ➔ Respuesta: Mensaje de urgencia.
   - **Regla 3:** Mensaje recibido: `1` ➔ Respuesta: Mensaje de Consulta Médica.
   - **Regla 4:** Mensaje recibido: `2` ➔ Respuesta: Mensaje de Procedimientos.
   - **Regla 5:** Mensaje recibido: `3` ➔ Respuesta: Mensaje de Plan Salud Sin Fronteras.
   - **Regla 6:** Mensaje recibido: `5` ➔ Respuesta: Zonas y Pagos.

---

## 💻 Opción 3: Servidor en Python (Para Integraciones Avanzadas)

Si deseas conectar el bot a una API oficial de Meta o un proveedor como Evolution API / Twilio, hemos creado el servidor listo para correr:
- **Archivo:** [`whatsapp_bot_server.py`](file:///c:/Users/danie/Downloads/MediHome/whatsapp_bot_server.py)
- **Cómo ejecutarlo:**
  ```bash
  python whatsapp_bot_server.py
  ```
- Ya incluye el endpoint Webhook, la verificación del token `medihome_valencia_2026` y toda la lógica de triaje médico codificada en Python nativo sin dependencias externas.

---

## 👵 ¿Qué Ocurre si la Persona No Escribe Números o Palabras Clave? (Atención al Adulto Mayor)

Esta es una de las preguntas más críticas e inteligentes en salud domiciliaria. Los adultos mayores o sus familiares en momentos de angustia **rara vez dicen "1" o "2"**; suelen escribir párrafos largos o enviar notas de voz, por ejemplo:
> *"Buenas tardes mijo, mi esposo tiene la tensión en 160 y no se puede levantar, estamos en El Trigal, cuánto cobran?"*
> *(O una nota de voz de 45 segundos explicando los síntomas)*

### 1. En WhatsApp Business Nativo (Lo que estás configurando ahora):
- **El bot NO bloquea la conversación:** El mensaje de bienvenida se envía automáticamente en el primer contacto para que tengan los números de emergencia a la mano.
- **Tú o tu médico de guardia leen el mensaje real:** Como estás en WhatsApp Business, la conversación queda abierta y tú puedes responder con empatía en segundos usando las **Respuestas Rápidas (`/`)**.

### 2. Respuestas Rápidas Especiales para Adultos Mayores (Agrega estos atajos):

#### Atajo: `/abuelo` (Para cuando escribe un familiar preocupado o un abuelo)
```text
Buenas tardes, con mucho gusto le atendemos. En MEDIHOME entendemos su preocupación y la salud de su ser querido es nuestra prioridad. 

Nuestro médico de guardia puede trasladarse a su domicilio en Valencia para evaluarlo y estabilizarlo con calma.

Por favor indíquenos:
1. ¿En qué urbanización o dirección se encuentran?
2. ¿Qué edad tiene el paciente?

Si siente que es una urgencia de gravedad, llámenos directamente al 0412-1233287 para despachar al médico de inmediato.
```

#### Atajo: `/audio` (Para cuando envían notas de voz)
```text
Buenas tardes, hemos escuchado su nota de voz con mucha atención. Entendemos perfectamente la situación y estamos disponibles para acudir a su hogar a atender al paciente.

¿Nos podría indicar su dirección exacta en Valencia para coordinar la llegada del médico?
```

#### Atajo: `/tension` (Para sospechas de crisis hipertensiva)
```text
Buenas tardes. Si el paciente presenta cifras elevadas de tensión arterial o mareos, es fundamental mantener la calma, que permanezca en reposo sentado o semi-acostado y no automedicarlo.

Podemos enviar al médico a su domicilio para toma de tensión, evaluación cardiovascular y colocación de tratamiento antihipertensivo controlado. ¿En qué zona de Valencia se encuentra?
```

---

## 💡 Las 3 Reglas de Oro para Comunicarse con Adultos Mayores por WhatsApp

1. **Nunca usar mensajes robóticos de error:** Jamás programar mensajes como *"Opción inválida, marque del 1 al 6"*. En medicina domiciliaria, eso genera rechazo inmediato y la familia llamará a otra ambulancia o clínica.
2. **El "Paracaídas Humano" (Fallback Empático):** Si el sistema no reconoce la palabra, siempre debe responder: *"Hemos recibido su mensaje. Ya le notificamos a nuestro médico de guardia..."*.
3. **Escuchar el audio y responder con audio cálido:** Si un adulto mayor envía una nota de voz, que el médico o asistente le responda con una nota de voz breve, respetuosa y con tono sereno (*"Buenas tardes señora María, le habla el doctor de MEDIHOME..."*). **Esto cierra la consulta en el 90% de los casos.**

---

## 🧪 Cómo Probar el Bot Ahora Mismo en tu Navegador
Hemos creado un simulador interactivo idéntico a WhatsApp para que veas exactamente cómo interactúa un paciente:
- Abre el archivo: [**`whatsapp_bot_simulator.html`**](file:///c:/Users/danie/Downloads/MediHome/whatsapp_bot_simulator.html)
- Podrás escribirle al bot en vivo, pulsar los botones de respuesta rápida y verificar el flujo de triaje.
