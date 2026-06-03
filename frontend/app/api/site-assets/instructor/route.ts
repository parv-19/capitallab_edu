import { getInstructorBuffer } from "@/lib/server/site-assets";

export async function GET() {
  const buffer = await getInstructorBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
