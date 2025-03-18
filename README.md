# Family Tree Application

A modern web application for managing and visualizing family trees.

## Features

- Multi-step signup form with validation
- User dashboard with family tree visualization
- Dark mode support
- Responsive design

## Technologies Used

- React 18
- TypeScript
- Tailwind CSS
- Framer Motion for animations
- React Router for navigation
- React Hook Form for form management
- Zod for validation
- Vite for build tooling

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

## Deployment to Vercel

### Method 1: Using Vercel CLI

1. Install Vercel CLI globally:

   ```
   npm install -g vercel
   ```

2. Login to Vercel:

   ```
   vercel login
   ```

3. Deploy the project:

   ```
   vercel
   ```

4. For production deployment:
   ```
   vercel --prod
   ```

### Method 2: Using Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Import your project in the Vercel dashboard:

   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your Git repository
   - Configure project settings if needed
   - Click "Deploy"

3. Vercel will automatically detect your Vite project and apply the appropriate build settings

### Environment Variables

The following environment variables can be configured in Vercel project settings:

- `VITE_API_URL`: The URL of your backend API (if applicable)
- `VITE_APP_ENV`: Environment (development, production)
- `VITE_ENABLE_AUTH`: Enable authentication features

## Project Structure

- `src/components/`: React components
- `src/types/`: TypeScript type definitions
- `public/`: Static assets

## License

MIT
