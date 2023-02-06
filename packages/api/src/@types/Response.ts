type Response = {
  success: boolean;
  error?: string;
  errorDetails?: { message: string };
};

export default Response;
