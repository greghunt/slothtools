'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, X, Trash2 } from 'lucide-react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
}

interface FileWithPreview extends File {
  preview?: string;
}

export function FileUpload({
  onFilesSelected,
  maxFiles = 10,
  acceptedFileTypes,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  // Create preview URLs for image files
  useEffect(() => {
    files.forEach(file => {
      if (!file.preview && file.type.startsWith('image/')) {
        file.preview = URL.createObjectURL(file);
      }
    });

    // Cleanup preview URLs when component unmounts
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  const handleFiles = useCallback((newFiles: File[]) => {
    const updatedFiles = [...files, ...newFiles].slice(0, maxFiles);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  }, [files, maxFiles, onFilesSelected]);

  const clearFiles = useCallback(() => {
    setFiles([]);
    onFilesSelected([]);
  }, [onFilesSelected]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (acceptedFileTypes) {
      const filteredFiles = droppedFiles.filter(file =>
        acceptedFileTypes.some(type => file.type.includes(type))
      );
      handleFiles(filteredFiles);
    } else {
      handleFiles(droppedFiles);
    }
  }, [acceptedFileTypes, handleFiles]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const inputFiles = Array.from(e.target.files);
      handleFiles(inputFiles);
    }
  }, [handleFiles]);

  const removeFile = useCallback((indexToRemove: number) => {
    const updatedFiles = files.filter((_, index) => index !== indexToRemove);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  }, [files, onFilesSelected]);

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={onDrop}
      >
        <input
          type="file"
          multiple
          accept={acceptedFileTypes?.join(",")}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <Upload className="w-10 h-10 text-gray-400" />
          <p className="text-lg font-medium text-gray-600">
            Drag and drop files here, or click to select files
          </p>
          <p className="text-sm text-gray-500">
            Maximum {maxFiles} file{maxFiles === 1 ? "" : "s"}
            {acceptedFileTypes && ` (${acceptedFileTypes.join(", ")})`}
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {files.length} file{files.length === 1 ? '' : 's'} selected
            </span>
            <button
              onClick={clearFiles}
              className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          </div>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  {file.type.startsWith('image/') && file.preview && (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-8 h-8 object-cover rounded"
                    />
                  )}
                  <span className="text-sm text-gray-600 truncate">{file.name}</span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-gray-200 rounded-full"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 