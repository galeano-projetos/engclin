"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchEquipments, type SearchResult } from "@/app/(dashboard)/search-actions";

interface CommandItem {
  id: string;
  label: string;
  group: string;
  href?: string;
  icon?: string;
}

interface CommandBarProps {
  navItems: CommandItem[];
}

export function CommandBar({ navItems }: CommandBarProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dynamicResults, setDynamicResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const router = useRouter();

  // Keyboard shortcut to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setHighlightedIndex(0);
      setDynamicResults([]);
    }
  }, [open]);

  // Debounced async search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setDynamicResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const results = await searchEquipments(query);
        setDynamicResults(results);
      });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Filter static items
  const filteredNavItems = query.length > 0
    ? navItems.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      )
    : navItems;

  // Build combined list
  const allItems: { id: string; label: string; subtitle?: string; group: string; href: string }[] = [];

  // Navigation items
  const navGroup = filteredNavItems.filter((i) => i.group === "Navegacao");
  const actionGroup = filteredNavItems.filter((i) => i.group === "Acoes");

  for (const item of navGroup) {
    if (item.href) allItems.push({ id: item.id, label: item.label, group: "Navegacao", href: item.href });
  }
  for (const item of actionGroup) {
    if (item.href) allItems.push({ id: item.id, label: item.label, group: "Acoes", href: item.href });
  }

  // Dynamic equipment results
  for (const result of dynamicResults) {
    allItems.push({
      id: result.id,
      label: result.title,
      subtitle: result.subtitle || undefined,
      group: "Equipamentos",
      href: result.href,
    });
  }

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : allItems.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allItems[highlightedIndex]) {
        navigate(allItems[highlightedIndex].href);
      }
    }
  }

  // Scroll highlighted into view
  useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const el = listRef.current.children[highlightedIndex] as HTMLElement;
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  if (!open) return null;

  // Group items for display
  let currentGroup = "";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-lg bg-white shadow-2xl">
        {/* Search input */}
        <div className="flex items-center border-b px-4">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setHighlightedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar equipamentos, paginas, acoes..."
            className="w-full border-0 px-3 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
          />
          <kbd className="hidden rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs text-gray-400 sm:inline">
            Esc
          </kbd>
        </div>

        {/* Results list */}
        <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2">
          {allItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              {query.length > 0
                ? isPending
                  ? "Buscando..."
                  : "Nenhum resultado encontrado."
                : "Digite para buscar..."}
            </div>
          ) : (
            allItems.map((item, index) => {
              const showGroupHeader = item.group !== currentGroup;
              if (showGroupHeader) currentGroup = item.group;

              return (
                <div key={`${item.group}-${item.id}`}>
                  {showGroupHeader && (
                    <div className="px-4 pb-1 pt-3 text-xs font-semibold uppercase text-gray-400">
                      {item.group}
                    </div>
                  )}
                  <button
                    type="button"
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                      index === highlightedIndex
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => navigate(item.href)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{item.label}</div>
                      {item.subtitle && (
                        <div className="truncate text-xs text-gray-400">{item.subtitle}</div>
                      )}
                    </div>
                    {index === highlightedIndex && (
                      <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-400">
                        Enter
                      </kbd>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2 text-xs text-gray-400">
          <span className="hidden sm:inline">
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 text-[10px]">↑↓</kbd> navegar
            {" "}
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 text-[10px]">Enter</kbd> abrir
            {" "}
            <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 text-[10px]">Esc</kbd> fechar
          </span>
        </div>
      </div>
    </div>
  );
}
