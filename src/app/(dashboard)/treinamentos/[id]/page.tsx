import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-role";
import { hasPermission } from "@/lib/auth/permissions";
import { notFound } from "next/navigation";
import { TrainingDetails } from "./training-details";

interface PageProps {
  params: Promise<{ id: string }>;
}

function toEmbedUrl(url: string): string | null {
  if (!url) return null;

  // YouTube: watch?v=ID or youtu.be/ID
  const ytMatch =
    url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/) ||
    url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // Vimeo: vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // Se ja for URL embed, retorna como esta
  if (url.includes("/embed/") || url.includes("player.vimeo.com")) {
    return url;
  }

  return url;
}

export default async function TrainingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { tenantId, role, id: userId } = await requirePermission("training.view");
  const canComplete = hasPermission(role, "training.complete");
  const canManage = hasPermission(role, "training.create");

  const training = await prisma.training.findFirst({
    where: { id, tenantId },
    include: {
      equipmentType: { select: { name: true } },
      completions: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { completedAt: "desc" },
      },
    },
  });

  if (!training) {
    notFound();
  }

  const now = new Date();
  const myCompletion = training.completions.find((c) => c.userId === userId);

  let myStatus: "pending" | "valid" | "expired" = "pending";
  let myExpiresAt: string | null = null;

  if (myCompletion) {
    const expiry = new Date(myCompletion.completedAt);
    expiry.setMonth(expiry.getMonth() + training.validityMonths);
    myExpiresAt = expiry.toLocaleDateString("pt-BR");
    myStatus = expiry > now ? "valid" : "expired";
  }

  const allCompletions = training.completions.map((c) => {
    const expiry = new Date(c.completedAt);
    expiry.setMonth(expiry.getMonth() + training.validityMonths);
    return {
      userId: c.user.id,
      userName: c.user.name,
      completedAt: c.completedAt.toLocaleDateString("pt-BR"),
      expiresAt: expiry.toLocaleDateString("pt-BR"),
      status: (expiry > now ? "valid" : "expired") as "valid" | "expired",
    };
  });

  return (
    <TrainingDetails
      training={{
        id: training.id,
        title: training.title,
        description: training.description,
        equipmentTypeName: training.equipmentType?.name ?? null,
        videoUrl: training.videoUrl,
        embedUrl: training.videoUrl ? toEmbedUrl(training.videoUrl) : null,
        validityMonths: training.validityMonths,
      }}
      myStatus={myStatus}
      myCompletedAt={myCompletion?.completedAt.toLocaleDateString("pt-BR") ?? null}
      myExpiresAt={myExpiresAt}
      canComplete={canComplete}
      canManage={canManage}
      completions={allCompletions}
    />
  );
}
