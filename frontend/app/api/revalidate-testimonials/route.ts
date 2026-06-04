import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST() {
  revalidateTag("approved-testimonials");
  revalidatePath("/");
  revalidatePath("/testimonials");
  revalidatePath("/leads");

  return NextResponse.json({ revalidated: true });
}
