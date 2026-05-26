import React, { useState } from 'react';
import { peritolexApi } from '@/api/peritolexClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, CheckCheck, RefreshCw, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function MovementsFeed({ processId, numeroProcesso }) {
  const queryClient = useQueryClient();
  const [showAll, setShowAll] = useState(false);

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['movements', processId],
    queryFn: () => processId
      ? peritolexApi.entities.ProcessMovement.filter({ process_id: processId }, '-data_movimento', 50)
      : Promise.resolve([]),
    enabled: !!processId,
  });

  const syncMutation = useMutation({
    mutationFn: () => peritolexApi.functions.invoke('monitorarAndamentos', {
      manual: true,
      process_id: processId,
    }),
    onSuccess: (res) => {
      const novos = res?.data?.total_novos_andamentos || 0;
      queryClient.invalidateQueries({ queryKey: ['movements', processId] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      if (novos > 0) {
        toast.success(`${novos} novo(s) andamento(s) importado(s)!`);
      } else {
        toast.info('Nenhum novo andamento encontrado.');
      }
    },
    onError: () => toast.error('Erro ao consultar andamentos.'),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = movements.filter(m => !m.lido);
      await Promise.all(unread.map(m => peritolexApi.entities.ProcessMovement.update(m.id, { lido: true, novo: false })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['movements', processId] }),
  });

  const unreadCount = movements.filter(m => !m.lido).length;
  const displayed = showAll ? movements : movements.slice(0, 8);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Andamentos Processuais</span>
          {unreadCount > 0 && (
            <Badge className="h-5 px-1.5 text-[10px] bg-primary">
              {unreadCount} novo{unreadCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost" size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              <CheckCheck className="w-3.5 h-3.5" /> Marcar como lido
            </Button>
          )}
          <Button
            variant="outline" size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <RefreshCw className="w-3.5 h-3.5" />}
            Sincronizar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground gap-2 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando andamentos...
        </div>
      ) : movements.length === 0 ? (
        <div className="border border-dashed rounded-xl p-6 text-center">
          <Activity className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum andamento registrado.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Clique em "Sincronizar" para buscar do Tribunal.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[13px] top-2 bottom-2 w-px bg-border" />
          <div className="space-y-1">
            {displayed.map((mov) => (
              <MovementItem key={mov.id} movement={mov} />
            ))}
          </div>
          {movements.length > 8 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-2 ml-7 flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", showAll && "rotate-90")} />
              {showAll ? 'Ver menos' : `Ver todos (${movements.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MovementItem({ movement }) {
  return (
    <div className={cn(
      "flex gap-3 pl-1 py-1.5 rounded-lg transition-colors",
      movement.novo && !movement.lido && "bg-primary/5"
    )}>
      <div className={cn(
        "w-[26px] h-[26px] rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5",
        movement.novo && !movement.lido
          ? "border-primary bg-primary/10"
          : "border-border bg-background"
      )}>
        <div className={cn(
          "w-2 h-2 rounded-full",
          movement.novo && !movement.lido ? "bg-primary" : "bg-muted-foreground/40"
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            "text-xs leading-snug",
            movement.novo && !movement.lido ? "font-semibold text-foreground" : "text-muted-foreground"
          )}>
            {movement.descricao}
          </p>
          {movement.novo && !movement.lido && (
            <span className="flex-shrink-0 text-[9px] font-bold text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded-full">
              Novo
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
          {movement.data_movimento
            ? format(parseISO(movement.data_movimento), "dd 'de' MMM 'de' yyyy", { locale: ptBR })
            : 'â€”'}
          {movement.tribunal && ` Â· ${movement.tribunal.toUpperCase()}`}
        </p>
      </div>
    </div>
  );
}
