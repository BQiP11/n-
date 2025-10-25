import { GoogleGenAI, Type } from "@google/genai";
import type { Chapter, QuizQuestion } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = 'gemini-2.5-flash';

// Schemas for individual items
const vocabularySchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: 'The vocabulary word in Japanese, used as a unique ID.' },
        word: { type: Type.STRING, description: 'The vocabulary word in Japanese.' },
        furigana: { type: Type.STRING, description: 'The furigana reading for the word.' },
        meaning_vi: { type: Type.STRING, description: 'The Vietnamese meaning of the word.' },
        example_jp: { type: Type.STRING, description: 'An example sentence in Japanese, with furigana for kanji formatted like [漢字]{かんじ}.' },
        example_en: { type: Type.STRING, description: 'The English translation of the example sentence.' },
      },
      required: ['id', 'word', 'furigana', 'meaning_vi', 'example_jp', 'example_en'],
    },
};

const grammarSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING, description: 'The grammar point, used as a unique ID.' },
            grammar: { type: Type.STRING, description: 'The grammar point.' },
            meaning_vi: { type: Type.STRING, description: 'The Vietnamese meaning of the grammar point.' },
            formation: { type: Type.STRING, description: 'How the grammar point is formed (e.g., V-plain + こと).' },
            example_jp: { type: Type.STRING, description: 'An example sentence in Japanese, with furigana for kanji formatted like [漢字]{かんじ}.' },
            example_en: { type: Type.STRING, description: 'The English translation of the example sentence.' },
        },
        required: ['id', 'grammar', 'meaning_vi', 'formation', 'example_jp', 'example_en'],
    },
};

// Schema for the entire textbook
const textbookSchema = {
    type: Type.ARRAY,
    description: "An array of 10 chapters for an N3 textbook.",
    items: {
        type: Type.OBJECT,
        properties: {
            chapter: { type: Type.INTEGER, description: 'The chapter number.' },
            title: { type: Type.STRING, description: 'A thematic title for the chapter in Vietnamese (e.g., "Cuộc sống ở Thành phố").' },
            vocabulary: { ...vocabularySchema, description: "List of 8-10 related N3 vocabulary words for this chapter." },
            grammar: { ...grammarSchema, description: "List of 3-4 related N3 grammar points for this chapter." },
            dependencies: { type: Type.ARRAY, items: { type: Type.INTEGER }, description: 'An array of prerequisite chapter numbers. Chapter 1 has an empty array.'}
        },
        required: ['chapter', 'title', 'vocabulary', 'grammar', 'dependencies'],
    }
};

const quizSchema = {
    type: Type.ARRAY,
    description: 'An array of 8 quiz questions.',
    items: {
        type: Type.OBJECT,
        properties: {
            question: { type: Type.STRING, description: 'The quiz question (in Vietnamese for vocabulary, in Japanese for grammar).' },
            options: {
                type: Type.ARRAY,
                description: 'An array of 4 possible answers.',
                items: { type: Type.STRING }
            },
            answerIndex: { type: Type.INTEGER, description: 'The 0-based index of the correct answer in the options array.' },
            explanation: { type: Type.STRING, description: 'A brief explanation in Vietnamese for why the answer is correct.' },
        },
        required: ['question', 'options', 'answerIndex', 'explanation']
    }
};

export const generateN3Textbook = async (): Promise<Chapter[]> => {
    const prompt = `Generate a complete JLPT N3 textbook curriculum for a Vietnamese learner, structured into 10 distinct chapters. Each chapter should have a thematic Vietnamese title. Define dependencies for chapters, e.g., chapter 2 depends on chapter 1.

For each chapter, provide:
1.  **chapter**: The chapter number (1-10).
2.  **title**: A thematic title in Vietnamese (e.g., "Giao tiếp tại Công ty," "Kế hoạch Du lịch").
3.  **vocabulary**: An array of 8-10 N3 vocabulary words related to the theme. For each word, include: id (the word), word, furigana, meaning_vi, example_jp (with furigana like [漢字]{かんじ}), and example_en.
4.  **grammar**: An array of 3-4 N3 grammar points. For each point, include: id (the grammar structure), grammar, meaning_vi, formation, example_jp (with furigana like [漢字]{かんじ}), and example_en.
5.  **dependencies**: An array of chapter numbers this chapter depends on. Chapter 1 should have an empty array [].

Return the entire textbook as a single JSON array of chapter objects.`;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: textbookSchema },
    });
    
    const parsedText = response.text.trim();
    return JSON.parse(parsedText);
};

export const generateChapterQuiz = async (chapter: Chapter): Promise<QuizQuestion[]> => {
    const vocabList = chapter.vocabulary.map(v => `${v.word} (${v.meaning_vi})`).join(', ');
    const grammarList = chapter.grammar.map(g => `${g.grammar} (${g.meaning_vi})`).join(', ');

    const prompt = `Based on the content of this JLPT N3 chapter for a Vietnamese learner, create a quiz with 8 multiple-choice questions (4 for vocabulary, 4 for grammar).

**Chapter Title:** ${chapter.title}
**Vocabulary:** ${vocabList}
**Grammar:** ${grammarList}

**Instructions:**
-   **Vocabulary Questions:** Ask for the meaning of a Japanese word or the word for a Vietnamese meaning. Questions should be in Vietnamese.
-   **Grammar Questions:** Create fill-in-the-blank style questions in Japanese (use "＿＿＿"). Options should test the correct usage of the grammar points.
-   For **ALL** questions, provide a brief, helpful 'explanation' in Vietnamese for why the correct answer is correct.

Return the result as a JSON array of question objects.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: quizSchema },
    });
    const parsedText = response.text.trim();
    return JSON.parse(parsedText);
};

export const analyzeQuizResults = async (wrongAnswers: { question: string; userAnswer: string; correctAnswer: string }[]): Promise<string> => {
    if (wrongAnswers.length === 0) {
        return "Tuyệt vời! Bạn đã trả lời đúng tất cả các câu hỏi. Có vẻ như bạn đã nắm vững kiến thức của chương này. Hãy tiếp tục phát huy!";
    }

    const prompt = `You are an expert Japanese tutor analyzing a Vietnamese student's quiz results for JLPT N3. Here are the questions they answered incorrectly:
${wrongAnswers.map(ans => `- Question: "${ans.question}"\n  - Their Answer: "${ans.userAnswer}"\n  - Correct Answer: "${ans.correctAnswer}"`).join('\n')}

Based on these mistakes, please provide a concise and encouraging analysis in Vietnamese.
1.  Identify the main patterns or types of mistakes (e.g., confusion between similar grammar points, misunderstanding vocabulary nuances).
2.  Give a brief, constructive feedback summary.
3.  Suggest 2-3 specific topics or concepts they should review from this chapter.
4.  End with a motivational sentence.

Keep the entire response under 100 words. Format it using Markdown. For example:
**Phân tích Synapse:**
*   **Điểm yếu chính:** Có vẻ bạn còn hơi nhầm lẫn giữa...
*   **Góp ý:** Hãy chú ý hơn đến...
*   **Đề xuất ôn tập:** 「Grammar A」, 「Vocabulary B」
Cố gắng lên, bạn sắp làm được rồi!`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt
    });

    return response.text;
};