import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'oscar-dev-secret-change-me',
  jwtExpiresIn: '7d',
  database: {
    url: process.env.DATABASE_URL,
  },
};
