"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

import type {
  EquipmentByStatusData,
  EquipmentByCriticalityData,
  MaintenanceByMonthData,
  TicketsByUrgencyData,
  CalibrationStatusData,
} from "./dashboard-data";

const STATUS_COLORS: Record<string, string> = {
  Ativo: "#22c55e",
  Inativo: "#94a3b8",
  "Em Manutenção": "#f59e0b",
  Descartado: "#ef4444",
};

const CRITICALITY_COLORS: Record<string, string> = {
  Alta: "#ef4444",
  Média: "#f59e0b",
  Baixa: "#22c55e",
};

const URGENCY_COLORS: Record<string, string> = {
  Baixa: "#94a3b8",
  Média: "#3b82f6",
  Alta: "#f59e0b",
  Crítica: "#ef4444",
};

const CALIBRATION_COLORS: Record<string, string> = {
  "Em dia": "#22c55e",
  "Vencendo (30d)": "#f59e0b",
  Vencida: "#ef4444",
  Realizada: "#3b82f6",
};

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">{title}</h3>
      {children}
    </div>
  );
}

function renderLabel(props: { name?: string; percent?: number }) {
  const { name, percent } = props;
  if (!name || !percent || percent < 0.05) return "";
  return `${name} (${(percent * 100).toFixed(0)}%)`;
}

export function EquipmentByStatusChart({
  data,
}: {
  data: EquipmentByStatusData[];
}) {
  if (data.length === 0) {
    return (
      <ChartCard title="Equipamentos por Status">
        <p className="text-center text-sm text-gray-400">Sem dados</p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Equipamentos por Status">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={renderLabel}
            labelLine={false}
          >
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_COLORS[entry.status] || "#94a3b8"}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function EquipmentByCriticalityChart({
  data,
}: {
  data: EquipmentByCriticalityData[];
}) {
  if (data.length === 0) {
    return (
      <ChartCard title="Equipamentos por Criticidade">
        <p className="text-center text-sm text-gray-400">Sem dados</p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Equipamentos por Criticidade">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="criticality"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={renderLabel}
            labelLine={false}
          >
            {data.map((entry) => (
              <Cell
                key={entry.criticality}
                fill={CRITICALITY_COLORS[entry.criticality] || "#94a3b8"}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function MaintenanceByMonthChart({
  data,
}: {
  data: MaintenanceByMonthData[];
}) {
  return (
    <ChartCard title="Manutenções por Mês (últimos 6 meses)">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" fontSize={12} />
          <YAxis allowDecimals={false} fontSize={12} />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="preventivas"
            name="Preventivas"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="corretivas"
            name="Corretivas"
            fill="#f59e0b"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TicketsByUrgencyChart({
  data,
}: {
  data: TicketsByUrgencyData[];
}) {
  if (data.length === 0) {
    return (
      <ChartCard title="Chamados Abertos por Urgência">
        <p className="text-center text-sm text-gray-400">
          Nenhum chamado aberto
        </p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Chamados Abertos por Urgência">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="urgency"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={renderLabel}
            labelLine={false}
          >
            {data.map((entry) => (
              <Cell
                key={entry.urgency}
                fill={URGENCY_COLORS[entry.urgency] || "#94a3b8"}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CalibrationStatusChart({
  data,
}: {
  data: CalibrationStatusData[];
}) {
  if (data.length === 0) {
    return (
      <ChartCard title="Status das Calibrações">
        <p className="text-center text-sm text-gray-400">Sem dados</p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Status das Calibrações">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={renderLabel}
            labelLine={false}
          >
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={CALIBRATION_COLORS[entry.status] || "#94a3b8"}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
