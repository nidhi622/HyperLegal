// src/auth/repositories/password-reset.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

export interface PasswordResetItem {
  token: string;      // Hash Key
  user_id: string;
  expires_at: number; // TTL attribute
}

@Injectable()
export class PasswordResetRepository {
  private readonly tableName = 'PasswordResetTokens';

  constructor(
    @Inject('DYNAMO_DB_CLIENT') private readonly docClient: DynamoDBDocumentClient,
  ) {}

  // 1. INSERT DATA
  async saveToken(userId: string, token: string, ttlInSeconds: number) {

    console.log("ttlInSeconds::", ttlInSeconds)

    console.log("docClient: ", this.docClient)
    if(!ttlInSeconds){
      ttlInSeconds = 3600; // 1 hour
    }
    const expiresAt = Math.floor(Date.now() / 1000) + ttlInSeconds;

    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        token: token,
        user_id: userId,
        expires_at: expiresAt,
      },
    }));
  }

  // 2. FIND DATA (For the second part of the flow)
  async findByToken(token: string): Promise<PasswordResetItem | null> {
    console.log("token::", token)
    const result = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { token },
    }));
    console.log("result::", result)
    return (result.Item as PasswordResetItem) || null;
  }

  // 3. DELETE DATA (Ensure single-use)
  async deleteToken(token: string) {
    await this.docClient.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { token },
    }));
  }
}