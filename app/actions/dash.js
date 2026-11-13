"use server";

import { revalidatePath } from "next/cache";
import { getDashboardData } from "@/utils/dashboard";

export async function revalidateDashboard() {
  revalidatePath("/");
}

export async function getFreshDashboardData(userId) {
  if (!userId) return null;
  return await getDashboardData(userId);
}