"""
渊博579 HR V7 — 财务单据 PDF（工资条 / 供应商结算单 / 甲方账单）

reportlab 生成 A4 PDF。拉丁字符（含德语变音）用 Helvetica，中文字符自动切换到随项目附带的
文泉驿正黑子集字体（嵌入 PDF），因此中文姓名在任何阅读器里都能正确显示。
"""
from __future__ import annotations
import io
import os
import re
from datetime import date, datetime
from typing import Iterable, Optional
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

_FONT_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "fonts", "wqy-zenhei-gb2312.ttf")
if os.path.exists(_FONT_FILE):
    # embedded (subset) TrueType font: Chinese renders in every PDF viewer, also on phones
    CJK_FONT = "WQYZenHei"
    pdfmetrics.registerFont(TTFont(CJK_FONT, _FONT_FILE))
else:  # fallback: non-embedded CID font (needs Asian font support in the viewer)
    CJK_FONT = "STSong-Light"
    pdfmetrics.registerFont(UnicodeCIDFont(CJK_FONT))
_CJK = re.compile(r"([⺀-鿿豈-﫿＀-￯　-〿]+)")

GREY = colors.HexColor("#6b7280")
LINE = colors.HexColor("#d1d5db")
SOFT = colors.HexColor("#f3f4f6")

_base = ParagraphStyle("base", fontName="Helvetica", fontSize=9, leading=12)
STY = {
    "base": _base,
    "small": ParagraphStyle("small", parent=_base, fontSize=7.5, leading=10, textColor=GREY),
    "title": ParagraphStyle("title", parent=_base, fontName="Helvetica-Bold", fontSize=15, leading=19, spaceAfter=2),
    "h": ParagraphStyle("h", parent=_base, fontName="Helvetica-Bold"),
    "right": ParagraphStyle("right", parent=_base, alignment=TA_RIGHT),
    "rightb": ParagraphStyle("rightb", parent=_base, alignment=TA_RIGHT, fontName="Helvetica-Bold"),
}


def eur(v: Optional[float], sign: bool = False) -> str:
    """German money format: 1.234,56 €"""
    v = float(v or 0)
    s = f"{abs(v):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{'-' if v < 0 else ('+' if sign and v > 0 else '')}{s} €"


def num(v: Optional[float], digits: int = 2) -> str:
    v = float(v or 0)
    s = f"{v:,.{digits}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return s


def de_date(d) -> str:
    if not d:
        return ""
    if isinstance(d, str):
        d = date.fromisoformat(d[:10])
    return d.strftime("%d.%m.%Y")


def P(text, style: str = "base") -> Paragraph:
    """Paragraph with automatic CJK font runs; supports '\\n' and **bold** markers."""
    out = []
    for part in _CJK.split(escape(str(text if text is not None else ""))):
        if not part:
            continue
        out.append(f'<font name="{CJK_FONT}">{part}</font>' if _CJK.fullmatch(part) else part)
    html = "".join(out).replace("\n", "<br/>")
    html = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", html)
    return Paragraph(html, STY[style])


def _table(rows, widths, header=True, zebra=False, align_right_from: Optional[int] = None, bold_last=False):
    t = Table(rows, colWidths=widths, repeatRows=1 if header else 0)
    st = [("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 3),
          ("BOTTOMPADDING", (0, 0), (-1, -1), 3), ("LEFTPADDING", (0, 0), (-1, -1), 4),
          ("RIGHTPADDING", (0, 0), (-1, -1), 4)]
    if header:
        st += [("BACKGROUND", (0, 0), (-1, 0), SOFT), ("LINEBELOW", (0, 0), (-1, 0), 0.6, LINE)]
    st += [("LINEBELOW", (0, 1 if header else 0), (-1, -1), 0.25, LINE)]
    if bold_last:
        st += [("LINEABOVE", (0, -1), (-1, -1), 0.8, colors.black)]
    t.setStyle(TableStyle(st))
    return t


class DocBuilder:
    """Common layout: sender line, address block + meta, title, body, footer with company data."""

    def __init__(self, company: dict, title: str):
        self.c = company
        self.title = title
        self.story: list = []

    def head(self, recipient_lines: Iterable[str], meta: list[tuple[str, str]]):
        c = self.c
        sender = " · ".join(x for x in [c.get("company_name"), (c.get("company_address") or "").replace("\n", ", ")] if x)
        left = [P(sender, "small"), Spacer(1, 3 * mm)] + [P(x) for x in recipient_lines if x]
        right = [[P(k, "small"), P(v, "right")] for k, v in meta if v not in (None, "")]
        mt = Table(right, colWidths=[32 * mm, 48 * mm])
        mt.setStyle(TableStyle([("TOPPADDING", (0, 0), (-1, -1), 1), ("BOTTOMPADDING", (0, 0), (-1, -1), 1)]))
        top = Table([[left, mt]], colWidths=[95 * mm, 80 * mm])
        top.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0)]))
        self.story += [top, Spacer(1, 10 * mm), P(self.title, "title"), Spacer(1, 3 * mm)]

    def para(self, text, style="base", space=2):
        self.story += [P(text, style), Spacer(1, space * mm)]

    def table(self, header: list[str], rows: list[list], widths_mm: list[float], right_cols: Iterable[int] = (),
              totals: Optional[list[tuple[str, str, bool]]] = None):
        right_cols = set(right_cols)
        data = [[P(h, "rightb" if i in right_cols else "h") for i, h in enumerate(header)]]
        for r in rows:
            data.append([v if isinstance(v, Paragraph) else P(v, "right" if i in right_cols else "base") for i, v in enumerate(r)])
        self.story.append(_table(data, [w * mm for w in widths_mm]))
        if totals:
            tw = sum(widths_mm)
            trows = [[P(l, "rightb" if b else "right"), P(v, "rightb" if b else "right")] for l, v, b in totals]
            t = Table(trows, colWidths=[(tw - 35) * mm, 35 * mm])
            st = [("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]
            for i, (_, _, b) in enumerate(totals):
                if b:
                    st.append(("LINEABOVE", (1, i), (1, i), 0.8, colors.black))
            t.setStyle(TableStyle(st))
            self.story.append(t)
        self.story.append(Spacer(1, 4 * mm))

    def kv(self, pairs: list[tuple[str, str]], widths=(45, 130)):
        rows = [[P(k, "small"), P(v)] for k, v in pairs if v not in (None, "")]
        if rows:
            t = Table(rows, colWidths=[w * mm for w in widths])
            t.setStyle(TableStyle([("TOPPADDING", (0, 0), (-1, -1), 1.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5),
                                   ("LEFTPADDING", (0, 0), (-1, -1), 0)]))
            self.story += [t, Spacer(1, 4 * mm)]

    def _footer(self, canvas, doc):
        c = self.c
        cols = [
            [c.get("company_name"), *(c.get("company_address") or "").split("\n")],
            [f"Tel. {c['company_phone']}" if c.get("company_phone") else "", c.get("company_email") or "",
             c.get("company_representative") and f"Geschäftsführung: {c['company_representative']}"],
            [c.get("company_register") or "", c.get("company_tax_number") and f"St.-Nr. {c['company_tax_number']}",
             c.get("company_vat_id") and f"USt-IdNr. {c['company_vat_id']}"],
            [c.get("company_bank") or "", c.get("company_iban") and f"IBAN {c['company_iban']}",
             c.get("company_bic") and f"BIC {c['company_bic']}"],
        ]
        canvas.saveState()
        canvas.setStrokeColor(LINE)
        canvas.line(20 * mm, 22 * mm, 190 * mm, 22 * mm)
        x = 20 * mm
        for col in cols:
            y = 18 * mm
            for line in [l for l in col if l][:4]:
                canvas.setFont(CJK_FONT if _CJK.search(line) else "Helvetica", 6.5)
                canvas.setFillColor(GREY)
                canvas.drawString(x, y, str(line)[:48])
                y -= 3 * mm
            x += 43 * mm
        canvas.setFont("Helvetica", 6.5)
        canvas.drawRightString(190 * mm, 26 * mm, f"Seite {doc.page}")
        canvas.restoreState()

    def build(self) -> bytes:
        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=18 * mm,
                                bottomMargin=32 * mm, title=self.title, author=self.c.get("company_name") or "")
        doc.build(self.story, onFirstPage=self._footer, onLaterPages=self._footer)
        return buf.getvalue()


# ═════════════════════════════════════════════════════════════════════
STAT_LABELS = [("lst", "Lohnsteuer"), ("soli", "Solidaritätszuschlag"), ("kist", "Kirchensteuer"),
               ("kv", "Krankenversicherung (AN)"), ("rv", "Rentenversicherung (AN)"),
               ("av", "Arbeitslosenversicherung (AN)"), ("pv", "Pflegeversicherung (AN)")]


def payslip_pdf(company: dict, slip, emp, earnings: list, statutory: dict, other: list) -> bytes:
    y, m = slip.period.split("-")
    d = DocBuilder(company, f"Entgeltabrechnung {m}/{y}")
    d.head([emp.name, *(emp.address or "").split(",")],
           [("Personalnummer", emp.emp_no), ("Abrechnungsmonat", f"{m}/{y}"), ("Beleg-Nr.", slip.slip_no),
            ("Erstellt am", de_date(slip.issued_at or datetime.utcnow())), ("Steuer-ID", emp.tax_id),
            ("SV-Nummer", emp.social_security_no), ("Eintritt", de_date(emp.join_date)),
            ("Tätigkeit", emp.position)])
    d.table(["Bezüge", "Menge", "Einheit", "Satz", "Betrag"],
            [[e.get("label"), num(e.get("qty")) if e.get("qty") not in (None, "") else "", e.get("unit") or "",
              eur(e["rate"]) if e.get("rate") not in (None, "") else "", eur(e.get("amount"))] for e in earnings],
            [78, 22, 18, 25, 27], right_cols=(1, 3, 4),
            totals=[("Gesamtbrutto", eur(slip.gross), True)])
    stat_rows = [[label, eur(-float(statutory.get(k) or 0))] for k, label in STAT_LABELS if float(statutory.get(k) or 0)]
    if stat_rows:
        d.table(["Gesetzliche Abzüge", "Betrag"], stat_rows, [143, 27], right_cols=(1,),
                totals=[("Summe gesetzliche Abzüge", eur(-slip.statutory_total), False),
                        ("Nettoverdienst", eur(slip.net), True)])
    else:
        d.para("Gesetzliche Abzüge (Lohnsteuer, Sozialversicherung): laut Lohnabrechnung des Steuerbüros – "
               "in dieser Aufstellung nicht enthalten.", "small", 3)
    if other:
        d.table(["Sonstige Abzüge / Vorschüsse", "Betrag"], [[o.get("label"), eur(-float(o.get("amount") or 0))] for o in other],
                [143, 27], right_cols=(1,))
    d.table(["Auszahlung", "Betrag"], [["**Auszahlungsbetrag**", f"**{eur(slip.payout)}**"]], [143, 27], right_cols=(1,))
    iban = (emp.iban or "").replace(" ", "")
    d.kv([("Überweisung auf", f"IBAN …{iban[-4:]}" if len(iban) > 4 else "—"),
          ("Arbeitstage / Stunden", f"{slip.work_days} Tage · {num(slip.total_hours)} Std."),
          ("Hinweis", slip.notes)])
    if not stat_rows:
        d.para("Diese Abrechnung weist das Bruttoentgelt und die vereinbarten Abzüge aus. Die steuer- und "
               "sozialversicherungsrechtliche Abrechnung erfolgt über das Lohnprogramm.", "small")
    return d.build()


def supplier_statement_pdf(company: dict, ss, supplier, workers: list, vat_rate: float) -> bytes:
    y, m = ss.period.split("-")
    d = DocBuilder(company, f"Leistungsabrechnung {m}/{y}")
    d.head([supplier.name if supplier else ss.supplier_name, supplier.contact_person if supplier else "",
            supplier.email if supplier else ""],
           [("Abrechnung-Nr.", ss.settle_no), ("Zeitraum", f"{m}/{y}"), ("Datum", de_date(date.today())),
            ("Lieferant-Nr.", supplier.code if supplier else ""), ("Ihre Rechnung-Nr.", ss.invoice_no)])
    d.para("Für die im Abrechnungszeitraum von Ihren Mitarbeitern erbrachten und von uns bestätigten Leistungen "
           "rechnen wir wie folgt ab. Bitte stellen Sie eine Rechnung in dieser Höhe aus bzw. prüfen Sie die Aufstellung.", "base", 3)
    net = round(float(ss.total_amount or 0), 2)
    vat = round(net * vat_rate, 2)
    d.table(["Mitarbeiter", "Pers.-Nr.", "Tage", "Stunden", "Betrag"],
            [[w["name"], w["emp_no"], str(w["days"]), num(w["hours"]), eur(w["amount"])] for w in workers],
            [70, 30, 16, 24, 30], right_cols=(2, 3, 4),
            totals=[("Summe netto", eur(net), False), (f"zzgl. USt. {num(vat_rate * 100, 0)} %", eur(vat), False),
                    ("Gesamtbetrag", eur(net + vat), True)])
    d.kv([("Mitarbeiter", str(len(workers))), ("Stunden gesamt", num(ss.total_hours)), ("Hinweis", ss.notes)])
    return d.build()


def invoice_pdf(company: dict, inv, lines: list, customer) -> bytes:
    storno = inv.kind == "storno"
    title = ("Stornorechnung " if storno else "Rechnung ") + (inv.invoice_no or "ENTWURF")
    d = DocBuilder(company, title)
    d.head([inv.customer_name, *(inv.customer_address or "").split("\n")],
           [("Rechnungsnummer", inv.invoice_no or "Entwurf"), ("Rechnungsdatum", de_date(inv.issue_date or date.today())),
            ("Leistungszeitraum", f"{de_date(inv.period_from)} – {de_date(inv.period_to)}"),
            ("Kunden-Nr.", customer.datev_account if customer else ""), ("USt-IdNr. Kunde", inv.customer_vat_id),
            ("Ihre Referenz", customer.buyer_reference if customer else ""), ("Fällig am", de_date(inv.due_date))])
    if storno and inv.notes:
        d.para(inv.notes, "base", 3)
    d.table(["Pos.", "Leistung", "Menge", "Einheit", "Einzelpreis", "Betrag"],
            [[str(i + 1), l.get("description"), num(l.get("qty")), l.get("unit") or "", eur(l.get("unit_price")), eur(l.get("amount"))]
             for i, l in enumerate(lines)],
            [10, 70, 20, 17, 25, 28], right_cols=(2, 4, 5),
            totals=[("Summe netto", eur(inv.net), False),
                    (("Umsatzsteuer 0 % (Steuerschuldnerschaft des Leistungsempfängers)" if inv.reverse_charge
                      else f"Umsatzsteuer {num(inv.vat_rate * 100, 0)} %"), eur(inv.vat), False),
                    ("Rechnungsbetrag", eur(inv.gross), True)])
    if inv.reverse_charge:
        d.para("Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge, § 13b UStG / Art. 196 MwStSystRL).", "base", 2)
    if not storno:
        pay = f"Bitte überweisen Sie den Rechnungsbetrag bis zum {de_date(inv.due_date)}"
        if company.get("company_iban"):
            pay += f" auf das Konto IBAN {company['company_iban']}" + (f" (BIC {company['company_bic']})" if company.get("company_bic") else "")
        d.para(pay + f" unter Angabe der Rechnungsnummer {inv.invoice_no or ''}.", "base", 2)
    if inv.notes and not storno:
        d.para(inv.notes, "base", 2)
    d.para("Leistungsdatum entspricht dem angegebenen Leistungszeitraum.", "small")
    return d.build()
