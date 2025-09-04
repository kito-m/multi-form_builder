# Multi-Form Builder

A full-stack web application for creating custom forms with optional AI assistance. Admins can build forms through an intuitive interface or by using natural language prompts, then share public URLs to collect submissions.

## Tech Stack

- **Next.js 15** with TypeScript and Tailwind CSS
- **Prisma ORM** with SQLite database
- **Cookie-based authentication**
- **OpenAI API** for AI form generation (optional)

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone and install**
   ```bash
   git clone https://github.com/kito-m/multi-form_builder
   cd multi-form_builder
   npm install
   ```

2. **Environment setup**
   
   Add the following environment variable to `.env`:
   ```
   DATABASE_URL="file:./dev.db"
   OPENAI_API_KEY="your-key-here"  # Optional for AI features
   ```

4. **Database setup**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access application**
   - Open http://localhost:3000
   - Login: `admin` / `password123`

## Usage

- **Admin Dashboard**: Create and manage forms (max 2 sections, 3 fields each)
- **AI Generation**: Describe your form in plain text to auto-generate structure
- **Public Forms**: Share unique URLs (`/form/[id]`) to collect submissions
- **Form Types**: Support for text and number fields with validation

## Key Features

- Secure admin authentication with session management
- Real-time form builder with drag-and-drop interface
- AI-powered form generation using OpenAI
- Responsive public form display
- Client-side validation and error handling
- UUID-based form identification


## To-Do
- Decouple Submission Data: Prevent submission data from being deleted when a corresponding field on a form is deleted.
- Admin Dashboard Links: Make the admin dashboard links easily copiable for sharing.
- View Submissions: Implement a feature to view individual form submissions.
- Loading Animations: Add loading animations to improve the user experience during page transitions.
