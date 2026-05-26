import React, { useState } from 'react';
import { peritolexApi } from '@/api/peritolexClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Clock, CheckCircle2, AlertTriangle, Search, MessageCircle, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import DeadlineForm from '@/components/deadlines/DeadlineForm';
import DeadlineCsvImport from '@/components/deadlines/DeadlineCsvImport';

const PRIORIDADE_CONFIG = {
  urgente: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Urgente' },
  alta: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Alta' },
  media: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'MÃ©dia' },
  baixa: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Baixa' },
};

const TIPO_LABELS = {
  entrega_laudo: 'Entrega de Laudo',
  manifestacao: 'ManifestaÃ§Ã£o',
  diligencia: 'DiligÃªncia',
  audiencia: 'AudiÃªncia',
  levantamento_honorarios: 'Levant. HonorÃ¡rios',
  outro: 'Outro',
};

export default function Deadlines() {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState(null);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('pendente');
  const queryClient = useQueryClient();

  const { data: deadlines = [], isLoading } = useQuery({
    queryKey: ['deadlines'],
    queryFn: () => peritolexApi.entities.Deadline.list('-data_prazo', 200),
  });

  const { data: processes = [] } = useQuery({
    queryKey: ['processes'],
    queryFn: () => peritolexApi.entities.Process.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => peritolexApi.entities.Deadline.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => peritolexApi.entities.Deadline.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      setEditingDeadline(null);
    },
  });

  const toggleComplete = (deadline) => {
    const newStatus = deadline.status === 'concluido' ? 'pendente' : 'concluido';
    updateMutation.mutate({ id: deadline.id, data: { status: newStatus } });
  };

  const filtered = deadlines.filter(d => {
    const matchSearch = !search || d.titulo?.toLowerCase().includes(search.toLowerCase()) || d.numero_processo?.toLowerCase().includes(search.toLowerCase());
    if (statusTab === 'pendente') return matchSearch && d.status !== 'concluido';
    if (statusTab === 'concluido') return matchSearch && d.status === 'concluido';
    if (statusTab === 'atrasado') return matchSearch && d.status !== 'concluido' && isPast(new Date(d.data_prazo));
    return matchSearch;
  }).sort((a, b) => new Date(a.data_prazo) - new Date(b.data_prazo));

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Prazos</h1>
          <p className="text-sm text-muted-foreground mt-1">Controle de prazos processuais</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImport(true)} className="gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Importar
          </Button>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Prazo
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar prazos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Tabs value={statusTab} onValueChange={setStatusTab}>
          <TabsList>
            <TabsTrigger value="pendente">Pendentes</TabsTrigger>
            <TabsTrigger value="atrasado">Atrasados</TabsTrigger>
            <TabsTrigger value="concluido">ConcluÃ­dos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => <div key={i} className="h-16 bg-card rounded-xl border animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum prazo encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(deadline => {
            const isOverdue = isPast(new Date(deadline.data_prazo)) && deadline.status !== 'concluido';
            const isDone = deadline.status === 'concluido';
            const config = PRIORIDADE_CONFIG[deadline.prioridade] || PRIORIDADE_CONFIG.media;

            return (
              <div
                key={deadline.id}
                className={cn(
                  "flex items-center gap-4 p-4 bg-card rounded-xl border transition-all hover:shadow-sm cursor-pointer",
                  isOverdue && "border-red-200/50 bg-red-50/30",
                  isDone && "opacity-60"
                )}
                onClick={() => setEditingDeadline(deadline)}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); toggleComplete(deadline); }}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                    isDone ? "bg-green-100 border-green-400" : isOverdue ? "border-red-300 hover:bg-red-50" : "border-border hover:bg-muted"
                  )}
                >
                  {isDone && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  {isOverdue && !isDone && <AlertTriangle className="w-4 h-4 text-red-500" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", isDone && "line-through")}>{deadline.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {deadline.numero_processo && `Proc. ${deadline.numero_processo} Â· `}
                    {TIPO_LABELS[deadline.tipo] || deadline.tipo} Â· {format(new Date(deadline.data_prazo), "dd MMM yyyy", { locale: ptBR })}
                  </p>
                </div>
                <Badge variant="outline" className={cn("text-[10px] border", config.color)}>
                  {config.label}
                </Badge>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`ðŸ“‹ *Prazo Processual*\n\n*${deadline.titulo}*\n${deadline.numero_processo ? `Processo: ${deadline.numero_processo}\n` : ''}Tipo: ${TIPO_LABELS[deadline.tipo] || deadline.tipo}\nData: ${format(new Date(deadline.data_prazo), "dd/MM/yyyy", { locale: ptBR })}\nPrioridade: ${config.label}${deadline.descricao ? `\n\n${deadline.descricao}` : ''}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                  title="Enviar via WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
            );
          })}
        </div>
      )}

      <DeadlineForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={createMutation.mutate}
        processes={processes}
      />

      <DeadlineCsvImport
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={() => { queryClient.invalidateQueries({ queryKey: ['deadlines'] }); setShowImport(false); }}
      />

      {editingDeadline && (
        <DeadlineForm
          open={!!editingDeadline}
          onClose={() => setEditingDeadline(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editingDeadline.id, data })}
          initialData={editingDeadline}
          processes={processes}
        />
      )}
    </div>
  );
}
