
import { GoogleGenAI } from "@google/genai";
import { Incident } from "../types";

export const analyzePerformance = async (
  entityName: string,
  entityType: 'Technician' | 'Vendor',
  incidents: Incident[],
  banContext: string | null = null
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const incidentContext = incidents.map(inc => (
    `Incident: ${inc.incidentNumber}
    Date: ${inc.date}
    Scores: Overall=${inc.overallScore}, Punctuality=${inc.punctualityScore}, Deliverables=${inc.deliverablesScore}
    Abandoned: ${inc.isAbandoned ? 'Yes' : 'No'}
    Feedback: ${inc.feedback}`
  )).join('\n---\n');

  const banMessage = banContext 
    ? `IMPORTANT: This technician is currently BLACKLISTED for the following projects: ${banContext}.`
    : "";

  const prompt = `
    You are an AI performance analyst specialized in evaluating field technicians and vendors based on structured operational reviews.
    Analyze the following dataset for ${entityType}: ${entityName}.
    
    ${banMessage}

    Data Context:
    - Punctuality Score (1-5): 5=On time, 4=15m late, 3=30m late, 2=1h late, 1=1.5h+ late.
    - Deliverables Score (1-5): 5=<24h, 4=24h, 3=48h, 2=>48h, 1=Not sent.

    Data:
    ${incidentContext}

    Rules:
    - If ${banMessage} is present, you MUST start the report with a clear WARNING header.
    - Identify recurring patterns, trends, and operational risks.
    - Highlight strengths and weaknesses based ONLY on provided data.
    - Detect consistency or inconsistency in performance.
    - Consider abandon frequency as a critical negative factor.
    - Be professional, neutral, and concise.
    - Focus on operational impact and reliability.

    Output the report in the following EXACT format:

    Name (${entityType}): ${entityName}
    [BAN_STATUS_IF_APPLICABLE]
    Total Incidents Reviewed: [Count]
    Average Overall Performance: [Score]
    Average Punctuality: [Score]
    Average Timely Deliverables: [Score]
    Total Abandons: [Count]

    Performance Summary: [Paragraph]
    Strengths: [Bullet Points]
    Recurring Issues: [Bullet Points]
    Operational Risk Level (Low / Medium / High): [Level]
    Final Recommendation: [Final summary sentence incorporating ban status if applicable]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "Error generating analysis. Please try again later.";
  }
};
