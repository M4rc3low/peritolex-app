# Security Policy

## Supported versions

This project is currently maintained as an active portfolio application. Security improvements should target the latest version available on the `main` branch.

## Reporting a vulnerability

If you find a vulnerability, do not open a public issue with sensitive details.

Please report it privately to the repository owner with:

- A clear description of the issue
- Steps to reproduce
- Expected impact
- Suggested mitigation, if available

## Security principles

- No credentials, secrets or tokens should be committed to the repository.
- Real process data, documents or sensitive information should never be versioned.
- Demonstration data must be anonymized before publication.
- Local storage is used only as a development/demo persistence layer.
- A production deployment must use secure authentication, authorization and access control.

## Production hardening checklist

- Configure authentication and authorization
- Move persistence to a secure backend
- Validate all user input
- Protect documents and sensitive records
- Enable HTTPS
- Configure security headers
- Add audit logs and monitoring
- Review dependency vulnerabilities before release
