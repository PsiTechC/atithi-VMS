import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/var/www/atithi/uploads";
const APP_ORIGIN = process.env.APP_ORIGIN || "https://webapp.atithi.org";

export async function saveFileToLocal(file: File, subfolder = "Visitors"): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  let ext = path.extname(file.name);
  // If no extension, set by mime type
  if (!ext) {
    if (file.type === "application/pdf") ext = ".pdf";
    else if (file.type === "image/png") ext = ".png";
    else if (file.type === "image/jpeg" || file.type === "image/jpg") ext = ".jpg";
    else ext = ".dat";
  }

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const folderPath = path.join(UPLOAD_DIR, subfolder);

  await mkdir(folderPath, { recursive: true });
  const filePath = path.join(folderPath, fileName);

  await writeFile(filePath, buffer);

  // Public URL
  return `${APP_ORIGIN}/uploads/${subfolder}/${fileName}`;
}
