import { chatCompletion } from './ai';

export interface BillExtraction {
  vendor: string;
  amount: number;
  currency: string;
  dueDate: string | null;
  category: string;
  invoiceNumber: string | null;
  lineItems: { description: string; amount: number }[];
  confidence: number;
}

export async function extractBillData(rawText: string): Promise<BillExtraction> {
  const prompt = `Extract the following information from this bill/invoice text:

Bill text:
${rawText}

Return a JSON object with:
- vendor: The company/vendor name (string)
- amount: The total amount due (number, no currency symbol)
- currency: Currency code like USD, EUR, etc. (string, default USD)
- dueDate: Due date in YYYY-MM-DD format (string or null if not found)
- category: One of: utilities, rent, insurance, subscription, telecom, medical, grocery, other (string)
- invoiceNumber: Invoice or receipt number (string or null if not found)
- lineItems: Array of { description: string, amount: number } (may be empty array)
- confidence: How confident you are in the extraction 0-1 (number)

Return ONLY the JSON object, no other text.`;

  const response = await chatCompletion([
    { role: 'user', content: prompt },
  ]);

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      vendor: parsed.vendor || 'Unknown',
      amount: parseFloat(parsed.amount) || 0,
      currency: parsed.currency || 'USD',
      dueDate: parsed.dueDate || null,
      category: parsed.category || 'other',
      invoiceNumber: parsed.invoiceNumber || null,
      lineItems: Array.isArray(parsed.lineItems) ? parsed.lineItems : [],
      confidence: Math.min(1, Math.max(0, parseFloat(parsed.confidence) || 0.5)),
    };
  } catch {
    return {
      vendor: 'Unknown',
      amount: 0,
      currency: 'USD',
      dueDate: null,
      category: 'other',
      invoiceNumber: null,
      lineItems: [],
      confidence: 0,
    };
  }
}
