import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "STAX - Dein Performance Tracker",
  description: "Tracke deine Supplements, optimiere dein Timing und erreiche neue Levels. Die intelligente App für deine Performance.",
  openGraph: {
    title: "STAX - Dein Performance Tracker",
    description: "Tracke deine Supplements, optimiere dein Timing und erreiche neue Levels.",
    type: "website",
    url: "https://getstax.de",
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0f] overflow-auto">
      {children}
    </div>
  );
}
