"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Contact {
  id: string;
  name: string;
  phone: string;
  tags: string | null;
}

interface ContactListDetail {
  id: string;
  name: string;
  description: string | null;
  members: { contact: Contact }[];
  _count: { members: number };
}

export default function ContactListDetailPage() {
  const t = useTranslations("contactLists");
  const tc = useTranslations("common");
  const params = useParams();
  const id = params.id as string;

  const [list, setList] = useState<ContactListDetail | null>(null);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchList() {
      const res = await fetch(`/api/contact-lists/${id}`);
      if (res.ok && !cancelled) setList(await res.json());
    }

    fetchList();
    return () => { cancelled = true; };
  }, [id, refreshKey]);

  const fetchContacts = async () => {
    const res = await fetch("/api/contacts?limit=1000");
    if (res.ok) {
      const data = await res.json();
      setAllContacts(data.contacts);
    }
  };

  const memberIds = new Set(list?.members.map((m) => m.contact.id) || []);

  const availableContacts = allContacts.filter(
    (c) =>
      !memberIds.has(c.id) &&
      (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm))
  );

  const handleAddMembers = async () => {
    if (selected.size === 0) return;
    const res = await fetch(`/api/contact-lists/${id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactIds: Array.from(selected) }),
    });
    if (res.ok) {
      toast.success(tc("success"));
      setAddDialogOpen(false);
      setSelected(new Set());
      setRefreshKey((k) => k + 1);
    }
  };

  const handleRemoveMember = async (contactId: string) => {
    const res = await fetch(`/api/contact-lists/${id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactIds: [contactId] }),
    });
    if (res.ok) {
      toast.success(tc("success"));
      setRefreshKey((k) => k + 1);
    }
  };

  const toggleSelect = (contactId: string) => {
    const next = new Set(selected);
    if (next.has(contactId)) next.delete(contactId);
    else next.add(contactId);
    setSelected(next);
  };

  if (!list) return <p>{tc("loading")}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/contact-lists">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold">{list.name}</h2>
          {list.description && (
            <p className="text-muted-foreground">{list.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Badge variant="secondary">
          {t("members", { count: list._count.members })}
        </Badge>
        <Dialog
          open={addDialogOpen}
          onOpenChange={(open) => {
            setAddDialogOpen(open);
            if (open) fetchContacts();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 me-2" />
              {t("addMembers")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{t("selectContacts")}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={tc("search")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 max-h-60">
              {availableContacts.map((contact) => (
                <label
                  key={contact.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(contact.id)}
                    onChange={() => toggleSelect(contact.id)}
                  />
                  <span className="flex-1">{contact.name}</span>
                  <span className="text-sm text-muted-foreground" dir="ltr">
                    {contact.phone}
                  </span>
                </label>
              ))}
              {availableContacts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {tc("noResults")}
                </p>
              )}
            </div>
            <Button onClick={handleAddMembers} disabled={selected.size === 0}>
              {t("addMembers")} ({selected.size})
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tc("name")}</TableHead>
              <TableHead>{tc("phone")}</TableHead>
              <TableHead>{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  {tc("noResults")}
                </TableCell>
              </TableRow>
            ) : (
              list.members.map(({ contact }) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell dir="ltr">{contact.phone}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(contact.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
