import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import http from 'http';
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

test.describe('Tier 4: Real-World Workloads', () => {

  test.beforeEach(() => {
    resetDb();
  });

  test('TC-T4-001: High Concurrency Analysis Requests', async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      const formData = await makeFormData('standard_dev.pdf', 'react_developer.txt');
      promises.push(
        fetch(`${BASE_URL}/analyze`, {
          method: 'POST',
          body: formData
        })
      );
    }

    const responses = await Promise.all(promises);
    for (const res of responses) {
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(data.id);
    }
  });

  test('TC-T4-002: Gemini Rate Limiting (HTTP 429) & Backoff Retry', async () => {
    const formData = new FormData();
    const resumePath = path.join(FIXTURES_DIR, 'resumes', 'standard_dev.pdf');
    const resumeContent = fs.readFileSync(resumePath);
    formData.append('file', new Blob([resumeContent]), 'standard_dev.pdf');
    // Using a special job description to trigger mock 429 backoff retry simulation
    formData.append('jobDescription', 'Require React Developer. rate-limit-trigger');

    const start = Date.now();
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    const duration = Date.now() - start;

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.id);
    // The retry simulation introduces a wait of at least 100ms
    assert.ok(duration >= 90, `Expected duration to reflect internal retry delay, got ${duration}ms`);
  });

  test('TC-T4-003: Large Batch Sequential Evaluation', async () => {
    const start = Date.now();
    for (let i = 0; i < 20; i++) {
      const formData = await makeFormData('standard_dev.pdf', 'react_developer.txt');
      const res = await fetch(`${BASE_URL}/analyze`, {
        method: 'POST',
        body: formData
      });
      assert.strictEqual(res.status, 200);
    }
    const elapsed = Date.now() - start;
    
    // Ensure all 20 sequential uploads ran quickly (< 10 seconds)
    assert.ok(elapsed < 10000, `Expected 20 sequential runs to complete in < 10s, took ${elapsed}ms`);

    // Verify history has exactly 20 items
    const historyRes = await fetch(`${BASE_URL}/history`);
    const history = await historyRes.json();
    assert.strictEqual(history.length, 20);
  });

  test('TC-T4-004: Connection Aborted Mid-Upload', async () => {
    // We send a request using Node's http module directly and destroy it mid-transmission
    const promise = new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: PORT,
        path: '/api/analyze',
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundarytestabort'
        }
      });

      req.on('error', () => {
        // expect connection error due to abort
        resolve();
      });

      req.write('------WebKitFormBoundarytestabort\r\nContent-Disposition: form-data; name="file"; filename="abort.pdf"\r\nContent-Type: application/pdf\r\n\r\n');
      req.write('Some partial content...');
      
      setTimeout(() => {
        req.destroy();
      }, 10);
    });

    await promise;

    // Verify that the server remains completely healthy and responds to subsequent requests
    const formData = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.id);
  });

  test('TC-T4-005: E2E Candidate Optimization Cycle', async () => {
    // 1. Candidate uploads poor resume (no_skills.pdf)
    const formData1 = await makeFormData('no_skills.pdf', 'react_developer.txt');
    const res1 = await fetch(`${BASE_URL}/analyze`, { method: 'POST', body: formData1 });
    const data1 = await res1.json();
    assert.ok(data1.atsScore <= 40);
    assert.ok(data1.geminiFeedback.missingSkills.includes('React'));

    // 2. Candidate checks history to confirm score was tracked
    const historyRes1 = await fetch(`${BASE_URL}/history`);
    const history1 = await historyRes1.json();
    assert.strictEqual(history1.length, 1);
    assert.strictEqual(history1[0].atsScore, data1.atsScore);

    // 3. Candidate updates resume (we simulate this by uploading perfect_resume.pdf matching react_developer.txt)
    const formData2 = await makeFormData('perfect_resume.pdf', 'react_developer.txt');
    const res2 = await fetch(`${BASE_URL}/analyze`, { method: 'POST', body: formData2 });
    const data2 = await res2.json();
    assert.strictEqual(data2.atsScore, 100);
    assert.strictEqual(data2.geminiFeedback.missingSkills.length, 0);

    // 4. Candidate checks history and sees two entries reflecting the improvement
    const historyRes2 = await fetch(`${BASE_URL}/history`);
    const history2 = await historyRes2.json();
    assert.strictEqual(history2.length, 2);
    // Chronological descending order (perfect_resume.pdf first, then no_skills.pdf)
    assert.strictEqual(history2[0].filename, 'perfect_resume.pdf');
    assert.strictEqual(history2[1].filename, 'no_skills.pdf');
  });

});
