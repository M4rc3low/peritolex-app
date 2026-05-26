import React from 'react';
import { format, differenceInDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, AlertTriangle, CheckCircle2, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const prioridadeConfig = {
  urgente: { color: "bg-red-100 text-red-700 border-red-200", label: "Urgente" },
  alta: { color: "bg-orange-100 text-orange-700 border-orange-200", label: "Alta" },
  media: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "MÃ©dia" },
  baixa: { color: "bg-green-100 text-green-700 border-green-200", label: "Baixa" },
};

export default function DeadlineTimeline({ deadlines }) {
  if (!deadlines || deadlines.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Nenhum prazo prÃ³ximo</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deadlines.slice(0, 6).map((deadline) => {
        const days = differenceInDays(new Date(deadline.data_prazo), new Date());
        const isOverdue = isPast(new Date(deadline.data_prazo)) && deadline.status !== 'concluido';
        const isDone = deadline.status === 'concluido';
        const config = prioridadeConfig[deadline.prioridade] || prioridadeConfig.media;

        return (
          <div
            key={deadline.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-all",
              isOverdue ? "bg-red-50/50 border-red-200/50" : 
              isDone ? "bg-green-50/50 border-green-200/50 opacity-60" : 
              "bg-card border-border/50 hover:border-border"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              isOverdue ? "bg-red-100" : isDone ? "bg-green-100" : "bg-primary/10"
            )}>
              {isOverdue ? (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              ) : isDone ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium truncate", isDone && "line-through")}>{deadline.titulo}</p>
              <p className="text-xs text-muted-foreground">
                {deadline.numero_processo && `Proc. ${deadline.numero_processo} Â· `}
                {format(new Date(deadline.data_prazo), "dd MMM yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-[10px]", config.color)}>
                {config.label}
              </Badge>
              <span className={cn(
                "text-xs font-semibold whitespace-nowrap",
                isOverdue ? "text-red-600" : days <= 3 ? "text-orange-600" : "text-muted-foreground"
              )}>
                {isDone ? "ConcluÃ­do" : isOverdue ? `${Math.abs(days)}d atrÃ¡s` : `${days}d`}
              </span>
              {!isDone && (
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`ðŸ“‹ *Prazo Processual*\n\n*${deadline.titulo}*\n${deadline.numero_processo ? `Processo: ${deadline.numero_processo}\n` : ''}Data: ${format(new Date(deadline.data_prazo), "dd/MM/yyyy", { locale: ptBR })}\nPrioridade: ${config.label}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-green-600 hover:bg-green-50 transition-colors"
                  title="Enviar via WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
