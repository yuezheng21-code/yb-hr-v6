"""
渊博579 HR V7 — 财务对接导出

· DATEV Buchungsstapel（EXTF 格式 700 / 类别 21）：甲方账单（应收）+ 供应商结算（应付），交给税务师导入 DATEV 记账
· DATEV LODAS ASCII 工资录入数据（Bewegungsdaten）+ 通用 CSV：每位员工的工时 / 计件 / 奖金 / 扣款
· XRechnung 3.0（UBL 2.1）电子发票 XML：德国 B2B/B2G 电子发票格式（EN 16931）
· 增值税预申报（UStVA）预估：Kz 81 / 60 / 66

科目、Lohnart、Bearbeitungsschlüssel 均在「系统设置 → 财务」中配置，须与税务师的 Mandant 设置一致；
首次使用请先让税务师做一次测试导入。
"""
from __future__ import annotations
import re
from datetime import date, datetime
from typing import Optional
from xml.sax.saxutils import escape as xesc


def _dnum(v: float) -> str:
    return f"{abs(float(v or 0)):.2f}".replace(".", ",")


def _q(s) -> str:
    return '"' + str(s or "").replace('"', "'").replace("\n", " ")[:60] + '"'


# ═════════════════════════════════════════════════════════════════════
#  DATEV Buchungsstapel (EXTF)
# ═════════════════════════════════════════════════════════════════════
EXTF_COLUMNS = ["Umsatz (ohne Soll/Haben-Kz)", "Soll/Haben-Kennzeichen", "WKZ Umsatz", "Kurs", "Basis-Umsatz",
                "WKZ Basis-Umsatz", "Konto", "Gegenkonto (ohne BU-Schlüssel)", "BU-Schlüssel", "Belegdatum",
                "Belegfeld 1", "Belegfeld 2", "Skonto", "Buchungstext"]


def datev_buchungsstapel(settings: dict, bookings: list[dict], date_from: date, date_to: date) -> bytes:
    """bookings: [{amount (signed gross), konto, gegenkonto, bu, belegdatum(date), beleg1, beleg2, text}]
    amount > 0 → 'S' auf Konto, amount < 0 → 'H'."""
    fy_month = int(settings.get("datev_fiscal_year_start") or 1)
    fy_year = date_from.year if date_from.month >= fy_month else date_from.year - 1
    sach_len = len(str(settings.get("datev_revenue_account") or "8400"))
    header = ["EXTF", "700", "21", "Buchungsstapel", "13", datetime.now().strftime("%Y%m%d%H%M%S%f")[:17], "", "RE",
              "", "", str(settings.get("datev_berater_nr") or ""), str(settings.get("datev_mandant_nr") or ""),
              f"{fy_year}{fy_month:02d}01", str(sach_len), date_from.strftime("%Y%m%d"), date_to.strftime("%Y%m%d"),
              f"YB HR {date_from:%Y-%m}", "", "1", "0", "0", "EUR", "", "", "", "",
              str(settings.get("datev_skr") or "03"), "", "", "", ""]
    q = {0, 3, 7, 8, 9, 16, 17, 21}  # quoted text fields of the header
    lines = [";".join(f'"{v}"' if i in q else v for i, v in enumerate(header)),
             ";".join(EXTF_COLUMNS)]
    for b in bookings:
        amt = float(b["amount"])
        if round(amt, 2) == 0:
            continue
        lines.append(";".join([
            _dnum(amt), '"S"' if amt > 0 else '"H"', '"EUR"', "", "", "",
            str(b["konto"]), str(b["gegenkonto"]), _q(b.get("bu") or ""), b["belegdatum"].strftime("%d%m"),
            _q(re.sub(r"[^A-Za-z0-9$&%*+\-./]", "", str(b.get("beleg1") or ""))[:36]), _q(b.get("beleg2") or ""), "",
            _q(b.get("text") or ""),
        ]))
    return ("\r\n".join(lines) + "\r\n").encode("cp1252", errors="replace")


# ═════════════════════════════════════════════════════════════════════
#  DATEV LODAS ASCII / 通用工资 CSV
# ═════════════════════════════════════════════════════════════════════
def lodas_ascii(settings: dict, period: str, rows: list[dict]) -> bytes:
    """rows: [{pnr, hours, piece, bonus, deduction, kostenstelle}] → LODAS Bewegungsdaten."""
    y, m = period.split("-")
    first = f"01/{m}/{y}"
    la = {k: str(settings.get(f"lodas_la_{k}") or "").strip() for k in ("hours", "piece", "bonus", "deduction")}
    out = ["[Allgemein]", "Ziel=LODAS", "Version_SST=1.0",
           f"BeraterNr={settings.get('datev_berater_nr') or ''}", f"MandantNr={settings.get('datev_mandant_nr') or ''}",
           "Datumsformat=TT/MM/JJJJ", "Feldtrennzeichen=;", "Zahlenkomma=,", "Kommentarzeichen=*", "",
           f"* Erzeugt {datetime.now():%d.%m.%Y %H:%M} – Lohnarten bitte mit dem Steuerbüro abstimmen", "",
           "[Satzbeschreibung]",
           "10;u_lod_bwd_buchung_standard;abrechnung_zeitraum#bwd;pnr#bwd;la_eigene#bwd;bs_nr#bwd;bs_wert_butab#bwd;kostenstelle#bwd;",
           "", "[Bewegungsdaten]"]
    # Bearbeitungsschlüssel: 1 = Stunden, 4 = Betrag (LODAS-Standard für eigene Lohnarten mit Wert)
    for r in rows:
        for key, bs in (("hours", "1"), ("piece", "4"), ("bonus", "4"), ("deduction", "4")):
            val = float(r.get(key) or 0)
            if round(val, 2) == 0 or not la[key]:
                continue
            out.append(f"10;{first};{r['pnr']};{la[key]};{bs};{_dnum(val)};{r.get('kostenstelle') or ''};")
    return ("\r\n".join(out) + "\r\n").encode("cp1252", errors="replace")


# ═════════════════════════════════════════════════════════════════════
#  XRechnung 3.0 (UBL 2.1 Invoice)
# ═════════════════════════════════════════════════════════════════════
_PLZ = re.compile(r"\b(\d{4,5})\s+(.+)")


def split_address(addr: str, default_country: str = "DE") -> dict:
    parts = [p.strip() for p in re.split(r"[\n,]+", addr or "") if p.strip()]
    street, plz, city, country = (parts[0] if parts else ""), "", "", default_country
    for p in parts[1:]:
        m = _PLZ.search(p)
        if m and not plz:
            plz, city = m.group(1), m.group(2)
        elif len(p) == 2 and p.isalpha():
            country = p.upper()
    return {"street": street, "plz": plz, "city": city, "country": country}


UNIT_CODES = {"h": "HUR", "std": "HUR", "std.": "HUR", "stunden": "HUR", "小时": "HUR",
              "stk": "H87", "stück": "H87", "件": "H87", "pcs": "H87", "container": "C62", "柜": "C62",
              "palette": "C62", "pal": "C62", "托": "C62", "pauschal": "C62", "tag": "DAY", "天": "DAY"}


def _amt(v) -> str:
    return f"{float(v or 0):.2f}"


def xrechnung_xml(company: dict, inv, lines: list[dict], customer, original_no: Optional[str] = None) -> bytes:
    s_addr = split_address(company.get("company_address") or "")
    b_addr = split_address(inv.customer_address or "", (customer.country if customer else "DE") or "DE")
    rc = bool(inv.reverse_charge)
    cat, pct = ("AE", 0.0) if rc else ("S", round(inv.vat_rate * 100, 2))
    e = lambda v: xesc(str(v or ""))  # noqa: E731

    def party(name, addr, vat_id, email, tax_number=None, contact=None, legal=None):
        x = f'<cbc:EndpointID schemeID="EM">{e(email or "invoice@example.invalid")}</cbc:EndpointID>'
        x += f"<cac:PartyName><cbc:Name>{e(name)}</cbc:Name></cac:PartyName>"
        x += ("<cac:PostalAddress>" + (f"<cbc:StreetName>{e(addr['street'])}</cbc:StreetName>" if addr["street"] else "")
              + f"<cbc:CityName>{e(addr['city'] or '-')}</cbc:CityName><cbc:PostalZone>{e(addr['plz'] or '-')}</cbc:PostalZone>"
              f"<cac:Country><cbc:IdentificationCode>{e(addr['country'])}</cbc:IdentificationCode></cac:Country></cac:PostalAddress>")
        if vat_id:
            x += f"<cac:PartyTaxScheme><cbc:CompanyID>{e(vat_id)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>"
        if tax_number:
            x += f"<cac:PartyTaxScheme><cbc:CompanyID>{e(tax_number)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>FC</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>"
        x += f"<cac:PartyLegalEntity><cbc:RegistrationName>{e(name)}</cbc:RegistrationName>"
        if legal:
            x += f"<cbc:CompanyLegalForm>{e(legal)}</cbc:CompanyLegalForm>"
        x += "</cac:PartyLegalEntity>"
        if contact:
            x += ("<cac:Contact>" + f"<cbc:Name>{e(contact.get('name') or name)}</cbc:Name>"
                  + f"<cbc:Telephone>{e(contact.get('phone') or '-')}</cbc:Telephone>"
                  + f"<cbc:ElectronicMail>{e(contact.get('email') or email or '-')}</cbc:ElectronicMail></cac:Contact>")
        return f"<cac:Party>{x}</cac:Party>"

    type_code = "384" if inv.kind == "storno" else "380"
    xml = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<ubl:Invoice xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" '
           'xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" '
           'xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">',
           "<cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</cbc:CustomizationID>",
           "<cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>",
           f"<cbc:ID>{e(inv.invoice_no)}</cbc:ID>", f"<cbc:IssueDate>{inv.issue_date.isoformat()}</cbc:IssueDate>"]
    if inv.due_date:
        xml.append(f"<cbc:DueDate>{inv.due_date.isoformat()}</cbc:DueDate>")
    xml.append(f"<cbc:InvoiceTypeCode>{type_code}</cbc:InvoiceTypeCode>")
    if inv.notes:
        xml.append(f"<cbc:Note>{e(inv.notes)}</cbc:Note>")
    xml += ["<cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>",
            f"<cbc:BuyerReference>{e((customer.buyer_reference if customer else None) or (customer.datev_account if customer else None) or inv.customer_name)}</cbc:BuyerReference>",
            f"<cac:InvoicePeriod><cbc:StartDate>{inv.period_from.isoformat()}</cbc:StartDate><cbc:EndDate>{inv.period_to.isoformat()}</cbc:EndDate></cac:InvoicePeriod>"]
    if original_no:
        xml.append(f"<cac:BillingReference><cac:InvoiceDocumentReference><cbc:ID>{e(original_no)}</cbc:ID></cac:InvoiceDocumentReference></cac:BillingReference>")
    xml.append("<cac:AccountingSupplierParty>" + party(
        company.get("company_name"), s_addr, company.get("company_vat_id"), company.get("company_email"),
        company.get("company_tax_number"),
        {"name": company.get("company_representative") or company.get("company_name"), "phone": company.get("company_phone"),
         "email": company.get("company_email")}, company.get("company_register")) + "</cac:AccountingSupplierParty>")
    xml.append("<cac:AccountingCustomerParty>" + party(
        inv.customer_name, b_addr, inv.customer_vat_id, customer.email if customer else None) + "</cac:AccountingCustomerParty>")
    if company.get("company_iban"):
        xml.append("<cac:PaymentMeans><cbc:PaymentMeansCode>58</cbc:PaymentMeansCode>"
                   f"<cac:PayeeFinancialAccount><cbc:ID>{e(company['company_iban'].replace(' ', ''))}</cbc:ID>"
                   f"<cbc:Name>{e(company.get('company_name'))}</cbc:Name>"
                   + (f"<cac:FinancialInstitutionBranch><cbc:ID>{e(company['company_bic'])}</cbc:ID></cac:FinancialInstitutionBranch>" if company.get("company_bic") else "")
                   + "</cac:PayeeFinancialAccount></cac:PaymentMeans>")
    if inv.due_date:
        xml.append(f"<cac:PaymentTerms><cbc:Note>Zahlbar bis {inv.due_date:%d.%m.%Y} ohne Abzug.</cbc:Note></cac:PaymentTerms>")
    exemption = ("<cbc:TaxExemptionReasonCode>VATEX-EU-AE</cbc:TaxExemptionReasonCode>"
                 "<cbc:TaxExemptionReason>Reverse charge</cbc:TaxExemptionReason>") if rc else ""
    xml.append(f'<cac:TaxTotal><cbc:TaxAmount currencyID="EUR">{_amt(inv.vat)}</cbc:TaxAmount>'
               f'<cac:TaxSubtotal><cbc:TaxableAmount currencyID="EUR">{_amt(inv.net)}</cbc:TaxableAmount>'
               f'<cbc:TaxAmount currencyID="EUR">{_amt(inv.vat)}</cbc:TaxAmount>'
               f"<cac:TaxCategory><cbc:ID>{cat}</cbc:ID><cbc:Percent>{pct:g}</cbc:Percent>{exemption}"
               "<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory></cac:TaxSubtotal></cac:TaxTotal>")
    xml.append(f'<cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="EUR">{_amt(inv.net)}</cbc:LineExtensionAmount>'
               f'<cbc:TaxExclusiveAmount currencyID="EUR">{_amt(inv.net)}</cbc:TaxExclusiveAmount>'
               f'<cbc:TaxInclusiveAmount currencyID="EUR">{_amt(inv.gross)}</cbc:TaxInclusiveAmount>'
               f'<cbc:PayableAmount currencyID="EUR">{_amt(inv.gross)}</cbc:PayableAmount></cac:LegalMonetaryTotal>')
    for i, l in enumerate(lines, 1):
        unit = UNIT_CODES.get(str(l.get("unit") or "").strip().lower(), "C62")
        xml.append(f'<cac:InvoiceLine><cbc:ID>{i}</cbc:ID><cbc:InvoicedQuantity unitCode="{unit}">{float(l.get("qty") or 0):g}</cbc:InvoicedQuantity>'
                   f'<cbc:LineExtensionAmount currencyID="EUR">{_amt(l.get("amount"))}</cbc:LineExtensionAmount>'
                   f"<cac:Item><cbc:Name>{e(l.get('description'))}</cbc:Name>"
                   f"<cac:ClassifiedTaxCategory><cbc:ID>{cat}</cbc:ID><cbc:Percent>{pct:g}</cbc:Percent>"
                   "<cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item>"
                   f'<cac:Price><cbc:PriceAmount currencyID="EUR">{abs(float(l.get("unit_price") or 0)):.4f}</cbc:PriceAmount></cac:Price></cac:InvoiceLine>')
    xml.append("</ubl:Invoice>")
    return "".join(xml).encode("utf-8")


def xrechnung_missing(company: dict, inv, customer) -> list[str]:
    """XRechnung 必填但当前缺失的数据（提示用户先补充）。"""
    miss = []
    if not company.get("company_address") or not split_address(company["company_address"])["plz"]:
        miss.append("公司地址（需含邮编与城市）")
    if not (company.get("company_vat_id") or company.get("company_tax_number")):
        miss.append("公司 USt-IdNr. 或 Steuernummer")
    if not company.get("company_email"):
        miss.append("公司邮箱")
    if not company.get("company_phone"):
        miss.append("公司电话")
    if not inv.customer_address or not split_address(inv.customer_address)["plz"]:
        miss.append("客户地址（需含邮编与城市）")
    if inv.reverse_charge and not inv.customer_vat_id:
        miss.append("反向征收客户的 USt-IdNr.")
    return miss
