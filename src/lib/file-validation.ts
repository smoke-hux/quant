export const ALLOWED_DOC_EXTENSIONS = [
  ".xlsx", ".xls", ".csv",
  ".pdf",
  ".docx", ".doc",
  ".txt",
  ".png", ".jpg", ".jpeg",
  ".zip",
];

export const MAX_DOC_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_DOCS_PER_PROJECT = 20;

interface ValidationResult {
  valid: boolean;
  error?: string;
  extension: string;
  fileType: string;
}

export function validateDocumentFile(file: File, buffer: Buffer): ValidationResult {
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  const fileType = extension.slice(1);

  if (!ALLOWED_DOC_EXTENSIONS.includes(extension)) {
    return { valid: false, error: `File type ${extension} is not allowed`, extension, fileType };
  }

  if (file.size > MAX_DOC_FILE_SIZE) {
    return { valid: false, error: "File size must not exceed 50MB", extension, fileType };
  }

  if (!validateMagicBytes(buffer, extension)) {
    return { valid: false, error: "File content does not match the expected format", extension, fileType };
  }

  return { valid: true, extension, fileType };
}

function validateMagicBytes(buffer: Buffer, extension: string): boolean {
  if (buffer.length < 4) {
    return [".csv", ".txt"].includes(extension);
  }

  switch (extension) {
    case ".xlsx":
    case ".docx":
    case ".zip":
      // ZIP-based formats: PK\x03\x04
      return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;

    case ".xls":
    case ".doc":
      // OLE2 Compound Document: D0 CF 11 E0
      return buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0;

    case ".pdf":
      // %PDF
      return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;

    case ".png":
      // 89 50 4E 47
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;

    case ".jpg":
    case ".jpeg":
      // FF D8 FF
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

    case ".csv":
    case ".txt":
      return true;

    default:
      return false;
  }
}
