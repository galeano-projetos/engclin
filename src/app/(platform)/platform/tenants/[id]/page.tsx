import { getTenantDetail } from "../../actions";
import { TenantDetailClient } from "./tenant-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TenantDetailPage({ params }: Props) {
  const { id } = await params;
  const tenant = await getTenantDetail(id);

  return <TenantDetailClient tenant={tenant} />;
}
