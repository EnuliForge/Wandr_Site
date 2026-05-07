"use client";
import { useEffect, useState } from "react";

function isIOS() {
  if (typeof navigator === "undefined") return false;
  const iOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const iPadOS = navigator.userAgent.includes("Mac") && "ontouchend" in document;
  return iOSDevice || iPadOS;
}

export default function SmartAnim({
  gifSrc,
  webmSrc,
  mp4Src,
  alt = "Animation",
  className = "",
  eager = false,
}) {
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setIos(isIOS());
  }, []);

  if (ios) {
    return (
      <img
        src={gifSrc}
        alt={alt}
        className={className}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }

  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      preload={eager ? "auto" : "metadata"}
      className={className}
    >
      {webmSrc ? <source src={webmSrc} type="video/webm" /> : null}
      {mp4Src ? <source src={mp4Src} type="video/mp4" /> : null}
    </video>
  );
}
