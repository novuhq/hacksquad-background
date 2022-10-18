import {QueueInterface} from "../runners.interface";
import axios from "axios";
import {prisma} from "../../services/database/connection";
import {stringify} from "querystring";
import {timer} from "../../services/helpers/timer";

export class LikeRetweetQueue implements QueueInterface<string> {
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
               disqualified: false
           }
       });
    }
}