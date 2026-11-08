# Hatey Hat (হাতে হাত) 🤝

> **"Hate hat, ekshathe poth chola."**  
> A modern, community-driven social service and grassroots initiative management platform designed to connect neighbours across Dhaka, Bangladesh to organize, join, and track local relief drives.

[![Next.js](https://img.shields.io/badge/Next.js-16%20(Turbopack)-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Better Auth](https://img.shields.io/badge/Better%20Auth-MongoDB%20%2B%20JWT-ff6b6b?style=flat-square)](https://better-auth.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel&logoColor=white)](https://hatey-hat.vercel.app)

**Live Production Web App:** [https://hatey-hat.vercel.app](https://hatey-hat.vercel.app)  

---

## Key Features & Highlights

### 1. Hyper-Local Grassroots Discovery
- Explore vetted social relief initiatives across neighbourhoods in Dhaka (Winter Clothes Drive in Mirpur 10, Blanket Distribution in Mohammadpur, Lake Cleanups at Dhanmondi Lake, Riverbank Cleanups in Uttara, Blood Donation in Badda, and Street Food Distribution in Old Dhaka).
- Real-time search by keywords, landmarks, or titles with instant keyboard-navigable autocomplete suggestions.

### 2. Numbered Interactive Pagination (9 Items / Page)
- When initiatives exceed 9, a responsive, Apple squircle pagination controller appears with `<` and `>` arrow navigation.
- Smoothly animates and scrolls back to the top of the grid on page change.
- Categorical and search filters automatically reset pagination state.

### 3. Apple-Style Frosted Liquid Glass Floating Navbar
- Floating pill navbar with dynamic scroll detection (`glass-strong` background with depth).
- Absolute center lock prevents layout shift or element movement during session hydration.
- Live Dynamic Island-style notification toast floating right beside the navbar with single-line wrapping protection.
- Stays persistent and sticky across all scroll depths via modern `overflow-x: clip`.

### 4. 2K & 4K Resolution Image Engine
- Built-in URL transformer automatically upgrades event thumbnails to ultra-high definition (2K/4K) across popular hosting providers (Unsplash, Pexels, Cloudinary, Google User Content, Wikimedia, Imgur, WordPress).
- Eliminates low-resolution blurring on high-DPI Retina screens.
- Aspect ratio of `16:10` with `object-top` framing ensures portrait photos and volunteer faces are never cropped off.

### 5. Scheduling Conflict Protection
- Client and server enforce scheduling safety: prevents creating duplicate events for the same category (`eventType`) and location on the same day.
- Clean toast alerts inform organizers of conflicting initiatives before submission.

### 6. Robust Authentication & Social Login
- Powered by Better Auth with MongoDB adapter, issuing cryptographically verified JWT tokens.
- Supports email/password authentication (with client-side strength meter) and Google Social Login.
- Private routes are shielded by intelligent loading skeletons that prevent session flickering on page reload.

### 7. Organizer & Volunteer Dashboards
- **Manage Events:** Organizers can update or delete initiatives with custom accessible modal confirmation dialogs (zero native `confirm()` alerts).
- **Joined Events:** Volunteers can review all initiatives they have signed up for and cancel participation with one click.
- **Profile Customization:** Real-time updates for display name and avatar photo.

### 8. Accessible & Responsive UI
- Fully responsive across mobile, tablet, laptop, and ultra-wide desktop monitors.
- Smooth dark and light mode toggle with ambient grayscale mesh gradient backgrounds that eliminate harsh contrast.

---

## Tech Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) 16 (App Router + Turbopack) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) 5.x |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) v4 + [shadcn/ui](https://ui.shadcn.com/) |
| **Authentication** | [Better Auth](https://better-auth.com/) (MongoDB Adapter + JWT + Google OAuth) |
| **Forms & Validation** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **Notifications** | [react-hot-toast](https://react-hot-toast.com/) (Frosted Liquid Glass styled) |
| **Icons** | [lucide-react](https://lucide.dev/) |
| **Theming** | [next-themes](https://github.com/pacocoursey/next-themes) |

---


## License

This project is licensed under the [MIT License](LICENSE).
