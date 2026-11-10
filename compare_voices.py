import subprocess

ps_code = """
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

$synth.SelectVoice('Microsoft Sabina Desktop')
Write-Output ("Sabina: " + $synth.Voice.Name)

$synth.SelectVoice('Microsoft Helena Desktop')
Write-Output ("Helena: " + $synth.Voice.Name)
"""

with open("compare_voices.ps1", "w", encoding="utf-8") as f:
    f.write(ps_code)

res = subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", "compare_voices.ps1"], capture_output=True, text=True)
print(res.stdout)
