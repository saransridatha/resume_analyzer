import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extract text from PDF buffer
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
export async function extractTextFromPdf(buffer) {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text || '';
  } catch (err) {
    console.error('Error parsing PDF:', err);
    throw new Error('Failed to parse PDF resume');
  }
}

/**
 * Extract text from DOCX buffer
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
export async function extractTextFromDocx(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (err) {
    console.error('Error parsing DOCX:', err);
    throw new Error('Failed to parse DOCX resume');
  }
}
