"use client";

import { useState, useRef } from "react";
import type { DragEvent, ChangeEvent } from "react";
import axios from "axios";
import {
  Upload,
  FileSpreadsheet,
  Box,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { apiClient, UPLOAD_ENDPOINT } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadState = "idle" | "ready" | "uploading" | "success" | "error";

interface UploadedFileData {
  _id: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

interface ApiUploadResponse {
  success: boolean;
  message: string;
  data: UploadedFileData;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".ifc"] as const;
type AcceptedExt = (typeof ACCEPTED_EXTENSIONS)[number];

const MAX_FILE_SIZE_MB = 50;

const FORMAT_BADGES = [
  {
    ext: ".xlsx",
    label: "Excel 2007+",
    Icon: FileSpreadsheet,
    classes: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  {
    ext: ".xls",
    label: "Excel 97–2003",
    Icon: FileSpreadsheet,
    classes: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  {
    ext: ".ifc",
    label: "IFC BIM",
    Icon: Box,
    classes: "text-blue-700 bg-blue-50 border-blue-200",
  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function validateFile(file: File): string | null {
  const ext = ("." + (file.name.split(".").pop() ?? "").toLowerCase()) as AcceptedExt;
  if (!(ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)) {
    return `"${ext}" is not supported. Accepted: ${ACCEPTED_EXTENSIONS.join(", ")}`;
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `File too large (${formatBytes(file.size)}). Maximum: ${MAX_FILE_SIZE_MB} MB`;
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UploadSection() {
  const [dragActive, setDragActive]       = useState(false);
  const [file, setFile]                   = useState<File | null>(null);
  const [uploadState, setUploadState]     = useState<UploadState>("idle");
  const [progress, setProgress]           = useState(0);
  const [result, setResult]               = useState<UploadedFileData | null>(null);
  const [uploadError, setUploadError]     = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // ── file selection ──────────────────────────────────────────────────────────

  function selectFile(incoming: File) {
    const err = validateFile(incoming);
    if (err) {
      setValidationError(err);
      setFile(null);
      setUploadState("idle");
      return;
    }
    setValidationError(null);
    setUploadError(null);
    setResult(null);
    setFile(incoming);
    setUploadState("ready");
  }

  function clearFile() {
    setFile(null);
    setUploadState("idle");
    setUploadError(null);
    setValidationError(null);
    setResult(null);
    setProgress(0);
  }

  // ── drag & drop ────────────────────────────────────────────────────────────

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (uploadState !== "uploading") setDragActive(true);
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (uploadState === "uploading") return;
    const dropped = e.dataTransfer.files[0];
    if (dropped) selectFile(dropped);
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (picked) selectFile(picked);
    e.target.value = ""; // allow re-selecting the same file
  }

  // ── upload ─────────────────────────────────────────────────────────────────

  async function handleUpload() {
    if (!file) return;

    setUploadState("uploading");
    setProgress(0);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await apiClient.post<ApiUploadResponse>(
        UPLOAD_ENDPOINT,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress(evt) {
            const pct = evt.total ? Math.round((evt.loaded / evt.total) * 100) : 0;
            setProgress(pct);
          },
        },
      );
      setResult(data.data);
      setFile(null);
      setUploadState("success");
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string })?.message ?? err.message)
        : "Upload failed. Please try again.";
      setUploadError(message);
      setUploadState("error");
    }
  }

  const isUploading = uploadState === "uploading";

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <section className="py-24 lg:py-32 bg-background" id="upload">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-xs font-medium text-primary">Upload</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-secondary tracking-tight mb-5">
            Upload Material Data
          </h2>
          <p className="text-lg text-muted leading-relaxed">
            Import Excel BOQ/DSR sheets or IFC BIM model files to register
            materials in the passport system. More formats coming soon.
          </p>
        </div>

        {/* Upload card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">

            {/* ── Success state ── */}
            {uploadState === "success" && result && (
              <div className="p-10 text-center space-y-5">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-accent" />
                  </div>
                </div>
                <div>
                  <p className="text-xl font-bold text-secondary">Uploaded successfully</p>
                  <p className="text-sm text-muted mt-1 truncate px-4">{result.originalName}</p>
                </div>
                <div className="inline-flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted border border-border rounded-lg px-5 py-2.5 bg-background">
                  <span className="font-semibold text-primary capitalize">{result.fileType}</span>
                  <span className="text-border">·</span>
                  <span>{formatBytes(result.fileSize)}</span>
                  <span className="text-border">·</span>
                  <span>{new Date(result.uploadedAt).toLocaleString()}</span>
                </div>
                <button
                  onClick={clearFile}
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Upload another file
                </button>
              </div>
            )}

            {/* ── Drop zone (idle / ready / uploading / error) ── */}
            {uploadState !== "success" && (
              <>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Upload file drop zone"
                  className={[
                    "relative p-10 transition-colors select-none outline-none",
                    dragActive
                      ? "bg-primary/5"
                      : file
                        ? "bg-card"
                        : "hover:bg-primary/5",
                    !file && !isUploading ? "cursor-pointer" : "cursor-default",
                    dragActive ? "border-2 border-primary border-dashed rounded-t-2xl" : "border-2 border-dashed border-border rounded-t-2xl",
                  ].join(" ")}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => { if (!file && !isUploading) inputRef.current?.click(); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls,.ifc"
                    className="sr-only"
                    onChange={onInputChange}
                    disabled={isUploading}
                    aria-hidden="true"
                  />

                  {/* Idle: no file, not uploading */}
                  {!file && !isUploading && (
                    <div className="text-center space-y-5">
                      <div className="flex justify-center">
                        <div
                          className={[
                            "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
                            dragActive ? "bg-primary" : "bg-primary/10",
                          ].join(" ")}
                        >
                          <Upload
                            className={["w-7 h-7", dragActive ? "text-white" : "text-primary"].join(" ")}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-secondary">
                          {dragActive ? "Drop your file here" : "Drag & drop your file here"}
                        </p>
                        <p className="text-sm text-muted mt-1">
                          or{" "}
                          <span className="text-primary font-medium">browse to upload</span>
                        </p>
                      </div>

                      {/* Format badges */}
                      <div className="flex flex-wrap justify-center gap-2">
                        {FORMAT_BADGES.map(({ ext, label, Icon, classes }) => (
                          <span
                            key={ext}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${classes}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-muted/70">
                        Maximum file size: {MAX_FILE_SIZE_MB} MB
                      </p>
                    </div>
                  )}

                  {/* File selected and not uploading */}
                  {file && !isUploading && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileSpreadsheet className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-secondary truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted mt-0.5">{formatBytes(file.size)}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); clearFile(); }}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-secondary hover:bg-background transition-colors flex-shrink-0"
                        aria-label="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Uploading state */}
                  {isUploading && (
                    <div className="text-center space-y-5">
                      <div className="flex justify-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <Upload className="w-7 h-7 text-primary animate-bounce" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-secondary truncate px-4">
                          {file?.name}
                        </p>
                        <p className="text-xs text-muted mt-1">Uploading…</p>
                      </div>
                      <div className="max-w-xs mx-auto w-full space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-muted">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-200"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Validation error banner */}
                {validationError && (
                  <div className="px-6 py-3 bg-red-50 border-t border-red-100 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-600">{validationError}</p>
                  </div>
                )}

                {/* Upload error banner */}
                {uploadState === "error" && uploadError && (
                  <div className="px-6 py-3 bg-red-50 border-t border-red-100 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-600">{uploadError}</p>
                  </div>
                )}

                {/* Footer action bar */}
                {(uploadState === "ready" || uploadState === "error") && file && (
                  <div className="px-6 py-4 border-t border-border bg-background/50 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="text-sm text-muted hover:text-secondary transition-colors"
                    >
                      Choose a different file
                    </button>
                    <button
                      type="button"
                      onClick={handleUpload}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all"
                    >
                      <Upload className="w-4 h-4" />
                      {uploadState === "error" ? "Try Again" : "Upload File"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <p className="text-center text-xs text-muted mt-4">
            File contents are not parsed yet — metadata is saved and processing will be added in a future step.
          </p>
        </div>
      </div>
    </section>
  );
}
