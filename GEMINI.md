# Gemini Project Context: Hubode Webapp

This document provides a comprehensive overview of the Hubode Webapp project to be used as a working context for AI-assisted development.

## 1. Project Overview

Hubode Webapp is a full-stack application built with Next.js. It serves as a platform for property management and rentals, featuring user authentication, property listings, a content management system (CMS), and backend services for business logic.

### Core Technologies

*   **Framework**: [Next.js](https://nextjs.org/) 15 (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Sass](https://sass-lang.com/), and [Styled Components](https://styled-components.com/) are used. Global Sass variables are available from `styles/_variables.scss`.
*   **CMS**: [Sanity.io](https://www.sanity.io/) is used for content management. The Sanity Studio is embedded directly in the application and accessible at the `/studio` route.
*   **Backend-as-a-Service (BaaS)**: [Appwrite](https://appwrite.io/) provides backend services, including user authentication (email/password + OTP, Google OAuth) and database storage.
*   **Payments**: [Razorpay](https://razorpay.com/) is integrated for handling payments.
*   **Process Manager**: [PM2](https://pm2.keymetrics.io/) is used in production to run the Next.js application.

### Architecture Highlights

*   The frontend is a modern React application built with the Next.js App Router.
*   Content (like blog posts, careers, FAQs, and properties) is managed via Sanity.
*   User data, authentication, and custom business logic (like rent reminders) are handled by Appwrite.
*   The application is configured to ignore TypeScript and ESLint errors during the production build (`next build`), which is an important consideration for troubleshooting deployment issues.

## 2. Building and Running

### Local Development

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at [http://localhost:3000](http://localhost:3000).

### Production

*   **Build:**
    ```bash
    npm run build
    ```
*   **Start:**
    ```bash
    npm run start
    ```
    In the production environment, the application is managed by `pm2` under the process name `hubode-frontend`.

### Linting

*   **Check for code quality issues:**
    ```bash
    npm run lint
    ```

## 3. Key Project Components

### Sanity CMS

*   **Schema**: The data models are defined in the `sanity/schemaTypes/` directory. Key models include:
    *   `property`: For property listings.
    *   `blogPost`: For articles and announcements.
    *   `career`: For job openings.
    *   `faq`: For the frequently asked questions section.
    *   `communityItem`: For community-related content.
    *   `contactFormSubmission`, `referralSubmission`: For user-submitted data.

### Appwrite Backend

*   **Authentication**: The core authentication logic is centralized in `context/AuthContext.tsx`. The flow uses a two-factor approach where a password login triggers an OTP email for verification.
*   **Cloud Functions**: A scheduled function, `sendRentReminders`, runs daily at 8:00 AM to handle rent notifications. The configuration is in `appwrite.json`.
*   **Collections**: Appwrite databases are used to store user profiles, tenancy information, reservations, and more, as indicated by the environment variables in the deployment workflow.

## 4. Deployment (CI/CD)

*   **Provider**: The application is deployed to a Virtual Private Server (VPS).
*   **Trigger**: A GitHub Action workflow, defined in `.github/workflows/deploy.yml`, automatically deploys the application on every `git push` to the `master` branch.
*   **Process**:
    1.  The workflow connects to the VPS via SSH.
    2.  It pulls the latest code from the `master` branch.
    3.  It securely creates the `.env.local` file from GitHub Secrets.
    4.  It installs dependencies, builds the project, and reloads the application using `pm2` for zero-downtime updates.
