const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function driveUpload(pdfBuffer, lead, jobId) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_S3_BUCKET) {
    console.warn('[S3] Skipping — credentials not set');
    return;
  }

  const fileName = `${lead.company.replace(/[^a-zA-Z0-9]/g, '-')}-Audit-${Date.now()}.pdf`;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `reports/${fileName}`,
    Body: pdfBuffer,
    ContentType: 'application/pdf',
  }));

  console.log(`[S3] ✓ Uploaded ${fileName} to S3`);
  return fileName;
}

module.exports = { driveUpload };