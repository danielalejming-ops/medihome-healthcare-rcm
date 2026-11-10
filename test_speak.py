import subprocess

ps_code = """
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice('Microsoft Sabina Desktop')
$synth.Rate = 0
$synth.Volume = 100
$synth.Speak('Hola, esta es una prueba de voz para MediHome.')
"""

with open("test_speak.ps1", "w", encoding="utf-8") as f:
    f.write(ps_code)

res = subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", "test_speak.ps1"], capture_output=True, text=True)
print("Return code:", res.returncode)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
