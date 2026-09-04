import React, { useState, useMemo } from 'react';
import { peritolexApi } from '@/api/peritolexClient';
import { useQuery } from '@tanstack/react-query';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, eachDayOfInterval, isSameMonth, isSameDay,
  isToday, parseISO, differenceInDays, addDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, AlertTriangle, Clock, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const TIPO_LABELS = {
  entrega_laudo: 'Laudo',
  manifestacao: 'ManifestaÃ§Ã£o',
  diligencia: 'DiligÃªncia',
  audiencia: 'AudiÃªncia',
  levantamento_honorarios: 'HonorÃ¡rios',
  outro: 'Outro',
};

const TIPO_COLORS = {
  entrega_laudo: 'bg-purple-500',
  manifestacao: 'bg-blue-500',
  diligencia: 'bg-amber-500',
  audiencia: 'bg-rose-500',
  levantamento_honorarios: 'bg-emerald-500',
  outro: 'bg-gray-400',
};

const PRIORIDADE_COLORS = {
  urgente: 'border-l-red-500',
  alta: 'border-l-orange-400',
  media: 'border-l-amber-400',
  baixa: 'border-l-blue-300',
};

export default function Agenda() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [processFilter, setProcessFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('all');

  const { data: deadlines = [] } = useQuery({
    queryKey: ['deadlines-all'],
    queryFn: () => peritolexApi.entities.Deadline.list('-data_prazo', 500),
  });

  const { data: processes = [] } = useQuery({
    queryKey: ['processes'],
    queryFn: () => peritolexApi.entities.Process.list('-created_date', 200),
  });

  const today = new Date();
  const in3Days = addDays(today, 3);

  const filteredDeadlines = useMemo(() => {
    return deadlines.filter(d => {
      if (processFilter !== 'all' && d.process_id !== processFilter) return false;
      if (tipoFilter !== 'all' && d.tipo !== tipoFilter) return false;
      return true;
    });
  }, [deadlines, processFilter, tipoFilter]);

  const urgentDeadlines = useMemo(() => {
    return filteredDeadlines.filter(d => {
      if (d.status === 'concluido') return false;
      try {
        const dt = parseISO(d.data_prazo);
        const diff = differenceInDays(dt, today);
        return diff >= 0 && diff <= 3;
      } catch { return false; }
    });
  }, [filteredDeadlines]);

  const overdueDeadlines = useMemo(() => {
    return filteredDeadlines.filter(d => {
      if (d.status === 'concluido') return false;
      try {
        const diff = differenceInDays(parseISO(d.data_prazo), today);
        return diff < 0;
      } catch { return false; }
    });
  }, [filteredDeadlines]);

  // Build a map: date string -> deadlines[]
  const deadlineMap = useMemo(() => {
    const map = {};
    filteredDeadlines.forEach(d => {
      if (!d.data_prazo) return;
      const key = d.data_prazo.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(d);
    });
    return map;
  }, [filteredDeadlines]);

  // Calendar grid days
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const selectedDayDeadlines = selectedDay
    ? (deadlineMap[format(selectedDay, 'yyyy-MM-dd')] || [])
    : [];

  const getDayStatus = (day) => {
    const key = format(day, 'yyyy-MM-dd');
    const items = deadlineMap[key] || [];
    if (!items.length) return null;
    const hasOverdue = items.some(d => d.status !== 'concluido' && differenceInDays(day, today) < 0);
    const hasUrgent = items.some(d => d.status !== 'concluido' && differenceInDays(day, today) >= 0 && differenceInDays(day, today) <= 3);
    if (hasOverdue) return 'overdue';
    if (hasUrgent) return 'urgent';
    return 'normal';
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold">Agenda</h1>
        <p className="text-sm text-muted-foreground mt-1">{deadlines.length} prazos cadastrados</p>
      </div>

      {/* Urgent alerts */}
      {(urgentDeadlines.length > 0 || overdueDeadlines.length > 0) && (
        <div className="space-y-2">
          {overdueDeadlines.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-destructive">
                  {overdueDeadlines.length} prazo{overdueDeadlines.length > 1 ? 's' : ''} vencido{overdueDeadlines.length > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-destructive/80 mt-0.5">
                  {overdueDeadlines.slice(0, 3).map(d => d.titulo).join(', ')}
                  {overdueDeadlines.length > 3 ? ` e mais ${overdueDeadlines.length - 3}...` : ''}
                </p>
              </div>
            </div>
          )}
          {urgentDeadlines.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-700">
                  {urgentDeadlines.length} prazo{urgentDeadlines.length > 1 ? 's' : ''} vencendo nos prÃ³ximos 3 dias
                </p>
                <p className="text-xs text-amber-600/80 mt-0.5">
                  {urgentDeadlines.slice(0, 3).map(d => `${d.titulo} (${format(parseISO(d.data_prazo), 'dd/MM')})`).join(', ')}
                  {urgentDeadlines.length > 3 ? ` e mais ${urgentDeadlines.length - 3}...` : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={processFilter} onValueChange={setProcessFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Filtrar por processo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os processos</SelectItem>
            {processes.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.numero_processo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tipo de prazo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(TIPO_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(processFilter !== 'all' || tipoFilter !== 'all') && (
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs"
            onClick={() => { setProcessFilter('all'); setTipoFilter('all'); }}>
            <X className="w-3.5 h-3.5" /> Limpar filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-lg capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-xs px-2"
                  onClick={() => setCurrentMonth(new Date())}>
                  Hoje
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'SÃ¡b'].map(d => (
                <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {calendarDays.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const items = deadlineMap[key] || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const dayStatus = getDayStatus(day);

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(isSameDay(day, selectedDay) ? null : day)}
                    className={cn(
                      "min-h-[72px] p-1.5 bg-card flex flex-col text-left transition-all hover:bg-muted/50 relative",
                      !isCurrentMonth && "opacity-40",
                      isSelected && "bg-primary/5 ring-1 ring-inset ring-primary",
                    )}
                  >
                    <span className={cn(
                      "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                      isToday(day) && "bg-primary text-primary-foreground font-bold",
                      !isToday(day) && isCurrentMonth && "text-foreground",
                    )}>
                      {format(day, 'd')}
                    </span>

                    {/* Status dot + events */}
                    <div className="flex flex-col gap-0.5 mt-0.5 w-full">
                      {items.slice(0, 2).map((item, i) => (
                        <div
                          key={i}
                          className={cn(
                            "text-[9px] leading-tight px-1 py-0.5 rounded text-white truncate w-full",
                            item.status === 'concluido' ? 'bg-gray-300 text-gray-600' :
                            dayStatus === 'overdue' ? 'bg-destructive' :
                            dayStatus === 'urgent' ? 'bg-amber-500' :
                            TIPO_COLORS[item.tipo] || 'bg-gray-400'
                          )}
                        >
                          {item.titulo}
                        </div>
                      ))}
                      {items.length > 2 && (
                        <span className="text-[9px] text-muted-foreground pl-1">+{items.length - 2}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive" /> Vencido
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Vence em atÃ© 3 dias
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" /> Normal
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300" /> ConcluÃ­do
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Selected day events */}
          {selectedDay ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold capitalize">
                  {format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDayDeadlines.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nenhum prazo neste dia</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayDeadlines.map(d => (
                      <DeadlineItem key={d.id} deadline={d} today={today} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">Clique em um dia para ver os prazos</p>
              </CardContent>
            </Card>
          )}

          {/* Upcoming deadlines */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">PrÃ³ximos Prazos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {filteredDeadlines
                  .filter(d => d.status !== 'concluido' && d.data_prazo)
                  .sort((a, b) => a.data_prazo.localeCompare(b.data_prazo))
                  .slice(0, 10)
                  .map(d => <DeadlineItem key={d.id} deadline={d} today={today} compact />)
                }
                {filteredDeadlines.filter(d => d.status !== 'concluido').length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Sem prazos pendentes</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DeadlineItem({ deadline, today, compact = false }) {
  const diff = deadline.data_prazo ? differenceInDays(parseISO(deadline.data_prazo), today) : null;
  const isOverdue = diff !== null && diff < 0 && deadline.status !== 'concluido';
  const isUrgent = diff !== null && diff >= 0 && diff <= 3 && deadline.status !== 'concluido';
  const isDone = deadline.status === 'concluido';

  return (
    <div className={cn(
      "border-l-4 pl-3 py-2 rounded-r-lg bg-muted/30",
      isDone ? 'border-l-gray-300' :
      isOverdue ? 'border-l-destructive bg-destructive/5' :
      isUrgent ? 'border-l-amber-400 bg-amber-50' :
      PRIORIDADE_COLORS[deadline.prioridade] || 'border-l-border'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn(
            "text-xs font-semibold truncate",
            isDone && "line-through text-muted-foreground",
            isOverdue && "text-destructive",
            isUrgent && "text-amber-700"
          )}>
            {deadline.titulo}
          </p>
          {!compact && deadline.descricao && (
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{deadline.descricao}</p>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium",
              TIPO_COLORS[deadline.tipo] || 'bg-gray-400'
            )}>
              {TIPO_LABELS[deadline.tipo] || deadline.tipo}
            </span>
            {deadline.numero_processo && (
              <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
                {deadline.numero_processo}
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          {deadline.data_prazo && (
            <p className={cn(
              "text-[11px] font-semibold whitespace-nowrap",
              isOverdue && "text-destructive",
              isUrgent && "text-amber-600",
              !isOverdue && !isUrgent && "text-muted-foreground"
            )}>
              {format(parseISO(deadline.data_prazo), 'dd/MM/yy')}
            </p>
          )}
          {isOverdue && <p className="text-[10px] text-destructive font-medium">{Math.abs(diff)}d atraso</p>}
          {isUrgent && <p className="text-[10px] text-amber-600 font-medium">{diff === 0 ? 'Hoje!' : `${diff}d`}</p>}
          {isDone && <p className="text-[10px] text-muted-foreground">ConcluÃ­do</p>}
        </div>
      </div>
    </div>
  );
}
