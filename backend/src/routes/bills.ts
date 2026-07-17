import { Router } from 'express';
import { requireGoogleAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { searchBillEmails, downloadAttachment } from '../services/gmail-bills';
import { parsePdf } from '../services/pdf-parser';
import { extractBillData } from '../services/bill-extractor';
import fs from 'fs';
import path from 'path';

const PDFS_DIR = path.join(__dirname, '../../pdfs');

function ensurePdfDir() {
  if (!fs.existsSync(PDFS_DIR)) {
    fs.mkdirSync(PDFS_DIR, { recursive: true });
  }
}

function sanitize(s: string | null | undefined): string | null {
  if (s == null) return null;
  return s.replace(/\x00/g, '');
}

const router = Router();

router.get('/', async (req, res) => {
  try {
    const bills = await prisma.bill.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(bills);
  } catch (err) {
    console.error('Failed to fetch bills:', err);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!bill) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }
    res.json(bill);
  } catch (err) {
    console.error('Failed to fetch bill:', err);
    res.status(500).json({ error: 'Failed to fetch bill' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { vendor, amount, currency, dueDate, paidDate, category, status, notes, lineItems } =
      req.body;

    const bill = await prisma.bill.update({
      where: { id: String(req.params.id) },
      data: {
        ...(vendor !== undefined && { vendor }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(currency !== undefined && { currency }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(paidDate !== undefined && { paidDate: paidDate ? new Date(paidDate) : null }),
        ...(category !== undefined && { category }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(lineItems !== undefined && { lineItems }),
      },
    });
    res.json(bill);
  } catch (err) {
    console.error('Failed to update bill:', err);
    res.status(500).json({ error: 'Failed to update bill' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const bill = await prisma.bill.findUnique({ where: { id: String(req.params.id) } });
    if (!bill) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }

    if (bill.pdfUrl) {
      const pdfPath = path.join(PDFS_DIR, bill.pdfUrl);
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    }

    await prisma.bill.delete({ where: { id: String(req.params.id) } });
    res.status(204).end();
  } catch (err) {
    console.error('Failed to delete bill:', err);
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

router.post('/fetch-gmail', requireGoogleAuth, async (req, res) => {
  try {
    const { rules } = req.body;
    const oauth2Client = (req as any).googleAuth;

    const emails = await searchBillEmails(rules || { hasAttachment: true }, oauth2Client);

    const bills = [];
    for (const email of emails) {
      for (const attachment of email.attachments) {
        const existing = await prisma.bill.findFirst({
          where: { gmailMessageId: email.messageId },
        });
        if (existing) continue;

        const buffer = await downloadAttachment(
          email.messageId,
          attachment.attachmentId,
          oauth2Client
        );

        ensurePdfDir();
        const pdfFilename = `${Date.now()}-${attachment.filename}`;
        const pdfPath = path.join(PDFS_DIR, pdfFilename);
        fs.writeFileSync(pdfPath, buffer);

        const pdfResult = await parsePdf(buffer);

        let extraction = null;
        if (!pdfResult.isScanned && pdfResult.text) {
          try {
            extraction = await extractBillData(pdfResult.text);
          } catch (err) {
            console.warn('AI extraction skipped:', err instanceof Error ? err.message : err);
          }
        }

        const bill = await prisma.bill.create({
          data: {
            gmailMessageId: email.messageId,
            vendor: sanitize(extraction?.vendor || 'Unknown'),
            amount: extraction?.amount || 0,
            currency: extraction?.currency || 'USD',
            dueDate: extraction?.dueDate ? new Date(extraction.dueDate) : null,
            category: sanitize(extraction?.category || 'other'),
            status: 'pending',
            rawText: sanitize(pdfResult.text),
            pdfUrl: pdfFilename,
            lineItems: extraction?.lineItems || [],
            notes: sanitize(`Fetched from Gmail: ${email.subject}`),
          },
        });
        bills.push(bill);
      }
    }

    res.json({ fetched: bills.length, bills });
  } catch (err) {
    console.error('Failed to fetch bills from Gmail:', err);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

router.post('/parse', requireGoogleAuth, async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText) {
      res.status(400).json({ error: 'rawText is required' });
      return;
    }

    const extraction = await extractBillData(rawText);
    res.json(extraction);
  } catch (err) {
    console.error('Failed to parse bill:', err);
    res.status(500).json({ error: 'Failed to parse bill' });
  }
});

router.get('/:id/pdf', async (req, res) => {
  try {
    const bill = await prisma.bill.findUnique({ where: { id: String(req.params.id) } });
    if (!bill || !bill.pdfUrl) {
      res.status(404).json({ error: 'PDF not found' });
      return;
    }

    const pdfPath = path.join(PDFS_DIR, bill.pdfUrl);
    if (!fs.existsSync(pdfPath)) {
      res.status(404).json({ error: 'PDF file not found on disk' });
      return;
    }

    res.download(pdfPath, bill.pdfUrl);
  } catch (err) {
    console.error('Failed to serve PDF:', err);
    res.status(500).json({ error: 'Failed to serve PDF' });
  }
});

export default router;
