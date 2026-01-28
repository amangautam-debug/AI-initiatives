import OpenAI from "openai";
import prisma from "./db";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types
export interface DocumentChunk {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    documentId: string;
    documentName: string;
    chunkIndex: number;
  };
}

export interface BotDocumentData {
  id: string;
  botId: string;
  name: string;
  content: string;
  chunks: DocumentChunk[];
  docType: "knowledge" | "recommendation";
  createdAt: Date;
}

// Generate embedding for text
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("[RAG] Embedding error:", error);
    return new Array(1536).fill(0);
  }
}

// Calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

// Split text into chunks
function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = "";
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    
    if ((currentChunk + " " + trimmedSentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      const words = currentChunk.split(" ");
      const overlapWords = words.slice(-Math.floor(overlap / 5));
      currentChunk = overlapWords.join(" ") + " " + trimmedSentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + trimmedSentence;
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

// Add document to a bot's knowledge base
export async function addBotDocument(
  botId: string,
  name: string,
  content: string,
  docType: "knowledge" | "recommendation" = "knowledge"
): Promise<BotDocumentData> {
  // Split content into chunks
  const textChunks = chunkText(content);
  
  // Generate embeddings for each chunk
  const documentChunks: DocumentChunk[] = [];
  const documentId = crypto.randomUUID();
  
  for (let i = 0; i < textChunks.length; i++) {
    const chunk = textChunks[i];
    const embedding = await generateEmbedding(chunk);
    
    documentChunks.push({
      id: `${documentId}-${i}`,
      content: chunk,
      embedding,
      metadata: {
        documentId,
        documentName: name,
        chunkIndex: i,
      },
    });
  }

  // Save to database
  const doc = await prisma.botDocument.create({
    data: {
      botId,
      name,
      content,
      chunks: JSON.stringify(documentChunks),
      docType,
    },
  });

  console.log(`[RAG] Added ${docType} document "${name}" to bot ${botId} with ${documentChunks.length} chunks`);

  return {
    id: doc.id,
    botId: doc.botId,
    name: doc.name,
    content: doc.content,
    chunks: documentChunks,
    docType: doc.docType as "knowledge" | "recommendation",
    createdAt: doc.createdAt,
  };
}

// Get all documents for a bot
export async function getBotDocuments(botId: string, docType?: "knowledge" | "recommendation"): Promise<BotDocumentData[]> {
  const docs = await prisma.botDocument.findMany({
    where: { 
      botId,
      ...(docType && { docType }),
    },
    orderBy: { createdAt: "desc" },
  });

  return docs.map(doc => ({
    id: doc.id,
    botId: doc.botId,
    name: doc.name,
    content: doc.content,
    chunks: JSON.parse(doc.chunks) as DocumentChunk[],
    docType: doc.docType as "knowledge" | "recommendation",
    createdAt: doc.createdAt,
  }));
}

// Delete a document
export async function deleteBotDocument(documentId: string): Promise<boolean> {
  try {
    await prisma.botDocument.delete({
      where: { id: documentId },
    });
    console.log(`[RAG] Deleted document ${documentId}`);
    return true;
  } catch {
    return false;
  }
}

// Search documents for a specific bot
export async function searchBotDocuments(
  botId: string,
  query: string,
  topK: number = 3,
  docType?: "knowledge" | "recommendation"
): Promise<DocumentChunk[]> {
  const docs = await prisma.botDocument.findMany({
    where: { 
      botId,
      ...(docType && { docType }),
    },
  });

  if (docs.length === 0) {
    return [];
  }

  // Get all chunks from all documents
  const allChunks: DocumentChunk[] = [];
  for (const doc of docs) {
    const chunks = JSON.parse(doc.chunks) as DocumentChunk[];
    allChunks.push(...chunks);
  }

  if (allChunks.length === 0) {
    return [];
  }

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Calculate similarity for each chunk
  const scored = allChunks.map(chunk => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // Sort by similarity and return top K
  scored.sort((a, b) => b.score - a.score);
  
  return scored.slice(0, topK).map(s => s.chunk);
}

// Get RAG context for a bot (knowledge base)
export async function getBotRAGContext(botId: string, query: string): Promise<string> {
  const chunks = await searchBotDocuments(botId, query, 3, "knowledge");
  
  if (chunks.length === 0) {
    return "";
  }

  return chunks
    .map((chunk, i) => `[Source ${i + 1}: ${chunk.metadata.documentName}]\n${chunk.content}`)
    .join("\n\n");
}

// Get recommendation context for a bot
export async function getBotRecommendationContext(botId: string, query: string): Promise<string> {
  const chunks = await searchBotDocuments(botId, query, 3, "recommendation");
  
  if (chunks.length === 0) {
    return "";
  }

  return chunks
    .map((chunk, i) => `[Recommendation ${i + 1}]\n${chunk.content}`)
    .join("\n\n");
}

// Parse different file types
export async function parseDocument(file: File, fileName: string): Promise<string> {
  const extension = fileName.split(".").pop()?.toLowerCase();
  console.log(`[RAG] Parsing file: ${fileName}, extension: ${extension}`);

  if (extension === "txt" || extension === "json") {
    const text = await file.text();
    console.log(`[RAG] Text file parsed, length: ${text.length}`);
    return text;
  }

  if (extension === "pdf") {
    try {
      console.log(`[RAG] Parsing PDF with unpdf...`);
      const arrayBuffer = await file.arrayBuffer();
      console.log(`[RAG] PDF arrayBuffer size: ${arrayBuffer.byteLength}`);
      
      // Use unpdf for lightweight PDF parsing
      const { extractText } = await import("unpdf");
      const result = await extractText(new Uint8Array(arrayBuffer));
      
      // Handle different result types - text could be string or array
      let textContent = "";
      if (typeof result.text === "string") {
        textContent = result.text;
      } else if (Array.isArray(result.text)) {
        textContent = result.text.join("\n");
      } else {
        textContent = String(result.text || "");
      }
      
      console.log(`[RAG] PDF parsed, text length: ${textContent.length}, pages: ${result.totalPages}`);
      return textContent;
    } catch (pdfError) {
      console.error(`[RAG] PDF parsing error:`, pdfError);
      throw new Error(`Failed to parse PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
    }
  }

  throw new Error(`Unsupported file type: ${extension}`);
}

// ============================================
// Legacy in-memory store for backward compatibility
// ============================================

interface Document {
  id: string;
  name: string;
  content: string;
  chunks: DocumentChunk[];
  createdAt: Date;
}

class VectorStore {
  private documents: Map<string, Document> = new Map();
  private chunks: DocumentChunk[] = [];

  async addDocument(name: string, content: string): Promise<Document> {
    const documentId = crypto.randomUUID();
    const textChunks = chunkText(content);
    const documentChunks: DocumentChunk[] = [];
    
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      const embedding = await generateEmbedding(chunk);
      
      const documentChunk: DocumentChunk = {
        id: `${documentId}-${i}`,
        content: chunk,
        embedding,
        metadata: {
          documentId,
          documentName: name,
          chunkIndex: i,
        },
      };
      
      documentChunks.push(documentChunk);
      this.chunks.push(documentChunk);
    }

    const document: Document = {
      id: documentId,
      name,
      content,
      chunks: documentChunks,
      createdAt: new Date(),
    };

    this.documents.set(documentId, document);
    return document;
  }

  async search(query: string, topK: number = 3): Promise<DocumentChunk[]> {
    if (this.chunks.length === 0) return [];

    const queryEmbedding = await generateEmbedding(query);
    const scored = this.chunks.map(chunk => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map(s => s.chunk);
  }

  getDocuments(): Document[] {
    return Array.from(this.documents.values());
  }

  deleteDocument(id: string): boolean {
    const doc = this.documents.get(id);
    if (!doc) return false;
    this.chunks = this.chunks.filter(c => c.metadata.documentId !== id);
    this.documents.delete(id);
    return true;
  }
}

export const vectorStore = new VectorStore();
