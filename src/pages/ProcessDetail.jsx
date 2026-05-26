import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { peritolexApi } from '@/api/peritolexClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft, Pencil, Trash2, Plus, FileText,
  User, Building, DollarSign, Calendar, Scale, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import ProcessForm from '@/components/processes/ProcessForm';
import DeadlineForm from '@/components/deadlines/DeadlineForm';
import DeadlineTimeline from '@/components/dashboard/DeadlineTimeline';
import WorkflowStepper from '@/components/processes/WorkflowStepper';
import LaudoGenerator from '@/components/processes/LaudoGenerator';
import MovementsFeed from '@/components/movements/MovementsFeed';
import ProcessChat from '@/components/messages/ProcessChat';
import ProcessDocuments from '@/components/documents/ProcessDocuments';

const STATUS_CONFIG = {
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700' },
  aguardando_pericia: { label: 'Aguard. PerÃ­cia', color: 'bg-amber-100 text-amber-700' },
  pericia_realizada: { label: 'PerÃ­cia Realizada', color: 'bg-emerald-100 text-emerald-700' },
  laudo_entregue: { label: 'Laudo Entregue', color: 'bg-purple-100 text-purple-700' },
  encerrado: { label: 'Encerrado', color: 'bg-gray-100 text-gray-600' },
  suspenso: { label: 'Suspenso', color: 'bg-red-100 text-red-700' },
};

function InfoItem({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function ProcessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [showDeadlineForm, setShowDeadlineForm] = useState(false);
  const [showLaudo, setShowLaudo] = useState(false);

  const { data: process, isLoading } = useQuery({
    queryKey: ['process', id],
    queryFn: async () => {
      const list = await peritolexApi.entities.Process.filter({ id });
      return list[0];
    },
  });

  const { data: deadlines = [] } = useQuery({
    queryKey: ['deadlines', id],
    queryFn: () => peritolexApi.entities.Deadline.filter({ process_id: id }, '-data_prazo', 50),
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['movements', id],
    queryFn: () => peritolexApi.entities.ProcessMovement.filter({ process_id: id }, '-data_movimento', 50),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => peritolexApi.entities.Process.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process', id] });
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      setShowEdit(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => peritolexApi.entities.Process.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      navigate('/processos');
    },
  });

  const createDeadlineMutation = useMutation({
    mutationFn: (data) => peritolexApi.entities.Deadline.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines', id] });
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      setShowDeadlineForm(false);
    },
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-64 bg-muted rounded animate-pulse mb-8" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!process) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Processo nÃ£o encontrado</p>
        <Button variant="outline" onClick={() => navigate('/processos')} className="mt-4">Voltar</Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[process.status] || STATUS_CONFIG.em_andamento;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/processos')} className="mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl lg:text-2xl font-display font-bold">{process.numero_processo}</h1>
              <Badge className={cn("text-xs", statusConfig.color)}>{statusConfig.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{process.tipo_acao || 'Processo Judicial'} Â· {process.vara} Â· {process.comarca}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowLaudo(true)} className="gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Gerar Laudo
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir processo?</AlertDialogTitle>
                <AlertDialogDescription>Esta aÃ§Ã£o nÃ£o pode ser desfeita.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Workflow */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Etapas do Processo Pericial</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkflowStepper
            currentStep={process.workflow_step || 'coleta_dados'}
            onStepChange={(step) => updateMutation.mutate({ ...process, workflow_step: step })}
          />
        </CardContent>
      </Card>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Partes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Partes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={User} label="Autor" value={process.autor} />
            <InfoItem icon={User} label="RÃ©u" value={process.reu} />
            <InfoItem icon={Building} label="Advogado do Autor" value={process.advogado_autor} />
            <InfoItem icon={Building} label="Advogado do RÃ©u" value={process.advogado_reu} />
          </CardContent>
        </Card>

        {/* Financeiro */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Financeiro & Datas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={DollarSign} label="Valor da Causa" value={process.valor_causa ? `R$ ${process.valor_causa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null} />
            <InfoItem icon={DollarSign} label="HonorÃ¡rios" value={process.honorarios ? `R$ ${process.honorarios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${process.honorarios_status})` : null} />
            <InfoItem icon={Calendar} label="Data DistribuiÃ§Ã£o" value={process.data_distribuicao ? format(new Date(process.data_distribuicao), "dd/MM/yyyy") : null} />
            <InfoItem icon={Calendar} label="Data NomeaÃ§Ã£o" value={process.data_nomeacao ? format(new Date(process.data_nomeacao), "dd/MM/yyyy") : null} />
          </CardContent>
        </Card>

        {/* PerÃ­cia */}
        {(process.objeto_pericia || process.observacoes) && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">PerÃ­cia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.objeto_pericia && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Objeto da PerÃ­cia</p>
                  <p className="text-sm whitespace-pre-wrap">{process.objeto_pericia}</p>
                </div>
              )}
              {process.observacoes && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">ObservaÃ§Ãµes</p>
                  <p className="text-sm whitespace-pre-wrap">{process.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Prazos */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Prazos do Processo</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowDeadlineForm(true)} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Novo Prazo
            </Button>
          </CardHeader>
          <CardContent>
            <DeadlineTimeline deadlines={deadlines} />
          </CardContent>
        </Card>

        {/* Chat / ComunicaÃ§Ãµes */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">ComunicaÃ§Ãµes com as Partes</CardTitle>
          </CardHeader>
          <CardContent>
            <ProcessChat processId={id} process={process} />
          </CardContent>
        </Card>

        {/* Documentos */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Documentos do Processo</CardTitle>
          </CardHeader>
          <CardContent>
            <ProcessDocuments
              processId={id}
              numeroProcesso={process.numero_processo}
              movements={movements}
            />
          </CardContent>
        </Card>

        {/* Andamentos do Tribunal */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Andamentos do Tribunal</CardTitle>
          </CardHeader>
          <CardContent>
            <MovementsFeed processId={id} numeroProcesso={process.numero_processo} />
          </CardContent>
        </Card>
      </div>

      {showEdit && (
        <ProcessForm
          open={showEdit}
          onClose={() => setShowEdit(false)}
          onSubmit={updateMutation.mutate}
          initialData={process}
        />
      )}

      <DeadlineForm
        open={showDeadlineForm}
        onClose={() => setShowDeadlineForm(false)}
        onSubmit={(data) => createDeadlineMutation.mutate({ ...data, process_id: id, numero_processo: process.numero_processo })}
        processes={[process]}
      />

      <LaudoGenerator
        open={showLaudo}
        onClose={() => setShowLaudo(false)}
        process={process}
      />
    </div>
  );
}
