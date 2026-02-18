"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { NiimbotPrintButton } from "@/components/shared/niimbot-print-button";

interface QrCodeSectionProps {
  equipmentId: string;
  equipmentName: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  patrimony: string | null;
  unitName: string;
}

export function QrCodeSection({
  equipmentId,
  equipmentName,
  brand,
  model,
  serialNumber,
  patrimony,
  unitName,
}: QrCodeSectionProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/equipamento/${equipmentId}`
      : "";

  useEffect(() => {
    if (!showQr || qrDataUrl) return;

    setLoading(true);

    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(publicUrl, {
        width: 256,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      })
        .then((url: string) => {
          setQrDataUrl(url);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [showQr, qrDataUrl, publicUrl]);

  function handlePrint() {
    const printWindow = window.open("", "_blank", "width=400,height=500");
    if (!printWindow) return;

    const brandModel = [brand, model].filter(Boolean).join(" ");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Etiqueta - ${equipmentName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .label {
            width: 60mm;
            padding: 4mm;
            border: 1px solid #ccc;
            text-align: center;
          }
          .label img {
            width: 35mm;
            height: 35mm;
          }
          .label h1 {
            font-size: 10pt;
            margin-top: 2mm;
            line-height: 1.2;
          }
          .label .info {
            font-size: 7pt;
            color: #333;
            margin-top: 1mm;
            line-height: 1.3;
          }
          .label .info strong {
            font-size: 7pt;
          }
          @media print {
            body { min-height: auto; }
            .label { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="label">
          <img src="${qrDataUrl}" alt="QR Code" />
          <h1>${equipmentName}</h1>
          ${brandModel ? `<p class="info">${brandModel}</p>` : ""}
          ${serialNumber ? `<p class="info"><strong>S/N:</strong> ${serialNumber}</p>` : ""}
          ${patrimony ? `<p class="info"><strong>Pat:</strong> ${patrimony}</p>` : ""}
          <p class="info" style="color:#555; margin-top:2mm;">${unitName}</p>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  if (!showQr) {
    return (
      <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">QR Code</h2>
            <p className="text-sm text-gray-500">
              Gere uma etiqueta com QR Code para consulta pública deste
              equipamento.
            </p>
          </div>
          <Button onClick={() => setShowQr(true)}>Gerar QR Code</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">QR Code</h2>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-gray-500">
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Gerando QR Code...
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {/* QR Code preview */}
            <div className="flex flex-col items-center rounded-lg border p-4">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="QR Code do equipamento"
                  className="h-48 w-48"
                />
              )}
              <p className="mt-2 max-w-[200px] truncate text-xs text-gray-400">
                {publicUrl}
              </p>
            </div>

            {/* Info e ações */}
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Página pública
                </p>
                <p className="text-sm text-gray-500">
                  Ao escanear o QR Code, qualquer pessoa poderá ver as
                  informações públicas e o status da calibração deste
                  equipamento, sem precisar de login.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handlePrint}>Imprimir Etiqueta</Button>
                <NiimbotPrintButton
                  equipmentName={equipmentName}
                  brand={brand}
                  model={model}
                  serialNumber={serialNumber}
                  patrimony={patrimony}
                  unitName={unitName}
                  qrDataUrl={qrDataUrl}
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (qrDataUrl) {
                      const link = document.createElement("a");
                      link.download = `qrcode_${patrimony || equipmentId}.png`;
                      link.href = qrDataUrl;
                      link.click();
                    }
                  }}
                >
                  Baixar PNG
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
