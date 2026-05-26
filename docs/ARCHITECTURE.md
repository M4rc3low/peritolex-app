# Architecture

## Overview

PeritoLex is a React single-page application focused on process organization, deadline tracking, document records, movement history and operational alerts.

The current version uses a local data layer based on `localStorage`. This keeps the project functional for portfolio demonstration while preserving a clear migration path to a secure backend, database and external integrations.

## High-level structure

```txt
src/
├── api/                 # Local data access layer
├── components/          # Domain and reusable UI components
├── hooks/               # Shared hooks
├── lib/                 # Auth context, helpers and app utilities
├── pages/               # Route-level pages
└── main.jsx             # Application bootstrap
```

## Data layer

The application uses a local client responsible for:

- Reading collections
- Creating records
- Updating records
- Deleting records
- Simulating updates through browser events
- Providing placeholders for future integrations

This isolates persistence concerns from UI components and keeps the project ready for a backend migration.

## Current data flow

```txt
Page or Component
      ↓
Feature logic / hook
      ↓
Local client
      ↓
localStorage
      ↓
UI refresh / event dispatch
```

## Future production architecture

```txt
React frontend
      ↓
API layer
      ↓
Authentication and authorization
      ↓
Database and document storage
      ↓
External integrations
      ↓
Observability, logs and monitoring
```

## Recommended evolution

- Add backend API
- Add authentication and role-based access control
- Replace local storage with persistent database
- Add document storage strategy
- Add external process-data integrations
- Add test coverage
- Add CI/CD deployment checks
- Add structured logs, audit trail and monitoring

## Security considerations

The current local layer is suitable for development and demonstration. A production version must protect process data, documents, access credentials and audit records with proper backend security controls.
