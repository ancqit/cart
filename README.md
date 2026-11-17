# Cart

Angular portal for vegetable carts. The number you were given opens it. The shape matches herbant and scrap. The themes are the light set from binter and herbant. Meadow is the one that opens.

The browser calls `/api`. Vercel forwards that to herback and strips `/api`, the same way [scrap](https://github.com/ancqit/scrap) and [binter](https://github.com/ancqit/binter) do. herback serves the routes at `/cart`.

## Numbers

Set these on the herback service. The portal does not store them.

| Name | Who enters it |
| --- | --- |
| `CART_ENTITY_TOKEN` | The entity. Loaded carts, then a cart. |
| `CART_LOADER_TOKEN` | The desk. A small token field creates a cart. |

A cart token is what the loader types. That token is the cart. The entity can also open the portal with the entity number and see every loaded cart.

Opening a cart shows the schedule and the vegetables. Each vegetable has a price and a fresh photograph. Adding vegetables and an address issues a token for the cart driver. The driver enters that token and gets the address.

## Photographs

Fresh photographs use the herback R2 bucket. The browser asks for a presigned PUT, then uploads straight to the bucket. Keys stay under `cart/photos/`. They do not land in `herb/`, `2001/`, `binter/`, or `shorts/`.

The bucket CORS policy needs this site's origin on `PUT`, the same as herbant, scrap, and binter. Include `https://cart.vercel.app` and `http://localhost:4200`.

## Themes

Meadow, blossom, linen, shore, apricot, lemon, sky, and clouds. Clock is kept for other products and is not in the list. A theme is the view and the wallpaper together.

## Deploy

Connect this repo on Vercel. `vercel.json` publishes `dist/cart/browser` and sends `/api` to `https://herback.onrender.com`.

herback has to be deployed with the two numbers first, or those doors stay shut. A cart token still opens its cart once the loader has created it.

If the Vercel host is not `cart.vercel.app` or a `cart-….vercel.app` preview, add it to herback's `CORS_ORIGINS`.

```bash
npm install
npm start
```

The dev server is `http://127.0.0.1:4200`. It forwards `/api` to herback.
