"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface NiimbotPrintButtonProps {
  equipmentName: string;
  patrimony: string | null;
  unitName: string;
  qrDataUrl: string | null;
}

type PrintStatus = "idle" | "connecting" | "printing" | "done" | "error";

export function NiimbotPrintButton({
  equipmentName,
  patrimony,
  unitName,
  qrDataUrl,
}: NiimbotPrintButtonProps) {
  const [status, setStatus] = useState<PrintStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [hasBluetooth, setHasBluetooth] = useState(false);

  useEffect(() => {
    setHasBluetooth(typeof navigator !== "undefined" && !!navigator.bluetooth);
  }, []);

  if (!hasBluetooth) return null;

  async function handlePrint() {
    if (!qrDataUrl) return;

    setStatus("connecting");
    setErrorMsg("");

    let client: InstanceType<
      typeof import("@mmote/niimbluelib").NiimbotBluetoothClient
    > | null = null;

    try {
      const { NiimbotBluetoothClient, ImageEncoder } = await import(
        "@mmote/niimbluelib"
      );

      client = new NiimbotBluetoothClient();
      await client.connect();

      setStatus("printing");

      // Create off-screen canvas (50mm x 30mm at 8px/mm = 400x240)
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 240;
      const ctx = canvas.getContext("2d")!;

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Load QR image
      const qrImg = await loadImage(qrDataUrl);

      // Draw QR on left side (180x180, centered vertically)
      const qrSize = 180;
      const qrY = (canvas.height - qrSize) / 2;
      ctx.drawImage(qrImg, 10, qrY, qrSize, qrSize);

      // Draw text on right side
      ctx.fillStyle = "#000000";

      // Equipment name (bold, max 2 lines)
      ctx.font = "bold 22px Arial, sans-serif";
      const nameLines = wrapText(ctx, equipmentName, 185);
      let textY = 40;
      for (const line of nameLines.slice(0, 2)) {
        ctx.fillText(line, 200, textY);
        textY += 28;
      }

      // Patrimony
      if (patrimony) {
        ctx.font = "18px Arial, sans-serif";
        textY += 10;
        ctx.fillText(patrimony, 200, textY);
        textY += 24;
      }

      // Unit name
      ctx.font = "16px Arial, sans-serif";
      ctx.fillStyle = "#555555";
      textY += patrimony ? 4 : 14;
      const unitLines = wrapText(ctx, unitName, 185);
      for (const line of unitLines.slice(0, 2)) {
        ctx.fillText(line, 200, textY);
        textY += 22;
      }

      // Encode and print
      const encoded = ImageEncoder.encodeCanvas(canvas, "left");
      const printTaskName = client.getPrintTaskType() ?? "B1";
      const printTask = client.abstraction.newPrintTask(printTaskName, {
        totalPages: 1,
        statusPollIntervalMs: 100,
        statusTimeoutMs: 8_000,
      });

      await printTask.printInit();
      await printTask.printPage(encoded, 1);
      await printTask.waitForFinished();
      await printTask.printEnd();

      setStatus("done");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao imprimir na Niimbot";
      setErrorMsg(msg);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    } finally {
      if (client?.isConnected()) {
        try {
          await client.disconnect();
        } catch {
          // ignore disconnect errors
        }
      }
    }
  }

  const isDisabled = !qrDataUrl || status === "connecting" || status === "printing";

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handlePrint}
        variant="secondary"
        disabled={isDisabled}
      >
        {status === "connecting" && (
          <>
            <svg className="mr-1.5 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Conectando...
          </>
        )}
        {status === "printing" && (
          <>
            <svg className="mr-1.5 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Imprimindo...
          </>
        )}
        {status === "done" && (
          <>
            <svg className="mr-1.5 h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Impresso!
          </>
        )}
        {status === "error" && "Tentar novamente"}
        {status === "idle" && "Imprimir Niimbot"}
      </Button>
      {status === "error" && errorMsg && (
        <span className="text-xs text-red-600">{errorMsg}</span>
      )}
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
