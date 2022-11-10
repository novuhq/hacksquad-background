import {prisma} from "./services/database/connection";
import moment from "moment";

(async () => {
    const add = await prisma.user.findFirst({
        where: {
            handle: process.argv[2]
        }
    });

    if (!add) {
        console.log('cannot find the winners');
        return ;
    }

    await prisma.winners.create({
        data: {
            userId: add?.id!,
            month: moment().month(),
            year: moment().year(),
            lastDateClaim: moment().add(2, 'month').toDate(),
            type: 'EXTRA'
        }
    });
})();