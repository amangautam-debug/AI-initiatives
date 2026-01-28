import { NextRequest, NextResponse } from "next/server";
import { addBotDocument, getBotDocuments, deleteBotDocument, parseDocument } from "@/lib/rag";
import prisma from "@/lib/db";

// GET - List all documents for a bot
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: botId } = await params;
    const { searchParams } = new URL(request.url);
    const docType = searchParams.get("type") as "knowledge" | "recommendation" | null;

    // Verify bot exists
    const bot = await prisma.voiceBot.findUnique({
      where: { id: botId },
    });

    if (!bot) {
      return NextResponse.json(
        { error: "Bot not found" },
        { status: 404 }
      );
    }

    const documents = await getBotDocuments(botId, docType || undefined);
    
    return NextResponse.json({
      documents: documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        chunksCount: doc.chunks.length,
        docType: doc.docType,
        createdAt: doc.createdAt,
      })),
    });
  } catch (error) {
    console.error("[Bot Documents] List error:", error);
    return NextResponse.json(
      { error: "Failed to list documents" },
      { status: 500 }
    );
  }
}

// POST - Upload a document for a bot
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: botId } = await params;

    // Verify bot exists
    const bot = await prisma.voiceBot.findUnique({
      where: { id: botId },
    });

    if (!bot) {
      return NextResponse.json(
        { error: "Bot not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const docType = (formData.get("docType") as string) || "knowledge";
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const allowedExtensions = ["txt", "pdf", "json"];
    const extension = fileName.split(".").pop()?.toLowerCase();
    
    if (!extension || !allowedExtensions.includes(extension)) {
      return NextResponse.json(
        { error: `Unsupported file type. Allowed: ${allowedExtensions.join(", ")}` },
        { status: 400 }
      );
    }

    // Parse document content
    const content = await parseDocument(file, fileName);
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Document is empty or could not be parsed" },
        { status: 400 }
      );
    }

    // Add to bot's document store
    const document = await addBotDocument(
      botId, 
      fileName, 
      content, 
      docType as "knowledge" | "recommendation"
    );

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        name: document.name,
        chunksCount: document.chunks.length,
        docType: document.docType,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    console.error("[Bot Documents] Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: botId } = await params;
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");
    
    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID required" },
        { status: 400 }
      );
    }

    // Verify document belongs to this bot
    const doc = await prisma.botDocument.findFirst({
      where: { id: documentId, botId },
    });

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const deleted = await deleteBotDocument(documentId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete document" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Bot Documents] Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
