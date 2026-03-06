import { CreateTableInput } from "@aws-sdk/client-dynamodb";

export const PasswordResetTable: CreateTableInput = {
  TableName: "PasswordResetTokens",
  AttributeDefinitions: [
    { AttributeName: "token", AttributeType: "S" }
  ],
  KeySchema: [
    { AttributeName: "token", KeyType: "HASH" }
  ],
  BillingMode: "PAY_PER_REQUEST",
};