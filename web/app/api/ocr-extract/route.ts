import { NextRequest, NextResponse } from 'next/server';

interface OCRSpaceResponse {
  ParsedResults?: Array<{
    ParsedText: string;
    ErrorMessage?: string;
    ErrorDetails?: string;
  }>;
  OCRExitCode: number;
  IsErroredOnProcessing: boolean;
  ErrorMessage?: string;
  ErrorDetails?: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file uploaded' },
        { status: 400 }
      );
    }

    // Validate file size (OCR.Space free tier has 1MB limit)
    if (imageFile.size > 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 1MB for free tier.' },
        { status: 400 }
      );
    }

    // Validate file type - improved validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp'];
    const fileExtension = imageFile.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
    
    if (!allowedTypes.includes(imageFile.type) && !allowedExtensions.includes(fileExtension || '')) {
      return NextResponse.json(
        { 
          error: 'Unsupported file type. Please upload JPG, PNG, GIF, or BMP images.',
          details: `File type: ${imageFile.type}, Extension: ${fileExtension}` 
        },
        { status: 400 }
      );
    }

    // Extract text using OCR.Space
    const extractedText = await extractTextWithOCRSpace(imageFile);
    
    if (!extractedText || extractedText.trim() === '') {
      return NextResponse.json(
        { 
          error: 'No text could be extracted from the image',
          details: 'The image may not contain readable text or the content is unclear'
        },
        { status: 400 }
      );
    }

    // Get debugging response from Gemini
    const debugResponse = await getGeminiDebugResponse(extractedText);

    return NextResponse.json({
      success: true,
      extractedText: extractedText,
      debugResponse: debugResponse,
      modelUsed: 'ocr-space'
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

// Function to extract text using OCR.Space API
async function extractTextWithOCRSpace(imageFile: File): Promise<string | null> {
  try {
    const apiKey = process.env.OCR_SPACE_API_KEY || 'helloworld'; // Use free key as fallback
    
    // Convert file to base64
    const bytes = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');
    const base64String = `data:${imageFile.type};base64,${base64Image}`;

    // Prepare form data for OCR.Space API
    const formData = new FormData();
    formData.append('base64Image', base64String);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('OCREngine', '2'); // Engine 2 is better for technical content
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('isTable', 'false');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`OCR.Space API error: ${response.status} ${response.statusText}`);
    }

    const data: OCRSpaceResponse = await response.json();
    
    // Check for API errors
    if (data.IsErroredOnProcessing) {
      throw new Error(`OCR processing error: ${data.ErrorMessage || 'Unknown error'}`);
    }

    if (data.OCRExitCode !== 1) {
      throw new Error(`OCR failed with exit code: ${data.OCRExitCode}`);
    }

    // Extract text from results
    if (data.ParsedResults && data.ParsedResults.length > 0) {
      const result = data.ParsedResults[0];
      
      if (result.ErrorMessage) {
        throw new Error(`OCR parsing error: ${result.ErrorMessage}`);
      }
      
      return result.ParsedText || null;
    }

    return null;
  } catch (error) {
    console.error('Error with OCR.Space:', error);
    throw error;
  }
}

// Enhanced Gemini function for code/error analysis
async function getGeminiDebugResponse(extractedText: string): Promise<string> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      return 'Gemini API key not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY environment variable.';
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `I extracted this text from a code screenshot or error image using OCR: "${extractedText}". Please analyze this content and provide:
            
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
            
            Please format your response clearly with headers and bullet points for easy reading. Note that this text was extracted via OCR, so there might be minor character recognition errors.`
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
    return 'Error occurred while generating debug response. Please check your Gemini API configuration.';
  }
}