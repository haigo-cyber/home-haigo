# ToDo-App – Deploy

## Dateien ins Repo
Diese 5 Dateien in den **Wurzelordner** des Repos `home-haigo` legen (die Test-`index.html` wird überschrieben):

- `index.html`
- `manifest.webmanifest`
- `sw.js`
- `icon-192.png`
- `icon-512.png`

```
git add index.html manifest.webmanifest sw.js icon-192.png icon-512.png
git commit -m "ToDo-App v1"
git push
```

Nach ~1 Min live unter: **https://haigo-cyber.github.io/home-haigo/**

## Verifizieren (Schicht für Schicht)
1. **Seite lädt** → App-Hülle erscheint, Button „Mit Google anmelden".
2. **Anmelden** → Google-Login. Einmalig „nicht verifiziert" → *Erweitert → fortfahren*. Berechtigungen (Tabellen, Kalender, Drive) bestätigen.
3. **Tabelle entsteht** → unter *Konto → Google-Tabelle → Im Browser öffnen* prüfen: zwei Tabs „Tasks" und „Log" mit Kopfzeile.
4. **Aufgabe anlegen** → z. B. eine Pflichtaufgabe „täglich". Erscheint sie als Zeile in „Tasks"? (= Schreib-Sync ok)
5. **Kalender** → Sync-Schalter war an → Termin taucht im Google Calendar auf (ggf. Kalender neu laden).
6. **Abhaken** → unter „Heute" abhaken → Zeile in Tab „Log".

Wenn eine Schicht klemmt: sag **welche Nummer** + ggf. die Browser-Konsole (F12 → Console, rote Zeile). Dann ist der Fehler eng eingegrenzt.

## Datenmodell (für das Bearbeiten direkt in der Tabelle)
**Tasks:** `id · type · title · scheduleType · startDate · weekday · syncCalendar · calendarEventId · notes · createdAt · archived`
- `type`: `habit` | `duty` | `todo` | `goal`
- `scheduleType`: duty → `daily`/`every2days`/`weekly`; todo → `once`/`weekly`; habit/goal → `daily`
- `startDate`: `JJJJ-MM-TT`
- `syncCalendar`/`archived`: `true`/`false`
- `calendarEventId` **nicht** von Hand ändern (Verknüpfung zum Kalendertermin).

In der App danach *Konto → Neu laden*, damit Browser-Änderungen einfließen.

## Hinweise
- **Tages-Ziele** (Tab „Ziele", 🎯): bis zu 4 Stück, Abhaken pro Tag, Tortendiagramm zeigt den heutigen Anteil. Reset erfolgt automatisch beim Tageswechsel (Datumsbindung) — kein Termin im Kalender.
- Token läuft nach ~1 h ab; die App holt still ein neues, gelegentlich erscheint der Login erneut.
- Bearbeiten in der App schreibt den **ganzen** Tasks-/Log-Bereich neu — eigene Spalten rechts daneben würden überschrieben. Eigene Notizen ggf. in einen dritten Tab.
- „Zum Startbildschirm hinzufügen" (Chrome auf Android, Menü ⋮) installiert die App als Icon.
