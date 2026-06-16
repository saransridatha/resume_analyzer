import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;
const BASE_URL = `http://localhost:${PORT}/api`;
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

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

test.describe('Tier 5: Adversarial Coverage & Hardening', () => {

  test('TC-T5-001: Path Traversal Attempt in Filename', async () => {
    const formData = new FormData();
    const resumePath = path.join(FIXTURES_DIR, 'resumes', 'standard_dev.pdf');
    const resumeContent = fs.readFileSync(resumePath);
    // Malicious filename
    formData.append('file', new Blob([resumeContent]), '../../../etc/passwd');

    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });

    // The server should reject the malformed filename with a 400 error
    assert.strictEqual(res.status, 400);
  });

  test('TC-T5-002: SQL/NoSQL Injection Payloads in JD', async () => {
    const formData = await makeFormData('standard_dev.pdf');
    // Injection payload
    formData.append('jobDescription', '{"$gt": ""} OR 1=1; DROP TABLE users;');

    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.id);
  });

  test('TC-T5-003: XSS Payloads in JD', async () => {
    const formData = await makeFormData('standard_dev.pdf');
    // XSS payload
    formData.append('jobDescription', '<script>alert("xss")</script><img src=x onerror=alert(1)>');

    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.id);
  });

  test('TC-T5-004: Missing Form Boundaries (Malformed Request)', async () => {
    // Send a request without multipart boundaries
    const promise = new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: PORT,
        path: '/api/analyze',
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data; boundary=missing'
        }
      }, (res) => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => resolve({ status: res.statusCode, body }));
      });

      req.on('error', (err) => resolve({ error: err }));
      // Body doesn't match boundary
      req.write('random garbage data instead of multipart body');
      req.end();
    });

    const res = await promise;
    // Multer or server should reject it gracefully, likely 400 or 500, but not crash
    assert.ok(res.status >= 400);
  });

  test('TC-T5-005: Extra Unwanted Fields in Form Data', async () => {
    const formData = await makeFormData('standard_dev.pdf');
    // Append fields not expected by the API
    formData.append('admin', 'true');
    formData.append('override_score', '100');
    formData.append('malicious_array', '["a", "b"]');

    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.id);
    // Score should not be arbitrarily overridden
    assert.ok(data.atsScore <= 100);
  });
});
