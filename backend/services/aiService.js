import OpenAI from 'openai';

// FIX: third argument is now resumeText (a string), not a filePath
export const screenResumeWithAI = async (jobDescription, skillsRequired, resumeText) => {
  try {
    if (!resumeText || !resumeText.trim()) {
      return {
        resumeText: '',
        matchScore: 0,
        shortlisted: false,
        summary: 'No readable text found in resume (it may be a scanned PDF).',
        matchedSkills: [],
        missingSkills: skillsRequired || []
      };
    }

    const openrouter = new OpenAI({ 
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1' 
    });

    const limitedText = resumeText.slice(0, 15000); // avoid oversized prompts

    const prompt = `
      You are an expert AI Applicant Tracking System (ATS). 
      Analyze the candidate resume text against the job requirements below.

      Job Description:
      ${jobDescription}

      Required Skills:
      ${JSON.stringify(skillsRequired || [])}

      Candidate Resume Text:
      ${limitedText}

      Instructions:
      1. Evaluate candidate fit based on skills, experience, and project context.
      2. If no required skills are listed, infer the key skills from the job description.
      3. Return ONLY a valid JSON object matching this exact schema (no markdown formatting, no backticks, no explanatory text):

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

    // FIX: grab the JSON object even if the model adds extra text around it
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    const cleanJson = rawText.slice(firstBrace, lastBrace + 1);
    const aiResult = JSON.parse(cleanJson);

    console.log('✅ Successfully screened resume via OpenRouter! Match Score:', aiResult.matchScore);

    return {
      resumeText,
      ...aiResult
    };

  } catch (error) {
    console.error('❌ OpenRouter ATS Screening Error:', error.message);
    // FIX: honest fallback instead of a fake 65% score
    return {
      resumeText,
      matchScore: 0,
      shortlisted: false,
      summary: 'Automated AI screening failed. Review resume manually.',
      matchedSkills: [],
      missingSkills: []
    };
  }
};