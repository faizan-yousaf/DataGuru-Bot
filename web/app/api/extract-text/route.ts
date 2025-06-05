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

    // Convert File to Buffer
    const bytes = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(bytes);

    // Try multiple OCR models for better text extraction
    let extractedText = '';
    let modelUsed = '';
    
    try {
      // First try: Microsoft TrOCR for printed text
      const result1 = await hf.imageToText({
        data: new Blob([imageBuffer]),
        model: 'microsoft/trocr-base-printed'
      });
      extractedText = result1.generated_text || '';
      modelUsed = 'microsoft/trocr-base-printed';
    } catch (error1) {
      try {
        // Second try: Microsoft TrOCR for handwritten text
        const result2 = await hf.imageToText({
          data: new Blob([imageBuffer]),
          model: 'microsoft/trocr-base-handwritten'
        });
        extractedText = result2.generated_text || '';
        modelUsed = 'microsoft/trocr-base-handwritten';
      } catch (error2) {
        try {
          // Third try: Alternative OCR model
          const result3 = await hf.imageToText({
            data: new Blob([imageBuffer]),
            model: 'microsoft/trocr-large-printed'
          });
          extractedText = result3.generated_text || '';
          modelUsed = 'microsoft/trocr-large-printed';
        } catch (error3) {
          // Fallback: Use image captioning if OCR fails
          const result4 = await hf.imageToText({
            data: new Blob([imageBuffer]),
            model: 'Salesforce/blip-image-captioning-base'
          });
          extractedText = result4.generated_text || '';
          modelUsed = 'Salesforce/blip-image-captioning-base (fallback)';
        }
      }
    }

    if (!extractedText || extractedText.trim() === '') {
      return NextResponse.json(
        { 
          error: 'No text could be extracted from the image',
          details: 'The image may not contain readable text or the text quality is too poor'
        },
        { status: 400 }
      );
    }

    // Send extracted text to Gemini for debugging
    const debugResponse = await getGeminiDebugResponse(extractedText);

    return NextResponse.json({
      success: true,
      extractedText: extractedText,
      debugResponse: debugResponse,
      modelUsed: modelUsed
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

// Function to send extracted text to Gemini
async function getGeminiDebugResponse(errorText: string) {
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
            text: `I extracted this text from an image: "${errorText}". Please analyze this content and provide:
            1. What type of content this is (error message, code snippet, documentation, etc.)
            2. If it's an error, identify the error type and possible causes
            3. Provide debugging solutions, explanations, or fixes
            4. Include code examples if applicable
            5. Suggest best practices to avoid similar issues
            
            Please format your response in a clear, structured way with proper headings and code blocks where needed.`
          }]
        }]
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate debug response';
  } catch (error) {
    console.error('Gemini API error:', error);
    return 'Error connecting to debugging service. Please check your GEMINI_API_KEY and try again.';
  }
}