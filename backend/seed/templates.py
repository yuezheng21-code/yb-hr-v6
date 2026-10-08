"""
默认文书模板（德语 Muster）。

⚠ 这些是通用示例文本，不构成法律意见。作为人力服务商（Personaldienstleister），
  若适用 Arbeitnehmerüberlassung（AÜG）或 iGZ/BAP 等集体协议，条款需相应调整。
  正式使用前请由劳动法律师/顾问审核。HR 可在「文书模板」页修改，修改后版本号自动 +1。
"""

LEGAL_NOTE = "Muster – vor Verwendung arbeitsrechtlich prüfen lassen（示例文本，使用前请法律审核）。"

TEMPLATES = [
    {
        "code": "AV_BEFRISTET",
        "name": "Befristeter Arbeitsvertrag（定期劳动合同）",
        "category": "contract",
        "language": "de",
        "description": "定期劳动合同（§ 14 Abs. 2 TzBfG 无实质理由定期，最长 2 年）。" + LEGAL_NOTE,
        "body": """# Befristeter Arbeitsvertrag

Zwischen **{{company.name}}**, {{company.address}}, vertreten durch {{company.representative}} – nachfolgend „Arbeitgeber" –

und

**{{employee.name}}**, geboren am {{employee.birth_date}}, wohnhaft in {{employee.address}} – nachfolgend „Arbeitnehmer/in" –

wird folgender Arbeitsvertrag geschlossen:

## § 1 Beginn, Befristung und Probezeit
Das Arbeitsverhältnis beginnt am {{contract.start_date}} und ist gemäß § 14 Abs. 2 TzBfG kalendermäßig befristet bis zum {{contract.end_date}}. Es endet mit Ablauf dieses Tages, ohne dass es einer Kündigung bedarf.
Die ersten sechs Monate gelten als Probezeit (bis {{contract.probation_end}}). Während der Probezeit kann das Arbeitsverhältnis mit einer Frist von zwei Wochen gekündigt werden.

## § 2 Tätigkeit und Arbeitsort
Der/Die Arbeitnehmer/in wird als **{{contract.position}}** eingestellt. Arbeitsort ist das Lager {{contract.warehouse_code}}. Der Arbeitgeber ist berechtigt, im Rahmen des Zumutbaren andere gleichwertige Tätigkeiten und Einsatzorte zuzuweisen.

## § 3 Arbeitszeit
Die regelmäßige wöchentliche Arbeitszeit beträgt {{contract.weekly_hours}} Stunden. Lage und Verteilung richten sich nach dem Schichtplan. Die Höchstgrenzen des Arbeitszeitgesetzes werden eingehalten.

## § 4 Vergütung
Der/Die Arbeitnehmer/in erhält einen Bruttostundenlohn von {{contract.hourly_rate}} EUR. Die Vergütung wird jeweils zum Monatsende auf das Konto {{employee.iban}} überwiesen.

## § 5 Urlaub
Der Urlaubsanspruch beträgt {{contract.vacation_days}} Arbeitstage pro Kalenderjahr bei einer Fünf-Tage-Woche (gesetzlicher Mindesturlaub nach BUrlG: 20 Tage).

## § 6 Arbeitsverhinderung und Krankheit
Eine Arbeitsunfähigkeit ist unverzüglich mitzuteilen. Dauert sie länger als drei Kalendertage, ist spätestens am darauffolgenden Arbeitstag eine ärztliche Bescheinigung vorzulegen.

## § 7 Kündigung
Nach Ablauf der Probezeit gelten die gesetzlichen Kündigungsfristen ({{contract.notice_period}}). Die Kündigung bedarf der Schriftform.

## § 8 Schlussbestimmungen
Änderungen und Ergänzungen dieses Vertrages bedürfen der Textform. {{besondere_vereinbarungen|Besondere Vereinbarungen (optional)}}

{{company.address}}, den {{today}}

______________________________          ______________________________
Arbeitgeber                                        Arbeitnehmer/in ({{employee.name}})
""",
    },
    {
        "code": "AENDERUNG_LOHN",
        "name": "Änderungsvertrag – Lohnerhöhung（补充协议·涨薪）",
        "category": "amendment",
        "language": "de",
        "description": "调整时薪的合同补充协议，其余条款不变。" + LEGAL_NOTE,
        "body": """# Änderungsvereinbarung zum Arbeitsvertrag

zwischen **{{company.name}}** und **{{employee.name}}** (Personalnummer {{employee.emp_no}})

Der Arbeitsvertrag Nr. {{contract.contract_no}} vom {{contract.start_date}} wird wie folgt geändert:

## § 1 Vergütung
Mit Wirkung zum **{{gueltig_ab|Gültig ab}}** beträgt der Bruttostundenlohn **{{neuer_stundenlohn|Neuer Stundenlohn (EUR)}} EUR** (bisher {{bisheriger_stundenlohn|Bisheriger Stundenlohn (EUR)}} EUR).

## § 2 Sonstiges
{{weitere_aenderungen|Weitere Änderungen (optional)}}
Alle übrigen Bestimmungen des Arbeitsvertrages bleiben unverändert bestehen.

{{company.address}}, den {{today}}

______________________________          ______________________________
Arbeitgeber                                        Arbeitnehmer/in
""",
    },
    {
        "code": "ABMAHNUNG",
        "name": "Abmahnung（书面警告）",
        "category": "warning",
        "language": "de",
        "description": "书面警告：需写明具体事实（日期、时间、行为）、违反的义务，以及再犯将导致解雇的警示。" + LEGAL_NOTE,
        "body": """# Abmahnung

{{company.name}}
{{company.address}}

An
{{employee.name}}
{{employee.address}}

{{company.address}}, den {{today}}

Sehr geehrte/r {{employee.name}},

wir müssen Ihnen leider folgendes Fehlverhalten vorwerfen:

Am **{{vorfall_datum|Datum des Vorfalls}}** {{sachverhalt|Sachverhalt (konkret: Uhrzeit, Ort, was ist passiert)}}

Damit haben Sie gegen Ihre arbeitsvertraglichen Pflichten verstoßen, insbesondere gegen {{verletzte_pflicht|Verletzte Pflicht}}.

Wir mahnen Sie hiermit wegen dieses Verhaltens ab und fordern Sie auf, Ihre arbeitsvertraglichen Pflichten künftig ordnungsgemäß zu erfüllen.

**Wir weisen Sie ausdrücklich darauf hin, dass Sie im Wiederholungsfall mit arbeitsrechtlichen Konsequenzen bis hin zur Kündigung Ihres Arbeitsverhältnisses rechnen müssen.**

Eine Kopie dieses Schreibens wird zu Ihrer Personalakte genommen.

Mit freundlichen Grüßen

______________________________
{{company.representative}}

Erhalten am: ______________     Unterschrift Arbeitnehmer/in: ______________________
""",
    },
    {
        "code": "KUENDIGUNG_ORDENTLICH",
        "name": "Ordentliche Kündigung（普通解雇通知）",
        "category": "termination",
        "language": "de",
        "description": "普通解雇：须书面原件、亲笔签名（§ 623 BGB，电子形式无效），注意解约期、KSchG 与 Betriebsrat 听证。" + LEGAL_NOTE,
        "body": """# Kündigung des Arbeitsverhältnisses

{{company.name}}
{{company.address}}

An
{{employee.name}}
{{employee.address}}

{{company.address}}, den {{today}}

Sehr geehrte/r {{employee.name}},

hiermit kündigen wir das zwischen Ihnen und uns bestehende Arbeitsverhältnis ordentlich und fristgerecht zum **{{beendigungsdatum|Beendigungsdatum}}**, hilfsweise zum nächstmöglichen Termin.

Ihren restlichen Urlaubsanspruch von {{resturlaub|Resturlaub (Tage)}} Tagen gewähren wir Ihnen bis zum Ende des Arbeitsverhältnisses.

Wir weisen Sie darauf hin, dass Sie verpflichtet sind, sich spätestens drei Monate vor Beendigung des Arbeitsverhältnisses bzw. innerhalb von drei Tagen nach Kenntnis des Beendigungszeitpunktes persönlich bei der Agentur für Arbeit arbeitsuchend zu melden (§ 38 SGB III).

Bitte geben Sie alle Arbeitsmittel bis zum letzten Arbeitstag zurück.

Mit freundlichen Grüßen

______________________________
{{company.representative}}

Empfang bestätigt am: ______________     Unterschrift: ______________________
""",
    },
    {
        "code": "ARBEITSBESCHEINIGUNG",
        "name": "Arbeitsbescheinigung / einfaches Zeugnis（在职/工作证明）",
        "category": "certificate",
        "language": "de",
        "description": "简单工作证明（einfaches Arbeitszeugnis）：只写任职期间和岗位，不作评价。" + LEGAL_NOTE,
        "body": """# Arbeitsbescheinigung

Hiermit bestätigen wir, dass

**{{employee.name}}**, geboren am {{employee.birth_date}},

seit dem {{employee.join_date}} {{bis_formulierung|„bis heute" oder „bis zum TT.MM.JJJJ"}} in unserem Unternehmen als **{{employee.position}}** beschäftigt ist bzw. war.

Zu den Aufgaben gehörten insbesondere: {{aufgaben|Aufgaben (z. B. Kommissionierung, Verpackung, Be- und Entladen von Containern)}}

{{company.address}}, den {{today}}

______________________________
{{company.name}}
{{company.representative}}
""",
    },
]
