import crypto from "crypto";

// Use actual webhook secret from environment
const WEBHOOK_SECRET = process.env.REPLICATE_WEBHOOK_SECRET || "***REMOVED***";

// Test payload with existing replicate ID that has succeeded
const testPayload = {
  id: "r3ja73d7tsrme0cr541rz71ntc",
  status: "succeeded",
  output: {
    version: "model_version_456"
  }
};

function generateValidWebhookHeaders(payload: any, secret: string) {
  const webhookId = `msg_${Date.now()}`;
  const webhookTimestamp = Math.floor(Date.now() / 1000).toString();
  const body = JSON.stringify(payload);
  
  // Construct signed content
  const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;
  
  // Extract signing key (remove 'whsec_' prefix)
  const signingKey = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  
  // Generate signature
  const signature = crypto
    .createHmac("sha256", Buffer.from(signingKey, "base64"))
    .update(signedContent, "utf8")
    .digest("base64");
  
  return {
    "webhook-id": webhookId,
    "webhook-timestamp": webhookTimestamp,
    "webhook-signature": `v1,${signature}`,
    "content-type": "application/json"
  };
}

async function testValidWebhook() {
  console.log("🧪 Testing valid webhook...");
  
  const headers = generateValidWebhookHeaders(testPayload, WEBHOOK_SECRET);
  
  try {
    const response = await fetch("http://localhost:3000/api/replicate-webhook", {
      method: "POST",
      headers,
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${result}`);
    
    if (response.status === 200) {
      console.log("✅ Valid webhook test PASSED");
    } else {
      console.log("❌ Valid webhook test FAILED");
    }
  } catch (error) {
    console.error("Error testing valid webhook:", error);
  }
}

async function testInvalidWebhook() {
  console.log("\n🧪 Testing invalid webhook (wrong signature)...");
  
  const headers = {
    "webhook-id": "msg_invalid",
    "webhook-timestamp": Math.floor(Date.now() / 1000).toString(),
    "webhook-signature": "v1,invalid_signature_here",
    "content-type": "application/json"
  };
  
  try {
    const response = await fetch("http://localhost:3000/api/replicate-webhook", {
      method: "POST",
      headers,
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${result}`);
    
    if (response.status === 401) {
      console.log("✅ Invalid webhook test PASSED (correctly rejected)");
    } else {
      console.log("❌ Invalid webhook test FAILED (should have been rejected)");
    }
  } catch (error) {
    console.error("Error testing invalid webhook:", error);
  }
}

async function testExpiredWebhook() {
  console.log("\n🧪 Testing expired webhook (old timestamp)...");
  
  const oldTimestamp = (Math.floor(Date.now() / 1000) - 600).toString(); // 10 minutes ago
  const webhookId = `msg_${Date.now()}`;
  const body = JSON.stringify(testPayload);
  
  const signedContent = `${webhookId}.${oldTimestamp}.${body}`;
  const signingKey = WEBHOOK_SECRET.startsWith("whsec_") ? WEBHOOK_SECRET.slice(6) : WEBHOOK_SECRET;
  const signature = crypto
    .createHmac("sha256", Buffer.from(signingKey, "base64"))
    .update(signedContent, "utf8")
    .digest("base64");
  
  const headers = {
    "webhook-id": webhookId,
    "webhook-timestamp": oldTimestamp,
    "webhook-signature": `v1,${signature}`,
    "content-type": "application/json"
  };
  
  try {
    const response = await fetch("http://localhost:3000/api/replicate-webhook", {
      method: "POST",
      headers,
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${result}`);
    
    if (response.status === 401) {
      console.log("✅ Expired webhook test PASSED (correctly rejected)");
    } else {
      console.log("❌ Expired webhook test FAILED (should have been rejected)");
    }
  } catch (error) {
    console.error("Error testing expired webhook:", error);
  }
}

async function runAllTests() {
  console.log("🚀 Starting webhook verification tests...\n");
  
  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testValidWebhook();
  await testInvalidWebhook();
  await testExpiredWebhook();
  
  console.log("\n🏁 All tests completed!");
}

runAllTests().catch(console.error); 