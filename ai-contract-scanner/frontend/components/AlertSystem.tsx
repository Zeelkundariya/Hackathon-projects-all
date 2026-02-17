// frontend/components/AlertSystem.tsx
'use client';

import { useState, useEffect } from 'react';

interface Alert {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  action?: string;
}

interface AlertSystemProps {
  risks: Array<{
    riskLevel: 'high' | 'medium' | 'low';
    category: string;
    explanation: string;
  }>;
  userProfile: {
    riskTolerance: string;
    role: string;
  };
}

export default function AlertSystem({ risks, userProfile }: AlertSystemProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const newAlerts: Alert[] = [];

    // High risk alerts
    const highRisks = risks.filter(r => r.riskLevel === 'high');
    if (highRisks.length > 0) {
      newAlerts.push({
        type: 'high_risk',
        severity: 'critical',
        message: `${highRisks.length} high-risk clauses detected`,
        action: 'Review immediately'
      });
    }

    // User-specific alerts
    if (userProfile.role === 'freelancer') {
      const freelancerRisks = risks.filter(r =>
        r.category && ['payment', 'termination', 'intellectualProperty'].includes(r.category)
      );
      if (freelancerRisks.length > 0) {
        newAlerts.push({
          type: 'freelancer_risk',
          severity: 'warning',
          message: `${freelancerRisks.length} clauses particularly risky for freelancers`,
          action: 'Pay special attention'
        });
      }
    }

    // Liability alerts
    const liabilityRisks = risks.filter(r => r.category === 'liability');
    if (liabilityRisks.length > 0) {
      newAlerts.push({
        type: 'liability',
        severity: 'warning',
        message: 'Liability clauses may expose you to financial risk',
        action: 'Consider liability caps'
      });
    }

    // Termination alerts
    const terminationRisks = risks.filter(r => r.category === 'termination');
    if (terminationRisks.length > 0) {
      newAlerts.push({
        type: 'termination',
        severity: 'warning',
        message: `${terminationRisks.length} termination clauses found`,
        action: 'Review termination terms'
      });
    }

    // If no alerts, add a positive one
    if (newAlerts.length === 0 && risks.length > 0) {
      newAlerts.push({
        type: 'no_critical',
        severity: 'info',
        message: 'No critical alerts found. Contract appears reasonable.',
        action: 'Continue with review'
      });
    }

    setAlerts(newAlerts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [risks, userProfile]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'warning': return '🟡';
      case 'info': return '🔵';
      default: return '⚪';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">🚨</span> Risk Alerts
      </h3>

      {alerts.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-gray-600">No critical alerts. Contract looks good!</p>
          <p className="text-sm text-gray-500 mt-2">
            {risks.length > 0
              ? `${risks.length} clauses analyzed`
              : 'Analyze a contract to see alerts'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start">
                <span className="text-xl mr-3">{getSeverityIcon(alert.severity)}</span>
                <div className="flex-1">
                  <div className="font-semibold mb-1">{alert.message}</div>
                  {alert.action && (
                    <div className="text-sm opacity-90 mt-2">
                      <span className="font-medium">Action:</span> {alert.action}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500">
        <p className="flex items-center">
          <span className="mr-2">ℹ️</span>
          Alerts are personalized based on your profile and risk tolerance.
        </p>
      </div>
    </div>
  );
}