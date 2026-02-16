"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Play, Pause, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  text: string;
  status: string;
  scheduledAt: string;
  sentAt: string | null;
  errorMessage: string | null;
  contact: { name: string; phone: string };
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  messageTemplate: string;
  totalMessages: number;
  sentCount: number;
  failedCount: number;
  startDate: string;
  spreadOverDays: number;
  intervalSeconds: number;
  contactList: { name: string };
  messages: Message[];
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  QUEUED: "outline",
  SENDING: "outline",
  SENT: "default",
  FAILED: "destructive",
  RETRY: "secondary",
  CANCELLED: "destructive",
};

export default function CampaignDetailPage() {
  const t = useTranslations("campaigns");
  const tc = useTranslations("common");
  const tm = useTranslations("messages");
  const params = useParams();
  const id = params.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  const fetchCampaign = useCallback(async () => {
    const res = await fetch(`/api/campaigns/${id}`);
    if (res.ok) setCampaign(await res.json());
  }, [id]);

  useEffect(() => {
    fetchCampaign();
    const interval = setInterval(fetchCampaign, 10000);
    return () => clearInterval(interval);
  }, [fetchCampaign]);

  const handleAction = async (action: "start" | "pause" | "cancel") => {
    if (action === "cancel" && !confirm(t("cancelConfirm"))) return;

    const res = await fetch(`/api/campaigns/${id}/${action}`, {
      method: "POST",
    });

    if (res.ok) {
      toast.success(tc("success"));
      fetchCampaign();
    } else {
      const data = await res.json();
      toast.error(data.error || tc("error"));
    }
  };

  if (!campaign) return <p>{tc("loading")}</p>;

  const progress =
    campaign.totalMessages > 0
      ? Math.round((campaign.sentCount / campaign.totalMessages) * 100)
      : 0;

  const pendingCount =
    campaign.totalMessages - campaign.sentCount - campaign.failedCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/campaigns">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{campaign.name}</h2>
          <p className="text-muted-foreground">
            {campaign.contactList.name} &middot;{" "}
            {new Date(campaign.startDate).toLocaleString()}
          </p>
        </div>
        <Badge
          variant={
            campaign.status === "RUNNING"
              ? "default"
              : campaign.status === "CANCELLED"
                ? "destructive"
                : "secondary"
          }
        >
          {t(`status.${campaign.status}`)}
        </Badge>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {["DRAFT", "PAUSED"].includes(campaign.status) && (
          <Button onClick={() => handleAction("start")}>
            <Play className="h-4 w-4 me-2" />
            {campaign.status === "PAUSED" ? t("resume") : t("start")}
          </Button>
        )}
        {["RUNNING", "SCHEDULED"].includes(campaign.status) && (
          <Button variant="outline" onClick={() => handleAction("pause")}>
            <Pause className="h-4 w-4 me-2" />
            {t("pause")}
          </Button>
        )}
        {!["COMPLETED", "CANCELLED"].includes(campaign.status) && (
          <Button variant="destructive" onClick={() => handleAction("cancel")}>
            <XCircle className="h-4 w-4 me-2" />
            {t("cancelCampaign")}
          </Button>
        )}
      </div>

      {/* Progress Card */}
      {campaign.totalMessages > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("progress")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {campaign.sentCount}
                </p>
                <p className="text-sm text-muted-foreground">{t("sent")}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {campaign.failedCount}
                </p>
                <p className="text-sm text-muted-foreground">{t("failed")}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-muted-foreground">
                  {pendingCount > 0 ? pendingCount : 0}
                </p>
                <p className="text-sm text-muted-foreground">{t("pending")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {tm("title")} ({campaign.messages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tm("contact")}</TableHead>
                  <TableHead>{tc("phone")}</TableHead>
                  <TableHead>{tc("status")}</TableHead>
                  <TableHead>{tm("scheduledAt")}</TableHead>
                  <TableHead>{tm("sentAt")}</TableHead>
                  <TableHead>{tm("errorDetails")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaign.messages.map((msg) => (
                  <TableRow key={msg.id}>
                    <TableCell className="font-medium">
                      {msg.contact.name}
                    </TableCell>
                    <TableCell dir="ltr">{msg.contact.phone}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[msg.status] || "secondary"}>
                        {tm(`status.${msg.status}`)}
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
