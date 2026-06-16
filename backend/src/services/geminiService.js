import { GoogleGenAI } from '@google/genai';

const responseSchema = {
  type: 'OBJECT',
  properties: {
    atsScore: {
      type: 'INTEGER',
      description: "ATS score from 0 to 100 based on fit, criteria, keywords, experience, and layout quality."
    },
    breakdown: {
      type: 'OBJECT',
      properties: {
        keywords: { type: 'INTEGER', description: "Keyword score (out of 30)" },
        skills: { type: 'INTEGER', description: "Skills score (out of 30)" },
        experience: { type: 'INTEGER', description: "Experience score (out of 25)" },
        formatting: { type: 'INTEGER', description: "Formatting score (out of 15)" }
      },
      required: ["keywords", "skills", "experience", "formatting"]
    },
    parsedDetails: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: "Candidate's full name" },
        email: { type: 'STRING', description: "Candidate's email address" },
        skills: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: "List of skills extracted from the resume"
        },
        experienceYears: { type: 'INTEGER', description: "Years of experience extracted from the resume" }
      },
      required: ["name", "email", "skills", "experienceYears"]
    },
    geminiFeedback: {
      type: 'OBJECT',
      properties: {
        overallFeedback: { type: 'STRING', description: "Overall feedback on the resume and its fit for the job" },
        missingSkills: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: "List of key skills present in the JD but missing in the resume. If JD is empty/whitespace, this must be empty."
        },
        bulletPointOptimizations: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              original: { type: 'STRING', description: "Original bullet point from the resume" },
              optimized: { type: 'STRING', description: "Rewritten bullet point using the XYZ formula (Accomplished [X] as measured by [Y], by doing [Z]). Make sure it has metrics, reducing, or % patterns." }
            },
            required: ["original", "optimized"]
          },
          description: "List of bullet point optimizations. If no bullet points are found in the resume, this must be empty."
        }
      },
      required: ["overallFeedback", "missingSkills", "bulletPointOptimizations"]
    }
  },
  required: ["atsScore", "breakdown", "parsedDetails", "geminiFeedback"]
};

/**
 * Call Google Gemini API to analyze resume
 * @param {string} resumeText 
 * @param {string} jobDescription 
 * @returns {Promise<object>}
 */
export async function analyzeResumeWithGemini(resumeText, jobDescription) {
  const apiKey = process.env.GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `You are an expert Applicant Tracking System (ATS) and professional resume builder.
Your task is to analyze the provided resume text against an optional job description (JD) and return a structured JSON response.

Follow these rules:
1. Extract candidate's details: name (full name, fallback to "Unknown Candidate"), email (email address, fallback to "unknown@example.com"), skills (list of key technical and soft skills), experienceYears (estimate of total professional experience years based on timeline).
2. Calculate an ATS Score (0 to 100) based on standard ATS best practices:
   - keywords (out of 30): matching and relevant terminology.
   - skills (out of 30): alignment of skills to industry standards or JD.
   - experience (out of 25): depth, duration, and progression of role responsibilities.
   - formatting (out of 15): scanability, layout conventions, bullets usage.
   - Total ATS Score is the sum of these four components. Clamp the total score between 0 and 100, and ensure all breakdown sub-scores are non-negative and clamped to their respective maximums (keywords <= 30, skills <= 30, experience <= 25, formatting <= 15).
3. If a job description is provided:
   - Identify missingSkills: important technical/functional skills mentioned in the JD that are not in the resume.
   - Tailor the overallFeedback to how well the resume aligns with the JD.
4. If the job description is empty, missing, or only whitespace:
   - missingSkills must be an empty array [].
   - overallFeedback should be a general assessment of the resume.
5. Provide bulletPointOptimizations:
   - Select up to 5 bullet points from the resume that can be improved.
   - Rewrite each using the XYZ formula: Accomplished [X] as measured by [Y], by doing [Z].
   - If no bullet points are found in the resume, return an empty array [].
   - Every optimized bullet point must contain metrics, reducing, or % patterns.
   - If the bullet points are already highly optimal, return the original bullet point unchanged for both original and optimized fields.
6. Clean output: do not include markdown or backticks in the response. Return strictly structured JSON matching the provided schema.`;

  const userPrompt = `RESUME TEXT:
${resumeText}

JOB DESCRIPTION:
${jobDescription || 'None'}`;

  let attempt = 0;
  const maxRetries = 3;
  
  while (attempt < maxRetries) {
    attempt++;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: userPrompt }] }
        ],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: responseSchema
        }
      });
      
      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini API returned an empty response');
      }
      
      return JSON.parse(responseText);
    } catch (error) {
      const isRateLimit = error.status === 429 || 
                          (error.message && error.message.includes('429')) || 
                          (error.statusText && error.statusText.includes('Too Many Requests'));
      
      if (isRateLimit && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`[Gemini API] 429 Rate Limited. Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
