import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import { ObjectId } from 'mongodb';
import { getDb } from "@/lib/mongo";

function getS3Config() {
  const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET } = process.env;
  if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET) {
    throw new Error('Missing required AWS environment variables');
  }
  return { region: AWS_REGION, accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY, bucket: AWS_S3_BUCKET };
}

/** Uploads an image to S3, stores its public URL as `image_url` on the document, and returns the URL. */
export async function uploadToS3(
  file: { name: string; type: string; buffer: Buffer },
  folder: string,
  documentId: string,
  collection: string,
): Promise<string> {
  try {
    const { region, accessKeyId, secretAccessKey, bucket } = getS3Config();
    const s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
    const db = await getDb();
    const fileName = `${documentId}_${Date.now()}${path.extname(file.name)}`;
    const key = folder ? `${folder}/${fileName}` : fileName;

    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.type,
      ACL: 'public-read',
    }));
    const imageUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    if (collection) {
      await db.collection(collection).updateOne({ _id: new ObjectId(documentId) }, { $set: { image_url: imageUrl } });
    }
    if (collection === 'ipos') {
      await db.collection('ipo_comprehensive_analysis').updateMany({ ipo_table_id: documentId }, { $set: { image_url: imageUrl } });
    }

    return imageUrl;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
