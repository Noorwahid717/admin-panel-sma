import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { StoragePresignInput } from "@shared/schemas";
import type { AuthenticatedUser } from "../../common/types/authenticated-user";
import { nanoid } from "nanoid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageClient } from "@supabase/storage-js";
import type { EnvironmentVariables } from "../../config/env.validation";

const DEFAULT_UPLOAD_FOLDER = "uploads";
const R2_PRESIGN_EXPIRATION = 60 * 5; // 5 minutes
const SUPABASE_PRESIGN_EXPIRATION = 60; // Supabase default expiry in seconds

type PresignResult = {
  driver: EnvironmentVariables["STORAGE_DRIVER"];
  upload: {
    url: string;
    method: "PUT";
    headers: Record<string, string>;
    expiresIn: number;
  };
  asset: {
    path: string;
    publicUrl?: string;
  };
  extra?: Record<string, unknown>;
};

@Injectable()
export class StorageService {
  private readonly driver: EnvironmentVariables["STORAGE_DRIVER"];
  private readonly bucket?: string;
  private readonly r2Client?: S3Client;
  private readonly supabaseClient?: StorageClient;
  private readonly supabaseUrl?: string;

  constructor(private readonly configService: ConfigService<EnvironmentVariables>) {
    this.driver = this.configService.getOrThrow("STORAGE_DRIVER", { infer: true });

    if (this.driver === "r2") {
      this.bucket = this.configService.getOrThrow("R2_BUCKET", { infer: true });
      const accountId = this.configService.getOrThrow("R2_ACCOUNT_ID", { infer: true });
      const accessKeyId = this.configService.getOrThrow("R2_ACCESS_KEY_ID", { infer: true });
      const secretAccessKey = this.configService.getOrThrow("R2_SECRET_ACCESS_KEY", {
        infer: true,
      });

      this.r2Client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    } else {
      this.bucket = this.configService.getOrThrow("SUPABASE_BUCKET", { infer: true });
      const supabaseUrl = this.configService.getOrThrow("SUPABASE_URL", { infer: true });
      const serviceKey = this.configService.getOrThrow("SUPABASE_SERVICE_KEY", { infer: true });

      this.supabaseUrl = supabaseUrl.replace(/\/$/, "");
      this.supabaseClient = new StorageClient(`${this.supabaseUrl}/storage/v1`, {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      });
    }
  }

  private sanitizeSegment(segment?: string) {
    if (!segment) {
      return DEFAULT_UPLOAD_FOLDER;
    }

    return (
      segment
        .trim()
        .replace(/\\+/g, "/")
        .replace(/\.\.+/g, "")
        .replace(/^\/+/, "")
        .replace(/\/+$/, "")
        .split("/")
        .filter(Boolean)
        .join("/")
        .slice(0, 255) || DEFAULT_UPLOAD_FOLDER
    );
  }

  private createObjectKey(fileName: string, folder?: string) {
    const sanitizedFolder = this.sanitizeSegment(folder);
    const normalizedName = fileName
      .trim()
      .replace(/[^a-zA-Z0-9\.\-_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 180);

    const uniqueSuffix = `${Date.now()}-${nanoid(8)}`;
    return `${sanitizedFolder}/${uniqueSuffix}-${normalizedName}`;
  }

  async presign(user: AuthenticatedUser, payload: StoragePresignInput): Promise<PresignResult> {
    const objectKey = this.createObjectKey(payload.fileName, payload.folder ?? user.id);

    if (this.driver === "r2") {
      return this.presignR2(objectKey, payload);
    }

    return this.presignSupabase(objectKey, payload);
  }

  private async presignR2(objectKey: string, payload: StoragePresignInput): Promise<PresignResult> {
    if (!this.r2Client || !this.bucket) {
      throw new InternalServerErrorException("R2 client is not configured");
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      ContentType: payload.contentType,
    });

    const url = await getSignedUrl(this.r2Client, command, { expiresIn: R2_PRESIGN_EXPIRATION });
    const publicBase = this.configService
      .get("R2_PUBLIC_BASE_URL", { infer: true })
      ?.replace(/\/$/, "");

    return {
      driver: "r2",
      upload: {
        url,
        method: "PUT",
        headers: {
          "content-type": payload.contentType,
        },
        expiresIn: R2_PRESIGN_EXPIRATION,
      },
      asset: {
        path: objectKey,
        publicUrl: publicBase ? `${publicBase}/${objectKey}` : undefined,
      },
    };
  }

  private async presignSupabase(
    objectKey: string,
    payload: StoragePresignInput
  ): Promise<PresignResult> {
    if (!this.supabaseClient || !this.bucket || !this.supabaseUrl) {
      throw new InternalServerErrorException("Supabase client is not configured");
    }

    const { data, error } = await this.supabaseClient
      .from(this.bucket)
      .createSignedUploadUrl(objectKey);

    if (error || !data) {
      throw new InternalServerErrorException(
        error?.message ?? "Failed to create Supabase signed URL"
      );
    }

    const uploadUrl = `${this.supabaseUrl}${data.signedUrl}`;
    const publicUrl = `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${objectKey}`;

    return {
      driver: "supabase",
      upload: {
        url: uploadUrl,
        method: "PUT",
        headers: {
          "content-type": payload.contentType,
          Authorization: `Bearer ${data.token}`,
          "x-upsert": "true",
        },
        expiresIn: SUPABASE_PRESIGN_EXPIRATION,
      },
      asset: {
        path: `${this.bucket}/${objectKey}`,
        publicUrl,
      },
      extra: {
        token: data.token,
        signedUrlPath: data.signedUrl,
      },
    };
  }
}
