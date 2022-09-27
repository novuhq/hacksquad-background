import { CronService, QueueService } from "./services/runner/runner.service";
import "cli-color";
import {config} from 'dotenv'
import {ScoreCron} from "./runners/cron/score.cron";
import {ScoreQueue} from "./runners/queues/score.queue";

config();

(async () => {
    CronService([
      new ScoreCron()
  ]);

  QueueService([
      new ScoreQueue()
  ]);
})();
