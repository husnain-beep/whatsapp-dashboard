"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Users, Pencil } from "lucide-react";
import { toast } from "sonner";

interface ContactList {
  id: string;
  name: string;
  description: string | null;
  _count: { members: number };
}

export default function ContactListsPage() {
  const t = useTranslations("contactLists");
  const tc = useTranslations("common");
  const [lists, setLists] = useState<ContactList[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<ContactList | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const fetchLists = useCallback(async () => {
    const res = await fetch("/api/contact-lists");
    if (res.ok) {
      const data = await res.json();
      setLists(data.lists);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingList
      ? `/api/contact-lists/${editingList.id}`
      : "/api/contact-lists";
    const method = editingList ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast.success(tc("success"));
      setDialogOpen(false);
      setEditingList(null);
      setForm({ name: "", description: "" });
      fetchLists();
    } else {
      toast.error(tc("error"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteList") + "?")) return;
    const res = await fetch(`/api/contact-lists/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(tc("success"));
      fetchLists();
    }
  };

  const handleEdit = (list: ContactList) => {
    setEditingList(list);
    setForm({ name: list.name, description: list.description || "" });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("title")}</h2>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingList(null);
              setForm({ name: "", description: "" });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 me-2" />
              {t("createList")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingList ? t("editList") : t("createList")}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("listName")}</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("description")}</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
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

      {lists.length === 0 ? (
        <p className="text-muted-foreground">{t("noLists")}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <Card key={list.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    <Link
                      href={`/contact-lists/${list.id}`}
                      className="hover:underline"
                    >
                      {list.name}
                    </Link>
                  </CardTitle>
                  {list.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {list.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(list)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(list.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">
                    {t("members", { count: list._count.members })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
