declare global {
  namespace Express {
    interface Request {
      googleAuth?: any;
      googleAccount?: {
        id: string;
        email: string;
        label: string | null;
        accessToken: string;
        refreshToken: string;
        tokenExpiry: Date;
        scopes: string[];
        filterRules: any;
        lastGmailFetch: Date | null;
        isDefault: boolean;
      } | null;
    }
  }
}

export {};
