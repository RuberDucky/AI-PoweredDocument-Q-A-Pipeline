import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import logger from '../config/logger.js';

class AIService {
    constructor() {
        this.model = new ChatOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: 'gpt-4o-mini', // Using GPT-4o-mini for cost efficiency
            temperature: 0.1,
            maxTokens: 1000,
        });

        this.qaPromptTemplate = PromptTemplate.fromTemplate(`
You are a helpful AI assistant that answers questions based on the provided context.

Context:
{context}

Question: {question}

Please provide a comprehensive and accurate answer based on the context provided. If the context doesn't contain enough information to answer the question, please say so clearly.

Guidelines:
- Be concise but thorough
- Use specific details from the context when available
- If uncertain, acknowledge the limitation
- Maintain a professional and helpful tone

Answer:`);

        this.systemPrompt = `You are an intelligent document Q&A assistant. Your role is to:
1. Analyze the provided context carefully
2. Answer questions accurately based on the available information
3. Admit when you don't have enough information
4. Provide helpful and relevant responses
5. Maintain professional communication`;
    }

    async generateAnswer(question, context) {
        try {
            const startTime = Date.now();

            // Prepare the context from retrieved documents
            const contextText = context
                .map(
                    (doc) =>
                        `Document: ${doc.metadata.title}\nContent: ${doc.metadata.content}`,
                )
                .join('\n\n---\n\n');

            // Format the prompt
            const prompt = await this.qaPromptTemplate.format({
                context: contextText,
                question: question,
            });

            // Generate response
            const response = await this.model.invoke([
                { role: 'system', content: this.systemPrompt },
                { role: 'user', content: prompt },
            ]);

            const responseTime = Date.now() - startTime;
            const tokensUsed = this.estimateTokens(prompt + response.content);

            logger.info(
                `Generated answer in ${responseTime}ms, estimated tokens: ${tokensUsed}`,
            );

            return {
                answer: response.content,
                responseTime,
                tokensUsed,
                contextUsed: context.length,
            };
        } catch (error) {
            logger.error('Error generating answer with OpenAI:', error);
            throw new Error('Failed to generate answer');
        }
    }

    async summarizeDocument(content, title) {
        try {
            const summaryPrompt = `Please provide a concise summary of the following document:

Title: ${title}

Content:
${content}

Provide a summary that captures the main points, key information, and essential details in 2-3 paragraphs.`;

            const response = await this.model.invoke([
                {
                    role: 'system',
                    content: 'You are a professional document summarizer.',
                },
                { role: 'user', content: summaryPrompt },
            ]);

            return response.content;
        } catch (error) {
            logger.error('Error summarizing document:', error);
            throw new Error('Failed to summarize document');
        }
    }

    // Simple token estimation (rough approximation)
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }

    async validateQuestion(question) {
        try {
            if (!question || question.trim().length < 5) {
                return {
                    isValid: false,
                    message:
                        'Question is too short. Please provide a more detailed question.',
                };
            }

            if (question.length > 1000) {
                return {
                    isValid: false,
                    message:
                        'Question is too long. Please keep it under 1000 characters.',
                };
            }

            return {
                isValid: true,
                message: 'Question is valid',
            };
        } catch (error) {
            logger.error('Error validating question:', error);
            return {
                isValid: false,
                message: 'Error validating question',
            };
        }
    }
}

export default new AIService();
