# Google Play Store Alpha Testing Checklist

## 1. Google Play Developer Account

- [ ] Account erstellen: https://play.google.com/console
- [ ] Einmalgebühr: $25 USD
- [ ] Entwicklerprofil verifizieren (kann 2-3 Tage dauern)

---

## 2. Keystore erstellen (Release-Signierung)

Führe folgenden Befehl im Terminal aus:

```bash
cd android
keytool -genkey -v -keystore release-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias stax
```

**Wichtig:**
- Passwort sicher speichern (Password Manager empfohlen)
- Keystore-Datei sicher aufbewahren (Backup!)
- Bei Verlust kannst du keine Updates mehr veröffentlichen

Nach Erstellung: `keystore.properties.example` nach `keystore.properties` kopieren und ausfüllen.

---

## 3. Store Listing Assets

### Pflicht:
- [ ] **App-Icon**: 512x512 px PNG (ohne Transparenz)
- [ ] **Feature Graphic**: 1024x500 px PNG/JPG
- [ ] **Screenshots**: Mindestens 2 pro Gerätetyp
  - Telefon: 16:9 oder 9:16 (min. 320px, max. 3840px)
  - 7-Zoll-Tablet: Optional
  - 10-Zoll-Tablet: Optional
- [ ] **Kurzbeschreibung**: Max. 80 Zeichen
- [ ] **Vollständige Beschreibung**: Max. 4000 Zeichen

### Optional aber empfohlen:
- [ ] Promo-Video (YouTube-Link)
- [ ] Tablet-Screenshots

---

## 4. App-Informationen

### Datenschutzerklärung (Pflicht!)
- [ ] Datenschutzerklärung erstellen
- [ ] Öffentlich zugängliche URL (z.B. auf Website, Notion, GitHub Pages)
- [ ] Muss HTTPS sein

### Content Rating
- [ ] IARC-Fragebogen ausfüllen (im Play Console)
- [ ] Typische Einstufung für Health-Apps: PEGI 3 / USK 0

### Kategorisierung
- [ ] Kategorie: Health & Fitness
- [ ] Inhaltstyp: App

---

## 5. Build & Upload

### Voraussetzungen:
- [ ] Android Studio installiert
- [ ] JDK 17+ installiert

### Build-Prozess:

```bash
# 1. Web-App für Mobile bauen
npm run build:mobile

# 2. Mit Android synchronisieren
npm run cap:sync

# 3. Android Studio öffnen
npm run cap:android
```

In Android Studio:
1. Build > Generate Signed Bundle / APK
2. Android App Bundle (AAB) wählen
3. Keystore auswählen (release-keystore.jks)
4. Release Build Type wählen
5. Build starten

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### Alternativ via Terminal:

```bash
npm run android:build-release
```

---

## 6. Play Console: App erstellen

1. Neue App erstellen
2. App-Details ausfüllen:
   - App-Name: STAX
   - Standardsprache: Deutsch / Englisch
   - App-Typ: App
   - Kostenlos/Kostenpflichtig

---

## 7. Internal Testing Track (Empfohlen für Alpha)

**Vorteile:**
- Sofortige Freigabe (kein Review)
- Bis zu 100 interne Tester
- Ideal für erste Tests

**Setup:**
1. Release > Testing > Internal Testing
2. "Create new release"
3. AAB-Datei hochladen
4. Tester-E-Mails hinzufügen
5. Release starten

---

## 8. Closed Testing Track (Alpha)

**Vorteile:**
- Größere Testergruppe möglich
- Opt-in Link für Tester
- Review durch Google (1-3 Tage)

**Setup:**
1. Release > Testing > Closed Testing
2. Track erstellen (z.B. "Alpha Testers")
3. AAB hochladen
4. Store Listing ausfüllen
5. Review anfordern

---

## 9. Vor dem Release prüfen

- [ ] App auf echtem Gerät getestet
- [ ] Alle Berechtigungen funktionieren (Health Connect)
- [ ] Deep Links funktionieren
- [ ] Keine Crashes beim Start
- [ ] Login/Auth funktioniert
- [ ] API-Verbindung zur Vercel-Instanz funktioniert

---

## 10. Nach dem Upload

- [ ] Pre-Launch Report in Play Console prüfen
- [ ] Tester einladen
- [ ] Feedback sammeln
- [ ] Crashlytics/Analytics einrichten (optional)

---

## Wichtige Links

- Play Console: https://play.google.com/console
- App Bundle Explorer: https://play.google.com/console/app-bundle-explorer
- Policy Center: https://play.google.com/about/developer-content-policy/
- Health Connect Docs: https://developer.android.com/health-and-fitness/guides

---

## Troubleshooting

### "App not installed" Fehler
- Debug-Version vorher deinstallieren (andere Signatur)

### Health Connect Permissions nicht sichtbar
- Health Connect App muss installiert sein
- Mindestens Android 14 oder Health Connect APK auf älteren Versionen

### AAB Upload fehlgeschlagen
- Prüfe versionCode (muss bei jedem Upload erhöht werden)
- Prüfe applicationId Konsistenz
