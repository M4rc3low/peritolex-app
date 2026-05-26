import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const STATUS_OPTIONS = [
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'aguardando_pericia', label: 'Aguardando PerÃ­cia' },
  { value: 'pericia_realizada', label: 'PerÃ­cia Realizada' },
  { value: 'laudo_entregue', label: 'Laudo Entregue' },
  { value: 'encerrado', label: 'Encerrado' },
  { value: 'suspenso', label: 'Suspenso' },
];

const HONORARIOS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'depositado', label: 'Depositado' },
  { value: 'levantado', label: 'Levantado' },
];

const defaultForm = {
  numero_processo: '', vara: '', comarca: '', tipo_acao: '',
  autor: '', reu: '', advogado_autor: '', advogado_reu: '',
  valor_causa: '', status: 'em_andamento', data_distribuicao: '',
  data_nomeacao: '', honorarios: '', honorarios_status: 'pendente',
  objeto_pericia: '', observacoes: '',
  responsavel_email: '', responsavel_nome: '',
};

export default function ProcessForm({ open, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(initialData || defaultForm);

  useEffect(() => {
    setForm(initialData || defaultForm);
  }, [open, initialData]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      valor_causa: form.valor_causa ? Number(form.valor_causa) : undefined,
      honorarios: form.honorarios ? Number(form.honorarios) : undefined,
    };
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {initialData ? 'Editar Processo' : 'Novo Processo'}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Dados do processo */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dados do Processo</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">NÂº Processo *</Label>
                  <Input value={form.numero_processo} onChange={e => handleChange('numero_processo', e.target.value)} placeholder="0000000-00.0000.0.00.0000" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de AÃ§Ã£o</Label>
                  <Input value={form.tipo_acao} onChange={e => handleChange('tipo_acao', e.target.value)} placeholder="Ex: Trabalhista" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Vara/Tribunal</Label>
                  <Input value={form.vara} onChange={e => handleChange('vara', e.target.value)} placeholder="Ex: 1Âª Vara CÃ­vel" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Comarca</Label>
                  <Input value={form.comarca} onChange={e => handleChange('comarca', e.target.value)} placeholder="Ex: SÃ£o Paulo/SP" />
                </div>
              </div>
            </div>

            {/* Partes */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Partes</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Autor *</Label>
                  <Input value={form.autor} onChange={e => handleChange('autor', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">RÃ©u *</Label>
                  <Input value={form.reu} onChange={e => handleChange('reu', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Advogado do Autor</Label>
                  <Input value={form.advogado_autor} onChange={e => handleChange('advogado_autor', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Advogado do RÃ©u</Label>
                  <Input value={form.advogado_reu} onChange={e => handleChange('advogado_reu', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Financeiro */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Financeiro & Status</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor da Causa (R$)</Label>
                  <Input type="number" step="0.01" value={form.valor_causa} onChange={e => handleChange('valor_causa', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">HonorÃ¡rios (R$)</Label>
                  <Input type="number" step="0.01" value={form.honorarios} onChange={e => handleChange('honorarios', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={form.status} onValueChange={v => handleChange('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Status HonorÃ¡rios</Label>
                  <Select value={form.honorarios_status} onValueChange={v => handleChange('honorarios_status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {HONORARIOS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Data DistribuiÃ§Ã£o</Label>
                  <Input type="date" value={form.data_distribuicao} onChange={e => handleChange('data_distribuicao', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Data NomeaÃ§Ã£o</Label>
                  <Input type="date" value={form.data_nomeacao} onChange={e => handleChange('data_nomeacao', e.target.value)} />
                </div>
              </div>
            </div>

            {/* ResponsÃ¡vel */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">ResponsÃ¡vel</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome do Perito ResponsÃ¡vel</Label>
                  <Input value={form.responsavel_nome} onChange={e => handleChange('responsavel_nome', e.target.value)} placeholder="Ex: Dr. JoÃ£o Silva" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email do ResponsÃ¡vel</Label>
                  <Input type="email" value={form.responsavel_email} onChange={e => handleChange('responsavel_email', e.target.value)} placeholder="perito@escritorio.com" />
                </div>
              </div>
            </div>

            {/* PerÃ­cia */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">PerÃ­cia</h3>
              <div className="space-y-1.5">
                <Label className="text-xs">Objeto da PerÃ­cia</Label>
                <Textarea value={form.objeto_pericia} onChange={e => handleChange('objeto_pericia', e.target.value)} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">ObservaÃ§Ãµes</Label>
                <Textarea value={form.observacoes} onChange={e => handleChange('observacoes', e.target.value)} rows={2} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" className="bg-primary">{initialData ? 'Salvar' : 'Criar Processo'}</Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
