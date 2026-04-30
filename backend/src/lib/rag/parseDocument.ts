import fs from "fs";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

export const parseDocument = async (
  filePath: string,
  fileType: "pdf" | "docx" | "txt",
) => {
  if (fileType === "pdf") {
    const data = await pdfParse(fs.readFileSync(filePath));
    return { text: data.text };
  }

  if (fileType === "docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return { text: result.value };
  }

  return { text: fs.readFileSync(filePath, "utf8") };
};
