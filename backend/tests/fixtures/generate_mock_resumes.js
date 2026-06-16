import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resumesDir = path.join(__dirname, 'resumes');
const jdsDir = path.join(__dirname, 'jds');

// Ensure directories exist
fs.mkdirSync(resumesDir, { recursive: true });
fs.mkdirSync(jdsDir, { recursive: true });

// Helper to write files
const write = (dir, file, content) => {
  fs.writeFileSync(path.join(dir, file), content);
};

// 1. Resumes
write(resumesDir, 'standard_dev.pdf', '%PDF-1.5\nJohn Doe\njohn.doe@example.com\nExperience: 5 years\nSkills: JavaScript, React, Node.js\nWorked on a React application.');
write(resumesDir, 'standard_dev.docx', '[DOCX File]\nJohn Doe\njohn.doe@example.com\nExperience: 5 years\nSkills: JavaScript, React, Node.js\nWorked on a React application.');
write(resumesDir, 'no_skills.pdf', '%PDF-1.5\nNo Skills Candidate\nnoskills@example.com\nNo skills listed here.\nJust did basic administration work.');
write(resumesDir, 'non_ascii.pdf', '%PDF-1.5\nUnknown Candidate\nunknown@example.com\nРезюме разработчика\nПример текста на русском языке для проверки кодировки.\nNo selectable text blocks or image only.');
write(resumesDir, 'corrupted.pdf', 'NOT A VALID PDF OR CORRUPTED BYTES\nTHIS HAS NO PDF SIGNATURE AND IS ENTIRELY MALFORMED DATA');
write(resumesDir, 'empty.pdf', '');
write(resumesDir, 'resume.txt', 'This is a plain text resume file.\nJohn Doe\njohn.doe@example.com\nReact Developer');
write(resumesDir, 'résumé_🚀_2026.pdf', '%PDF-1.5\nJohn Doe\njohn.doe@example.com\nExperience: 5 years\nSkills: JavaScript, React, Node.js\nWorked on a React application.');
write(resumesDir, 'perfect_resume.pdf', '%PDF-1.5\nPerfect Candidate\nperfect@example.com\nExperience: 10 years\nSkills: JavaScript, React, Node.js, TypeScript, Docker, Kubernetes\nLed the team.');
write(resumesDir, 'skills_only.pdf', 'React, JavaScript, HTML, CSS');
write(resumesDir, 'code_snippet.pdf', 'Code Snippet Dev\ncode@example.com\nSkills: React, JavaScript\nAdded a <div> React element.');
write(resumesDir, 'long_bullet.pdf', 'Long Bullet Dev\nlong@example.com\nSkills: React\nWorked on a React application for a client in the financial industry where we had a lot of data tables and I had to spend a lot of time optimization performance and rendering times of these components so that they load faster when users scroll down the page.');
write(resumesDir, 'custom_bullets.pdf', 'Custom Bullets\ncustom@example.com\nSkills: React\n⭐ Designed database');
write(resumesDir, 'optimal_bullets.pdf', 'Optimal Bullets\noptimal@example.com\nSkills: React\nLed a team of 4 to build React app, reducing load time by 30%.');
write(resumesDir, 'candidate_a.pdf', 'Candidate A\ncanda@example.com\nSkills: JavaScript, React, Node.js, Redux\nExperience: 6 years');
write(resumesDir, 'candidate_b.pdf', 'Candidate B\ncandb@example.com\nSkills: HTML, CSS\nExperience: 1 year');

// Generate huge_resume.pdf (11MB of dummy text data)
console.log('Generating huge_resume.pdf...');
const hugeStream = fs.createWriteStream(path.join(resumesDir, 'huge_resume.pdf'));
hugeStream.write('%PDF-1.5\nHuge Resume File\n');
const chunkSize = 1024 * 1024; // 1MB chunk
const dummyData = Buffer.alloc(chunkSize, 'A');
for (let i = 0; i < 11; i++) {
  hugeStream.write(dummyData);
}
hugeStream.end(() => {
  console.log('huge_resume.pdf generated successfully.');
});

// 2. Job Descriptions
write(jdsDir, 'react_developer.txt', 'We are looking for a React Developer with experience in JavaScript, React, and Node.js. TypeScript experience is a plus.');
write(jdsDir, 'backend_engineer.txt', 'We are looking for a Backend Engineer with experience in Go, Node.js, and Kubernetes.');
write(jdsDir, 'empty_jd.txt', '');
write(jdsDir, 'unreasonable_requirements.txt', 'Looking for a developer with 40 years of Experience in React, 50 years in Node.js, and willing to work 24/7 for free.');
write(jdsDir, 'docker_k8s.txt', 'Require Docker and Kubernetes experience.');
write(jdsDir, 'whitespace_jd.txt', '   \n   ');
write(jdsDir, 'nonsense_jd.txt', 'First, preheat the oven to 375 degrees F (190 degrees C). Butter a 9x13 inch baking dish. In a large bowl, mix flour, sugar, and baking powder.');
write(jdsDir, 'minimal_jd.txt', 'Developer');

// Generate massive_jd.txt (50,000 characters)
const massiveJdContent = 'A'.repeat(50000);
write(jdsDir, 'massive_jd.txt', massiveJdContent);

// non-ascii JD
write(jdsDir, 'non_ascii_jd.txt', 'We are looking for a software engineer. Разработчик программного обеспечения.');

console.log('All mock assets generated successfully.');
