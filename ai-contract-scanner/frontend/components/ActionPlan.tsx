// frontend/components/ActionPlan.tsx
'use client';

interface ActionPlanProps {
    score: number;
}

export default function ActionPlan({ score }: ActionPlanProps) {
    const getActionSteps = () => {
        if (score >= 7) {
            return [
                { icon: '🚨', text: 'Immediate Attention Required: Major revisions needed.', color: 'text-rose-700' },
                { icon: '⚖️', text: 'Consult Legal Counsel: Significant risks detected.', color: 'text-rose-700' },
                { icon: '📝', text: 'Redraft Indemnity: Terms are heavily one-sided.', color: 'text-rose-700' }
            ];
        } else if (score >= 4) {
            return [
                { icon: '⚠️', text: 'Negotiate Key Terms: Address highlighted risks.', color: 'text-amber-700' },
                { icon: '🔍', text: 'Review Payment Schedules for hidden fees.', color: 'text-amber-700' },
                { icon: '🔄', text: 'Check Renewal clauses for auto-opt-in.', color: 'text-amber-700' }
            ];
        } else {
            return [
                { icon: '✅', text: 'Good to Go: Terms are standard and balanced.', color: 'text-emerald-700' },
                { icon: '📄', text: 'Standard filing procedures recommended.', color: 'text-emerald-700' }
            ];
        }
    };

    const steps = getActionSteps();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 ring-1 ring-slate-200 overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-1 h-full ${score >= 7 ? 'bg-rose-500' : score >= 4 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>

            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-lg">🛡️</span> Strategic Action Plan
            </h3>

            <div className="space-y-3">
                {steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${i * 0.1}s` }}>
                        <span className="text-sm mt-0.5">{step.icon}</span>
                        <p className={`text-sm font-medium ${step.color} leading-tight`}>{step.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
