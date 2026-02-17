"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, RefreshCw, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const TIMEZONES = [
  "Asia/Riyadh",
  "Asia/Dubai",
  "Asia/Kuwait",
  "Asia/Baghdad",
  "Asia/Beirut",
  "Asia/Amman",
  "Asia/Damascus",
  "Africa/Cairo",
  "Africa/Casablanca",
  "Africa/Algiers",
  "Africa/Tunis",
  "Africa/Tripoli",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Istanbul",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Jakarta",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [showKey, setShowKey] = useState(false);
  const [form, setForm] = useState({
    wasenderApiKey: "",
    defaultIntervalSeconds: 300,
    maxMessagesPerDay: 288,
    activeStartTime: "08:00",
    activeEndTime: "22:00",
    timezone: "Asia/Riyadh",
  });
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    status: string;
    message?: string;
    session?: Record<string, unknown>;
    user?: Record<string, unknown>;
  } | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const fetchConnectionStatus = async () => {
    setCheckingStatus(true);
    try {
      const res = await fetch("/api/settings/connection-status");
      const data = await res.json();
      setConnectionStatus(data);
    } catch {
      setConnectionStatus({
        connected: false,
        status: "error",
        message: "Failed to check",
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setMaskedKey(data.wasenderApiKey);
        setForm({
          wasenderApiKey: "",
          defaultIntervalSeconds: data.defaultIntervalSeconds || 300,
          maxMessagesPerDay: data.maxMessagesPerDay || 288,
          activeStartTime: data.activeStartTime || "08:00",
          activeEndTime: data.activeEndTime || "22:00",
          timezone: data.timezone || "Asia/Riyadh",
        });
        if (data.wasenderApiKey) {
          fetchConnectionStatus();
        }
      });
  }, []);

  const handleSave = async () => {
    const payload: Record<string, unknown> = {
      defaultIntervalSeconds: form.defaultIntervalSeconds,
      maxMessagesPerDay: form.maxMessagesPerDay,
      activeStartTime: form.activeStartTime,
      activeEndTime: form.activeEndTime,
      timezone: form.timezone,
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("title")}</h2>
        <Button onClick={handleSave}>{tc("save")}</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("connectionStatus")}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchConnectionStatus}
              disabled={checkingStatus || !maskedKey}
            >
              <RefreshCw
                className={`h-4 w-4 me-1 ${checkingStatus ? "animate-spin" : ""}`}
              />
              {t("refreshStatus")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!maskedKey && !connectionStatus ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
              <span>{t("statusNoKey")}</span>
            </div>
          ) : checkingStatus && !connectionStatus ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{t("statusChecking")}</span>
            </div>
          ) : connectionStatus?.connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <Badge variant="outline" className="border-green-600 text-green-600">
                  {t("statusConnected")}
                </Badge>
              </div>
              {connectionStatus.user && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {"name" in connectionStatus.user && connectionStatus.user.name != null && (
                    <>
                      <span className="text-muted-foreground">{t("whatsappUser")}</span>
                      <span dir="ltr">{String(connectionStatus.user.name)}</span>
                    </>
                  )}
                  {"phone" in connectionStatus.user && connectionStatus.user.phone != null && (
                    <>
                      <span className="text-muted-foreground">{t("phoneNumber")}</span>
                      <span dir="ltr">{String(connectionStatus.user.phone)}</span>
                    </>
                  )}
                </div>
              )}
              {connectionStatus.session && "status" in connectionStatus.session && connectionStatus.session.status != null && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">{tc("status")}</span>
                  <span>{String(connectionStatus.session.status)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-500">
                {connectionStatus?.status === "invalid_key"
                  ? t("statusInvalidKey")
                  : connectionStatus?.status === "no_key"
                    ? t("statusNoKey")
                    : connectionStatus?.message || t("statusDisconnected")}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle>{t("activeHours")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("activeHoursHelp")}
          </p>

          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <Label>{t("startTime")}</Label>
              <Input
                type="time"
                value={form.activeStartTime}
                onChange={(e) =>
                  setForm({ ...form, activeStartTime: e.target.value })
                }
                className="w-36"
                dir="ltr"
              />
            </div>
            <span className="mt-6">—</span>
            <div className="space-y-1">
              <Label>{t("endTime")}</Label>
              <Input
                type="time"
                value={form.activeEndTime}
                onChange={(e) =>
                  setForm({ ...form, activeEndTime: e.target.value })
                }
                className="w-36"
                dir="ltr"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>{t("timezone")}</Label>
            <select
              value={form.timezone}
              onChange={(e) =>
                setForm({ ...form, timezone: e.target.value })
              }
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              dir="ltr"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave}>{tc("save")}</Button>
    </div>
  );
}
