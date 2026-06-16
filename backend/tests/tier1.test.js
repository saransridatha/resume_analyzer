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

test.describe('Tier 1: Feature Coverage', () => {

  test.beforeEach(() => {
    resetDb();
  });

  // Feature 1: Resume Upload & Format Parsing (PDF/DOCX)
  test('TC-T1-F1-001: Upload standard PDF resume', async () => {
    const formData = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.id);
    assert.strictEqual(data.filename, 'standard_dev.pdf');
  });

  test('TC-T1-F1-002: Upload standard DOCX resume', async () => {
    const formData = await makeFormData('standard_dev.docx', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.id);
    assert.strictEqual(data.filename, 'standard_dev.docx');
  });

  test('TC-T1-F1-003: Verify extraction of parsed details from standard PDF', async () => {
    const formData = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.parsedDetails);
    assert.strictEqual(data.parsedDetails.name, 'John Doe');
    assert.strictEqual(data.parsedDetails.email, 'john.doe@example.com');
    assert.strictEqual(data.parsedDetails.experienceYears, 5);
  });

  test('TC-T1-F1-004: Verify extraction of parsed details from standard DOCX', async () => {
    const formData = await makeFormData('standard_dev.docx', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.parsedDetails);
    assert.strictEqual(data.parsedDetails.name, 'John Doe');
    assert.ok(data.parsedDetails.skills.includes('React'));
  });

  test('TC-T1-F1-005: Verify parsing works without a job description', async () => {
    const formData = await makeFormData('standard_dev.pdf');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.parsedDetails);
    // When jobDescription is omitted, geminiFeedback is empty/structured but valid
    assert.ok(data.geminiFeedback);
    assert.strictEqual(data.geminiFeedback.missingSkills.length, 0);
  });

  // Feature 2: ATS Score Calculation & Rubric Evaluation
  test('TC-T1-F2-001: Verify atsScore is in range [0, 100]', async () => {
    const formData = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Number.isInteger(data.atsScore));
    assert.ok(data.atsScore >= 0 && data.atsScore <= 100);
  });

  test('TC-T1-F2-002: Verify structural breakdown fields', async () => {
    const formData = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.breakdown);
    assert.ok('keywords' in data.breakdown);
    assert.ok('skills' in data.breakdown);
    assert.ok('experience' in data.breakdown);
    assert.ok('formatting' in data.breakdown);
  });

  test('TC-T1-F2-003: Verify breakdown values are valid integers', async () => {
    const formData = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const { keywords, skills, experience, formatting } = data.breakdown;
    assert.ok(Number.isInteger(keywords) && keywords >= 0);
    assert.ok(Number.isInteger(skills) && skills >= 0);
    assert.ok(Number.isInteger(experience) && experience >= 0);
    assert.ok(Number.isInteger(formatting) && formatting >= 0);
  });

  test('TC-T1-F2-004: Verify high ATS score for high-quality resume', async () => {
    const formData = await makeFormData('perfect_resume.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.atsScore >= 80);
  });

  test('TC-T1-F2-005: Verify low ATS score for poor-quality resume', async () => {
    const formData = await makeFormData('no_skills.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.atsScore <= 40);
  });

  // Feature 3: Job Description Alignment & Gap Analysis
  test('TC-T1-F3-001: Upload resume with matching JD', async () => {
    const formData = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.geminiFeedback);
    assert.ok(data.geminiFeedback.overallFeedback.includes('React'));
  });

  test('TC-T1-F3-002: Verify missingSkills list extraction', async () => {
    const formData = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.geminiFeedback.missingSkills));
    assert.ok(data.geminiFeedback.missingSkills.includes('TypeScript'));
  });

  test('TC-T1-F3-003: Verify presence of overall feedback text', async () => {
    const formData = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(typeof data.geminiFeedback.overallFeedback === 'string');
    assert.ok(data.geminiFeedback.overallFeedback.length > 0);
  });

  test('TC-T1-F3-004: Verify behavior with an empty JD string', async () => {
    const formData = new FormData();
    const resumePath = path.join(FIXTURES_DIR, 'resumes', 'standard_dev.pdf');
    const resumeContent = fs.readFileSync(resumePath);
    formData.append('file', new Blob([resumeContent]), 'standard_dev.pdf');
    formData.append('jobDescription', '');

    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.id);
    assert.strictEqual(data.geminiFeedback.missingSkills.length, 0);
  });

  test('TC-T1-F3-005: Verify empty missingSkills when resume fully matches JD', async () => {
    const formData = await makeFormData('perfect_resume.pdf', 'docker_k8s.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.geminiFeedback.missingSkills));
    assert.strictEqual(data.geminiFeedback.missingSkills.length, 0);
  });

  // Feature 4: AI-Powered Bullet Point Optimization
  test('TC-T1-F4-001: Verify presence of optimizations list', async () => {
    const formData = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.geminiFeedback.bulletPointOptimizations));
  });

  test('TC-T1-F4-002: Verify optimization object keys', async () => {
    const formData = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const optimization = data.geminiFeedback.bulletPointOptimizations[0];
    assert.ok(optimization);
    assert.ok('original' in optimization);
    assert.ok('optimized' in optimization);
  });

  test('TC-T1-F4-003: Verify optimization applies XYZ structure', async () => {
    const formData = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const opt = data.geminiFeedback.bulletPointOptimizations[0];
    assert.ok(opt.optimized.includes('reducing') || opt.optimized.includes('%') || opt.optimized.includes('latency'));
  });

  test('TC-T1-F4-004: Verify multiple optimizations returned', async () => {
    // Standard mock matches has some optimizations, let's make sure it returns them
    const formData = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    assert.ok(data.geminiFeedback.bulletPointOptimizations.length >= 1);
  });

  test('TC-T1-F4-005: Verify behavior when no bullet points are found in resume', async () => {
    const formData = await makeFormData('no_skills.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.geminiFeedback.bulletPointOptimizations.length, 0);
  });

  // Feature 5: Analysis History Management & Retrieval
  test('TC-T1-F5-001: Retrieve history on empty database', async () => {
    // Force write empty array to DB path directly to simulate empty DB
    fs.writeFileSync(DB_PATH, '[]', 'utf8');
    const res = await fetch(`${BASE_URL}/history`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    assert.strictEqual(data.length, 0);
  });

  test('TC-T1-F5-002: Verify record is added to history after analysis', async () => {
    fs.writeFileSync(DB_PATH, '[]', 'utf8');
    const formData = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });

    const res = await fetch(`${BASE_URL}/history`);
    const data = await res.json();
    assert.strictEqual(data.length, 1);
    assert.strictEqual(data[0].filename, 'standard_dev.pdf');
  });

  test('TC-T1-F5-003: Verify multiple records are stored', async () => {
    fs.writeFileSync(DB_PATH, '[]', 'utf8');
    const formData1 = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    const formData2 = await makeFormData('standard_dev.docx', 'react_developer.txt');
    const formData3 = await makeFormData('no_skills.pdf', 'react_developer.txt');

    await fetch(`${BASE_URL}/analyze`, { method: 'POST', body: formData1 });
    await fetch(`${BASE_URL}/analyze`, { method: 'POST', body: formData2 });
    await fetch(`${BASE_URL}/analyze`, { method: 'POST', body: formData3 });

    const res = await fetch(`${BASE_URL}/history`);
    const data = await res.json();
    assert.strictEqual(data.length, 3);
  });

  test('TC-T1-F5-004: Verify history item fields', async () => {
    fs.writeFileSync(DB_PATH, '[]', 'utf8');
    const formData = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    await fetch(`${BASE_URL}/analyze`, { method: 'POST', body: formData });

    const res = await fetch(`${BASE_URL}/history`);
    const data = await res.json();
    const item = data[0];
    assert.ok(item.id);
    assert.strictEqual(item.filename, 'standard_dev.pdf');
    assert.ok(item.timestamp);
    assert.ok(typeof item.atsScore === 'number');
  });

  test('TC-T1-F5-005: Verify descending chronological order of history', async () => {
    fs.writeFileSync(DB_PATH, '[]', 'utf8');
    const formData1 = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    const formData2 = await makeFormData('standard_dev.docx', 'react_developer.txt');

    await fetch(`${BASE_URL}/analyze`, { method: 'POST', body: formData1 });
    // small wait to ensure different timestamps if needed, though sequential order is preserved
    await new Promise(r => setTimeout(r, 100));
    await fetch(`${BASE_URL}/analyze`, { method: 'POST', body: formData2 });

    const res = await fetch(`${BASE_URL}/history`);
    const data = await res.json();
    assert.strictEqual(data.length, 2);
    // The first item in history should be the second upload (standard_dev.docx)
    assert.strictEqual(data[0].filename, 'standard_dev.docx');
    assert.strictEqual(data[1].filename, 'standard_dev.pdf');
  });

});
