import type { Readable } from 'stream'
import type { S3Client } from '@aws-sdk/client-s3'
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  CopyObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  UploadPartCommand,
  ListObjectsV2Command,
  _Object,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3 as s3Client } from './s3.init'

const DOWNLOAD_EXPIRATION = 60 * 60 * 24 // 24 hours
const UPLOAD_EXPIRATION = 60 * 60 * 0.5 // 30 minutes
const FILE_CHUNK_SIZE = 100 * 1024 * 1024 // 100 MB

type BaseS3MethodProps = { bucket: string; key: string }

type S3PutObjectBody =
  | string // For text or JSON content
  | Buffer // For binary data in Node.js
  | Uint8Array // For binary data as typed arrays
  | Blob // For binary data in the browser (e.g., files)
  | Readable // For Node.js streams
  | ReadableStream // For browser streams

type BaseS3FileInfo = {
  length?: number
  contentType?: string
  metadata?: Record<string, string>
}

type BaseS3File = BaseS3FileInfo & {
  body: S3PutObjectBody
}
type MultipartUploadPart = {
  ETag: string
  PartNumber: number
}

export class S3 {
  private static instance: S3
  public readonly s3: S3Client

  private constructor() {
    this.s3 = s3Client
  }

  public static getInstance(): S3 {
    if (!S3.instance) {
      S3.instance = new S3()
    }
    return S3.instance
  }

  public getS3(): S3Client {
    return this.s3
  }

  private handleError(error: unknown, methodName: string) {
    console.error(`Error in ${methodName}:`, error)
    throw new Error(`S3 ${methodName} failed: ${(error as Error).message}`)
  }

  public async putObject({
    bucket,
    key,
    file,
  }: BaseS3MethodProps & { file: BaseS3File }) {
    try {
      return await this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file.body,
          ...(file.length && { ContentLength: file.length }),
          ContentType: file.contentType ?? 'application/octet-stream',
          ...(file.metadata && { Metadata: file.metadata }),
        }),
      )
    } catch (error) {
      this.handleError(error, 'uploadObject')
    }
  }

  public async getPutUrl({
    bucket,
    key,
    fileInfo,
  }: BaseS3MethodProps & { fileInfo: BaseS3FileInfo }) {
    try {
      return await getSignedUrl(
        this.s3,
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ...(fileInfo.length && { ContentLength: fileInfo.length }),
          ContentType: fileInfo.contentType ?? 'application/octet-stream',
          ...(fileInfo.metadata && { Metadata: fileInfo.metadata }),
        }),
        {
          expiresIn: UPLOAD_EXPIRATION,
        },
      )
    } catch (error) {
      this.handleError(error, 'getPutUrl')
    }
  }

  public async deleteObject({ bucket, key }: BaseS3MethodProps) {
    try {
      return await this.s3.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      )
    } catch (error) {
      this.handleError(error, 'deleteObject')
    }
  }

  public async deleteManyObjects({
    bucket,
    keys,
  }: {
    bucket: string
    keys: string[]
  }) {
    try {
      return await this.s3.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: keys.map((key) => ({ Key: key })),
          },
        }),
      )
    } catch (error) {
      this.handleError(error, 'deleteManyObjects')
    }
  }

  public async copyObject({
    bucket,
    key,
    copySource,
  }: BaseS3MethodProps & { copySource: string }) {
    try {
      return await this.s3.send(
        new CopyObjectCommand({
          Bucket: bucket,
          Key: key,
          CopySource: copySource, // Example: `${sourceBucket}/${sourceKey}`
        }),
      )
    } catch (error) {
      this.handleError(error, 'copyObject')
    }
  }

  public async getMultipartPutUrl({
    bucket,
    key,
    size,
  }: BaseS3MethodProps & { size: number }) {
    try {
      const { UploadId } = await this.s3.send(
        new CreateMultipartUploadCommand({ Bucket: bucket, Key: key }),
      )
      const promises = []
      for (let i = 0; i < Math.ceil(size / FILE_CHUNK_SIZE); i++) {
        promises.push(
          getSignedUrl(
            this.s3,
            new UploadPartCommand({
              Bucket: bucket,
              Key: key,
              UploadId,
              PartNumber: i + 1,
            }),
            { expiresIn: UPLOAD_EXPIRATION },
          ).then((url) => ({ url, partNumber: i + 1 })),
        )
      }
      const urls = await Promise.all(promises)
      return { urls, uploadId: UploadId }
    } catch (error) {
      this.handleError(error, 'getMultipartPutUrl')
    }
  }

  public async completeMultipartUpload({
    bucket,
    key,
    uploadId,
    parts,
  }: BaseS3MethodProps & { uploadId: string; parts: MultipartUploadPart[] }) {
    try {
      return await this.s3.send(
        new CompleteMultipartUploadCommand({
          Bucket: bucket,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: { Parts: parts },
        }),
      )
    } catch (error) {
      this.handleError(error, 'completeMultipartUpload')
    }
  }

  public async abortMultipartUpload({
    bucket,
    key,
    uploadId,
  }: BaseS3MethodProps & { uploadId: string }) {
    try {
      await this.s3.send(
        new AbortMultipartUploadCommand({
          Bucket: bucket,
          Key: key,
          UploadId: uploadId,
        }),
      )
    } catch (error) {
      this.handleError(error, 'abortMultipartUpload')
    }
  }

  public async getGetUrl({
    bucket,
    key,
    expiresIn = DOWNLOAD_EXPIRATION,
    filename,
  }: BaseS3MethodProps & { expiresIn: number; filename?: string }) {
    try {
      return await getSignedUrl(
        this.s3,
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
          ResponseContentDisposition: filename
            ? `attachment; filename="${filename}"`
            : undefined,
        }),
        { expiresIn },
      )
    } catch (error) {
      this.handleError(error, 'getGetUrl')
    }
  }

  public async downloadFile({
    bucket,
    key,
  }: BaseS3MethodProps): Promise<Readable> {
    try {
      const { Body } = await this.s3.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      )
      return Body as Readable
    } catch (error) {
      this.handleError(error, 'downloadFile')
    }
  }

  public async checkFileExists({ bucket, key }: BaseS3MethodProps) {
    try {
      return await this.s3.send(
        new HeadObjectCommand({
          Key: key,
          Bucket: bucket,
        }),
      )
    } catch (error) {
      this.handleError(error, 'checkFileExists')
    }
  }

  public async listObjects({
    bucket,
    limit,
    cursor,
    prefix,
  }: {
    bucket: string
    limit?: number
    cursor?: string
    prefix?: string
  }) {
    try {
      let isTruncated = true
      let contents: _Object[] = []
      let nextCursor: string | undefined

      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: limit,
        ContinuationToken: cursor,
      })
      while (isTruncated) {
        const { Contents, IsTruncated, NextContinuationToken } =
          await this.s3.send(command)
        if (Contents) contents = contents.concat(Contents)
        isTruncated = IsTruncated ?? false
        nextCursor = NextContinuationToken
        command.input.ContinuationToken = NextContinuationToken
      }

      return { items: contents, nextCursor }
    } catch (error) {
      this.handleError(error, 'listObjects')
    }
  }

  public async moveObject({
    bucket,
    key,
    sourceBucket,
    sourceKey,
  }: BaseS3MethodProps & { sourceBucket: string; sourceKey: string }) {
    try {
      // Copy the object to the new key
      await this.copyObject({
        bucket,
        key,
        copySource: `${sourceBucket}/${sourceKey}`,
      })
      // Delete the original object
      await this.deleteObject({
        bucket: sourceBucket,
        key: sourceKey,
      })
    } catch (error) {
      this.handleError(error, 'moveObject')
    }
  }
}

export const s3 = S3.getInstance()
