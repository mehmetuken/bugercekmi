const Redis = require("ioredis");
const { Queue, Worker } = require("bullmq");
const { Signale } = require("signale");

const config = require("./config");
const Twitter = require("./twitter");
const Screenshot = require("./screenshot");

class Processer {
  constructor() {
    this.logger = new Signale({ scope: "Processer" });

    const redisConnection = new Redis(config.REDIS_URL);

    this.queue = new Queue("Tweet", { connection: redisConnection });

    this.worker = new Worker("Tweet", job => this.process(job), {
      connection: redisConnection
    });

    this.worker.on("failed", (job, err) => {
      this.logger.error("Failed Job", job.data.tweetId, err);
    });

    this.twitterClient = new Twitter();
    this.screenshotManager = new Screenshot();

    this.twitterClient
      .createStream(config.TWITTER.STREAM_TEXT)
      .on("tweet", tweet => this.addQueue(tweet));
  }

  async init() {
    await this.screenshotManager.init();
  }

  async addQueue(tweet) {
    this.logger.info(
      `New Tweet From ${tweet.user.screen_name} Tweet Id: ${tweet.id_str}`
    );

    this.logger.info(`Tweet adding queue. Tweet Id: ${tweet.id_str}`);
    if (!tweet.in_reply_to_status_id_str) {
      this.logger.info(`Tweet not reply. Tweet Id: ${tweet.id_str}`);
      await this.queue.add("help", {
        username: tweet.user.screen_name,
        tweetId: tweet.id_str
      });
    } else {
      await this.queue.add("reply", {
        username: tweet.user.screen_name,
        tweetId: tweet.id_str,
        replyId: tweet.in_reply_to_status_id_str
      });
    }
  }

  async process(job) {
    this.logger.info(`Start processing tweet. Tweet Id: ${job.data.replyId}`);

    if (job.name == "reply") {
      await this.processReply(job);
    } else if (job.name == "help") {
      await this.processHelp(job);
    }
  }

  async processReply(job) {
    const tweetImageUrl = await this.twitterClient.getTweetMediaUrl(
      job.data.replyId
    );

    if (tweetImageUrl) {
      const shot = await this.screenshotManager.takeShot(tweetImageUrl);
      if (!shot) return;

      const mediaId = await this.twitterClient.uploadImage(shot.image);
      if (!mediaId) return;

      let status = `@${job.data.username} Bunları buldum.`;
      if (shot.searchText) {
        status += `\nİlgili kelimeler: ${shot.searchText}`;
      }

      const replyTweet = await this.twitterClient.sendReply(
        status,
        job.data.tweetId,
        mediaId
      );
    } else {
      const replyTweet = await this.twitterClient.sendReply(
        `@${job.data.username} Şimdilik sadece resimleri kontrol ediyorum.`,
        job.data.tweetId
      );
    }
  }

  async processHelp(job) {
    const status = `@${job.data.username} Resim bulunan bir tweete beni etiketlersen yardımcı olabilirim.`;
    const replyTweet = await this.twitterClient.sendReply(
      status,
      job.data.tweetId
    );
  }

  async dispose() {
    this.screenshotManager.dispose();
  }
}

module.exports = Processer;
