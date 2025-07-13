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

## To create a tunnel for Replicate to send a webhook after training completes, enter the below. 

Option 1: Localhost.Run
```bash
ssh -R 80:localhost:3000 ssh.localhost.run
```

Option 2: Pingy (ONly 60 mins, but web debuger at port 4300)

```bash
ssh -p 443 -R0:localhost:8080 -L4300:localhost:4300 free.pinggy.io
```


This creates The temporary public route from localhost.run to your localhost.

Ensure that the environment variable matches the local host URL. 

## To add Google sign in

Sign in with Google guide: [https://tomdekan.com/articles/google-sign-in-nextjs](https://tomdekan.com/articles/google-sign-in-nextjs)
