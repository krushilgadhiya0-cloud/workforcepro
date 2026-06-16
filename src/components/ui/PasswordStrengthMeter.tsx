import { Check, X } from 'lucide-react';
import type { PasswordStrength } from '../../utils/password';

interface Props {
  strength: PasswordStrength;
  showRequirements?: boolean;
}

export function PasswordStrengthMeter({ strength, showRequirements = true }: Props) {
  if (strength.score === 0 && !showRequirements) return null;

  return (
    <div className="space-y-3 mt-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 flex gap-1 h-1.5">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`flex-1 rounded-full transition-all duration-500 ${
                step <= strength.score ? strength.color : 'bg-[var(--border)]/30'
              }`}
            />
          ))}
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${
          strength.score <= 1 ? 'text-red-500' : 
          strength.score === 2 ? 'text-orange-500' : 
          strength.score === 3 ? 'text-yellow-600 dark:text-yellow-400' : 
          'text-green-500'
        }`}>
          {strength.label}
        </span>
      </div>

      {showRequirements && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
          {strength.requirements.map((req) => (
            <div key={req.id} className="flex items-center gap-1.5">
              <div className={`shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${
                req.met ? 'bg-green-500/20 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {req.met ? <Check size={10} strokeWidth={4} /> : <X size={10} strokeWidth={4} />}
              </div>
              <span className={`text-[10px] font-medium transition-colors ${
                req.met ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'
              }`}>
                {req.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
