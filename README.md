# The Drop 💧 - Next.js Version

This is the scalable, Next.js 14 version of "The Drop" (Anonymous College Confessions).

## Getting Started

Since Node.js was not available in the generation environment, you must run this on your local machine.

1.  **Install Dependencies**:
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

- `src/app/page.tsx`: Main entry point (Home Feed).
- `src/components/`: Reusable React components (Navbar, Feed, Cards).
- `src/app/globals.css`: Tailwind directives + Glassmorphism utilities.
- `src/lib/utils.ts`: Helper functions (formatting, classnames).

## Features Ported

- ✅ **Glassmorphism UI**: High-fidelity dark mode design.
- ✅ **Responsive**: Mobile Dock <-> Desktop Sidebar adaptivity.
- ✅ **Voting System**: Interactive One-Vote-Per-Person logic.
- ✅ **Persistence**: Uses `localStorage` (Client Side) for demo purposes.
- ✅ **Posting**: "Drop a Confession" modal with character limits.
