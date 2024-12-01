type tUploadResult = {
  key: string
}

type tUploadToS3 = (
  file: File | ArrayBuffer,
  fileName: string,
  bucketSuffix: string | undefined,
  metadata?: Record<string, string>,
) => Promise<tUploadResult>

const presignedUpload: tUploadToS3 = async (
  file,
  dir,
  bucketSuffix = undefined,
) => {
  const fetchUrl = `/api/upload/presigned?name=${dir}${bucketSuffix ? `&bucketSuffix=${bucketSuffix}` : ''}`

  const res = await fetch(fetchUrl)
  if (!res.ok) {
    throw new Error('Failed to get presigned upload url')
  }
  const data = await res.json()

  if ('error' in data) {
    console.error(data.error)
    throw data.error
  }

  const { key, url } = data

  const xhr = new XMLHttpRequest()

  await new Promise((resolve) => {
    xhr.addEventListener('loadend', () => {
      const success = xhr.readyState === 4 && xhr.status === 200
      if (!success) resolve(false)
      resolve(success)
    })
    xhr.addEventListener('error', () => {
      resolve(false)
    })
    xhr.addEventListener('abort', () => {
      resolve(false)
    })
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', 'application/octet-stream')
    xhr.send(file)
  })

  return { key }
}

export { presignedUpload }
