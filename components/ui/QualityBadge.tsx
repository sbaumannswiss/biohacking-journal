'use client';

import { motion } from 'framer-motion';
import { Shield, Leaf, FlaskConical, Award, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  CERTIFICATIONS,
  CertificationType,
  QualityAnalysis,
  getBioavailabilityColor,
  getBioavailabilityLabel,
} from '@/lib/agent/qualityAnalysisService';

interface QualityBadgeProps {
  analysis: QualityAnalysis;
  compact?: boolean;
}

// Icons für Zertifizierungen
const CERT_ICONS: Record<CertificationType, React.ReactNode> = {
  NSF: <Shield size={14} />,
  USP: <Award size={14} />,
  GMP: <FlaskConical size={14} />,
  INFORMED_SPORT: <Shield size={14} />,
  ORGANIC: <Leaf size={14} />,
  VEGAN: <Leaf size={14} />,
  NON_GMO: <Leaf size={14} />,
};

// Farben für Zertifizierungen
const CERT_COLORS: Record<CertificationType, string> = {
  NSF: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  USP: 'bg-green-500/20 text-green-400 border-green-500/30',
  GMP: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  INFORMED_SPORT: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  ORGANIC: 'bg-green-500/20 text-green-400 border-green-500/30',
  VEGAN: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  NON_GMO: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export function QualityBadge({ analysis, compact = false }: QualityBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const hasCertifications = analysis.certifications.detected.length > 0;
  const hasFormAnalysis = analysis.ingredientForm !== null;
  
  if (!hasCertifications && !hasFormAnalysis) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {/* Zertifizierungen */}
        {analysis.certifications.detected.map((cert) => (
          <span
            key={cert}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
              CERT_COLORS[cert]
            )}
            title={CERTIFICATIONS[cert].description}
          >
            {CERT_ICONS[cert]}
            {cert}
          </span>
        ))}
        
        {/* Bioverfügbarkeit */}
        {hasFormAnalysis && analysis.ingredientForm && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
              getBioavailabilityColor(analysis.ingredientForm.bioavailability)
            )}
            title={analysis.ingredientForm.reasoning}
          >
            Bio: {getBioavailabilityLabel(analysis.ingredientForm.bioavailability)}
          </span>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FlaskConical size={16} className="text-primary" />
          <span className="text-sm font-medium text-foreground">Qualitätsanalyse</span>
        </div>
        {showDetails ? (
          <ChevronUp size={16} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={16} className="text-muted-foreground" />
        )}
      </button>

      {/* Badges (immer sichtbar) */}
      <div className="px-3 pb-3 flex flex-wrap gap-1.5">
        {/* Zertifizierungen */}
        {analysis.certifications.detected.map((cert) => (
          <span
            key={cert}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border",
              CERT_COLORS[cert]
            )}
          >
            {CERT_ICONS[cert]}
            {CERTIFICATIONS[cert].name}
          </span>
        ))}
        
        {/* Bioverfügbarkeit Badge */}
        {hasFormAnalysis && analysis.ingredientForm && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border",
              getBioavailabilityColor(analysis.ingredientForm.bioavailability)
            )}
          >
            Bioverfügbarkeit: {getBioavailabilityLabel(analysis.ingredientForm.bioavailability)}
          </span>
        )}
        
        {/* Keine Infos */}
        {!hasCertifications && !hasFormAnalysis && (
          <span className="text-xs text-muted-foreground">
            Keine Qualitätsinformationen erkannt
          </span>
        )}
      </div>

      {/* Details (aufklappbar) */}
      {showDetails && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-white/10"
        >
          {/* Zertifizierungs-Details */}
          {hasCertifications && (
            <div className="p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Zertifizierungen
              </p>
              {analysis.certifications.detected.map((cert) => (
                <div key={cert} className="flex items-start gap-2">
                  <div className={cn("p-1 rounded", CERT_COLORS[cert])}>
                    {CERT_ICONS[cert]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {CERTIFICATIONS[cert].name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {CERTIFICATIONS[cert].description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form-Analyse Details */}
          {hasFormAnalysis && analysis.ingredientForm && (
            <div className={cn("p-3 space-y-2", hasCertifications && "border-t border-white/10")}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Inhaltsstoff-Form
              </p>
              <div className="space-y-1">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{analysis.ingredientForm.ingredient}:</span>{' '}
                  {analysis.ingredientForm.form}
                </p>
                <p className="text-xs text-muted-foreground">
                  {analysis.ingredientForm.reasoning}
                </p>
                {analysis.ingredientForm.betterAlternatives && analysis.ingredientForm.betterAlternatives.length > 0 && (
                  <p className="text-xs text-yellow-400">
                    Bessere Alternativen: {analysis.ingredientForm.betterAlternatives.join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="p-3 bg-white/5 border-t border-white/10">
            <div className="flex items-start gap-2">
              <Info size={12} className="text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {analysis.disclaimer}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Kompakte Inline-Badges für Listen
 */
export function QualityBadgesInline({ 
  certifications, 
  bioavailability 
}: { 
  certifications?: CertificationType[];
  bioavailability?: 'low' | 'medium' | 'high';
}) {
  if (!certifications?.length && !bioavailability) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {certifications?.map((cert) => (
        <span
          key={cert}
          className={cn(
            "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium border",
            CERT_COLORS[cert]
          )}
        >
          {cert}
        </span>
      ))}
      {bioavailability && (
        <span
          className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border",
            getBioavailabilityColor(bioavailability)
          )}
        >
          Bio: {getBioavailabilityLabel(bioavailability)}
        </span>
      )}
    </div>
  );
}
