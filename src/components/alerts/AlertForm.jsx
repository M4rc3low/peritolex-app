import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const TIPO_OPTIONS = [
  { value: 'prazo_vencendo', label: 'Prazo Vencendo' },
  { value: 'prazo_vencido', label: 'Prazo Vencido' },
  { value: 'audiencia', label: 'AudiÃªncia' },
  { value: 'honorarios', label: 'HonorÃ¡rios' },
  { value: 'geral', label: 'Geral' },
];

export default function AlertForm({ open, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(initialData || {
    titulo: '', mensagem: '', tipo: 'geral',
    data_alerta: '', notificar_email: true, dias_antes: 3,
  });

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, dias_antes: Number(form.dias_antes) });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {initialData ? 'Editar Alerta' : 'Novo Alerta'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">TÃ­tulo *</Label>
            <Input value={form.titulo} onChange={e => handleChange('titulo', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Mensagem *</Label>
            <Textarea value={form.mensagem} onChange={e => handleChange('mensagem', e.target.value)} rows={2} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select value={form.tipo} onValueChange={v => handleChange('tipo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPO_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data do Alerta</Label>
              <Input type="datetime-local" value={form.data_alerta} onChange={e => handleChange('data_alerta', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Dias antes do prazo para alertar</Label>
            <Input type="number" min="1" max="30" value={form.dias_antes} onChange={e => handleChange('dias_antes', e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.notificar_email} onCheckedChange={v => handleChange('notificar_email', v)} />
            <Label className="text-xs">Notificar por e-mail</Label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{initialData ? 'Salvar' : 'Criar Alerta'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
