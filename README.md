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

## 🛠️ How to Add New Products

You can add new products in two convenient ways:

### Method 1: Via the Showcase Manager (UI)
1. Go to **[http://localhost:3000/#/seller](http://localhost:3000/#/seller)**.
2. Click **+ Add New Custom Product**.
3. Fill in:
   - **Product Name**
   - **Category** (select from the 6 custom categories)
   - **Price** & **Original MRP**
   - **Rating** (from `0.1` to `5.0`)
   - **Image Path or URL** (e.g. `products/product-002/image-1.jpg`)
   - Optional **Video Path / URL** (e.g. `products/product-002/video.mp4`)
   - Optional **Song / Audio Path / URL** (e.g. `products/product-002/song.mp3`)
   - **Description**
   - **Feature on Hero Showcase** (checkbox)
4. Click **Add to Showcase** — it is immediately live across the entire website!

### Method 2: In Code (`js/data/products.js`)
Add a new object to the `PRODUCTS` array in [`js/data/products.js`](file:///c:/Users/SOHAM%20DUTTA/Desktop/New%20folder/web%20project%201/js/data/products.js):

```javascript
{
  id: "product-002",
  name: "Your Product Name",
  category: "পাগল", // Choose from the 6 custom categories
  price: 999,
  originalPrice: 1499,
  discount: 33,
  images: [
    "products/product-002/image-1.jpg",
    "products/product-002/image-2.jpg"
  ],
  thumbnail: "products/product-002/thumbnail.jpg",
  video: "products/product-002/video.mp4", // optional
  audio: "products/product-002/song.mp3",  // optional
  shortDescription: "Short tagline",
  description: "Full description...",
  rating: 4.8,
  reviewCount: null, // No fake reviews
  highlights: ["Feature 1", "Feature 2"],
  specifications: { "Spec": "Value" },
  availability: true,
  featured: true,
  badge: "NEW"
}
```

---

## 🚀 Running the Project

The server is currently running:
```bash
python -m http.server 3000
```
Visit: **[http://localhost:3000/](http://localhost:3000/)**
