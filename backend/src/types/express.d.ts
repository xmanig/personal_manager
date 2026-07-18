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
        isDefault: boolean;
      } | null;
    }
  }
}

export {};
