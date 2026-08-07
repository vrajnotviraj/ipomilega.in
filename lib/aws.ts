import { S3Client, PutObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import path from 'path';
import { connectToDatabase } from "@/lib/mongo";
import { ObjectId } from 'mongodb';

// Type definition for multer file object
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// Environment variables type safety
interface S3Config {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

// Get S3 configuration from environment variables
const getS3Config = (): S3Config => {
  const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET } = process.env;

  if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET) {
    throw new Error('Missing required AWS environment variables');
  }

  return {
    region: AWS_REGION,
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    bucket: AWS_S3_BUCKET
  };
};

// Initialize S3 client
const initializeS3Client = (): S3Client => {
  const config = getS3Config();

  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  });
};

/**
 * Uploads a file to S3 in a specified folder and returns the public URL.
 * @param file - The multer file object
 * @param folder - Folder in the bucket (e.g., 'logos', 'charts')
 * @returns Promise<string> - The public URL of the uploaded file
 */
export const uploadToS3 = async (file: MulterFile, folder: string = '', documentId: string, collection: string, access = 'public-read'): Promise<string> => {
  try {
    const s3 = initializeS3Client();
    const config = getS3Config();
    const { db } = await connectToDatabase();
    const extension = path.extname(file.originalname);
    const timestamp = Date.now();
    const fileName = `${documentId}_${timestamp}${extension}`;
    const key = folder ? `${folder}/${fileName}` : fileName;

    // Use file.buffer directly instead of reading from disk
    const fileContent = file.buffer;

    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: fileContent,
      ContentType: file.mimetype,
      ACL: access as ObjectCannedACL
    });

    await s3.send(command);
    const imageUrl = `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;

    if (collection === 'ipos') {
      await db.collection('ipos').updateOne({ _id: new ObjectId(documentId) }, { $set: { image_url: imageUrl } });
      await db.collection('ipo_comprehensive_analysis').updateMany({ ipo_table_id: documentId }, { $set: { image_url: imageUrl } });
    } else if (collection === 'blogs') {
      await db.collection('blogs').updateOne({ _id: new ObjectId(documentId) }, { $set: { image_url: imageUrl } });
    } else if (collection) {
      await db.collection(collection).updateOne({ _id: new ObjectId(documentId) }, { $set: { image_url: imageUrl } });
    }

    return imageUrl;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};