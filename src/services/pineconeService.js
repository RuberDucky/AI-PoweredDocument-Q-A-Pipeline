import { Pinecone } from '@pinecone-database/pinecone';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import logger from '../config/logger.js';

class PineconeService {
    constructor() {
        this.pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
        this.indexName = process.env.PINECONE_INDEX_NAME || 'qa-pipeline-index';
        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        this.index = null;
    }

    async initialize() {
        try {
            this.index = this.pinecone.Index(this.indexName);
            logger.info('Pinecone service initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Pinecone service:', error);
            throw error;
        }
    }

    async createIndex() {
        try {
            const indexList = await this.pinecone.listIndexes();
            const indexExists = indexList.indexes.some(
                (index) => index.name === this.indexName,
            );

            if (!indexExists) {
                await this.pinecone.createIndex({
                    name: this.indexName,
                    dimension: 1024, // Updated to match existing index
                    metric: 'cosine',
                    spec: {
                        serverless: {
                            cloud: 'aws',
                            region: 'us-east-1',
                        },
                    },
                });
                logger.info(`Created Pinecone index: ${this.indexName}`);
            } else {
                logger.info(`Pinecone index already exists: ${this.indexName}`);
            }
        } catch (error) {
            logger.error('Error creating Pinecone index:', error);
            throw error;
        }
    }

    // Better embedding function using TF-IDF approach
    async createEmbedding(text) {
        try {
            // Clean and tokenize text
            const words = text
                .toLowerCase()
                .replace(/[^\w\s]/g, ' ')
                .split(/\s+/)
                .filter((word) => word.length > 2);

            const embedding = new Array(1024).fill(0);

            // Create a more sophisticated embedding
            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                const wordHash = this.simpleHash(word);

                // Use multiple hash functions for better distribution
                for (let j = 0; j < 5; j++) {
                    const index = (wordHash + j * 127) % 1024;
                    embedding[index] += 1 / (j + 1); // Weight by hash function
                }

                // Add positional encoding
                const positionWeight = 1 / Math.log(i + 2);
                const posIndex = (i * 7) % 1024; // Better distribution
                embedding[posIndex] += positionWeight;

                // Add word length encoding
                const lengthIndex = (word.length * 31) % 1024;
                embedding[lengthIndex] += 0.1;
            }

            // Add document-level features
            const docLength = words.length;
            const avgWordLength =
                words.reduce((sum, word) => sum + word.length, 0) /
                words.length;

            // Encode document statistics
            embedding[1020] = Math.log(docLength + 1) / 10; // Document length feature
            embedding[1021] = avgWordLength / 10; // Average word length feature
            embedding[1022] = new Set(words).size / words.length; // Vocabulary diversity
            embedding[1023] =
                words.filter((word) => word.length > 6).length / words.length; // Complex words ratio

            // Normalize the embedding
            const magnitude = Math.sqrt(
                embedding.reduce((sum, val) => sum + val * val, 0),
            );
            return magnitude > 0
                ? embedding.map((val) => val / magnitude)
                : embedding;
        } catch (error) {
            logger.error('Error creating embedding:', error);
            throw error;
        }
    }

    // Simple hash function for consistent word mapping
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    async addDocuments(documents) {
        try {
            if (!this.index) {
                await this.initialize();
            }

            const vectors = [];

            for (const doc of documents) {
                // Split document into chunks
                const chunks = await this.textSplitter.splitText(doc.content);

                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];
                    const embedding = await this.createEmbedding(chunk);

                    vectors.push({
                        id: `${doc.id}_chunk_${i}`,
                        values: embedding,
                        metadata: {
                            title: doc.title,
                            content: chunk,
                            documentId: doc.documentId,
                            chunkIndex: i,
                            totalChunks: chunks.length,
                            userId: doc.userId, // Add user ID for filtering
                        },
                    });
                }
            }

            if (vectors.length > 0) {
                await this.index.upsert(vectors);
                logger.info(
                    `Added ${vectors.length} document chunks to Pinecone`,
                );
            }

            return vectors.length;
        } catch (error) {
            logger.error('Error adding documents to Pinecone:', error);
            throw error;
        }
    }

    async searchSimilar(query, topK = 5, userId = null) {
        try {
            if (!this.index) {
                await this.initialize();
            }

            const queryEmbedding = await this.createEmbedding(query);

            const searchParams = {
                vector: queryEmbedding,
                topK,
                includeMetadata: true,
                includeValues: false,
            };

            // Add user filter if userId is provided
            if (userId) {
                searchParams.filter = {
                    userId: { $eq: userId },
                };
            }

            const searchResults = await this.index.query(searchParams);

            return searchResults.matches.map((match) => ({
                id: match.id,
                score: match.score,
                metadata: match.metadata,
            }));
        } catch (error) {
            logger.error('Error searching in Pinecone:', error);
            throw error;
        }
    }

    async deleteDocument(documentId) {
        try {
            if (!this.index) {
                await this.initialize();
            }

            await this.index.deleteOne(documentId);
            logger.info(`Deleted document from Pinecone: ${documentId}`);
        } catch (error) {
            logger.error('Error deleting document from Pinecone:', error);
            throw error;
        }
    }
}

export default new PineconeService();
