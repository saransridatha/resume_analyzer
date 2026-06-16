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

test.describe('Tier 3: Cross-Feature Combinations', () => {

  test.beforeEach(() => {
    resetDb();
  });

  test('TC-T3-001: Parse-Score-History Pipeline', async () => {
    // 1. Upload standard_dev.pdf with react_developer.txt
    const formData = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    const analyzeRes = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    assert.strictEqual(analyzeRes.status, 200);
    const analyzeData = await analyzeRes.json();
    assert.strictEqual(analyzeData.atsScore, 85);
    const uploadId = analyzeData.id;

    // 2. Retrieve history
    const historyRes = await fetch(`${BASE_URL}/history`);
    assert.strictEqual(historyRes.status, 200);
    const historyData = await historyRes.json();
    
    // 3. Verify history contains the correct record
    assert.strictEqual(historyData.length, 1);
    assert.strictEqual(historyData[0].id, uploadId);
    assert.strictEqual(historyData[0].atsScore, 85);
  });

  test('TC-T3-002: Sequential Uploads & Accumulation', async () => {
    // 1. Upload PDF
    const formData1 = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    await fetch(`${BASE_URL}/analyze`, { method: 'POST', body: formData1 });
    
    // Small delay
    await new Promise(r => setTimeout(r, 100));

    // 2. Upload DOCX
    const formData2 = await makeFormData('standard_dev.docx', 'react_developer.txt');
    await fetch(`${BASE_URL}/analyze`, { method: 'POST', body: formData2 });

    // 3. Verify history has accumulated and is in LIFO order
    const res = await fetch(`${BASE_URL}/history`);
    const history = await res.json();
    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].filename, 'standard_dev.docx');
    assert.strictEqual(history[1].filename, 'standard_dev.pdf');
  });

  test('TC-T3-003: Score Dependency on Job Description', async () => {
    // 1. Upload standard dev resume against React Developer JD (strong match)
    const formData1 = await makeFormData('standard_dev.pdf', 'react_developer.txt');
    const res1 = await fetch(`${BASE_URL}/analyze`, { method: 'POST', body: formData1 });
    const data1 = await res1.json();

    // 2. Upload same resume against Backend Engineer JD (weaker match)
    const formData2 = await makeFormData('standard_dev.pdf', 'backend_engineer.txt');
    const res2 = await fetch(`${BASE_URL}/analyze`, { method: 'POST', body: formData2 });
    const data2 = await res2.json();

    // 3. Verify React JD score is higher
    assert.ok(data1.atsScore > data2.atsScore);
  });

  test('TC-T3-004: AI Optimization Correlation with JD Gaps', async () => {
    // 1. Upload standard dev resume against Docker/Kubernetes JD
    const formData = await makeFormData('standard_dev.pdf', 'docker_k8s.txt');
    const res = await fetch(`${BASE_URL}/analyze`, { method: 'POST', body: formData });
    const data = await res.json();

    // 2. Verify Docker/K8s are identified in missingSkills
    assert.ok(data.geminiFeedback.missingSkills.includes('Docker'));
    assert.ok(data.geminiFeedback.missingSkills.includes('Kubernetes'));

    // 3. Verify optimization includes a deployment bullet
    const opt = data.geminiFeedback.bulletPointOptimizations[0];
    assert.ok(opt.optimized.includes('Docker') && opt.optimized.includes('Kubernetes'));
  });

  test('TC-T3-005: Multi-Candidate Scoring Comparison for Same JD', async () => {
    // 1. Candidate A (strong React Dev match)
    const formDataA = await makeFormData('candidate_a.pdf', 'react_developer.txt');
    const resA = await fetch(`${BASE_URL}/analyze`, { method: 'POST', body: formDataA });
    const dataA = await resA.json();

    // 2. Candidate B (poor React Dev match, only HTML/CSS)
    const formDataB = await makeFormData('candidate_b.pdf', 'react_developer.txt');
    const resB = await fetch(`${BASE_URL}/analyze`, { method: 'POST', body: formDataB });
    const dataB = await resB.json();

    // 3. Compare scores
    assert.ok(dataA.atsScore > dataB.atsScore);
  });

});
