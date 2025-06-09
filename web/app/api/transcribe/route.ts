import { AssemblyAI } from 'assemblyai';
import { NextRequest, NextResponse } from 'next/server';

// Initialize AssemblyAI client
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // Upload audio to AssemblyAI
    const uploadUrl = await client.files.upload(audioBuffer);
    
    // Create transcription job
    const transcript = await client.transcripts.transcribe({
      audio: uploadUrl,
      speech_model: 'best', // Use the most accurate model
      language_detection: true, // Auto-detect language
      punctuate: true,
      format_text: true,
      speaker_labels: false, // Set to true if you need speaker identification
    });

    if (transcript.status === 'error') {
      return NextResponse.json(
        { error: 'Transcription failed', details: transcript.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      text: transcript.text,
      confidence: transcript.confidence,
      audio_duration: transcript.audio_duration
    });

  } catch (error) {
    console.error('AssemblyAI transcription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}