'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * Schweizer DSG-konforme Datenschutzerklärung
 * Unterschiede zum EU-DSGVO werden hervorgehoben
 */
export default function PrivacyChPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold">Datenschutzerklärung (Schweiz)</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 prose prose-invert prose-sm">
        <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl mb-8">
          <p className="text-sm m-0">
            Diese Datenschutzerklärung entspricht dem revidierten Schweizer Datenschutzgesetz (revDSG), 
            gültig seit 1. September 2023.
          </p>
        </div>

        <p className="text-muted-foreground text-sm">
          Stand: Januar 2026
        </p>

        <h2>1. Verantwortliche Stelle</h2>
        <p>
          Verantwortlich für die Datenbearbeitung ist:
        </p>
        <p>
          [Ihr Unternehmen]<br />
          [Adresse]<br />
          [E-Mail für Datenschutzanfragen]
        </p>

        <h2>2. Welche Personendaten wir bearbeiten</h2>
        
        <h3>2.1 Kontodaten</h3>
        <ul>
          <li>E-Mail-Adresse (für Anmeldung)</li>
          <li>Verschlüsseltes Passwort</li>
        </ul>

        <h3>2.2 Besonders schützenswerte Personendaten (Gesundheitsdaten)</h3>
        <p>
          Mit Ihrer ausdrücklichen Einwilligung bearbeiten wir:
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
          <strong>Diese Daten werden auf Ihrem Gerät verschlüsselt</strong>, bevor sie auf 
          unseren Servern gespeichert werden.
        </p>

        <h2>3. Zweck der Bearbeitung</h2>
        <ul>
          <li><strong>Kontoverwaltung:</strong> Anmeldung und Authentifizierung</li>
          <li><strong>Personalisierte Empfehlungen:</strong> Optimierung Ihrer Supplement-Routine</li>
          <li><strong>KI-Coaching:</strong> Personalisierte Tipps durch "Helix"</li>
          <li><strong>Fortschrittsverfolgung:</strong> Visualisierung Ihrer Gesundheitstrends</li>
        </ul>

        <h2>4. Rechtsgrundlagen</h2>
        <p>
          Die Bearbeitung Ihrer Personendaten stützt sich auf:
        </p>
        <ul>
          <li><strong>Einwilligung (Art. 6 Abs. 6 DSG):</strong> 
            Für besonders schützenswerte Personendaten (Gesundheitsdaten)</li>
          <li><strong>Vertrag (Art. 6 Abs. 1 DSG):</strong> 
            Für die Bereitstellung der App-Funktionen</li>
        </ul>

        <h2>5. Bekanntgabe ins Ausland</h2>
        
        <h3>5.1 Hosting</h3>
        <p>
          Unsere Daten werden in <strong>Frankfurt, Deutschland</strong> gehostet. 
          Deutschland ist ein EU-Mitgliedstaat und verfügt über einen von der Schweiz 
          anerkannten angemessenen Datenschutz.
        </p>

        <h3>5.2 KI-Dienste (USA)</h3>
        <p>
          Für den KI-Assistenten nutzen wir OpenAI (USA). <strong>Es werden nur anonymisierte, 
          aggregierte Daten übermittelt</strong>. Die Übermittlung erfolgt auf Basis von 
          EU-Standardvertragsklauseln, die auch für die Schweiz als angemessen gelten.
        </p>

        <h2>6. Ihre Rechte</h2>
        <p>Nach dem revDSG haben Sie folgende Rechte:</p>
        
        <h3>6.1 Auskunftsrecht (Art. 25 DSG)</h3>
        <p>
          Sie können Auskunft darüber verlangen, ob und welche Personendaten wir über Sie bearbeiten.
        </p>

        <h3>6.2 Recht auf Datenherausgabe (Art. 28 DSG)</h3>
        <p>
          Sie können die Herausgabe Ihrer Daten in einem gängigen elektronischen Format verlangen.
          Diese Funktion finden Sie unter <strong>Profil → Meine Daten exportieren</strong>.
        </p>

        <h3>6.3 Recht auf Löschung (Art. 32 DSG)</h3>
        <p>
          Sie können die Löschung Ihrer Personendaten verlangen.
          Diese Funktion finden Sie unter <strong>Profil → Konto löschen</strong>.
        </p>

        <h3>6.4 Widerruf der Einwilligung</h3>
        <p>
          Sie können Ihre Einwilligung jederzeit widerrufen. Der Widerruf berührt die 
          Rechtmässigkeit der bis dahin erfolgten Bearbeitung nicht.
        </p>

        <h3>6.5 Beschwerderecht</h3>
        <p>
          Sie können Beschwerde beim Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) einreichen:
        </p>
        <p>
          EDÖB<br />
          Feldeggweg 1<br />
          3003 Bern<br />
          <a href="https://www.edoeb.admin.ch" className="text-primary">www.edoeb.admin.ch</a>
        </p>

        <h2>7. Datensicherheit</h2>
        <p>
          Wir treffen angemessene technische und organisatorische Massnahmen (Art. 8 DSG):
        </p>
        <ul>
          <li>TLS 1.3 Verschlüsselung für alle Datenübertragungen</li>
          <li>Client-seitige AES-256-GCM Verschlüsselung für Gesundheitsdaten</li>
          <li>Zugriffskontrollen und Audit-Logging</li>
          <li>Regelmässige Sicherheitsüberprüfungen</li>
        </ul>

        <h2>8. Aufbewahrungsdauer</h2>
        <p>
          Ihre Personendaten werden so lange aufbewahrt, wie es für die Zwecke, für die sie 
          erhoben wurden, erforderlich ist, oder solange Ihr Konto aktiv ist. Nach Kontolöschung 
          werden alle Daten innerhalb von 30 Tagen gelöscht.
        </p>

        <h2>9. Automatisierte Einzelentscheidungen</h2>
        <p>
          Die App trifft keine rechtlich bindenden Entscheidungen ausschliesslich auf Basis 
          automatisierter Datenbearbeitung. Alle Empfehlungen dienen nur der Information.
        </p>

        <h2>10. Kontakt</h2>
        <p>
          Bei Fragen zum Datenschutz:<br />
          <strong>[datenschutz@example.com]</strong>
        </p>

        <div className="mt-8 text-center">
          <Link href="/privacy" className="text-primary text-sm hover:underline">
            → EU/DSGVO-Version anzeigen
          </Link>
        </div>
      </main>
    </div>
  );
}
