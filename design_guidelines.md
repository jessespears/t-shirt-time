# T-Shirt Time Design Guidelines

## Design Approach: Reference-Based E-Commerce

**Primary References:** Shopify storefront aesthetics + Etsy's product-focused layouts + beach/surf culture casualness

**Design Personality:** Casual, fun, and approachable with a beach lifestyle vibe - think surf shops meets modern e-commerce. Clean and trustworthy enough for transactions, relaxed enough to match the New Jersey beach culture.

## Core Design Elements

### Typography System

**Font Families (Google Fonts):**
- Headings: "Poppins" (600, 700) - friendly, rounded, modern
- Body: "Inter" (400, 500) - clean readability for product details and checkout

**Hierarchy:**
- Hero/Page Titles: text-4xl to text-6xl, font-bold
- Section Headers: text-2xl to text-3xl, font-semibold  
- Product Names: text-lg to text-xl, font-semibold
- Prices: text-xl to text-2xl, font-bold (prominent)
- Body/Descriptions: text-base, font-normal
- Buttons/CTAs: text-sm to text-base, font-medium, uppercase tracking-wide

### Layout & Spacing System

**Tailwind Spacing Primitives:** Consistently use 4, 6, 8, 12, 16, 20, 24 for spacing
- Component padding: p-4 to p-8
- Section spacing: py-12 to py-20 (mobile to desktop)
- Card gaps: gap-6 to gap-8
- Element margins: m-4, m-6, m-8

**Container Strategy:**
- Max-width: max-w-7xl for main content areas
- Product grids: max-w-6xl
- Checkout forms: max-w-2xl (centered)

## Page-Specific Layouts

### Homepage/Storefront

**Hero Section (80vh):**
- Full-width background image showcasing beach lifestyle with t-shirt designs worn by beachgoers
- Centered overlaid content with blurred background on text/button areas
- Large headline + subheadline + primary CTA button
- Include trust indicator: "Designed by locals, loved by beach communities"

**Product Grid Section:**
- 1 column mobile, 2 columns tablet, 3-4 columns desktop
- Product cards with 4:5 aspect ratio images (vertical orientation for t-shirts)
- Hover state: subtle scale effect and show "Quick View" overlay
- Card content: Product image, name, price prominently displayed, available colors as small swatches

**Featured Collections:**
- Horizontal scrolling carousel on mobile
- 3-column grid on desktop showing curated collections
- Each collection card has image + title + item count

### Product Detail Page

**Two-column layout (desktop):**
- Left: Large product image gallery (main image + thumbnails below)
- Right: Product name, price, description, size selector (radio buttons), color selector (color swatches), quantity selector, Add to Cart CTA
- Below: Related products in 4-column grid

### Shopping Cart

**Clean list layout:**
- Each cart item: Product thumbnail (left), details/quantity controls (center), price/remove (right)
- Sticky sidebar on desktop with cart summary, subtotal, estimated tax, total
- Prominent "Proceed to Checkout" button

### Checkout Flow

**Multi-step indicator** at top showing: Cart → Shipping → Review → Confirmation

**Single-column form layout (max-w-2xl):**
- Clear section headers for Contact Info, Shipping Address, Payment
- Form inputs with generous padding (p-4) and clear labels above fields
- Right sidebar (desktop) with order summary that stays visible

**Confirmation Page:**
- Centered success message with checkmark icon
- Order number prominently displayed
- Order details in organized sections
- CTA to continue shopping

### Admin/Owner Dashboard

**Sidebar navigation (desktop), hamburger menu (mobile):**
- Dashboard overview, Products, Orders, Settings

**Product Management:**
- Grid/table toggle view for products
- Quick actions: Edit, Delete, Duplicate
- Add Product button prominently placed
- Product form: Image upload area (drag-drop), name, price, description fields, size/color management

## Component Library

### Navigation
- Sticky header with store logo (left), centered nav links, cart icon + login (right)
- Mobile: Hamburger menu that slides in from right
- Cart icon shows badge with item count

### Buttons
- Primary CTA: Large, rounded-lg, font-medium, uppercase with letter-spacing
- Secondary: Outlined version of primary
- Icon buttons: Circular for actions like remove/edit

### Cards
- Product cards: Clean with subtle shadow, rounded corners (rounded-lg)
- Hover: Shadow intensifies slightly
- Padding: p-4 to p-6

### Forms
- Input fields: Full-width, rounded borders, p-4 padding, clear focus states
- Labels: Above inputs, font-medium, mb-2
- Validation: Inline error messages below fields

### Icons
**Heroicons** (via CDN): Shopping cart, user, menu, trash, edit, check, x-mark, photo, plus, minus

## Images Strategy

### Required Images

**Homepage Hero:**
- Full-width lifestyle shot: People wearing custom t-shirts at the Jersey Shore beach (surfboards, boardwalk, beach scene)
- High-energy, authentic beach culture vibe

**Product Images:**
- T-shirt mockups on models or flat lay (white background for consistency)
- Multiple angles: Front view primary, detail shots as secondary
- Consistent sizing: 1000x1250px for product detail pages

**Collection Features:**
- Banner images for different collections (Surf, Beach Life, Boardwalk, etc.)

**Admin Dashboard:**
- Placeholder images for empty states (friendly illustrations)

### Image Placement
- Hero: Full viewport width, object-cover
- Product grids: Contained within cards, aspect-ratio-4/5
- Cart thumbnails: Small square (80x80px equivalent)
- Collection banners: Full-width within container

## Animations

**Minimal, purposeful animations only:**
- Product card hover: transform scale-105 transition-transform duration-200
- Cart icon pulse when item added: animate-pulse once
- Page transitions: Subtle fade-in on load
- No scroll-triggered animations, no complex motion

## Responsive Breakpoints

- Mobile-first approach
- sm: 640px (2-column grids)
- md: 768px (navigation expands)
- lg: 1024px (3-4 column grids, sidebar layouts)
- xl: 1280px (max container width)

---

**Key Principle:** Product imagery and seamless shopping experience take priority. Every design decision should make browsing, selecting, and purchasing t-shirts effortless while celebrating the beach culture aesthetic.