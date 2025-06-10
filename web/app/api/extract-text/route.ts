import { HfInference } from '@huggingface/inference';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Get the form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file uploaded' },
        { status: 400 }
      );
    }

    // Convert image to base64
    const bytes = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');
    
    // Use Gemini Vision for text extraction
    const extractedText = await extractTextWithGeminiVision(base64Image, imageFile.type);
    
    if (!extractedText || extractedText.trim() === '') {
      return NextResponse.json(
        { 
          error: 'No text could be extracted from the image',
          details: 'The image may not contain readable text or the content is unclear'
        },
        { status: 400 }
      );
    }

    // Get debugging response
    const debugResponse = await getGeminiDebugResponse(extractedText);

    return NextResponse.json({
      success: true,
      extractedText: extractedText,
      debugResponse: debugResponse,
      modelUsed: 'gemini-pro-vision'
    });

  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      {
        error: 'Failed to process image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Function to extract text using Gemini Vision
async function extractTextWithGeminiVision(base64Image: string, mimeType: string) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: "Extract all text from this image, paying special attention to code, error messages, console output, and technical content. Preserve formatting, line breaks, and structure as much as possible. If this contains code or error messages, identify the programming language and error type. Only return the extracted text, nothing else."
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image
              }
            }
          ]
        }]
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error('Error with Gemini Vision:', error);
    return null;
  }
}

// Enhanced Gemini function for code/error analysis
async function getGeminiDebugResponse(extractedText: string) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `I extracted this text from a code screenshot or error image: "${extractedText}". Please analyze this content and provide:
            
            1. **Content Type**: Identify if this is an error message, code snippet, console output, documentation, or other technical content
            2. **Programming Language**: If applicable, identify the programming language or technology
            3. **Error Analysis**: If it's an error, explain:
               - Error type and severity
               - Root cause analysis
               - Common scenarios that lead to this error
            4. **Solutions**: Provide step-by-step solutions or fixes
            5. **Code Examples**: Include corrected code examples if applicable
            6. **Prevention**: Best practices to avoid similar issues
            7. **Additional Resources**: Suggest relevant documentation or learning materials
            
            Please format your response clearly with headers and bullet points for easy reading.`
          }]
        }]
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate debug response';
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return 'Error occurred while generating debug response';
  }
}