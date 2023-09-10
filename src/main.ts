import { CronService, QueueService } from "./services/runner/runner.service";
import "cli-color";
import {config} from 'dotenv'
import {ScoreCron} from "./runners/cron/score.cron";
import {ScoreQueue} from "./runners/queues/score.queue";
import {UpdateWinnersCron} from "./runners/cron/update.winners.cron";
import {UpdateWinnersQueue} from "./runners/queues/update.winners.queue";
import {DevToArticlesCron} from "./runners/cron/dev.to.articles.cron";
import {NovuCron} from "./runners/cron/novu.cron";

config();

(async () => {
    CronService([
      // new DevToArticlesCron(),
      new ScoreCron(),
      // new UpdateWinnersCron(),
      // new NovuCron()
  ]);

  QueueService([
      new ScoreQueue(),
      // new UpdateWinnersQueue()
  ]);
})();
