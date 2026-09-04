import React from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';
import { addDays, format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_LABELS = {
  em_andamento: 'Em Andamento',
  aguardando_pericia: 'Aguard. PerÃ­cia',
  pericia_realizada: 'PerÃ­cia Realizada',
  laudo_entregue: 'Laudo Entregue',
  encerrado: 'Encerrado',
  suspenso: 'Suspenso',
};

const STATUS_COLORS = {
  em_andamento: '#3b82f6',
  aguardando_pericia: '#f59e0b',
  pericia_realizada: '#10b981',
  laudo_entregue: '#8b5cf6',
  encerrado: '#6b7280',
  suspenso: '#ef4444',
};

const CHART_COLORS = ['#1e3a5f', '#d4a017', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280'];

// Tooltip customizado
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
      {label && <p className="font-semibold text-foreground mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || entry.fill }}>
          {entry.name}: <span className="font-bold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

// GrÃ¡fico 1: Volume por status (pizza)
export function ProcessStatusPieChart({ processes }) {
  const data = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    name: label,
    value: processes.filter(p => p.status === key).length,
    color: STATUS_COLORS[key],
  })).filter(d => d.value > 0);

  if (!data.length) return <p className="text-xs text-muted-foreground text-center py-8">Nenhum processo</p>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-[11px] text-foreground">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// GrÃ¡fico 2: Prazos vencendo em 7 dias (barras por dia)
export function DeadlinesNextDaysChart({ deadlines }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(today, i);
    const label = i === 0 ? 'Hoje' : format(day, 'EEE dd/MM', { locale: ptBR });
    const count = deadlines.filter(d => {
      if (d.status !== 'pendente') return false;
      const dDate = new Date(d.data_prazo);
      dDate.setHours(0, 0, 0, 0);
      return dDate.getTime() === day.getTime();
    }).length;
    return { label, count };
  });

  const hasData = days.some(d => d.count > 0);
  if (!hasData) return <p className="text-xs text-muted-foreground text-center py-8">Nenhum prazo nos prÃ³ximos 7 dias</p>;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={days} barSize={28}>
        <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
        <Bar dataKey="count" name="Prazos" radius={[4, 4, 0, 0]}>
          {days.map((entry, i) => (
            <Cell key={i} fill={entry.count > 0 ? (i === 0 ? '#ef4444' : '#1e3a5f') : '#e5e7eb'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// GrÃ¡fico 3: HonorÃ¡rios por mÃªs (Ãºltimos 6 meses)
export function HonorariosMonthlyChart({ processes }) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const label = format(date, 'MMM/yy', { locale: ptBR });
    const total = processes
      .filter(p => {
        const ref = p.data_nomeacao || p.created_date;
        if (!ref) return false;
        const d = new Date(ref);
        return d >= start && d <= end;
      })
      .reduce((sum, p) => sum + (p.honorarios || 0), 0);
    const levantado = processes
      .filter(p => {
        const ref = p.data_nomeacao || p.created_date;
        if (!ref || p.honorarios_status !== 'levantado') return false;
        const d = new Date(ref);
        return d >= start && d <= end;
      })
      .reduce((sum, p) => sum + (p.honorarios || 0), 0);
    return { label, total, levantado };
  });

  const hasData = months.some(m => m.total > 0);
  if (!hasData) return <p className="text-xs text-muted-foreground text-center py-8">Nenhum honorÃ¡rio registrado</p>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={months} barGap={4} barSize={20}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={50}
          tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
                <p className="font-semibold mb-1">{label}</p>
                {payload.map((e, i) => (
                  <p key={i} style={{ color: e.fill }}>
                    {e.name}: <span className="font-bold">R$ {Number(e.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </p>
                ))}
              </div>
            );
          }}
        />
        <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-[11px] text-foreground">{v}</span>} />
        <Bar dataKey="total" name="Previsto" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
        <Bar dataKey="levantado" name="Levantado" fill="#d4a017" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// GrÃ¡fico 4: DistribuiÃ§Ã£o por comarca (barras horizontais)
export function ProcessByComarcaChart({ processes }) {
  const counts = {};
  processes.forEach(p => {
    const comarca = p.comarca || 'NÃ£o informada';
    counts[comarca] = (counts[comarca] || 0) + 1;
  });

  const data = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value], i) => ({ name, value, fill: CHART_COLORS[i % CHART_COLORS.length] }));

  if (!data.length) return <p className="text-xs text-muted-foreground text-center py-8">Nenhum processo</p>;

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
      <BarChart data={data} layout="vertical" barSize={20}>
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
        <Bar dataKey="value" name="Processos" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
