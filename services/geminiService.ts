import { GoogleGenAI, Type } from "@google/genai";
const API_KEY = "";
const MODEL = "gemini-2.5-flash";

export const generateSmartSurvey = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const systemInstruction = `
    You are an expert survey designer for the Indian Government (MoSPI).
    Generate a professional survey JSON based on the user's prompt.
    
    CRITICAL INSTRUCTIONS FOR DYNAMIC LOGIC:
    1. You MUST generate AT LEAST 2-3 questions that use conditional logic ('logic' field).
    2. These follow-up questions should only appear based on the answer to a previous question.
    3. Use simple, short IDs for questions (e.g., "q1", "q2", "q3").
    4. Ensure the 'logic.value' exactly matches one of the 'options' of the parent question.
    
    Example Logic:
    - Q1 (id: "q1"): "Do you have a gas connection?" [Yes, No]
    - Q2 (id: "q2"): "How many cylinders?" -> Include logic: { "dependsOn": "q1", "operator": "equals", "value": "Yes" }
    
    The survey must include:
    1. title: A formal title.
    2. description: A clear purpose.
    3. questions: An array of questions (Mix of standard and conditional).
    
    For each question:
    - 'id': Short identifier (q1, q2...).
    - 'text' & 'text_hi': English and Hindi text.
    - 'type': TEXT, MULTIPLE_CHOICE, RATING, DATE, or NUMBER.
    - 'mospiCode': Suggest a relevant National Classification Code (e.g., NCO-2015).
    - 'options' & 'options_hi': Arrays of strings (Required for MULTIPLE_CHOICE).
    - 'logic': Optional conditional branching object.
    
    Ensure the JSON is strictly valid.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                  text_hi: { type: Type.STRING },
                  type: {
                    type: Type.STRING,
                    description: "TEXT, MULTIPLE_CHOICE, RATING, DATE, or NUMBER",
                  },
                  mospiCode: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  options_hi: { type: Type.ARRAY, items: { type: Type.STRING } },
                  required: { type: Type.BOOLEAN },
                  logic: {
                    type: Type.OBJECT,
                    properties: {
                      dependsOn: { type: Type.STRING },
                      operator: { type: Type.STRING },
                      value: { type: Type.STRING },
                    },
                    required: ["dependsOn", "operator", "value"],
                  },
                },
                required: ["id", "text", "text_hi", "type", "required"],
              },
            },
          },
          required: ["title", "description", "questions"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Gemini returned an empty response.");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Smart Survey Generation Error:", error);
    throw error;
  }
};

export const analyzeSurveyParadata = async (responses: any[]) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `
    Analyze the following survey response data and paradata for a government audit.
    Focus on data integrity, submission speed anomalies, GPS consistency (if available), and response patterns.
    
    Data for Analysis:
    ${JSON.stringify(responses, null, 2)}
    
    Please provide:
    1. An overall data quality score (0-100).
    2. Identification of any suspicious enumerator behavior (e.g., GPS jumping, too fast).
    3. Actionable insights for the field supervisor.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    return response.text || "Analysis could not be generated at this time.";
  } catch (error) {
    console.error("Gemini Paradata Analysis Error:", error);
    throw error;
  }
};

export const autoCodeTextResponse = async (question: string, answer: string) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Map the following answer to a standard category or code.
      Question: "${question}"
      Answer: "${answer}"
      
      Return a JSON with 'code' (a short alphanumeric standard code suggestion like NCO or NIC) and 'category' (standardized label).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            code: { type: Type.STRING },
            category: { type: Type.STRING },
          },
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Auto-coding Error:", error);
    return { code: "UNC", category: "Unclassified" };
  }
};
