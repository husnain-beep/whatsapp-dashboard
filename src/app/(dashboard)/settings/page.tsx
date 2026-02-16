"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [showKey, setShowKey] = useState(false);
  const [form, setForm] = useState({
    wasenderApiKey: "",
    defaultIntervalSeconds: 300,
    maxMessagesPerDay: 288,
  });
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setMaskedKey(data.wasenderApiKey);
        setForm({
          wasenderApiKey: "",
          defaultIntervalSeconds: data.defaultIntervalSeconds || 300,
          maxMessagesPerDay: data.maxMessagesPerDay || 288,
        });
      });
  }, []);

  const handleSave = async () => {
    const payload: Record<string, unknown> = {
      defaultIntervalSeconds: form.defaultIntervalSeconds,
      maxMessagesPerDay: form.maxMessagesPerDay,
    };
    if (form.wasenderApiKey.trim()) {
      payload.wasenderApiKey = form.wasenderApiKey;
    }

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      setMaskedKey(data.wasenderApiKey);
      setForm({ ...form, wasenderApiKey: "" });
      toast.success(t("saved"));
    } else {
      toast.error(tc("error"));
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/settings/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: form.wasenderApiKey || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(t("connectionSuccess"));
      } else {
        toast.error(data.error || t("connectionFailed"));
      }
    } catch {
      toast.error(t("connectionFailed"));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">{t("title")}</h2>

      <Card>
        <CardHeader>
          <CardTitle>{t("apiKey")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {maskedKey && (
            <p className="text-sm text-muted-foreground">
              Current: {maskedKey}
            </p>
          )}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showKey ? "text" : "password"}
                value={form.wasenderApiKey}
                onChange={(e) =>
                  setForm({ ...form, wasenderApiKey: e.target.value })
                }
                placeholder={t("apiKeyPlaceholder")}
                dir="ltr"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || (!form.wasenderApiKey && !maskedKey)}
            >
              {t("testConnection")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("defaultInterval")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("defaultIntervalHelp")}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={60}
                max={86400}
                value={form.defaultIntervalSeconds}
                onChange={(e) =>
                  setForm({
                    ...form,
                    defaultIntervalSeconds: parseInt(e.target.value) || 300,
                  })
                }
                className="w-32"
                dir="ltr"
              />
              <span className="text-sm text-muted-foreground">
                = {(form.defaultIntervalSeconds / 60).toFixed(0)} min
              </span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>{t("maxMessagesPerDay")}</Label>
            <Input
              type="number"
              min={1}
              max={1000}
              value={form.maxMessagesPerDay}
              onChange={(e) =>
                setForm({
                  ...form,
                  maxMessagesPerDay: parseInt(e.target.value) || 288,
                })
              }
              className="w-32"
              dir="ltr"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave}>{tc("save")}</Button>
    </div>
  );
}
