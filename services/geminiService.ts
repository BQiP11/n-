import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { Chapter, QuizQuestion, LearningItem, VocabularyWord, GrammarPoint, KanjiCharacter, AnalysisResult } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = 'gemini-2.5-flash';
const ttsModel = 'gemini-2.5-flash-preview-tts';

// Type guards for LearningItem
function isVocabulary(item: LearningItem): item is VocabularyWord { return 'word' in item; }
function isGrammar(item: LearningItem): item is GrammarPoint { return 'grammar' in item; }
function isKanji(item: LearningItem): item is KanjiCharacter { return 'kanji' in item; }


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
        type: { type: Type.STRING, description: 'The word type in Vietnamese (e.g., "Danh từ", "Động từ nhóm 1").' },
        explanation_vi: { type: Type.STRING, description: 'A detailed explanation in Vietnamese about the word\'s nuance and usage.' },
        example_jp: { type: Type.STRING, description: 'An example sentence in Japanese, with furigana for kanji formatted like [漢字]{かんじ}.' },
        example_en: { type: Type.STRING, description: 'The English translation of the example sentence.' },
      },
      required: ['id', 'word', 'furigana', 'meaning_vi', 'type', 'explanation_vi', 'example_jp', 'example_en'],
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
            explanation_vi: { type: Type.STRING, description: 'A detailed explanation in Vietnamese about usage, common mistakes, and similar patterns.' },
            example_jp: { type: Type.STRING, description: 'An example sentence in Japanese, with furigana for kanji formatted like [漢字]{かんじ}.' },
            example_en: { type: Type.STRING, description: 'The English translation of the example sentence.' },
        },
        required: ['id', 'grammar', 'meaning_vi', 'formation', 'explanation_vi', 'example_jp', 'example_en'],
    },
};

const kanjiSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING, description: 'The Kanji character, used as a unique ID.' },
            kanji: { type: Type.STRING, description: 'The Kanji character.' },
            meaning_vi: { type: Type.STRING, description: 'The Vietnamese meaning of the Kanji.' },
            on_yomi: { type: Type.STRING, description: 'The On-yomi reading in Katakana.' },
            kun_yomi: { type: Type.STRING, description: 'The Kun-yomi reading in Hiragana.' },
            stroke_count: { type: Type.INTEGER, description: 'The number of strokes.' },
            radical: { type: Type.STRING, description: 'The main radical of the Kanji.' },
            mnemonic_vi: { type: Type.STRING, description: 'A creative mnemonic in Vietnamese to help remember the Kanji.' },
            examples: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        word: { type: Type.STRING, description: 'An example word using the Kanji.' },
                        reading: { type: Type.STRING, description: 'The reading of the example word in Hiragana.' },
                        meaning_vi: { type: Type.STRING, description: 'The Vietnamese meaning of the example word.' },
                    },
                    required: ['word', 'reading', 'meaning_vi'],
                }
            }
        },
        required: ['id', 'kanji', 'meaning_vi', 'on_yomi', 'kun_yomi', 'stroke_count', 'radical', 'mnemonic_vi', 'examples'],
    }
};

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
            kanji: { ...kanjiSchema, description: "List of 3-4 related N3 Kanji characters for this chapter." },
            dependencies: { type: Type.ARRAY, items: { type: Type.INTEGER }, description: 'An array of prerequisite chapter numbers. Chapter 1 has an empty array.'}
        },
        required: ['chapter', 'title', 'vocabulary', 'grammar', 'kanji', 'dependencies'],
    }
};

const quizSchema = {
    type: Type.ARRAY,
    description: 'An array of quiz questions.',
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING, description: 'A unique identifier for the question, e.g., "q1".' },
            question: { type: Type.STRING, description: 'The quiz question.' },
            options: {
                type: Type.ARRAY,
                description: 'An array of 4 possible answers.',
                items: { type: Type.STRING }
            },
            answerIndex: { type: Type.INTEGER, description: 'The 0-based index of the correct answer in the options array.' },
            explanation: { type: Type.STRING, description: 'A brief explanation in Vietnamese for why the answer is correct.' },
            relatedItemId: { type: Type.STRING, description: 'The ID of the vocabulary, grammar, or kanji item this question is testing.' }
        },
        required: ['id', 'question', 'options', 'answerIndex', 'explanation', 'relatedItemId']
    }
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        analysisText: { type: Type.STRING, description: 'The formatted Markdown text analyzing the user\'s weaknesses in Vietnamese.' },
        reviewTopics: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'An array of 2-3 specific topics or concepts to review, e.g., ["Trợ từ 「に」 và 「で」", "Cách dùng 「〜はずだ」"].' }
    },
    required: ['analysisText', 'reviewTopics'],
};

export const generateN3Textbook = async (): Promise<Chapter[]> => {
    const prompt = `Generate a complete, DETAILED JLPT N3 textbook for a Vietnamese learner, structured into 10 distinct chapters. Each chapter must have a thematic Vietnamese title and dependencies.

For each item in each chapter, provide ALL the following detailed fields:
1.  **vocabulary**: (8-10 words) id, word, furigana, meaning_vi, **type** (word type in Vietnamese), **explanation_vi** (detailed nuance), example_jp (with [漢字]{かんじ} furigana), example_en.
2.  **grammar**: (3-4 points) id, grammar, meaning_vi, formation, **explanation_vi** (detailed usage, common mistakes), example_jp (with [漢字]{かんじ} furigana), example_en.
3.  **kanji**: (3-4 characters) id, kanji, meaning_vi, on_yomi, kun_yomi, **stroke_count**, **radical**, **mnemonic_vi** (creative memory aid), and 2-3 examples.

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
    const itemContext = chapter.vocabulary.map(v => v.id).concat(chapter.grammar.map(g => g.id)).concat(chapter.kanji.map(k => k.id));
    const prompt = `Based on the content of this JLPT N3 chapter for a Vietnamese learner, create a quiz with 8 multiple-choice questions (3 vocab, 3 grammar, 2 kanji).

**Chapter Title:** ${chapter.title}
**Item IDs available for testing:** ${itemContext.join(', ')}

**Instructions:**
-   For each question, you MUST include a 'relatedItemId' field referencing one of the IDs provided above.
-   Create diverse questions testing meaning, usage, and reading.
-   Provide a brief 'explanation' in Vietnamese for why the correct answer is correct.

Return the result as a JSON array of question objects.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { ...quizSchema, description: 'An array of 8 quiz questions.' } },
    });
    const parsedText = response.text.trim();
    return JSON.parse(parsedText);
};


export const generateAssessmentTest = async (allItems: LearningItem[]): Promise<QuizQuestion[]> => {
    const itemContext = allItems.map(i => i.id).slice(0, 100).join(', '); // Limit context size
    const prompt = `Create a 15-question JLPT N3 placement test for a new Vietnamese learner. The test should cover a wide range of N3 topics to gauge their current ability.

**Item IDs available for testing (sample):** ${itemContext}

**Instructions:**
-   Select a diverse mix of vocabulary, grammar, and Kanji from the provided item IDs.
-   For each question, you MUST include a 'relatedItemId' field referencing one of the IDs.
-   Question difficulty should range from easy to hard.
-   Provide a brief 'explanation' in Vietnamese.

Return the result as a JSON array of 15 question objects.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { ...quizSchema, description: 'An array of 15 assessment questions.' } },
    });
    const parsedText = response.text.trim();
    return JSON.parse(parsedText);
};

export const generateContextualExercise = async (item: LearningItem): Promise<QuizQuestion[]> => {
    let itemContext = '';
    let questionType = '';

    if (isVocabulary(item)) {
        itemContext = `Từ vựng: ${item.word} (${item.furigana}) - ${item.meaning_vi}`;
        questionType = 'Create one multiple-choice question in Japanese that tests the usage of this word in a sentence (fill-in-the-blank style). The question should be a simple context where this word fits best.';
    } else if (isGrammar(item)) {
        itemContext = `Ngữ pháp: ${item.grammar} - ${item.meaning_vi}`;
        questionType = 'Create one multiple-choice question in Japanese that tests this specific grammar point. It should be a fill-in-the-blank question.';
    } else if (isKanji(item)) {
        itemContext = `Kanji: ${item.kanji} - ${item.meaning_vi} (On: ${item.on_yomi}, Kun: ${item.kun_yomi})`;
        questionType = 'Create one multiple-choice question in Japanese that asks for the correct reading (in hiragana) of an example word containing this Kanji.';
    }

    const prompt = `For a Vietnamese learner of Japanese (N3), generate ONE single contextual, multiple-choice practice question based on the following item.

**Item:** ${itemContext}

**Instruction:** ${questionType}

Provide 4 options. Include a brief, helpful 'explanation' in Vietnamese. You MUST include a 'relatedItemId' field with the value "${item.id}". Return the result as a JSON array containing just ONE question object.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { ...quizSchema, description: 'An array containing a single quiz question.' } },
    });
    const parsedText = response.text.trim();
    return JSON.parse(parsedText);
}

export const analyzeQuizResults = async (wrongAnswers: { question: string; userAnswer: string; correctAnswer: string }[]): Promise<AnalysisResult> => {
    if (wrongAnswers.length === 0) {
        return {
            analysisText: "Tuyệt vời! Bạn đã trả lời đúng tất cả các câu hỏi. Có vẻ như bạn đã nắm vững kiến thức của chương này. Hãy tiếp tục phát huy!",
            reviewTopics: []
        };
    }

    const prompt = `You are an expert Japanese tutor analyzing a Vietnamese student's quiz results for JLPT N3. Here are the questions they answered incorrectly:
${wrongAnswers.map(ans => `- Question: "${ans.question}"\n  - Their Answer: "${ans.userAnswer}"\n  - Correct Answer: "${ans.correctAnswer}"`).join('\n')}

Based on these mistakes, provide an analysis object containing:
1.  'analysisText': A concise, encouraging analysis in Vietnamese (under 100 words, Markdown formatted). Identify mistake patterns, give constructive feedback, and end with a motivational sentence.
2.  'reviewTopics': An array of 2-3 specific, short string topics they should review (e.g., "Cách dùng 「〜はずだ」", "Phân biệt 「に」 và 「で」").

Example analysisText format:
**Phân tích Synapse:**
*   **Điểm yếu chính:** Có vẻ bạn còn hơi nhầm lẫn giữa...
*   **Góp ý:** Hãy chú ý hơn đến...
Cố gắng lên, bạn sắp làm được rồi!`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: analysisSchema }
    });
    const parsedText = response.text.trim();
    return JSON.parse(parsedText);
};

export const generateReviewQuiz = async (topicsOrItems: string[] | LearningItem[]): Promise<QuizQuestion[]> => {
    let context = '';
    if (topicsOrItems.length === 0) return [];
    
    if (typeof topicsOrItems[0] === 'string') {
        context = `Topics to review: ${(topicsOrItems as string[]).join(', ')}`;
    } else {
        context = `Items to review: ${(topicsOrItems as LearningItem[]).map(item => `'${item.id}'`).join(', ')}`;
    }

    const prompt = `For a Vietnamese JLPT N3 learner, create a personalized review quiz with 5 multiple-choice questions.

**${context}**

**Instructions:**
-   Create diverse questions (fill-in-the-blank, meaning check, correct usage) that specifically target the review topics/items.
-   For each question, you MUST include a 'relatedItemId' field referencing the ID of the item being tested.
-   All questions and explanations must be in Vietnamese, except for Japanese text in the questions/options.
-   Provide a brief, helpful 'explanation' in Vietnamese for each question.
-   Return the result as a JSON array of question objects.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { ...quizSchema, description: 'An array of 5 review quiz questions.' } },
    });
    const parsedText = response.text.trim();
    return JSON.parse(parsedText);
};


export const generateSpeech = async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: ttsModel,
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data returned from API.");
    }
    return base64Audio;
};