/**
 * Image Upload Example Component
 *
 * This is a reference implementation showing how to use the Firebase Storage
 * service with proper error handling and user feedback.
 *
 * Copy and adapt this example to your needs.
 */

import { useState, useRef } from "react";
import type { AuthUser } from "../services/auth/authService";
import {
  uploadListingImages,
  DEFAULT_LISTING_IMAGE_CONFIG,
} from "../services/storage/storageService";
import {
  checkFiles,
  formatFileSize,
  getImageUploadHelpText,
} from "../services/storage/fileValidation";
import type { UploadedImage } from "../services/storage/storageService";

interface ImageUploadFormProps {
  listingId: string;
  currentUser: AuthUser;
  onImagesUploaded: (images: UploadedImage[]) => void;
}

/**
 * Example component: Image upload form with validation and error handling
 *
 * Features:
 * - File input with drag-drop support
 * - Client-side validation with user feedback
 * - Upload progress indication
 * - Error recovery and cleanup
 * - Accessible form structure
 */
export function ImageUploadForm({
  listingId,
  currentUser,
  onImagesUploaded,
}: ImageUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  /**
   * Handle file selection from input element
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    processFiles(files);
  };

  /**
   * Handle drag-drop file selection
   */
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.classList.add("drag-active");
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.currentTarget.classList.remove("drag-active");
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.classList.remove("drag-active");

    const files = event.dataTransfer.files;
    processFiles(files);
  };

  /**
   * Validate and set selected files for display
   */
  const processFiles = (fileList: FileList | null) => {
    setValidationErrors([]); // Clear previous errors

    if (!fileList || fileList.length === 0) {
      setSelectedFiles([]);
      return;
    }

    // Validate files
    const checkResult = checkFiles(fileList, DEFAULT_LISTING_IMAGE_CONFIG);

    if (!checkResult.isValid) {
      setValidationErrors(checkResult.errors);
      setSelectedFiles([]);
      return;
    }

    // Store valid files for upload
    const validFiles = Array.from(fileList).slice(0, checkResult.validCount);
    setSelectedFiles(validFiles);
  };

  /**
   * Upload selected files to Firebase Storage
   */
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setValidationErrors(["No files selected"]);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setValidationErrors([]);

    try {
      // Simulate progress (Firebase SDK doesn't provide granular progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 30;
        });
      }, 500);

      // Upload images
      const uploadedImages = await uploadListingImages(
        listingId,
        selectedFiles,
        currentUser,
        DEFAULT_LISTING_IMAGE_CONFIG,
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Success
      onImagesUploaded(uploadedImages);
      setSelectedFiles([]);

      // Reset form
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadProgress(0);
      }, 3000);
    } catch (error) {
      // Handle upload error
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      setValidationErrors([errorMessage]);
      console.error("[ImageUploadForm] Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Clear selected files and reset form
   */
  const handleClear = () => {
    setSelectedFiles([]);
    setValidationErrors([]);
    setUploadProgress(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="image-upload-form">
      {/* Drag-drop zone */}
      <div
        className="upload-drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="drop-zone-content">
          <p>Drag and drop images here, or</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-select-files"
          >
            Select Files
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="file-input-hidden"
        />
      </div>

      {/* Help text */}
      <small className="help-text">{getImageUploadHelpText()}</small>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="alert alert-error" role="alert">
          <strong>⚠ Upload Issues:</strong>
          <ul>
            {validationErrors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="selected-files">
          <h4>Selected Files ({selectedFiles.length})</h4>
          <ul className="file-list">
            {selectedFiles.map((file, idx) => (
              <li key={idx} className="file-item">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{formatFileSize(file.size)}</span>
              </li>
            ))}
          </ul>
          <p className="total-size">
            Total:{" "}
            {formatFileSize(selectedFiles.reduce((sum, f) => sum + f.size, 0))}
          </p>
        </div>
      )}

      {/* Upload progress */}
      {isUploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="progress-text">
            Uploading... {Math.round(uploadProgress)}%
          </p>
        </div>
      )}

      {/* Success message */}
      {uploadProgress === 100 && !isUploading && (
        <div className="alert alert-success">
          ✓ Images uploaded successfully!
        </div>
      )}

      {/* Action buttons */}
      <div className="form-actions">
        <button
          type="button"
          onClick={handleClear}
          disabled={isUploading || selectedFiles.length === 0}
          className="btn btn-secondary"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading || selectedFiles.length === 0}
          className="btn btn-primary"
        >
          {isUploading ? "Uploading..." : "Upload Images"}
        </button>
      </div>
    </div>
  );
}

/**
 * CSS Styles (add to your stylesheet)
 *
 * .image-upload-form {
 *   display: flex;
 *   flex-direction: column;
 *   gap: 1rem;
 * }
 *
 * .upload-drop-zone {
 *   border: 2px dashed #ccc;
 *   border-radius: 8px;
 *   padding: 2rem;
 *   text-align: center;
 *   cursor: pointer;
 *   transition: all 0.2s;
 * }
 *
 * .upload-drop-zone:hover {
 *   border-color: #999;
 *   background: #f9f9f9;
 * }
 *
 * .upload-drop-zone.drag-active {
 *   border-color: #0066cc;
 *   background: #e6f2ff;
 * }
 *
 * .drop-zone-content p {
 *   margin: 0 0 1rem 0;
 *   color: #666;
 * }
 *
 * .btn-select-files {
 *   padding: 0.5rem 1rem;
 *   background: #0066cc;
 *   color: white;
 *   border: none;
 *   border-radius: 4px;
 *   cursor: pointer;
 * }
 *
 * .btn-select-files:hover {
 *   background: #0052a3;
 * }
 *
 * .file-input-hidden {
 *   display: none;
 * }
 *
 * .help-text {
 *   color: #666;
 *   font-size: 0.875rem;
 * }
 *
 * .alert {
 *   padding: 1rem;
 *   border-radius: 4px;
 *   margin-top: 1rem;
 * }
 *
 * .alert-error {
 *   background: #ffe6e6;
 *   color: #c00;
 *   border-left: 4px solid #c00;
 * }
 *
 * .alert-success {
 *   background: #e6ffe6;
 *   color: #0a0;
 *   border-left: 4px solid #0a0;
 * }
 *
 * .selected-files {
 *   background: #f5f5f5;
 *   padding: 1rem;
 *   border-radius: 4px;
 * }
 *
 * .file-list {
 *   list-style: none;
 *   padding: 0;
 *   margin: 0.5rem 0;
 * }
 *
 * .file-item {
 *   display: flex;
 *   justify-content: space-between;
 *   padding: 0.5rem;
 *   background: white;
 *   margin: 0.25rem 0;
 *   border-radius: 3px;
 * }
 *
 * .file-name {
 *   flex: 1;
 *   word-break: break-word;
 * }
 *
 * .file-size {
 *   color: #999;
 *   margin-left: 1rem;
 *   white-space: nowrap;
 * }
 *
 * .total-size {
 *   text-align: right;
 *   color: #666;
 *   font-weight: bold;
 *   margin-top: 0.5rem;
 * }
 *
 * .upload-progress {
 *   display: flex;
 *   flex-direction: column;
 *   gap: 0.5rem;
 * }
 *
 * .progress-bar {
 *   width: 100%;
 *   height: 8px;
 *   background: #e0e0e0;
 *   border-radius: 4px;
 *   overflow: hidden;
 * }
 *
 * .progress-fill {
 *   height: 100%;
 *   background: linear-gradient(90deg, #0066cc, #0052a3);
 *   transition: width 0.3s;
 * }
 *
 * .progress-text {
 *   font-size: 0.875rem;
 *   color: #666;
 *   margin: 0;
 * }
 *
 * .form-actions {
 *   display: flex;
 *   gap: 1rem;
 *   justify-content: flex-end;
 * }
 *
 * .btn {
 *   padding: 0.5rem 1rem;
 *   border: none;
 *   border-radius: 4px;
 *   cursor: pointer;
 *   font-size: 1rem;
 *   transition: all 0.2s;
 * }
 *
 * .btn-primary {
 *   background: #0066cc;
 *   color: white;
 * }
 *
 * .btn-primary:hover:not(:disabled) {
 *   background: #0052a3;
 * }
 *
 * .btn-secondary {
 *   background: #e0e0e0;
 *   color: #333;
 * }
 *
 * .btn-secondary:hover:not(:disabled) {
 *   background: #d0d0d0;
 * }
 *
 * .btn:disabled {
 *   opacity: 0.5;
 *   cursor: not-allowed;
 * }
 */
