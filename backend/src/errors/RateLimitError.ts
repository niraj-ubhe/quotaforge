import AppError from "./AppError";

class RateLimitError extends AppError {
  constructor(message = "Rate limit exceeded") {
    super(message, 429);
  }
}

export default RateLimitError;
