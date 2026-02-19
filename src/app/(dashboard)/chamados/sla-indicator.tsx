"use client";

import { useEffect, useState } from "react";

interface SlaIndicatorProps {
  deadline: string; // ISO string
}

function getTimeRemaining(deadline: Date): { label: string; status: "ok" | "warning" | "danger" } {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  if (diff <= 0) {
    // SLA estourado
    const overMs = Math.abs(diff);
    const overMin = Math.floor(overMs / 60_000);
    if (overMin < 60) {
      return { label: `${overMin}min atrasado`, status: "danger" };
    }
    const overH = Math.floor(overMin / 60);
    if (overH < 24) {
      return { label: `${overH}h atrasado`, status: "danger" };
    }
    return { label: `${Math.floor(overH / 24)}d atrasado`, status: "danger" };
  }

  const totalMin = Math.floor(diff / 60_000);
  const totalSla = deadline.getTime() - (deadline.getTime() - diff); // total remaining

  if (totalMin < 60) {
    return {
      label: `${totalMin}min`,
      status: totalMin <= 5 ? "warning" : "ok",
    };
  }

  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours < 24) {
    return {
      label: mins > 0 ? `${hours}h${mins}m` : `${hours}h`,
      status: hours < 1 ? "warning" : "ok",
    };
  }

  const days = Math.floor(hours / 24);
  return { label: `${days}d ${hours % 24}h`, status: "ok" };
}

const statusStyles = {
  ok: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800 font-semibold",
};

const dotStyles = {
  ok: "bg-green-500",
  warning: "bg-amber-500 animate-pulse",
  danger: "bg-red-500 animate-pulse",
};

export function SlaIndicator({ deadline }: SlaIndicatorProps) {
  const [info, setInfo] = useState(() => getTimeRemaining(new Date(deadline)));

  useEffect(() => {
    const interval = setInterval(() => {
      setInfo(getTimeRemaining(new Date(deadline)));
    }, 30_000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs ${statusStyles[info.status]}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotStyles[info.status]}`} />
      {info.label}
    </span>
  );
}
