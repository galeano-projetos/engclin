"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { ChatMessage, EquipmentOption } from "./chat-actions";
import {
  sendChatMessage,
  createTicketFromChat,
} from "./chat-actions";

interface ChatPanelProps {
  equipments: EquipmentOption[];
}

export function ChatPanel({ equipments }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ticketCreated, setTicketCreated] = useState<{
    id: string;
  } | null>(null);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await sendChatMessage(newMessages, equipments);
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response,
      };
      setMessages([...newMessages, assistantMessage]);

      // Check if the AI wants to create a ticket
      const match = response.match(
        /\[CRIAR_CHAMADO:\s*equipmentId="([^"]+)"\s*description="([^"]+)"\s*urgency="([^"]+)"\]/
      );
      if (match) {
        setCreatingTicket(true);
        const result = await createTicketFromChat(match[1], match[2], match[3]);
        setCreatingTicket(false);
        if (result.success && result.ticketId) {
          setTicketCreated({ id: result.ticketId });
          // Remove the command from display
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return [
                ...prev.slice(0, -1),
                {
                  ...last,
                  content: last.content
                    .replace(
                      /\[CRIAR_CHAMADO:\s*equipmentId="[^"]+"\s*description="[^"]+"\s*urgency="[^"]+"\]/,
                      ""
                    )
                    .trim(),
                },
              ];
            }
            return prev;
          });
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Houve um erro ao criar o chamado: ${result.error || "Tente novamente."}`,
            },
          ]);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Desculpe, ocorreu um erro. Tente novamente.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setMessages([]);
    setTicketCreated(null);
    setInput("");
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col rounded-lg border bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100">
            <svg
              className="h-5 w-5 text-teal-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Assistente de Chamados
            </h3>
            <p className="text-xs text-gray-500">
              {equipments.length} equipamentos disponiveis
            </p>
          </div>
        </div>
        <Button onClick={handleReset} variant="ghost" className="text-xs">
          Nova conversa
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg
              className="h-16 w-16 text-gray-200 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={0.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
              />
            </svg>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">
              Abrir chamado por conversa
            </h3>
            <p className="text-xs text-gray-400 max-w-sm">
              Descreva o problema que esta tendo com um equipamento. Eu vou te
              ajudar a identificar o equipamento, classificar a urgencia e abrir
              o chamado automaticamente.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <p className="whitespace-pre-line">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-gray-100 px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}

        {creatingTicket && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-teal-50 border border-teal-200 px-4 py-2.5 text-sm text-teal-700">
              Criando chamado...
            </div>
          </div>
        )}

        {ticketCreated && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
              <p className="text-sm font-medium text-green-800">
                Chamado criado com sucesso!
              </p>
              <Link
                href={`/chamados/${ticketCreated.id}`}
                className="mt-1 inline-block text-sm text-green-600 hover:text-green-800 underline"
              >
                Ver chamado
              </Link>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t px-4 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              ticketCreated
                ? "Chamado criado! Clique em 'Nova conversa' para abrir outro."
                : "Descreva o problema com o equipamento..."
            }
            disabled={loading || !!ticketCreated}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
          />
          <Button
            type="submit"
            disabled={!input.trim() || loading || !!ticketCreated}
            loading={loading}
          >
            Enviar
          </Button>
        </form>
      </div>
    </div>
  );
}
