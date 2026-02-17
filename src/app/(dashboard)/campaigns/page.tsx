"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  status: string;
  totalMessages: number;
  sentCount: number;
  failedCount: number;
  startDate: string;
  spreadOverDays: number;
  contactList: { name: string } | null;
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  SCHEDULED: "outline",
  RUNNING: "default",
  PAUSED: "secondary",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

export default function CampaignsPage() {
  const t = useTranslations("campaigns");
  const tc = useTranslations("common");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchCampaigns() {
      const res = await fetch("/api/campaigns");
      if (res.ok && !cancelled) {
        const data = await res.json();
        setCampaigns(data.campaigns);
      }
    }

    fetchCampaigns();
    return () => { cancelled = true; };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(tc("confirm") + "?")) return;
    const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(tc("success"));
      const updated = await fetch("/api/campaigns");
      if (updated.ok) {
        const data = await updated.json();
        setCampaigns(data.campaigns);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("title")}</h2>
        <Link href="/campaigns/new">
          <Button>
            <Plus className="h-4 w-4 me-2" />
            {t("createCampaign")}
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <p className="text-muted-foreground">{t("noCampaigns")}</p>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => {
            const progress =
              campaign.totalMessages > 0
                ? Math.round(
                    (campaign.sentCount / campaign.totalMessages) * 100
                  )
                : 0;

            return (
              <Card key={campaign.id}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="hover:underline"
                      >
                        {campaign.name}
                      </Link>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {campaign.contactList?.name ? `${campaign.contactList.name} · ` : ""}
                      {new Date(campaign.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusColors[campaign.status] || "secondary"}>
                      {t(`status.${campaign.status}`)}
                    </Badge>
                    {campaign.status === "DRAFT" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(campaign.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                {campaign.totalMessages > 0 && (
                  <CardContent>
                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {t("sent")}: {campaign.sentCount}
                        </span>
                        <span>
                          {t("failed")}: {campaign.failedCount}
                        </span>
                        <span>
                          {tc("total")}: {campaign.totalMessages}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
