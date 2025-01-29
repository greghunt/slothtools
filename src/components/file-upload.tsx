'use client';

import { useState, useCallback } from 'react';
import { Upload, X } from 'lucide-react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
}

export function FileUpload({
  onFilesSelected,
  maxFiles = 10,
  acceptedFileTypes,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (acceptedFileTypes) {
      const filteredFiles = droppedFiles.filter(file =>
        acceptedFileTypes.some(type => file.type.includes(type))
      );
      handleFiles(filteredFiles);
    } else {
      handleFiles(droppedFiles);
    }
  }, [acceptedFileTypes]);

  const handleFiles = useCallback((newFiles: File[]) => {
    const updatedFiles = [...files, ...newFiles].slice(0, maxFiles);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  }, [files, maxFiles, onFilesSelected]);

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
        onDrop={handleDrop}
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
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
            >
              <span className="text-sm text-gray-600 truncate">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-gray-200 rounded-full"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 