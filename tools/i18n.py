import re, json, html, pathlib
ROOT = pathlib.Path("/home/user/joyBoy-agency"); SITE = "https://seifabas33-pixel.github.io/joyBoy-agency/"
EN = (ROOT/"portfolio.html").read_text()

DE = {
"animation for Red Sea resorts":"Animation für Resorts am Roten Meer",
"Joy Boy Agency's portfolio: entertainment and animation for Red Sea resorts — the record, the shows on film, and the team behind them.":"Das Portfolio der Joy Boy Agency: Entertainment und Animation für Resorts am Roten Meer — die Bilanz, die Shows im Film und das Team dahinter.",
"Joy Boy Agency — Entertainment that earns its reviews":"Joy Boy Agency — Entertainment, das sich seine Bewertungen verdient",
"Entertainment and animation for Red Sea resorts — the record, the shows on film, and the team behind them.":"Entertainment und Animation für Resorts am Roten Meer — die Bilanz, die Shows im Film und das Team dahinter.",
"Skip to content":"Zum Inhalt springen","Joy Boy Agency logo":"Logo der Joy Boy Agency",
"The agency":"Die Agentur","How we work":"So arbeiten wir","Awards":"Auszeichnungen","Guests":"Gäste","Shows on film":"Shows im Film",
"Our work":"Unsere Arbeit","What we offer":"Unser Angebot","Contact":"Kontakt","Joy Boy Agency on Instagram":"Joy Boy Agency auf Instagram",
"Switch between dark and light theme":"Zwischen dunklem und hellem Design wechseln","live from the floor":"direkt aus dem Resort",
"Photographs and clips from Joy Boy programmes":"Fotos und Clips aus Joy-Boy-Programmen",
"The dress-code night in full swing — guests, not staff, filling the floor.":"Der Dresscode-Abend in vollem Gang — Gäste, nicht Mitarbeiter, füllen die Tanzfläche.",
"Fire performance on the amphitheatre stage.":"Feuershow auf der Bühne des Amphitheaters.","The daytime line":"Das Tagesprogramm",
"Oriental dance class on the pool lawn — twenty guests up and moving before lunch.":"Orientalischer Tanzkurs auf der Poolwiese — zwanzig Gäste in Bewegung, noch vor dem Mittagessen.",
"Curtain call, full house":"Schlussapplaus, volles Haus",
"Taken moments after the evening show — the entire audience stays behind for the photograph with the team.":"Aufgenommen kurz nach der Abendshow — das gesamte Publikum bleibt für das Foto mit dem Team.",
"The full-evening event — lanterns, lasers and the golden stage.":"Der Abend-Event — Laternen, Laser und die goldene Bühne.",
"Theme night send-off":"Verabschiedung zur Themennacht",
"Sunset group photo before the evening programme — the guests ask for these.":"Gruppenfoto bei Sonnenuntergang vor dem Abendprogramm — die Gäste fragen danach.",
"Costume parade through the evening crowd.":"Kostümparade durch das Abendpublikum.","animation":"Animation","Red Sea, Egypt":"Rotes Meer, Ägypten",
"Entertainment that":"Entertainment, das","earns its reviews.":"sich seine Bewertungen verdient.","7 nights a week":"7 Abende pro Woche",
"Joy Boy Agency runs entertainment departments for Red Sea resorts":"Die Joy Boy Agency führt Entertainment-Abteilungen für Resorts am Roten Meer",
"the evening shows, the daytime line, the children's programme and the live music, delivered by one resident team under one management. This portfolio shows":"die Abendshows, das Tagesprogramm, das Kinderprogramm und die Live-Musik, geliefert von einem festen Team unter einer Leitung. Dieses Portfolio zeigt",
"who we are":"wer wir sind","the recognition our work has earned":"die Anerkennung, die unsere Arbeit erhalten hat",", and":" und","what it looks like on stage":"wie es auf der Bühne aussieht",
"Full department":"Komplette Abteilung","Let's talk":"Sprechen wir","Watch the shows":"Shows ansehen",
"A managed entertainment department — one accountable unit, not a collection of freelancers.":"Eine geführte Entertainment-Abteilung — eine verantwortliche Einheit, keine Ansammlung von Freelancern.",
"What we run":"Was wir betreiben","The full evening programme":"Das komplette Abendprogramm",
"— dance, oriental, fire, live singers, DJ nights and headline theme nights on a rotating repertoire":"— Tanz, Orientalisches, Feuer, Live-Sänger, DJ-Abende und große Themennächte im wechselnden Repertoire",
"— aqua gym, sports, pool and beach parties, foam party":"— Aquagym, Sport, Pool- und Strandpartys, Schaumparty","A children's line":"Ein Kinderprogramm",
"— staffed daily sessions, nightly Mini Disco, a weekly kids event with costumed characters":"— täglich betreute Einheiten, jeden Abend Mini-Disco, wöchentlich ein Kinder-Event mit kostümierten Figuren",
"Live music":"Live-Musik","— instrumentalists and singers on rotation across venues":"— Instrumentalisten und Sänger im Wechsel an verschiedenen Orten",
"How we run it":"So führen wir es","A weekly action plan":"Ein wöchentlicher Aktionsplan",
"— every event carries its setup, costume-check and soundcheck deadlines and a named owner of the running order":"— jeder Event hat Fristen für Aufbau, Kostümcheck und Soundcheck sowie einen namentlich Verantwortlichen für den Ablauf",
"A daily attendance register":"Ein tägliches Anwesenheitsregister","— presence, day-off, vacation and absence per person, totalled monthly":"— Anwesenheit, freier Tag, Urlaub und Abwesenheit pro Person, monatlich summiert",
"A published guest programme":"Ein veröffentlichtes Gästeprogramm","— on a board and by QR code":"— auf einer Tafel und per QR-Code",
"Monthly reporting":"Monatliches Reporting","— punctuality, sessions delivered, review mentions":"— Pünktlichkeit, durchgeführte Einheiten, Erwähnungen in Bewertungen",
"From the first walk of your property to the monthly report":"Vom ersten Rundgang durch Ihr Haus bis zum Monatsbericht","five steps, one accountable team.":"fünf Schritte, ein verantwortliches Team.",
"The brief":"Das Briefing","You tell us the guest mix, the venues and the season. We walk the property and listen before we propose anything.":"Sie nennen uns Gästemix, Locations und Saison. Wir gehen durch das Haus und hören zu, bevor wir etwas vorschlagen.",
"Programme design":"Programmgestaltung","A weekly programme built for your resort: evening shows, the daytime line, the children's line and live music, on a rotating repertoire.":"Ein Wochenprogramm, gebaut für Ihr Resort: Abendshows, Tagesprogramm, Kinderprogramm und Live-Musik im wechselnden Repertoire.",
"Team on site":"Team vor Ort","A resident team lives at the hotel, with one team leader accountable for the running order, the roster and the standard.":"Ein festes Team wohnt im Hotel, mit einem Teamleiter, der für Ablauf, Dienstplan und Standard verantwortlich ist.",
"Weekly action plan":"Wöchentlicher Aktionsplan","Every event carries a setup deadline, a costume check, a soundcheck time and a named owner. Nothing runs on hope.":"Jeder Event hat eine Aufbaufrist, einen Kostümcheck, eine Soundcheck-Zeit und einen namentlich Verantwortlichen. Nichts läuft auf gut Glück.",
"Monthly report":"Monatsbericht","Punctuality, sessions delivered and guest-review mentions":"Pünktlichkeit, durchgeführte Einheiten und Erwähnungen in Gästebewertungen",
"on your desk each month, so you see what your guests see.":"jeden Monat auf Ihrem Schreibtisch, damit Sie sehen, was Ihre Gäste sehen.","rankings":"Rankings",
"Not our claims — the platforms' own cards and certificates for Casa Blue, and where the big brands sit on the same list.":"Keine Behauptungen von uns — die eigenen Karten und Zertifikate der Plattformen für Casa Blue, und wo die großen Marken auf derselben Liste stehen.",
"TripAdvisor listing: Casa Blue Beach Resort, 4.9, ranked number 2 of 108 hotels in Marsa Alam":"TripAdvisor-Eintrag: Casa Blue Beach Resort, 4,9, Platz 2 von 108 Hotels in Marsa Alam",
"Casa Blue — #2 of 108 in Marsa Alam":"Casa Blue — Platz 2 von 108 in Marsa Alam",
"TripAdvisor's own listing card: 4.9, Travellers' Choice territory. Joy Boy ran the shows programme here in 2024.":"TripAdvisors eigene Eintragskarte: 4,9, Travellers'-Choice-Niveau. Joy Boy führte hier 2024 das Showprogramm.",
"HolidayCheck Award 2025 certificate for Casa Blue Resort":"HolidayCheck Award 2025 – Zertifikat für das Casa Blue Resort",
"\"One of the most popular hotels worldwide\" — HolidayCheck's own certificate, signed by its CEO.":"„Eines der beliebtesten Hotels weltweit“ — HolidayChecks eigenes Zertifikat, vom CEO unterschrieben.",
"Booking.com Traveller Review Awards 2025: Casa Blue Resort, 9.9 out of 10":"Booking.com Traveller Review Awards 2025: Casa Blue Resort, 9,9 von 10",
"Awarded to Casa Blue Resort. A 9.9 is the top band of Booking's annual awards.":"Verliehen an das Casa Blue Resort. 9,9 ist die höchste Stufe der jährlichen Booking-Awards.",
"Where the big brands sit":"Wo die großen Marken stehen","Same list, the platform's own cards: the resort whose programme Joy Boy ran sits at":"Dieselbe Liste, die eigenen Karten der Plattform: Das Resort, dessen Programm Joy Boy führte, steht auf Platz",
"— above Solymar, Jaz and the Hilton.":"— vor Solymar, Jaz und dem Hilton.",
"Market context, not our award — screenshots captured at different dates, so hotel totals vary between cards.":"Marktkontext, nicht unsere Auszeichnung — Screenshots zu unterschiedlichen Zeitpunkten, daher variieren die Hotelzahlen zwischen den Karten.",
"TripAdvisor card: Solymar Reef Marsa, number 3 of 79 hotels in Marsa Alam":"TripAdvisor-Karte: Solymar Reef Marsa, Platz 3 von 79 Hotels in Marsa Alam","4.5 · 2,692 reviews":"4,5 · 2.692 Bewertungen",
"TripAdvisor card: Jaz Grand Marsa, number 4 of 79 hotels in Marsa Alam":"TripAdvisor-Karte: Jaz Grand Marsa, Platz 4 von 79 Hotels in Marsa Alam","4.5 · 4,275 reviews":"4,5 · 4.275 Bewertungen",
"TripAdvisor card: Hilton Marsa Alam Nubian Resort, number 9 of 93 hotels in Marsa Alam":"TripAdvisor-Karte: Hilton Marsa Alam Nubian Resort, Platz 9 von 93 Hotels in Marsa Alam","4.5 · 7,715 reviews":"4,5 · 7.715 Bewertungen",
"What guests wrote":"Was Gäste schrieben",
"Verbatim from public TripAdvisor reviews of True Beach Resort, where Joy Boy runs the entertainment department this season.":"Wörtlich aus öffentlichen TripAdvisor-Bewertungen des True Beach Resort (englische Fassung), wo Joy Boy in dieser Saison die Entertainment-Abteilung führt.",
"Read them all":"Alle lesen","5 out of 5":"5 von 5","30 Aug 2026":"30. Aug. 2026","26 Aug 2026":"26. Aug. 2026",
"The shows, on film":"Die Shows, im Film","Show names on a page tell you nothing — these clips show what your guests will actually see.":"Shownamen auf einer Seite sagen nichts — diese Clips zeigen, was Ihre Gäste wirklich sehen werden.",
"Play: Fire Show":"Abspielen: Fire Show","0:21 · fire performance on the amphitheatre stage — the night guests film themselves.":"0:21 · Feuershow auf der Amphitheater-Bühne — der Abend, den die Gäste selbst filmen.",
"Play: Echo of Egypt Night":"Abspielen: Echo of Egypt Night","0:40 · the full-evening event — lanterns, lasers and the golden stage.":"0:40 · der Abend-Event — Laternen, Laser und die goldene Bühne.",
"Play: Kids Programme":"Abspielen: Kinderprogramm","Kids Programme":"Kinderprogramm","0:12 · character day on the beach — the costumes come to the guests.":"0:12 · Figurentag am Strand — die Kostüme kommen zu den Gästen.",
"Play: Light Show":"Abspielen: Light Show","0:12 · LED suits and glowing fans after dark.":"0:12 · LED-Anzüge und leuchtende Fächer nach Einbruch der Dunkelheit.",
"Play: Theme Night Parade":"Abspielen: Theme Night Parade","0:18 · costume parade through the evening crowd.":"0:18 · Kostümparade durch das Abendpublikum.",
"As filmed":"Wie gefilmt","Five clips, straight from the floor at the resorts we run — no studio cut, no hired extras. The crowds in frame are real guests on ordinary programme nights.":"Fünf Clips, direkt aus den Resorts, die wir führen — kein Studioschnitt, keine gemieteten Statisten. Die Menschen im Bild sind echte Gäste an gewöhnlichen Programmabenden.",
"See what we offer":"Unser Angebot ansehen","Our":"Unsere","work":"Arbeit","Red Sea":"Rotes Meer","Photographs":"Fotos","clips from the floor":"Clips direkt aus dem Resort","nights a week":"Abende pro Woche",
"Guests dressed in white dancing at a night-time White Sensation party":"In Weiß gekleidete Gäste tanzen bei einer nächtlichen White-Sensation-Party",
"The dress-code night in full swing":"Der Dresscode-Abend in vollem Gang","guests, not staff, filling the floor.":"Gäste, nicht Mitarbeiter, füllen die Tanzfläche.",
"An animator leading a large outdoor dance class for guests wearing coin hip scarves":"Ein Animateur leitet einen großen Tanzkurs im Freien für Gäste mit Münz-Hüfttüchern",
"Oriental dance class on the pool lawn":"Orientalischer Tanzkurs auf der Poolwiese","twenty guests up and moving before lunch.":"zwanzig Gäste in Bewegung, noch vor dem Mittagessen.",
"A full guest crowd with the Joy Boy team on a lit amphitheatre stage at night":"Ein volles Publikum mit dem Joy-Boy-Team auf einer beleuchteten Amphitheater-Bühne bei Nacht",
"Moments after the evening show":"Kurz nach der Abendshow","the entire audience stays for the photograph.":"das gesamte Publikum bleibt für das Foto.",
"Guests and costumed animators posing together at the resort entrance at sunset":"Gäste und kostümierte Animateure posieren gemeinsam am Resort-Eingang bei Sonnenuntergang",
"Sunset group photo before the evening programme":"Gruppenfoto bei Sonnenuntergang vor dem Abendprogramm","the guests ask for these.":"die Gäste fragen danach.",
"Play: After the show":"Abspielen: Nach der Show","After the show":"Nach der Show","the moment the evening programme ends":"der Moment, in dem das Abendprogramm endet","the audience stays, on its feet.":"das Publikum bleibt – und zwar stehend.",
"Resorts, one standard.":"Resorts, ein Standard.","the same weekly plan, the same register, the same faces all week.":"derselbe Wochenplan, dasselbe Register, dieselben Gesichter die ganze Woche.",
"Every night is programme night.":"Jeder Abend ist Programmabend.","What you see here is not a gala week. These are ordinary evenings, photographed because the guests asked for the photograph.":"Was Sie hier sehen, ist keine Galawoche. Das sind gewöhnliche Abende, fotografiert, weil die Gäste um das Foto gebeten haben.",
"No studio, no extras.":"Kein Studio, keine Statisten.","Every image and clip on this page was taken on the floor at a resort we run. The crowds are real guests.":"Jedes Bild und jeder Clip auf dieser Seite wurde vor Ort in einem Resort aufgenommen, das wir führen. Die Menschen im Bild sind echte Gäste.",
"Want the full album?":"Das ganze Album?","Ask on WhatsApp and we will send the season's photo set and the reels in full resolution.":"Fragen Sie per WhatsApp — wir schicken Ihnen das Fotoset der Saison und die Reels in voller Auflösung.",
"A full department, shaped to each resort — programme, team and terms proposed per property.":"Eine komplette Abteilung, zugeschnitten auf jedes Resort — Programm, Team und Konditionen pro Haus vorgeschlagen.",
"The resident team":"Das feste Team","Team Leader":"Teamleiter","— runs the programme, the running order and the weekly action plan":"— führt das Programm, den Ablauf und den wöchentlichen Aktionsplan",
"Resident DJ":"Resident-DJ","— daytime energy, mini disco, evening sets":"— Energie am Tag, Mini-Disco, Abend-Sets",
"Dedicated kids club entertainer":"Eigener Kids-Club-Animateur","— the children's line never loses its person to another duty":"— das Kinderprogramm verliert seine Person nie an eine andere Aufgabe",
"sport entertainers":"Sport-Animateure","— aqua gym, sports, games and hosting":"— Aquagym, Sport, Spiele und Moderation",
"Headcount sized to the resort — resident at the hotel, not visiting acts.":"Teamgröße passend zum Resort — im Hotel wohnhaft, keine Gastauftritte.",
"Why a resident team":"Warum ein festes Team","Days a week the programme runs":"Tage pro Woche läuft das Programm",
"Guests remember the same faces all week — and the same faces are what turn a good holiday into a named five-star review. Roster continuity is a scheduling decision, and we schedule for it deliberately.":"Gäste erinnern sich die ganze Woche an dieselben Gesichter — und genau diese Gesichter machen aus einem guten Urlaub eine namentliche Fünf-Sterne-Bewertung. Kontinuität im Dienstplan ist eine Planungsentscheidung, und wir planen sie bewusst.",
"Stage shows":"Bühnenshows","— multilingual repertoire":"— mehrsprachiges Repertoire","— violin, saxophone, piano":"— Violine, Saxophon, Klavier",
"Theme parties":"Themenpartys","events":"Events","— band, zaffa, tanoura":"— Band, Zaffa, Tanoura","Included in every engagement":"In jedem Auftrag enthalten",
"Weekly action plan with named owners and hard setup times · daily attendance register · published guest programme with QR schedule · monthly report on punctuality, sessions delivered and review mentions.":"Wöchentlicher Aktionsplan mit namentlich Verantwortlichen und festen Aufbauzeiten · tägliches Anwesenheitsregister · veröffentlichtes Gästeprogramm mit QR-Plan · Monatsbericht zu Pünktlichkeit, durchgeführten Einheiten und Erwähnungen in Bewertungen.",
"Kids, answered":"Kinder, geklärt","Dedicated kids club entertainer — in the team, not borrowed from it":"Eigener Kids-Club-Animateur — im Team, nicht ausgeliehen",
"Daily staffed sessions, nightly Mini Disco, and a weekly character event.":"Täglich betreute Einheiten, jeden Abend Mini-Disco und ein wöchentliches Figuren-Event.",
"Questions, answered":"Fragen, beantwortet","The things hotel managers ask us first.":"Was Hotelmanager uns zuerst fragen.",
"How is pricing structured?":"Wie ist die Preisgestaltung?","Per resort, never from a generic list. After a brief and a walk of the property we propose a programme, a team size and a full entertainment budget for that hotel.":"Pro Resort, nie nach einer allgemeinen Liste. Nach einem Briefing und einem Rundgang durch das Haus schlagen wir ein Programm, eine Teamgröße und ein komplettes Entertainment-Budget für dieses Hotel vor.",
"Ask on WhatsApp":"Fragen Sie per WhatsApp","and we will send it.":"und wir schicken es Ihnen.",
"What is included in every engagement?":"Was ist in jedem Auftrag enthalten?","A resident team with an accountable team leader; the weekly action plan with named owners and hard setup times; a daily attendance register; a published guest programme with a QR schedule; and a monthly report on punctuality, sessions delivered and guest-review mentions.":"Ein festes Team mit einem verantwortlichen Teamleiter; der wöchentliche Aktionsplan mit namentlich Verantwortlichen und festen Aufbauzeiten; ein tägliches Anwesenheitsregister; ein veröffentlichtes Gästeprogramm mit QR-Plan; und ein Monatsbericht zu Pünktlichkeit, durchgeführten Einheiten und Erwähnungen in Gästebewertungen.",
"How many nights a week does the programme run?":"An wie vielen Abenden pro Woche läuft das Programm?","Seven. An evening show every night on a rotating repertoire, the daytime line, the children's line every day and live music on rotation across venues.":"Sieben. Jeden Abend eine Show im wechselnden Repertoire, das Tagesprogramm, täglich das Kinderprogramm und Live-Musik im Wechsel an verschiedenen Orten.",
"Do you run the children's programme as well?":"Übernehmen Sie auch das Kinderprogramm?","Yes. A dedicated kids club entertainer is part of the team, not borrowed from it: staffed daily sessions, a nightly Mini Disco and a weekly character event.":"Ja. Ein eigener Kids-Club-Animateur gehört zum Team und wird nicht ausgeliehen: täglich betreute Einheiten, jeden Abend eine Mini-Disco und ein wöchentliches Figuren-Event.",
"Where do you operate?":"Wo sind Sie tätig?","The Egyptian Red Sea: Marsa Alam, Hurghada and Sahl Hasheesh. The team lives at the resort for the season; we are not visiting acts.":"Am ägyptischen Roten Meer: Marsa Alam, Hurghada und Sahl Hasheesh. Das Team wohnt für die Saison im Resort; wir sind keine Gastkünstler.",
"Which resorts have you worked with?":"Mit welchen Resorts haben Sie gearbeitet?","Casa Blue Beach Resort in Marsa Alam (2024 season) and True Beach Resort in Marsa Alam (2026 season). The awards and guest reviews on this page come from those two properties.":"Casa Blue Beach Resort in Marsa Alam (Saison 2024) und True Beach Resort in Marsa Alam (Saison 2026). Die Auszeichnungen und Gästebewertungen auf dieser Seite stammen von diesen beiden Häusern.",
"How do we start?":"Wie fangen wir an?","Message Mr. Moaz on":"Schreiben Sie Herrn Moaz auf","or email":"oder per E-Mail an",". We take a brief, visit the property, and come back with a tailored programme and budget.":". Wir nehmen ein Briefing auf, besuchen das Haus und kommen mit einem maßgeschneiderten Programm und Budget zurück.",
"Can we see the shows before deciding?":"Können wir die Shows sehen, bevor wir entscheiden?","Yes — the reels on this page are unedited clips from the floor, and we can arrange a visit to a running programme in season.":"Ja — die Reels auf dieser Seite sind ungeschnittene Clips aus dem Resort, und wir können einen Besuch bei einem laufenden Programm in der Saison arrangieren.",
"The next step":"Der nächste Schritt","Ask us for a tailored programme and a full entertainment budget for your resort.":"Fragen Sie uns nach einem maßgeschneiderten Programm und einem kompletten Entertainment-Budget für Ihr Resort.",
"Request a proposal on WhatsApp":"Angebot per WhatsApp anfragen","Mr. Moaz Moamen":"Herr Moaz Moamen","Founder":"Gründer","Message on WhatsApp":"Nachricht per WhatsApp",
"Mr. Seif Abas":"Herr Seif Abas","Co-founder":"Mitgründer","Company":"Unternehmen","@joyboyentertainment on Instagram":"@joyboyentertainment auf Instagram",
"animation management for Red Sea resorts":"Animationsmanagement für Resorts am Roten Meer","one resident team, one accountable department, seven nights a week.":"ein festes Team, eine verantwortliche Abteilung, sieben Abende pro Woche.",
"Explore":"Entdecken","Agency portfolio":"Agentur-Portfolio","rates quoted per resort on request":"Preise pro Resort auf Anfrage","Privacy":"Datenschutz","Terms":"Nutzungsbedingungen",
"Back to top":"Nach oben","Image viewer":"Bildansicht","Close":"Schließen","Language":"Sprache","Open menu":"Menü öffnen","Close menu":"Menü schließen","Sections":"Bereiche",
}
IT = {
"animation for Red Sea resorts":"animazione per i resort del Mar Rosso",
"Joy Boy Agency's portfolio: entertainment and animation for Red Sea resorts — the record, the shows on film, and the team behind them.":"Il portfolio di Joy Boy Agency: intrattenimento e animazione per i resort del Mar Rosso — i risultati, gli spettacoli in video e il team che c'è dietro.",
"Joy Boy Agency — Entertainment that earns its reviews":"Joy Boy Agency — Intrattenimento che si guadagna le recensioni",
"Entertainment and animation for Red Sea resorts — the record, the shows on film, and the team behind them.":"Intrattenimento e animazione per i resort del Mar Rosso — i risultati, gli spettacoli in video e il team che c'è dietro.",
"Skip to content":"Vai al contenuto","Joy Boy Agency logo":"Logo di Joy Boy Agency","Entertainment":"Intrattenimento","Animation":"Animazione",
"The agency":"L'agenzia","How we work":"Come lavoriamo","Awards":"Premi","Guests":"Ospiti","Shows on film":"Gli show in video",
"Our work":"Il nostro lavoro","What we offer":"Cosa offriamo","Contact":"Contatti","Joy Boy Agency on Instagram":"Joy Boy Agency su Instagram",
"Switch between dark and light theme":"Passa dal tema scuro a quello chiaro","live from the floor":"dal vivo dal resort",
"Photographs and clips from Joy Boy programmes":"Foto e clip dai programmi Joy Boy",
"The dress-code night in full swing — guests, not staff, filling the floor.":"La serata a tema in pieno svolgimento — ospiti, non staff, a riempire la pista.",
"Fire performance on the amphitheatre stage.":"Spettacolo di fuoco sul palco dell'anfiteatro.","The daytime line":"Il programma diurno",
"Oriental dance class on the pool lawn — twenty guests up and moving before lunch.":"Lezione di danza orientale sul prato della piscina — venti ospiti in movimento prima di pranzo.",
"Curtain call, full house":"Applausi finali, tutto esaurito",
"Taken moments after the evening show — the entire audience stays behind for the photograph with the team.":"Scattata pochi istanti dopo lo show serale — l'intero pubblico resta per la foto con il team.",
"The full-evening event — lanterns, lasers and the golden stage.":"L'evento serale — lanterne, laser e il palco dorato.",
"Theme night send-off":"Il saluto della serata a tema",
"Sunset group photo before the evening programme — the guests ask for these.":"Foto di gruppo al tramonto prima del programma serale — sono gli ospiti a chiederla.",
"Costume parade through the evening crowd.":"Sfilata in costume tra il pubblico serale.","animation":"animazione","Red Sea, Egypt":"Mar Rosso, Egitto",
"Entertainment that":"Intrattenimento che","earns its reviews.":"si guadagna le recensioni.","7 nights a week":"7 sere a settimana",
"Joy Boy Agency runs entertainment departments for Red Sea resorts":"Joy Boy Agency gestisce i reparti animazione dei resort del Mar Rosso",
"the evening shows, the daytime line, the children's programme and the live music, delivered by one resident team under one management. This portfolio shows":"gli show serali, il programma diurno, il programma bambini e la musica dal vivo, con un unico team residente e un'unica direzione. Questo portfolio mostra",
"who we are":"chi siamo","the recognition our work has earned":"i riconoscimenti che il nostro lavoro ha ottenuto",", and":" e","what it looks like on stage":"come appare sul palco",
"Full department":"Reparto completo","Let's talk":"Parliamone","Watch the shows":"Guarda gli show",
"A managed entertainment department — one accountable unit, not a collection of freelancers.":"Un reparto animazione gestito — un'unica unità responsabile, non un insieme di freelance.",
"What we run":"Cosa gestiamo","The full evening programme":"Il programma serale completo",
"— dance, oriental, fire, live singers, DJ nights and headline theme nights on a rotating repertoire":"— danza, orientale, fuoco, cantanti dal vivo, serate DJ e grandi serate a tema su repertorio a rotazione",
"— aqua gym, sports, pool and beach parties, foam party":"— acquagym, sport, feste in piscina e in spiaggia, schiuma party","A children's line":"Un programma bambini",
"— staffed daily sessions, nightly Mini Disco, a weekly kids event with costumed characters":"— sessioni quotidiane con animatori, Mini Disco ogni sera, un evento settimanale per bambini con personaggi in costume",
"Live music":"Musica dal vivo","— instrumentalists and singers on rotation across venues":"— strumentisti e cantanti a rotazione nelle varie location",
"How we run it":"Come lo gestiamo","A weekly action plan":"Un piano d'azione settimanale",
"— every event carries its setup, costume-check and soundcheck deadlines and a named owner of the running order":"— ogni evento ha scadenze per allestimento, controllo costumi e soundcheck e un responsabile nominato per la scaletta",
"A daily attendance register":"Un registro presenze giornaliero","— presence, day-off, vacation and absence per person, totalled monthly":"— presenza, giorno libero, ferie e assenze per persona, totalizzate ogni mese",
"A published guest programme":"Un programma ospiti pubblicato","— on a board and by QR code":"— in bacheca e via codice QR",
"Monthly reporting":"Report mensile","— punctuality, sessions delivered, review mentions":"— puntualità, sessioni svolte, menzioni nelle recensioni",
"From the first walk of your property to the monthly report":"Dal primo sopralluogo nella vostra struttura al report mensile","five steps, one accountable team.":"cinque passi, un unico team responsabile.",
"The brief":"Il brief","You tell us the guest mix, the venues and the season. We walk the property and listen before we propose anything.":"Ci raccontate mix di ospiti, location e stagione. Visitiamo la struttura e ascoltiamo prima di proporre qualsiasi cosa.",
"Programme design":"Progettazione del programma","A weekly programme built for your resort: evening shows, the daytime line, the children's line and live music, on a rotating repertoire.":"Un programma settimanale costruito per il vostro resort: show serali, programma diurno, programma bambini e musica dal vivo, su repertorio a rotazione.",
"Team on site":"Team in struttura","A resident team lives at the hotel, with one team leader accountable for the running order, the roster and the standard.":"Un team residente vive in hotel, con un team leader responsabile di scaletta, turni e standard.",
"Weekly action plan":"Piano d'azione settimanale","Every event carries a setup deadline, a costume check, a soundcheck time and a named owner. Nothing runs on hope.":"Ogni evento ha una scadenza di allestimento, un controllo costumi, un orario di soundcheck e un responsabile nominato. Niente è lasciato al caso.",
"Monthly report":"Report mensile","Punctuality, sessions delivered and guest-review mentions":"Puntualità, sessioni svolte e menzioni nelle recensioni degli ospiti",
"on your desk each month, so you see what your guests see.":"ogni mese sulla vostra scrivania, così vedete ciò che vedono i vostri ospiti.","rankings":"classifiche",
"Not our claims — the platforms' own cards and certificates for Casa Blue, and where the big brands sit on the same list.":"Non parole nostre — le schede e i certificati delle piattaforme stesse per Casa Blue, e dove si posizionano i grandi marchi nella stessa lista.",
"TripAdvisor listing: Casa Blue Beach Resort, 4.9, ranked number 2 of 108 hotels in Marsa Alam":"Scheda TripAdvisor: Casa Blue Beach Resort, 4,9, al 2º posto su 108 hotel a Marsa Alam",
"Casa Blue — #2 of 108 in Marsa Alam":"Casa Blue — 2º su 108 a Marsa Alam",
"TripAdvisor's own listing card: 4.9, Travellers' Choice territory. Joy Boy ran the shows programme here in 2024.":"La scheda ufficiale di TripAdvisor: 4,9, livello Travellers' Choice. Joy Boy ha gestito qui il programma show nel 2024.",
"HolidayCheck Award 2025 certificate for Casa Blue Resort":"Certificato HolidayCheck Award 2025 per il Casa Blue Resort",
"\"One of the most popular hotels worldwide\" — HolidayCheck's own certificate, signed by its CEO.":"«Uno degli hotel più amati al mondo» — il certificato ufficiale di HolidayCheck, firmato dal CEO.",
"Booking.com Traveller Review Awards 2025: Casa Blue Resort, 9.9 out of 10":"Booking.com Traveller Review Awards 2025: Casa Blue Resort, 9,9 su 10",
"Awarded to Casa Blue Resort. A 9.9 is the top band of Booking's annual awards.":"Assegnato al Casa Blue Resort. Un 9,9 è la fascia più alta dei premi annuali di Booking.",
"Where the big brands sit":"Dove si posizionano i grandi marchi","Same list, the platform's own cards: the resort whose programme Joy Boy ran sits at":"Stessa lista, le schede della piattaforma: il resort di cui Joy Boy gestiva il programma è al",
"— above Solymar, Jaz and the Hilton.":"— sopra Solymar, Jaz e l'Hilton.",
"Market context, not our award — screenshots captured at different dates, so hotel totals vary between cards.":"Contesto di mercato, non un nostro premio — screenshot presi in date diverse, per questo i totali degli hotel variano tra le schede.",
"TripAdvisor card: Solymar Reef Marsa, number 3 of 79 hotels in Marsa Alam":"Scheda TripAdvisor: Solymar Reef Marsa, 3º su 79 hotel a Marsa Alam","4.5 · 2,692 reviews":"4,5 · 2.692 recensioni",
"TripAdvisor card: Jaz Grand Marsa, number 4 of 79 hotels in Marsa Alam":"Scheda TripAdvisor: Jaz Grand Marsa, 4º su 79 hotel a Marsa Alam","4.5 · 4,275 reviews":"4,5 · 4.275 recensioni",
"TripAdvisor card: Hilton Marsa Alam Nubian Resort, number 9 of 93 hotels in Marsa Alam":"Scheda TripAdvisor: Hilton Marsa Alam Nubian Resort, 9º su 93 hotel a Marsa Alam","4.5 · 7,715 reviews":"4,5 · 7.715 recensioni",
"What guests wrote":"Cosa hanno scritto gli ospiti",
"Verbatim from public TripAdvisor reviews of True Beach Resort, where Joy Boy runs the entertainment department this season.":"Testualmente dalle recensioni pubbliche su TripAdvisor del True Beach Resort (versione inglese), dove Joy Boy gestisce il reparto animazione in questa stagione.",
"Read them all":"Leggile tutte","5 out of 5":"5 su 5","30 Aug 2026":"30 ago 2026","26 Aug 2026":"26 ago 2026",
"The shows, on film":"Gli show, in video","Show names on a page tell you nothing — these clips show what your guests will actually see.":"I nomi degli show su una pagina non dicono nulla — questi clip mostrano cosa vedranno davvero i vostri ospiti.",
"Play: Fire Show":"Riproduci: Fire Show","0:21 · fire performance on the amphitheatre stage — the night guests film themselves.":"0:21 · spettacolo di fuoco sul palco dell'anfiteatro — la sera che gli ospiti filmano da soli.",
"Play: Echo of Egypt Night":"Riproduci: Echo of Egypt Night","0:40 · the full-evening event — lanterns, lasers and the golden stage.":"0:40 · l'evento serale — lanterne, laser e il palco dorato.",
"Play: Kids Programme":"Riproduci: Programma bambini","Kids Programme":"Programma bambini","0:12 · character day on the beach — the costumes come to the guests.":"0:12 · giornata dei personaggi in spiaggia — i costumi vanno dagli ospiti.",
"Play: Light Show":"Riproduci: Light Show","0:12 · LED suits and glowing fans after dark.":"0:12 · tute LED e ventagli luminosi dopo il tramonto.",
"Play: Theme Night Parade":"Riproduci: Theme Night Parade","0:18 · costume parade through the evening crowd.":"0:18 · sfilata in costume tra il pubblico serale.",
"As filmed":"Così come filmato","Five clips, straight from the floor at the resorts we run — no studio cut, no hired extras. The crowds in frame are real guests on ordinary programme nights.":"Cinque clip, presi direttamente dai resort che gestiamo — nessun montaggio in studio, nessuna comparsa. Le persone inquadrate sono veri ospiti in normali serate di programma.",
"See what we offer":"Guarda cosa offriamo","Our":"Il nostro","work":"lavoro","Red Sea":"Mar Rosso","Photographs":"Foto","clips from the floor":"clip dal resort","nights a week":"sere a settimana",
"Guests dressed in white dancing at a night-time White Sensation party":"Ospiti vestiti di bianco ballano a una festa White Sensation notturna",
"The dress-code night in full swing":"La serata a tema in pieno svolgimento","guests, not staff, filling the floor.":"ospiti, non staff, a riempire la pista.",
"An animator leading a large outdoor dance class for guests wearing coin hip scarves":"Un animatore guida una grande lezione di ballo all'aperto per ospiti con foulard a monete",
"Oriental dance class on the pool lawn":"Lezione di danza orientale sul prato della piscina","twenty guests up and moving before lunch.":"venti ospiti in movimento prima di pranzo.",
"A full guest crowd with the Joy Boy team on a lit amphitheatre stage at night":"Un pubblico al completo con il team Joy Boy su un palco d'anfiteatro illuminato di notte",
"Moments after the evening show":"Pochi istanti dopo lo show serale","the entire audience stays for the photograph.":"l'intero pubblico resta per la foto.",
"Guests and costumed animators posing together at the resort entrance at sunset":"Ospiti e animatori in costume posano insieme all'ingresso del resort al tramonto",
"Sunset group photo before the evening programme":"Foto di gruppo al tramonto prima del programma serale","the guests ask for these.":"sono gli ospiti a chiederla.",
"Play: After the show":"Riproduci: Dopo lo show","After the show":"Dopo lo show","the moment the evening programme ends":"il momento in cui il programma serale finisce","the audience stays, on its feet.":"il pubblico resta, in piedi.",
"Resorts, one standard.":"resort, un unico standard.","the same weekly plan, the same register, the same faces all week.":"lo stesso piano settimanale, lo stesso registro, le stesse facce per tutta la settimana.",
"Every night is programme night.":"Ogni sera è sera di programma.","What you see here is not a gala week. These are ordinary evenings, photographed because the guests asked for the photograph.":"Quello che vedete qui non è una settimana di gala. Sono serate normali, fotografate perché gli ospiti hanno chiesto la foto.",
"No studio, no extras.":"Niente studio, niente comparse.","Every image and clip on this page was taken on the floor at a resort we run. The crowds are real guests.":"Ogni immagine e clip di questa pagina è stata realizzata in un resort che gestiamo. Le persone inquadrate sono veri ospiti.",
"Want the full album?":"Volete l'album completo?","Ask on WhatsApp and we will send the season's photo set and the reels in full resolution.":"Chiedetecelo su WhatsApp e vi invieremo il set fotografico della stagione e i reel in piena risoluzione.",
"A full department, shaped to each resort — programme, team and terms proposed per property.":"Un reparto completo, su misura per ogni resort — programma, team e condizioni proposti per struttura.",
"The resident team":"Il team residente","Team Leader":"Team leader","— runs the programme, the running order and the weekly action plan":"— gestisce il programma, la scaletta e il piano d'azione settimanale",
"Resident DJ":"DJ residente","— daytime energy, mini disco, evening sets":"— energia di giorno, mini disco, set serali",
"Dedicated kids club entertainer":"Animatore dedicato al mini club","— the children's line never loses its person to another duty":"— il programma bambini non perde mai la sua persona per un altro incarico",
"sport entertainers":"animatori sportivi","— aqua gym, sports, games and hosting":"— acquagym, sport, giochi e conduzione",
"Headcount sized to the resort — resident at the hotel, not visiting acts.":"Organico dimensionato sul resort — residente in hotel, non artisti di passaggio.",
"Why a resident team":"Perché un team residente","Days a week the programme runs":"Giorni a settimana di programma",
"Guests remember the same faces all week — and the same faces are what turn a good holiday into a named five-star review. Roster continuity is a scheduling decision, and we schedule for it deliberately.":"Gli ospiti ricordano le stesse facce per tutta la settimana — e sono quelle facce a trasformare una buona vacanza in una recensione a cinque stelle con nome e cognome. La continuità dei turni è una scelta di pianificazione, e noi la pianifichiamo apposta.",
"Stage shows":"Spettacoli sul palco","— multilingual repertoire":"— repertorio multilingue","— violin, saxophone, piano":"— violino, sassofono, pianoforte",
"Theme parties":"Feste a tema","events":"eventi","— band, zaffa, tanoura":"— band, zaffa, tanoura","Included in every engagement":"Incluso in ogni incarico",
"Weekly action plan with named owners and hard setup times · daily attendance register · published guest programme with QR schedule · monthly report on punctuality, sessions delivered and review mentions.":"Piano d'azione settimanale con responsabili nominati e orari di allestimento fissi · registro presenze giornaliero · programma ospiti pubblicato con calendario QR · report mensile su puntualità, sessioni svolte e menzioni nelle recensioni.",
"Kids, answered":"Bambini, risolto","Dedicated kids club entertainer — in the team, not borrowed from it":"Animatore dedicato al mini club — nel team, non preso in prestito",
"Daily staffed sessions, nightly Mini Disco, and a weekly character event.":"Sessioni quotidiane con animatori, Mini Disco ogni sera e un evento settimanale con i personaggi.",
"Questions, answered":"Domande, risposte","The things hotel managers ask us first.":"Le cose che i direttori d'hotel ci chiedono per prime.",
"How is pricing structured?":"Come funziona il prezzo?","Per resort, never from a generic list. After a brief and a walk of the property we propose a programme, a team size and a full entertainment budget for that hotel.":"Per resort, mai da un listino generico. Dopo un brief e un sopralluogo proponiamo un programma, un organico e un budget completo di intrattenimento per quell'hotel.",
"Ask on WhatsApp":"Chiedete su WhatsApp","and we will send it.":"e ve lo invieremo.",
"What is included in every engagement?":"Cosa è incluso in ogni incarico?","A resident team with an accountable team leader; the weekly action plan with named owners and hard setup times; a daily attendance register; a published guest programme with a QR schedule; and a monthly report on punctuality, sessions delivered and guest-review mentions.":"Un team residente con un team leader responsabile; il piano d'azione settimanale con responsabili nominati e orari di allestimento fissi; un registro presenze giornaliero; un programma ospiti pubblicato con calendario QR; e un report mensile su puntualità, sessioni svolte e menzioni nelle recensioni degli ospiti.",
"How many nights a week does the programme run?":"Quante sere a settimana c'è programma?","Seven. An evening show every night on a rotating repertoire, the daytime line, the children's line every day and live music on rotation across venues.":"Sette. Uno show ogni sera su repertorio a rotazione, il programma diurno, il programma bambini tutti i giorni e musica dal vivo a rotazione nelle varie location.",
"Do you run the children's programme as well?":"Gestite anche il programma bambini?","Yes. A dedicated kids club entertainer is part of the team, not borrowed from it: staffed daily sessions, a nightly Mini Disco and a weekly character event.":"Sì. Un animatore dedicato al mini club fa parte del team, non è preso in prestito: sessioni quotidiane, una Mini Disco ogni sera e un evento settimanale con i personaggi.",
"Where do you operate?":"Dove operate?","The Egyptian Red Sea: Marsa Alam, Hurghada and Sahl Hasheesh. The team lives at the resort for the season; we are not visiting acts.":"Sul Mar Rosso egiziano: Marsa Alam, Hurghada e Sahl Hasheesh. Il team vive nel resort per tutta la stagione; non siamo artisti di passaggio.",
"Which resorts have you worked with?":"Con quali resort avete lavorato?","Casa Blue Beach Resort in Marsa Alam (2024 season) and True Beach Resort in Marsa Alam (2026 season). The awards and guest reviews on this page come from those two properties.":"Casa Blue Beach Resort a Marsa Alam (stagione 2024) e True Beach Resort a Marsa Alam (stagione 2026). I premi e le recensioni degli ospiti in questa pagina vengono da queste due strutture.",
"How do we start?":"Come si comincia?","Message Mr. Moaz on":"Scrivete al Sig. Moaz su","or email":"o via e-mail a",". We take a brief, visit the property, and come back with a tailored programme and budget.":". Raccogliamo un brief, visitiamo la struttura e torniamo con un programma e un budget su misura.",
"Can we see the shows before deciding?":"Possiamo vedere gli show prima di decidere?","Yes — the reels on this page are unedited clips from the floor, and we can arrange a visit to a running programme in season.":"Sì — i reel in questa pagina sono clip non montati dal resort, e possiamo organizzare una visita a un programma in corso durante la stagione.",
"The next step":"Il prossimo passo","Ask us for a tailored programme and a full entertainment budget for your resort.":"Chiedeteci un programma su misura e un budget completo di intrattenimento per il vostro resort.",
"Request a proposal on WhatsApp":"Richiedi una proposta su WhatsApp","Mr. Moaz Moamen":"Sig. Moaz Moamen","Founder":"Fondatore","Message on WhatsApp":"Scrivi su WhatsApp",
"Mr. Seif Abas":"Sig. Seif Abas","Co-founder":"Co-fondatore","Company":"Azienda","@joyboyentertainment on Instagram":"@joyboyentertainment su Instagram",
"animation management for Red Sea resorts":"gestione dell'animazione per i resort del Mar Rosso","one resident team, one accountable department, seven nights a week.":"un unico team residente, un unico reparto responsabile, sette sere a settimana.",
"Explore":"Esplora","Agency portfolio":"Portfolio dell'agenzia","rates quoted per resort on request":"tariffe per resort su richiesta","Privacy":"Privacy","Terms":"Termini",
"Back to top":"Torna su","Image viewer":"Visualizzatore immagini","Close":"Chiudi","Language":"Lingua","Open menu":"Apri il menu","Close menu":"Chiudi il menu","Sections":"Sezioni",
}
ORG_DESC = {"de":"Entertainment- und Animationsmanagement für Resorts am Roten Meer: Abendshows, Tagesprogramm, Kinderprogramm und Live-Musik, geliefert von einem festen Team.",
            "it":"Gestione dell'intrattenimento e dell'animazione per i resort del Mar Rosso: show serali, programma diurno, programma bambini e musica dal vivo, con un unico team residente."}
LOCALE = {"en":"en_GB","de":"de_DE","it":"it_IT"}

def translate(src, D, lang):
    parts = re.split(r'(<[^>]+>)', src)
    out, skip = [], 0
    for p in parts:
        if p.startswith("<"):
            t = p.lower()
            if re.match(r'<(script|style|svg)\b', t): skip += 1
            elif re.match(r'</(script|style|svg)>', t): skip -= 1
            # translatable attributes
            def attr(m):
                k, v = m.group(1), m.group(2)
                if k == "content":
                    if not re.search(r'(name="description"|property="og:(title|description)")', p): return m.group(0)
                nv = D.get(html.unescape(v).strip())
                return f'{k}="{html.escape(nv, quote=True)}"' if nv else m.group(0)
            p = re.sub(r'\b(alt|aria-label|data-cap|data-close-label|content)="([^"]*)"', attr, p)
            out.append(p); continue
        if skip or not p.strip(): out.append(p); continue
        pieces = re.split(r'(&[#\w]+;)', p)
        for i, pc in enumerate(pieces):
            if pc.startswith("&") and pc.endswith(";"): continue
            key = re.sub(r"\s+", " ", pc).strip()
            if key in D:
                lead = pc[:len(pc)-len(pc.lstrip())]; trail = pc[len(pc.rstrip()):]
                pieces[i] = lead + html.escape(D[key], quote=False).replace("&#x27;","'") + trail
        out.append("".join(pieces))
    s = "".join(out)
    # document-level
    s = s.replace('<html lang="en">', f'<html lang="{lang}">', 1)
    s = s.replace(f'<link rel="canonical" href="{SITE}">', f'<link rel="canonical" href="{SITE}{lang}.html">', 1)
    s = s.replace(f'<meta property="og:url" content="{SITE}">', f'<meta property="og:url" content="{SITE}{lang}.html">', 1)
    s = re.sub(r'<meta property="og:locale" content="[^"]*">\n', '', s)
    s = s.replace('<meta property="og:type" content="website">', f'<meta property="og:type" content="website">\n<meta property="og:locale" content="{LOCALE[lang]}">', 1)
    # switcher state
    s = s.replace('<span class="cur">EN</span>', f'<span class="cur">{lang.upper()}</span>', 1)
    s = s.replace('<a href="./" lang="en" hreflang="en" class="on">English</a>', '<a href="./" lang="en" hreflang="en">English</a>', 1)
    name = {"de":"Deutsch","it":"Italiano"}[lang]
    s = s.replace(f'<a href="{lang}.html" lang="{lang}" hreflang="{lang}">{name}</a>', f'<a href="{lang}.html" lang="{lang}" hreflang="{lang}" class="on" aria-current="page">{name}</a>', 1)
    # structured data: translate org description, rebuild FAQ from the translated markup
    m = re.search(r'<script type="application/ld\+json">(.*?)</script>', s, re.S); ld = json.loads(m.group(1))
    ld[0]["description"] = ORG_DESC[lang]; ld[0]["url"] = SITE + f"{lang}.html"
    faq = re.findall(r'<summary>(.*?)</summary><div class="a">(.*?)</div>', s, re.S)
    strip = lambda x: html.unescape(re.sub(r'<[^>]+>', '', x)).strip()
    ld[1]["mainEntity"] = [{"@type":"Question","name":strip(q),"acceptedAnswer":{"@type":"Answer","text":strip(a)}} for q,a in faq]
    s = s[:m.start(1)] + json.dumps(ld, ensure_ascii=False) + s[m.end(1):]
    return s

# ── English page: switcher + hreflang (once) ──
s = EN
if 'class="lang"' not in s:
    s = s.replace('    <a class="iconbtn" href="https://www.instagram.com/joyboyentertainment/"',
      '    <nav class="lang" aria-label="Language"><a href="./" lang="en" hreflang="en" class="on">EN</a><a href="de.html" lang="de" hreflang="de">DE</a><a href="it.html" lang="it" hreflang="it">IT</a></nav>\n    <a class="iconbtn" href="https://www.instagram.com/joyboyentertainment/"', 1)
    s = s.replace('.iconbtn svg{width:17px;height:17px;display:block}\n',
      '.iconbtn svg{width:17px;height:17px;display:block}\n.lang{display:flex;gap:2px;flex:none;border:1px solid var(--line-2);border-radius:99px;padding:3px}\n.lang a{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.08em;padding:5px 9px;border-radius:99px;color:var(--ink-3);text-decoration:none;transition:color .2s,background .2s}\n.lang a:hover{color:var(--ink)}\n.lang a.on{background:var(--yellow);color:var(--dark)}\n@media(max-width:560px){.lang a{padding:5px 7px;font-size:10.5px}}\n', 1)
    s = s.replace(f'<link rel="canonical" href="{SITE}">',
      f'<link rel="canonical" href="{SITE}">\n<link rel="alternate" hreflang="en" href="{SITE}">\n<link rel="alternate" hreflang="de" href="{SITE}de.html">\n<link rel="alternate" hreflang="it" href="{SITE}it.html">\n<link rel="alternate" hreflang="x-default" href="{SITE}">', 1)
    s = s.replace('<meta property="og:type" content="website">', '<meta property="og:type" content="website">\n<meta property="og:locale" content="en_GB">', 1)
    assert s.count('class="lang"') == 1 and 'hreflang="x-default"' in s
    (ROOT/"portfolio.html").write_text(s)

de = translate(s, DE, "de"); it = translate(s, IT, "it")
(ROOT/"de.html").write_text(de); (ROOT/"it.html").write_text(it)
# coverage report: english strings that survived untranslated in DE
left = [k for k in DE if k in de and k not in ("WhatsApp",)]
print("de untranslated leftovers:", left[:8])
print("sizes:", len(s), len(de), len(it))
for lang, D, doc in (("de",DE,de),("it",IT,it)):
    miss = [k for k in D if html.escape(D[k], quote=False) not in doc and D[k] not in doc]
    print(lang, "keys whose translation is absent:", len(miss), miss[:6])
# sitemap
(ROOT/"sitemap.xml").write_text(f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url><loc>{SITE}</loc><lastmod>2026-09-03</lastmod><changefreq>monthly</changefreq><priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="{SITE}"/><xhtml:link rel="alternate" hreflang="de" href="{SITE}de.html"/><xhtml:link rel="alternate" hreflang="it" href="{SITE}it.html"/><xhtml:link rel="alternate" hreflang="x-default" href="{SITE}"/></url>
  <url><loc>{SITE}de.html</loc><lastmod>2026-09-03</lastmod><changefreq>monthly</changefreq><priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="{SITE}"/><xhtml:link rel="alternate" hreflang="de" href="{SITE}de.html"/><xhtml:link rel="alternate" hreflang="it" href="{SITE}it.html"/><xhtml:link rel="alternate" hreflang="x-default" href="{SITE}"/></url>
  <url><loc>{SITE}it.html</loc><lastmod>2026-09-03</lastmod><changefreq>monthly</changefreq><priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="{SITE}"/><xhtml:link rel="alternate" hreflang="de" href="{SITE}de.html"/><xhtml:link rel="alternate" hreflang="it" href="{SITE}it.html"/><xhtml:link rel="alternate" hreflang="x-default" href="{SITE}"/></url>
  <url><loc>{SITE}legal.html</loc><lastmod>2026-09-02</lastmod><changefreq>yearly</changefreq><priority>0.2</priority></url>
</urlset>
''')
print("done")
