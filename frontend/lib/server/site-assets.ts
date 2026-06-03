import { cache } from "react";
import { readFile } from "fs/promises";
import path from "path";

const readPublicAsset = cache(async (fileName: string) => {
  const filePath = path.join(process.cwd(), "public", fileName);
  return readFile(filePath);
});

export async function getLogoBuffer() {
  return readPublicAsset("LOGO.PNG");
}

export async function getInstructorBuffer() {
  return readPublicAsset("instructor_harsh.jpg");
}
