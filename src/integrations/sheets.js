const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

async function sheetsLog(lead, jobId) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_DYNAMODB_TABLE) {
    console.warn('[DynamoDB] Skipping — credentials not set');
    return;
  }

  await docClient.send(new PutCommand({
    TableName: process.env.AWS_DYNAMODB_TABLE,
    Item: {
      jobId,
      timestamp: new Date().toISOString(),
      name: lead.name,
      email: lead.email,
      company: lead.company,
      companyUrl: lead.companyUrl || '',
      industry: lead.industry || '',
      status: 'completed',
    },
  }));

  console.log(`[DynamoDB] ✓ Logged lead for ${lead.company}`);
}

module.exports = { sheetsLog };