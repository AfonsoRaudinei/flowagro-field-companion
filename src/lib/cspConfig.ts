/**
 * Content Security Policy Configuration - Fase 3 Hardening
 * Define políticas de segurança para prevenir XSS e outras vulnerabilidades
 */

export const CSP_POLICY = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vite dev server
    "*.supabase.co",
    "*.lovableproject.com",
    "blob:" // Required for Service Worker
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for CSS-in-JS
    "fonts.googleapis.com"
  ],
  'img-src': [
    "'self'",
    "data:",
    "blob:",
    "*.supabase.co",
    "*.agromonitoring.com",
    "*.planet.com",
    "https://api.mapbox.com",
    "https://tiles.mapbox.com"
  ],
  'font-src': [
    "'self'",
    "fonts.gstatic.com",
    "data:"
  ],
  'connect-src': [
    "'self'",
    "*.supabase.co",
    "*.agromonitoring.com",
    "api.planet.com",
    "https://api.mapbox.com",
    "wss://realtime.supabase.co"
  ],
  'media-src': [
    "'self'",
    "blob:",
    "data:"
  ],
  'object-src': ["'none'"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-src': ["'none'"],
  'child-src': ["'none'"],
  'worker-src': [
    "'self'",
    "blob:" // Required for Service Worker
  ]
};

export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=()',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
};

export function generateCSPString(): string {
  return Object.entries(CSP_POLICY)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

export function applyCSPMeta(): void {
  if (typeof document === 'undefined') return;

  // Remove existing CSP meta tag
  const existing = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existing) {
    existing.remove();
  }

  // Create new CSP meta tag
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = generateCSPString();
  document.head.appendChild(meta);

  console.log('[Security] CSP policy applied:', generateCSPString());
}

export function applySecurityHeaders(): void {
  // Note: These headers should ideally be set by the server
  // This is a client-side implementation for development/testing
  
  Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
    // Store headers for reference (can't actually set response headers client-side)
    (window as any).__SECURITY_HEADERS = {
      ...(window as any).__SECURITY_HEADERS,
      [header]: value
    };
  });

  console.log('[Security] Security headers configured:', SECURITY_HEADERS);
}

export function setupCSPViolationReporting(): void {
  if (typeof document === 'undefined') return;

  document.addEventListener('securitypolicyviolation', (event: SecurityPolicyViolationEvent) => {
    const violation = {
      blockedURI: event.blockedURI,
      columnNumber: event.columnNumber,
      disposition: event.disposition,
      documentURI: event.documentURI,
      effectiveDirective: event.effectiveDirective,
      lineNumber: event.lineNumber,
      originalPolicy: event.originalPolicy,
      referrer: event.referrer,
      sample: event.sample,
      sourceFile: event.sourceFile,
      statusCode: event.statusCode,
      violatedDirective: event.violatedDirective
    };

    console.warn('[Security] CSP Violation:', violation);

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // fetch('/api/security/csp-violation', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(violation)
      // }).catch(console.error);
    }
  });

  console.log('[Security] CSP violation reporting enabled');
}

// Initialize security policies
export function initializeSecurity(): void {
  applyCSPMeta();
  applySecurityHeaders();
  setupCSPViolationReporting();
  
  // Additional security measures
  setupIntegrityChecks();
  preventClickjacking();
  setupInputValidation();
}

function setupIntegrityChecks(): void {
  // Monitor for DOM manipulation attempts
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              const element = node as Element;
              
              // Check for suspicious script injections
              if (element.tagName === 'SCRIPT' && !element.hasAttribute('data-flowagro')) {
                console.warn('[Security] Suspicious script injection detected:', element);
                element.remove();
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('[Security] DOM integrity monitoring enabled');
  }
}

function preventClickjacking(): void {
  // Verify we're not in an iframe (additional protection)
  if (window.top !== window.self) {
    console.warn('[Security] Potential clickjacking attempt detected');
    
    // Break out of iframe
    window.top!.location = window.location;
  }
}

function setupInputValidation(): void {
  // Global input sanitization
  document.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement;
    if (!target.value) return;

    // Basic XSS prevention
    if (/<script|javascript:|on\w+\s*=/i.test(target.value)) {
      console.warn('[Security] Potentially dangerous input detected:', target.value);
      target.value = target.value.replace(/<script.*?<\/script>/gi, '');
      target.value = target.value.replace(/javascript:/gi, '');
      target.value = target.value.replace(/on\w+\s*=/gi, '');
    }
  });

  console.log('[Security] Input validation enabled');
}