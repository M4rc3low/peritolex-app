import React, { useState, useEffect } from 'react';
import { peritolexApi } from '@/api/peritolexClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, AlertTriangle, DollarSign, Bell, BarChart2, FileDown, TrendingUp, Zap, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isPast, isThisMonth, differenceInDays } from 'date-fns';
import StatsCard from '@/components/dashboard/StatsCard';
import DeadlineTimeline from '@/components/dashboard/DeadlineTimeline';
import ProcessStatusChart from '@/components/dashboard/ProcessStatusChart';
import { ProcessStatusPieChart, DeadlinesNextDaysChart, ProcessByComarcaChart, HonorariosMonthlyChart } from '@/components/dashboard/DashboardCharts';
import MonthlyReport from '@/components/reports/MonthlyReport';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function Dashboard() {
  const [showReport, setShowReport] = useState(false);
  const queryClient = useQueryClient();

  // SincronizaÃ§Ã£o em tempo real
  useEffect(() => {
    const unsubProc = peritolexApi.entities.Process.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
    });
    const unsubDead = peritolexApi.entities.Deadline.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
    });
    const unsubAlert = peritolexApi.entities.Alert.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['alerts-unread'] });
    });
    return () => { unsubProc(); unsubDead(); unsubAlert(); };
  }, [queryClient]);

  const { data: processes = [] } = useQuery({
    queryKey: ['processes'],
    queryFn: () => peritolexApi.entities.Process.list('-created_date', 100),
  });

  const { data: deadlines = [] } = useQuery({
    queryKey: ['deadlines'],
    queryFn: () => peritolexApi.entities.Deadline.list('-data_prazo', 100),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts-unread'],
    queryFn: () => peritolexApi.entities.Alert.filter({ lido: false }, '-created_date', 20),
  });

  const activeProcesses = processes.filter(p => !['encerrado', 'suspenso'].includes(p.status));
  const pendingDeadlines = deadlines.filter(d => d.status === 'pendente');
  const overdueDeadlines = pendingDeadlines.filter(d => isPast(new Date(d.data_prazo)));
  const urgentDeadlines = pendingDeadlines.filter(d => {
    const days = differenceInDays(new Date(d.data_prazo), new Date());
    return days >= 0 && days <= 3;
  });
  const upcomingDeadlines = pendingDeadlines
    .filter(d => !isPast(new Date(d.data_prazo)))
    .sort((a, b) => new Date(a.data_prazo) - new Date(b.data_prazo));

  const totalHonorarios = processes.reduce((sum, p) => sum + (p.honorarios || 0), 0);
  const honorariosPendentes = processes
    .filter(p => p.honorarios_status === 'pendente')
    .reduce((sum, p) => sum + (p.honorarios || 0), 0);
  const honorariosDepositados = processes
    .filter(p => p.honorarios_status === 'depositado')
    .reduce((sum, p) => sum + (p.honorarios || 0), 0);
  const honorariosLevantados = processes
    .filter(p => p.honorarios_status === 'levantado')
    .reduce((sum, p) => sum + (p.honorarios || 0), 0);
  const processosNomeadosMes = processes.filter(p => p.data_nomeacao && isThisMonth(new Date(p.data_nomeacao))).length;
  const laudosEntregues = processes.filter(p => p.status === 'laudo_entregue').length;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">VisÃ£o geral dos seus processos periciais</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowReport(true)}>
            <FileDown className="w-4 h-4" /> RelatÃ³rio Mensal
          </Button>
          {alerts.length > 0 && (
            <Link to="/alertas">
              <Button variant="outline" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                  {alerts.length}
                </span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats â€” linha 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Processos Ativos"
          value={activeProcesses.length}
          icon={FileText}
          trendLabel={processosNomeadosMes > 0 ? `+${processosNomeadosMes} nomeaÃ§Ãµes este mÃªs` : undefined}
        />
        <StatsCard
          title="Laudos Entregues"
          value={laudosEntregues}
          icon={CheckCircle2}
        />
        <StatsCard
          title="Prazos Atrasados"
          value={overdueDeadlines.length}
          icon={AlertTriangle}
          variant={overdueDeadlines.length > 0 ? "accent" : "default"}
          trendLabel={overdueDeadlines.length > 0 ? "requerem atenÃ§Ã£o imediata" : "tudo em dia"}
        />
        <StatsCard
          title="Urgentes (â‰¤3 dias)"
          value={urgentDeadlines.length}
          icon={Zap}
          variant={urgentDeadlines.length > 0 ? "accent" : "default"}
          trendLabel={urgentDeadlines.length > 0 ? "vencendo em breve" : "sem urgÃªncias"}
        />
      </div>

      {/* Stats â€” linha 2: financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="HonorÃ¡rios a Receber"
          value={`R$ ${honorariosPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          variant="accent"
          trendLabel="aguardando depÃ³sito"
        />
        <StatsCard
          title="Depositados (a levantar)"
          value={`R$ ${honorariosDepositados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          trendLabel="prontos para levantamento"
        />
        <StatsCard
          title="Total Levantado"
          value={`R$ ${honorariosLevantados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={CheckCircle2}
          trendLabel={`de R$ ${totalHonorarios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} totais`}
        />
      </div>

      {/* Tabs: VisÃ£o Geral / GrÃ¡ficos */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="gap-1.5">
            <FileText className="w-3.5 h-3.5" /> VisÃ£o Geral
          </TabsTrigger>
          <TabsTrigger value="charts" className="gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" /> GrÃ¡ficos & AnÃ¡lises
          </TabsTrigger>
        </TabsList>

        {/* â”€â”€ Tab VisÃ£o Geral â”€â”€ */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 shadow-sm">
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <h2 className="text-base font-semibold">PrÃ³ximos Prazos</h2>
                <Link to="/prazos">
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Ver todos</Button>
                </Link>
              </div>
              <div className="p-5">
                <DeadlineTimeline deadlines={[...overdueDeadlines, ...upcomingDeadlines]} />
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border/50 shadow-sm">
              <div className="p-5 border-b border-border/50">
                <h2 className="text-base font-semibold">Status dos Processos</h2>
              </div>
              <div className="p-5">
                <ProcessStatusChart processes={processes} />
              </div>
              {honorariosPendentes > 0 && (
                <div className="px-5 pb-5">
                  <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-xs text-muted-foreground">HonorÃ¡rios pendentes</p>
                    <p className="text-lg font-bold text-accent">
                      R$ {honorariosPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {alerts.length > 0 && (
            <div className="bg-card rounded-xl border border-border/50 shadow-sm">
              <div className="flex items-center justify-between p-5 border-b border-border/50">
                <h2 className="text-base font-semibold">Alertas Recentes</h2>
                <Link to="/alertas">
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Ver todos</Button>
                </Link>
              </div>
              <div className="divide-y divide-border/50">
                {alerts.slice(0, 4).map(alert => (
                  <div key={alert.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alert.titulo}</p>
                      <p className="text-xs text-muted-foreground truncate">{alert.mensagem}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{alert.tipo?.replace(/_/g, ' ')}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* â”€â”€ Tab GrÃ¡ficos â”€â”€ */}
        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Processos por Status */}
            <div className="bg-card rounded-xl border border-border/50 shadow-sm">
              <div className="p-5 border-b border-border/50">
                <h2 className="text-base font-semibold">DistribuiÃ§Ã£o por Status</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{processes.length} processos no total</p>
              </div>
              <div className="p-5">
                <ProcessStatusPieChart processes={processes} />
              </div>
            </div>

            {/* Prazos prÃ³ximos 7 dias */}
            <div className="bg-card rounded-xl border border-border/50 shadow-sm">
              <div className="p-5 border-b border-border/50">
                <h2 className="text-base font-semibold">Prazos â€” PrÃ³ximos 7 Dias</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Prazos pendentes por dia</p>
              </div>
              <div className="p-5">
                <DeadlinesNextDaysChart deadlines={deadlines} />
              </div>
            </div>

            {/* HonorÃ¡rios mensais â€” full width */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 shadow-sm">
              <div className="p-5 border-b border-border/50">
                <h2 className="text-base font-semibold">HonorÃ¡rios â€” Ãšltimos 6 Meses</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Previsto vs levantado por mÃªs de nomeaÃ§Ã£o</p>
              </div>
              <div className="p-5">
                <HonorariosMonthlyChart processes={processes} />
              </div>
            </div>

            {/* Por comarca â€” full width */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 shadow-sm">
              <div className="p-5 border-b border-border/50">
                <h2 className="text-base font-semibold">Processos por Comarca</h2>
                <p className="text-xs text-muted-foreground mt-0.5">DistribuiÃ§Ã£o geogrÃ¡fica dos processos</p>
              </div>
              <div className="p-5">
                <ProcessByComarcaChart processes={processes} />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <MonthlyReport open={showReport} onClose={() => setShowReport(false)} />
    </div>
  );
}
