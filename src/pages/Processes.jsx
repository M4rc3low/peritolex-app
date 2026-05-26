import React, { useState, useEffect } from 'react';
import { peritolexApi } from '@/api/peritolexClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ProcessCard from '@/components/processes/ProcessCard';
import ProcessForm from '@/components/processes/ProcessForm';
import DatajudImport from '@/components/processes/DatajudImport';
import CsvImport from '@/components/processes/CsvImport';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'aguardando_pericia', label: 'Aguardando PerÃ­cia' },
  { value: 'pericia_realizada', label: 'PerÃ­cia Realizada' },
  { value: 'laudo_entregue', label: 'Laudo Entregue' },
  { value: 'encerrado', label: 'Encerrado' },
  { value: 'suspenso', label: 'Suspenso' },
];

export default function Processes() {
  const [showForm, setShowForm] = useState(false);
  const [showDatajud, setShowDatajud] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [prefillData, setPrefillData] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  const { data: processes = [], isLoading } = useQuery({
    queryKey: ['processes'],
    queryFn: () => peritolexApi.entities.Process.list('-created_date', 200),
  });

  // SincronizaÃ§Ã£o em tempo real
  useEffect(() => {
    const unsub = peritolexApi.entities.Process.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
    });
    return () => unsub();
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (data) => peritolexApi.entities.Process.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      setShowForm(false);
    },
  });

  // Profissionais veem apenas os seus processos; admins veem todos
  const myProcesses = isAdmin
    ? processes
    : processes.filter(p =>
        p.responsavel_email === currentUser?.email ||
        p.created_by === currentUser?.email
      );

  const filtered = myProcesses.filter(p => {
    const matchSearch = !search || 
      p.numero_processo?.toLowerCase().includes(search.toLowerCase()) ||
      p.autor?.toLowerCase().includes(search.toLowerCase()) ||
      p.reu?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Processos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin ? `${processes.length} processos no total` : `${myProcesses.length} seus processos`}
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" /> Importar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowDatajud(true)} className="gap-2 cursor-pointer">
                <Search className="w-4 h-4" /> Buscar no DataJud (CNJ)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowCsv(true)} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="w-4 h-4" /> Importar CSV / Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Processo
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nÂº processo, autor ou rÃ©u..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Process grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-44 bg-card rounded-xl border border-border/50 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Nenhum processo encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => <ProcessCard key={p.id} process={p} />)}
        </div>
      )}

      <ProcessForm 
        open={showForm} 
        onClose={() => { setShowForm(false); setPrefillData(null); }}
        onSubmit={(data) => createMutation.mutate(data)}
        initialData={prefillData}
      />

      <DatajudImport
        open={showDatajud}
        onClose={() => setShowDatajud(false)}
        onImport={(data) => {
          setShowDatajud(false);
          setPrefillData(data);
          setShowForm(true);
          toast.info('Dados importados! Revise e complete as informaÃ§Ãµes antes de salvar.');
        }}
      />

      <CsvImport
        open={showCsv}
        onClose={() => setShowCsv(false)}
        onImported={() => queryClient.invalidateQueries({ queryKey: ['processes'] })}
      />
    </div>
  );
}
