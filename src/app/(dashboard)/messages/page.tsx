"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Message {
  id: string;
  status: string;
  scheduledAt: string;
  sentAt: string | null;
  errorMessage: string | null;
  contact: { name: string; phone: string };
  campaign: { name: string };
}

const statusOptions = [
  "ALL",
  "PENDING",
  "QUEUED",
  "SENDING",
  "SENT",
  "FAILED",
  "RETRY",
  "CANCELLED",
];

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  QUEUED: "outline",
  SENDING: "outline",
  SENT: "default",
  FAILED: "destructive",
  RETRY: "secondary",
  CANCELLED: "destructive",
};

export default function MessagesPage() {
  const t = useTranslations("messages");
  const tc = useTranslations("common");
  const [messages, setMessages] = useState<Message[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    let cancelled = false;

    async function fetchMessages() {
      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
      });
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/messages?${params}`);
      if (res.ok && !cancelled) {
        const data = await res.json();
        setMessages(data.messages);
        setTotal(data.total);
      }
    }

    fetchMessages();
    const interval = setInterval(fetchMessages, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [page, statusFilter]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t("title")}</h2>

      <div className="flex gap-4">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status === "ALL" ? t("allStatuses") : t(`status.${status}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("contact")}</TableHead>
              <TableHead>{tc("phone")}</TableHead>
              <TableHead>{t("campaign")}</TableHead>
              <TableHead>{tc("status")}</TableHead>
              <TableHead>{t("scheduledAt")}</TableHead>
              <TableHead>{t("sentAt")}</TableHead>
              <TableHead>{t("errorDetails")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {t("noMessages")}
                </TableCell>
              </TableRow>
            ) : (
              messages.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell className="font-medium">
                    {msg.contact.name}
                  </TableCell>
                  <TableCell dir="ltr">{msg.contact.phone}</TableCell>
                  <TableCell>{msg.campaign.name}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[msg.status] || "secondary"}>
                      {t(`status.${msg.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell dir="ltr" className="text-sm">
                    {new Date(msg.scheduledAt).toLocaleString()}
                  </TableCell>
                  <TableCell dir="ltr" className="text-sm">
                    {msg.sentAt
                      ? new Date(msg.sentAt).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-destructive max-w-48 truncate">
                    {msg.errorMessage || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            {tc("back")}
          </Button>
          <span className="flex items-center text-sm">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            {tc("next")}
          </Button>
        </div>
      )}
    </div>
  );
}
