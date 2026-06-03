/**
 * Message Chunking Utilities
 * 
 * Handles storage of large AI responses that exceed Appwrite's 1MB document limit.
 * Automatically splits large messages into chunks and reassembles them on retrieval.
 */

import { databases } from './config';
import { ID, Query } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const MESSAGES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID;

// Safe chunk size: 800KB (leaves 200KB margin below 1MB limit for metadata + encoding overhead)
const MAX_CHUNK_SIZE_BYTES = 800 * 1024;

/**
 * Calculate the byte size of a string (UTF-8 encoding)
 */
function getByteSize(str) {
  return new TextEncoder().encode(str).length;
}

/**
 * Check if content needs to be chunked
 */
export function needsChunking(content) {
  const sizeInBytes = getByteSize(content);
  return sizeInBytes > MAX_CHUNK_SIZE_BYTES;
}

/**
 * Split content into safe-sized chunks
 * Preserves UTF-8 character boundaries to avoid corruption
 */
function splitIntoChunks(content) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const contentBytes = encoder.encode(content);
  
  const chunks = [];
  let offset = 0;
  
  while (offset < contentBytes.length) {
    const end = Math.min(offset + MAX_CHUNK_SIZE_BYTES, contentBytes.length);
    const chunkBytes = contentBytes.slice(offset, end);
    const chunkText = decoder.decode(chunkBytes);
    chunks.push(chunkText);
    offset = end;
  }
  
  console.log(`[MessageChunking] Split content into ${chunks.length} chunks (${Math.round(contentBytes.length / 1024)}KB total)`);
  return chunks;
}

/**
 * Create a chunked message in Appwrite
 * Returns the parent message document
 */
export async function createChunkedMessage(sessionId, userId, role, content) {
  const chunks = splitIntoChunks(content);
  
  try {
    // Create parent message with first chunk
    const parentMessage = {
      sessionId,
      userId,
      role,
      content: chunks[0],
      isChunked: true,
      totalChunks: chunks.length,
      createdAt: new Date().toISOString()
    };
    
    const parentDoc = await databases.createDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      ID.unique(),
      parentMessage
    );
    
    console.log(`[MessageChunking] Created parent message ${parentDoc.$id} with ${chunks.length} total chunks`);
    
    // Create child chunks (if more than one)
    if (chunks.length > 1) {
      for (let i = 1; i < chunks.length; i++) {
        await databases.createDocument(
          DATABASE_ID,
          MESSAGES_COLLECTION_ID,
          ID.unique(),
          {
            sessionId,
            userId,
            role: `${role}_chunk`,
            content: chunks[i],
            parentMessageId: parentDoc.$id,
            chunkIndex: i,
            createdAt: new Date().toISOString()
          }
        );
        console.log(`[MessageChunking] Created chunk ${i}/${chunks.length - 1} for message ${parentDoc.$id}`);
      }
    }
    
    // Return parent with full content reassembled for immediate use
    return {
      ...parentDoc,
      content: content, // Full content
      _chunked: true // Internal flag for tracking
    };
  } catch (error) {
    console.error('[MessageChunking] Failed to create chunked message:', error);
    throw new Error(`Failed to save chunked message: ${error.message}`);
  }
}

/**
 * Reassemble chunked messages
 * Takes an array of message documents and reconstructs full content for chunked messages
 */
export function reassembleChunkedMessages(messages) {
  // Build a map of parentMessageId -> chunks
  const chunkMap = {};
  
  // First pass: collect all chunks
  for (const msg of messages) {
    if (msg.role?.endsWith('_chunk') && msg.parentMessageId) {
      if (!chunkMap[msg.parentMessageId]) {
        chunkMap[msg.parentMessageId] = [];
      }
      chunkMap[msg.parentMessageId].push(msg);
    }
  }
  
  // Second pass: reassemble parent messages and filter out chunk documents
  const reassembled = [];
  
  for (const msg of messages) {
    // Skip chunk documents (they'll be merged into parent)
    if (msg.role?.endsWith('_chunk')) {
      continue;
    }
    
    // If this message has chunks, reassemble them
    if (msg.isChunked && chunkMap[msg.$id]) {
      const chunks = [msg.content]; // Start with parent's content (chunk 0)
      
      // Sort child chunks by index and append
      const sortedChunks = chunkMap[msg.$id].sort((a, b) => a.chunkIndex - b.chunkIndex);
      chunks.push(...sortedChunks.map(c => c.content));
      
      // Reassemble full content
      const fullContent = chunks.join('');
      
      console.log(`[MessageChunking] Reassembled message ${msg.$id} from ${chunks.length} chunks (${Math.round(getByteSize(fullContent) / 1024)}KB)`);
      
      reassembled.push({
        ...msg,
        content: fullContent,
        _reassembled: true // Internal flag for debugging
      });
    } else {
      // Regular message, no chunking
      reassembled.push(msg);
    }
  }
  
  return reassembled;
}

/**
 * Get session messages with automatic chunk reassembly
 * Drop-in replacement for getSessionMessages that handles chunking
 */
export async function getSessionMessagesWithChunks(sessionId) {
  try {
    // Fetch ALL messages (including chunks)
    // Increase limit to accommodate chunked messages (each logical message might be 2-3 documents)
    const response = await databases.listDocuments(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      [
        Query.equal('sessionId', sessionId),
        Query.orderAsc('createdAt'),
        Query.limit(3000) // Increased from 1000 to handle chunked messages
      ]
    );
    
    // Reassemble chunked messages
    const messages = reassembleChunkedMessages(response.documents);
    
    return messages;
  } catch (error) {
    console.error('[MessageChunking] Failed to load messages:', error);
    throw new Error(`Failed to load messages: ${error.message}`);
  }
}

/**
 * Delete a message and all its chunks
 */
export async function deleteChunkedMessage(messageId) {
  try {
    // First, delete all child chunks
    const chunks = await databases.listDocuments(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      [Query.equal('parentMessageId', messageId)]
    );
    
    for (const chunk of chunks.documents) {
      await databases.deleteDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        chunk.$id
      );
    }
    
    // Then delete the parent message
    await databases.deleteDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      messageId
    );
    
    console.log(`[MessageChunking] Deleted message ${messageId} and ${chunks.documents.length} chunks`);
    return { success: true };
  } catch (error) {
    console.error('[MessageChunking] Failed to delete chunked message:', error);
    throw new Error(`Failed to delete message: ${error.message}`);
  }
}

/**
 * Update a message's content (handles chunking automatically)
 * If new content needs chunking, deletes old chunks and creates new ones
 */
export async function updateChunkedMessage(messageId, newContent) {
  try {
    // Get the existing message
    const existing = await databases.getDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      messageId
    );
    
    // Check if new content needs chunking
    const needsNewChunking = needsChunking(newContent);
    
    // If message was previously chunked, delete old chunks
    if (existing.isChunked) {
      const oldChunks = await databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        [Query.equal('parentMessageId', messageId)]
      );
      
      for (const chunk of oldChunks.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          MESSAGES_COLLECTION_ID,
          chunk.$id
        );
      }
    }
    
    // If new content needs chunking, create chunks
    if (needsNewChunking) {
      const chunks = splitIntoChunks(newContent);
      
      // Update parent with first chunk
      await databases.updateDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        messageId,
        {
          content: chunks[0],
          isChunked: true,
          totalChunks: chunks.length
        }
      );
      
      // Create new chunks
      for (let i = 1; i < chunks.length; i++) {
        await databases.createDocument(
          DATABASE_ID,
          MESSAGES_COLLECTION_ID,
          ID.unique(),
          {
            sessionId: existing.sessionId,
            userId: existing.userId,
            role: `${existing.role}_chunk`,
            content: chunks[i],
            parentMessageId: messageId,
            chunkIndex: i,
            createdAt: new Date().toISOString()
          }
        );
      }
    } else {
      // Content fits in single document, update normally
      await databases.updateDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        messageId,
        {
          content: newContent,
          isChunked: false,
          totalChunks: 1
        }
      );
    }
    
    console.log(`[MessageChunking] Updated message ${messageId}`);
    return { success: true };
  } catch (error) {
    console.error('[MessageChunking] Failed to update chunked message:', error);
    throw new Error(`Failed to update message: ${error.message}`);
  }
}
