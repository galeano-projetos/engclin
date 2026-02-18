/**
 * MTBF (Mean Time Between Failures) e MTTR (Mean Time To Repair)
 *
 * MTTR = media de (closedAt - openedAt) em horas
 * MTBF = media dos intervalos (openedAt[i+1] - closedAt[i]) em horas, por equipamento
 */

interface TicketForCalc {
  equipmentId: string;
  openedAt: Date;
  closedAt: Date;
}

const MS_TO_HOURS = 1000 * 60 * 60;

/**
 * Calcula MTBF e MTTR para um unico equipamento.
 * Tickets devem estar ordenados por openedAt ASC.
 */
export function computeEquipmentMtbfMttr(tickets: TicketForCalc[]): {
  mtbf: number | null;
  mttr: number | null;
  ticketCount: number;
} {
  if (tickets.length === 0) {
    return { mtbf: null, mttr: null, ticketCount: 0 };
  }

  // MTTR: media dos tempos de reparo
  const repairTimes = tickets.map(
    (t) => (t.closedAt.getTime() - t.openedAt.getTime()) / MS_TO_HOURS
  );
  const mttr = repairTimes.reduce((a, b) => a + b, 0) / repairTimes.length;

  // MTBF: media dos intervalos entre falhas consecutivas
  const intervals: number[] = [];
  for (let i = 0; i < tickets.length - 1; i++) {
    const gap =
      (tickets[i + 1].openedAt.getTime() - tickets[i].closedAt.getTime()) /
      MS_TO_HOURS;
    if (gap > 0) intervals.push(gap);
  }
  const mtbf =
    intervals.length > 0
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length
      : null;

  return { mtbf, mttr, ticketCount: tickets.length };
}

/**
 * Calcula MTBF e MTTR globais para todo o tenant.
 * Tickets devem estar ordenados por [equipmentId ASC, openedAt ASC].
 */
export function computeGlobalMtbfMttr(tickets: TicketForCalc[]): {
  mtbf: number | null;
  mttr: number | null;
  totalTickets: number;
} {
  if (tickets.length === 0) {
    return { mtbf: null, mttr: null, totalTickets: 0 };
  }

  // MTTR flat: media de todos os tempos de reparo
  let totalRepairHours = 0;
  for (const t of tickets) {
    totalRepairHours +=
      (t.closedAt.getTime() - t.openedAt.getTime()) / MS_TO_HOURS;
  }
  const mttr = totalRepairHours / tickets.length;

  // MTBF: agrupar por equipamento, calcular intervalos, flatten
  const byEquipment = new Map<string, TicketForCalc[]>();
  for (const t of tickets) {
    const list = byEquipment.get(t.equipmentId) ?? [];
    list.push(t);
    byEquipment.set(t.equipmentId, list);
  }

  const allIntervals: number[] = [];
  for (const eqTickets of byEquipment.values()) {
    for (let i = 0; i < eqTickets.length - 1; i++) {
      const gap =
        (eqTickets[i + 1].openedAt.getTime() -
          eqTickets[i].closedAt.getTime()) /
        MS_TO_HOURS;
      if (gap > 0) allIntervals.push(gap);
    }
  }

  const mtbf =
    allIntervals.length > 0
      ? allIntervals.reduce((a, b) => a + b, 0) / allIntervals.length
      : null;

  return { mtbf, mttr, totalTickets: tickets.length };
}

/**
 * Formata horas em string legivel para o gestor.
 */
export function formatHours(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return "< 1 hora";
  if (hours < 48) return `${Math.round(hours)} h`;
  const days = Math.round(hours / 24);
  return `${days} dia${days !== 1 ? "s" : ""}`;
}
