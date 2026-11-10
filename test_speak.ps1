
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice('Microsoft Sabina Desktop')
$synth.Rate = 0
$synth.Volume = 100
$synth.Speak('Hola, esta es una prueba de voz para MediHome.')
