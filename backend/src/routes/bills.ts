import { logger } from '../lib/logger';
import { Router } from 'express';
import { requireGoogleAuth, requireOptionalAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { getAuthenticatedClient } from '../services/google-auth';
import { searchBillEmails, downloadAttachment, GmailBillEmail } from '../services/gmail-bills';
import { parsePdf } from '../services/pdf-parser';
import { extractBillData } from '../services/bill-extractor';
import { convertToLocal } from '../services/forex';
import { validate, updateBillSchema, fetchGmailSchema, parseBillSchema } from '../lib/validation';
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

async function processGmailAttachment(
  email: GmailBillEmail,
  attachment: { filename: string; mimeType: string; attachmentId: string },
  oauth2Client: any,
  googleAccountId: string | null
) {
  const existing = await prisma.bill.findFirst({
    where: { gmailMessageId: email.messageId },
  });
  if (existing) return null;

  const buffer = await downloadAttachment(email.messageId, attachment.attachmentId, oauth2Client);

  ensurePdfDir();
  const pdfFilename = `${Date.now()}-${attachment.filename}`;
  const pdfPath = path.join(PDFS_DIR, pdfFilename);
  fs.writeFileSync(pdfPath, buffer);

  const pdfResult = await parsePdf(buffer);

  let extraction = null;
  if (!pdfResult.isScanned && pdfResult.text) {
    try {
      extraction = await extractBillData(pdfResult.text);
      if (!extraction || extraction.vendor === 'Unknown') {
        logger.warn('AI first attempt failed (vendor=Unknown), retrying...');
        await new Promise(r => setTimeout(r, 2000));
        extraction = await extractBillData(pdfResult.text);
      }
    } catch (err) {
      logger.warn({ err }, 'AI extraction error');
    }
  }

  const conversion = await convertToLocal(extraction?.amount || 0, extraction?.currency || 'USD');

  return prisma.bill.create({
    data: {
      gmailMessageId: email.messageId,
      vendor: sanitize(extraction?.vendor || 'Unknown'),
      amount: extraction?.amount || 0,
      currency: extraction?.currency || 'USD',
      localAmount: conversion?.localAmount ?? null,
      localCurrency: conversion?.localCurrency ?? null,
      dueDate: extraction?.dueDate ? new Date(extraction.dueDate) : null,
      category: sanitize(extraction?.category || 'other'),
      invoiceNumber: sanitize(extraction?.invoiceNumber),
      status: 'pending',
      rawText: sanitize(pdfResult.text),
      pdfUrl: pdfFilename,
      lineItems: extraction?.lineItems || [],
      notes: sanitize(`Fetched from Gmail: ${email.subject}`),
      googleAccountId,
    },
  });
}

const router = Router();

router.get('/', requireOptionalAuth, async (req, res) => {
  try {
    const bills = await prisma.bill.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(bills);
  } catch (err) {
    logger.error({ err: err }, 'Failed to fetch bills:');
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

router.get('/:id', requireOptionalAuth, async (req, res) => {
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
    logger.error({ err: err }, 'Failed to fetch bill:');
    res.status(500).json({ error: 'Failed to fetch bill' });
  }
});

router.put('/:id', requireOptionalAuth, validate(updateBillSchema), async (req, res) => {
  try {
    const { vendor, amount, currency, dueDate, paidDate, category, status, notes, invoiceNumber, localAmount, localCurrency, lineItems } =
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
        ...(invoiceNumber !== undefined && { invoiceNumber }),
        ...(localAmount !== undefined && { localAmount }),
        ...(localCurrency !== undefined && { localCurrency }),
        ...(lineItems !== undefined && { lineItems }),
      },
    });
    res.json(bill);
  } catch (err) {
    logger.error({ err: err }, 'Failed to update bill:');
    res.status(500).json({ error: 'Failed to update bill' });
  }
});

router.delete('/:id', requireOptionalAuth, async (req, res) => {
  try {
    const bill = await prisma.bill.findUnique({ where: { id: String(req.params.id) } });
    if (!bill) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }

    if (bill.pdfUrl && !bill.pdfUrl.includes('..')) {
      const pdfPath = path.join(PDFS_DIR, bill.pdfUrl);
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    }

    await prisma.bill.delete({ where: { id: String(req.params.id) } });
    res.status(204).end();
  } catch (err) {
    logger.error({ err: err }, 'Failed to delete bill:');
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

router.post('/fetch-gmail', requireGoogleAuth, validate(fetchGmailSchema), async (req, res) => {
  try {
    const { rules, googleAccountId } = req.body;
    const oauth2Client = req.googleAuth!;
    const googleAccount = req.googleAccount;

    const effectiveAccountId = googleAccountId || googleAccount?.id || null;
    const emails = await searchBillEmails(rules || { hasAttachment: true }, oauth2Client);

    const bills = [];
    for (const email of emails) {
      for (const attachment of email.attachments) {
        const bill = await processGmailAttachment(email, attachment, oauth2Client, effectiveAccountId);
        if (bill) bills.push(bill);
      }
    }

    res.json({ fetched: bills.length, bills });
  } catch (err) {
    logger.error({ err: err }, 'Failed to fetch bills from Gmail:');
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

router.post('/fetch-gmail-all', requireGoogleAuth, async (req, res) => {
  try {
    const { rules } = req.body;
    const accounts = await prisma.googleAccount.findMany();

    if (accounts.length === 0) {
      res.status(400).json({ error: 'No Google accounts connected' });
      return;
    }

    const results = [];
    const errors: { email: string; error: string }[] = [];

    for (const account of accounts) {
      try {
        const oauth2Client = await getAuthenticatedClient(account.id);
        const emails = await searchBillEmails(rules || { hasAttachment: true }, oauth2Client);

        for (const email of emails) {
          for (const attachment of email.attachments) {
            const bill = await processGmailAttachment(email, attachment, oauth2Client, account.id);
            if (bill) results.push(bill);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logger.error({ err: message }, `Failed to fetch Gmail bills for account ${account.email}:`);
        errors.push({ email: account.email, error: message });
      }
    }

    res.json({ fetched: results.length, bills: results, errors });
  } catch (err) {
    logger.error({ err: err }, 'Failed to fetch bills from all Gmail accounts:');
    res.status(500).json({ error: 'Failed to fetch bills from all accounts' });
  }
});

router.post('/parse', requireGoogleAuth, validate(parseBillSchema), async (req, res) => {
  try {
    const { rawText } = req.body;

    const extraction = await extractBillData(rawText);
    res.json(extraction);
  } catch (err) {
    logger.error({ err: err }, 'Failed to parse bill:');
    res.status(500).json({ error: 'Failed to parse bill' });
  }
});

router.get('/:id/pdf', requireOptionalAuth, async (req, res) => {
  try {
    const bill = await prisma.bill.findUnique({ where: { id: String(req.params.id) } });
    if (!bill || !bill.pdfUrl) {
      res.status(404).json({ error: 'PDF not found' });
      return;
    }

    if (bill.pdfUrl.includes('..') || bill.pdfUrl.includes('/')) {
      res.status(400).json({ error: 'Invalid PDF path' });
      return;
    }

    const pdfPath = path.join(PDFS_DIR, bill.pdfUrl);
    const resolved = path.resolve(pdfPath);
    if (!resolved.startsWith(path.resolve(PDFS_DIR))) {
      res.status(400).json({ error: 'Invalid PDF path' });
      return;
    }

    if (!fs.existsSync(pdfPath)) {
      res.status(404).json({ error: 'PDF file not found on disk' });
      return;
    }

    res.download(pdfPath, bill.pdfUrl);
  } catch (err) {
    logger.error({ err: err }, 'Failed to serve PDF:');
    res.status(500).json({ error: 'Failed to serve PDF' });
  }
});

export default router;
