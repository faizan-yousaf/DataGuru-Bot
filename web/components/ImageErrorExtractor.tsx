'use client';
import React, { useState } from 'react';

interface ExtractResult {
  success: boolean;
  extractedText: string;
  debugResponse: string;
}

const ImageErrorExtractor: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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

      const response = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to process image');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Image Error Extractor & Debugger
      </h2>

      {/* Image Upload Section */}
      <div className="mb-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          {!imagePreview ? (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg inline-block transition-colors"
              >
                Choose Error Image
              </label>
              <p className="mt-2 text-gray-500">
                Upload an image containing error text or code
              </p>
            </div>
          ) : (
            <div>
              <img
                src={imagePreview}
                alt="Selected error"
                className="max-w-full max-h-64 mx-auto rounded border"
              />
              <div className="mt-4 space-x-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded transition-colors"
                >
                  {loading ? 'Processing...' : 'Extract & Debug Error'}
                </button>
                <button
                  onClick={clearImage}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded transition-colors"
                >
                  Clear Image
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Extracting text and analyzing error...</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Extracted Text */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Extracted Text:
            </h3>
            <div className="bg-white p-4 rounded border font-mono text-sm">
              {result.extractedText}
            </div>
          </div>

          {/* Debug Response */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Debug Analysis:
            </h3>
            <div className="bg-white p-4 rounded border prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm">
                {result.debugResponse}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageErrorExtractor;