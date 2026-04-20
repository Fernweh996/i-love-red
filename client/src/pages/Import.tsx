import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import RecognitionResult from '@/components/import/RecognitionResult';
import ImageUploader from '@/components/import/ImageUploader';
import { loadImportedFunds, uploadImage, deleteImage } from '@/api';
import { usePortfolioStore, DEFAULT_GROUP_ID } from '@/stores/portfolio';
import { useToastStore } from '@/stores/toast';
import type { ParsedFund } from '@/types';

type Stage = 'empty' | 'uploading' | 'uploaded' | 'loading' | 'result';

export default function ImportPage() {
  const navigate = useNavigate();
  const addPosition = usePortfolioStore((s) => s.addPosition);
  const [searchParams] = useSearchParams();
  const urlGroupId = searchParams.get('group') || DEFAULT_GROUP_ID;
  const groups = usePortfolioStore((s) => s.groups);
  const showToast = useToastStore((s) => s.show);
  const targetGroup = groups.find((g) => g.id === urlGroupId);

  const [stage, setStage] = useState<Stage>('empty');
  const [funds, setFunds] = useState<ParsedFund[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ filename: string; absolutePath: string; preview: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // No auto-load on mount — always start fresh when entering the page

  // Handle image selected from ImageUploader
  const handleImage = useCallback(async (base64: string) => {
    setStage('uploading');
    setError(null);
    try {
      const result = await uploadImage(base64);
      setUploadedFile({ ...result, preview: base64 });
      setStage('uploaded');
    } catch (err: any) {
      setError(err.message || '上传图片失败');
      setStage('empty');
    }
  }, []);

  // Copy command to clipboard
  const handleCopy = useCallback(async () => {
    if (!uploadedFile) return;
    const command = `/recognize-fund ${uploadedFile.absolutePath}`;
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text
      const input = document.querySelector<HTMLInputElement>('#recognize-command');
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }, [uploadedFile]);

  // Load imported funds (refresh recognition results)
  const loadFunds = useCallback(async () => {
    setStage('loading');
    setError(null);
    try {
      const result = await loadImportedFunds();
      if (result.length > 0) {
        setFunds(result);
        setStage('result');
      } else {
        setError('暂无识别结果，请确认已在 Claude Code 中运行识别命令');
        setStage('uploaded');
      }
    } catch (err: any) {
      setError(err.message || '加载识别结果失败');
      setStage('uploaded');
    }
  }, []);

  const handleImport = useCallback(async () => {
    setImporting(true);
    try {
      let importedCount = 0;
      for (const fund of funds) {
        if (!fund.fundCode || !fund.shares || !fund.costNav) {
          // Try to compute costNav from marketValue/shares if missing
          let costNav = fund.costNav;
          let shares = fund.shares;
          if (!costNav && fund.marketValue && shares) {
            costNav = fund.marketValue / shares;
          }
          if (!shares && fund.marketValue && costNav) {
            shares = fund.marketValue / costNav;
          }
          if (!shares || !costNav) continue;
          addPosition(fund.fundCode, fund.fundName, shares, costNav, undefined, urlGroupId);
          importedCount++;
        } else {
          addPosition(fund.fundCode, fund.fundName, fund.shares, fund.costNav, undefined, urlGroupId);
          importedCount++;
        }
      }

      if (importedCount > 0) {
        // Clean up uploaded image after successful import
        if (uploadedFile) {
          try {
            await deleteImage(uploadedFile.filename);
          } catch {
            // Ignore cleanup errors
          }
        }
        showToast(`成功导入 ${importedCount} 只基金`);
        navigate('/portfolio');
      } else {
        setError('没有可导入的基金，请确认份额和成本净值已填写');
      }
    } catch (err: any) {
      setError(err.message || '导入失败');
    } finally {
      setImporting(false);
    }
  }, [funds, addPosition, navigate, uploadedFile, urlGroupId, showToast]);

  const handleReset = useCallback(() => {
    // Clean up uploaded image if exists
    if (uploadedFile) {
      deleteImage(uploadedFile.filename).catch(() => {});
    }
    setStage('empty');
    setFunds([]);
    setError(null);
    setUploadedFile(null);
    setCopied(false);
  }, [uploadedFile]);

  return (
    <div className="min-h-screen bg-surface-bg pb-20">
      {/* Header */}
      <div className="bg-surface border-b border-gray-100 px-4 py-3">
        <h1 className="text-lg font-semibold text-ink">截图导入</h1>
        <p className="text-xs text-ink-faint mt-0.5">
          上传持仓截图，通过 Claude Code 识别并导入基金信息
        </p>
      </div>
      {targetGroup && (
        <div className="mx-4 mt-2 px-3 py-2 bg-accent/10 rounded-lg flex items-center gap-2">
          <span className="text-sm">{targetGroup.icon}</span>
          <span className="text-[13px] text-accent">导入到：{targetGroup.name}</span>
        </div>
      )}

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Error message */}
        {error && (
          <div className="bg-rise/10 border border-rise/20 rounded-xl p-3 text-sm text-rise">
            {error}
          </div>
        )}

        {/* Loading state */}
        {stage === 'loading' && (
          <div className="text-center py-8 space-y-3">
            <div className="w-10 h-10 mx-auto border-3 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-ink-secondary">正在加载识别结果...</p>
          </div>
        )}

        {/* Uploading state */}
        {stage === 'uploading' && (
          <div className="text-center py-8 space-y-3">
            <div className="w-10 h-10 mx-auto border-3 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-ink-secondary">正在上传图片...</p>
          </div>
        )}

        {/* Results */}
        {stage === 'result' && (
          <>
            <RecognitionResult
              funds={funds}
              onFundsChange={setFunds}
              onImport={handleImport}
              importing={importing}
            />
            <button
              onClick={handleReset}
              className="w-full py-2.5 text-sm text-ink-faint hover:text-ink-secondary transition-colors"
            >
              清除识别结果
            </button>
          </>
        )}

        {/* Uploaded state — show preview + copy command + refresh */}
        {stage === 'uploaded' && uploadedFile && (
          <>
            {/* Image preview */}
            <div className="bg-surface rounded-xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-ink">已上传截图</h3>
                <button
                  onClick={handleReset}
                  className="text-xs text-ink-faint hover:text-rise transition-colors"
                >
                  删除重传
                </button>
              </div>
              <img
                src={uploadedFile.preview}
                alt="uploaded screenshot"
                className="w-full max-h-64 object-contain rounded-lg bg-surface-bg"
              />
            </div>

            {/* Command to copy */}
            <div className="bg-surface rounded-xl border border-gray-100 p-4 space-y-3">
              <h3 className="text-sm font-medium text-ink">请在 Claude Code 中运行以下命令</h3>
              <div className="flex items-center gap-2">
                <input
                  id="recognize-command"
                  readOnly
                  value={`/recognize-fund ${uploadedFile.absolutePath}`}
                  className="flex-1 bg-surface-bg border border-border rounded-lg px-3 py-2 text-xs text-ink-secondary font-mono"
                />
                <button
                  onClick={handleCopy}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    copied
                      ? 'bg-fall/10 text-fall'
                      : 'bg-accent hover:bg-accent/90 text-white'
                  }`}
                >
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <p className="text-xs text-ink-faint">
                运行后 Claude Code 会自动识别截图中的基金持仓信息
              </p>
            </div>

            {/* Refresh button */}
            <button
              onClick={loadFunds}
              className="w-full py-2.5 bg-accent hover:bg-accent/90 active:bg-accent/80 text-white text-sm font-medium rounded-xl transition-colors"
            >
              刷新识别结果
            </button>
          </>
        )}

        {/* Empty state — upload + usage tips */}
        {stage === 'empty' && (
          <>
            <ImageUploader onImage={handleImage} />

            <div className="bg-surface rounded-xl border border-gray-100 p-4 space-y-3">
              <h3 className="text-sm font-medium text-ink">使用说明</h3>
              <div className="space-y-2 text-xs text-ink-faint">
                <div className="flex items-start gap-2">
                  <span className="bg-accent/20 text-accent rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-medium">1</span>
                  <span>上传理财通/支付宝的基金持仓截图</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-accent/20 text-accent rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-medium">2</span>
                  <span>复制识别命令，在 Claude Code 中运行</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-accent/20 text-accent rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-medium">3</span>
                  <span>点击"刷新识别结果"查看并编辑识别结果</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-accent/20 text-accent rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-medium">4</span>
                  <span>确认信息无误后，一键导入到持仓</span>
                </div>
              </div>
              <div className="mt-3 p-2 bg-accent/10 rounded-lg">
                <p className="text-xs text-accent">
                  提示：无需 API Key，Claude Code 自身即可识别截图中的基金信息
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
