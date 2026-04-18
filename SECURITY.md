# Security Policy

## Reporting a Vulnerability

If you believe you have found a security vulnerability in Tracklistd, please report it privately. Do not open a public issue or pull request.

### Preferred: GitHub Private Vulnerability Reporting

Use GitHub's built-in private vulnerability reporting:

1. Navigate to the [Security tab](https://github.com/acarberk/tracklistd/security)
2. Click **Report a vulnerability**
3. Fill in the form with details

This keeps the report confidential until a fix is released.

### Alternative: Email

If you cannot use GitHub's private reporting, send details to: **acar.berk@icloud.com**

Include:

- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested mitigation

## Response Expectations

- **Acknowledgment:** within 48 hours
- **Initial assessment:** within 7 days
- **Fix timeline:** depends on severity, communicated after assessment

## Scope

In scope:

- Authentication and session handling
- Authorization and access control
- Input validation and injection vectors
- Cryptographic handling of secrets
- Third-party integration flows (Steam, PSN, Xbox)
- Supply chain (dependency tampering)

Out of scope:

- Issues in third-party services we integrate with (report those directly to the vendor)
- Social engineering attacks against project maintainers
- Physical access attacks

## Disclosure Policy

We follow coordinated disclosure. A fix is developed and released before public disclosure. Reporters who follow this policy will be credited in release notes unless they prefer to remain anonymous.

## Supported Versions

Tracklistd is in early development. Only the latest `main` branch is supported for security updates at this time.
