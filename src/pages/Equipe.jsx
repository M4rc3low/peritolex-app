import React, { useState, useEffect } from 'react';
import { peritolexApi } from '@/api/peritolexClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Users, FileText, DollarSign, AlertTriangle, ChevronDown, ChevronUp, UserPlus, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isPast, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const STATUS_CONFIG = {
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700' },
  aguardando_pericia: { label: 'Aguard. PerÃ­cia', color: 'bg-amber-100 text-amber-700' },
  pericia_realizada: { label: 'PerÃ­cia Realizada', color: 'bg-emerald-100 text-emerald-700' },
  laudo_entregue: { label: 'Laudo Entregue', color: 'bg-purple-100 text-purple-700' },
  encerrado: { label: 'Encerrado', color: 'bg-gray-100 text-gray-600' },
  suspenso: { label: 'Suspenso', color: 'bg-red-100 text-red-700' },
};

function MemberCard({ email, nome, processes, deadlines }) {
  const [expanded, setExpanded] = useState(false);

  const active = processes.filter(p => !['encerrado', 'suspenso'].includes(p.status));
  const honorarios = processes.reduce((s, p) => s + (p.honorarios || 0), 0);
  const laudos = processes.filter(p => p.status === 'laudo_entregue').length;

  // deadlines deste membro
  const myDeadlines = deadlines.filter(d =>
    processes.some(p => p.id === d.process_id)
  );
  const overdue = myDeadlines.filter(d =>
    d.status === 'pendente' && isPast(new Date(d.data_prazo))
  ).length;
  const urgent = myDeadlines.filter(d => {
    const days = differenceInDays(new Date(d.data_prazo), new Date());
    return d.status === 'pendente' && days >= 0 && days <= 3;
  }).length;

  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
              {(nome || email).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm">{nome || email}</p>
              {nome && <p className="text-xs text-muted-foreground">{email}</p>}
            </div>
          </div>
          <div className="flex gap-1.5">
            {overdue > 0 && (
              <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
                <AlertTriangle className="w-3 h-3 mr-1" />{overdue} atrasado{overdue > 1 ? 's' : ''}
              </Badge>
            )}
            {urgent > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                {urgent} urgente{urgent > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-primary">{active.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ativos</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-purple-600">{laudos}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Laudos</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-destructive">{overdue}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Atrasados</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs font-bold text-emerald-600">
              {honorarios > 0 ? `R$\u00a0${(honorarios / 1000).toFixed(0)}k` : 'â€”'}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">HonorÃ¡rios</p>
          </div>
        </div>
      </div>

      {processes.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-5 py-3 border-t border-border/50 text-xs text-muted-foreground hover:bg-muted/30 transition-colors"
          >
            <span>{processes.length} processo{processes.length > 1 ? 's' : ''}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {expanded && (
            <div className="divide-y divide-border/30">
              {processes.slice(0, 10).map(p => {
                const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.em_andamento;
                return (
                  <Link
                    key={p.id}
                    to={`/processos/${p.id}`}
                    className="flex items-center justify-between px-5 py-2.5 hover:bg-muted/20 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-mono text-muted-foreground">{p.numero_processo}</p>
                      <p className="text-xs font-medium truncate max-w-[200px]">{p.autor} Ã— {p.reu}</p>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px]", sc.color)}>{sc.label}</Badge>
                  </Link>
                );
              })}
              {processes.length > 10 && (
                <p className="px-5 py-2 text-[11px] text-muted-foreground">
                  + {processes.length - 10} processos
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Equipe() {
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const { data: processes = [], isLoading: loadingProc } = useQuery({
    queryKey: ['processes'],
    queryFn: () => peritolexApi.entities.Process.list('-created_date', 500),
  });

  const { data: deadlines = [] } = useQuery({
    queryKey: ['deadlines'],
    queryFn: () => peritolexApi.entities.Deadline.list('-data_prazo', 500),
  });

  // SincronizaÃ§Ã£o em tempo real
  useEffect(() => {
    const unsubProc = peritolexApi.entities.Process.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
    });
    const unsubDead = peritolexApi.entities.Deadline.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
    });
    return () => { unsubProc(); unsubDead(); };
  }, [queryClient]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await peritolexApi.users.inviteUser(inviteEmail.trim(), 'user');
      toast.success(`Convite enviado para ${inviteEmail}`);
      setInviteEmail('');
      setShowInvite(false);
    } catch (e) {
      toast.error('Erro ao enviar convite: ' + e.message);
    } finally {
      setInviting(false);
    }
  };

  // Aguarda carregar antes de verificar role
  if (!currentUser) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // SÃ³ admins veem esta pÃ¡gina
  if (currentUser.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">Acesso restrito a administradores.</p>
      </div>
    );
  }

  // Agrupa processos por responsÃ¡vel
  const memberMap = {};
  for (const p of processes) {
    const key = p.responsavel_email || p.created_by || 'sem_responsavel';
    const nome = p.responsavel_nome || '';
    if (!memberMap[key]) memberMap[key] = { email: key, nome, processes: [] };
    if (nome && !memberMap[key].nome) memberMap[key].nome = nome;
    memberMap[key].processes.push(p);
  }
  const members = Object.values(memberMap).sort((a, b) => b.processes.length - a.processes.length);

  // Totais gerais
  const totalAtivos = processes.filter(p => !['encerrado', 'suspenso'].includes(p.status)).length;
  const totalOverdue = deadlines.filter(d => d.status === 'pendente' && isPast(new Date(d.data_prazo))).length;
  const totalHon = processes.reduce((s, p) => s + (p.honorarios || 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Equipe</h1>
          <p className="text-sm text-muted-foreground mt-1">VisÃ£o consolidada de todos os profissionais</p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="gap-2">
          <UserPlus className="w-4 h-4" /> Convidar Membro
        </Button>
      </div>

      {/* Modal de convite */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">O membro receberÃ¡ um email de acesso ao sistema.</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  className="pl-9"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInvite()}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowInvite(false)}>Cancelar</Button>
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                {inviting ? 'Enviando...' : 'Enviar Convite'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Totais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Profissionais', value: members.length, icon: Users, color: 'text-primary' },
          { label: 'Processos Ativos', value: totalAtivos, icon: FileText, color: 'text-blue-600' },
          { label: 'Prazos Atrasados', value: totalOverdue, icon: AlertTriangle, color: 'text-destructive' },
          { label: 'Total HonorÃ¡rios', value: `R$ ${totalHon.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, icon: DollarSign, color: 'text-emerald-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border/50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <Icon className={cn("w-4.5 h-4.5", color)} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="text-lg font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cards dos membros */}
      {loadingProc ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl">
          <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum processo cadastrado ainda.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Atribua um responsÃ¡vel ao cadastrar processos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {members.map(m => (
            <MemberCard
              key={m.email}
              email={m.email}
              nome={m.nome}
              processes={m.processes}
              deadlines={deadlines}
            />
          ))}
        </div>
      )}
    </div>
  );
}
