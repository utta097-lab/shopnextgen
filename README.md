# SHOPNEX — Custom Product Showcase & Marketplace

**SHOPNEX** is a custom product showcase and e-commerce marketplace built around user-provided products, authentic media (images, videos, audio/songs), exact ratings, and custom-designated categories.

---

## 📂 Designated Custom Categories

The platform strictly uses ONLY the following 6 custom categories:

1. **FESTIVAL DHAMAKA** (Alias: *FESTIVAL OFFER*)
2. **পাগল**
3. **ভদ্র ছেলে**
4. **অভদ্র ছেলে**
5. **বিশেষ জন্তু জানোয়ার**
6. **WOH ALAG HI LEVEL KA BANDA THA**

---

## 📦 Active Products

### Product 01: **Laden**
- **Category**: `WOH ALAG HI LEVEL KA BANDA THA`
- **Price**: `₹0.50000`
- **Rating**: `0.1 ★`
- **Description**:
  ```text
  Neophile

  धर्मो रक्षति रक्षितः ॐ ॐ
  ```
- **Images**:
  - Main / Thumbnail: `/products/product-001/thumbnail.jpg`
  - Image 1: `/products/product-001/image-1.jpg`
  - Image 2: `/products/product-001/image-2.jpg`
  - Image 3: `/products/product-001/image-3.jpg`
- **Features**: Lightbox fullscreen viewer, zoom, Wishlist, Cart, and Checkout.

### Product 02: **Malay**
- **Category**: `পাগল`
- **Rating**: `2 ★`
- **Images**: `/products/malay/thumbnail.jpg`, `/products/malay/image-1.jpg`, `/products/malay/image-2.jpg`

### Product 03: **Supe**
- **Category**: `ভদ্র ছেলে`
- **Rating**: `0.1 ★`
- **Images**: `/products/supe/thumbnail.jpg`, `/products/supe/image-1.jpg`, `/products/supe/image-2.jpg`

### Product 04: **Mosa**
- **Category**: `বিশেষ জন্তু জানোয়ার`
- **Rating**: `4.9 ★`

### Product 05: **Dip**
- **Category**: `FESTIVAL DHAMAKA`
- **Rating**: `5 ★`
- **Images**: `/products/dip/thumbnail.jpg`, `/products/dip/image-1.jpg`, `/products/dip/image-2.jpg`

### Product 06: **kundan**
- **Category**: `ভদ্র ছেলে`
- **Price**: `₹150`
- **Rating**: `4 ★`
- **Description**: A famous and charismatic musician who plays rock-and-roll music.
- **Images**: `/products/kundan/thumbnail.jpg`, `/products/kundan/image-1.jpg`

### Product 07: **Adam**
- **Category**: `WOH ALAG HI LEVEL KA BANDA THA`
- **Price**: `₹1,50,000`
- **Rating**: `100 ★`
- **Description**: Prominent media figure, author, Australian comedian, and maths geek.
- **Images**: `/products/adam/thumbnail.jpg`, `/products/adam/image-1.jpg`

### Product 08: **Purnandu**
- **Category**: `FESTIVAL DHAMAKA`
- **Price**: `₹500`
- **Rating**: `5 ★`
- **Description**: Profoundly gifted with rapid comprehension and intense curiosity.
- **Images**: `/products/purnandu/thumbnail.jpg`, `/products/purnandu/image-1.jpg`

---

## 🔒 Real Admin Product Editor & Shared Central Music System

SHOPNEX includes a protected **Admin Product Editor** and **Central Shared Music System** powered by Supabase.

### 🌟 Key Architecture
- **Route**: `/#/admin` or `/#/admin/products`
- **Shared Online Audio Storage**: Uploaded product music files are stored in Supabase Storage (`product-music` bucket) and shared across all visitors via public CDN URLs (`product.musicUrl`).
- **No Local-Only State**: Music is **not** stored in client-only localStorage or IndexedDB. When an admin assigns a song to a product, **every visitor** who views that product gets the same music.
- **Unobtrusive Floating Music Control**: On the Product Details Page, an unobtrusive floating glassmorphic pill allows visitors to toggle Play/Pause and Mute/Unmute.
- **Clean Audio Lifecycle & Loop**: Songs loop continuously while on the product page and immediately stop when navigating away or switching to another product.

---

### 🔒 Hardened Security & Permission Model

SHOPNEX enforces a strict database-level security model:
- **Public / Normal Visitors**:
  - `SELECT` permission on `public.products` (can view all products and read `music_url`).
  - Public read access on `storage.objects` for bucket `'product-music'` (can stream and listen to assigned music).
  - Strictly blocked by database RLS from creating, editing, or deleting products.
  - Strictly blocked from uploading, replacing, or deleting audio files in Supabase Storage.
- **SHOPNEX Admins**:
  - Full `INSERT`, `UPDATE`, and `DELETE` permissions on `public.products`.
  - Full `INSERT`, `UPDATE`, and `DELETE` permissions on `storage.objects` for `'product-music'`.
  - Authorized server-side via the dedicated `public.shopnex_admins` table and `public.is_admin()` Security Definer function.
  - Ordinary authenticated users who are not in `shopnex_admins` cannot modify products or music.

---

### 🛡️ How to Apply the Security Migration (Existing Supabase Project)

If your database is already set up and running, simply run [`supabase_security_migration.sql`](file:///c:/Users/SOHAM%20DUTTA/Desktop/New%20folder/web%20project%201/supabase_security_migration.sql) in your **Supabase SQL Editor**:
1. Open your project in [Supabase Dashboard](https://supabase.com).
2. Go to **SQL Editor** on the left menu.
3. Paste the contents of `supabase_security_migration.sql` and click **Run**.
4. This safely creates `public.shopnex_admins`, the `is_admin()` function, updates the RLS policies, and automatically registers your existing user in `auth.users` as an authorized admin without deleting any product data or music files!

---

### 🚀 How to Set Up Supabase (From Scratch)

1. Create a free account at [Supabase](https://supabase.com) and create a new project.
2. Open your project's **SQL Editor** (`/sql`).
3. Paste and run the entire contents of [`supabase_schema.sql`](file:///c:/Users/SOHAM%20DUTTA/Desktop/New%20folder/web%20project%201/supabase_schema.sql).
   - This creates `products` and `shopnex_admins` tables with Row Level Security (RLS).
   - Sets up `is_admin()` Security Definer authorization.
   - Creates the `product-music` Storage bucket with public read access.
   - Configures storage policies so only authorized SHOPNEX admins can upload/delete audio.
   - Automatically seeds the initial base products into the database.
4. Go to **Project Settings → API** in Supabase and copy:
   - **Project URL** (e.g. `https://your-project.supabase.co`)
   - **anon (public) key**
5. Enter them in the Admin Settings tab at `/#/admin/settings` or in [`js/config/supabaseConfig.js`](file:///c:/Users/SOHAM%20DUTTA/Desktop/New%20folder/web%20project%201/js/config/supabaseConfig.js).
6. Create your admin user under **Authentication → Users** in Supabase, and you can now log in securely at `/#/admin/login`!

---

### 🎵 Admin Music Upload Workflow
1. Go to `/#/admin/products` and sign in.
2. Click **✏️ Edit** or **🎵 Music** on any product (e.g. "kundan" or "Adam").
3. Click **[ 🎵 Upload Product Music ]**.
4. Select your audio file (`.mp3`, `.wav`, `.ogg`, or `.m4a`).
5. Watch the real-time progress bar upload the file to shared online storage.
6. Click **💾 Save Product Changes**.
7. The product now permanently possesses that shared song URL. Any visitor worldwide who visits that product page will automatically hear it!

---

## 🚀 Running the Project Locally

Run a simple local static server:
```bash
python -m http.server 3000
```
Open: **[http://localhost:3000/](http://localhost:3000/)**
Admin: **[http://localhost:3000/#/admin/products](http://localhost:3000/#/admin/products)**

