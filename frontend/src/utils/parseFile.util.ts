export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedExtensions = ['pdf', 'docx', 'txt'];

  // Check file size
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const extension = fileName.split('.').pop();

  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: 'Only PDF, DOCX, and TXT files are supported',
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  return { valid: true };
}

// Only DOCX and PDF are supported for API OCR
export function createFileImportHandler(
  onTextExtracted: (text: string) => void,
  onError?: (error: string) => void
) {
  return async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      onError?.('No file selected');
      return;
    }
    const allowedExtensions = ['pdf', 'docx'];
    const fileName = file.name.toLowerCase();
    const extension = fileName.split('.').pop();
    if (!extension || !allowedExtensions.includes(extension)) {
      onError?.('Only PDF and DOCX files are supported');
      event.target.value = '';
      return;
    }
    if (file.size === 0) {
      onError?.('File is empty');
      event.target.value = '';
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      const apiUrl = `${
        import.meta.env.VITE_API_PYTHON_URL || 'http://localhost:8002'
      }/file-ocr`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to extract text from file');
      }
      const data = await response.json();
      if (data && data.extracted_text) {
        onTextExtracted(data.extracted_text.trim());
      } else {
        onError?.('No text could be extracted from the file');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      onError?.(errorMessage);
    } finally {
      event.target.value = '';
    }
  };
}
