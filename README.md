# Bohnen – Kaffee-PWA mit NFC-Mitteilung

**Ablauf:** iPhone an den NFC-Tag der Dose halten → Mitteilung zeigt sofort:

```
Ethiopia Guji
18 g · Mahlgrad 12,5
```

Röster, Röstdatum und Notiz siehst du in der App, wenn du die Bohne aufklappst.

**Inhalt des Pakets**

| Ordner | Was | Wohin |
|---|---|---|
| `pwa/` | Die App (HTML, Manifest, Service Worker, Icons) | GitHub Pages |
| `worker/worker.js` | Sync-Backend + Mitteilungstext | Cloudflare Workers (kostenlos) |

Die Einrichtung dauert einmalig etwa 20–30 Minuten.

---

## Schritt 1 – Token ausdenken

Der Token ist dein Passwort für die Daten. Er kommt an drei Stellen hin: Cloudflare, die App und die Kurzbefehle.

- Nimm eine lange, zufällige Zeichenfolge aus Buchstaben und Zahlen, **ohne Sonderzeichen**. Ein Beispiel für die Form: `k7Qm2vXp9LrT4wZb8NcY`
- Bequem geht das mit einem Passwortvorschlag deines Passwortmanagers. Leg den Token dort auch ab.

## Schritt 2 – Cloudflare Worker einrichten

1. Kostenloses Konto auf **dash.cloudflare.com** anlegen (falls noch nicht vorhanden).
2. **KV-Speicher anlegen:** Links unter *Storage & Databases → KV* auf **Create** tippen und den Namen `kaffee` vergeben.
3. **Worker anlegen:** *Workers & Pages → Create → Worker*, die Vorlage „Hello World“ wählen und den Namen `kaffee-api` vergeben. Dann auf **Deploy** tippen.
4. **Code einfügen:** Im Worker auf **Edit code** tippen. Den gesamten Inhalt löschen, `worker/worker.js` hineinkopieren und auf **Deploy** tippen.
5. **KV verbinden:** Worker → *Settings → Bindings → Add → KV namespace*
   - Variablenname: `KAFFEE` (genau so, in Großbuchstaben)
   - Namespace: `kaffee`
6. **Token hinterlegen:** Worker → *Settings → Variables and Secrets → Add*
   - Typ: **Secret**
   - Name: `TOKEN`
   - Wert: dein Token aus Schritt 1
7. **Test:** Die Worker-Adresse im Browser öffnen, z. B. `https://kaffee-api.DEINNAME.workers.dev`. Dort muss **„Kaffee-API läuft ☕“** stehen.

> Die Adresse des Workers steht oben auf seiner Übersichtsseite. Notier sie dir, du brauchst sie in Schritt 4.

## Schritt 3 – App auf GitHub Pages veröffentlichen

1. Auf GitHub ein neues Repository anlegen, z. B. `bohnen` (öffentlich).
2. *Add file → Upload files*: den **Inhalt** des Ordners `pwa/` hochladen, also `index.html`, `manifest.webmanifest`, `sw.js` und den Ordner `icons/`. Danach auf **Commit** tippen.
3. *Settings → Pages*: Unter *Source* „Deploy from a branch“ wählen, dann Branch `main` und Ordner `/ (root)`, und speichern.
4. Nach etwa einer Minute ist die App erreichbar unter `https://DEINNAME.github.io/bohnen/`.

## Schritt 4 – App aufs iPhone holen und verbinden

1. Die App-Adresse in **Safari** öffnen.
2. Auf *Teilen → Zum Home-Bildschirm* tippen. „Als Web-App öffnen“ bleibt **an**.
3. Die App vom Home-Bildschirm starten und auf **⚙ Einstellungen** tippen.
   - Worker-Adresse: `https://kaffee-api.DEINNAME.workers.dev`
   - Token: dein Token
   - Dann auf **Speichern & verbinden** tippen. Der Punkt neben der Überschrift wird grün.

## Schritt 5 – Dosen anlegen

1. In der App auf **Dosen** tippen (das Funk-Symbol) und dann auf **+ Dose hinzufügen**.
2. Für jeden NFC-Tag eine Dose anlegen, z. B. „Dose 1“, „Dose links“ oder „Decaf“.
3. Lege dann die Bohnen an (Schritt 7). Die Bohne wählst du im Formular unter *Weitere Angaben → Dose* oder direkt hier in der Dosen-Ansicht.

## Schritt 6 – Kurzbefehl-Automation pro Tag

Das machst du **einmal pro NFC-Tag**, danach nie wieder.

1. In der App unter **Dosen** bei der gewünschten Dose auf **„URL für Kurzbefehl kopieren“** tippen.
2. Die App **Kurzbefehle** öffnen und unten auf **Automation** tippen, dann auf **+** (oben rechts) und **NFC**.
3. Auf **Scannen** tippen, das iPhone an den Tag halten und ihn benennen, z. B. „Dose 1“.
4. **„Sofort ausführen“** wählen und **„Bei Ausführung benachrichtigen“ ausschalten**. Sonst kommt eine zweite Mitteilung. Dann auf **Weiter** tippen.
5. **Neue leere Automation** wählen.
6. Die Aktion **„Inhalte von URL abrufen“** hinzufügen. Als URL die kopierte URL einfügen, sie sieht so aus:
   `https://kaffee-api.DEINNAME.workers.dev/n/dose-1?k=DEINTOKEN`
7. Die Aktion **„Mitteilung anzeigen“** hinzufügen.
   - Text: die Variable **„Inhalte von URL“** einsetzen (blaue Variable aus Schritt 6)
   - Titel (über „Mehr anzeigen“): z. B. `☕`
8. Auf **Fertig** tippen und testen: iPhone an den Tag halten, die Mitteilung erscheint.

**Hinweis zu deinen vorhandenen Tags:** Ist auf einem Tag schon eine URL gespeichert, bietet das iPhone zusätzlich an, diese URL zu öffnen. Wenn dich das stört, lösch den Tag mit der App *NFC Tools* (*Weitere → Tag löschen*). Die Automation braucht nur die ID des Tags, der Inhalt ist egal.

## Schritt 7 – Alltag

- **Neue Bohnen gekauft:** Auf **+** tippen und Name, Gramm und Mahlgrad eintragen. Unter *Weitere Angaben* stehen Röster, Röstdatum, Dose und Notiz.
- **Bohne leer:** Bohne aufklappen und auf **Aufgebraucht** tippen. Sie wandert ins Archiv und die Dose ist wieder frei.
- **Mahlgrad nachjustieren:** Bohne aufklappen und **− / +** nutzen (Schritte von 0,5). Genaue Werte trägst du über **Bearbeiten** ein.
- **Neue Bohne in eine alte Dose:** Bohne anlegen und die Dose auswählen. Der Kurzbefehl bleibt gleich.

## Gut zu wissen

- **Offline:** Die App zeigt den zuletzt geladenen Stand auch ohne Netz. Änderungen werden hochgeladen, sobald wieder Netz da ist. Der Punkt ist gelb, solange etwas wartet, und rot bei einem Fehler. Für die Mitteilung braucht das iPhone Netz.
- **Backup:** Unter *Einstellungen → Exportieren* erzeugst du eine JSON-Datei, die du über *Importieren* wieder einspielen kannst.
- **Token wechseln** (z. B. wenn ein Screenshot mit URL herumging): Neuen Token in Cloudflare unter `TOKEN` eintragen, dann in der App unter Einstellungen und neu in jede Kurzbefehl-Automation.
- **App-Updates:** Nach Änderungen an den Dateien in `sw.js` die Zeile `const CACHE = 'bohnen-v1'` hochzählen (`v2`, `v3` …), damit das iPhone die neue Version lädt.
- **Kosten:** Der Free-Plan von Cloudflare reicht weit. Jeder NFC-Scan ist ein Lesezugriff, jede Änderung ein Schreibzugriff.

## Schnittstelle (für später)

| Aufruf | Zweck |
|---|---|
| `GET /` | Funktionstest, ohne Token |
| `GET /data` | Alle Daten als JSON |
| `PUT /data` | Alle Daten speichern |
| `GET /n/<dose-id>` | Mitteilungstext (Name, Gramm, Mahlgrad) |

Token als `Authorization: Bearer <TOKEN>` oder `?k=<TOKEN>`.
