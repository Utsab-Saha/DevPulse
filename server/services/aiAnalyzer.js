import dotenv from 'dotenv';
dotenv.config();

import Groq from 'groq-sdk';

class AIAnalyzer {
  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  async analyzeCommit(commit, repoContext) {
    try {
      const prompt = `Analyze this Git commit and provide a detailed assessment:

Repository: ${repoContext.name}
Commit Author: ${commit.author}
Commit Message: ${commit.message}
Files Changed: ${commit.files?.length || 0}
Additions: +${commit.stats?.additions || 0}
Deletions: -${commit.stats?.deletions || 0}

Changed Files:
${commit.files?.map(f => `- ${f.filename} (+${f.additions}, -${f.deletions})`).join('\n') || 'No files data'}

Commit Details:
${commit.patch || 'No patch data available'}

Please analyze this commit and provide:
1. Code Quality Score (0-100): Based on code structure, naming conventions, and best practices
2. Impact Score (0-100): Based on the significance and scope of changes
3. Documentation Score (0-100): Based on commit message quality and code comments
4. Testing Score (0-100): Based on test coverage and testing practices evident in the commit
5. Overall Score (0-100): Weighted average of all scores
6. Key Strengths: List 2-3 positive aspects
7. Areas for Improvement: List 2-3 suggestions
8. Summary: Brief 2-3 sentence assessment

Return your analysis in this exact JSON format:
{
  "codeQuality": 85,
  "impact": 70,
  "documentation": 60,
  "testing": 75,
  "overall": 72,
  "strengths": ["Clear commit message", "Good code structure"],
  "improvements": ["Add more test coverage", "Include inline comments"],
  "summary": "Solid commit with clean code and clear intent. Would benefit from additional documentation."
}`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert code reviewer and software engineering mentor. Analyze commits objectively and provide constructive feedback. Always return valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 1000,
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      
      // Extract JSON from response (handle markdown code blocks)
      let jsonText = responseText;
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      const analysis = JSON.parse(jsonText);
      
      return {
        ...analysis,
        analyzedAt: new Date().toISOString(),
        commitSha: commit.sha,
      };
    } catch (error) {
      console.error('AI Analysis Error:', error);
      // Return default scores if AI fails
      return {
        codeQuality: 50,
        impact: 50,
        documentation: 50,
        testing: 50,
        overall: 50,
        strengths: ['Commit submitted'],
        improvements: ['Analysis unavailable'],
        summary: 'Unable to analyze commit at this time.',
        analyzedAt: new Date().toISOString(),
        commitSha: commit.sha,
        error: true,
      };
    }
  }

  async generateProjectInsights(analytics) {
    try {
      const avgScores = this.calculateAverageScores(analytics);
      const prompt = `Based on this team's development analytics, provide insights:

Average Scores:
- Code Quality: ${avgScores.codeQuality}/100
- Impact: ${avgScores.impact}/100
- Documentation: ${avgScores.documentation}/100
- Testing: ${avgScores.testing}/100
- Overall: ${avgScores.overall}/100

Total Commits Analyzed: ${analytics.length}

Provide:
1. Team Strengths (2-3 points)
2. Areas to Focus On (2-3 points)
3. Actionable Recommendations (2-3 points)

Return in JSON format:
{
  "strengths": ["High code quality", "Strong documentation"],
  "focusAreas": ["Improve test coverage", "Increase commit frequency"],
  "recommendations": ["Implement peer review process", "Create coding standards doc"]
}`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a technical lead providing actionable insights to improve team performance.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.5,
        max_tokens: 500,
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      let jsonText = responseText;
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Insights Generation Error:', error);
      return {
        strengths: ['Active development'],
        focusAreas: ['Continue current practices'],
        recommendations: ['Keep up the good work'],
      };
    }
  }

  calculateAverageScores(analytics) {
    if (analytics.length === 0) {
      return { codeQuality: 0, impact: 0, documentation: 0, testing: 0, overall: 0 };
    }

    const totals = analytics.reduce(
      (acc, curr) => ({
        codeQuality: acc.codeQuality + (curr.codeQuality || 0),
        impact: acc.impact + (curr.impact || 0),
        documentation: acc.documentation + (curr.documentation || 0),
        testing: acc.testing + (curr.testing || 0),
        overall: acc.overall + (curr.overall || 0),
      }),
      { codeQuality: 0, impact: 0, documentation: 0, testing: 0, overall: 0 }
    );

    return {
      codeQuality: Math.round(totals.codeQuality / analytics.length),
      impact: Math.round(totals.impact / analytics.length),
      documentation: Math.round(totals.documentation / analytics.length),
      testing: Math.round(totals.testing / analytics.length),
      overall: Math.round(totals.overall / analytics.length),
    };
  }
}

export default new AIAnalyzer();
