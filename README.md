# Hatey Hat (হাতে হাত)

> **"Hate hat, ekshathe poth chola."**  
> A community-driven social service and grassroots event management platform empowering neighbours to organize, join, and track local relief initiatives in Dhaka.

**Live Site URL:** [https://hatey-hat.vercel.app](https://hatey-hat.vercel.app)  
**Backend API URL:** [https://hatey-hat-api.vercel.app](https://hatey-hat-api.vercel.app)

---

## Key Features

- **Hyper-Local Social Event Discovery:** Explore verified community welfare events across Dhaka (e.g. Winter Clothes Distribution in Mirpur 10, Blanket Distribution in Mohammadpur, Tree Plantation at Dhanmondi Lake, and Turag Riverbank Cleanups in Uttara).
- **Dynamic Search & Server-Side Filtering:** Filter upcoming events in real-time by category (Donation, Cleanup, Plantation, Food Distribution, Blood Donation, Education, Health Camp, Other) and search across titles and landmarks with state persisted in URL query parameters.
- **One-Click Event Joining with Duplicate Protection:** Logged-in community members can join any upcoming social initiative instantly with duplicate participation prevented and verified on MongoDB unique indexes.
- **Strict Organizer Ownership & Modal Confirmations:** Organizers can manage, update, and delete their own initiatives. Deletions use accessible `AlertDialog` confirmation modals (zero native `confirm()` or `alert()`) and enforce server-side 403 access control.
- **Future-Date Validation on Client & Server:** Events are strictly enforced to take place in the future via HTML5 datetime min boundaries, Zod schema refinement, and server-side query filters excluding past events.
- **Robust Authentication & Session Persistence:** Powered by Better Auth with MongoDB adapter and JWT issuance. Private routes feature intelligent loading skeletons that prevent session bounce or flash on page reload.
- **Adaptive Light/Dark Theming:** Fully tuned warm palette (deep community green `#1F6F54`, warm amber `#F2A93B`, cream `#FBF6EC`, and high-contrast dark mode) persisted across sessions with zero flash on initial load.
- **Comprehensive Volunteer Profile:** Volunteers can view and update their public display name and avatar image in real time via Better Auth's user management.

---

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) 16 (App Router) + TypeScript
- **Styling & UI:** [Tailwind CSS](https://tailwindcss.com/) v4 + [shadcn/ui](https://ui.shadcn.com/)
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) + `@hookform/resolvers`
- **Authentication:** [Better Auth](https://better-auth.com/) (MongoDB Adapter + JWT Plugin + Google Social Login)
- **Notifications:** [react-hot-toast](https://react-hot-toast.com/) (styled to match light/dark theme)
- **Theme:** [next-themes](https://github.com/pacocoursey/next-themes)
- **Icons:** [lucide-react](https://lucide.dev/) + custom vector social icons (including the new X logo)

---

## Project Structure

```
client/
├── src/
│   ├── app/
│   │   ├── api/auth/[...all]/route.ts  # Better Auth route handler
│   │   ├── events/
│   │   │   ├── page.tsx                # Upcoming events (search + type filters)
│   │   │   ├── create/page.tsx         # Create event (protected)
│   │   │   ├── joined/page.tsx         # Joined events (protected)
│   │   │   ├── manage/page.tsx         # Organizer manage panel (protected)
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Event details + Join button
│   │   │       └── edit/page.tsx       # Edit event (protected, owner only)
│   │   ├── login/page.tsx              # Email/password + Google auth
│   │   ├── register/page.tsx           # Registration with password rule indicators
│   │   ├── profile/page.tsx            # Profile management (protected)
│   │   ├── error.tsx                   # Client error boundary
│   │   ├── not-found.tsx               # Custom 404 page
│   │   ├── loading.tsx                 # Global suspense fallback
│   │   ├── globals.css                 # Theme variables & custom variant definitions
│   │   └── layout.tsx                  # Root layout with fonts, ThemeProvider & Toaster
│   ├── components/
│   │   ├── auth/private-route.tsx      # Skeleton-based route guard
│   │   ├── events/                     # EventCard, EventGrid, EventForm, Skeletons
│   │   ├── icons/                      # GoogleIcon, XIcon, SocialIcons
│   │   ├── ui/                         # shadcn/ui components
│   │   ├── brand-logo.tsx              # Reusable consistent brand logo
│   │   ├── navbar.tsx                  # Responsive navigation with mobile drawer
│   │   ├── footer.tsx                  # Eye-catching footer with X icon
│   │   └── theme-toggle.tsx            # Light/dark mode toggle
│   └── lib/
│       ├── api.ts                      # Express API client with JWT bearer auth
│       ├── auth.ts                     # Better Auth server configuration
│       ├── auth-client.ts              # Better Auth client hooks (useSession, signIn, etc.)
│       └── utils.ts                    # Class merging and date formatting utilities
```

---

## Environment Variables Setup

Create a `.env.local` file inside the `client/` directory based on `.env.example`:

```bash
# Base URL of this Next.js app
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Better Auth Secret (generate with `openssl rand -base64 32`)
BETTER_AUTH_SECRET=your_32_character_minimum_random_secret

# MongoDB Database URI (shares the same database as the Express server)
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=hatey-hat

# Google OAuth Credentials (Google Cloud Console -> APIs & Services -> Credentials)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# Express REST API Base URL (no trailing slash)
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run type checking
npm run typecheck # or npx tsc --noEmit

# Run production build
npm run build

# Run linting
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
