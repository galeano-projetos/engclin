"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadEquipmentDocument, deleteEquipmentDocument } from "../actions";

interface DocumentData {
  id: string;
  name: string;
  mimeType: string;
  fileSize: number;
  createdAt: Date;
}

interface EquipmentDocumentsProps {
  equipmentId: string;
  documents: DocumentData[];
  canEdit: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const mimeIcons: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WEBP",
};

export function EquipmentDocuments({
  equipmentId,
  documents,
  canEdit,
}: EquipmentDocumentsProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("document", selectedFile);
    formData.append("name", fileName);

    const result = await uploadEquipmentDocument(equipmentId, formData);

    if (result.error) {
      setError(result.error);
    } else {
      setShowForm(false);
      setSelectedFile(null);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    }
    setUploading(false);
  }

  async function handleDelete(docId: string) {
    setDeletingId(docId);
    setError("");

    const result = await deleteEquipmentDocument(docId);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
    setDeletingId(null);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    // Sugerir nome baseado no arquivo se campo vazio
    if (!fileName) {
      setFileName(file.name.replace(/\.[^/.]+$/, ""));
    }
  }

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Documentos ({documents.length})
        </h2>
        {canEdit && (
          <Button
            variant="secondary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancelar" : "Anexar Documento"}
          </Button>
        )}
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {/* Form de upload */}
        {showForm && (
          <form
            onSubmit={handleUpload}
            className="mb-4 space-y-3 rounded-lg border border-teal-200 bg-teal-50 p-4"
          >
            <Input
              label="Nome do documento"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Ex: Manual Tecnico, Nota Fiscal..."
              required
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Arquivo (PDF, JPEG, PNG — max 10 MB)
              </label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                required
                className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-teal-700 hover:file:bg-teal-100"
              />
            </div>
            <Button type="submit" loading={uploading} disabled={!selectedFile}>
              Enviar
            </Button>
          </form>
        )}

        {/* Lista de documentos */}
        {documents.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum documento anexado.</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
                    {mimeIcons[doc.mimeType] || "DOC"}
                  </span>
                  <div>
                    <a
                      href={`/api/equipment-document/${doc.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-teal-600 hover:text-teal-700"
                    >
                      {doc.name}
                    </a>
                    <p className="text-xs text-gray-400">
                      {formatFileSize(doc.fileSize)} — {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={`/api/equipment-document/${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Visualizar"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </a>
                  {canEdit && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="rounded p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Excluir documento"
                    >
                      {deletingId === doc.id ? (
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
