/// <reference types="@types/w3c-web-usb" />
/// <reference types="@types/w3c-web-serial" />

export interface BrowserFlashSupport {
  webUsb: boolean;
  webSerial: boolean;
  secureContext: boolean;
}

export function detectFlashSupport(): BrowserFlashSupport {
  const secureContext = typeof window !== "undefined" && window.isSecureContext;

  return {
    webUsb: secureContext && typeof navigator !== "undefined" && "usb" in navigator,
    webSerial: secureContext && typeof navigator !== "undefined" && "serial" in navigator,
    secureContext,
  };
}

export function canFlashDfu(): boolean {
  const support = detectFlashSupport();
  return support.webUsb;
}

export function canFlashSerial(): boolean {
  const support = detectFlashSupport();
  return support.webSerial;
}
