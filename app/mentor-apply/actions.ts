"use server";

import { createClient } from "@/lib/supabase/server";

const allowedFocusAreas = new Set([
  "Career transitions", "Burnout", "Grief & bereavement", "Relationships", "Identity", "Leadership", "Life changes",
]);

export async function createMentorApplicationAction(input: {
  fullName: string;
  professionalTitle: string;
  licensingBoard: string;
  licenseNumber: string;
  professionalEmail: string;
  affiliation: string;
  focusAreas: string[];
  proofPath: string;
}) {
  const fullName = input.fullName.trim();
  const professionalTitle = input.professionalTitle.trim();
  const licensingBoard = input.licensingBoard.trim();
  const licenseNumber = input.licenseNumber.trim();
  const professionalEmail = input.professionalEmail.trim();
  const proofPath = input.proofPath.trim();

  if (
    fullName.length < 2 || fullName.length > 160 ||
    professionalTitle.length < 2 || professionalTitle.length > 120 ||
    licensingBoard.length < 2 || licensingBoard.length > 200 ||
    licenseNumber.length < 2 || licenseNumber.length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(professionalEmail) ||
    input.affiliation.trim().length > 200 ||
    input.focusAreas.length === 0 || input.focusAreas.some((area) => !allowedFocusAreas.has(area))
  ) {
    return { ok: false as const, code: "validation" as const, message: "Review the application fields and select at least one focus area." };
  }

  try {
    const supabase = await createClient();
    const { data: claims, error: claimsError } = await supabase.auth.getClaims();
    const userId = claims?.claims.sub;
    if (claimsError || typeof userId !== "string") {
      return { ok: false as const, code: "auth" as const, message: "Sign in before submitting a mentor application." };
    }
    if (!proofPath.startsWith(`${userId}/`) || proofPath.length > 180) {
      return { ok: false as const, code: "validation" as const, message: "The credential document could not be verified. Please select it again." };
    }

    const { data: existing, error: existingError } = await supabase
      .from("mentor_applications")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle();
    if (existingError) return { ok: false as const, code: "save" as const, message: "We could not check your application status. Please try again." };
    if (existing) return { ok: false as const, code: "existing" as const, message: `An application is already on file (${existing.status}).` };

    const { error } = await supabase.from("mentor_applications").insert({
      user_id: userId,
      full_name: fullName,
      professional_title: professionalTitle,
      credential_type: professionalTitle,
      licensing_board: licensingBoard,
      license_number: licenseNumber,
      professional_email: professionalEmail,
      affiliation: input.affiliation.trim() || null,
      focus_areas: input.focusAreas,
      proof_path: proofPath,
      status: "pending",
    });
    if (error) return { ok: false as const, code: "save" as const, message: "We could not submit the application. Please retry or contact support." };
    return { ok: true as const };
  } catch {
    return { ok: false as const, code: "save" as const, message: "We could not connect to Second View. Please try again." };
  }
}
