const Twit = require("twit");
const { Signale } = require("signale");
const config = require("./config");

const LOG_KEY = "TwitterClient";

class TwitterClient {
  constructor() {
    this.logger = new Signale({ scope: LOG_KEY });
    try {
      this.client = new Twit({
        consumer_key: config.TWITTER.CONSUMER_KEY,
        consumer_secret: config.TWITTER.CONSUMER_SECRET,
        access_token: config.TWITTER.ACCESS_TOKEN,
        access_token_secret: config.TWITTER.ACCESS_TOKEN_SECRET
      });
    } catch (error) {
      this.logger.error(error);
      process.exit(0);
    }
  }

  createStream(filterText) {
    this.logger.info(`Create stream '${filterText}'.`);
    return this.client.stream("statuses/filter", { track: filterText });
  }

  async getTweetDetails(tweetId) {
    this.logger.info(`Fetching tweet details. Tweet Id: ${tweetId}`);
    const response = await this.client.get("statuses/show/:id", {
      id: tweetId,
      tweet_mode: "extended"
    });

    if (response.err) {
      this.logger.error("Error fetching tweet details.", response.err);
      return null;
    }
    return response.data;
  }

  async getTweetMediaUrl(tweetId) {
    this.logger.info(`Get tweet media. Tweet Id: ${tweetId}`);
    const tweet = await this.getTweetDetails(tweetId);

    if (
      tweet &&
      tweet["entities"] &&
      tweet["entities"]["media"] &&
      tweet["entities"]["media"].length > 0
    ) {
      const imageUrl = tweet.entities.media[0].media_url_https;
      this.logger.info(`Tweet Image Url: ${imageUrl}`, `Tweet Id: ${tweetId}`);
      return imageUrl;
    }

    this.logger.info(`Tweet haven't media. Tweet Id: ${tweetId}`);
    return null;
  }

  async sendReply(status, replyId, mediaId = null) {
    this.logger.info(`Reply Status: ${status} Tweet Id: ${replyId}`);

    var params = {
      status: status,
      in_reply_to_status_id: replyId
    };

    if (mediaId) {
      params.media_ids = [mediaId];
    }

    const response = await this.client.post("statuses/update", params);
    if (!response.err) {
      return true;
    }

    return false;
  }

  async uploadImage(image) {
    const response = await this.client.post("media/upload", {
      media_data: image
    });
    if (response.err) {
      return null;
    }
    return response.data.media_id_string;
  }
}

module.exports = TwitterClient;
