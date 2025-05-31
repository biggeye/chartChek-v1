# chartChek: AI-Powered Compliance Assistant for Behavioral Health Facilities  
**v0.75b**

Welcome to **chartChek**, an advanced compliance assistant designed to streamline regulatory compliance for mental health and substance-abuse recovery centers. Built with **Next.js 15** and **OpenAI's Assistants API**, chartChek provides instant, accurate, and actionable insights tailored to each facility's unique requirements.

---

## 🧱 Tech Stack

- **Frontend:** Next.js 15 with App Router  
- **Authentication:** Supabase Auth  
- **Database:** Supabase PostgreSQL  
- **State Management:** Zustand  
- **AI:** OpenAI, Google, Anthropic
- **Deployment:** Vercel  

---

## 🎯 Purpose

The primary goal of this project is to serve as a **Joint Commission/DHCS compliance assistant**, equipping behavioral health facilities with an intelligent chatbot to assist in:

- Navigating regulatory standards  
- Tracking compliance  
- Managing documentation  

Each instance of chartChek can be customized with facility-specific information.

---

## ✨ Key Features  (SOME UPCOMING MILESTONES)

### 🧠 AI-Powered Assistance
- Vendor-agnostic
- conversation management
- support for one-shot context and multiple knowledge bases

### 📁 Document Management
- Processes and stores facility documents securely  
- Enables document search and citation in conversations  
- Supports multiple file formats including PDFs  

### 📚 Regulatory Knowledge Base
- Actively maintained knowledge base with Joint Commission and DHCS standards  
- Context-aware responses using vector similarity search  
- File citations to track information sources  

### 👥 Multi-User Support
- Secure authentication and authorization  
- Facility-specific customization  
- Isolated data storage per facility  

### 🔄 Real-time Updates
- Message streaming & tool status  
- Progress tracking for document processing  
- Instant response notifications  

---

## 🏗 Architecture Overview

### 🔌 KIPU EMR Integration

#### Core Components

**Authentication Layer** (`/lib/kipu/auth/`)
- HMAC SHA-1 signature-based authentication  
- User-centric credential model (not facility-specific)  
- Credentials stored securely in Supabase  

**Service Layer** (`/lib/kipu/service/`)
- `patient-service.ts`: Patient data operations  
- `facility-service.ts`: Facility/location management  
- Implements caching strategies for API responses  

**Internal API Routes** (`/app/api/kipu/`)
- RESTful endpoints that abstract KIPU API complexity  
- Handle authentication, error handling, and response formatting  
- Serve as intermediaries between frontend and KIPU EMR  

**Data Flow**  
`Frontend Components → Zustand Stores → Internal API → Service Layer → KIPU API`

---

## 🧠 State Management

**Zustand Stores** (`/store/`)
- `facilityStore.ts`: Manages facilities/locations data and selection  
- `patientStore.ts`: Handles patient records, evaluations, and vital signs  
- Implements multi-level caching with **React Query** and **Redis**  

---

## 📓 Terminology Mapping

| Our App Term | KIPU API Term |
|--------------|---------------|
| `facility`   | `location`    |

_Both systems use "buildings" consistently._

---

## 🤖 OpenAI Assistants Integration

- Utilizes Assistants API for maintaining conversation context  
- Implements thread management for persistent conversations  
- Supports file attachments and tool calls  

**Two Access Methods:**
- **Client-side:** `OpenAIProvider` React context with `useOpenAI` hook  
- **Server-side:** `getOpenAIClient` utility function  

---

## 🏛 Architectural Patterns

### 🔗 Source of Truth Hierarchy
1. **Supabase Table Schema** – Direct database representation  
2. **Type Definitions** – `/types/store/index.ts → /types/database/index.ts`  
3. **Zustand State Store** – `/store/clientStore.ts` for client-side state  

---
