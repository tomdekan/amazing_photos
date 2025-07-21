# Test Scripts

## Training Session Test

The `test-training-session.ts` script validates that the training session ID functionality works correctly to prevent image contamination between different training runs.

### What it tests:

1. **Session Isolation**: Verifies that images uploaded with different `trainingSessionId` values are properly isolated
2. **Training Linkage**: Tests that images can be correctly linked to specific training records
3. **Cross-contamination Prevention**: Ensures that non-existent session IDs return no results
4. **Legacy Image Isolation**: Verifies that images without a `trainingSessionId` don't interfere with session-based queries

### How to run:

```bash
# Using npm
npm run test:training-session

# Or directly with tsx
npx tsx scripts/test-training-session.ts
```

### Test Flow:

1. Creates a test user in the database
2. Uploads 3 images to "session 1" and 2 images to "session 2"
3. Verifies that `getUploadedImagesByTrainingSession()` returns the correct images for each session
4. Creates mock training records and links images to them
5. Tests cross-contamination prevention
6. Tests legacy image isolation
7. Cleans up all test data

### Expected Output:

If everything is working correctly, you should see:

```
🎉 ALL TESTS PASSED! 🎉
======================
✅ Session isolation works correctly
✅ Training linkage works correctly
✅ Cross-contamination is prevented
✅ Legacy images are properly isolated
```

### Requirements:

- Database must be running and accessible
- Vercel Blob storage must be configured
- Environment variables must be properly set

This test ensures that users cannot accidentally mix images from different training sessions when starting a training job.

## Frontend Integration Test

The `test-frontend-integration.ts` script verifies that the frontend properly includes `trainingSessionId` when uploading images.

### What it tests:

1. **Training Session ID Presence**: Checks if recent uploaded images have `trainingSessionId` set
2. **Session Grouping**: Shows how images are grouped by training session
3. **Integration Status**: Determines if the frontend integration is working correctly

### How to run:

```bash
# Using npm
npm run test:frontend-integration

# Or directly with tsx
npx tsx scripts/test-frontend-integration.ts
```

### What to do:

1. Upload some images through the frontend (using the web interface)
2. Run this test script to verify they have training session IDs
3. Check the output to ensure the integration is working

### Expected Output:

If the frontend integration is working correctly:

```
🎉 SUCCESS: All recent images have training session IDs!
Frontend integration is working correctly.
```

If not yet implemented or partially working:

```
⚠️ PARTIAL SUCCESS: Some images have training session IDs.
This suggests the frontend update is working for new uploads.
```

### Requirements:

- Database must be running and accessible
- You should upload some images through the web interface first 