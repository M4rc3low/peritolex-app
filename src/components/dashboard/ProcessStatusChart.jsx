import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const STATUS_LABELS = {
  em_andamento: 'Em Andamento',
  aguardando_pericia: 'Aguard. PerÃ­cia',
  pericia_realizada: 'PerÃ­cia Realizada',
  laudo_entregue: 'Laudo Entregue',
  encerrado: 'Encerrado',
  suspenso: 'Suspenso',
};

const STATUS_COLORS = [
  'hsl(221, 68%, 30%)',
  'hsl(42, 87%, 55%)',
  'hsl(160, 60%, 45%)',
  'hsl(200, 70%, 50%)',
  'hsl(220, 9%, 46%)',
  'hsl(0, 72%, 51%)',
];

export default function ProcessStatusChart({ processes }) {
  const data = Object.entries(
    (processes || []).reduce((acc, p) => {
      const status = p.status || 'em_andamento';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {})
  ).map(([key, value]) => ({
    name: STATUS_LABELS[key] || key,
    value,
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Nenhum processo cadastrado
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width="50%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              fontSize: '12px' 
            }} 
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div 
              className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
              style={{ backgroundColor: STATUS_COLORS[index % STATUS_COLORS.length] }} 
            />
            <span className="text-xs text-muted-foreground">{entry.name}</span>
            <span className="text-xs font-semibold">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
