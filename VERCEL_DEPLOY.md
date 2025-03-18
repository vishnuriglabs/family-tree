# Deploying to Vercel

This guide will help you deploy your Family Tree application to Vercel.

## Prerequisites

- A [Vercel](https://vercel.com) account
- Git repository (GitHub, GitLab, or Bitbucket)
- Node.js 18 or higher

## Option 1: Deploying with Vercel Dashboard

1. Push your code to a Git repository
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New..." > "Project"
4. Import your Git repository
5. Configure your project settings:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
   - Root directory: `/` (default)
6. Configure environment variables (from `.env.example`):
   - VITE_APP_ENV: `production`
   - VITE_ENABLE_AUTH: `true`
   - VITE_API_URL: Add your API URL if needed
7. Click "Deploy"

## Option 2: Deploying with Vercel CLI

1. Install Vercel CLI globally:

   ```
   npm install -g vercel
   ```

2. Navigate to your project directory:

   ```
   cd your-project-directory
   ```

3. Run the deployment command:

   ```
   npm run vercel-deploy
   ```

   Or directly use the Vercel CLI:

   ```
   vercel
   ```

4. Follow the prompts to configure your project:

   - Set up and deploy: Yes
   - Existing project: Select your project (or create a new one)
   - Directory: `.` (current directory)
   - Override settings: No (or Yes if you want to change settings)

5. For production deployment:
   ```
   vercel --prod
   ```

## Troubleshooting

If you encounter any issues during deployment:

1. Check that your build is working locally:

   ```
   npm run build
   ```

2. Make sure all dependencies are properly installed:

   ```
   npm install
   ```

3. Verify your Vercel configuration in `vercel.json`

4. Check Vercel deployment logs for specific errors

5. Try removing the local `.vercel` directory if it exists:
   ```
   rm -rf .vercel
   ```

## CI/CD with GitHub Actions

The project includes a GitHub Actions workflow in `.github/workflows/deploy.yml` for continuous deployment to Vercel.

To use this workflow, you need to add the following secrets to your GitHub repository:

- VERCEL_TOKEN: Your Vercel API token
- VERCEL_ORG_ID: Your Vercel organization ID
- VERCEL_PROJECT_ID: Your Vercel project ID

You can find these values by running:

```
vercel whoami
vercel projects ls
```
