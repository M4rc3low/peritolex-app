import React, { useState } from 'react';
import { peritolexApi } from '@/api/peritolexClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Bell, BellOff, Check, Trash2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import AlertForm from '@/components/alerts/AlertForm';

const TIPO_CONFIG = {
  prazo_vencendo: { label: 'Prazo Vencendo', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  prazo_vencido: { label: 'Prazo Vencido', color: 'bg-red-100 text-red-700 border-red-200' },
  audiencia: { label: 'AudiÃªncia', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  honorarios: { label: 'HonorÃ¡rios', color: 'bg-green-100 text-green-700 border-green-200' },
  geral: { label: 'Geral', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export default function Alerts() {
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState('nao_lidos');
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => peritolexApi.entities.Alert.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => peritolexApi.entities.Alert.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-unread'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => peritolexApi.entities.Alert.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-unread'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => peritolexApi.entities.Alert.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-unread'] });
    },
  });

  const markAllRead = () => {
    const unread = alerts.filter(a => !a.lido);
    unread.forEach(a => updateMutation.mutate({ id: a.id, data: { lido: true } }));
  };

  const filtered = alerts.filter(a => {
    if (tab === 'nao_lidos') return !a.lido;
    if (tab === 'lidos') return a.lido;
    return true;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Alertas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {alerts.filter(a => !a.lido).length} alertas nÃ£o lidos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
            <Check className="w-3.5 h-3.5" /> Marcar todos como lidos
          </Button>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Alerta
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="nao_lidos">NÃ£o Lidos</TabsTrigger>
          <TabsTrigger value="lidos">Lidos</TabsTrigger>
          <TabsTrigger value="todos">Todos</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-card rounded-xl border animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BellOff className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum alerta encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(alert => {
            const tipoConfig = TIPO_CONFIG[alert.tipo] || TIPO_CONFIG.geral;
            return (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-4 p-4 bg-card rounded-xl border transition-all",
                  !alert.lido && "border-primary/20 bg-primary/[0.02]"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                  !alert.lido ? "bg-primary/10" : "bg-muted"
                )}>
                  <Bell className={cn("w-4 h-4", !alert.lido ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={cn("text-sm font-medium", !alert.lido && "font-semibold")}>{alert.titulo}</p>
                    <Badge variant="outline" className={cn("text-[10px] border", tipoConfig.color)}>
                      {tipoConfig.label}
                    </Badge>
                    {alert.notificar_email && (
                      <Mail className="w-3 h-3 text-muted-foreground" title="NotificaÃ§Ã£o por e-mail ativa" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.mensagem}</p>
                  {alert.data_alerta && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Alerta: {format(new Date(alert.data_alerta), "dd/MM/yyyy 'Ã s' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {!alert.lido && (
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => updateMutation.mutate({ id: alert.id, data: { lido: true } })}
                      title="Marcar como lido"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => deleteMutation.mutate(alert.id)}
                    className="text-muted-foreground hover:text-destructive"
                    title="Excluir alerta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertForm 
        open={showForm} 
        onClose={() => setShowForm(false)} 
        onSubmit={createMutation.mutate} 
      />
    </div>
  );
}
