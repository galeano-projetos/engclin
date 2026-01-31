import { requirePermission } from "@/lib/auth/require-role";
import { getProviders } from "./actions";
import { ProviderPanel } from "./provider-panel";

export default async function FornecedoresPage() {
  await requirePermission("provider.view");
  const providers = await getProviders();

  const serialized = providers.map((p) => ({
    id: p.id,
    name: p.name,
    cnpj: p.cnpj,
    phone: p.phone,
    email: p.email,
    contactPerson: p.contactPerson,
    active: p.active,
  }));

  return <ProviderPanel providers={serialized} />;
}
