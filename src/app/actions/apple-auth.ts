"use server";

export async function getAppleDeveloperToken() {
  // In a real app, you might sign a fresh JWT here using your private key
  // For this milestone, we'll return the environment variable
  return process.env.APPLE_DEVELOPER_TOKEN || null;
}
