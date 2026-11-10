import os
import math
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

def draw_icon_stethoscope(draw, cx, cy, size, color):
    r = size * 0.35
    draw.arc([cx - r, cy - r*0.8, cx + r, cy + r*0.4], start=0, end=180, fill=color, width=3)
    draw.line([cx, cy + r*0.2, cx, cy + size*0.4], fill=color, width=3)
    draw.ellipse([cx - size*0.12, cy + size*0.35, cx + size*0.12, cy + size*0.59], fill=color)

def draw_icon_clipboard(draw, cx, cy, size, color):
    w, h = size * 0.6, size * 0.75
    draw.rounded_rectangle([cx - w/2, cy - h/2, cx + w/2, cy + h/2], radius=4, outline=color, width=2)
    draw.line([cx - w*0.25, cy - h*0.15, cx + w*0.25, cy - h*0.15], fill=color, width=2)
    draw.line([cx - w*0.25, cy + h*0.05, cx + w*0.25, cy + h*0.05], fill=color, width=2)
    draw.line([cx - w*0.25, cy + h*0.25, cx + w*0.1, cy + h*0.25], fill=color, width=2)

def draw_icon_people(draw, cx, cy, size, color):
    r = size * 0.16
    draw.ellipse([cx - size*0.18 - r, cy - size*0.25 - r, cx - size*0.18 + r, cy - size*0.25 + r], fill=color)
    draw.ellipse([cx + size*0.18 - r, cy - size*0.25 - r, cx + size*0.18 + r, cy - size*0.25 + r], fill=color)
    draw.arc([cx - size*0.4, cy - size*0.05, cx + size*0.04, cy + size*0.35], start=180, end=0, fill=color, width=2)
    draw.arc([cx - size*0.04, cy - size*0.05, cx + size*0.4, cy + size*0.35], start=180, end=0, fill=color, width=2)

def draw_icon_heart_pulse(draw, cx, cy, size, color):
    r = size * 0.35
    draw.arc([cx - r, cy - r, cx, cy], start=180, end=0, fill=color, width=2)
    draw.arc([cx, cy - r, cx + r, cy], start=180, end=0, fill=color, width=2)
    p = [(cx - r, cy - r*0.2), (cx, cy + r*0.7), (cx + r, cy - r*0.2)]
    draw.polygon(p, fill=color)
    draw.line([cx - r*0.5, cy, cx - r*0.15, cy, cx, cy - r*0.4, cx + r*0.2, cy + r*0.3, cx + r*0.5, cy], fill=(255, 255, 255), width=2)

def draw_icon_syringe(draw, cx, cy, size, color):
    p1 = (cx - size*0.25, cy + size*0.25)
    p2 = (cx + size*0.25, cy - size*0.25)
    draw.line([p1, p2], fill=color, width=4)
    draw.line([p2, (cx + size*0.35, cy - size*0.35)], fill=color, width=2)
    draw.line([(cx - size*0.15, cy + size*0.35), (cx - size*0.35, cy + size*0.15)], fill=color, width=2)

def draw_icon_scissors(draw, cx, cy, size, color):
    r = size * 0.15
    draw.ellipse([cx - size*0.3 - r, cy + size*0.2 - r, cx - size*0.3 + r, cy + size*0.2 + r], outline=color, width=2)
    draw.ellipse([cx + size*0.3 - r, cy + size*0.2 - r, cx + size*0.3 + r, cy + size*0.2 + r], outline=color, width=2)
    draw.line([cx - size*0.25, cy + size*0.15, cx + size*0.25, cy - size*0.3], fill=color, width=2)
    draw.line([cx + size*0.25, cy + size*0.15, cx - size*0.25, cy - size*0.3], fill=color, width=2)

def draw_icon_tube(draw, cx, cy, size, color):
    draw.arc([cx - size*0.3, cy - size*0.3, cx + size*0.3, cy + size*0.3], start=45, end=315, fill=color, width=3)
    draw.line([cx + size*0.2, cy + size*0.2, cx + size*0.35, cy + size*0.35], fill=color, width=3)

def draw_icon_certificate(draw, cx, cy, size, color):
    w, h = size * 0.55, size * 0.7
    draw.rounded_rectangle([cx - w/2, cy - h/2, cx + w/2, cy + h/2], radius=4, outline=color, width=2)
    draw.ellipse([cx - size*0.12, cy - size*0.12, cx + size*0.12, cy + size*0.12], fill=color)
    draw.line([cx - w*0.25, cy + h*0.25, cx + w*0.25, cy + h*0.25], fill=color, width=2)

def draw_icon_pill(draw, cx, cy, size, color):
    w, h = size * 0.6, size * 0.3
    draw.rounded_rectangle([cx - w/2, cy - h/2, cx + w/2, cy + h/2], radius=h/2, outline=color, width=2)
    draw.line([cx, cy - h/2, cx, cy + h/2], fill=color, width=2)

def draw_icon_virus(draw, cx, cy, size, color):
    r = size * 0.22
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
    for ang in range(0, 360, 45):
        rad = math.radians(ang)
        x1 = cx + math.cos(rad) * r
        y1 = cy + math.sin(rad) * r
        x2 = cx + math.cos(rad) * (r + size*0.15)
        y2 = cy + math.sin(rad) * (r + size*0.15)
        draw.line([(x1, y1), (x2, y2)], fill=color, width=2)

def draw_icon_shield(draw, cx, cy, size, color):
    w, h = size * 0.7, size * 0.8
    p = [
        (cx - w/2, cy - h/2),
        (cx + w/2, cy - h/2),
        (cx + w/2, cy),
        (cx, cy + h/2),
        (cx - w/2, cy)
    ]
    draw.polygon(p, fill=color)
    draw.line([cx, cy - h*0.25, cx, cy + h*0.25], fill=(255, 255, 255), width=2)
    draw.line([cx - w*0.22, cy, cx + w*0.22, cy], fill=(255, 255, 255), width=2)

def build_improved_flyer():
    W, H = 1600, 2000
    
    # Exact colors from MediHome Logo & Visual Identity
    TEAL_DARK = (0, 115, 138)        # #00738a
    TEAL_PRIMARY = (1, 142, 172)     # #018eac
    TEAL_MINT = (86, 185, 167)       # #56b9a7
    TEAL_SOFT = (220, 244, 241)      # #dcf4f1
    TEAL_TINT = (242, 251, 250)      # #f2fbfb
    WHITE = (255, 255, 255)
    NAVY_TEXT = (18, 38, 48)         # #122630
    MUTED_TEXT = (95, 115, 125)
    LINE_GRAY = (222, 235, 238)
    RED_EMERGENCY = (230, 45, 55)
    
    canvas = Image.new('RGB', (W, H), WHITE)
    draw = ImageDraw.Draw(canvas)
    
    # 1. Background Organic Flow Curves (matching competitor / custom wave style)
    # Layered organic curves in top-right
    for offset, col in [(120, (235, 248, 246)), (70, (218, 244, 241)), (20, (198, 238, 233)), (0, TEAL_MINT)]:
        draw.chord([W - 1100 - offset, -550 + offset, W + 450 + offset, 850 + offset], start=90, end=270, fill=col)
        
    # Top-right curved accent lines
    draw.arc([W - 950, -400, W + 500, 950], start=90, end=270, fill=TEAL_PRIMARY, width=4)
    draw.arc([W - 850, -350, W + 500, 950], start=90, end=270, fill=WHITE, width=3)
    
    # 2. DOCTOR IMAGE ON RIGHT
    doc_path = "doctor_male_hd.jpg"
    if not os.path.exists(doc_path):
        doc_path = "male_doctor_crop.jpg"
        
    if os.path.exists(doc_path):
        doc = Image.open(doc_path).convert('RGBA')
        dw, dh = 890, 1310
        doc_res = doc.resize((dw, dh), Image.Resampling.LANCZOS)
        
        # Smooth alpha mask
        mask = Image.new('L', (dw, dh), 255)
        mask_draw = ImageDraw.Draw(mask)
        
        # Left fade
        for x in range(180):
            alpha = int(255 * (x / 180.0))
            mask_draw.line([(x, 0), (x, dh)], fill=alpha)
            
        # Bottom fade
        for y in range(dh - 200, dh):
            alpha = int(255 * ((dh - y) / 200.0))
            for x in range(dw):
                curr = mask.getpixel((x, y))
                mask.putpixel((x, y), min(curr, alpha))
                
        doc_x = W - dw + 55
        doc_y = 115
        canvas.paste(doc_res, (doc_x, doc_y), mask)

    # 3. LOGO (Top-Left)
    logo_path = "logo.png"
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert('RGBA')
        lw, lh = 450, 450
        logo_res = logo.resize((lw, lh), Image.Resampling.LANCZOS)
        
        # Make white bg transparent
        datas = logo_res.getdata()
        new_data = []
        for item in datas:
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
        logo_res.putdata(new_data)
        canvas.paste(logo_res, (75, 25), logo_res)

    # Fonts
    font_bold = "C:/Windows/Fonts/segoeuib.ttf"
    font_reg = "C:/Windows/Fonts/segoeui.ttf"
    font_semi = "C:/Windows/Fonts/seguisb.ttf"
    
    svc_title_font = ImageFont.truetype(font_bold, 24)
    svc_sub_font = ImageFont.truetype(font_reg, 19)
    badge_hdr_font = ImageFont.truetype(font_bold, 21)
    
    # Header tag under Logo: "SERVICIOS MÉDICOS A DOMICILIO"
    tag_x, tag_y = 80, 480
    draw.rounded_rectangle([tag_x, tag_y, tag_x + 360, tag_y + 46], radius=14, fill=TEAL_DARK)
    draw.text((tag_x + 22, tag_y + 11), "SERVICIOS MÉDICOS", font=badge_hdr_font, fill=WHITE)
    draw.rounded_rectangle([tag_x + 245, tag_y + 8, tag_x + 348, tag_y + 38], radius=10, fill=TEAL_MINT)
    draw.text((tag_x + 258, tag_y + 12), "24 HORAS", font=ImageFont.truetype(font_bold, 15), fill=WHITE)

    # 4. SERVICES LIST (LEFT COLUMN)
    services = [
        ("Atención médica general y de urgencias", "Consulta médica profesional directa en tu domicilio", draw_icon_stethoscope, True),
        ("Control médico preventivo", "Chequeo clínico y valoración del estado de salud", draw_icon_clipboard, False),
        ("Atención de niños, adultos y adultos mayores", "Cuidado especializado y empático para toda la familia", draw_icon_people, False),
        ("Control de enfermedades crónicas", "Monitoreo continuo de Diabetes Mellitus e Hipertensión", draw_icon_heart_pulse, False),
        ("Atención de infecciones respiratorias y más", "Diagnóstico oportuno de cuadros virales y digestivos", draw_icon_virus, False),
        ("Orientación anticonceptiva y salud femenina", "Asesoría médica profesional y planificación familiar", draw_icon_pill, False),
        ("Colocación y retiro de implante subdérmico", "Procedimiento anticonceptivo menor con técnica aséptica", draw_icon_syringe, False),
        ("Procedimientos menores (suturas y puntos)", "Curas estériles, suturas y retiro de puntos", draw_icon_scissors, False),
        ("Colocación y retiro de sonda vesical", "Manejo aséptico de sondas y cuidados urológicos", draw_icon_tube, False),
        ("Colocación de inyecciones y sueroterapia", "Administración endovenosa (EV) e intramuscular (IM)", draw_icon_syringe, False),
        ("Certificados médicos oficiales", "Evaluaciones médicas para conducir, escolar y laboral", draw_icon_certificate, False)
    ]
    
    start_y = 548
    step_y = 89
    left_x = 80
    list_w = 705
    
    for idx, (title, desc, icon_func, is_hl) in enumerate(services):
        item_y = start_y + idx * step_y
        
        # Icon circle
        icon_cx = left_x + 28
        icon_cy = item_y + 28
        
        bg_c = (255, 240, 242) if is_hl else TEAL_SOFT
        brd_c = RED_EMERGENCY if is_hl else TEAL_MINT
        ic_c = RED_EMERGENCY if is_hl else TEAL_DARK
        txt_c = RED_EMERGENCY if is_hl else NAVY_TEXT
        
        draw.ellipse([icon_cx - 22, icon_cy - 22, icon_cx + 22, icon_cy + 22], fill=bg_c, outline=brd_c, width=2)
        icon_func(draw, icon_cx, icon_cy, 26, ic_c)
        
        # Text
        draw.text((left_x + 68, item_y + 4), title, font=svc_title_font, fill=txt_c)
        draw.text((left_x + 68, item_y + 33), desc, font=svc_sub_font, fill=MUTED_TEXT)
        
        # Thin divider line
        if idx < len(services) - 1:
            draw.line([left_x, item_y + 75, left_x + list_w, item_y + 75], fill=LINE_GRAY, width=1)
            draw.ellipse([left_x + list_w - 5, item_y + 73, left_x + list_w, item_y + 77], fill=TEAL_MINT)

    # 5. BOTTOM SECTION: FLUID WAVE TRANSITION
    bot_y = 1555
    # Smooth wave arcs matching original competitor wave transition
    draw.chord([-200, bot_y - 70, W + 200, bot_y + 160], start=0, end=180, fill=TEAL_SOFT)
    draw.rectangle([0, bot_y + 45, W, H], fill=TEAL_SOFT)
    
    # Dark Teal Bottom Bar
    dark_bar_y = 1615
    draw.rectangle([0, dark_bar_y, W, H], fill=TEAL_DARK)
    draw.rectangle([0, dark_bar_y, W, dark_bar_y + 8], fill=TEAL_MINT)
    
    # Left Contact Card
    c_card_x, c_card_y = 75, dark_bar_y + 45
    c_card_w, c_card_h = 785, 245
    
    draw.rounded_rectangle([c_card_x, c_card_y, c_card_x + c_card_w, c_card_y + c_card_h], radius=24, fill=WHITE)
    
    # "Solicita tu servicio:" Pill
    pill_w, pill_h = 320, 52
    draw.rounded_rectangle([c_card_x + 35, c_card_y + 22, c_card_x + 35 + pill_w, c_card_y + 22 + pill_h], radius=26, fill=TEAL_PRIMARY)
    draw.text((c_card_x + 70, c_card_y + 32), "Solicita tu servicio:", font=ImageFont.truetype(font_bold, 24), fill=WHITE)
    
    # Phone line
    phone_cx, phone_cy = c_card_x + 65, c_card_y + 118
    draw.ellipse([phone_cx - 24, phone_cy - 24, phone_cx + 24, phone_cy + 24], fill=TEAL_SOFT)
    draw_vector_phone(draw, phone_cx, phone_cy, 18, TEAL_DARK)
    draw.text((c_card_x + 105, c_card_y + 102), "+58 412-1233287, +58 4144417118", font=ImageFont.truetype(font_bold, 28), fill=NAVY_TEXT)
    
    # Location line
    pin_cx, pin_cy = c_card_x + 65, c_card_y + 190
    draw.ellipse([pin_cx - 24, pin_cy - 24, pin_cx + 24, pin_cy + 24], fill=TEAL_SOFT)
    draw_vector_pin(draw, pin_cx, pin_cy, 18, TEAL_DARK)
    draw.text((c_card_x + 105, c_card_y + 172), "Ubicación: Valencia. Edo. Carabobo", font=ImageFont.truetype(font_bold, 28), fill=NAVY_TEXT)

    # 6. RIGHT 3 TRUST BADGES (With custom vector icons)
    badges = [
        ("Atención", "presencial y", "teleconsulta", draw_icon_shield),
        ("Trato humano", "y cercano", "al paciente", draw_icon_people),
        ("Cuidado integral", "de tu salud y", "del corazón", draw_icon_heart_pulse)
    ]
    
    badge_start_x = 905
    badge_w = 210
    badge_gap = 25
    
    for i, (l1, l2, l3, b_icon) in enumerate(badges):
        bx = badge_start_x + i * (badge_w + badge_gap)
        by = dark_bar_y + 55
        
        icx = bx + badge_w / 2
        icy = by + 50
        draw.ellipse([icx - 45, icy - 45, icx + 45, icy + 45], fill=WHITE, outline=TEAL_MINT, width=3)
        b_icon(draw, icx, icy, 36, TEAL_PRIMARY)
        
        ty = icy + 65
        draw.text((icx, ty), l1, font=ImageFont.truetype(font_bold, 20), fill=WHITE, anchor="mm")
        draw.text((icx, ty + 28), l2, font=ImageFont.truetype(font_semi, 18), fill=(210, 240, 245), anchor="mm")
        draw.text((icx, ty + 54), l3, font=ImageFont.truetype(font_semi, 18), fill=(210, 240, 245), anchor="mm")

    # Bottom Copyright & Brand Integrity Tag
    draw.text((W // 2, H - 35), "MEDIHOME © Marca Registrada • Servicios Médicos Profesionales a Domicilio • Valencia, Carabobo", font=ImageFont.truetype(font_reg, 18), fill=(190, 235, 240), anchor="mm")

    out_file = "flyer_medihome_ultra_hd_mejorado.png"
    canvas.save(out_file, "PNG", quality=98)
    print(f"Generated {out_file} successfully! Size: {W}x{H}")

if __name__ == "__main__":
    build_improved_flyer()
