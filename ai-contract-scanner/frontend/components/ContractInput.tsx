// frontend/components/ContractInput.tsx
'use client';

interface ContractInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export default function ContractInput({ value, onChange, placeholder, rows = 12 }: ContractInputProps) {
  return (
    <div className="relative group">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full p-6 border-0 focus:ring-0 resize-none font-mono text-sm text-slate-700 bg-white placeholder:text-slate-400 leading-relaxed"
        spellCheck="false"
      />

      {/* Scroll shadow hint could go here but keeping it simple */}

      <div className="absolute bottom-4 right-4 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shadow-sm border ${value.length < 50
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
          {value.length < 50 ? 'Minimum 50 characters' : 'Ready to analyze'}
        </span>
      </div>
    </div>
  );
}