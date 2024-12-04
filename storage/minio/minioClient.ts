import * as minio from 'minio'
import { env } from '@env'

const MinioClient: minio.Client = new minio.Client({
  endPoint: env.S3_UPLOAD_ENDPOINT,
  useSSL: true,
  accessKey: env.S3_UPLOAD_KEY,
  secretKey: env.S3_UPLOAD_SECRET,
})

const MinioClientFunc = (env: Record<string, string>): minio.Client =>
  new minio.Client({
    endPoint: env.S3_UPLOAD_ENDPOINT,
    useSSL: true,
    accessKey: env.S3_UPLOAD_KEY,
    secretKey: env.S3_UPLOAD_SECRET,
  })

export { MinioClient, MinioClientFunc }
