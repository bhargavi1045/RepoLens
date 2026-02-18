const SECRET_PATTERNS = [
  /(?:api[_-]?key|apikey)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{16,}['"]?/gi,
  /(?:secret|token|password|passwd|pwd)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{8,}['"]?/gi,
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  /sk-[A-Za-z0-9]{32,}/g,
  /ghp_[A-Za-z0-9]{36}/g,
];

export const sanitizeCode = (code: string): string => {
  let sanitized = code;
  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
};