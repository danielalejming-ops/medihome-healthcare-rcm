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

def draw_vector_cross(draw, cx, cy, size, color):
    t = size * 0.32
    draw.rounded_rectangle([cx - t/2, cy - size/2, cx + t/2, cy + size/2], radius=t*0.2, fill=color)
    draw.rounded_rectangle([cx - size/2, cy - t/2, cx + size/2, cy + t/2], radius=t*0.2, fill=color)

def create_hd_flyer():
    W, H = 1400, 2000
    
    # MediHome Palette
    TEAL_DEEP = (0, 102, 128)        # #006680
    TEAL_PRIMARY = (0, 138, 166)     # #008aa6
    TEAL_ACCENT = (14, 165, 185)     # #0ea5b9
    MINT_GREEN = (92, 191, 172)      # #5cbfac
    MINT_LIGHT = (236, 249, 247)     # #ecf9f7
    BG_CREAM = (248, 252, 252)       # Ultra clean medical
    WHITE = (255, 255, 255)
    NAVY_TITLE = (14, 33, 44)
    CHARCOAL_TEXT = (45, 62, 72)
    MUTED_TEXT = (95, 115, 125)
    EMERGENCY_RED = (230, 40, 50)
    
    canvas = Image.new('RGB', (W, H), BG_CREAM)
    draw = ImageDraw.Draw(canvas)
    
    # 1. Background Organic Graphics
    for offset, color in [(40, (230, 247, 245)), (20, (215, 243, 240)), (0, (200, 238, 234))]:
        draw.chord([-100, -200 + offset, W + 100, 480 + offset], start=0, end=180, fill=color)
    
    # Fonts
    font_bold = "C:/Windows/Fonts/segoeuib.ttf"
    font_reg = "C:/Windows/Fonts/segoeui.ttf"
    font_semi = "C:/Windows/Fonts/seguisb.ttf"
    
    header_sup_font = ImageFont.truetype(font_bold, 21)
    main_title_font = ImageFont.truetype(font_bold, 42)
    subtitle_font = ImageFont.truetype(font_semi, 24)
    sub_desc_font = ImageFont.truetype(font_reg, 20)
    
    section_h_font = ImageFont.truetype(font_bold, 25)
    svc_title_font = ImageFont.truetype(font_bold, 23)
    svc_desc_font = ImageFont.truetype(font_reg, 19)
    badge_title_font = ImageFont.truetype(font_bold, 23)
    badge_sub_font = ImageFont.truetype(font_semi, 18)
    
    contact_hdr_font = ImageFont.truetype(font_bold, 27)
    contact_num_font = ImageFont.truetype(font_bold, 33)
    contact_lbl_font = ImageFont.truetype(font_semi, 21)
    contact_sub_font = ImageFont.truetype(font_reg, 17)

    # 2. LOGO: Left Header Area
    logo_path = "logo.png"
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert('RGBA')
        logo_w, logo_h = 320, 320
        logo_res = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
        
        lbox_x, lbox_y, lbox_w, lbox_h = 60, 40, 350, 310
        l_shadow = Image.new('RGBA', (lbox_w + 20, lbox_h + 20), (0, 0, 0, 0))
        ImageDraw.Draw(l_shadow).rounded_rectangle([10, 10, lbox_w+10, lbox_h+10], radius=24, fill=(0, 60, 70, 35))
        l_shadow = l_shadow.filter(ImageFilter.GaussianBlur(10))
        canvas.paste(l_shadow, (lbox_x - 5, lbox_y - 5), l_shadow)
        
        draw.rounded_rectangle([lbox_x, lbox_y, lbox_x + lbox_w, lbox_y + lbox_h], radius=24, fill=WHITE, outline=MINT_GREEN, width=2)
        canvas.paste(logo_res, (lbox_x + 15, lbox_y - 5), logo_res)

    # 3. HEADER BANNER: Right of Logo
    hdr_x = 440
    # Top Tag
    draw.rounded_rectangle([hdr_x, 48, hdr_x + 400, 92], radius=12, fill=TEAL_DEEP)
    draw.text((hdr_x + 20, 56), "SERVICIOS MÉDICOS A DOMICILIO", font=header_sup_font, fill=WHITE)
    
    # Main Headline
    draw.text((hdr_x, 106), "SALUD Y ATENCIÓN PROFESIONAL", font=main_title_font, fill=NAVY_TITLE)
    draw.text((hdr_x, 156), "EN LA COMODIDAD DE TU HOGAR", font=main_title_font, fill=TEAL_PRIMARY)
    
    # Subtitle
    draw.text((hdr_x, 218), "Cobertura Médica Integral en Valencia, Edo. Carabobo", font=subtitle_font, fill=CHARCOAL_TEXT)
    draw.text((hdr_x, 254), "Asistencia oportuna, segura y humana con los más altos estándares clínicos.", font=sub_desc_font, fill=MUTED_TEXT)
    
    # Quality Pill Badges
    pills = [("Disponibilidad 24/7", TEAL_DEEP), ("Atención Personalizada", TEAL_PRIMARY), ("Médicos Calificados", MINT_GREEN)]
    px = hdr_x
    for ptext, pcol in pills:
        pw = len(ptext) * 11 + 30
        draw.rounded_rectangle([px, 298, px + pw, 338], radius=10, fill=WHITE, outline=pcol, width=2)
        draw.text((px + 15, 307), ptext, font=ImageFont.truetype(font_bold, 17), fill=pcol)
        px += pw + 15

    # 4. DOCTOR PHOTO CARD (Right Column)
    doctor_path = "doctor.jpg"
    doc_x, doc_y, doc_w, doc_h = 770, 385, 570, 810
    if os.path.exists(doctor_path):
        doc = Image.open(doctor_path).convert('RGB')
        doc_res = doc.resize((doc_w, doc_h), Image.Resampling.LANCZOS)
        
        d_shadow = Image.new('RGBA', (doc_w + 30, doc_h + 30), (0, 0, 0, 0))
        ImageDraw.Draw(d_shadow).rounded_rectangle([15, 15, doc_w + 15, doc_h + 15], radius=32, fill=(0, 60, 75, 45))
        d_shadow = d_shadow.filter(ImageFilter.GaussianBlur(14))
        canvas.paste(d_shadow, (doc_x - 15, doc_y - 15), d_shadow)
        
        mask = Image.new('L', (doc_w, doc_h), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, doc_w, doc_h], radius=30, fill=255)
        canvas.paste(doc_res, (doc_x, doc_y), mask)
        
        doc_border = Image.new('RGBA', (doc_w, doc_h), (0, 0, 0, 0))
        ImageDraw.Draw(doc_border).rounded_rectangle([0, 0, doc_w - 1, doc_h - 1], radius=30, outline=MINT_GREEN + (220,), width=3)
        canvas.paste(doc_border, (doc_x, doc_y), doc_border)

    # 5. FLOATING EMERGENCY 24H BADGE
    em_x, em_y, em_w, em_h = 740, 1130, 440, 105
    em_shadow = Image.new('RGBA', (em_w + 20, em_h + 20), (0, 0, 0, 0))
    ImageDraw.Draw(em_shadow).rounded_rectangle([10, 10, em_w + 10, em_h + 10], radius=22, fill=(0, 0, 0, 40))
    em_shadow = em_shadow.filter(ImageFilter.GaussianBlur(8))
    canvas.paste(em_shadow, (em_x - 10, em_y - 10), em_shadow)
    
    draw.rounded_rectangle([em_x, em_y, em_x + em_w, em_y + em_h], radius=22, fill=WHITE, outline=EMERGENCY_RED, width=3)
    draw.rounded_rectangle([em_x + 12, em_y + 12, em_x + 88, em_y + 92], radius=16, fill=EMERGENCY_RED)
    draw.text((em_x + 23, em_y + 24), "24", font=ImageFont.truetype(font_bold, 40), fill=WHITE)
    draw.text((em_x + 36, em_y + 64), "HRS", font=ImageFont.truetype(font_bold, 15), fill=WHITE)
    
    draw.text((em_x + 105, em_y + 20), "EMERGENCIAS MÉDICAS 24H", font=badge_title_font, fill=EMERGENCY_RED)
    draw.text((em_x + 105, em_y + 54), "Atención rápida en tu domicilio sin esperas", font=badge_sub_font, fill=CHARCOAL_TEXT)

    # Top Doctor Trust Tag
    dt_x, dt_y = 1110, 405
    draw.rounded_rectangle([dt_x, dt_y, dt_x + 210, dt_y + 70], radius=16, fill=WHITE, outline=TEAL_PRIMARY, width=2)
    draw.text((dt_x + 16, dt_y + 12), "Equipo Médico", font=ImageFont.truetype(font_bold, 20), fill=TEAL_DEEP)
    draw.text((dt_x + 16, dt_y + 38), "Colegiado y Confiable", font=ImageFont.truetype(font_semi, 16), fill=MUTED_TEXT)

    # 6. LEFT COLUMN: 11 COMPREHENSIVE SERVICES LIST
    col_x, col_y, col_w, col_h = 60, 385, 680, 1265
    svc_shadow = Image.new('RGBA', (col_w + 20, col_h + 20), (0, 0, 0, 0))
    ImageDraw.Draw(svc_shadow).rounded_rectangle([10, 10, col_w + 10, col_h + 10], radius=26, fill=(0, 60, 70, 30))
    svc_shadow = svc_shadow.filter(ImageFilter.GaussianBlur(10))
    canvas.paste(svc_shadow, (col_x - 10, col_y - 10), svc_shadow)
    
    draw.rounded_rectangle([col_x, col_y, col_x + col_w, col_y + col_h], radius=26, fill=WHITE, outline=MINT_LIGHT, width=2)
    
    # Header of Services Card
    draw.rounded_rectangle([col_x, col_y, col_x + col_w, col_y + 75], radius=26, fill=TEAL_DEEP)
    draw.rectangle([col_x, col_y + 40, col_x + col_w, col_y + 75], fill=TEAL_DEEP)
    draw_vector_cross(draw, col_x + 45, col_y + 37, 26, MINT_GREEN)
    draw.text((col_x + 75, col_y + 22), "NUESTROS SERVICIOS MÉDICOS", font=section_h_font, fill=WHITE)
    draw.text((col_x + 480, col_y + 28), "11 Especialidades", font=ImageFont.truetype(font_semi, 18), fill=MINT_GREEN)

    services_list = [
        ("Servicio médico de emergencia 24 horas", "Asistencia oportuna ante cualquier urgencia en el hogar", True),
        ("Administración de medicamentos", "Aplicación intravenosa (EV) e intramuscular (IM)", False),
        ("Curaciones y cuidados de heridas", "Tratamiento de úlceras, escaras y curas estériles", False),
        ("Cambio y manejo de sonda", "Sonda vesical (Foley) y nasogástrica con técnica aséptica", False),
        ("Sueroterapia e hidratación", "Terapia endovenosa con electrolitos y complejos vitamínicos", False),
        ("Canalización de vías periféricas", "Instalación de vías venosas para tratamientos continuos", False),
        ("Drenaje de abscesos cutáneos", "Procedimientos de alivio seguro y drenaje quirúrgico", False),
        ("Procedimientos menores", "Suturas de heridas, curas y retiro de puntos", False),
        ("Certificados médicos oficiales", "Evaluaciones médicas para conducir, laboral y escolar", False),
        ("Telemedicina y videollamada", "Orientación, triage y seguimiento médico a distancia", False),
        ("Control de enfermedades crónicas", "Monitoreo integral de Diabetes Mellitus e Hipertensión", False)
    ]

    item_start_y = col_y + 92
    item_gap = 105

    for idx, (stitle, sdesc, is_emerg) in enumerate(services_list):
        iy = item_start_y + idx * item_gap
        circle_cx, circle_cy, cr = col_x + 45, iy + 36, 26
        
        if is_emerg:
            circ_bg = (255, 240, 242)
            circ_border = EMERGENCY_RED
            text_num_col = EMERGENCY_RED
            title_col = EMERGENCY_RED
        else:
            circ_bg = MINT_LIGHT
            circ_border = TEAL_PRIMARY
            text_num_col = TEAL_DEEP
            title_col = NAVY_TITLE
            
        draw.ellipse([circle_cx - cr, circle_cy - cr, circle_cx + cr, circle_cy + cr], fill=circ_bg, outline=circ_border, width=2)
        num_txt = f"{idx+1:02d}"
        draw.text((circle_cx - 13, circle_cy - 12), num_txt, font=ImageFont.truetype(font_bold, 18), fill=text_num_col)
        
        draw.text((col_x + 88, iy + 14), stitle, font=svc_title_font, fill=title_col)
        draw.text((col_x + 88, iy + 45), sdesc, font=svc_desc_font, fill=MUTED_TEXT)
        
        if idx < len(services_list) - 1:
            draw.line([col_x + 30, iy + 88, col_x + col_w - 30, iy + 88], fill=(238, 244, 246), width=1)

    # 7. RIGHT BOTTOM: BENEFITS CARD
    b_x, b_y, b_w, b_h = 770, 1260, 570, 390
    b_shadow = Image.new('RGBA', (b_w + 20, b_h + 20), (0, 0, 0, 0))
    ImageDraw.Draw(b_shadow).rounded_rectangle([10, 10, b_w + 10, b_h + 10], radius=24, fill=(0, 60, 70, 25))
    b_shadow = b_shadow.filter(ImageFilter.GaussianBlur(10))
    canvas.paste(b_shadow, (b_x - 10, b_y - 10), b_shadow)
    
    draw.rounded_rectangle([b_x, b_y, b_x + b_w, b_y + b_h], radius=24, fill=WHITE, outline=MINT_LIGHT, width=2)
    
    draw.rounded_rectangle([b_x + 20, b_y + 18, b_x + b_w - 20, b_y + 70], radius=14, fill=MINT_LIGHT)
    draw.text((b_x + 35, b_y + 30), "¿POR QUÉ CONFIAR EN MEDIHOME?", font=ImageFont.truetype(font_bold, 22), fill=TEAL_DEEP)
    
    benefits = [
        ("Atención médica 100% en tu domicilio", "Evita traslados incómodos y salas de espera."),
        ("Materiales e insumos estériles", "Máxima bioseguridad y asepsia en cada procedimiento."),
        ("Respuesta inmediata en Valencia", "Cobertura rápida en urbanizaciones y zonas céntricas."),
        ("Trato humano, respetuoso y cálido", "Cuidado integral para adultos mayores, niños y adultos.")
    ]
    
    by_curr = b_y + 90
    for b_title, b_sub in benefits:
        chk_cx, chk_cy = b_x + 45, by_curr + 22
        draw.ellipse([chk_cx - 15, chk_cy - 15, chk_cx + 15, chk_cy + 15], fill=TEAL_PRIMARY)
        draw_vector_check(draw, chk_cx - 15, chk_cy - 15, 30, WHITE, width=3)
        
        draw.text((b_x + 72, by_curr + 4), b_title, font=ImageFont.truetype(font_bold, 21), fill=NAVY_TITLE)
        draw.text((b_x + 72, by_curr + 33), b_sub, font=ImageFont.truetype(font_reg, 18), fill=MUTED_TEXT)
        by_curr += 68

    # 8. BOTTOM FOOTER / CONTACT BAR
    foot_y = 1680
    foot_h = 320
    
    draw.rectangle([0, foot_y, W, H], fill=TEAL_DEEP)
    draw.rectangle([0, foot_y, W, foot_y + 8], fill=TEAL_ACCENT)
    
    draw.text((60, foot_y + 26), "¡AGENDA TU ATENCIÓN MÉDICA O SOLICITA ASISTENCIA DE EMERGENCIA!", font=contact_hdr_font, fill=WHITE)
    
    # Contact Pill 1: Phone & WhatsApp
    cp1_x, cp1_y, cp1_w, cp1_h = 60, foot_y + 75, 780, 160
    draw.rounded_rectangle([cp1_x, cp1_y, cp1_x + cp1_w, cp1_y + cp1_h], radius=22, fill=WHITE)
    
    p_cx, p_cy = cp1_x + 65, cp1_y + 80
    draw.ellipse([p_cx - 40, p_cy - 40, p_cx + 40, p_cy + 40], fill=TEAL_PRIMARY)
    draw_vector_phone(draw, p_cx, p_cy, 24, WHITE)
    
    draw.text((cp1_x + 125, cp1_y + 20), "Líneas de Atención & WhatsApp 24 Horas:", font=contact_lbl_font, fill=MUTED_TEXT)
    draw.text((cp1_x + 125, cp1_y + 56), "0412-1233287  /  0414-4417118", font=contact_num_font, fill=NAVY_TITLE)
    
    # Bullet point with vector check
    chk_b_x, chk_b_y = cp1_x + 125, cp1_y + 112
    draw.ellipse([chk_b_x, chk_b_y, chk_b_x + 18, chk_b_y + 18], fill=MINT_GREEN)
    draw_vector_check(draw, chk_b_x, chk_b_y, 18, WHITE, width=2)
    draw.text((cp1_x + 152, cp1_y + 110), "Llamadas directas y mensajes de WhatsApp disponibles 24/7", font=contact_sub_font, fill=TEAL_DEEP)

    # Contact Pill 2: Location
    cp2_x, cp2_y, cp2_w, cp2_h = 870, foot_y + 75, 470, 160
    draw.rounded_rectangle([cp2_x, cp2_y, cp2_x + cp2_w, cp2_y + cp2_h], radius=22, fill=WHITE)
    
    pin_cx, pin_cy = cp2_x + 60, cp2_y + 80
    draw.ellipse([pin_cx - 40, pin_cy - 40, pin_cx + 40, pin_cy + 40], fill=TEAL_PRIMARY)
    draw_vector_pin(draw, pin_cx, pin_cy, 24, WHITE)
    
    draw.text((cp2_x + 120, cp2_y + 20), "Ubicación y Cobertura:", font=contact_lbl_font, fill=MUTED_TEXT)
    draw.text((cp2_x + 120, cp2_y + 56), "Valencia, Carabobo", font=ImageFont.truetype(font_bold, 30), fill=NAVY_TITLE)
    
    chk_p_x, chk_p_y = cp2_x + 120, cp2_y + 112
    draw.ellipse([chk_p_x, chk_p_y, chk_p_x + 18, chk_p_y + 18], fill=MINT_GREEN)
    draw_vector_check(draw, chk_p_x, chk_p_y, 18, WHITE, width=2)
    draw.text((cp2_x + 147, cp2_y + 110), "Atención en toda la Gran Valencia", font=contact_sub_font, fill=TEAL_DEEP)

    # Legal / Brand Protection Line
    draw.text((W // 2 - 340, H - 42), "MEDIHOME © Marca Registrada • Todos los derechos reservados • Cuidamos lo más valioso: Tu salud", font=ImageFont.truetype(font_reg, 17), fill=(200, 240, 245))

    # Save final HD flyer image
    final_output = "flyer_completo_11_servicios_hd.png"
    canvas.save(final_output, "PNG", quality=95)
    print(f"Generated {final_output} successfully! Dimensions: {W}x{H}")

if __name__ == "__main__":
    create_hd_flyer()
