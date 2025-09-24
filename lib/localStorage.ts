import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/var/www/atithi/uploads";
const APP_ORIGIN = process.env.APP_ORIGIN || "https://webapp.atithi.org";

export async function saveFileToLocal(file: File, subfolder = "Visitors"): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  const ext = path.extname(file.name) || ".jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const folderPath = path.join(UPLOAD_DIR, subfolder);

  await mkdir(folderPath, { recursive: true });
  const filePath = path.join(folderPath, fileName);

  await writeFile(filePath, buffer);

  // Public URL
  return `${APP_ORIGIN}/uploads/${subfolder}/${fileName}`;
}
