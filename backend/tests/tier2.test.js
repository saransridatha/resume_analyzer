import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;
const BASE_URL = `http://localhost:${PORT}/api`;
const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const DB_PATH = process.env.DB_PATH || path.join(FIXTURES_DIR, 'test_db.json');

// Helper to construct FormData
async function makeFormData(resumeFileName, jdFileName = null) {
  const formData = new FormData();
  
  if (resumeFileName) {
    const resumePath = path.join(FIXTURES_DIR, 'resumes', resumeFileName);
    const resumeContent = fs.readFileSync(resumePath);
    const blob = new Blob([resumeContent], { type: 'application/octet-stream' });
    formData.append('file', blob, resumeFileName);
  }

  if (jdFileName) {
    const jdPath = path.join(FIXTURES_DIR, 'jds', jdFileName);
    const jdContent = fs.readFileSync(jdPath, 'utf8');
    formData.append('jobDescription', jdContent);
  }

  return formData;
}

// Clear database helper
function resetDb() {
  if (fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, '[]', 'utf8');
  }
}

test.describe('Tier 2: Boundary & Corner Cases', () => {

  test.beforeEach(() => {
    resetDb();
  });

  // Feature 1: Resume Upload & Format Parsing (PDF/DOCX)
  test('TC-T2-F1-001: Upload 0-byte PDF file', async () => {
    // Generate empty file
    const emptyPdfPath = path.join(FIXTURES_DIR, 'resumes', 'empty.pdf');
    fs.writeFileSync(emptyPdfPath, '');

    const formData = await makeFormData('empty.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.message, 'Empty file or invalid format');
  });

  test('TC-T2-F1-002: Upload file with unsupported extension', async () => {
    const formData = await makeFormData('resume.txt', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.message.includes('PDF or DOCX'));
  });

  test('TC-T2-F1-003: Upload file exceeding maximum size limit', async () => {
    // We send a 11MB file to trigger the limit
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    const formData = new FormData();
    const blob = new Blob([largeBuffer], { type: 'application/pdf' });
    formData.append('file', blob, 'huge_resume.pdf');
    formData.append('jobDescription', 'Some JD');

    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 413);
    const data = await res.json();
    assert.strictEqual(data.error, 'Payload Too Large');
  });

  test('TC-T2-F1-004: Upload resume with special characters/emojis in filename', async () => {
    const formData = await makeFormData('résumé_🚀_2026.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.filename.includes('r') || data.filename.includes('résumé'));
  });

  test('TC-T2-F1-005: Upload scanned, non-selectable text PDF', async () => {
    const formData = await makeFormData('non_ascii.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.atsScore, 0);
    assert.strictEqual(data.breakdown.keywords, 0);
  });

  // Feature 2: ATS Score Calculation & Rubric Evaluation
  test('TC-T2-F2-001: Verify maximum boundary scoring limits', async () => {
    const formData = await makeFormData('perfect_resume.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    assert.strictEqual(data.atsScore, 100);
    assert.strictEqual(data.breakdown.keywords, 30);
    assert.strictEqual(data.breakdown.skills, 30);
    assert.strictEqual(data.breakdown.experience, 25);
    assert.strictEqual(data.breakdown.formatting, 15);
  });

  test('TC-T2-F2-002: Verify scoring with empty text content', async () => {
    const formData = await makeFormData('non_ascii.pdf', 'react_developer.txt'); // returns zero score profile
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    assert.strictEqual(data.atsScore, 0);
    assert.strictEqual(data.breakdown.keywords, 0);
    assert.strictEqual(data.breakdown.skills, 0);
  });

  test('TC-T2-F2-003: Verify score calculation consistency (Idempotency)', async () => {
    const scores = [];
    for (let i = 0; i < 5; i++) {
      const formData = await makeFormData('standard_dev.pdf', 'react_developer.txt');
      const res = await fetch(`${BASE_URL}/analyze`, { method: 'POST', body: formData });
      const data = await res.json();
      scores.push(data.atsScore);
    }
    assert.strictEqual(scores.length, 5);
    assert.ok(scores.every(s => s === scores[0]));
  });

  test('TC-T2-F2-004: Verify score clamping on negative/invalid values', async () => {
    const formData = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    // We send a filename that triggers invalid extreme scores inside index.js to verify clamping
    const fileContent = fs.readFileSync(path.join(FIXTURES_DIR, 'resumes', 'standard_dev.pdf'));
    const form = new FormData();
    form.append('file', new Blob([fileContent]), 'score_clamping.pdf');

    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: form
    });
    const data = await res.json();
    assert.strictEqual(data.atsScore, 100); // Clamped from 120
    assert.strictEqual(data.breakdown.keywords, 0); // Clamped from -5
  });

  test('TC-T2-F2-005: Verify scoring with highly skewed content (skills only)', async () => {
    const formData = await makeFormData('skills_only.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    assert.strictEqual(data.breakdown.skills, 30);
    assert.strictEqual(data.breakdown.experience, 0);
    assert.strictEqual(data.breakdown.formatting, 0);
  });

  // Feature 3: Job Description Alignment & Gap Analysis
  test('TC-T2-F3-001: Upload extremely long Job Description', async () => {
    const formData = await makeFormData('standard_dev.pdf', 'massive_jd.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.id);
  });

  test('TC-T2-F3-002: Upload JD containing foreign language / non-ASCII text', async () => {
    const formData = await makeFormData('standard_dev.pdf', 'non_ascii_jd.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.id);
  });

  test('TC-T2-F3-003: Upload JD containing only whitespace characters', async () => {
    const formData = await makeFormData('standard_dev.pdf', 'whitespace_jd.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    // Treats as empty JD
    assert.strictEqual(data.geminiFeedback.missingSkills.length, 0);
  });

  test('TC-T2-F3-004: Upload JD with nonsensical content', async () => {
    const formData = await makeFormData('standard_dev.pdf', 'nonsense_jd.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    // Should gracefully process
    assert.ok(data.id);
  });

  test('TC-T2-F3-005: Upload minimal length JD (single word)', async () => {
    const formData = await makeFormData('standard_dev.pdf', 'minimal_jd.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.id);
  });

  // Feature 4: AI-Powered Bullet Point Optimization
  test('TC-T2-F4-001: Optimization with code snippets in bullet points', async () => {
    const formData = await makeFormData('code_snippet.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.geminiFeedback.bulletPointOptimizations.length > 0);
    const opt = data.geminiFeedback.bulletPointOptimizations[0];
    assert.ok(opt.original.includes('<div>'));
  });

  test('TC-T2-F4-002: Optimization with extremely long bullet point', async () => {
    const formData = await makeFormData('long_bullet.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    assert.ok(data.geminiFeedback.bulletPointOptimizations.length > 0);
    const opt = data.geminiFeedback.bulletPointOptimizations[0];
    assert.ok(opt.optimized.length < 200);
  });

  test('TC-T2-F4-003: Optimization with non-standard bullet symbols', async () => {
    const formData = await makeFormData('custom_bullets.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    assert.ok(data.geminiFeedback.bulletPointOptimizations.length > 0);
    assert.ok(data.geminiFeedback.bulletPointOptimizations[0].original.includes('⭐'));
  });

  test('TC-T2-F4-004: Handle malformed AI JSON output in bullet parser', async () => {
    // Trigger malformed parser mock
    const fileContent = fs.readFileSync(path.join(FIXTURES_DIR, 'resumes', 'standard_dev.pdf'));
    const form = new FormData();
    form.append('file', new Blob([fileContent]), 'malformed_ai.pdf');

    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: form
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.geminiFeedback.bulletPointOptimizations));
    assert.strictEqual(data.geminiFeedback.bulletPointOptimizations.length, 0);
  });

  test('TC-T2-F4-005: Optimization of already optimal bullet points', async () => {
    const formData = await makeFormData('optimal_bullets.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    assert.ok(data.geminiFeedback.bulletPointOptimizations.length > 0);
    const opt = data.geminiFeedback.bulletPointOptimizations[0];
    assert.strictEqual(opt.original, opt.optimized);
  });

  // Feature 5: Analysis History Management & Retrieval
  test('TC-T2-F5-001: History retrieval when DB is unavailable/locked', async () => {
    const res = await fetch(`${BASE_URL}/history`, {
      headers: { 'X-Test-Lock-DB': 'true' }
    });
    assert.strictEqual(res.status, 500);
    const data = await res.json();
    assert.strictEqual(data.error, 'Database is locked or unavailable');

    // Verify /api/analyze is also protected
    const formData = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    const analyzeRes = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
      headers: { 'X-Test-Lock-DB': 'true' }
    });
    assert.strictEqual(analyzeRes.status, 500);
    const analyzeData = await analyzeRes.json();
    assert.strictEqual(analyzeData.error, 'Database is locked or unavailable');
  });

  test('TC-T2-F5-002: Execute and retrieve large volume of history entries (100+)', async () => {
    // Generate 105 history entries directly in test_db.json
    const records = [];
    for (let i = 0; i < 105; i++) {
      records.push({
        id: `id-${i}`,
        filename: `resume-${i}.pdf`,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        atsScore: 70
      });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(records, null, 2), 'utf8');

    const res = await fetch(`${BASE_URL}/history`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.length, 105);
  });

  test('TC-T2-F5-003: Verify history items are immutable via API', async () => {
    const res = await fetch(`${BASE_URL}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: 'hacked.pdf' })
    });
    assert.strictEqual(res.status, 405); // Method Not Allowed
  });

  test('TC-T2-F5-004: Verify history retrieval with missing optional fields', async () => {
    // Write legacy records with missing fields to test_db.json
    const legacyRecords = [
      {
        id: 'legacy-1',
        filename: 'legacy.pdf',
        timestamp: new Date().toISOString(),
        atsScore: 65
        // missing extra/optional fields if any
      }
    ];
    fs.writeFileSync(DB_PATH, JSON.stringify(legacyRecords, null, 2), 'utf8');

    const res = await fetch(`${BASE_URL}/history`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.length, 1);
    assert.strictEqual(data[0].id, 'legacy-1');
  });

  test('TC-T2-F5-005: Timezone mismatch handling in history timestamps', async () => {
    fs.writeFileSync(DB_PATH, '[]', 'utf8');
    const formData = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    await fetch(`${BASE_URL}/analyze`, { method: 'POST', body: formData });

    const res = await fetch(`${BASE_URL}/history`);
    const data = await res.json();
    const ts = data[0].timestamp;
    // Check it ends with Z indicating UTC format
    assert.ok(ts.endsWith('Z'));
    // Try to parse it to check it's valid
    assert.ok(!isNaN(Date.parse(ts)));
  });

});
