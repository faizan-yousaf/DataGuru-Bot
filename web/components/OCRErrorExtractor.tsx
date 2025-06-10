'use client';
import React, { useState } from 'react';
import { Upload, Image as ImageIcon, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface ExtractResult {
  success: boolean;
  extractedText: string;
  debugResponse: string;
  modelUsed: string;
}

const OCRErrorExtractor: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (1MB limit for free tier)
      if (file.size > 1024 * 1024) {
        setError('File size too large. Maximum size is 1MB for free tier.');
        return;
      }

      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await fetch('/api/ocr-extract', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to extract text from image');
      }
    } catch (err) {
      setError('Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          OCR Error Debugger
        </h1>
        <p className="text-gray-600">
          Upload screenshots of error messages or code to extract text and get debugging help
        </p>
      </div>

      {/* Upload Section */}
      <div className="mb-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.bmp,image/jpeg,image/png,image/gif,image/bmp"
            onChange={handleImageSelect}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Click to upload an image
            </p>
            <p className="text-sm text-gray-500">
              Supports JPG, PNG, GIF, BMP (Max 1MB)
            </p>
          </label>
        </div>
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <ImageIcon className="w-5 h-5 mr-2" />
            Image Preview
          </h3>
          <div className="border rounded-lg p-4 bg-gray-50">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-full max-h-96 mx-auto rounded border"
            />
            <div className="mt-4 flex justify-center space-x-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Extract Text & Debug'
                )}
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700 font-medium">Error:</span>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-6">
          <div className="flex items-center text-green-600 mb-4">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Text extracted successfully using {result.modelUsed}</span>
          </div>

          {/* Extracted Text */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Extracted Text:</h3>
            <pre className="whitespace-pre-wrap text-sm bg-white border rounded p-3 max-h-64 overflow-y-auto">
              {result.extractedText}
            </pre>
          </div>

          {/* Debug Response */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-blue-800">AI Debug Analysis:</h3>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-blue-900 bg-white border rounded p-3 max-h-96 overflow-y-auto">
                {result.debugResponse}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OCRErrorExtractor;