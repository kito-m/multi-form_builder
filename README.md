# Multi-Form Builder

A full-stack web application that allows admins to create custom forms with optional AI assistance, and provides public URLs for form submissions.

## Features

### Admin Features
- Secure login with hardcoded credentials (`admin` / `password123`)
- Create custom forms with up to 2 sections
- Add up to 3 fields per section (text or number types)
- Optional AI-powered form generation using OpenAI
- View all created forms with public URLs
- Real-time form building interface

### Public Features
- Access forms via unique public URLs (`/form/[id]`)
- Responsive form display matching admin design
- Client-side validation for required fields
- Success confirmation after submission

### AI Integration (Optional)
- Generate form structure from natural language prompts
- Uses OpenAI's Chat Completions API
- Automatically creates relevant sections and fields
- Respects form constraints (max 2 sections, 3 fields each)

## Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Prisma ORM
- **Database**: SQLite
- **AI**: OpenAI API (optional)

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd multi-form_builder
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
# .env file already contains:
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="your-openai-api-key-here"  # Optional, for AI features
```

4. Set up the database
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

### Default Login
- **Username**: `admin`
- **Password**: `password123`

## Project Structure

```
app/
├── admin/                 # Admin dashboard and form builder
│   ├── page.tsx          # Admin dashboard
│   └── create/           # Form builder interface
├── form/[id]/            # Public form views
├── api/                  # API routes
│   ├── forms/            # Form CRUD operations
│   └── generate/         # AI form generation
├── lib/                  # Shared utilities
└── generated/prisma/     # Generated Prisma client
```

## API Endpoints

- `GET /api/forms` - List all forms
- `POST /api/forms` - Create a new form
- `GET /api/forms/[id]` - Get form details
- `POST /api/forms/[id]/submit` - Submit form response
- `POST /api/generate` - AI form generation

## Database Schema

The application uses Prisma with the following models:
- **Form**: Main form entity
- **Section**: Form sections (max 2 per form)
- **Field**: Form fields (max 3 per section)
- **Submission**: Form submission records
- **Response**: Individual field responses

## Usage

### Creating Forms

1. Log in with admin credentials
2. Click "Create New Form"
3. Add form title and description
4. Add sections and fields manually, or use AI generation
5. Save the form to get a public URL

### AI Form Generation

1. Enter a descriptive prompt (e.g., "A job application form")
2. Click "Generate with AI"
3. Review and modify the generated structure
4. Save the form

### Accessing Forms

Forms are accessible via unique URLs: `/form/[form-id]`

## Development Notes

- The application includes proper error handling and validation
- All forms have unique public URLs using Prisma's `cuid()` function
- SQLite database persists form data locally
- OpenAI integration is optional and gracefully handles failures

## What's Next?

If more time were available, these features could be added:
- Form analytics and submission tracking
- More field types (email, phone, date, etc.)
- File upload support
- Form templates
- User management system
- Export submissions to CSV
- Form themes and styling options
- Drag-and-drop form builder interface

## Time Investment

This implementation took approximately 2-3 hours, focusing on core functionality and a clean, working solution.
