import {QueueInterface} from "../runners.interface";
import axios from "axios";
import {prisma} from "../../services/database/connection";
import {stringify} from "querystring";
import {timer} from "../../services/helpers/timer";
import moment from "moment";
import sendOneNotification from "../../services/helpers/send-one-notification";

export class UpdateWinnersQueue implements QueueInterface<string> {
    name() {
        return "Update Winners";
    }

    numWorkers() {
        return 1;
    }

    async handle(team: string) {
       const users = await prisma.user.findMany({
           where: {
               teamId: team,
               disqualified: false,
               score: {
                   gt: 0
               }
           }
       });

       for (const user of users) {
           try {
               await prisma.winners.create({
                   data: {
                       userId: user.id,
                       type: 'COMPETITION',
                       lastDateClaim: moment().add(1, 'month').toDate(),
                       month: +moment().format('MM'),
                       year: +moment().format('YYYY')
                   }
               });
               sendOneNotification('winner', {}, {id: user.id, email: user.email!});
           }
           catch (err) {
           }

       }
    }
}