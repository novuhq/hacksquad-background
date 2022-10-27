import { CronService, QueueService } from "./services/runner/runner.service";
import "cli-color";
import {config} from 'dotenv'
import {ScoreCron} from "./runners/cron/score.cron";
import {ScoreQueue} from "./runners/queues/score.queue";
import {TeamCron} from "./runners/cron/team.cron";
import {TeamQueue} from "./runners/queues/team.queue";
import {LikeRetweetCron} from "./runners/cron/like.retweet.cron";
import {LikeRetweetQueue} from "./runners/queues/like.retweet.queue";
import {PrUpdateLogsCron} from "./runners/cron/pr.update.logs.cron";
import {PrUpdateLogsQueue} from "./runners/queues/pr.update.logs.queue";
import {UpdateWinnersCron} from "./runners/cron/update.winners.cron";
import {UpdateWinnersQueue} from "./runners/queues/update.winners.queue";
import {DevToArticlesCron} from "./runners/cron/dev.to.articles.cron";
import {NovuCron} from "./runners/cron/novu.cron";

config();

(async () => {
    CronService([
      // new DevToArticlesCron(),
      // new LikeRetweetCron(),
      // new ScoreCron(),
      // new TeamCron(),
      // new PrUpdateLogsCron(),
      // new UpdateWinnersCron()
        new NovuCron()
  ]);

  QueueService([
      // new ScoreQueue(),
      // new TeamQueue(),
      // new LikeRetweetQueue(),
      // new PrUpdateLogsQueue(),
      // new UpdateWinnersQueue()
  ]);
})();
