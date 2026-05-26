import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus } from 'lucide-react';

const defaultForm = {
  nome: '',
  keywords: [],
  tipo: 'manifestacao',
  prioridade: 'media',
  dias_prazo: 15,
  titulo_template: '',
  ativo: true,
};

export default function KeywordRuleForm({ open, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(defaultForm);
  const [kwInput, setKwInput] = useState('');

  useEffect(() => {
    setForm(initialData ? { ...defaultForm, ...initialData } : defaultForm);
    setKwInput('');
  }, [open, initialData]);

  const addKeyword = () => {
    const kw = kwInput.trim().toLowerCase();
    if (kw && !form.keywords.includes(kw)) {
      setForm(f => ({ ...f, keywords: [...f.keywords, kw] }));
    }
    setKwInput('');
  };

  const removeKeyword = (kw) => {
    setForm(f => ({ ...f, keywords: f.keywords.filter(k => k !== kw) }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addKeyword(); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, dias_prazo: Number(form.dias_prazo) });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Regra' : 'Nova Regra de Palavra-Chave'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome da regra</Label>
            <Input
              placeholder="Ex: Resposta Ã  citaÃ§Ã£o"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Palavras-chave <span className="text-muted-foreground text-xs">(pressione Enter para adicionar)</span></Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: citaÃ§Ã£o"
                value={kwInput}
                onChange={e => setKwInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button type="button" variant="outline" size="icon" onClick={addKeyword}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {form.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.keywords.map(kw => (
                  <span key={kw} className="flex items-center gap-1 text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                    {kw}
                    <button type="button" onClick={() => removeKeyword(kw)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo do prazo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrega_laudo">Entrega de Laudo</SelectItem>
                  <SelectItem value="manifestacao">ManifestaÃ§Ã£o</SelectItem>
                  <SelectItem value="diligencia">DiligÃªncia</SelectItem>
                  <SelectItem value="audiencia">AudiÃªncia</SelectItem>
                  <SelectItem value="levantamento_honorarios">Levant. HonorÃ¡rios</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select value={form.prioridade} onValueChange={v => setForm(f => ({ ...f, prioridade: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">MÃ©dia</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Dias para o prazo <span className="text-muted-foreground text-xs">(a partir da data da movimentaÃ§Ã£o)</span></Label>
            <Input
              type="number"
              min={1}
              max={365}
              value={form.dias_prazo}
              onChange={e => setForm(f => ({ ...f, dias_prazo: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>TÃ­tulo do prazo gerado</Label>
            <Input
              placeholder="Ex: Resposta Ã  citaÃ§Ã£o"
              value={form.titulo_template}
              onChange={e => setForm(f => ({ ...f, titulo_template: e.target.value }))}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={form.keywords.length === 0}>
              {initialData ? 'Salvar' : 'Criar Regra'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
