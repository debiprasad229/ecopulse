/**
 * Smart Carbon Scanner Engine
 * OCR simulation & Gemini Multimodal Parser
 */

import { EMISSION_FACTORS } from './carbonCalculations';

const GEMINI_API_KEY = true; // Now handled securely by backend

/**
 * Parses receipt/bill document text locally using regular expressions.
 * 
 * @param {string} text - Raw extracted text
 * @param {string} fileName - Uploaded file name for fallback hints
 * @returns {Object} Parsed document details and calculated emissions
 */
export function parseDocumentLocally(text = '', fileName = '') {
  const normalizedText = (text + ' ' + fileName).toLowerCase();

  let documentType = 'shopping_receipt';
  let confidence;
  let parsedValue;
  let unit = 'USD';
  let details = 'Generic Purchase';
  let calculatedCarbon;

  // 1. Identify Document Type
  if (normalizedText.includes('electricity') || normalizedText.includes('power') || normalizedText.includes('utility') || normalizedText.includes('kwh')) {
    documentType = 'electricity_bill';
    unit = 'kWh';
    details = 'Monthly Electricity Bill';
  } else if (normalizedText.includes('fuel') || normalizedText.includes('gas') || normalizedText.includes('petrol') || normalizedText.includes('diesel') || normalizedText.includes('liters') || normalizedText.includes('litres') || normalizedText.includes('station')) {
    documentType = 'fuel_receipt';
    unit = 'Liters';
    details = 'Fuel Purchase Receipt';
  }

  // 2. Extract values based on document type
  if (documentType === 'electricity_bill') {
    // Look for numbers preceding "kwh" or "kw" or following "usage", "total", "amount"
    const kwhRegex = /(\d+(?:\.\d+)?)\s*(?:kwh|kw|kilo)/i;
    let match = normalizedText.match(kwhRegex);
    if (!match) {
      // Secondary fallback: check for any standalone number in the text
      match = normalizedText.match(/(\d+(?:\.\d+)?)/);
    }
    if (match) {
      parsedValue = parseFloat(match[1]);
      confidence = 95;
    } else {
      // Fallback default
      parsedValue = 250;
      confidence = 65;
    }
    // Calculate Carbon: usageValue * EMISSION_FACTORS.electricity (annualized in dashboard is * 12, but this is a single monthly bill)
    // The dashboard stores MONTHLY electricityKwh. Let's calculate the MONTHLY emissions: kwh * EMISSION_FACTORS.electricity
    calculatedCarbon = Math.round(parsedValue * EMISSION_FACTORS.electricity);
  } else if (documentType === 'fuel_receipt') {
    // Look for liters/litres/gallons/ltr
    const literRegex = /(\d+(?:\.\d+)?)\s*(?:l|ltr|liter|litre|gal)/i;
    let match = normalizedText.match(literRegex);
    if (!match) {
      // Secondary fallback
      match = normalizedText.match(/(\d+(?:\.\d+)?)/);
    }
    if (match) {
      parsedValue = parseFloat(match[1]);
      confidence = 92;
    } else {
      parsedValue = 45;
      confidence = 60;
    }
    // Fuel emissions: Liters * gasoline emissions factor (approx 2.3 kg CO2 per liter of gasoline)
    // Or we can map gasoline km to liters. 1 liter is approx 12km commute.
    // Let's use standard IPCC fuel factor: Gasoline = 2.31 kg CO2e / liter, Diesel = 2.68 kg CO2e / liter
    calculatedCarbon = Math.round(parsedValue * 2.31);
  } else {
    // Shopping receipt
    // Look for prices / amount
    const priceRegex = /(?:total|amount|sum|\$|usd)\s*(?::|=>)?\s*(?:\$)?\s*(\d+(?:\.\d+)?)/i;
    let match = normalizedText.match(priceRegex);
    if (!match) {
      // Secondary fallback
      match = normalizedText.match(/(\d+(?:\.\d+)?)/);
    }
    if (match) {
      parsedValue = parseFloat(match[1]);
      confidence = 90;
    } else {
      parsedValue = 85;
      confidence = 70;
    }
    // Shopping emissions: $ amount * average emissions per dollar (approx 0.12 kg CO2e per dollar)
    calculatedCarbon = Math.round(parsedValue * 0.12);
  }

  return {
    documentType,
    confidence,
    extractedText: text || `Raw scan text from ${fileName}`,
    parsedData: {
      usageValue: parsedValue,
      unit,
      details
    },
    calculatedCarbon
  };
}

/**
 * Extracts and parses document usage via Gemini Multimodal Vision API.
 * 
 * @param {string} base64Data - Base64 data of image
 * @param {string} mimeType - Image mime type
 * @returns {Promise<Object>} JSON response from Gemini containing parsed data
 */
export async function parseDocumentWithGemini(base64Data, mimeType, token) {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }

  // Extract base64 part only
  const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');

  const promptText = `
Identify the document type (electricity_bill, fuel_receipt, or shopping_receipt). 
Extract the key usage metrics and details.
Calculate the estimated carbon footprint in kg CO2e using these rules:
1. For electricity_bill: extract total kWh. Carbon = kWh * 0.38
2. For fuel_receipt: extract total liters. Carbon = liters * 2.31
3. For shopping_receipt: extract total purchase amount in USD. Carbon = amount * 0.12

Return ONLY a valid JSON object matching this schema (do not wrap in markdown or backticks):
{
  "documentType": "electricity_bill" | "fuel_receipt" | "shopping_receipt",
  "confidence": 95,
  "extractedText": "Raw invoice summary text...",
  "parsedData": {
    "usageValue": 350,
    "unit": "kWh" | "Liters" | "USD",
    "details": "utility provider name or fuel type"
  },
  "calculatedCarbon": 133
}
`;

  const response = await fetch('/api/scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: base64Clean
              }
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!responseText) {
    throw new Error("Empty response from OCR scanner.");
  }

  // Parse response
  try {
    return JSON.parse(responseText.trim());
  } catch (err) {
    console.error("Failed to parse Gemini output as JSON:", err, responseText);
    // Attempt local parse fallback if LLM response is not strict JSON
    return parseDocumentLocally(responseText, 'Gemini OCR Output');
  }
}
