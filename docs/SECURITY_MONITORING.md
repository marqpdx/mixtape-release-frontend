# Security Monitoring & Best Practices

**Last Updated:** November 2025
**Status:** Production Guidelines

---

## Table of Contents

1. [Security Audit Results](#security-audit-results)
2. [What to Monitor](#what-to-monitor)
3. [Security Best Practices](#security-best-practices)
4. [Incident Response](#incident-response)
5. [Regular Security Maintenance](#regular-security-maintenance)
6. [Security Checklist](#security-checklist)

---

## Security Audit Results

### ✅ **Current Security Posture: STRONG**

#### **Protections in Place**

| Threat | Protection | Status |
|--------|------------|--------|
| **XSS (Cross-Site Scripting)** | Access tokens in memory + CSP headers | ✅ **Protected** |
| **CSRF (Cross-Site Request Forgery)** | SameSite cookies + CSRF tokens | ✅ **Protected** |
| **Session Hijacking** | httpOnly cookies + short-lived tokens | ✅ **Protected** |
| **Clickjacking** | X-Frame-Options: DENY | ✅ **Protected** |
| **MIME Sniffing** | X-Content-Type-Options | ✅ **Protected** |
| **Token Theft** | In-memory storage | ✅ **Protected** |
| **Brute Force** | Rate limiting (client + server) | ✅ **Protected** |
| **Race Conditions** | Refresh token singleton | ✅ **Protected** |

#### **Remaining Vulnerabilities**

##### 🟡 **MEDIUM RISK: Dependency Vulnerabilities**

**Issue:** npm packages can have security vulnerabilities

**Mitigation:**
```bash
# Run weekly
npm audit
yarn audit

# Fix automatically where possible
npm audit fix
yarn audit fix
```

**Best Practice:**
- Run `yarn audit` weekly
- Update dependencies monthly
- Subscribe to security advisories for critical packages

##### 🟡 **MEDIUM RISK: No Backend Rate Limiting Verified**

**Issue:** Frontend rate limiting can be bypassed

**Mitigation Required:** Implement Django rate limiting
```python
# Django settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '10/minute',  # Login attempts
        'user': '100/minute'  # Authenticated requests
    }
}
```

##### 🟢 **LOW RISK: HTTPS Not Enforced (Dev Environment)**

**Issue:** Running on HTTP locally (expected for development)

**Production Fix:** Uncomment HSTS header in `next.config.ts`:
```typescript
{
  key: 'Strict-Transport-Security',
  value: 'max-age=63072000; includeSubDomains; preload',
}
```

---

## What to Monitor

### **1. Authentication Metrics**

#### **Failed Login Attempts**

**Alert Threshold:** >5 failed attempts from single IP in 5 minutes

```typescript
// Example monitoring code
interface LoginAttempt {
  ip: string;
  success: boolean;
  timestamp: number;
}

const failedAttempts = new Map<string, LoginAttempt[]>();

function monitorLogin(ip: string, success: boolean) {
  const now = Date.now();
  const attempts = failedAttempts.get(ip) || [];

  // Add this attempt
  attempts.push({ ip, success, timestamp: now });

  // Remove attempts older than 5 minutes
  const recentAttempts = attempts.filter(
    a => now - a.timestamp < 5 * 60 * 1000
  );

  // Count failures
  const failures = recentAttempts.filter(a => !a.success).length;

  if (failures > 5) {
    // 🚨 ALERT: Possible brute force attack
    console.error(`[SECURITY] ${ip}: ${failures} failed login attempts`);
    // Send alert to security team
  }

  failedAttempts.set(ip, recentAttempts);
}
```

#### **Token Refresh Failures**

**Alert Threshold:** >3 refresh failures from single user in 1 hour

**What to Log:**
- User ID
- IP address
- Timestamp
- Error reason (user_not_found, invalid_token, etc.)

#### **Session Duration**

**Track:**
- Average session length
- Unusually long sessions (>12 hours = suspicious)
- Concurrent sessions from different IPs

### **2. API Security Metrics**

#### **Rate Limit Hits**

```typescript
// Monitor rate limit violations
function trackRateLimit(operation: string, ip: string) {
  // Log to monitoring service (DataDog, Sentry, etc.)
  console.warn(`[RATE_LIMIT] ${operation} blocked for IP: ${ip}`);

  // If same IP hits rate limit >10 times in 1 hour, investigate
}
```

#### **Unusual Access Patterns**

**Monitor For:**
- Rapid sequential requests (scraping/bot behavior)
- Requests to non-existent endpoints (probing)
- Large number of 401/403 responses
- Unusual user agents

### **3. Frontend Security Monitoring**

#### **CSP Violations**

```html
<!-- Add CSP violation reporting -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; report-uri /api/csp-report">
```

```typescript
// Backend endpoint to receive CSP reports
// POST /api/csp-report
interface CSPReport {
  'document-uri': string;
  'violated-directive': string;
  'blocked-uri': string;
  'source-file': string;
  'line-number': number;
}

// Alert on CSP violations (may indicate XSS attempt)
```

#### **Browser Console Errors**

Use error tracking (Sentry, Rollbar, LogRocket):

```typescript
// Catch unhandled errors
window.addEventListener('error', (event) => {
  // Send to monitoring service
  console.error('[SECURITY] Unhandled error:', event.error);
});

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('[SECURITY] Unhandled rejection:', event.reason);
});
```

### **4. User Account Security**

#### **Account Takeover Indicators**

**Alert On:**
- Password change from new IP
- Email change from new IP
- Multiple failed password attempts
- Login from new country/timezone

#### **Session Hijacking Indicators**

**Monitor:**
- IP address changes mid-session
- User agent changes mid-session
- Geolocation jumps (US → China in 5 minutes = suspicious)

---

## Security Best Practices

### **1. Regular Dependency Updates**

```bash
# Weekly security check
yarn audit

# Monthly updates
yarn upgrade-interactive --latest

# Check for outdated packages
yarn outdated
```

**Critical Packages to Monitor:**
- `react`, `next` (framework security)
- `axios` (HTTP client)
- `@chakra-ui/*` (UI framework)

### **2. Environment Variables**

```bash
# .env.local (NEVER commit this)
NEXT_PUBLIC_ROOT_API_URL=http://localhost:8010
ACCESS_TOKEN_SIGNING_KEY=<random-secret-here>

# Generate secure secrets
openssl rand -base64 32
```

**Rules:**
- ✅ Use `.env.local` for secrets
- ✅ Add `.env.local` to `.gitignore`
- ❌ NEVER commit secrets to git
- ❌ NEVER expose secrets in `NEXT_PUBLIC_*` variables

### **3. Code Review Checklist**

Before merging code, verify:

- [ ] No hardcoded credentials or API keys
- [ ] User input is sanitized (no SQL injection, XSS)
- [ ] Authentication checks on protected endpoints
- [ ] Authorization checks (user can only access their data)
- [ ] No sensitive data in logs
- [ ] Error messages don't leak system information

### **4. Secure Coding Patterns**

#### **Always Sanitize User Input**

```typescript
// ❌ BAD: Direct interpolation
const query = `SELECT * FROM users WHERE email = '${userInput}'`;

// ✅ GOOD: Parameterized queries (handled by backend ORM)
const user = await User.findOne({ where: { email: userInput } });
```

#### **Never Trust Client Data**

```typescript
// ❌ BAD: Trusting client-sent user ID
const deleteUser = async (userId: string) => {
  await api.delete(`/users/${userId}`); // Anyone can delete any user!
};

// ✅ GOOD: Backend validates user owns the resource
const deleteOwnAccount = async () => {
  // Backend checks: is authenticated user === account owner?
  await api.delete('/users/me');
};
```

#### **Always Validate on Backend**

```typescript
// Frontend validation is for UX, NOT security
// ❌ BAD: Only frontend validation
<input type="email" required />

// ✅ GOOD: Backend also validates
// Backend:
if (!isValidEmail(email)) {
  throw new Error('Invalid email');
}
```

### **5. Logging Best Practices**

#### **What to Log**

```typescript
// ✅ GOOD: Log security events
console.log('✅ Login successful', {
  userId: user.id,
  ip: request.ip,
  timestamp: new Date().toISOString(),
});

// ✅ GOOD: Log errors
console.error('❌ Login failed', {
  identifier: credentials.identifier, // username/email is ok
  reason: 'invalid_credentials',
  ip: request.ip,
});
```

#### **What NOT to Log**

```typescript
// ❌ BAD: Never log passwords
console.log('Login attempt:', { password: credentials.password });

// ❌ BAD: Never log full tokens
console.log('Token:', accessToken);

// ✅ GOOD: Log token prefix only
console.log('Token:', accessToken.substring(0, 10) + '...');

// ❌ BAD: Never log sensitive personal data
console.log('SSN:', user.ssn);
```

---

## Incident Response

### **If You Detect a Security Breach**

#### **1. Immediate Actions (Within 5 Minutes)**

```bash
# 1. Revoke all active sessions
# Backend: Increment token version in database
# This invalidates all existing JWTs

# 2. Force all users to re-login
# Backend: Clear refresh token cookies

# 3. Change secret keys
ACCESS_TOKEN_SIGNING_KEY=<new-secret>
```

#### **2. Investigation (Within 1 Hour)**

- [ ] Identify compromised accounts
- [ ] Check audit logs for unauthorized access
- [ ] Determine attack vector (XSS, CSRF, etc.)
- [ ] Assess data exposure

#### **3. Notification (Within 24 Hours)**

- [ ] Notify affected users
- [ ] Report to security team
- [ ] Document incident details

#### **4. Remediation**

- [ ] Patch vulnerability
- [ ] Update dependencies
- [ ] Deploy fix
- [ ] Verify fix works

#### **5. Post-Incident Review**

- [ ] Root cause analysis
- [ ] Update security procedures
- [ ] Add monitoring for similar attacks

---

## Regular Security Maintenance

### **Daily**

- [ ] Monitor error logs for unusual activity
- [ ] Check failed login attempts
- [ ] Review API error rates

### **Weekly**

```bash
# Security audit
yarn audit

# Check for dependency vulnerabilities
yarn outdated

# Review recent commits for security issues
git log --since="1 week ago" --pretty=format:"%h %s"
```

### **Monthly**

- [ ] Update dependencies
- [ ] Review access logs
- [ ] Test authentication flows
- [ ] Review user permissions
- [ ] Check for expired sessions

### **Quarterly**

- [ ] Security penetration test
- [ ] Review and update security policies
- [ ] Audit user access
- [ ] Review third-party integrations

### **Annually**

- [ ] Full security audit by external firm
- [ ] Update disaster recovery plan
- [ ] Review compliance requirements (GDPR, etc.)
- [ ] Security training for team

---

## Security Checklist

### **Deployment Checklist**

Before deploying to production:

- [ ] Enable HSTS header (Strict-Transport-Security)
- [ ] Set `NODE_ENV=production`
- [ ] Use strong secrets (not dev defaults)
- [ ] Enable backend rate limiting
- [ ] Configure CORS to production domain only
- [ ] Set up error monitoring (Sentry)
- [ ] Enable audit logging
- [ ] Test authentication flow end-to-end
- [ ] Verify HTTPS certificates
- [ ] Set cookie `Secure` flag to `true`
- [ ] Set cookie `SameSite` to `Strict` or `Lax`

### **Development Checklist**

For every feature:

- [ ] Sanitize user input
- [ ] Validate on backend
- [ ] Check authentication
- [ ] Check authorization
- [ ] No secrets in code
- [ ] Error messages don't leak info
- [ ] Logging doesn't expose sensitive data

---

## Monitoring Tools

### **Recommended Services**

#### **1. Error Tracking**

- **Sentry** - Error tracking, performance monitoring
  ```typescript
  import * as Sentry from "@sentry/nextjs";

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
  });
  ```

- **LogRocket** - Session replay, error tracking
- **Rollbar** - Real-time error tracking

#### **2. Security Monitoring**

- **Datadog** - Application Performance Monitoring (APM)
- **New Relic** - APM + security monitoring
- **Cloudflare** - DDoS protection, WAF

#### **3. Dependency Scanning**

- **Snyk** - Vulnerability scanning
  ```bash
  # Install Snyk
  npm install -g snyk

  # Scan for vulnerabilities
  snyk test

  # Monitor continuously
  snyk monitor
  ```

- **Dependabot** - Automated dependency updates (GitHub)

#### **4. Secret Scanning**

- **GitGuardian** - Detect secrets in commits
- **TruffleHog** - Find secrets in git history
  ```bash
  # Scan git history for secrets
  trufflescan git https://github.com/your-repo
  ```

---

## Code Examples

### **Secure Authentication Check**

```typescript
// ✅ GOOD: Always verify authentication
'use client';

import { useAuth } from '@lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  return <div>Protected content</div>;
}
```

### **Secure API Call**

```typescript
// ✅ GOOD: Always handle errors securely
async function fetchUserData(userId: string) {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    // ✅ GOOD: Generic error message to user
    console.error('[API Error] Failed to fetch user data');

    // ✅ GOOD: Detailed log for debugging (not shown to user)
    console.error('Full error:', error);

    // ❌ BAD: Don't show technical details to user
    // throw new Error(error.response.data.detail);

    // ✅ GOOD: Generic message
    throw new Error('Failed to load user data');
  }
}
```

### **Secure Form Handling**

```typescript
// ✅ GOOD: Sanitize and validate
import { useForm } from 'react-hook-form';

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();

  const onSubmit = async (data: any) => {
    try {
      // Frontend validation (UX)
      if (!data.identifier || !data.password) {
        throw new Error('All fields are required');
      }

      // Backend will do real validation
      await login({
        identifier: data.identifier.trim(),
        password: data.password,
      });
    } catch (error) {
      // Show user-friendly error
      alert(error instanceof Error ? error.message : 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('identifier', { required: true })}
        type="text"
        placeholder="Username or email"
      />
      <input
        {...register('password', { required: true })}
        type="password"
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

---

## Emergency Contacts

**Security Team:**
- Email: security@yourdomain.com
- Slack: #security-alerts
- On-Call: security-oncall@pagerduty.com

**Incident Response:**
1. Report to security team immediately
2. Do NOT try to "fix" without consulting team
3. Document everything you observe

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Mozilla Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc8725)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

---

**Remember:** Security is not a one-time task—it's an ongoing process. Stay vigilant, keep systems updated, and always assume attackers are trying to compromise your application.

**Last Updated:** November 2025
