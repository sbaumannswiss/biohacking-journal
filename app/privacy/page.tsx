'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold">Datenschutzerklärung</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 prose prose-invert prose-sm">
        <p className="text-muted-foreground text-sm">
          Stand: Januar 2026
        </p>

        <h2>1. Verantwortlicher</h2>
        <p>
          Verantwortlich für die Datenverarbeitung im Sinne der Datenschutz-Grundverordnung (DSGVO) 
          und des Schweizer Datenschutzgesetzes (DSG) ist:
        </p>
        <p>
          [Ihr Unternehmen]<br />
          [Adresse]<br />
          [E-Mail für Datenschutzanfragen]
        </p>

        <h2>2. Welche Daten wir erheben</h2>
        
        <h3>2.1 Kontodaten</h3>
        <ul>
          <li>E-Mail-Adresse (für Anmeldung)</li>
          <li>Verschlüsseltes Passwort</li>
        </ul>

        <h3>2.2 Gesundheitsdaten (besondere Kategorie nach Art. 9 DSGVO)</h3>
        <p>
          Mit Ihrer ausdrücklichen Einwilligung verarbeiten wir:
        </p>
        <ul>
          <li>Schlafqualität und -dauer</li>
          <li>Herzfrequenzvariabilität (HRV)</li>
          <li>Ruheherzfrequenz</li>
          <li>Schritte und Aktivitätsdaten</li>
          <li>Selbsteinschätzungen (Energie, Fokus, Stimmung)</li>
          <li>Supplement-Einnahmen</li>
        </ul>
        <p>
          <strong>Diese Daten werden clientseitig verschlüsselt</strong>, bevor sie auf unseren 
          Servern gespeichert werden. Wir haben keinen Zugriff auf die unverschlüsselten Daten.
        </p>

        <h3>2.3 Nutzungsdaten</h3>
        <ul>
          <li>Gerätetyp und Betriebssystem</li>
          <li>App-Nutzungsstatistiken (anonymisiert)</li>
        </ul>

        <h2>3. Zweck der Verarbeitung</h2>
        <ul>
          <li><strong>Kontoverwaltung:</strong> Anmeldung und Authentifizierung</li>
          <li><strong>Personalisierte Empfehlungen:</strong> Optimierung Ihrer Supplement-Routine basierend auf Ihren Daten</li>
          <li><strong>KI-Coaching:</strong> Personalisierte Tipps durch unseren Assistenten "Helix"</li>
          <li><strong>Fortschrittsverfolgung:</strong> Visualisierung Ihrer Gesundheitstrends</li>
        </ul>

        <h2>4. Rechtsgrundlage</h2>
        <ul>
          <li><strong>Einwilligung (Art. 6 Abs. 1 lit. a, Art. 9 Abs. 2 lit. a DSGVO):</strong> 
            Für die Verarbeitung von Gesundheitsdaten</li>
          <li><strong>Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO):</strong> 
            Für die Bereitstellung der App-Funktionen</li>
        </ul>

        <h2>5. Datenübermittlung an Dritte</h2>
        
        <h3>5.1 Hosting (Supabase)</h3>
        <p>
          Unsere Daten werden auf Servern in <strong>Frankfurt, Deutschland (EU)</strong> gehostet. 
          Supabase Inc. ist unser Auftragsverarbeiter mit entsprechendem Auftragsverarbeitungsvertrag (AVV).
        </p>

        <h3>5.2 KI-Dienste (OpenAI)</h3>
        <p>
          Für den KI-Assistenten "Helix" nutzen wir OpenAI. <strong>Es werden nur anonymisierte, 
          aggregierte Daten übermittelt</strong> (z.B. "Schlaftrend: verbessernd" statt exakter Werte).
          Keine personenbezogenen Daten verlassen unsere EU-Server.
        </p>

        <h3>5.3 Wearable-Verbindungen</h3>
        <p>
          Bei Verbindung mit Garmin, Whoop oder Oura werden Daten direkt von deren Servern abgerufen.
          Diese Anbieter haben eigene Datenschutzerklärungen.
        </p>

        <h2>6. Ihre Rechte</h2>
        <p>Sie haben folgende Rechte:</p>
        
        <h3>6.1 Auskunft (Art. 15 DSGVO)</h3>
        <p>Sie können jederzeit Auskunft über Ihre gespeicherten Daten verlangen.</p>

        <h3>6.2 Datenportabilität (Art. 20 DSGVO)</h3>
        <p>
          Sie können alle Ihre Daten im JSON- oder CSV-Format exportieren. 
          Diese Funktion finden Sie unter <strong>Profil → Meine Daten exportieren</strong>.
        </p>

        <h3>6.3 Löschung (Art. 17 DSGVO)</h3>
        <p>
          Sie können Ihr Konto und alle damit verbundenen Daten jederzeit löschen.
          Diese Funktion finden Sie unter <strong>Profil → Konto löschen</strong>.
        </p>

        <h3>6.4 Widerruf der Einwilligung</h3>
        <p>
          Sie können Ihre Einwilligung zur Verarbeitung von Gesundheitsdaten jederzeit widerrufen.
          Die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung bleibt davon unberührt.
        </p>

        <h3>6.5 Beschwerde</h3>
        <p>
          Sie haben das Recht, sich bei einer Aufsichtsbehörde zu beschweren:
        </p>
        <ul>
          <li><strong>Deutschland:</strong> Landesbeauftragte für Datenschutz Ihres Bundeslandes</li>
          <li><strong>Schweiz:</strong> Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter (EDÖB)</li>
        </ul>

        <h2>7. Datensicherheit</h2>
        <ul>
          <li>TLS 1.3 Verschlüsselung für alle Datenübertragungen</li>
          <li>Client-seitige AES-256-GCM Verschlüsselung für Gesundheitsdaten</li>
          <li>Regelmäßige Sicherheitsaudits</li>
          <li>Zugriffskontrollen und Audit-Logging</li>
        </ul>

        <h2>8. Speicherdauer</h2>
        <p>
          Ihre Daten werden gespeichert, solange Ihr Konto aktiv ist. Nach Löschung des Kontos 
          werden alle Daten innerhalb von 30 Tagen vollständig entfernt. Anonymisierte, 
          aggregierte Statistiken können für Produktverbesserungen aufbewahrt werden.
        </p>

        <h2>9. Cookies</h2>
        <p>
          Wir verwenden nur technisch notwendige Cookies für die Authentifizierung. 
          Es werden keine Tracking-Cookies oder Analyse-Tools von Drittanbietern eingesetzt.
        </p>

        <h2>10. Änderungen</h2>
        <p>
          Bei wesentlichen Änderungen dieser Datenschutzerklärung werden Sie per E-Mail 
          oder In-App-Benachrichtigung informiert.
        </p>

        <h2>11. Kontakt</h2>
        <p>
          Bei Fragen zum Datenschutz kontaktieren Sie uns unter:<br />
          <strong>hello@getstax.de</strong>
        </p>

        <div className="mt-12 p-4 bg-muted/30 rounded-xl">
          <p className="text-sm text-muted-foreground m-0">
            <strong>Schweiz-spezifisch:</strong> Diese Erklärung entspricht auch den Anforderungen 
            des revidierten Schweizer Datenschutzgesetzes (revDSG), das seit dem 1. September 2023 gilt.
            Der Serverstandort Frankfurt liegt innerhalb des EU-Datenschutzrahmens, für den die 
            Schweiz einen Angemessenheitsbeschluss anerkannt hat.
          </p>
        </div>
      </main>
    </div>
  );
}
