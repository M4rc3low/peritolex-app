import React from 'react';
import { Check, Circle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const WORKFLOW_STEPS = [
  { id: 'coleta_dados', label: 'Coleta de Dados', short: 'Coleta', color: 'bg-blue-500' },
  { id: 'analise_contabil', label: 'AnÃ¡lise ContÃ¡bil', short: 'AnÃ¡lise', color: 'bg-violet-500' },
  { id: 'redacao_laudo', label: 'RedaÃ§Ã£o do Laudo', short: 'RedaÃ§Ã£o', color: 'bg-amber-500' },
  { id: 'revisao', label: 'RevisÃ£o', short: 'RevisÃ£o', color: 'bg-orange-500' },
  { id: 'entrega', label: 'Entrega', short: 'Entrega', color: 'bg-emerald-500' },
];

export default function WorkflowStepper({ currentStep, onStepChange, readonly = false }) {
  const currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="w-full">
      {/* Desktop stepper */}
      <div className="hidden sm:flex items-center w-full">
        {WORKFLOW_STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;
          const isClickable = !readonly;

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => isClickable && onStepChange?.(step.id)}
                disabled={readonly}
                className={cn(
                  "flex flex-col items-center gap-1.5 group flex-1 min-w-0",
                  isClickable && "cursor-pointer"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all",
                  isCompleted && "bg-emerald-500 border-emerald-500 text-white",
                  isActive && "border-primary bg-primary text-primary-foreground scale-110 shadow-md shadow-primary/20",
                  !isCompleted && !isActive && "bg-muted border-border text-muted-foreground",
                  isClickable && !isCompleted && !isActive && "group-hover:border-primary/50"
                )}>
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-bold">{idx + 1}</span>
                  )}
                </div>
                <span className={cn(
                  "text-[11px] font-medium text-center leading-tight px-1",
                  isActive && "text-primary",
                  isCompleted && "text-emerald-600",
                  !isActive && !isCompleted && "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </button>
              {idx < WORKFLOW_STEPS.length - 1 && (
                <div className={cn(
                  "h-0.5 flex-1 mx-1 rounded-full transition-all",
                  idx < currentIndex ? "bg-emerald-400" : "bg-border"
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile stepper */}
      <div className="flex sm:hidden flex-col gap-2">
        {WORKFLOW_STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;
          return (
            <button
              key={step.id}
              onClick={() => !readonly && onStepChange?.(step.id)}
              disabled={readonly}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                isActive && "border-primary bg-primary/5",
                isCompleted && "border-emerald-200 bg-emerald-50",
                !isActive && !isCompleted && "border-border bg-card",
                !readonly && "cursor-pointer hover:border-primary/40"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                isCompleted && "bg-emerald-500 text-white",
                isActive && "bg-primary text-primary-foreground",
                !isCompleted && !isActive && "bg-muted text-muted-foreground"
              )}>
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : <span className="text-xs font-bold">{idx + 1}</span>}
              </div>
              <span className={cn(
                "text-sm font-medium",
                isActive && "text-primary",
                isCompleted && "text-emerald-700",
                !isActive && !isCompleted && "text-muted-foreground"
              )}>{step.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto text-primary" />}
            </button>
          );
        })}
      </div>

      {!readonly && (
        <div className="flex justify-between mt-4">
          <button
            onClick={() => {
              const prev = WORKFLOW_STEPS[currentIndex - 1];
              if (prev) onStepChange?.(prev.id);
            }}
            disabled={currentIndex === 0}
            className={cn(
              "text-xs text-muted-foreground hover:text-foreground transition-colors",
              currentIndex === 0 && "opacity-30 pointer-events-none"
            )}
          >
            â† Etapa anterior
          </button>
          <button
            onClick={() => {
              const next = WORKFLOW_STEPS[currentIndex + 1];
              if (next) onStepChange?.(next.id);
            }}
            disabled={currentIndex === WORKFLOW_STEPS.length - 1}
            className={cn(
              "text-xs text-primary hover:text-primary/80 font-medium transition-colors",
              currentIndex === WORKFLOW_STEPS.length - 1 && "opacity-30 pointer-events-none"
            )}
          >
            PrÃ³xima etapa â†’
          </button>
        </div>
      )}
    </div>
  );
}
