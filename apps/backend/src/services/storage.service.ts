import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";
import { randomUUID } from "crypto";

const s3 = new S3Client({ region: env.AWS_REGION });

/**
 * Generates a pre-signed URL the client (mobile/web) can upload directly to,
 * avoiding proxying large files (KYC documents, vehicle photos) through the API server.
 */
export async function getUploadUrl(folder: string, contentType: string) {
  const key = `${folder}/${randomUUID()}`;
  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const publicUrl = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

  return { uploadUrl, publicUrl, key };
}
