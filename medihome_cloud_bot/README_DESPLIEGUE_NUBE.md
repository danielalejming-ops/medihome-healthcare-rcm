# 🩺 MediHome Cloud Bot 24/7 • Guía de Despliegue en la Nube

> **Objetivo:** Ejecutar el Asistente Virtual **Lisa v5.4** de forma 100% autónoma en un servidor en la nube las 24 horas del día, los 7 días de la semana, **sin necesidad de tener tu computadora encendida ni el navegador abierto**, con alertas automáticas por WhatsApp a los médicos de guardia.

---

## 🌟 Características del Sistema en la Nube

1. **Autonomía Total (Cero Computadora):** El bot corre en la nube. Puedes apagar tu laptop o salir de viaje y el bot seguirá respondiendo solo.
2. **IA Multimodal con Google Gemini:**
   - Transcribe y comprende **notas de voz** de pacientes en tiempo real.
   - Respuestas ágiles, cálidas y empáticas con la **Regla de Oro de Brevedad** (máximo 2 párrafos cortos).
3. **Conocimiento Clínico Completo:**
   - Catálogo de los **12 servicios médicos** (incluyendo *Acompañamiento Médico Aéreo VIP*).
   - Los **6 planes mensuales** (Salud Sin Fronteras 80$, Cuidado Hogar 40$, etc.).
   - Roles exactos: Dr. Víctor Cedeño y la Asistente Médico Alejandra Ramones (en texto plano, sin asteriscos).
   - Manejo de tasas del Banco Central de Venezuela (BCV).
4. **🚨 Módulo de Alerta a Doctores de Guardia:**
   - Cuando entra una consulta con datos completos o una urgencia, el servidor envía automáticamente un mensaje de WhatsApp a los números de guardia:
     - 📞 **0412-1233287** (Dr. Víctor Cedeño)
     - 📞 **0414-4417118** (Asistente Médico Alejandra Ramones)
   - El mensaje incluye: Nombre del paciente, edad, síntoma, ubicación y enlace directo `wa.me/` para abrir el chat con un solo toque.

---

## 🚀 Despliegue en 5 Minutos (Paso a Paso)

### Plataforma Recomendada: Railway o Render (Fácil y Rápido)

#### Paso 1: Subir el proyecto a GitHub
1. Abre tu cuenta de [GitHub](https://github.com) y crea un nuevo repositorio privado (ejemplo: `medihome-cloud-bot`).
2. Sube los archivos de la carpeta `medihome_cloud_bot`:
   - `server.js`
   - `package.json`
   - `Dockerfile`
   - `.dockerignore`
   - `render.yaml`

#### Paso 2: Conectar con Railway o Render
1. Entra a [Railway.app](https://railway.app) o [Render.com](https://render.com).
2. Haz clic en **New Project** ➔ **Deploy from GitHub repo**.
3. Selecciona tu repositorio `medihome-cloud-bot`.
4. En la sección **Variables de Entorno (Environment Variables)**, agrega:
   - `GEMINI_API_KEY`: Tu clave de API de Google Gemini (`YOUR_GEMINI_API_KEY`)
   - `DOCTOR_PHONE_1`: `584121233287`
   - `DOCTOR_PHONE_2`: `584144417118`
   - `PORT`: `3000`
5. Haz clic en **Deploy**. El servidor se compilará y se iniciará automáticamente en unos 90 segundos.

#### Paso 3: Escanear el Código QR una sola vez
1. Una vez desplegado, la plataforma te dará una URL pública (por ejemplo: `https://medihome-cloud-bot.up.railway.app` o `https://medihome-bot.onrender.com`).
2. Abre esa URL en el navegador de tu teléfono o computadora.
3. Verás el **Panel de Control de MediHome** con un código QR en pantalla.
4. Abre **WhatsApp** en tu teléfono:
   - En Android: Toca los 3 puntos arriba a la derecha ➔ **Dispositivos vinculados** ➔ **Vincular un dispositivo**.
   - En iPhone: Ve a **Configuración** ➔ **Dispositivos vinculados** ➔ **Vincular un dispositivo**.
5. Escanea el código QR que ves en la pantalla.
6. **¡Listo!** El panel cambiará inmediatamente a:
   > `🟢 Conectado con éxito a WhatsApp (+58 424-5690079)`

---

## 🔒 ¿Qué pasa si el servidor se reinicia?
* El sistema guarda la sesión de conexión en la carpeta `auth_info_baileys`. 
* Si el servidor se actualiza o se reinicia en la nube, **se reconecta automáticamente sin necesidad de volver a escanear el código QR**.

---

## 🛠️ Panel de Control y Pruebas
Desde la página web del bot puedes:
- **Ver el estado de la línea en tiempo real:** (Conectado / Desconectado).
- **Probar Alerta a Doctores:** Hay un botón rojo que envía una alerta de prueba inmediata a los dos números de guardia para verificar que todo funcione.
- **Historial de Mensajes:** Visualiza los últimos mensajes y notas de voz atendidos con su hora exacta.
