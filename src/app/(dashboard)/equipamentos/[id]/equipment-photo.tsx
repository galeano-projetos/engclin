"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { uploadEquipmentPhoto, deleteEquipmentPhoto } from "../actions";

function compressImage(file: File, maxWidth: number, quality: number): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        quality
      );
    };
    img.src = URL.createObjectURL(file);
  });
}

interface EquipmentPhotoProps {
  equipmentId: string;
  hasPhoto: boolean;
  canEdit: boolean;
}

export function EquipmentPhoto({ equipmentId, hasPhoto, canEdit }: EquipmentPhotoProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const photoSrc = hasPhoto ? `/api/equipment/${equipmentId}/photo?t=${Date.now()}` : null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Selecione uma imagem.");
      return;
    }

    // Comprimir imagem antes do preview
    const compressed = await compressImage(file, 1200, 0.7);
    setSelectedFile(compressed);
    setPreview(URL.createObjectURL(compressed));
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("photo", selectedFile);

    const result = await uploadEquipmentPhoto(equipmentId, formData);

    if (result.error) {
      setError(result.error);
    } else {
      setPreview(null);
      setSelectedFile(null);
      router.refresh();
    }
    setUploading(false);
  }

  async function handleDelete() {
    setDeleting(true);
    setError("");

    const result = await deleteEquipmentPhoto(equipmentId);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
    setDeleting(false);
  }

  function handleCancel() {
    setPreview(null);
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Foto do Equipamento</h2>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {/* Foto atual ou preview */}
        <div className="mb-4 flex justify-center">
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="max-h-64 rounded-lg object-contain"
            />
          ) : photoSrc ? (
            <img
              src={photoSrc}
              alt="Foto do equipamento"
              className="max-h-64 rounded-lg object-contain"
            />
          ) : (
            <div className="flex h-48 w-full items-center justify-center rounded-lg bg-gray-100">
              <svg
                className="h-16 w-16 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Acoes */}
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            {preview ? (
              <>
                <Button onClick={handleUpload} loading={uploading}>
                  Salvar Foto
                </Button>
                <Button variant="secondary" onClick={handleCancel}>
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  onClick={() => fileRef.current?.click()}
                >
                  {hasPhoto ? "Trocar Foto" : "Adicionar Foto"}
                </Button>
                {hasPhoto && (
                  <Button variant="danger" onClick={handleDelete} loading={deleting}>
                    Remover Foto
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
