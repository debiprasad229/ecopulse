/**
 * Unit Tests for scannerEngine.js
 */
import { describe, it, expect } from 'vitest';
import { parseDocumentLocally, parseDocumentWithGemini } from '../scannerEngine';
import { vi } from 'vitest';

describe('scannerEngine - parseDocumentLocally', () => {
  it('identifies and parses electricity bill with kWh keywords', () => {
    const text = 'Metropolitan Grid Invoice \nUsage: 450 kWh \nBilling Period: June';
    const result = parseDocumentLocally(text, 'bill.txt');

    expect(result.documentType).toBe('electricity_bill');
    expect(result.parsedData.unit).toBe('kWh');
    expect(result.parsedData.usageValue).toBe(450);
    expect(result.calculatedCarbon).toBe(Math.round(450 * 0.38));
    expect(result.confidence).toBe(95);
  });

  it('identifies and parses fuel receipts with liter keywords', () => {
    const text = 'Shell Fuel Station \nPremium Gasoline \nQuantity: 52.5 L \nTotal: $80.00';
    const result = parseDocumentLocally(text, 'receipt.png');

    expect(result.documentType).toBe('fuel_receipt');
    expect(result.parsedData.unit).toBe('Liters');
    expect(result.parsedData.usageValue).toBe(52.5);
    expect(result.calculatedCarbon).toBe(Math.round(52.5 * 2.31));
    expect(result.confidence).toBe(92);
  });

  it('identifies and parses shopping receipts with cost keywords', () => {
    const text = 'Target Store \nTotal: $125.50 \nThank you for shopping!';
    const result = parseDocumentLocally(text, 'shopping_receipt.pdf');

    expect(result.documentType).toBe('shopping_receipt');
    expect(result.parsedData.unit).toBe('USD');
    expect(result.parsedData.usageValue).toBe(125.5);
    expect(result.calculatedCarbon).toBe(Math.round(125.5 * 0.12));
    expect(result.confidence).toBe(90);
  });

  it('uses filename as fallback clue if text does not contain keywords', () => {
    const result = parseDocumentLocally('Generic text 400', 'electricity-bill-june.pdf');
    expect(result.documentType).toBe('electricity_bill');
    expect(result.parsedData.usageValue).toBe(400);
  });

  it('provides sensible default fallbacks when keywords and numbers are missing', () => {
    const result = parseDocumentLocally('some empty garbage', 'unnamed.bin');
    expect(result.documentType).toBe('shopping_receipt'); // default
    expect(result.parsedData.usageValue).toBe(85); // fallback default
    expect(result.confidence).toBe(70);
  });
});

describe('scannerEngine - parseDocumentWithGemini', () => {
  const sampleResponse = {
    documentType: 'electricity_bill',
    confidence: 95,
    extractedText: 'Usage: 100 kWh',
    parsedData: {
      usageValue: 100,
      unit: 'kWh',
      details: 'Test Power'
    },
    calculatedCarbon: 38
  };

  it('successfully scans and parses a document', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify(sampleResponse)
            }]
          }
        }]
      })
    });
    global.fetch = mockFetch;

    const result = await parseDocumentWithGemini('data:image/jpeg;base64,YWJj', 'image/jpeg');
    expect(mockFetch).toHaveBeenCalledWith('/api/scan', expect.any(Object));
    expect(result.documentType).toBe('electricity_bill');
    expect(result.calculatedCarbon).toBe(38);
  });

  it('throws an error if response is not ok', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });
    global.fetch = mockFetch;

    await expect(parseDocumentWithGemini('YWJj', 'image/jpeg')).rejects.toThrow('API Error: 500 Internal Server Error');
  });

  it('throws an error if response text is empty', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: []
          }
        }]
      })
    });
    global.fetch = mockFetch;

    await expect(parseDocumentWithGemini('YWJj', 'image/jpeg')).rejects.toThrow('Empty response from OCR scanner.');
  });

  it('falls back to local parsing if response text is not valid JSON', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{
              text: 'This is an electricity bill with 450 kWh of usage'
            }]
          }
        }]
      })
    });
    global.fetch = mockFetch;

    const result = await parseDocumentWithGemini('YWJj', 'image/jpeg');
    expect(result.documentType).toBe('electricity_bill');
    expect(result.parsedData.usageValue).toBe(450);
  });
});
