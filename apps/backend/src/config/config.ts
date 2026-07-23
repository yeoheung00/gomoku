import 'dotenv/config'

export const PORT = parseInt(process.env.PORT ?? "4000");
export const CLIENT_ORIGINS = process.env.CLIENT_ORIGINS?.split(',') ?? ["http://localhost:3000", "http://127.0.0.1:3000"];
export const SECRET_KEY = process.env.SECRET_KEY ?? "SUPER_SECRET_KEY";
export const getAccessTokenConfig = (isFromToken: boolean): string | number => {
  const BUFFER_MS = 2000;
  const accessTokenExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN ?? "10s";
  const match = accessTokenExpiresIn.match(/(\d+)(s|m|h|d)/);
    if (!match) return isFromToken ? accessTokenExpiresIn : 10000; // 기본값 처리

    const value = parseInt(match[1]);
    const unit = match[2];

    // 각 단위를 밀리초(ms)로 변환하는 배수
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    const msValue = value * multipliers[unit] + BUFFER_MS;
  return isFromToken ? accessTokenExpiresIn : msValue;
};
