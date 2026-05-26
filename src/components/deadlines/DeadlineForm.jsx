import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const TIPO_OPTIONS = [
  { value: 'entrega_laudo', label: 'Entrega de Laudo' },
  { value: 'manifestacao', label: 'ManifestaÃ§Ã£o' },
  { value: 'diligencia', label: 'DiligÃªncia' },
  { value: 'audiencia', label: 'AudiÃªncia' },
  { value: 'levantamento_honorarios', label: 'Levantamento HonorÃ¡rios' },
  { value: 'outro', label: 'Outro' },
];

const PRIORIDADE_OPTIONS = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'MÃ©dia' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
];

export default function DeadlineForm({ open, onClose, onSubmit, initialData, processes }) {
  const [form, setForm] = useState(initialData || {
    titulo: '', descricao: '', data_prazo: '', tipo: 'entrega_laudo',
    prioridade: 'media', process_id: '', numero_processo: '', status: 'pendente',
  });

  const handleChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'process_id' && processes) {
        const proc = processes.find(p => p.id === value);
        if (proc) updated.numero_processo = proc.numero_processo;
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {initialData ? 'Editar Prazo' : 'Novo Prazo'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">TÃ­tulo *</Label>
            <Input value={form.titulo} onChange={e => handleChange('titulo', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Processo Vinculado</Label>
            <Select value={form.process_id} onValueChange={v => handleChange('process_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar processo" /></SelectTrigger>
              <SelectContent>
                {(processes || []).map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.numero_processo} - {p.autor}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Data do Prazo *</Label>
              <Input type="date" value={form.data_prazo} onChange={e => handleChange('data_prazo', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select value={form.tipo} onValueChange={v => handleChange('tipo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPO_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Prioridade</Label>
            <Select value={form.prioridade} onValueChange={v => handleChange('prioridade', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORIDADE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">DescriÃ§Ã£o</Label>
            <Textarea value={form.descricao} onChange={e => handleChange('descricao', e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{initialData ? 'Salvar' : 'Criar Prazo'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
