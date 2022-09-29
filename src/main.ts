import { CronService, QueueService } from "./services/runner/runner.service";
import "cli-color";
import {config} from 'dotenv'
import {ScoreCron} from "./runners/cron/score.cron";
import {ScoreQueue} from "./runners/queues/score.queue";
import {TeamCron} from "./runners/cron/team.cron";
import {TeamQueue} from "./runners/queues/team.queue";

config();

(async () => {
    CronService([
      new ScoreCron(),
      new TeamCron()
  ]);

  QueueService([
      new ScoreQueue(),
      new TeamQueue()
  ]);
})();
