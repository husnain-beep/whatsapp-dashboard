"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Upload, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  phone: string;
  notes: string | null;
  tags: string | null;
  isGroup: boolean;
  contactListMemberships: {
    contactList: { name: string };
  }[];
}

export default function ContactsPage() {
  const t = useTranslations("contacts");
  const tc = useTranslations("common");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    notes: "",
    tags: "",
  });

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchContacts() {
      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
        ...(search && { search }),
      });
      const res = await fetch(`/api/contacts?${params}`);
      if (res.ok && !cancelled) {
        const data = await res.json();
        setContacts(data.contacts);
        setTotal(data.total);
      }
    }

    fetchContacts();
    return () => { cancelled = true; };
  }, [page, search, refreshKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingContact
      ? `/api/contacts/${editingContact.id}`
      : "/api/contacts";
    const method = editingContact ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast.success(tc("success"));
      setDialogOpen(false);
      setEditingContact(null);
      setForm({ name: "", phone: "", notes: "", tags: "" });
      setRefreshKey((k) => k + 1);
    } else {
      const data = await res.json();
      toast.error(data.error || tc("error"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(tc("success"));
      setRefreshKey((k) => k + 1);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setForm({
      name: contact.name,
      phone: contact.phone,
      notes: contact.notes || "",
      tags: contact.tags || "",
    });
    setDialogOpen(true);
  };

  const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/contacts/import", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      toast.success(t("imported", { count: data.imported }));
      if (data.skipped > 0) {
        toast.warning(`${data.skipped} duplicates skipped`);
      }
      setImportDialogOpen(false);
      setRefreshKey((k) => k + 1);
    } else {
      toast.error(data.error || t("importError"));
    }
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("title")}</h2>
        <div className="flex gap-2">
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 me-2" />
                {t("importCsv")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("importCsv")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleImport} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t("csvFormat")}
                </p>
                <Input type="file" name="file" accept=".csv" required />
                <Button type="submit">{t("importCsv")}</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingContact(null);
                setForm({ name: "", phone: "", notes: "", tags: "" });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 me-2" />
                {t("addContact")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingContact ? t("editContact") : t("addContact")}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("name")}</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("phone")}</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder={t("phonePlaceholder")}
                    required
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("tags")}</Label>
                  <Input
                    value={form.tags}
                    onChange={(e) =>
                      setForm({ ...form, tags: e.target.value })
                    }
                    placeholder={t("tagsPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("notes")}</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    {tc("cancel")}
                  </Button>
                  <Button type="submit">{tc("save")}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={tc("search")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("phone")}</TableHead>
              <TableHead>{t("tags")}</TableHead>
              <TableHead>{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  {tc("noResults")}
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell dir="ltr">{contact.phone}</TableCell>
                  <TableCell>
                    {contact.tags?.split(",").map((tag) => (
                      <Badge key={tag} variant="secondary" className="me-1">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(contact)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(contact.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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
