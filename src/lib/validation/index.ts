import { z } from "zod";
import {
  Criticality,
  EquipmentStatus,
  OwnershipType,
  ServiceType,
  Periodicity,
  Urgency,
  MedicalPhysicsType,
  UserRole,
} from "@prisma/client";

// Helper to validate enum values
function zodEnum<T extends string>(enumObj: Record<string, T>, name: string) {
  const values = Object.values(enumObj) as [T, ...T[]];
  return z.enum(values, { message: `Valor invalido para ${name}` });
}

export const criticalitySchema = zodEnum(Criticality, "criticidade");
export const equipmentStatusSchema = zodEnum(EquipmentStatus, "status");
export const ownershipTypeSchema = zodEnum(OwnershipType, "tipo de propriedade");
export const serviceTypeSchema = zodEnum(ServiceType, "tipo de servico");
export const periodicitySchema = zodEnum(Periodicity, "periodicidade");
export const urgencySchema = zodEnum(Urgency, "urgencia");
export const physicsTypeSchema = zodEnum(MedicalPhysicsType, "tipo de teste");
export const userRoleSchema = zodEnum(UserRole, "perfil");

export const dateSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: "Data invalida" }
);

export const optionalDateSchema = z.string().optional().refine(
  (val) => !val || !isNaN(Date.parse(val)),
  { message: "Data invalida" }
);

export const positiveDecimalSchema = z.string().optional().refine(
  (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
  { message: "Valor numerico invalido" }
);

export const positiveIntSchema = z.string().optional().refine(
  (val) => !val || (!isNaN(parseInt(val)) && parseInt(val) >= 0),
  { message: "Numero inteiro invalido" }
);

export const urlSchema = z.string().optional().refine(
  (val) => !val || val.startsWith("http://") || val.startsWith("https://"),
  { message: "URL deve iniciar com http:// ou https://" }
);

export const emailSchema = z.string().email({ message: "Email invalido" });

export const passwordSchema = z.string().min(6, { message: "Senha deve ter no minimo 6 caracteres" });

export function safeFormGet(formData: FormData, key: string): string {
  return ((formData.get(key) as string) || "").slice(0, 5000);
}
