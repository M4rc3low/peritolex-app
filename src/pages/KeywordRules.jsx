import React, { useState } from 'react';
import { peritolexApi } from '@/api/peritolexClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, Zap, Tag, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import KeywordRuleForm from '@/components/rules/KeywordRuleForm';
import { toast } from 'sonner';

const TIPO_LABELS = {
  entrega_laudo: 'Entrega de Laudo',
  manifestacao: 'ManifestaÃ§Ã£o',
  diligencia: 'DiligÃªncia',
  audiencia: 'AudiÃªncia',
  levantamento_honorarios: 'Levant. HonorÃ¡rios',
  outro: 'Outro',
};

const PRIORIDADE_CONFIG = {
  urgente: 'bg-red-100 text-red-700 border-red-200',
  alta: 'bg-orange-100 text-orange-700 border-orange-200',
  media: 'bg-blue-100 text-blue-700 border-blue-200',
  baixa: 'bg-green-100 text-green-700 border-green-200',
};

const DEFAULT_RULES_INFO = [
  { keywords: ['citaÃ§Ã£o', 'intimaÃ§Ã£o'], tipo: 'manifestacao', dias_prazo: 15, prioridade: 'alta' },
  { keywords: ['audiÃªncia'], tipo: 'audiencia', dias_prazo: 1, prioridade: 'urgente' },
  { keywords: ['perÃ­cia', 'laudo pericial'], tipo: 'diligencia', dias_prazo: 30, prioridade: 'alta' },
  { keywords: ['honorÃ¡rios', 'depÃ³sito'], tipo: 'levantamento_honorarios', dias_prazo: 10, prioridade: 'alta' },
];

export default function KeywordRules() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['keyword-rules'],
    queryFn: () => peritolexApi.entities.KeywordRule.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => peritolexApi.entities.KeywordRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyword-rules'] });
      setShowForm(false);
      toast.success('Regra criada com sucesso!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => peritolexApi.entities.KeywordRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyword-rules'] });
      setEditing(null);
      toast.success('Regra atualizada!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => peritolexApi.entities.KeywordRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyword-rules'] });
      toast.success('Regra removida.');
    },
  });

  const toggleAtivo = (rule) => {
    updateMutation.mutate({ id: rule.id, data: { ativo: !rule.ativo } });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Regras de Palavras-Chave</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Detecta termos nas movimentaÃ§Ãµes do DataJud e cria prazos automaticamente.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Regra
        </Button>
      </div>

      {/* Como funciona */}
      <div className="bg-primary/5 border border-primary/15 rounded-xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Zap className="w-4 h-4" /> Como funciona
        </div>
        <p className="text-sm text-muted-foreground">
          A cada monitoramento automÃ¡tico (a cada 6h), o sistema lÃª as novas movimentaÃ§Ãµes dos processos em andamento.
          Se a descriÃ§Ã£o do andamento contiver alguma das palavras-chave configuradas abaixo, um prazo Ã© criado
          automaticamente na <strong>agenda de prazos</strong> com a antecedÃªncia definida.
        </p>
        {rules.length === 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            <strong>Sem regras personalizadas:</strong> o sistema usa as regras padrÃ£o embutidas (citaÃ§Ã£o, intimaÃ§Ã£o, audiÃªncia, perÃ­cia, honorÃ¡rios).
          </p>
        )}
      </div>

      {/* Regras padrÃ£o (informativo, quando nÃ£o hÃ¡ custom) */}
      {rules.length === 0 && !isLoading && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Regras padrÃ£o (ativas)</p>
          <div className="grid gap-3">
            {DEFAULT_RULES_INFO.map((r, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-card border border-border/50 rounded-xl opacity-70">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1 mb-1">
                    {r.keywords.map(kw => (
                      <span key={kw} className="text-xs px-2 py-0.5 bg-muted rounded-full">{kw}</span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {TIPO_LABELS[r.tipo]} Â· {r.dias_prazo} dias Â· Prioridade {r.prioridade}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px]">PadrÃ£o</Badge>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Crie uma regra personalizada para substituir as regras padrÃ£o.
          </p>
        </div>
      )}

      {/* Regras personalizadas */}
      {rules.length > 0 && (
        <div className="space-y-3">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <div key={i} className="h-20 bg-card rounded-xl border animate-pulse" />)
          ) : rules.map(rule => (
            <div
              key={rule.id}
              className={cn(
                "flex items-start gap-4 p-4 bg-card border rounded-xl transition-all",
                rule.ativo ? "border-border/50" : "border-border/20 opacity-50"
              )}
            >
              <button
                onClick={() => toggleAtivo(rule)}
                className="mt-0.5 flex-shrink-0"
                title={rule.ativo ? 'Desativar' : 'Ativar'}
              >
                {rule.ativo
                  ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                  : <Circle className="w-5 h-5 text-muted-foreground" />
                }
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-semibold">{rule.nome}</p>
                  <Badge variant="outline" className={cn("text-[10px] border", PRIORIDADE_CONFIG[rule.prioridade])}>
                    {rule.prioridade}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {TIPO_LABELS[rule.tipo] || rule.tipo}
                  </Badge>
                  <span className="text-xs text-muted-foreground">+{rule.dias_prazo} dias</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-1">
                  {(rule.keywords || []).map(kw => (
                    <span key={kw} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">{kw}</span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Prazo gerado: <strong>"{rule.titulo_template}"</strong>
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  variant="ghost" size="icon"
                  className="w-8 h-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setEditing(rule)}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  className="w-8 h-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteMutation.mutate(rule.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <KeywordRuleForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={createMutation.mutate}
      />
      {editing && (
        <KeywordRuleForm
          open={!!editing}
          onClose={() => setEditing(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editing.id, data })}
          initialData={editing}
        />
      )}
    </div>
  );
}
