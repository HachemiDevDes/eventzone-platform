"use client";

import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAEkYnGKDWBX1iIOr";

export default function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
  action = "form_submit",
  theme = "auto",
  size = "normal",
  className = ""
}) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    // Load Cloudflare Turnstile script dynamically if not present
    if (!window.turnstile) {
      const existingScript = document.getElementById("cf-turnstile-script");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "cf-turnstile-script";
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted && window.turnstile && containerRef.current) {
            renderWidget();
          }
        };
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener("load", () => {
          if (isMounted && window.turnstile && containerRef.current) {
            renderWidget();
          }
        });
      }
    } else if (containerRef.current) {
      renderWidget();
    }

    function renderWidget() {
      if (!window.turnstile || !containerRef.current) return;
      if (widgetIdRef.current !== null) return; // already rendered

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          action,
          theme,
          size,
          callback: (token) => {
            if (isMounted && onVerify) onVerify(token);
          },
          "error-callback": (err) => {
            if (isMounted && onError) onError(err);
          },
          "expired-callback": () => {
            if (isMounted && onExpire) onExpire();
          },
        });
      } catch (e) {
        console.warn("Turnstile render error:", e);
      }
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // ignore cleanup errors
        }
        widgetIdRef.current = null;
      }
    };
  }, [action, theme, size]);

  return (
    <div className={`turnstile-container flex justify-center my-3 ${className}`}>
      <div ref={containerRef} />
    </div>
  );
}
