# Fastor · React developer assignment

A responsive implementation of the four screens in the supplied [Figma design](https://www.figma.com/design/3ojakpt78j8wWhqW1yQMnT/Mobile-App-Design-Task?node-id=0-1): mobile number signup, six-digit verification, food catalogue, and product detail/portion selection. Built from scratch with React 19, Vite and Lucide icons.

## Run

Requires Node.js 22+.

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite. Production build: `npm run build`; inspect it with `npm run preview`. Deploy the generated `dist/` directory on any static host.

## Try it

1. Enter a 10-digit Indian mobile number starting with 6–9, such as `9876543210`.
2. Enter demo OTP `123456`. Incorrect codes display a validation error. Resend becomes available after 30 seconds.
3. Browse best sellers, filter categories or search the popular items.
4. Open a pizza, choose a portion and quantity, and add it to the cart.
5. Open the cart, change quantities, remove items or place a demo order.

Cart contents persist across refreshes in local storage. The “Explore the menu” link also allows guest browsing. Modals use the native dialog element for keyboard focus containment, restore focus on close, and support Escape.

## Scope and design decisions

Mobile layouts follow the reference's orange palette, compact food cards, promotion, verification boxes and portion selector. Desktop gets an additional brand panel. Photography is substituted with locally bundled Unsplash images; this is not a pixel-identical export. Native device keyboards are used instead of drawing a fake keyboard into the page. Text is readable, search/category controls work, and placeholder product descriptions are replaced with meaningful copy. The reference's order-action chips are replaced with functional menu/cart actions because no order-tracking service was specified.

OTP is explicitly a frontend demo: no phone number is transmitted/stored, and no SMS or authentication service is connected. The displayed delivery location and menu are fixtures. Checkout places no real order and takes no payment. The promotion is illustrative and does not alter cart prices. The CRM backend is a separate assignment and has no relation to this food app. Google Fonts loads DM Sans/Manrope with system font fallback; food images are bundled locally.

## Validation

`npm test` validates cart merging by portion and pricing. `npm run build` checks production bundling. Browser smoke checks cover phone validation, incorrect/correct OTP, selecting portions, quantity totals, and demo checkout. See the top-level verification notes for run results.

## Files

- `src/main.jsx`: screens, form validation, menu, accessible dialogs, cart.
- `src/styles.css`: mobile and desktop layouts.
- `src/data.js`: menu fixtures and portion pricing.
- `src/cart.js`: pure cart calculations.
- `public/assets/`: bundled food photos.

## Photo sources

- Pizza: https://images.unsplash.com/photo-1579751626657-72bc17010498
- Burger: https://images.unsplash.com/photo-1568901346375-23c9450c58cd
- Strawberry shake: [Alina Parache on Unsplash](https://unsplash.com/photos/a-strawberry-milkshake-with-whipped-cream-and-a-straw-smsivJclnQM), image `photo-1686638745403-d21193f16b2f`.
- Salad: https://images.unsplash.com/photo-1512621776951-a57141f2eefd
