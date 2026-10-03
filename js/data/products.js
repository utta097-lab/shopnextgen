/**
 * SHOPNEX Custom Product Database
 * Data-Driven Product Showcase
 * 
 * To add or update products:
 * Use the exact NAME and CATEGORY provided by the user.
 * Media files are organized under:
 * /products/
 *   /product-name/
 *     image
 *     video
 *     song
 */

export const PRODUCTS = [
  {
    id: "product-001",
    name: "Laden",
    category: "WOH ALAG HI LEVEL KA BANDA THA",
    price: 0.50000,
    originalPrice: 1.00000,
    discount: 50,
    image: "products/product-001/thumbnail.jpg",
    images: [
      "products/product-001/image-1.jpg",
      "products/product-001/image-2.jpg",
      "products/product-001/image-3.jpg",
      "products/product-001/image-4.jpg"
    ],
    thumbnail: "products/product-001/thumbnail.jpg",
    video: null,
    audio: null,
    shortDescription: "Neophile — धर्मो रक्षति रक्षितः ॐ ॐ",
    description: "Neophile\n\nধর্মो रक्षति रक्षितः ॐ ॐ",
    rating: 0.1,
    reviewCount: null,
    highlights: [
      "Authentic original showcase item",
      "Neophile — धर्मो रक्षति रक्षितः ॐ ॐ",
      "Exclusive category: WOH ALAG HI LEVEL KA BANDA THA"
    ],
    specifications: {
      "Category": "WOH ALAG HI LEVEL KA BANDA THA",
      "Status": "Verified Original Showcase",
      "Origin": "Custom Product Showcase"
    },
    availability: true,
    featured: true,
    badge: "FEATURED"
  },
  {
    id: "product-002",
    name: "Malay",
    category: "পাগল",
    price: null,
    originalPrice: null,
    discount: null,
    image: "products/malay/thumbnail.jpg",
    images: [
      "products/malay/image-1.jpg",
      "products/malay/image-2.jpg"
    ],
    thumbnail: "products/malay/thumbnail.jpg",
    video: null,
    audio: null,
    shortDescription: "...Historically and in formal clinical contexts, it refers to an insane or severely mentally disturbed man. Today, this usage is often considered old-fashioned and derogatory.Reckless Behavior: It describes someone who takes dangerous, wild, or uncontrolled risks (e.g., \"driving like a madman\").Intensity: It is used as an idiom to describe intense effort or action",
    description: "...Historically and in formal clinical contexts, it refers to an insane or severely mentally disturbed man. Today, this usage is often considered old-fashioned and derogatory.Reckless Behavior: It describes someone who takes dangerous, wild, or uncontrolled risks (e.g., \"driving like a madman\").Intensity: It is used as an idiom to describe intense effort or action",
    rating: 2,
    reviewCount: null,
    highlights: [],
    specifications: {
      "Category": "পাগল",
      "Status": "Verified Original Showcase"
    },
    availability: true,
    featured: false,
    badge: "পাগল"
  },
  {
    id: "product-003",
    name: "Supe",
    category: "ভদ্র ছেলে",
    price: null,
    originalPrice: null,
    discount: null,
    image: "products/supe/thumbnail.jpg",
    images: [
      "products/supe/image-1.jpg",
      "products/supe/image-2.jpg"
    ],
    thumbnail: "products/supe/thumbnail.jpg",
    video: null,
    audio: null,
    shortDescription: "...a qualified professional who practices medicine to diagnose, treat, and prevent illnesses and injuries, or an individual who holds the highest academic university degree.",
    description: "...a qualified professional who practices medicine to diagnose, treat, and prevent illnesses and injuries, or an individual who holds the highest academic university degree. \nMeanings and Uses\nMedical Professional: A physician, surgeon, dentist, or veterinarian who treats patients. \nAcademic Title: A person who has earned a doctoral degree, such as a PhD. \nVerb Usage: To give medical treatment, repair something, or alter/tamper with a document or substance.",
    rating: 0.1,
    reviewCount: null,
    highlights: [],
    specifications: {
      "Category": "ভদ্র ছেলে",
      "Status": "Verified Original Showcase"
    },
    availability: true,
    featured: false,
    badge: "ভদ্র ছেলে"
  },
  {
    id: "product-004",
    name: "Mosa",
    category: "বিশেষ জন্তু জানোয়ার",
    price: null,
    originalPrice: null,
    discount: null,
    image: "",
    images: [],
    thumbnail: "",
    video: null,
    audio: null,
    shortDescription: "...",
    description: "...",
    rating: 4.9,
    reviewCount: null,
    highlights: [],
    specifications: {
      "Category": "বিশেষ জন্তু জানোয়ার",
      "Status": "Verified Original Showcase"
    },
    availability: true,
    featured: false,
    badge: "বিশেষ জন্তু জানোয়ার"
  },
  {
    id: "product-005",
    name: "Dip",
    category: "FESTIVAL DHAMAKA",
    price: null,
    originalPrice: null,
    discount: null,
    image: "products/dip/thumbnail.jpg",
    images: [
      "products/dip/image-1.jpg",
      "products/dip/image-2.jpg"
    ],
    thumbnail: "products/dip/thumbnail.jpg",
    video: null,
    audio: null,
    shortDescription: "Festival Dhamaka Special",
    description: "Festival Dhamaka Special",
    rating: 5,
    reviewCount: null,
    highlights: [
      "FESTIVAL DHAMAKA Exclusive",
      "5.0 Top Rating"
    ],
    specifications: {
      "Category": "FESTIVAL DHAMAKA",
      "Status": "Verified Original Showcase"
    },
    availability: true,
    featured: false,
    badge: "FESTIVAL DHAMAKA"
  }
];

export const BRANDS = [];
