import "next-auth";
import { UserRole, Plan } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      tenantId?: string;
      tenantName?: string;
      plan?: Plan;
      mustChangePassword?: boolean;
    };
  }
}
