import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowRight, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  aguardando_pericia: { label: 'Aguard. PerÃ­cia', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  pericia_realizada: { label: 'PerÃ­cia Realizada', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  laudo_entregue: { label: 'Laudo Entregue', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  encerrado: { label: 'Encerrado', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  suspenso: { label: 'Suspenso', color: 'bg-red-100 text-red-700 border-red-200' },
};

const HONORARIOS_CONFIG = {
  pendente: { label: 'Pendente', color: 'text-orange-600' },
  depositado: { label: 'Depositado', color: 'text-blue-600' },
  levantado: { label: 'Levantado', color: 'text-green-600' },
};

export default function ProcessCard({ process }) {
  const statusConfig = STATUS_CONFIG[process.status] || STATUS_CONFIG.em_andamento;
  const honConfig = HONORARIOS_CONFIG[process.honorarios_status] || HONORARIOS_CONFIG.pendente;

  return (
    <Link
      to={`/processos/${process.id}`}
      className="block bg-card rounded-xl border border-border/50 p-5 hover:shadow-md hover:border-border transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-mono">{process.numero_processo}</p>
            <p className="text-sm font-semibold mt-0.5">{process.tipo_acao || 'Processo'}</p>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-[10px] border", statusConfig.color)}>
          {statusConfig.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Autor</p>
          <p className="text-xs font-medium truncate">{process.autor}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">RÃ©u</p>
          <p className="text-xs font-medium truncate">{process.reu}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        {process.honorarios ? (
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold">
              R$ {process.honorarios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className={cn("text-[10px]", honConfig.color)}>({honConfig.label})</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Sem honorÃ¡rios</span>
        )}
        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      {process.responsavel_nome && (
        <p className="text-[10px] text-muted-foreground mt-2 truncate">ðŸ‘¤ {process.responsavel_nome}</p>
      )}
    </Link>
  );
}
