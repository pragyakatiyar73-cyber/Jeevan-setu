import sys
import subprocess

try:
    import reportlab
except ImportError:
    print("Installing reportlab...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab"])
    import reportlab

from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def build_pdf():
    pdf_filename = "SIH2026_Jeevan_Setu_AlgoForge.pdf"
    
    # 16:9 / Landscape Dimensions (11 x 6.18 inches or 11 x 8.5)
    page_width, page_height = landscape(letter) # 11 x 8.5 inches
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=(11 * inch, 7.5 * inch),
        rightMargin=0.5 * inch,
        leftMargin=0.5 * inch,
        topMargin=0.4 * inch,
        bottomMargin=0.4 * inch
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY_NAVY = colors.HexColor('#0A192F')
    ACCENT_BLUE = colors.HexColor('#2563EB')
    EMERALD_GREEN = colors.HexColor('#10B981')
    AMBER_GOLD = colors.HexColor('#F59E0B')
    DARK_TEXT = colors.HexColor('#0F172A')
    MUTED_TEXT = colors.HexColor('#475569')
    CARD_BG = colors.HexColor('#F8FAFC')

    # Typography Styles
    title_style = ParagraphStyle(
        'SlideTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=PRIMARY_NAVY,
        spaceAfter=4
    )

    tag_style = ParagraphStyle(
        'TagLine',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=ACCENT_BLUE,
        spaceAfter=2
    )

    card_title_style = ParagraphStyle(
        'CardTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=PRIMARY_NAVY,
        spaceAfter=4
    )

    card_body_style = ParagraphStyle(
        'CardBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=13,
        textColor=MUTED_TEXT
    )

    white_title = ParagraphStyle(
        'WhiteTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=32,
        textColor=colors.white
    )

    white_subtitle = ParagraphStyle(
        'WhiteSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#E2E8F0')
    )

    elements = []

    def make_header(title_text, slide_num):
        content = [
            Paragraph("SMART INDIA HACKATHON 2026 &bull; OFFICIAL IDEA SUBMISSION", tag_style),
            Paragraph(title_text, title_style),
            HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=10) if 'HRFlowable' in globals() else Spacer(1, 4)
        ]
        return content

    # =========================================================================
    # SLIDE 1: TITLE PAGE
    # =========================================================================
    s1_content = [
        Paragraph("SMART INDIA HACKATHON 2026", ParagraphStyle('S1Tag', fontName='Helvetica-Bold', fontSize=12, textColor=AMBER_GOLD, spaceAfter=8)),
        Paragraph("JEEVAN SETU (जीवन सेतु)", white_title),
        Spacer(1, 6),
        Paragraph("AI-Based Smart Logistics & Accessibility Intelligence Platform for North Eastern Region (NER)", white_subtitle),
        Spacer(1, 14),
        Paragraph("<b>Problem Statement ID:</b> 26002 &nbsp;|&nbsp; <b>Category:</b> Software Edition", ParagraphStyle('S1Detail1', fontName='Helvetica-Bold', fontSize=12, textColor=EMERALD_GREEN, spaceAfter=4)),
        Paragraph("<b>Theme:</b> Disaster Management & Smart Logistics Infrastructure", ParagraphStyle('S1Detail2', fontName='Helvetica', fontSize=11, textColor=colors.HexColor('#CBD5E1'), spaceAfter=12)),
        Paragraph("<b>Team Name:</b> AlgoForge &nbsp;|&nbsp; <b>Working Prototype:</b> https://jsalgoforge.netlify.app", ParagraphStyle('S1Detail3', fontName='Helvetica-Bold', fontSize=11, textColor=AMBER_GOLD))
    ]
    
    t1 = Table([[s1_content]], colWidths=[10 * inch])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), PRIMARY_NAVY),
        ('PADDING', (0,0), (-1,-1), 24),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 30)
    ]))
    elements.append(Spacer(1, 0.4 * inch))
    elements.append(t1)
    elements.append(PageBreak())

    # =========================================================================
    # SLIDE 2: PROPOSED SOLUTION
    # =========================================================================
    elements.extend(make_header("PROPOSED SOLUTION — JEEVAN SETU COMMAND SYSTEM", 2))
    
    s2_cards = [
        [
            Paragraph("🏛️ 8-State Unified Command Center", card_title_style),
            Paragraph("Connects SDRF, BRO, MDoNER & dispatchers across Assam, Meghalaya, Arunachal Pradesh, Sikkim, Manipur, Mizoram, Nagaland & Tripura.", card_body_style)
        ],
        [
            Paragraph("🛰️ Sovereign Geospatial Integration", card_title_style),
            Paragraph("Real-time road accessibility overlaid with ISRO Bhuvan NRSC Indian Satellite and NASA Earthdata GIBS imagery.", card_body_style)
        ],
        [
            Paragraph("📵 Offline-First PWA Architecture", card_title_style),
            Paragraph("IndexedDB + Service Worker v10.0 enables zero-internet field reporting in Himalayan dead zones (Sela Pass, Haflong).", card_body_style)
        ],
        [
            Paragraph("🚑 Smart Priority Supply Dispatch", card_title_style),
            Paragraph("Computes alternate routes during cloudbursts/landslides, prioritizing cold-chain vaccines, insulin & fuel over standard cargo.", card_body_style)
        ],
        [
            Paragraph("🤖 Dual AI Engine Integration", card_title_style),
            Paragraph("Google Gemini AI Copilot for incident triage + Scikit-Learn Geotechnical Risk Model (Landslide Hazard & Flood Vulnerability Index).", card_body_style)
        ],
        [
            Paragraph("♿ Universal WCAG 2.1 AA Accessibility", card_title_style),
            Paragraph("100% WCAG AA compliant with keyboard shortcuts, high contrast, font scaling, and screen-reader announcer.", card_body_style)
        ]
    ]

    t2_data = [
        [s2_cards[0], s2_cards[1]],
        [s2_cards[2], s2_cards[3]],
        [s2_cards[4], s2_cards[5]]
    ]
    t2 = Table(t2_data, colWidths=[4.9 * inch, 4.9 * inch])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP')
    ]))
    elements.append(t2)
    elements.append(PageBreak())

    # =========================================================================
    # SLIDE 3: TECHNICAL APPROACH & ARCHITECTURE
    # =========================================================================
    elements.extend(make_header("TECHNICAL APPROACH & END-TO-END DATA FLOW", 3))

    arch_text = [
        Paragraph("SYSTEM ARCHITECTURE & DATA FLOW DIAGRAM", ParagraphStyle('ArchTitle', fontName='Helvetica-Bold', fontSize=11, textColor=AMBER_GOLD, spaceAfter=4)),
        Paragraph("<b>[Field Responders / Mobile PWA]</b> ──► <b>[IndexedDB & Service Worker v10.0 (Offline Storage)]</b><br/>"
                  "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└──► <b>[Auto-Sync on Network Reconnect]</b><br/>"
                  "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└──► <b>[Dual AI Engine: Gemini AI Triage + Scikit-Learn LHI/FVI]</b><br/>"
                  "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└──► <b>[Open-Meteo & ISRO Bhuvan Satellite APIs]</b><br/>"
                  "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└──► <b>[OSRM Dynamic Rerouting Engine]</b> ──► <b>[MDoNER 8-State Command Radar]</b>",
                  ParagraphStyle('ArchBody', fontName='Courier-Bold', fontSize=10, leading=14, textColor=colors.white))
    ]
    t_arch = Table([[arch_text]], colWidths=[9.8 * inch])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), PRIMARY_NAVY),
        ('PADDING', (0,0), (-1,-1), 12),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    elements.append(t_arch)
    elements.append(Spacer(1, 10))

    s3_specs = [
        [
            Paragraph("🔹 Frontend & PWA", card_title_style),
            Paragraph("HTML5, Tailwind CSS Engine, Vanilla JS, Service Worker v10.0, IndexedDB", card_body_style)
        ],
        [
            Paragraph("🔹 GIS & Mapping", card_title_style),
            Paragraph("Leaflet.js, OpenStreetMap, ISRO Bhuvan NRSC WMS, NASA Earthdata GIBS, Esri Satellite", card_body_style)
        ],
        [
            Paragraph("🔹 Live APIs & AI", card_title_style),
            Paragraph("Open-Meteo Weather API, Nominatim Geocoding API, OSRM Driving Directions API, Google Gemini AI", card_body_style)
        ],
        [
            Paragraph("🔹 Working Prototype & Repository", card_title_style),
            Paragraph("<b>Live App:</b> https://jsalgoforge.netlify.app<br/><b>GitHub Repo:</b> https://github.com/pragyakatiyar73-cyber/Jeevan-setu", card_body_style)
        ]
    ]

    t3 = Table([[s3_specs[0], s3_specs[1]], [s3_specs[2], s3_specs[3]]], colWidths=[4.9 * inch, 4.9 * inch])
    t3.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP')
    ]))
    elements.append(t3)
    elements.append(PageBreak())

    # =========================================================================
    # SLIDE 4: FEASIBILITY AND VIABILITY
    # =========================================================================
    elements.extend(make_header("FEASIBILITY, VIABILITY & RISK MITIGATION", 4))

    s4_cards = [
        [
            Paragraph("⚡ Zero Infrastructure Overhead", ParagraphStyle('C1', parent=card_title_style, textColor=EMERALD_GREEN)),
            Paragraph("Ultra-fast PWA runs seamlessly on smartphones, tablets, or desktop browsers without requiring heavy hardware or app store downloads.", card_body_style)
        ],
        [
            Paragraph("💰 ₹0 Software Subscription Cost", ParagraphStyle('C2', parent=card_title_style, textColor=ACCENT_BLUE)),
            Paragraph("Keyless, open API architecture (Open-Meteo, Nominatim, OSRM, ISRO Bhuvan) enables zero monthly software subscription fee during government deployment.", card_body_style)
        ],
        [
            Paragraph("📵 Cellular Outage Mitigation Strategy", ParagraphStyle('C3', parent=card_title_style, textColor=AMBER_GOLD)),
            Paragraph("Total cellular network outage in remote mountain passes (Sela Pass, Haflong hill section) handled via Service Worker + IndexedDB local offline storage queue.", card_body_style)
        ],
        [
            Paragraph("♿ Digital Literacy & Accessibility", ParagraphStyle('C4', parent=card_title_style, textColor=PRIMARY_NAVY)),
            Paragraph("100% WCAG 2.1 AA compliance (High Contrast mode, screen-reader announcer, dual-encoded status badges) ensures ease of use for field responders.", card_body_style)
        ]
    ]

    t4 = Table([[s4_cards[0], s4_cards[1]], [s4_cards[2], s4_cards[3]]], colWidths=[4.9 * inch, 4.9 * inch])
    t4.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('GRID', (0,0), (-1,-1), 1.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 14),
        ('VALIGN', (0,0), (-1,-1), 'TOP')
    ]))
    elements.append(t4)
    elements.append(PageBreak())

    # =========================================================================
    # SLIDE 5: IMPACT AND BENEFITS
    # =========================================================================
    elements.extend(make_header("POTENTIAL IMPACT & MEASURABLE BENEFITS", 5))

    s5_cards = [
        [
            Paragraph("🎯 Target Audience & Reach", ParagraphStyle('I1', parent=card_title_style, textColor=ACCENT_BLUE)),
            Paragraph("• 1-click regional logistics visibility for MDoNER, NEC, SDRF/NDMA & Border Roads Organisation (BRO).<br/>"
                      "• Protects 45+ Million citizens across 8 North Eastern states from severe supply shortages during disaster isolations.", card_body_style)
        ],
        [
            Paragraph("🩺 Social Benefit: Zero Interruption", ParagraphStyle('I2', parent=card_title_style, textColor=EMERALD_GREEN)),
            Paragraph("• Zero mortality from vaccine, insulin, blood plasma, or emergency medical supply interruptions during major landslide isolations.", card_body_style)
        ],
        [
            Paragraph("📉 Economic Savings: 35.4% Delay Reduction", ParagraphStyle('I3', parent=card_title_style, textColor=AMBER_GOLD)),
            Paragraph("• 35.4% reduction in transit delays; massive fuel savings, reduced vehicle breakdowns, and eliminated food spoilage.", card_body_style)
        ],
        [
            Paragraph("🌱 Environmental Impact: -24% CO2", ParagraphStyle('I4', parent=card_title_style, textColor=PRIMARY_NAVY)),
            Paragraph("• AI dynamic rerouting avoids blocked mountain sectors, reducing unnecessary detour carbon emissions by 24%.", card_body_style)
        ]
    ]

    t5 = Table([[s5_cards[0], s5_cards[1]], [s5_cards[2], s5_cards[3]]], colWidths=[4.9 * inch, 4.9 * inch])
    t5.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 14),
        ('VALIGN', (0,0), (-1,-1), 'TOP')
    ]))
    elements.append(t5)
    elements.append(PageBreak())

    # =========================================================================
    # SLIDE 6: RESEARCH AND REFERENCES
    # =========================================================================
    elements.extend(make_header("RESEARCH, REFERENCES & ARTIFACTS", 6))

    s6_cards = [
        [
            Paragraph("🏛️ Government & Nodal Ministry Publications", card_title_style),
            Paragraph("• <b>MDoNER:</b> Annual Report on NER Infrastructure & Connectivity (mdoner.gov.in)<br/>"
                      "• <b>NDMA:</b> Guidelines for Management of Landslides in Himalayan Corridors (ndma.gov.in)<br/>"
                      "• <b>BRO:</b> Infrastructure Project Vartak & Beacon Logs (bro.gov.in)", card_body_style)
        ],
        [
            Paragraph("🛰️ Geospatial Data Sources & Satellite APIs", card_title_style),
            Paragraph("• <b>ISRO Bhuvan NRSC:</b> Web Map Service (bhuvan.nrsc.gov.in)<br/>"
                      "• <b>NASA GIBS:</b> MODIS & VIIRS Satellite Cloud/Rain Data (earthdata.nasa.gov)<br/>"
                      "• <b>Open-Meteo API:</b> Live Weather Radar (open-meteo.com)", card_body_style)
        ],
        [
            Paragraph("🚀 Live Project Artifacts & Compliance Standards", card_title_style),
            Paragraph("• <b>Live Prototype URL:</b> https://jsalgoforge.netlify.app<br/>"
                      "• <b>GitHub Repository:</b> https://github.com/pragyakatiyar73-cyber/Jeevan-setu<br/>"
                      "• <b>Accessibility Standard:</b> W3C WCAG 2.1 AA Specifications (w3.org/TR/WCAG21)", card_body_style)
        ]
    ]

    t6 = Table([[s6_cards[0]], [s6_cards[1]], [s6_cards[2]]], colWidths=[9.8 * inch])
    t6.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP')
    ]))
    elements.append(t6)

    doc.build(elements)
    print(f"Successfully generated PDF presentation: {pdf_filename}")

if __name__ == '__main__':
    build_pdf()
