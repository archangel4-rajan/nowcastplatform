// NowCast API Lambda Function
// Deploy this to AWS Lambda with Node.js 20.x runtime

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || "nowcast-users";

// CORS headers
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Content-Type": "application/json"
};

// Helper to create response
function response(statusCode, body) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body)
  };
}

// Main handler
export const handler = async (event) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return response(200, {});
  }

  // Get user info from Cognito JWT (passed by API Gateway authorizer)
  const claims = event.requestContext?.authorizer?.claims;
  if (!claims) {
    return response(401, { error: "Unauthorized", message: "No valid authentication token provided" });
  }

  const userId = claims.sub;
  const email = claims.email;
  const name = claims.name || claims.email?.split("@")[0] || "User";

  try {
    const path = event.path;
    const method = event.httpMethod;

    // Route: GET /user - Get current user profile
    if (path === "/user" && method === "GET") {
      return await getUser(userId, email, name);
    }

    // Route: POST /user - Update user profile
    if (path === "/user" && method === "POST") {
      const body = JSON.parse(event.body || "{}");
      return await updateUser(userId, email, name, body);
    }

    // Route: GET /user/preferences - Get user preferences
    if (path === "/user/preferences" && method === "GET") {
      return await getUserPreferences(userId);
    }

    // Route: POST /user/preferences - Update user preferences
    if (path === "/user/preferences" && method === "POST") {
      const body = JSON.parse(event.body || "{}");
      return await updateUserPreferences(userId, body);
    }

    // Route not found
    return response(404, { error: "Not found", message: `Route ${method} ${path} not found` });

  } catch (error) {
    console.error("Error:", error);
    return response(500, { error: "Internal server error", message: error.message });
  }
};

// Get user profile (creates if doesn't exist)
async function getUser(userId, email, name) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { userId }
  }));

  if (result.Item) {
    return response(200, result.Item);
  }

  // First login - create new user
  const newUser = {
    userId,
    email,
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    plan: "free",
    preferences: {
      theme: "light",
      notifications: true
    }
  };

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: newUser
  }));

  return response(201, newUser);
}

// Update user profile
async function updateUser(userId, email, name, updates) {
  // Only allow updating certain fields
  const allowedFields = ["name", "company", "phone", "bio"];
  const filteredUpdates = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }

  if (Object.keys(filteredUpdates).length === 0) {
    return response(400, { error: "Bad request", message: "No valid fields to update" });
  }

  // Build update expression
  const updateExpressionParts = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  for (const [key, value] of Object.entries(filteredUpdates)) {
    updateExpressionParts.push(`#${key} = :${key}`);
    expressionAttributeNames[`#${key}`] = key;
    expressionAttributeValues[`:${key}`] = value;
  }

  // Always update timestamp
  updateExpressionParts.push("#updatedAt = :updatedAt");
  expressionAttributeNames["#updatedAt"] = "updatedAt";
  expressionAttributeValues[":updatedAt"] = new Date().toISOString();

  const result = await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { userId },
    UpdateExpression: `SET ${updateExpressionParts.join(", ")}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW"
  }));

  return response(200, result.Attributes);
}

// Get user preferences
async function getUserPreferences(userId) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { userId },
    ProjectionExpression: "preferences"
  }));

  if (!result.Item) {
    return response(404, { error: "Not found", message: "User not found" });
  }

  return response(200, result.Item.preferences || {});
}

// Update user preferences
async function updateUserPreferences(userId, preferences) {
  const result = await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { userId },
    UpdateExpression: "SET preferences = :preferences, updatedAt = :updatedAt",
    ExpressionAttributeValues: {
      ":preferences": preferences,
      ":updatedAt": new Date().toISOString()
    },
    ReturnValues: "ALL_NEW"
  }));

  return response(200, result.Attributes.preferences);
}
