import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, Loader2, Check } from 'lucide-react';
import { CheckRecordData } from '../types';
import { deleteCheckFileFromStorage } from '../lib/supabase';

interface DeleteConfirmModalProps {
  check: CheckRecordData | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (fileName: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  check,
  isOpen,
  onClose,
  onDeleted
}) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen || !check) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg('');

    try {
      const res = await deleteCheckFileFromStorage(check.fileName);
      if (!res.success) {
        console.warn('Storage silme uyarısı:', res.error);
      }

      setSuccess(true);
      setTimeout(() => {
        setIsDeleting(false);
        setSuccess(false);
        onDeleted(check.fileName);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Evrak silinirken hata oluştu.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-rose-900/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Evrak Silme Onayı</h3>
              <p className="text-xs text-rose-300">Bu işlem geri alınamaz!</p>
            </div>
          </div>

          <button
            disabled={isDeleting}
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3">
          <div className="p-3.5 bg-rose-950/40 border border-rose-900/60 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-200 space-y-1">
              <p className="font-semibold text-rose-200">
                Aşağıdaki evrak depolama alanından ve sistemden kalıcı olarak silinecektir:
              </p>
              <div className="font-mono text-amber-300 bg-slate-900/80 p-2 rounded border border-slate-800 break-all text-[11px] mt-2">
                {check.fileName}
              </div>
              {check.cekNo && (
                <p className="text-[11px] text-slate-400">
                  Çek No: <span className="font-mono text-white">{check.cekNo}</span> | Şantiye: <span className="text-white">{check.santiyeBirim || 'MAMAK'}</span>
                </p>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Evrak başarıyla silindi.</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Vazgeç
          </button>

          <button
            type="button"
            disabled={isDeleting || success}
            onClick={handleDelete}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/30 flex items-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Siliniyor...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Evet, Evrağı Sil</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
