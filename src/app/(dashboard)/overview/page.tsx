"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Megaphone, Send, TrendingUp } from "lucide-react";

interface Stats {
  totalContacts: number;
  activeCampaigns: number;
  messagesSentToday: number;
  successRate: number;
}

interface ActiveCampaign {
  id: string;
  name: string;
  status: string;
  sentCount: number;
  totalMessages: number;
}

interface RecentMessage {
  id: string;
  contactName: string;
  status: string;
  sentAt: string | null;
  scheduledAt: string;
}

export default function OverviewPage() {
  const t = useTranslations("overview");
  const tc = useTranslations("campaigns");
  const tm = useTranslations("messages");
  const [stats, setStats] = useState<Stats>({
    totalContacts: 0,
    activeCampaigns: 0,
    messagesSentToday: 0,
    successRate: 0,
  });
  const [campaigns, setCampaigns] = useState<ActiveCampaign[]>([]);
  const [messages, setMessages] = useState<RecentMessage[]>([]);

  const fetchData = async () => {
    try {
      const [statsRes, campaignsRes, messagesRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/campaigns?status=RUNNING,SCHEDULED"),
        fetch("/api/messages?limit=10"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        setCampaigns(data.campaigns || []);
      }
      if (messagesRes.ok) {
        const data = await messagesRes.json();
        setMessages(data.messages || []);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: t("totalContacts"),
      value: stats.totalContacts,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: t("activeCampaigns"),
      value: stats.activeCampaigns,
      icon: Megaphone,
      color: "text-green-600",
    },
    {
      title: t("messagesSentToday"),
      value: stats.messagesSentToday,
      icon: Send,
      color: "text-purple-600",
    },
    {
      title: t("successRate"),
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t("title")}</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("activeCampaignsList")}</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("noCampaigns")}
              </p>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => {
                  const progress =
                    campaign.totalMessages > 0
                      ? Math.round(
                          (campaign.sentCount / campaign.totalMessages) * 100
                        )
                      : 0;
                  return (
                    <div key={campaign.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {campaign.name}
                        </span>
                        <Badge variant="outline">
                          {tc(`status.${campaign.status}`)}
                        </Badge>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {campaign.sentCount} / {campaign.totalMessages}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("recentMessages")}</CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("noMessages")}
              </p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{msg.contactName}</span>
                    <Badge
                      variant={
                        msg.status === "SENT"
                          ? "default"
                          : msg.status === "FAILED"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {tm(`status.${msg.status}`)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
