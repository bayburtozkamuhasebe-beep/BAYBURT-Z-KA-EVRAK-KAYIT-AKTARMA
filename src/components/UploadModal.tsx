import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileCheck, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  CheckCircle2,
  Folder
} from 'lucide-react';
import { supabase, BUCKET_NAME, DEFAULT_FOLDER } from '../lib/supabase';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: 'pending' | 'uploading' | 'success' | 'error' }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Allow image and PDF formats
      if (file.type.startsWith('image/') || file.type === 'application/pdf' || file.name.match(/\.(jpg|jpeg|png|webp|pdf|bmp)$/i)) {
        validFiles.push(file);
      }
    }
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    setErrorMessage(null);

    const newProgress = { ...uploadProgress };
    selectedFiles.forEach(f => {
      newProgress[f.name] = 'uploading';
    });
    setUploadProgress({ ...newProgress });

    let hasError = false;

    for (const file of selectedFiles) {
      try {
        // Sanitize file name for Supabase storage safety
        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uploadPath = `${DEFAULT_FOLDER}/${cleanName}`;

        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(uploadPath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) {
          console.error(`Upload error for ${file.name}:`, error);
          newProgress[file.name] = 'error';
          hasError = true;
        } else {
          newProgress[file.name] = 'success';
        }
        setUploadProgress({ ...newProgress });
      } catch (err: any) {
        console.error(err);
        newProgress[file.name] = 'error';
        hasError = true;
        setUploadProgress({ ...newProgress });
      }
    }

    setIsUploading(false);

    if (!hasError) {
      setTimeout(() => {
        setSelectedFiles([]);
        setUploadProgress({});
        onUploadSuccess();
        onClose();
      }, 700);
    } else {
      setErrorMessage('Bazı dosyalar yüklenirken hata oluştu. Lütfen tekrar deneyiniz.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Yeni Çek Görseli Yükle</h2>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                Hedef: <span className="text-amber-300 font-mono">{BUCKET_NAME}/{DEFAULT_FOLDER}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Drag & Drop Box */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setIsDragOver(false);
              handleFileSelect(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
              isDragOver 
                ? 'border-amber-400 bg-amber-500/10' 
                : 'border-slate-700 hover:border-slate-500 bg-slate-800/40 hover:bg-slate-800/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={e => handleFileSelect(e.target.files)}
            />
            <div className="p-3 bg-slate-800 rounded-full text-amber-400 border border-slate-700 shadow-inner">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Çek görsellerini buraya sürükleyip bırakın
              </p>
              <p className="text-xs text-slate-400 mt-1">
                veya bilgisayarınızdan seçmek için <span className="text-amber-400 font-medium underline">tıklayın</span>
              </p>
            </div>
            <span className="text-[11px] text-slate-500">
              Desteklenen formatlar: JPG, PNG, WEBP, PDF
            </span>
          </div>

          {/* Selected File List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Seçilen Dosyalar ({selectedFiles.length})</span>
                <button
                  onClick={() => setSelectedFiles([])}
                  disabled={isUploading}
                  className="text-rose-400 hover:underline"
                >
                  Tümünü Temizle
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-slate-200 truncate">{file.name}</span>
                      <span className="text-slate-500 text-[10px] shrink-0">
                        ({(file.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {uploadProgress[file.name] === 'uploading' && (
                        <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                      )}
                      {uploadProgress[file.name] === 'success' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      {uploadProgress[file.name] === 'error' && (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      )}
                      {!isUploading && (
                        <button
                          onClick={() => removeFile(idx)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
          >
            İptal
          </button>

          <button
            type="button"
            onClick={handleUploadAll}
            disabled={selectedFiles.length === 0 || isUploading}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-amber-500/20"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Yükleniyor...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>{selectedFiles.length} Dosyayı Yükle</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
