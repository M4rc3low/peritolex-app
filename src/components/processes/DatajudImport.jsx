import React, { useState } from 'react';
import { peritolexApi } from '@/api/peritolexClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DatajudImport({ open, onClose, onImport }) {
  const [numero, setNumero] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!numero.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    const resp = await peritolexApi.functions.invoke('consultarDatajud', { numero_processo: numero.trim() });
    setLoading(false);
    if (resp.data?.processo) {
      setResult(resp.data.processo);
    } else {
      setError(resp.data?.error || 'Processo nÃ£o encontrado.');
    }
  };

  const handleImport = () => {
    if (!result) return;
    onImport(result);
    setNumero('');
    setResult(null);
    setError('');
    onClose();
  };

  const handleClose = () => {
    setNumero('');
    setResult(null);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-primary" />
            Importar via DataJud (CNJ)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">NÃºmero do Processo</Label>
            <div className="flex gap-2">
              <Input
                value={numero}
                onChange={e => setNumero(e.target.value)}
                placeholder="0000000-00.0000.8.26.0100"
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="font-mono text-sm"
              />
              <Button onClick={handleSearch} disabled={loading || !numero.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Formato: NNNNNNN-DD.AAAA.J.TT.OOOO</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-xl border border-border/50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">Processo encontrado!</span>
                {result._raw?.classe && (
                  <Badge variant="outline" className="text-[10px]">{result._raw.classe}</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">NÂº Processo</p>
                  <p className="font-mono text-xs font-medium mt-0.5">{result.numero_processo}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tribunal</p>
                  <p className="font-medium mt-0.5">{result.comarca}</p>
                </div>
                {result.vara && (
                  <div className="col-span-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ã“rgÃ£o Julgador</p>
                    <p className="font-medium mt-0.5">{result.vara}</p>
                  </div>
                )}
                {result.autor && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Polo Ativo</p>
                    <p className="font-medium mt-0.5 truncate">{result.autor}</p>
                  </div>
                )}
                {result.reu && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Polo Passivo</p>
                    <p className="font-medium mt-0.5 truncate">{result.reu}</p>
                  </div>
                )}
                {result.data_distribuicao && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ajuizamento</p>
                    <p className="font-medium mt-0.5">{result.data_distribuicao}</p>
                  </div>
                )}
                {result._raw?.assuntos && (
                  <div className="col-span-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Assuntos</p>
                    <p className="text-xs mt-0.5">{result._raw.assuntos}</p>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground">
                Os dados serÃ£o importados e vocÃª poderÃ¡ completar as informaÃ§Ãµes (honorÃ¡rios, quesitos, etc.) apÃ³s a importaÃ§Ã£o.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
            {result && (
              <Button onClick={handleImport} className="gap-2">
                <CheckCircle2 className="w-4 h-4" /> Importar Processo
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
