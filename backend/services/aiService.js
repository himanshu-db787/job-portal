import OpenAI from 'openai';
import fs from 'fs';
import pdfParse from 'pdf-extraction';

export const screenResumeWithAI = async (jobDescription, skillsRequired, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return {
        resumeText: '',
        matchScore: 0,
        shortlisted: false,
        summary: 'No resume file provided.',
        matchedSkills: [],
        missingSkills: skillsRequired || []
      };
    }

    const openrouter = new OpenAI({ 
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1' 
    });

    const dataBuffer = fs.readFileSync(filePath);
    const parsedPdf = await pdfParse(dataBuffer);
    const resumeText = parsedPdf.text || '';

    const prompt = `
      You are an expert AI Applicant Tracking System (ATS). 
      Analyze the candidate resume text against the job requirements below.

      Job Description:
      ${jobDescription}

      Required Skills:
      ${JSON.stringify(skillsRequired || [])}

      Candidate Resume Text:
      ${resumeText}

      Instructions:
      1. Evaluate candidate fit based on skills, experience, and project context.
      2. Return ONLY a valid JSON object matching this exact schema (no markdown formatting, no backticks, no explanatory text):

      {
        "matchScore": <number between 0 and 100>,
        "shortlisted": <boolean, true if matchScore >= 70>,
        "summary": "<2-sentence evaluation of candidate suitability>",
        "matchedSkills": ["<skill1>"],
        "missingSkills": ["<missingSkill1>"]
      }
    `;

    const response = await openrouter.chat.completions.create({
      model: 'meta-llama/llama-3.3-70b-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    const rawText = response.choices[0].message.content.trim();
    const cleanJson = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
    const aiResult = JSON.parse(cleanJson);

    console.log('✅ Successfully screened resume via OpenRouter! Match Score:', aiResult.matchScore);

    return {
      resumeText,
      ...aiResult
    };

  } catch (error) {
    console.error('❌ CRITICAL OpenRouter ATS Screening Error:', error.message);
    return {
      resumeText: '',
      matchScore: 65,
      shortlisted: false,
      summary: 'Automated AI screening encountered an issue. Review resume manually.',
      matchedSkills: [],
      missingSkills: []
    };
  }
};