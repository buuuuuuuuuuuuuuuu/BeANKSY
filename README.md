# BeANKSY

Persönliche Kaffeebohnen-App fürs iPhone, abgestimmt auf die Mühle DF54.

**Ablauf:** iPhone an den NFC-Tag der Dose halten. BeANKSY öffnet sich direkt mit der aufgeklappten Kachel der Bohne in dieser Dose: Name, Gramm und Mahlgrad groß, dazu Röster, Röstdatum, Notiz und Bezüge. Dort kannst du auch die Bohne in der Dose wechseln.

- **App:** https://buuuuuuuuuuuuuuuu.github.io/BeANKSY/
- **Aktuelle Version:** 2.4 (steht auch ganz unten in der App)

---

## Funktionen

| Bereich | Was die App kann |
|---|---|
| Bohnen | Je zwei Kacheln nebeneinander mit Name, Gramm pro Shot und Mahlgrad. Antippen klappt eine Kachel über die volle Breite auf. |
| Aufgeklappt | −/+ in 0,5er-Schritten für Gramm und Mahlgrad, dazu Röster, Röstdatum mit Alter, Dose, Notiz und die Zahl der Bezüge per NFC. Außerdem *Bearbeiten* und *Aufgebraucht*. |
| Suche | Das Suchfeld filtert die Liste schon beim Tippen. Es sucht in Name, Röster, Notiz und Dose, ohne auf Groß/Klein oder Umlaute zu achten („athiopien“ findet „Äthiopien“). Mehrere Wörter müssen alle passen. |
| Sortierung | Neueste, A–Z oder Häufigste (nach Zahl der NFC-Scans). Die Auswahl bleibt gespeichert. |
| Aufgebraucht | Die Bohne wandert ins Archiv unten in der Liste, und ihre Dose wird frei. Mit *Wieder aktivieren* holst du sie zurück. |
| Dosen | Jeder NFC-Tag steht für eine Dose. Der Scan öffnet die App direkt mit der aufgeklappten Kachel der Bohne in dieser Dose. Dort wechselst du über „Bohne in … wechseln“ die Bohne. In der Dosen-Liste ist die zuletzt gescannte Dose markiert, dort kopierst du auch den Link für den Kurzbefehl. |
| Sync | Über deinen Cloudflare Worker. Der Punkt neben dem Titel zeigt den Stand: grün = synchron, gelb = wartet, rot = Fehler, grau = nur lokal. |
| Darstellung | Zwei Looks: Hell heißt „Skala“ (warmes Papier, Mono-Ziffern, Mahlgrad-Lineal, Signal-Orange), Dunkel heißt „Nachtröstung“ (Espresso-Braun, Serifenschrift, runder Mahlgrad-Regler, Crema-Akzent). Oben steht groß die zuletzt per NFC gescannte Bohne. Unter *Einstellungen → Darstellung* wählst du Auto (folgt dem iPhone), Hell oder Dunkel. |
| Updates | Gibt es eine neuere Version, erscheint unten der Hinweis **Neu laden**. |
| Backup | *Einstellungen → Exportieren / Importieren* als JSON-Datei. Ein Import ersetzt den aktuellen Stand. |
| Offline | Die App läuft auch ohne Netz und lädt Änderungen hoch, sobald wieder Netz da ist. Zum Zählen der Scans braucht das iPhone Netz. |

## Aufbau

| Datei | Was | Wo es läuft |
|---|---|---|
| `index.html` | Die ganze App (HTML, CSS, JavaScript in einer Datei) | GitHub Pages |
| `sw.js` | Service Worker für den Offline-Betrieb | GitHub Pages |
| `manifest.webmanifest`, `icons/` | App-Name, Farben und Icons für den Home-Bildschirm | GitHub Pages |
| `version.json` | Aktuelle Versionsnummer für den Hinweis „Neu laden“ | GitHub Pages |
| `worker/worker.js` | Sync-Backend, Mitteilungstext und Zähler für die Bezüge | Cloudflare Workers + KV (Gratis-Tarif) |

Die NFC-Tags liest nicht die App, sondern eine **Kurzbefehl-Automation** auf dem iPhone, denn Safari kann kein Web NFC. Die Automation öffnet den Link der Dose (`#/tag/<dose-id>`), die App zeigt die Bohne und meldet den Scan an den Worker.

---

## Einrichtung

Die Einrichtung dauert einmalig etwa 20–30 Minuten. Eine ausführlichere Anleitung mit Fehlertabelle gibt es als Dokument im Projekt.

### 1. Token ausdenken

Der Token ist dein Passwort für die Daten. Du brauchst ihn an drei Stellen: bei Cloudflare, in der App und in den Kurzbefehlen.

- Nimm eine lange, zufällige Zeichenfolge **nur aus Buchstaben und Zahlen**, z. B. `k7Qm2vXp9LrT4wZb8NcY`.
- Leg den Token in deinem Passwortmanager ab.

### 2. Cloudflare Worker einrichten

1. Lege auf **dash.cloudflare.com** ein kostenloses Konto an, falls du noch keins hast.
2. **KV-Speicher:** *Storage & databases → Workers KV → Create instance*, Name `BeANKSY`.
3. **Worker:** *Workers & Pages → Create application → Start with Hello World!*, Name `kaffee-api`, dann **Deploy**.
4. **Code:** Im Worker auf **Edit code** tippen, alles löschen, den Inhalt von [`worker/worker.js`](https://raw.githubusercontent.com/buuuuuuuuuuuuuuuu/BeANKSY/main/worker/worker.js) einfügen und auf **Deploy** tippen.
5. **KV verbinden:** Worker → *Bindings → Add binding → KV namespace*, Variablenname `BeANKSY` (genau so geschrieben), Namespace `BeANKSY`.
6. **Token:** Worker → *Settings → Variables and Secrets → Add*, Typ **Secret**, Name `TOKEN`, als Wert dein Token.
7. **Test:** Öffne die Worker-Adresse, z. B. `https://kaffee-api.DEINNAME.workers.dev`. Dort muss **„BeANKSY-API läuft ☕“** stehen.

### 3. App auf GitHub Pages

Das Repository liegt hier: https://github.com/buuuuuuuuuuuuuuuu/BeANKSY. GitHub Pages ist unter *Settings → Pages* auf Branch `main`, Ordner `/ (root)` eingestellt. Jede Änderung auf `main` ist nach etwa einer Minute live.

### 4. App aufs iPhone holen und verbinden

1. Öffne die App-Adresse in **Safari**.
2. Tippe auf *Teilen → Zum Home-Bildschirm*. „Als Web-App öffnen“ bleibt **an**.
3. Starte die App vom Home-Bildschirm und tippe auf das **Zahnrad**.
4. Trag die Worker-Adresse und den Token ein. Tippe auf **Verbindung testen** und dann auf **Speichern & verbinden**. Der Punkt wird grün.

### 5. Dosen anlegen

Die Dosen müssen äußerlich nicht unterscheidbar sein. Welche Dose welche ist, weiß nur der NFC-Tag, und der Kurzbefehl dazu.

1. In der App auf **Dosen** tippen (das Funk-Symbol) und dann auf **+ Dose hinzufügen**. Der Name ist egal, z. B. „Dose 1“.
2. Das machst du für jede Dose, die einen Tag hat. Die Bohne füllst du später direkt aus der Dose heraus ein (siehe unten).

### 6. Kurzbefehl-Automation pro NFC-Tag

Das machst du **einmal pro Dose**, danach nie wieder. Nimm genau **eine** Dose in die Hand und richte sie komplett ein, bevor du die nächste nimmst.

1. In der App unter **Dosen** bei der Dose, die du einrichtest, auf **„Link für Kurzbefehl kopieren“** tippen.
2. Die App **Kurzbefehle** öffnen, unten auf **Automation** tippen, dann auf **+** (oben rechts) und **NFC**.
3. Auf **Scannen** tippen, das iPhone an die Dose in deiner Hand halten und den Tag benennen, z. B. „Dose 1“.
4. **„Sofort ausführen“** wählen und **„Bei Ausführung benachrichtigen“ ausschalten**. Dann auf **Weiter** tippen und **Neue leere Automation** wählen.
5. Die Aktion **„URLs öffnen“** hinzufügen und den kopierten Link einfügen. Er sieht so aus:
   `https://buuuuuuuuuuuuuuuu.github.io/BeANKSY/#/tag/dose-1?api=…&k=…`
6. Auf **Fertig** tippen und testen: Dose scannen, BeANKSY öffnet sich mit der aufgeklappten Kachel der Bohne in dieser Dose.

Mehr braucht es nicht. Die App zählt den Scan selbst beim Worker (Bezüge, große Kachel „Zuletzt gescannt“).

**Bohne in der Dose wechseln:** In der aufgeklappten Kachel auf **„Bohne in Dose 1 wechseln“** tippen. Dort tippst du eine andere Bohne an, legst mit **+ Neue Bohne in diese Dose** eine neue an oder markierst die alte als **aufgebraucht**. Ist eine gescannte Dose leer oder noch unbekannt, öffnet sich diese Auswahl direkt.

**Hast du die Automation schon mit „Inhalte von URL abrufen“ und „Mitteilung anzeigen“ eingerichtet?** Lösch diese beiden Aktionen und nimm nur noch „URLs öffnen“. Sonst wird jeder Scan doppelt gezählt. Die Mitteilungs-URL gibt es weiterhin (Dosen → „Mitteilungs-URL (optional)“), falls du irgendwo nur den Text brauchst.

**Gut zu wissen:** iOS öffnet den Link in Safari, nicht in der App auf dem Home-Bildschirm. Das ist kein Problem: Der Link bringt die Sync-Daten mit, Änderungen landen sofort im Worker, und die App auf dem Home-Bildschirm zeigt sie beim nächsten Öffnen. Der Link enthält deinen Token, behandle ihn wie ein Passwort.

**Hinweis zu deinen vorhandenen Tags:** Ist auf einem Tag schon eine URL gespeichert, bietet das iPhone zusätzlich an, diese URL zu öffnen. Wenn dich das stört, lösch den Tag mit der App *NFC Tools* (*Weitere → Tag löschen*). Die Automation braucht nur die ID des Tags, der Inhalt ist egal.

---

## Im Alltag

- **Neue Bohnen gekauft:** Tippe auf **+** und trag Name, Gramm und Mahlgrad ein. Unter *Weitere Angaben* findest du Röster, Röstdatum, Dose und Notiz.
- **Bohne finden:** Tipp ein paar Buchstaben ins Suchfeld, und die Liste zeigt nur noch passende Bohnen.
- **Sortieren:** Neueste, A–Z oder Häufigste. Häufigste zählt jeden NFC-Scan an einer Dose als einen Bezug der Bohne, die gerade darin ist.
- **Mahlgrad nachjustieren:** Bohne aufklappen und **− / +** nutzen. Genaue Werte trägst du über **Bearbeiten** ein.
- **Bohne leer:** Bohne aufklappen und auf **Aufgebraucht** tippen.
- **Neue Bohne in eine alte Dose:** Bohne anlegen und die Dose auswählen. Der Kurzbefehl bleibt gleich.

## Gut zu wissen

- **Token wechseln** (z. B. wenn ein Screenshot mit der URL herumging): Trag den neuen Token in Cloudflare unter `TOKEN` ein, dann in der App und in jeder Kurzbefehl-Automation.
- **Kosten:** Der Gratis-Tarif von Cloudflare reicht weit. Jeder NFC-Scan ist ein Lese- und ein Schreibzugriff (wegen des Zählers), jede Änderung in der App ein Schreibzugriff.
- **Icon oder Statusleiste nach einem Update unverändert:** Entferne die App vom Home-Bildschirm und füg sie neu hinzu. Mit eingerichtetem Sync bleiben die Daten erhalten.

## Für Änderungen am Code

- **Version hochzählen:** Bei jeder Änderung trägst du an drei Stellen dieselbe neue Nummer ein: `APP_VERSION` in `index.html`, `version.json` und `CACHE` in `sw.js` (z. B. `1.5` → `1.6`). Nur dann lädt das iPhone die neue Version und zeigt den Hinweis „Neu laden“.
- **Worker geändert?** Den neuen Code musst du von Hand bei Cloudflare einfügen (*Edit code → Deploy*). GitHub aktualisiert den Worker nicht automatisch.
- **Gespeichert im Browser** (`localStorage`): `beanksy.data` (Bohnen und Dosen), `beanksy.cfg` (Worker-Adresse und Token), `beanksy.uses` (Zähler), `beanksy.lastScan` (letzter Scan über den App-Link `#/tag/…`), `beanksy.sort`, `beanksy.theme`.

### Datenmodell

```json
{
  "version": 1,
  "updatedAt": 1763740000000,
  "beans": [{ "id": "…", "name": "Ethiopia Guji", "dose": 18, "grind": 12.5,
               "roaster": "", "roastDate": "2026-11-01", "notes": "",
               "archived": false, "createdAt": 1763740000000 }],
  "tags":  [{ "id": "dose-1", "label": "Dose 1", "beanId": "…" }]
}
```

Es wird immer der ganze Stand synchronisiert, der neuere `updatedAt` gewinnt. Die Bezüge liegen getrennt im KV-Schlüssel `uses` als `{ "<bohnen-id>": { "n": 12, "last": 1763740000000 }, "_last": { "tag": "dose-2", "bean": "<bohnen-id>", "at": 1763740000000 } }` (`_last` ist die zuletzt gescannte Dose für die große Kachel), damit der Sync sie nie überschreibt.

### Schnittstelle des Workers

Alle Aufrufe außer `GET /` brauchen den Token, entweder als Header `Authorization: Bearer <TOKEN>` oder als `?k=<TOKEN>`.

| Aufruf | Zweck |
|---|---|
| `GET /` | Funktionstest, ohne Token |
| `GET /data` | Alle Daten als JSON |
| `PUT /data` | Alle Daten speichern |
| `GET /n/<dose-id>` | Mitteilungstext (Name, Gramm, Mahlgrad), zählt den Scan als Bezug |
| `GET /uses` | Bezüge pro Bohne und zuletzt gescannte Dose |

## Versionen

| Version | Datum | Änderungen |
|---|---|---|
| 2.4 | 21.11.2026 | Scan landet direkt in der aufgeklappten Bohnen-Kachel, dort „Bohne in Dose wechseln“; Kurzbefehl braucht nur noch „URLs öffnen“, die App zählt den Scan selbst |
| 2.3 | 21.11.2026 | Dosen aus der Dose heraus verwalten: Kurzbefehl mit Menü „Passt / Dose bearbeiten“, App-Link pro Dose, Dosen-Ansicht nach dem Scan, unbekannte Dose direkt anlegen |
| 2.2 | 21.11.2026 | Große Kachel zeigt immer die zuletzt gescannte Dose (Worker merkt sich den letzten Scan, App lädt alle 20 s nach; neuer Worker-Code nötig) |
| 2.1 | 21.11.2026 | Schablonen-Logo im Header und (dunkel) oben rechts in der großen Kachel |
| 2.0 | 21.11.2026 | Neues App-Icon „Schablone“: gesprühte Kaffeebohne im Street-Art-Stil |
| 1.9 | 21.11.2026 | Skala: größere Grammzahl in den kleinen Kacheln |
| 1.8 | 21.11.2026 | Begrüßungszeile im dunklen Look entfernt |
| 1.7 | 21.11.2026 | Nachtröstung: kräftigere Ziffern und größere Grammzahl in den kleinen Kacheln |
| 1.6 | 21.11.2026 | Neues Design: „Skala“ (hell) und „Nachtröstung“ (dunkel), große Kachel für die zuletzt gescannte Bohne, Lineal bzw. Drehregler für den Mahlgrad |
| 1.5 | 21.11.2026 | Suchfeld mit Live-Filter |
| 1.4 | 21.11.2026 | Sortierung Neueste/A–Z/Häufigste, der Worker zählt NFC-Scans (neuer Worker-Code nötig) |
| 1.3 | 21.11.2026 | Versionsanzeige mit Hinweis „Neu laden“, Icon in Petrol |
| 1.2 | 21.11.2026 | Zwei Kacheln nebeneinander, Farbschema Graphit/Petrol hell und dunkel |
| 1.1 | 21.11.2026 | Umbenennung auf BeANKSY, KV-Bindung `BeANKSY` (neuer Worker-Code nötig) |
| 1.0 | 21.11.2026 | Erste Fassung: Bohnen, Dosen, Sync, NFC-Mitteilung, Backup |
