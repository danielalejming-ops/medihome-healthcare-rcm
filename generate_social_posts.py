import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def draw_vector_check(draw, x, y, size, color, width=3):
    p1 = (x + size * 0.22, y + size * 0.52)
    p2 = (x + size * 0.45, y + size * 0.78)
    p3 = (x + size * 0.82, y + size * 0.24)
    draw.line([p1, p2, p3], fill=color, width=width, joint="curve")

def draw_vector_phone(draw, cx, cy, radius, color):
    w, h = radius * 1.0, radius * 1.7
    x0, y0 = cx - w/2, cy - h/2
    x1, y1 = cx + w/2, cy + h/2
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius*0.25, outline=color, width=3)
    draw.line([cx - w*0.2, y0 + h*0.12, cx + w*0.2, y0 + h*0.12], fill=color, width=2)
    draw.ellipse([cx - radius*0.1, y1 - h*0.14, cx + radius*0.1, y1 - h*0.14 + radius*0.2], fill=color)

def draw_vector_pin(draw, cx, cy, radius, color):
    r = radius * 0.65
    top_cy = cy - radius * 0.3
    draw.ellipse([cx - r, top_cy - r, cx + r, top_cy + r], fill=color)
    ir = r * 0.42
    draw.ellipse([cx - ir, top_cy - ir, cx + ir, top_cy + ir], fill=(255, 255, 255))
    tip_y = cy + radius * 0.95
    p1 = (cx - r * 0.85, top_cy + r * 0.45)
    p2 = (cx + r * 0.85, top_cy + r * 0.45)
    p3 = (cx, tip_y)
    draw.polygon([p1, p2, p3], fill=color)

def generate_instagram_square():
    W, H = 1080, 1080
    TEAL_DEEP = (0, 102, 128)
    TEAL_PRIMARY = (0, 138, 166)
    MINT_GREEN = (92, 191, 172)
    MINT_LIGHT = (236, 249, 247)
    WHITE = (255, 255, 255)
    NAVY_TITLE = (14, 33, 44)
    MUTED_TEXT = (95, 115, 125)
    EMERGENCY_RED = (230, 40, 50)
    
    canvas = Image.new('RGB', (W, H), (248, 252, 252))
    draw = ImageDraw.Draw(canvas)
    
    # Fonts
    font_bold = "C:/Windows/Fonts/segoeuib.ttf"
    font_reg = "C:/Windows/Fonts/segoeui.ttf"
    font_semi = "C:/Windows/Fonts/seguisb.ttf"
    
    # Top curved header
    draw.chord([-100, -200, W + 100, 320], start=0, end=180, fill=(215, 243, 240))
    
    # Logo
    if os.path.exists("logo.png"):
        logo = Image.open("logo.png").convert('RGBA')
        logo = logo.resize((200, 200), Image.Resampling.LANCZOS)
        # White card
        draw.rounded_rectangle([40, 25, 260, 200], radius=18, fill=WHITE, outline=MINT_GREEN, width=2)
        canvas.paste(logo, (50, 15), logo)
        
    # Top Header
    draw.rounded_rectangle([280, 35, 620, 72], radius=10, fill=TEAL_DEEP)
    draw.text((295, 42), "SERVICIOS MÉDICOS A DOMICILIO", font=ImageFont.truetype(font_bold, 17), fill=WHITE)
    
    draw.text((280, 85), "ATENCIÓN MÉDICA INTEGRAL", font=ImageFont.truetype(font_bold, 30), fill=NAVY_TITLE)
    draw.text((280, 124), "EN LA COMODIDAD DE TU HOGAR", font=ImageFont.truetype(font_bold, 30), fill=TEAL_PRIMARY)
    draw.text((280, 168), "Valencia, Edo. Carabobo • Emergencias y Cuidados Clínicos", font=ImageFont.truetype(font_semi, 18), fill=MUTED_TEXT)
    
    # Doctor on right
    if os.path.exists("doctor.jpg"):
        doc = Image.open("doctor.jpg").convert('RGB')
        doc = doc.resize((380, 530), Image.Resampling.LANCZOS)
        
        # Shadow
        d_shadow = Image.new('RGBA', (400, 550), (0, 0, 0, 0))
        ImageDraw.Draw(d_shadow).rounded_rectangle([10, 10, 390, 540], radius=24, fill=(0, 60, 75, 40))
        d_shadow = d_shadow.filter(ImageFilter.GaussianBlur(10))
        canvas.paste(d_shadow, (650, 220), d_shadow)
        
        # Mask
        mask = Image.new('L', (380, 530), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, 380, 530], radius=24, fill=255)
        canvas.paste(doc, (660, 230), mask)
        
        doc_border = Image.new('RGBA', (380, 530), (0, 0, 0, 0))
        ImageDraw.Draw(doc_border).rounded_rectangle([0, 0, 379, 529], radius=24, outline=MINT_GREEN + (220,), width=3)
        canvas.paste(doc_border, (660, 230), doc_border)

    # 24H Emergency badge
    em_x, em_y, em_w, em_h = 630, 700, 380, 80
    draw.rounded_rectangle([em_x, em_y, em_x + em_w, em_y + em_h], radius=16, fill=WHITE, outline=EMERGENCY_RED, width=2)
    draw.rounded_rectangle([em_x + 10, em_y + 10, em_x + 70, em_y + 70], radius=12, fill=EMERGENCY_RED)
    draw.text((em_x + 18, em_y + 18), "24", font=ImageFont.truetype(font_bold, 30), fill=WHITE)
    draw.text((em_x + 24, em_y + 48), "HRS", font=ImageFont.truetype(font_bold, 12), fill=WHITE)
    draw.text((em_x + 85, em_y + 14), "EMERGENCIAS MÉDICAS 24/7", font=ImageFont.truetype(font_bold, 18), fill=EMERGENCY_RED)
    draw.text((em_x + 85, em_y + 42), "Respuesta inmediata en Valencia", font=ImageFont.truetype(font_semi, 15), fill=NAVY_TITLE)

    # Left side: Key services
    draw.rounded_rectangle([40, 230, 620, 780], radius=20, fill=WHITE, outline=MINT_LIGHT, width=2)
    draw.rounded_rectangle([40, 230, 620, 280], radius=20, fill=TEAL_DEEP)
    draw.rectangle([40, 260, 620, 280], fill=TEAL_DEEP)
    draw.text((60, 242), "SERVICIOS MÉDICOS DESTACADOS", font=ImageFont.truetype(font_bold, 19), fill=WHITE)
    
    core_services = [
        "Emergencia médica a domicilio 24 horas",
        "Inyecciones endovenosas e intramusculares",
        "Curaciones de heridas, úlceras y escaras",
        "Cambio y colocación de sonda vesical / nasogástrica",
        "Sueroterapia e hidratación endovenosa",
        "Canalización de vías periféricas para tratamiento",
        "Drenaje de abscesos cutáneos con técnica estéril",
        "Procedimientos menores: suturas y retiro de puntos",
        "Control de enfermedades: Diabetes e Hipertensión",
        "Telemedicina (videollamadas) y certificados médicos"
    ]
    
    sy = 295
    for i, s in enumerate(core_services):
        # Icon dot
        dot_col = EMERGENCY_RED if i == 0 else TEAL_PRIMARY
        draw.ellipse([60, sy + 7, 78, sy + 25], fill=dot_col)
        draw_vector_check(draw, 60, sy + 7, 18, WHITE, width=2)
        
        font_s = ImageFont.truetype(font_bold, 17) if i == 0 else ImageFont.truetype(font_semi, 16)
        draw.text((90, sy + 5), s, font=font_s, fill=NAVY_TITLE)
        sy += 48

    # Bottom Contact Bar
    draw.rectangle([0, 890, W, H], fill=TEAL_DEEP)
    draw.rectangle([0, 890, W, 896], fill=MINT_GREEN)
    
    # Phone
    draw.ellipse([60, 915, 125, 980], fill=TEAL_PRIMARY)
    draw_vector_phone(draw, 92, 947, 18, WHITE)
    draw.text((140, 915), "Llamadas y WhatsApp 24/7:", font=ImageFont.truetype(font_semi, 16), fill=(210, 240, 245))
    draw.text((140, 938), "0412-1233287  /  0414-4417118", font=ImageFont.truetype(font_bold, 27), fill=WHITE)
    
    # Location
    draw.ellipse([630, 915, 695, 980], fill=TEAL_PRIMARY)
    draw_vector_pin(draw, 662, 947, 18, WHITE)
    draw.text((710, 915), "Ubicación y Cobertura:", font=ImageFont.truetype(font_semi, 16), fill=(210, 240, 245))
    draw.text((710, 938), "Valencia, Edo. Carabobo", font=ImageFont.truetype(font_bold, 25), fill=WHITE)
    
    draw.text((W // 2 - 200, 1025), "MEDIHOME • Tu salud y bienestar en tu hogar", font=ImageFont.truetype(font_reg, 15), fill=(180, 230, 235))
    
    canvas.save("post_instagram_cuadrado.png", "PNG", quality=95)
    print("Created post_instagram_cuadrado.png successfully!")

def generate_story_vertical():
    W, H = 1080, 1920
    TEAL_DEEP = (0, 102, 128)
    TEAL_PRIMARY = (0, 138, 166)
    MINT_GREEN = (92, 191, 172)
    MINT_LIGHT = (236, 249, 247)
    WHITE = (255, 255, 255)
    NAVY_TITLE = (14, 33, 44)
    MUTED_TEXT = (95, 115, 125)
    EMERGENCY_RED = (230, 40, 50)
    
    canvas = Image.new('RGB', (W, H), (248, 252, 252))
    draw = ImageDraw.Draw(canvas)
    
    font_bold = "C:/Windows/Fonts/segoeuib.ttf"
    font_reg = "C:/Windows/Fonts/segoeui.ttf"
    font_semi = "C:/Windows/Fonts/seguisb.ttf"
    
    # Top curved header
    draw.chord([-100, -200, W + 100, 500], start=0, end=180, fill=(215, 243, 240))
    
    # Logo
    if os.path.exists("logo.png"):
        logo = Image.open("logo.png").convert('RGBA')
        logo = logo.resize((260, 260), Image.Resampling.LANCZOS)
        draw.rounded_rectangle([W//2 - 140, 60, W//2 + 140, 290], radius=24, fill=WHITE, outline=MINT_GREEN, width=2)
        canvas.paste(logo, (W//2 - 130, 45), logo)

    # Title
    draw.rounded_rectangle([W//2 - 220, 310, W//2 + 220, 360], radius=12, fill=TEAL_DEEP)
    draw.text((W//2 - 195, 322), "SERVICIOS MÉDICOS A DOMICILIO", font=ImageFont.truetype(font_bold, 20), fill=WHITE)
    
    draw.text((W//2 - 340, 380), "ATENCIÓN MÉDICA INTEGRAL", font=ImageFont.truetype(font_bold, 40), fill=NAVY_TITLE)
    draw.text((W//2 - 330, 435), "EN LA COMODIDAD DE TU HOGAR", font=ImageFont.truetype(font_bold, 38), fill=TEAL_PRIMARY)
    draw.text((W//2 - 250, 495), "Valencia, Edo. Carabobo • Respuesta 24 Horas", font=ImageFont.truetype(font_semi, 22), fill=MUTED_TEXT)

    # Doctor Photo (Centered portrait)
    if os.path.exists("doctor.jpg"):
        doc = Image.open("doctor.jpg").convert('RGB')
        doc = doc.resize((500, 520), Image.Resampling.LANCZOS)
        
        d_shadow = Image.new('RGBA', (520, 540), (0, 0, 0, 0))
        ImageDraw.Draw(d_shadow).rounded_rectangle([10, 10, 510, 530], radius=28, fill=(0, 60, 75, 40))
        d_shadow = d_shadow.filter(ImageFilter.GaussianBlur(12))
        canvas.paste(d_shadow, (W//2 - 260, 540), d_shadow)
        
        mask = Image.new('L', (500, 520), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, 500, 520], radius=28, fill=255)
        canvas.paste(doc, (W//2 - 250, 550), mask)
        
        doc_border = Image.new('RGBA', (500, 520), (0, 0, 0, 0))
        ImageDraw.Draw(doc_border).rounded_rectangle([0, 0, 499, 519], radius=28, outline=MINT_GREEN + (220,), width=3)
        canvas.paste(doc_border, (W//2 - 250, 550), doc_border)

    # Emergency Badge
    em_x, em_y = W//2 - 220, 1020
    draw.rounded_rectangle([em_x, em_y, em_x + 440, em_y + 90], radius=20, fill=WHITE, outline=EMERGENCY_RED, width=3)
    draw.rounded_rectangle([em_x + 10, em_y + 10, em_x + 75, em_y + 80], radius=15, fill=EMERGENCY_RED)
    draw.text((em_x + 18, em_y + 18), "24", font=ImageFont.truetype(font_bold, 36), fill=WHITE)
    draw.text((em_x + 95, em_y + 16), "EMERGENCIAS MÉDICAS 24H", font=ImageFont.truetype(font_bold, 22), fill=EMERGENCY_RED)
    draw.text((em_x + 95, em_y + 48), "Atención médica inmediata en tu casa", font=ImageFont.truetype(font_semi, 18), fill=NAVY_TITLE)

    # 11 Services List in compact beautiful card
    card_x, card_y, card_w, card_h = 60, 1135, W - 120, 480
    draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + card_h], radius=24, fill=WHITE, outline=MINT_LIGHT, width=2)
    draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + 55], radius=24, fill=TEAL_DEEP)
    draw.rectangle([card_x, card_y + 30, card_x + card_w, card_y + 55], fill=TEAL_DEEP)
    draw.text((card_x + 30, card_y + 15), "NUESTROS 11 SERVICIOS MÉDICOS A DOMICILIO", font=ImageFont.truetype(font_bold, 22), fill=WHITE)
    
    story_services = [
        "1. Servicio médico de emergencia a domicilio 24 horas",
        "2. Administración de medicamentos (intravenoso e intramuscular)",
        "3. Curaciones y cuidados de heridas y úlceras",
        "4. Cambio y colocación de sonda vesical / nasogástrica",
        "5. Sueroterapia e hidratación endovenosa",
        "6. Canalización de vías periféricas para tratamiento",
        "7. Drenaje de abscesos cutáneos con técnica aséptica",
        "8. Procedimientos menores (suturas y retiro de puntos)",
        "9. Certificados médicos oficiales (conducir, laboral, escolar)",
        "10. Telemedicina y consulta médica por videollamada",
        "11. Control de enfermedades crónicas (diabetes e hipertensión)"
    ]
    
    sy = card_y + 70
    for s in story_services:
        is_emerg = "24 horas" in s
        col = EMERGENCY_RED if is_emerg else NAVY_TITLE
        fn = ImageFont.truetype(font_bold, 17) if is_emerg else ImageFont.truetype(font_semi, 16)
        
        # Check
        draw.ellipse([card_x + 25, sy + 3, card_x + 43, sy + 21], fill=TEAL_PRIMARY)
        draw_vector_check(draw, card_x + 25, sy + 3, 18, WHITE, width=2)
        draw.text((card_x + 55, sy), s, font=fn, fill=col)
        sy += 36

    # Bottom Contact Bar
    draw.rectangle([0, 1640, W, H], fill=TEAL_DEEP)
    draw.rectangle([0, 1640, W, 1648], fill=MINT_GREEN)
    
    draw.text((W//2 - 280, 1665), "¡COMUNÍCATE CON NOSOTROS HOY MISMO!", font=ImageFont.truetype(font_bold, 24), fill=WHITE)
    
    # Phone Card
    draw.rounded_rectangle([60, 1715, W - 60, 1845], radius=20, fill=WHITE)
    draw.ellipse([90, 1735, 170, 1815], fill=TEAL_PRIMARY)
    draw_vector_phone(draw, 130, 1775, 24, WHITE)
    
    draw.text((195, 1730), "Líneas de Atención & WhatsApp 24/7:", font=ImageFont.truetype(font_semi, 20), fill=MUTED_TEXT)
    draw.text((195, 1760), "0412-1233287  /  0414-4417118", font=ImageFont.truetype(font_bold, 34), fill=NAVY_TITLE)
    draw.text((195, 1805), "Valencia, Edo. Carabobo • Atención directa en tu hogar", font=ImageFont.truetype(font_bold, 18), fill=TEAL_PRIMARY)

    draw.text((W//2 - 250, 1875), "MEDIHOME • Salud y Confianza en tu Hogar", font=ImageFont.truetype(font_reg, 16), fill=(200, 240, 245))

    canvas.save("story_whatsapp_instagram.png", "PNG", quality=95)
    print("Created story_whatsapp_instagram.png successfully!")

if __name__ == "__main__":
    generate_instagram_square()
    generate_story_vertical()
