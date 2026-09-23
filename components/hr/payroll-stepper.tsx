'use client';

import React from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Calculator,
  ShieldCheck,
  CheckCheck,
  Lock,
  Banknote,
  Archive,
  ChevronRight,
} from 'lucide-react';

export type PayrollStepId =
  | 'period'
  | 'validate'
  | 'calculate'
  | 'review'
  | 'approve'
  | 'finalize'
  | 'pay'
  | 'close';

export interface PayrollStepDef {
  id: PayrollStepId;
  label: string;
  stepNumber: number;
  icon: React.ElementType;
}

export const PAYROLL_STEPS: PayrollStepDef[] = [
  { id: 'period', label: 'Period', stepNumber: 1, icon: CalendarDays },
  { id: 'validate', label: 'Validate', stepNumber: 2, icon: CheckCircle2 },
  { id: 'calculate', label: 'Calculate', stepNumber: 3, icon: Calculator },
  { id: 'review', label: 'Review', stepNumber: 4, icon: ShieldCheck },
  { id: 'approve', label: 'Approve', stepNumber: 5, icon: CheckCheck },
  { id: 'finalize', label: 'Finalize', stepNumber: 6, icon: Lock },
  { id: 'pay', label: 'Pay', stepNumber: 7, icon: Banknote },
  { id: 'close', label: 'Close', stepNumber: 8, icon: Archive },
];

export function getStepNumberForStatus(status: string): number {
  const s = String(status || 'OPEN').toUpperCase();
  switch (s) {
    case 'OPEN':
      return 1;
    case 'CALCULATING':
    case 'CALCULATED':
      return 3;
    case 'REVIEW':
      return 4;
    case 'APPROVED':
      return 5;
    case 'FINALIZED':
      return 6;
    case 'PAID':
      return 7;
    case 'CLOSED':
      return 8;
    default:
      return 1;
  }
}

interface StepperProps {
  currentStatus: string;
  activeStep?: PayrollStepId;
  onStepClick?: (step: PayrollStepDef) => void;
  interactive?: boolean;
  className?: string;
}

export default function PayrollStepper({
  currentStatus,
  activeStep,
  onStepClick,
  interactive = false,
  className = '',
}: StepperProps) {
  const currentStepNumber = getStepNumberForStatus(currentStatus);

  const selectedStepNumber = activeStep
    ? PAYROLL_STEPS.find((s) => s.id === activeStep)?.stepNumber || currentStepNumber
    : currentStepNumber;

  return (
    <div className={`w-full bg-white rounded-2xl p-4 shadow-sm border border-[#DDE4EE] ${className}`}>
      {/* Desktop & Tablet horizontal stepper */}
      <div className="hidden md:flex items-center justify-between gap-1 overflow-x-auto pb-1">
        {PAYROLL_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = step.stepNumber < currentStepNumber;
          const isCurrentStatus = step.stepNumber === currentStepNumber;
          const isSelected = step.stepNumber === selectedStepNumber;
          const isLocked = step.stepNumber > currentStepNumber;

          const isClickable = interactive && onStepClick && step.stepNumber <= currentStepNumber;

          let badgeStyle = 'bg-[#F0F4F8] text-[#7A8FA6] border border-[#DDE4EE]';
          let textStyle = 'text-[#7A8FA6] font-medium';
          let iconStyle = 'text-[#7A8FA6]';

          if (isCompleted) {
            badgeStyle = 'bg-[#2ECC71]/15 text-[#187A42] border border-[#2ECC71]/30';
            textStyle = 'text-[#1A1A2E] font-bold';
            iconStyle = 'text-[#187A42]';
          } else if (isCurrentStatus || isSelected) {
            badgeStyle = 'bg-[#014582] text-white shadow-md shadow-[#014582]/20 border border-[#014582]';
            textStyle = 'text-[#014582] font-extrabold';
            iconStyle = 'text-white';
          }

          return (
            <React.Fragment key={step.id}>
              <div
                onClick={() => isClickable && onStepClick?.(step)}
                className={`flex-1 min-w-[100px] flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                  isClickable ? 'cursor-pointer hover:bg-[#F0F4F8]/80' : 'cursor-default'
                } ${isSelected ? 'bg-[#F0F4F8]/60' : ''}`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs transition-all ${badgeStyle}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-[#2ECC71]" />
                  ) : isLocked ? (
                    <Lock className="w-4 h-4 text-[#A0AEC0]" />
                  ) : (
                    <Icon className={`w-4 h-4 ${iconStyle}`} />
                  )}
                </div>
                <div className="text-center">
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-[#7A8FA6]">
                    Step {step.stepNumber}
                  </span>
                  <span className={`block text-xs truncate max-w-[90px] ${textStyle}`}>
                    {step.label}
                  </span>
                </div>
              </div>

              {idx < PAYROLL_STEPS.length - 1 && (
                <div className="flex items-center justify-center shrink-0 text-[#CBD5E1]">
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile compact stepper */}
      <div className="md:hidden flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-[#014582] text-white font-extrabold text-xs flex items-center justify-center">
            {selectedStepNumber}/8
          </span>
          <div>
            <p className="text-xs font-extrabold text-[#1A1A2E]">
              {PAYROLL_STEPS.find((s) => s.stepNumber === selectedStepNumber)?.label || 'Payroll Step'}
            </p>
            <p className="text-[10px] text-[#7A8FA6]">Status: {currentStatus}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {PAYROLL_STEPS.map((step) => {
            const isDone = step.stepNumber < currentStepNumber;
            const isCurrent = step.stepNumber === currentStepNumber;
            return (
              <span
                key={step.id}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  isDone
                    ? 'bg-[#2ECC71]'
                    : isCurrent
                    ? 'bg-[#014582] ring-2 ring-[#014582]/30 scale-110'
                    : 'bg-[#E2E8F0]'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
