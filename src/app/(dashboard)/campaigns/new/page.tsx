"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface ContactList {
  id: string;
  name: string;
  _count: { members: number };
}

const steps = ["step1", "step2", "step3", "step4"] as const;

export default function NewCampaignPage() {
  const t = useTranslations("campaigns");
  const tc = useTranslations("common");
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    contactListId: "",
    messageTemplate: "",
    startDate: (() => {
      const now = new Date();
      const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000 + 5 * 60000); // Add 5 minutes
      return local.toISOString().slice(0, 16);
    })(),
    spreadOverDays: 1,
    intervalSeconds: 300,
  });

  useEffect(() => {
    fetch("/api/contact-lists")
      .then((r) => r.json())
      .then((data) => setContactLists(data.lists || []));
  }, []);

  const selectedList = contactLists.find((l) => l.id === form.contactListId);
  const contactCount = selectedList?._count.members || 0;
  const messagesPerDay = Math.ceil(contactCount / form.spreadOverDays);
  const hoursPerDay = (messagesPerDay * form.intervalSeconds) / 3600;

  const canNext = () => {
    switch (currentStep) {
      case 0:
        return form.name.trim() && form.contactListId;
      case 1:
        return form.messageTemplate.trim();
      case 2:
        return form.startDate && form.spreadOverDays > 0;
      default:
        return true;
    }
  };

  const handleCreate = async (startImmediately: boolean) => {
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          startDate: new Date(form.startDate).toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || tc("error"));
        return;
      }

      const campaign = await res.json();

      if (startImmediately) {
        const startRes = await fetch(
          `/api/campaigns/${campaign.id}/start`,
          { method: "POST" }
        );

        if (!startRes.ok) {
          const data = await startRes.json();
          toast.error(data.error || tc("error"));
          return;
        }
      }

      toast.success(tc("success"));
      router.push(`/campaigns/${campaign.id}`);
    } catch {
      toast.error(tc("error"));
    } finally {
      setLoading(false);
    }
  };

  const previewText = form.messageTemplate.replace(
    /\{\{name\}\}/g,
    "Ahmed"
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/campaigns">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold">{t("newCampaign")}</h2>
      </div>

      {/* Step Indicators */}
      <div className="flex gap-2">
        {steps.map((step, i) => (
          <Badge
            key={step}
            variant={i === currentStep ? "default" : i < currentStep ? "default" : "outline"}
            className={`cursor-pointer ${i <= currentStep ? "" : "opacity-50"}`}
            onClick={() => i < currentStep && setCurrentStep(i)}
          >
            {i + 1}. {t(step)}
          </Badge>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("step1")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("campaignName")}</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("selectContactList")}</Label>
              <Select
                value={form.contactListId}
                onValueChange={(v) =>
                  setForm({ ...form, contactListId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectContactList")} />
                </SelectTrigger>
                <SelectContent>
                  {contactLists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name} ({list._count.members})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedList && (
                <p className="text-sm text-muted-foreground">
                  {selectedList._count.members} contacts
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Message Template */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("step2")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("messageTemplate")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("templateHelp")}
              </p>
              <div className="flex gap-2 mb-2">
                <Badge
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() =>
                    setForm({
                      ...form,
                      messageTemplate: form.messageTemplate + "{{name}}",
                    })
                  }
                >
                  {"{{name}}"}
                </Badge>
              </div>
              <Textarea
                value={form.messageTemplate}
                onChange={(e) =>
                  setForm({ ...form, messageTemplate: e.target.value })
                }
                rows={5}
                required
              />
            </div>
            {form.messageTemplate && (
              <div className="space-y-2">
                <Label>{t("templatePreview")}</Label>
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 whitespace-pre-wrap">
                  {previewText}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Schedule */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("step3")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("startDate")}</Label>
              <Input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("spreadOverDays")}</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={form.spreadOverDays}
                onChange={(e) =>
                  setForm({
                    ...form,
                    spreadOverDays: parseInt(e.target.value) || 1,
                  })
                }
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("interval")}</Label>
              <Select
                value={String(form.intervalSeconds)}
                onValueChange={(v) =>
                  setForm({ ...form, intervalSeconds: parseInt(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">1 min</SelectItem>
                  <SelectItem value="120">2 min</SelectItem>
                  <SelectItem value="300">5 min</SelectItem>
                  <SelectItem value="600">10 min</SelectItem>
                  <SelectItem value="900">15 min</SelectItem>
                  <SelectItem value="1800">30 min</SelectItem>
                  <SelectItem value="3600">60 min</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <p>
                <strong>{tc("total")}:</strong> {contactCount} messages
              </p>
              <p>
                <strong>{t("messagesPerDay", { count: messagesPerDay })}:</strong>
              </p>
              <p>
                <strong>~{hoursPerDay.toFixed(1)} hours/day</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("step4")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{t("campaignName")}</p>
                <p className="font-medium">{form.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">
                  {t("selectContactList")}
                </p>
                <p className="font-medium">
                  {selectedList?.name} ({contactCount})
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("startDate")}</p>
                <p className="font-medium" dir="ltr">
                  {new Date(form.startDate).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("spreadOverDays")}</p>
                <p className="font-medium">{form.spreadOverDays}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("interval")}</p>
                <p className="font-medium">
                  {t("intervalMinutes", {
                    minutes: form.intervalSeconds / 60,
                  })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{tc("total")}</p>
                <p className="font-medium">{contactCount} messages</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-muted-foreground text-sm mb-2">
                {t("messageTemplate")}
              </p>
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 whitespace-pre-wrap text-sm">
                {previewText}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          disabled={currentStep === 0}
          onClick={() => setCurrentStep(currentStep - 1)}
        >
          {tc("back")}
        </Button>
        <div className="flex gap-2">
          {currentStep < 3 ? (
            <Button
              disabled={!canNext()}
              onClick={() => setCurrentStep(currentStep + 1)}
            >
              {tc("next")}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                disabled={loading}
                onClick={() => handleCreate(false)}
              >
                {tc("create")}
              </Button>
              <Button
                disabled={loading}
                onClick={() => handleCreate(true)}
              >
                {t("createAndStart")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
