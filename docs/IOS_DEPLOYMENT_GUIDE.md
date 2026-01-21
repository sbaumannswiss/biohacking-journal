# iOS Deployment Guide (TestFlight)

## 1. Hardware Requirements (Mindestvoraussetzungen)

Um Apps für iOS zu entwickeln und bei Apple einzureichen, ist ein Mac zwingend erforderlich, da Xcode nur auf macOS läuft.

### Empfehlung: Gebrauchter Mac Mini
Für den kostengünstigsten Einstieg ist ein **Mac Mini mit Apple Silicon (M1)** die beste Wahl. 

*   **Modell:** Mac Mini M1 (2020) oder neuer (M2, M4).
*   **Prozessor:** **Apple Silicon M1** ist sehr wichtig. 
    *   *Vermeide Intel-Macs (Modelle vor 2020)*. Diese verlieren bald den Support für neue macOS/Xcode-Versionen und sind deutlich langsamer.
*   **RAM:** 
    *   **8 GB** ist das Minimum und funktioniert für dieses Projekt.
    *   **16 GB** ist *sehr empfehlenswert*, da Xcode viel Speicher braucht, aber für reine Builds reichen 8 GB.
*   **Speicher:** 
    *   **256 GB SSD** Minimum. Xcode allein benötigt ca. 40-50 GB inkl. Simulatoren.

**Fazit:** Ein gebrauchter **Mac Mini M1 (8GB/256GB)** ist das perfekte Einsteigergerät und bereits für ca. 300-400€ zu finden.

### Alternative: MacBook Air M1 (2020)
Falls du auch unterwegs arbeiten möchtest oder keinen Monitor/Tastatur übrig hast:
*   **Vorteil:** Hat Bildschirm, Tastatur, Trackpad inkludiert. Lautlos (kein Lüfter).
*   **Preis:** Gebraucht meist etwas teurer, ca. **450-600€**.
*   **Leistung:** Identisch zum Mac Mini M1. Perfekt geeignet.

### Die Profi-Wahl: MacBook Air M4 (2025)
Das von dir verlinkte Gerät (M4 Chip, 16GB RAM) ist deutlich leistungsstärker als die M1-Varianten.
*   **Vorteil:** Extrem zukunftssicher. Der M4 Chip kompiliert die App spürbar schneller. 16GB RAM sind optimal für Xcode.
*   **Nachteil:** Kostet deutlich mehr als die gebrauchten Varianten.
*   **Fazit:** Wenn das Budget es zulässt, ist das **die beste Wahl**. Es funktioniert nicht nur, es wird dir auch in 5 Jahren noch Freude machen.

### Was ist mit dem iPad Pro M1/M4?
**Nein, das reicht nicht.**
Obwohl iPads mit M1/M4 Chips sehr leistungsstark sind, läuft darauf **iPadOS** und nicht macOS.
*   **Kein vollwertiges Xcode:** iPad hat nur "Swift Playgrounds", das reicht nicht für unsere komplexe App-Architektur (Capacitor/Next.js).
*   **Kein Terminal/Node.js:** Du kannst keine NPM-Skripte (`npm run mobile:ios`) nativ auf iOS ausführen.
*   **Du brauchst zwingend einen Mac mit macOS.**

---

## 2. Apple Developer Account

*   Du musst dich beim [Apple Developer Program](https://developer.apple.com/programs/) registrieren.
*   **Kosten:** 99 USD (ca. 99 EUR) pro Jahr.
*   Dies ist zwingend erforderlich für TestFlight und den App Store.

---

## 3. Einrichtung auf dem Mac

Sobald du den Mac hast:

1.  **Xcode installieren:** Lade Xcode kostenlos aus dem Mac App Store.
2.  **Command Line Tools:** Öffne das Terminal und führe aus: `xcode-select --install`
3.  **Node.js & Git installieren:** Am besten via Homebrew (`brew.sh`) oder direkt von nodejs.org.
4.  **CocoaPods installieren:**
    ```bash
    sudo gem install cocoapods
    ```

---

## 4. Projekt Setup (Erstes Mal)

1.  Repository klonen:
    ```bash
    git clone <dein-repo-url>
    cd BiohackingJournal
    ```
2.  Abhängigkeiten installieren:
    ```bash
    npm install
    ```
3.  **WICHTIG:** Da der `ios` Ordner bisher nicht existiert, musst du ihn einmalig erstellen:
    ```bash
    npx cap add ios
    ```

---

## 5. Build & Upload Prozess

Wir haben bereits Skripte in der `package.json` vorbereitet.

### Schritt 1: Build & Sync
Führe auf dem Mac folgenden Befehl aus:

```bash
npm run mobile:ios
```

Dieser Befehl macht automatisch:
1.  Baut die Next.js App (`npm run build:mobile`)
2.  Synchronisiert die Assets in den nativen iOS-Ordner (`npx cap sync`)
3.  Öffnet Xcode (`npx cap open ios`)

### Schritt 2: Xcode Konfiguration (Einmalig)
In Xcode:
1.  Klicke links im Projekt-Navigator auf **App**.
2.  Wähle das Target **App** aus.
3.  Gehe zum Tab **Signing & Capabilities**.
4.  Bei **Team** wähle deinen Apple Developer Account aus.
5.  Ändere ggf. den **Bundle Identifier** (aktuell: `de.getstax.app`), falls dieser schon vergeben ist.

### Schritt 3: Upload zu TestFlight
1.  Wähle oben in der Leiste als Ziel **Any iOS Device (arm64)** aus (nicht einen Simulator!).
2.  Menu: **Product** -> **Archive**.
3.  Warte bis der Build fertig ist. Das "Organizer" Fenster öffnet sich.
4.  Klicke auf **Distribute App**.
5.  Wähle **TestFlight & App Store**.
6.  Folge den Anweisungen (meistens einfach "Next", "Next", "Upload").

Sobald der Upload fertig ist, dauert es ca. 10-30 Minuten, bis die App in [App Store Connect](https://appstoreconnect.apple.com) unter "TestFlight" erscheint. Von dort kannst du Tester einladen.
