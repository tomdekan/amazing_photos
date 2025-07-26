Pre-release:
4. - [ ] Require TOK in the prompt

Bonus:
4. [ ] SHow a model with examples to the free Tom model
7. [ ] Add some example prompts 
10. [ ] Add a contact email for support
11. [ ] Allow users to generate images in parallel


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

To activate payments create at least one product with a priceId on your Stripe dashboard.

You can test this locally with the Stripe CLI.

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

3. Add your Environment variables to `.env.example`. You can find your webhook signing key by running the stripe CLI with:

## To create a tunnel for Replicate to send a webhook after training completes, enter the below:

Option 1: Localhost. Run

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
