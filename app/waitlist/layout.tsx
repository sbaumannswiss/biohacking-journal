import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BioBoost - Waitlist",
  description: "Werde Teil der Biohacking-Revolution. Trage dich in die Warteliste ein!",
};

export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Full-width overlay that escapes the main app's mobile container
  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0f] overflow-auto">
      {children}
    </div>
  );
}

