const trpcResponse = {
  fail: (message: string, error?: any) => {
    let errorMessage: string = ''
    if (
      typeof error === 'object' &&
      error &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      if (process.env.NODE_ENV !== 'production') console.log(error)
      errorMessage = error.message
    }

    return {
      success: false,
      message,
      error: errorMessage,
    }
  },
  success: (message: string, data?: { data?: any; metadata?: any }) => ({
    success: true,
    message,
    ...(data && data.data && { data: data.data }),
    ...(data && data.metadata && { _metaData: data.metadata }),
  }),
}

export { trpcResponse }
