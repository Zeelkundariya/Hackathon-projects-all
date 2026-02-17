// frontend/components/RoleSelector.tsx
'use client';

interface RoleSelectorProps {
    selectedRole: string;
    onSelect: (role: string) => void;
}

export default function RoleSelector({ selectedRole, onSelect }: RoleSelectorProps) {
    const roles = [
        { id: 'freelancer', label: 'Freelancer', icon: '💻' },
        { id: 'founder', label: 'Startup Founder', icon: '🚀' },
        { id: 'student', label: 'Student', icon: '🎓' },
        { id: 'consumer', label: 'Consumer', icon: '🛒' },
        { id: 'individual', label: 'Just Me', icon: '👤' },
    ];

    return (
        <div className="mb-6 animate-in slide-in-from-top-4 duration-500">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
                Who are you? <span className="text-slate-400 font-normal">(AI adapts to your role)</span>
            </label>
            <div className="flex flex-wrap gap-3">
                {roles.map((role) => {
                    const isSelected = selectedRole === role.id;
                    return (
                        <button
                            key={role.id}
                            onClick={() => onSelect(role.id)}
                            className={`
                flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border
                ${isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}
              `}
                        >
                            <span>{role.icon}</span>
                            {role.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
