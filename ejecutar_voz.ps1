
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice('Microsoft Sabina Desktop')
$synth.Rate = -1
$synth.Volume = 100

$text = @'
¡Hola a todos en el salón! Como estratega de marketing de MediHome, les comparto nuestra recomendación profesional sobre las tarjetas de presentación.

Nuestra recomendación es rotunda y definitiva: las tarjetas de presentación deben hacerse obligatoriamente a dos caras. En el sector médico privado, imprimir a una sola cara es un error que reduce las llamadas y abarata la percepción de nuestra marca.

Aquí están los cuatro motivos estratégicos:

Primero. Accesibilidad visual para adultos mayores.
Estadísticamente, nuestros pacientes frecuentes son personas mayores. Si intentamos colocar el logotipo, dos médicos cirujanos, números de teléfono, catálogo de servicios, código QR y zonas en una sola cara, la letra tendrá que ser diminuta. En medio de una emergencia nocturna, un paciente con problemas de visión no podrá leer el número. Con dos caras, garantizamos números grandes, claros y legibles.

Segundo. Jerarquía psicológica entre urgencia y catálogo.
La cara frontal está diseñada para actuar en segundos ante una emergencia médica, destacando el logotipo de MediHome, al Doctor Víctor Cedeño, a la Doctora Alejandra Ramones y los números de urgencia veinticuatro horas en tamaño grande. La cara trasera funciona como un catálogo de consulta médica para cuando la familia está tranquila, detallando cambio de sondas, sueroterapia, curaciones, zonas de cobertura y el código QR directo a WhatsApp.

Tercero. El efecto imán de nevera en los hogares de Valencia.
En zonas como El Trigal, Prebo o El Parral, las familias colocan estas tarjetas en la mesita de noche del abuelo o pegadas con un imán en la nevera. Tener el portafolio completo al reverso les recuerda constantemente todos los procedimientos que podemos solucionar directamente en su hogar.

Y cuarto. Prestigio, legalidad y solvencia clínica.
Una tarjeta a una sola cara parece un volante improvisado. En medicina privada, una tarjeta a dos caras, en cartulina glasé gruesa de trescientos gramos, con acabado plastificado mate, transmite la estabilidad y el rigor hospitalario que las familias exigen. Además, el código QR permite que los hijos en el exterior contraten el Plan Salud Sin Fronteras al instante.

En conclusión: dos caras es la única decisión estratégica correcta para MediHome.

¡Muchas gracias y éxito a todo el equipo en el salón!
'@

# Guardar en archivo WAV
$synth.SetOutputToWaveFile('c:\Users\danie\Downloads\MediHome\propuesta_tarjetas_medihome.wav')
$synth.Speak($text)

# Restaurar salida de audio a los parlantes del computador
$synth.SetOutputToDefaultAudioDevice()
$synth.Speak($text)
