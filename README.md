## To run

1. add a .env file with the variables listed in the guide above
2. Install packages

```bash
pnpm install
```

3. Run the dev server

```bash
pnpm dev
```

## To add payments with Stripe
To activate payments:
1. Create at least one product with a priceId on your Stripe dashboard.
2. Add your Environment variables to `.env.example`. You can find your webhook signing key by running the stripe CLI with:
```bash
stripe listen
```
3. Run your webhook listener to receive requests from the stripe checkout from a user
```bash
stripe listen --forward-to localhost:3000/api/webhook
```

## To add Google sign in
Sign in with Google guide: [https://tomdekan.com/articles/google-sign-in-nextjs](https://tomdekan.com/articles/google-sign-in-nextjs)


