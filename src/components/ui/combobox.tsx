"use client";

import { useState, useRef, useEffect, useId, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ComboboxProps {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  required?: boolean;
  id?: string;
  className?: string;
}

export function Combobox({
  label,
  error,
  options,
  placeholder,
  name,
  defaultValue,
  value: controlledValue,
  onChange,
  required,
  id,
  className,
}: ComboboxProps) {
  const generatedId = useId();
  const comboboxId = id || generatedId;
  const listboxId = `${comboboxId}-listbox`;

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const selectedValue = isControlled ? controlledValue : internalValue;

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Derive the display text from the selected value
  const selectedOption = options.find((opt) => opt.value === selectedValue);

  // Filter options based on query
  const filteredOptions =
    query === ""
      ? options
      : options.filter((opt) =>
          opt.label.toLowerCase().includes(query.toLowerCase())
        );

  const updateValue = useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.({ target: { value: newValue } });
    },
    [isControlled, onChange]
  );

  const selectOption = useCallback(
    (optionValue: string) => {
      updateValue(optionValue);
      const opt = options.find((o) => o.value === optionValue);
      setQuery(opt ? opt.label : "");
      setIsOpen(false);
      setHighlightedIndex(-1);
    },
    [updateValue, options]
  );

  const clearSelection = useCallback(() => {
    updateValue("");
    setQuery("");
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }, [updateValue]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // Restore display text if dropdown is closed without selection
        setQuery(selectedOption ? selectedOption.label : "");
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedOption]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  // Sync query when selectedValue changes externally
  useEffect(() => {
    if (!isOpen) {
      const opt = options.find((o) => o.value === selectedValue);
      setQuery(opt ? opt.label : "");
    }
  }, [selectedValue, options, isOpen]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(true);
    setHighlightedIndex(-1);
  }

  function handleInputFocus() {
    setIsOpen(true);
    // Select all text on focus so user can start typing to filter
    if (inputRef.current && selectedValue) {
      inputRef.current.select();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
        selectOption(filteredOptions[highlightedIndex].value);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setQuery(selectedOption ? selectedOption.label : "");
      setHighlightedIndex(-1);
    }
  }

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label
          htmlFor={comboboxId}
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {/* Hidden input for form submission */}
        <input type="hidden" name={name} value={selectedValue} />

        <input
          ref={inputRef}
          id={comboboxId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            highlightedIndex >= 0
              ? `${comboboxId}-option-${highlightedIndex}`
              : undefined
          }
          aria-invalid={!!error}
          aria-describedby={error ? `${comboboxId}-error` : undefined}
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          required={required && !selectedValue}
          className={cn(
            "block w-full rounded-md border px-3 py-2.5 pr-8 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
            className
          )}
        />

        {/* Clear button */}
        {selectedValue && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
            aria-label="Limpar seleção"
            tabIndex={-1}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Dropdown */}
        {isOpen && (
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="absolute z-50 mt-1 max-h-[240px] w-full overflow-auto rounded-md border border-gray-300 bg-white py-1 text-sm shadow-lg"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-gray-500">
                Nenhum resultado encontrado
              </li>
            ) : (
              filteredOptions.map((opt, index) => (
                <li
                  key={opt.value}
                  id={`${comboboxId}-option-${index}`}
                  role="option"
                  aria-selected={opt.value === selectedValue}
                  className={cn(
                    "cursor-pointer px-3 py-2",
                    index === highlightedIndex && "bg-blue-50 text-blue-700",
                    opt.value === selectedValue &&
                      index !== highlightedIndex &&
                      "bg-blue-50/50 font-medium",
                    index !== highlightedIndex &&
                      opt.value !== selectedValue &&
                      "hover:bg-gray-100"
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectOption(opt.value);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {opt.label}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      {error && (
        <p id={`${comboboxId}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
