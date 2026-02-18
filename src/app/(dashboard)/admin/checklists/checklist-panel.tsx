"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  createChecklistTemplate,
  addChecklistItem,
  removeChecklistItem,
  deleteChecklistTemplate,
  toggleChecklistActive,
} from "./actions";

interface ChecklistItemData {
  id: string;
  description: string;
  order: number;
}

interface ChecklistTemplateData {
  id: string;
  name: string;
  active: boolean;
  equipmentType: { id: string; name: string };
  items: ChecklistItemData[];
  resultCount: number;
}

interface EquipmentTypeOption {
  id: string;
  name: string;
}

export function ChecklistPanel({
  templates,
  equipmentTypes,
}: {
  templates: ChecklistTemplateData[];
  equipmentTypes: EquipmentTypeOption[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
  const [itemCreating, setItemCreating] = useState(false);
  const [itemError, setItemError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const typeOptions = equipmentTypes.map((t) => ({ value: t.id, label: t.name }));

  async function handleCreate(formData: FormData) {
    setCreating(true);
    setError("");
    const result = await createChecklistTemplate(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setShowForm(false);
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir este checklist?")) return;
    setDeletingId(id);
    setDeleteError("");
    const result = await deleteChecklistTemplate(id);
    if (result.error) {
      setDeleteError(result.error);
    }
    setDeletingId(null);
  }

  async function handleToggle(id: string) {
    setTogglingId(id);
    await toggleChecklistActive(id);
    setTogglingId(null);
  }

  async function handleAddItem(templateId: string, formData: FormData) {
    setItemCreating(true);
    setItemError("");
    const result = await addChecklistItem(templateId, formData);
    if (result.error) {
      setItemError(result.error);
    } else {
      setAddingItemTo(null);
    }
    setItemCreating(false);
  }

  async function handleRemoveItem(itemId: string) {
    if (!confirm("Remover este item?")) return;
    setRemovingItemId(itemId);
    await removeChecklistItem(itemId);
    setRemovingItemId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Checklists</h1>
          <p className="mt-1 text-sm text-gray-500">
            {templates.length} checklist{templates.length !== 1 && "s"} cadastrado{templates.length !== 1 && "s"}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Novo Checklist"}
        </Button>
      </div>

      {showForm && (
        <div className="mt-4 rounded-lg border bg-blue-50 p-4">
          <form action={handleCreate} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                id="name"
                name="name"
                label="Nome do Checklist *"
                placeholder="Ex: Checklist Preventiva Monitor"
                required
              />
              <Select
                id="equipmentTypeId"
                name="equipmentTypeId"
                label="Tipo de Equipamento *"
                placeholder="Selecione..."
                options={typeOptions}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={creating}>
              Criar Checklist
            </Button>
          </form>
        </div>
      )}

      {deleteError && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {deleteError}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {templates.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-400">
            Nenhum checklist cadastrado.
          </div>
        ) : (
          templates.map((t) => (
            <div key={t.id} className="rounded-lg border bg-white shadow-sm">
              <div
                className="flex cursor-pointer items-start justify-between p-4"
                onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{t.name}</p>
                    <Badge variant={t.active ? "success" : "muted"}>
                      {t.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {t.equipmentType.name} | {t.items.length} item{t.items.length !== 1 && "s"} |{" "}
                    {t.resultCount} resultado{t.resultCount !== 1 && "s"}
                  </p>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="secondary"
                    onClick={() => handleToggle(t.id)}
                    loading={togglingId === t.id}
                  >
                    {t.active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(t.id)}
                    loading={deletingId === t.id}
                  >
                    Excluir
                  </Button>
                </div>
              </div>

              {expandedId === t.id && (
                <div className="border-t px-4 pb-4 pt-3">
                  {t.items.length === 0 ? (
                    <p className="text-sm text-gray-400">Nenhum item cadastrado.</p>
                  ) : (
                    <ol className="space-y-2">
                      {t.items.map((item, idx) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between rounded border bg-gray-50 px-3 py-2"
                        >
                          <span className="text-sm text-gray-700">
                            {idx + 1}. {item.description}
                          </span>
                          <Button
                            variant="ghost"
                            onClick={() => handleRemoveItem(item.id)}
                            loading={removingItemId === item.id}
                          >
                            Remover
                          </Button>
                        </li>
                      ))}
                    </ol>
                  )}

                  {addingItemTo === t.id ? (
                    <form
                      action={(formData) => handleAddItem(t.id, formData)}
                      className="mt-3 flex items-end gap-2"
                    >
                      <div className="flex-1">
                        <Input
                          id={`item-desc-${t.id}`}
                          name="description"
                          label="Descricao do Item"
                          placeholder="Ex: Verificar tensao de saida"
                          required
                        />
                      </div>
                      <Button type="submit" loading={itemCreating}>
                        Adicionar
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => { setAddingItemTo(null); setItemError(""); }}
                      >
                        Cancelar
                      </Button>
                    </form>
                  ) : (
                    <Button
                      variant="secondary"
                      className="mt-3"
                      onClick={() => setAddingItemTo(t.id)}
                    >
                      + Adicionar Item
                    </Button>
                  )}

                  {itemError && addingItemTo === t.id && (
                    <p className="mt-2 text-sm text-red-600">{itemError}</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
