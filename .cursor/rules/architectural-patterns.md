# Architectural Patterns and Data Flow

## Core Architecture

The application follows a strict unidirectional data flow pattern with clear separation of concerns:

```
Frontend Components (A) → Hooks (B) → Client Services (D) → API Routes (E) → Server Services (F)
Frontend Components (A) → Stores (C) → Client Services (D) → API Routes (E) → Server Services (F)
```

### Directory Structure and Responsibilities

1. **Frontend Components (`@/components`)**
   - React components and pages
   - Should only interact with hooks and stores
   - No direct service calls

2. **Hooks (`@/hooks`)**
   - Custom React hooks for component logic
   - Must use client-side services for data operations
   - No direct API calls

3. **Stores (`@/store`)**
   - State management (e.g., Zustand stores)
   - Must use client-side services for data operations
   - No direct API calls

4. **Client Services (`@/lib/services`)**
   - Client-side service layer
   - Handles API communication
   - Transforms data between frontend and API formats

5. **API Routes (`@/app/api`)**
   - Next.js API routes
   - Entry point for server-side operations
   - Routes requests to appropriate server services

6. **Server Services**
   - `@/lib/kipu/service`: KIPU API integration services
   - `@/lib/server`: General server-side utilities and functions

## Data Transformation

### Type Definitions
- All shared types should be defined in `@/types`
- Transformation types in `@/lib/transformations/monitoring/types.ts`

### KIPU Data Conventions
1. **Case Conversion**
   - All KIPU API responses must be converted from snake_case to camelCase
   - Use `snakeToCamel` utility from `@/utils/case-converters.ts`
   - Apply conversion at the API route level before data crosses to client

2. **Terminology Mapping**
   - KIPU "locations" → Our "facilities"
   - KIPU "evaluation" → Our "patient evaluation template"
   - KIPU "patient evaluation" → Our "instantiation of a patient evaluation template"

3. **Transformation Rules**
   - All transformations must be documented in the service layer
   - Maintain consistent terminology across the application
   - Document any special cases or exceptions to standard mappings

### Data Flow Rules
1. Frontend components must never directly access services
2. All data transformations should be handled in the service layer
3. KIPU API interactions must go through `@/lib/kipu/service`
4. Server-side utilities should be in `@/lib/server`

## Import Paths
Use the following import aliases:
- `@hooks` for hooks directory
- `@store` for store directory
- `@services` for client-side services
- `@types` for type definitions

## Violations
Any violation of these patterns should be caught during code review. Common violations include:
- Direct API calls from components
- Bypassing the service layer
- Mixing client and server code
- Incorrect import paths 