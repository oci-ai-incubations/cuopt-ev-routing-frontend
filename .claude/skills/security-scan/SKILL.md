---
name: security-scan
description: Run npm audit and check for hardcoded secrets in source.
user-invocable: true
allowed-tools: Bash, Read, Grep
---

# Security Scan

## Steps

### 1. Dependency audit

```bash
npm run audit:security
```

### 2. Secrets check

Verify no secrets are staged:
```bash
git diff --cached --name-only | grep -iE '\.(env|pem|key|p12)$' || echo "No secret files staged"
```

Use the Grep tool to search `src/` and `server/` for patterns like `(password|secret|api_key|token)\s*=\s*["'][^"']+["']`. Exclude env variable reads.

## Reporting

- **PASS** — no issues
- **WARN** — advisory, review recommended
- **FAIL** — vulnerabilities or hardcoded secrets found; must fix before deploy
