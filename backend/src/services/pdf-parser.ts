import pdfParse from 'pdf-parse';

export interface PdfParseResult {
  text: string;
  numPages: number;
  isScanned: boolean;
}

export async function parsePdf(buffer: Buffer): Promise<PdfParseResult> {
  const data = await pdfParse(buffer);

  const text = data.text.trim();
  const isScanned = text.length < 50 && (data.numpages || 0) > 0;

  return {
    text,
    numPages: data.numpages || 0,
    isScanned,
  };
}
