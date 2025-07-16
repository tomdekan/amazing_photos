# Plan: Free Image Generation for Signed-in Users

This document outlines the plan to implement a feature that allows signed-in users to generate a limited number of free images using pre-trained models.

## 1. Feature Overview

-   **Goal**: Provide a way for users to try out image generation for free before committing to a paid plan.
-   **Core Functionality**:
    -   A new form on the `/generate` page for free image generation.
    -   Users can select one of three pre-trained models (e.g., historical figures).
    -   Users can enter a text prompt to generate an image.
    -   Each user is limited to ~30 free image generations.
    -   Generated images are saved and associated with the user's account.

## 2. Database Schema Changes

File: `prisma/schema.prisma`

To track free image generations, we will add a new field to the `User` model.

```prisma
model User {
  // ... existing fields
  freeGenerationsUsed Int @default(0)
}
```

We will need to create and run a new migration for this change.

```bash
npx prisma migrate dev --name add_free_generations_counter
```

## 3. UI Implementation

### 3.1. Main Generate Page

File: `src/app/generate/page.tsx`

The `generate` page will be updated to include the new "Free Generation" form. It will likely sit alongside the existing "train your own model" flow. We should present it as a clear option for users who just want to try things out.

### 3.2. Free Generation Form Component

File: `src/components/FreeGenerationForm.tsx` (new file)

This component will contain the UI for the free generation feature.

-   **State Management**:
    -   `prompt`: string for the user's text input.
    -   `selectedModel`: string for the chosen pre-trained model.
    -   `isLoading`: boolean to show a loading state during generation.
    -   `error`: string to display any errors.
    -   `generatedImage`: string URL of the generated image.

-   **UI Elements**:
    -   A dropdown or styled radio buttons to select one of the 3 pre-trained models.
        -   Models could be: 'Albert Einstein', 'Cleopatra', 'Leonardo da Vinci'. We need to find corresponding Replicate model versions.
    -   A text area for the user prompt.
    -   A "Generate" button, which will be disabled when `isLoading` is true.
    -   A display area for the generated image or an error message.

## 4. Backend Implementation

### 4.1. API Endpoint for Free Generation

File: `src/app/api/generate/free/route.ts` (new file)

This endpoint will handle the image generation request from the `FreeGenerationForm`.

-   **Method**: `POST`
-   **Request Body**: `{ "prompt": "...", "model": "..." }`
-   **Authentication**: The route will be protected, requiring a signed-in user. We'll use `auth()` from `next-auth`.

-   **Logic**:
    1.  Get the current user session.
    2.  Check if the user has exceeded their free generation limit (e.g., `> 30`).
        -   If so, return a 403 Forbidden error with a message like "You have used all your free generations."
    3.  Call the Replicate API with the user's prompt and the selected pre-trained model identifier.
        -   We need to map the user-friendly model names to actual Replicate model version hashes.
    4.  On successful generation from Replicate, it will return an image URL.
    5.  Download the image from the Replicate URL.
    6.  Upload the image to our Vercel Blob storage.
    7.  Save the image metadata to the database. We'll use the `GeneratedImage` model.
        -   `userId`: The current user's ID.
        -   `prompt`: The user's prompt.
        -   `imageUrl`: The URL from our Vercel Blob store.
        -   `modelId`: The identifier of the pre-trained model used.
    8.  Increment the `freeGenerationsUsed` count for the user in the database.
    9.  Return the Vercel Blob URL of the newly generated image to the client.

### 4.2. Finding Pre-trained Models on Replicate

We need to find suitable pre-trained models on Replicate. These should be public and high-quality. We can search for models trained on specific people or styles.

For example, for Albert Einstein, we could use a Stable Diffusion model fine-tuned on his likeness.

Let's assume we find these model versions on Replicate:
-   **Einstein**: `replicate/some-einstein-model:version-hash`
-   **Cleopatra**: `replicate/some-cleopatra-model:version-hash`
-   **Van Gogh style**: `replicate/some-van-gogh-model:version-hash`

We'll store these mappings in a configuration file or directly in the API route.

## 5. Step-by-Step Implementation Plan

1.  **DB Migration**:
    -   Modify `prisma/schema.prisma` to add `freeGenerationsUsed` to the `User` model.
    -   Run `npx prisma migrate dev --name add_free_generations_counter`.

2.  **Backend API Route**:
    -   Create `src/app/api/generate/free/route.ts`.
    -   Implement the logic to handle user authentication, check generation limits, call Replicate, upload to blob, and save to the database.

3.  **Frontend Component**:
    -   Create `src/components/FreeGenerationForm.tsx`.
    -   Build the form with model selection, prompt input, and a submit button.
    -   Add state management for loading, errors, and displaying the result.
    -   Implement the `fetch` call to the new `/api/generate/free` endpoint.

4.  **Integrate into Generate Page**:
    -   Modify `src/app/generate/page.tsx`.
    -   Import and render the `FreeGenerationForm` component.
    -   Add logic to show the free generation form only to signed-in users.

5.  **Testing**:
    -   Test the end-to-end flow:
        -   UI interaction.
        -   API request and response.
        -   Replicate API call.
        -   Image upload to Vercel Blob.
        -   Database updates (`GeneratedImage` and `User`).
    -   Test the rate limiting logic (user can't generate more than ~30 images).
    -   Test error handling (e.g., Replicate fails, user not signed in). 