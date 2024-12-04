import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { uuidv7 } from 'uuidv7'
import { s3 } from '../../storage'
import { setResponse } from '../../utils/server/response.status'

export const presignedRoute = async (
  req: Request,
  session: Record<string, any> | null,
) => {
  if (!session || !session.user || !session.user.id) {
    return setResponse.unauthorized()
  }

  try {
    const headersList = headers()
    const _fileType = headersList.get('content-Type')

    const { searchParams } = new URL(req.url)
    const _dir = searchParams.get('dir')
    const _bucketSuffix = searchParams.get('bucketSuffix')

    const imageId = uuidv7()

    const key = `${_dir}.${imageId}.jpg`

    const bucketName = _bucketSuffix
      ? process.env.S3_UPLOAD_BUCKET + '.' + _bucketSuffix
      : process.env.S3_UPLOAD_BUCKET

    const url = await s3.getPutUrl({
      bucket: bucketName!,
      key,
      fileInfo: {
        ...(_fileType && { contentType: _fileType }),
        metadata: {
          'Image-Key': `${_dir}.${imageId}`,
          'User-Id': session.user.id,
        },
      },
    })

    return NextResponse.json({ success: true, url, key: name })
  } catch {
    throw new Error('Get presigned url failed')
  }
}
