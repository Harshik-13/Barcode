# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| `production-mvp-1` | ✅ |

---

## Reporting a Vulnerability

If you discover a security vulnerability, **do not open a public GitHub issue**.

Instead, report it privately by emailing the project maintainer or opening a [GitHub Security Advisory](https://github.com/<org>/<repo>/security/advisories).

### What to include

- Type of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response timeline

- **24 hours:** Acknowledgment of receipt
- **7 days:** Initial assessment
- **30 days:** Fix or mitigation deployed (depends on severity)

---

## Security Baseline

All code in this project must follow the mandatory security requirements documented in [SECURITY BASELINE](docs/security-baseline.md).

### Key requirements:

- Authentication on all non-public endpoints
- Server-side input validation
- Role-based authorization
- Ownership verification
- Database transactions for state changes
- Rate limiting
- Audit logging
- Parameterized SQL queries
- No secrets in code or logs
- Output sanitization (XSS prevention)

---

## Dependency Security

- `npm audit` runs on every CI build for `main` and `develop` branches
- Zero tolerance for critical/high vulnerabilities
- Dependencies are pinned to exact versions
- Lockfile is committed and reviewed

---

## Responsible Disclosure

We follow responsible disclosure:

1. Reporter discovers vulnerability
2. Reporter notifies maintainer privately
3. Maintainer assesses and fixes
4. Fix is deployed
5. Vulnerability is publicly disclosed after users have had time to update

---

## Security Contacts

For security issues, contact the project maintainer through the repository's security advisory system.
