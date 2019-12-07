require("dotenv").config();

module.exports = {
  REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  TWITTER: {
    CONSUMER_KEY: process.env.TWITTER_CONSUMER_KEY,
    CONSUMER_SECRET: process.env.TWITTER_CONSUMER_SECRET,
    ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN,
    ACCESS_TOKEN_SECRET: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    STREAM_TEXT: process.env.TWITTER_STREAM_TEXT
  }
};
