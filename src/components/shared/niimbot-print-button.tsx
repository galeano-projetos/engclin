"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface NiimbotPrintButtonProps {
  equipmentName: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  patrimony: string | null;
  unitName: string;
  qrDataUrl: string | null;
}

type PrintStatus = "idle" | "preview" | "connecting" | "printing" | "done" | "error";

// Canvas dimensions: 70mm x 40mm at 8px/mm = 560x320
const CANVAS_W = 560;
const CANVAS_H = 320;

export function NiimbotPrintButton({
  equipmentName,
  brand,
  model,
  serialNumber,
  patrimony,
  unitName,
  qrDataUrl,
}: NiimbotPrintButtonProps) {
  const [status, setStatus] = useState<PrintStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [hasBluetooth, setHasBluetooth] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setHasBluetooth(typeof navigator !== "undefined" && !!navigator.bluetooth);
  }, []);

  const drawLabel = useCallback(
    async (canvas: HTMLCanvasElement) => {
      if (!qrDataUrl) return;

      const ctx = canvas.getContext("2d")!;

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Load QR image
      const qrImg = await loadImage(qrDataUrl);

      // Draw QR on left side (220x220, centered vertically)
      const qrSize = 220;
      const qrY = (CANVAS_H - qrSize) / 2;
      ctx.drawImage(qrImg, 16, qrY, qrSize, qrSize);

      // Draw text on right side
      const textX = 252;
      const maxTextW = 290;
      ctx.fillStyle = "#000000";

      // Equipment name (bold, max 2 lines)
      ctx.font = "bold 24px Arial, sans-serif";
      const nameLines = wrapText(ctx, equipmentName, maxTextW);
      let textY = 45;
      for (const line of nameLines.slice(0, 2)) {
        ctx.fillText(line, textX, textY);
        textY += 30;
      }

      // Brand / Model
      const brandModel = [brand, model].filter(Boolean).join(" ");
      if (brandModel) {
        ctx.font = "18px Arial, sans-serif";
        textY += 6;
        const bmLines = wrapText(ctx, brandModel, maxTextW);
        ctx.fillText(bmLines[0], textX, textY);
        textY += 24;
      }

      // Serial Number
      if (serialNumber) {
        ctx.font = "16px Arial, sans-serif";
        textY += 4;
        ctx.fillText(`S/N: ${serialNumber}`, textX, textY);
        textY += 22;
      }

      // Patrimony
      if (patrimony) {
        ctx.font = "18px Arial, sans-serif";
        textY += 4;
        ctx.fillText(`Pat: ${patrimony}`, textX, textY);
        textY += 24;
      }

      // Unit name
      ctx.font = "15px Arial, sans-serif";
      ctx.fillStyle = "#555555";
      textY += 6;
      const unitLines = wrapText(ctx, unitName, maxTextW);
      for (const line of unitLines.slice(0, 2)) {
        ctx.fillText(line, textX, textY);
        textY += 20;
      }

      // Border around label
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, CANVAS_W - 2, CANVAS_H - 2);
    },
    [qrDataUrl, equipmentName, brand, model, serialNumber, patrimony, unitName]
  );

  // Draw preview when entering preview state
  useEffect(() => {
    if (status === "preview" && previewCanvasRef.current) {
      drawLabel(previewCanvasRef.current);
    }
  }, [status, drawLabel]);

  if (!hasBluetooth) return null;

  function handleShowPreview() {
    if (!qrDataUrl) return;
    setStatus("preview");
    setErrorMsg("");
  }

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

      // Create off-screen canvas with same dimensions as preview
      const canvas = document.createElement("canvas");
      canvas.width = CANVAS_W;
      canvas.height = CANVAS_H;
      await drawLabel(canvas);

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

  // Idle state: just show the button
  if (status === "idle") {
    return (
      <Button onClick={handleShowPreview} variant="secondary" disabled={!qrDataUrl}>
        Imprimir Niimbot
      </Button>
    );
  }

  // Done state
  if (status === "done") {
    return (
      <Button variant="secondary" disabled>
        <svg className="mr-1.5 h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        Impresso!
      </Button>
    );
  }

  // Preview / connecting / printing / error states: show label preview + actions
  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">Prévia da Etiqueta (70×40mm)</h4>
        <button
          onClick={() => { setStatus("idle"); setErrorMsg(""); }}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Fechar prévia"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Canvas preview scaled to fit */}
      <div className="flex justify-center rounded border border-gray-300 bg-white p-2">
        <canvas
          ref={previewCanvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="h-auto w-full max-w-[420px]"
        />
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-3">
        {status === "preview" && (
          <Button onClick={handlePrint} variant="primary">
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 12h.008v.008h-.008V12zm-2.25 0h.008v.008H16.5V12z" />
            </svg>
            Conectar e Imprimir
          </Button>
        )}
        {status === "connecting" && (
          <Button variant="primary" disabled>
            <svg className="mr-1.5 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Conectando...
          </Button>
        )}
        {status === "printing" && (
          <Button variant="primary" disabled>
            <svg className="mr-1.5 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Imprimindo...
          </Button>
        )}
        {status === "error" && (
          <Button onClick={handlePrint} variant="primary">
            Tentar novamente
          </Button>
        )}
        {status !== "connecting" && status !== "printing" && (
          <Button variant="secondary" onClick={() => { setStatus("idle"); setErrorMsg(""); }}>
            Cancelar
          </Button>
        )}
      </div>

      {status === "error" && errorMsg && (
        <p className="mt-2 text-xs text-red-600">{errorMsg}</p>
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
