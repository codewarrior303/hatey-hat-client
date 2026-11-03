# Security Policy – Hatey Hat Web Application

## Reporting a Vulnerability

If you discover a security vulnerability in the Hatey Hat web application, please report it privately:

- **Security Contact**: `security@hateyhat.org`
- **Response Window**: Initial acknowledgment within 24 hours. Remediation within 72 hours for critical findings.
- **Scope**:
  - Next.js web application and App Router endpoints
  - Better Auth authentication and cookie session security
  - Content Security Policy (CSP), anti-clickjacking, and input escaping
  - Route authorization guards and client-side privacy controls

Please provide:
- Steps to reproduce
- Affected URLs or components
- Severity assessment and evidence (screenshots, HTTP logs)

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Client-Side Security Guarantees

1. **Session & Cookie Security**:
   - `HttpOnly`, `Secure` (production), and `SameSite: "lax"` cookies.
   - JWT tokens fetched on-demand into memory; never persisted to `localStorage` or `sessionStorage`.
2. **Strict Content Security Policy (CSP)**:
   - Restricts script execution to approved sources.
   - Blocks iframe embedding (`frame-ancestors: 'none'`).
   - Prevents object injection (`object-src: 'none'`).
3. **Cross-Site Scripting (XSS) Prevention**:
   - Zero usage of `dangerouslySetInnerHTML`.
   - Automatic JSX text escaping on all user-supplied data (event titles, descriptions, locations, usernames).
   - Protocol-level URL validation (`http:` and `https:` only; `javascript:`, `data:`, and `file:` schemes blocked).
4. **Brute-Force & Account Enumeration**:
   - Rate limiting on email/password sign-in and sign-up.
   - Uniform error messages on authentication failures.
