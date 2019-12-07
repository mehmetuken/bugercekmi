const { Signale } = require("signale");

const Processer = require("./processer");

const logger = new Signale({ scope: "Main" });

const main = async () => {
  logger.info("Program start.");
  const processer = new Processer();
  await processer.init();
};

main();
