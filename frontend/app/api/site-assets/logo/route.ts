import { getLogoBuffer } from "@/lib/server/site-assets";

export async function GET() {
  const buffer = await getLogoBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
