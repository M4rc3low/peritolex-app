import React, { useState } from 'react';
import { peritolexApi } from '@/api/peritolexClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, CheckCircle2, AlertTriangle, ArrowRight, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DatajudSearch({ open, onClose, onSelect }) {
  const [numero, setNumero] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!numero.trim()) return;
    setLoading(true);
    setResult(null);
    setError('');
    const res = await peritolexApi.functions.invoke('consultarDatajud', { numero_processo: numero.trim() });
    setLoading(false);
    if (res.data?.processo) {
      setResult(res.data.processo);
    } else {
      setError(res.data?.error || 'Processo nÃ£o encontrado.');
    }
  };

  const handleUse = () => {
    onSelect(result);
    onClose();
    setNumero('');
    setResult(null);
    setError('');
  };

  const handleClose = () => {
    onClose();
    setNumero('');
    setResult(null);
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" /> Buscar Processo no DataJud
          </DialogTitle>
          <DialogDescription>
            Insira o nÃºmero CNJ para importar os dados automaticamente.
          </DialogDescription>
        </DialogHeader>

        {/* Campo de busca */}
        <div className="space-y-2">
          <Label className="text-xs">NÃºmero do Processo (CNJ)</Label>
          <div className="flex gap-2">
            <Input
              value={numero}
              onChange={e => setNumero(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="0000000-00.0000.0.00.0000"
              className="font-mono text-sm"
            />
            <Button onClick={handleSearch} disabled={loading || !numero.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div className="space-y-3 border border-border rounded-xl p-4 bg-muted/30">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-semibold">Processo encontrado!</span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Field label="NÂº Processo" value={result.numero_processo} mono />
              <Field label="Tipo de AÃ§Ã£o" value={result.tipo_acao} />
              <Field label="Vara/Ã“rgÃ£o" value={result.vara} />
              <Field label="Comarca/Tribunal" value={result.comarca} />
              <Field label="Autor" value={result.autor} />
              <Field label="RÃ©u" value={result.reu} />
              {result.advogado_autor && <Field label="Adv. Autor" value={result.advogado_autor} />}
              {result.advogado_reu && <Field label="Adv. RÃ©u" value={result.advogado_reu} />}
              {result.data_distribuicao && <Field label="Data DistribuiÃ§Ã£o" value={result.data_distribuicao} />}
            </div>

            {result._raw?.assuntos && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Assuntos:</span> {result._raw.assuntos}
              </p>
            )}

            {result._raw?.totalMovimentos > 0 && (
              <Badge variant="outline" className="text-xs">
                {result._raw.totalMovimentos} movimentaÃ§Ãµes encontradas
              </Badge>
            )}

            <Button className="w-full gap-2 mt-1" onClick={handleUse}>
              Usar estes dados <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, mono }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-medium truncate", mono && "font-mono text-xs")}>{value}</p>
    </div>
  );
}
