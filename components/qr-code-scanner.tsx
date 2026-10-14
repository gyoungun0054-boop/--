"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type Props = { onScan: (decodedText: string) => void };

export default function QRCodeScanner({ onScan }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("카메라 스캔을 시작하려면 버튼을 눌러 주세요.");
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let scanner: Html5Qrcode | null = null;

    async function startScanner() {
      try {
        scanner = new Html5Qrcode("nexus-qr-reader");
        const cameras = await Html5Qrcode.getCameras();
        if (cancelled) return;
        if (!cameras.length) {
          setMessage("사용 가능한 카메라를 찾을 수 없습니다. 코드 직접 입력을 이용해 주세요.");
          setEnabled(false);
          return;
        }
        const preferredCamera = cameras.find((camera) => /back|rear|environment|후면/i.test(camera.label)) ?? cameras[0];
        await scanner.start(
          preferredCamera.id,
          { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
          (decodedText) => {
            onScanRef.current(decodedText);
            setMessage("QR 코드를 인식했습니다. 입장 확인 버튼을 눌러 처리해 주세요.");
            setEnabled(false);
          },
          () => {
            // No QR detected in this frame; keep scanning.
          },
        );
        if (!cancelled) setMessage("QR 코드를 화면 안에 맞춰 주세요.");
      } catch {
        setMessage("카메라를 열 수 없습니다. 권한을 허용하거나 HTTPS 환경에서 다시 시도해 주세요.");
        setEnabled(false);
      }
    }

    void startScanner();
    return () => {
      cancelled = true;
      if (scanner?.isScanning) {
        void scanner.stop().catch(() => undefined).finally(() => scanner?.clear());
      } else {
        try { scanner?.clear(); } catch { /* Scanner may not have initialized. */ }
      }
    };
  }, [enabled]);

  return (
    <div className="camera-section">
      <div className="camera-toolbar">
        <p className="camera-message" role="status" aria-live="polite">{message}</p>
        <button type="button" className="camera-button" onClick={() => {
          setMessage(enabled ? "카메라 스캔이 중지되었습니다." : "카메라를 준비하고 있습니다…");
          setEnabled((current) => !current);
        }}>
          {enabled ? "스캔 중지" : "카메라로 스캔"}
        </button>
      </div>
      {enabled && <div id="nexus-qr-reader" className="qr-reader" aria-label="QR 코드 카메라 스캔 영역" />}
    </div>
  );
}
