import { useState, useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import {
  getShareCapabilities,
  shareViaWebShare,
  generateShareURL,
  copyURLToClipboard,
  QR_MAX_BYTES,
} from '@/services/sharing/share';
import { generateProjectQRCode } from '@/services/sharing/qrcode';
import { compressProject } from '@/services/sharing/compression';

type ShareMethod = 'native' | 'qr' | 'link';

export function ShareDialog() {
  const project = useProjectStore((state) => state.project);
  const closeDialog = useUIStore((state) => state.closeDialog);
  const addToast = useUIStore((state) => state.addToast);

  const [activeMethod, setActiveMethod] = useState<ShareMethod>('native');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sizeInfo, setSizeInfo] = useState<{
    original: number;
    compressed: number;
    canQR: boolean;
    canURL: boolean;
  } | null>(null);

  const capabilities = getShareCapabilities();

  // Set default method based on capabilities
  useEffect(() => {
    if (!capabilities.webShare) {
      setActiveMethod(sizeInfo?.canQR ? 'qr' : 'link');
    }
  }, [capabilities.webShare, sizeInfo?.canQR]);

  // Calculate sizes on mount
  useEffect(() => {
    if (!project) return;

    const compression = compressProject(project);
    const urlResult = generateShareURL(project);

    setSizeInfo({
      original: compression.originalSize,
      compressed: compression.compressedSize,
      canQR: compression.compressedSize <= QR_MAX_BYTES,
      canURL: !urlResult.tooLarge,
    });

    // Pre-generate URL if possible
    if (!urlResult.tooLarge) {
      setShareUrl(urlResult.url);
    }
  }, [project]);

  // Generate QR when that tab is selected
  useEffect(() => {
    if (activeMethod !== 'qr' || !project || !sizeInfo?.canQR) return;

    setIsLoading(true);
    generateProjectQRCode(project, { width: 300 })
      .then((result) => {
        setQrDataUrl(result.dataUrl);
      })
      .finally(() => setIsLoading(false));
  }, [activeMethod, project, sizeInfo?.canQR]);

  if (!project) return null;

  const handleNativeShare = async () => {
    setIsLoading(true);
    const result = await shareViaWebShare(project);
    setIsLoading(false);

    if (result.success) {
      addToast('Pattern shared successfully!', 'success');
      closeDialog();
    } else if (result.error !== 'Share cancelled') {
      addToast(result.error || 'Share failed', 'error');
    }
  };

  const handleCopyLink = async () => {
    const result = await copyURLToClipboard(project);
    if (result.success) {
      addToast('Link copied to clipboard!', 'success');
    } else {
      addToast(result.error || 'Copy failed', 'error');
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;

    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${project.name.replace(/[^a-zA-Z0-9-_]/g, '_')}-qr.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-[420px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Share Pattern
        </h2>

        {/* Pattern info */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {project.name}
          </p>
          {sizeInfo && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Size: {(sizeInfo.original / 1024).toFixed(1)}KB (compressed:{' '}
              {(sizeInfo.compressed / 1024).toFixed(1)}KB)
            </p>
          )}
        </div>

        {/* Method tabs */}
        <div className="flex gap-2 mb-4">
          {capabilities.webShare && (
            <button
              onClick={() => setActiveMethod('native')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeMethod === 'native'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Share
            </button>
          )}
          <button
            onClick={() => sizeInfo?.canQR && setActiveMethod('qr')}
            disabled={!sizeInfo?.canQR}
            title={!sizeInfo?.canQR ? 'Pattern too large for QR code' : undefined}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeMethod === 'qr'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            } ${!sizeInfo?.canQR ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            QR Code
          </button>
          <button
            onClick={() => sizeInfo?.canURL && setActiveMethod('link')}
            disabled={!sizeInfo?.canURL}
            title={!sizeInfo?.canURL ? 'Pattern too large for link sharing' : undefined}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeMethod === 'link'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            } ${!sizeInfo?.canURL ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Link
          </button>
        </div>

        {/* Content based on active method */}
        <div className="mb-6">
          {activeMethod === 'native' && capabilities.webShare && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">📤</div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Share via AirDrop, Messages, Email, or any app on your device.
              </p>
              <button
                onClick={handleNativeShare}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Sharing...' : 'Share Pattern'}
              </button>
            </div>
          )}

          {activeMethod === 'qr' && (
            <div className="text-center py-4">
              {!sizeInfo?.canQR ? (
                <div className="text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-3">📱</div>
                  <p>Pattern too large for QR code.</p>
                  <p className="text-sm mt-2">
                    Try reducing the grid size or use another sharing method.
                  </p>
                </div>
              ) : isLoading ? (
                <div className="py-8 text-gray-500 dark:text-gray-400">
                  Generating QR code...
                </div>
              ) : qrDataUrl ? (
                <>
                  <img
                    src={qrDataUrl}
                    alt="QR Code for pattern"
                    className="mx-auto mb-4 rounded-lg"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Scan with another device to import the pattern
                  </p>
                  <button
                    onClick={handleDownloadQR}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Download QR Image
                  </button>
                </>
              ) : null}
            </div>
          )}

          {activeMethod === 'link' && (
            <div className="py-4">
              {!sizeInfo?.canURL ? (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-3">🔗</div>
                  <p>Pattern too large for link sharing.</p>
                  <p className="text-sm mt-2">
                    Large patterns need to be shared as files. Use the Export menu to save as JSON.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Copy this link to share your pattern. Anyone with the link can import it.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareUrl || ''}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 truncate"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    The pattern data is encoded in the URL - no server required!
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Close button */}
        <div className="flex gap-3">
          <button
            onClick={closeDialog}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
