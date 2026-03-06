import { DynamoDBClient, CreateTableCommand, UpdateTimeToLiveCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { PasswordResetTable } from "./tables/password-reset.table";

const endPoint = process.env.DYNAMODB_ENDPOINT?.trim() || "http://localhost:8000";

const client = new DynamoDBClient({
   endpoint: endPoint,
  region: "local",
  credentials: { accessKeyId: "gktsaw", secretAccessKey: "j9gcwp" }
});

async function tableCreation() {
  console.log("🚀 Starting TypeScript DynamoDB table creation...");

  const tables = [PasswordResetTable];

  for (const table of tables) {
    try {
      // Check if table exists first
      await client.send(new DescribeTableCommand({ TableName: table.TableName }));
      console.log(`⚠️ Table ${table.TableName} already exists. Skipping.`);
    } catch (err: any) {
      console.log(`⚠️ Table ${table.TableName} does not exist. Creating...`,err);
      if (err.name === "ResourceNotFoundException") {
        // 1. Create Table
        await client.send(new CreateTableCommand(table));
        
        // 2. Enable TTL (Mandatory for your Forgot Password flow)
       const res= await client.send(new UpdateTimeToLiveCommand({
          TableName: table.TableName,
          TimeToLiveSpecification: { Enabled: true, AttributeName: "expires_at" }
        }));
        console.log("res::", res)
        console.log(`✅ Created Table: ${table.TableName} with TTL enabled.`);
      }
    }
  }
}

tableCreation().catch(console.error);
