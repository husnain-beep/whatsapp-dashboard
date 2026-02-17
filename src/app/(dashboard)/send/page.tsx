"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Loader2, X, Search } from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  phone: string;
  tags: string | null;
}

interface ContactList {
  id: string;
  name: string;
  _count: { members: number };
}

export default function QuickSendPage() {
  const t = useTranslations("quickSend");
  const tc = useTranslations("common");

  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(
    new Set()
  );
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [contactSearch, setContactSearch] = useState("");

  useEffect(() => {
    fetch("/api/contact-lists")
      .then((r) => r.json())
      .then((data) => setContactLists(data.lists || []));
    fetch("/api/contacts?limit=500")
      .then((r) => r.json())
      .then((data) => setContacts(data.contacts || []));
  }, []);

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.phone.includes(contactSearch)
  );

  const toggleContact = (id: string) => {
    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedContactIds(new Set(filteredContacts.map((c) => c.id)));
  };

  const clearAll = () => {
    setSelectedContactIds(new Set());
  };

  const totalRecipients = () => {
    let count = selectedContactIds.size;
    if (selectedListId) {
      const list = contactLists.find((l) => l.id === selectedListId);
      if (list) count += list._count.members;
    }
    return count;
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error(t("messageRequired"));
      return;
    }
    if (!selectedListId && selectedContactIds.size === 0) {
      toast.error(t("noRecipients"));
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/quick-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          contactListId: selectedListId || undefined,
          contactIds: selectedContactIds.size > 0
            ? [...selectedContactIds]
            : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(
          t("sendSuccess", { count: data.totalMessages })
        );
        setMessage("");
        setSelectedListId("");
        setSelectedContactIds(new Set());
      } else {
        toast.error(data.error || t("sendFailed"));
      }
    } catch {
      toast.error(t("sendFailed"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">{t("title")}</h2>

      {/* Contact List Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{t("selectContactList")}</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedListId}
            onChange={(e) => setSelectedListId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">{t("noList")}</option>
            {contactLists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name} ({list._count.members} {tc("total").toLowerCase()})
              </option>
            ))}
          </select>
          {selectedListId && (
            <p className="text-sm text-muted-foreground mt-2">
              {t("listSelected")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Individual Contact Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {t("selectContacts")}{" "}
              {selectedContactIds.size > 0 && (
                <Badge variant="secondary" className="ms-2">
                  {selectedContactIds.size}
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                {t("selectAll")}
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                {t("clearAll")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={tc("search")}
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              className="ps-9"
              dir="ltr"
            />
          </div>

          {/* Selected contacts chips */}
          {selectedContactIds.size > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {[...selectedContactIds].map((id) => {
                const contact = contacts.find((c) => c.id === id);
                if (!contact) return null;
                return (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="gap-1 cursor-pointer"
                    onClick={() => toggleContact(id)}
                  >
                    {contact.name}
                    <X className="h-3 w-3" />
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Contact list */}
          <div className="max-h-64 overflow-y-auto border rounded-md divide-y">
            {filteredContacts.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">
                {tc("noResults")}
              </p>
            ) : (
              filteredContacts.map((contact) => (
                <label
                  key={contact.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={selectedContactIds.has(contact.id)}
                    onCheckedChange={() => toggleContact(contact.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {contact.name}
                    </p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {contact.phone}
                    </p>
                  </div>
                  {contact.tags && (
                    <span className="text-xs text-muted-foreground">
                      {contact.tags}
                    </span>
                  )}
                </label>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Message */}
      <Card>
        <CardHeader>
          <CardTitle>{t("message")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label className="text-sm text-muted-foreground">
            {t("messageHelp")}
          </Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("messagePlaceholder")}
            rows={5}
            className="resize-none"
          />
          {message && (
            <p className="text-xs text-muted-foreground">
              {message.length} / 4096
            </p>
          )}
        </CardContent>
      </Card>

      {/* Send Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("recipientCount", { count: totalRecipients() })}
        </p>
        <Button
          size="lg"
          onClick={handleSend}
          disabled={
            sending || !message.trim() || totalRecipients() === 0
          }
        >
          {sending ? (
            <Loader2 className="h-4 w-4 me-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 me-2" />
          )}
          {t("sendNow")}
        </Button>
      </div>
    </div>
  );
}
