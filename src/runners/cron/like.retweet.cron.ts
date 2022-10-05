import {CronAbstract} from "../runners.interface";
import {prisma} from "../../services/database/connection";
import axios from "axios";
import moment from "moment";

export class LikeRetweetCron extends CronAbstract<{id: string, tweets: string[]}> {
    name() {
        return "Like and Retweet Now";
    }

    schedule() {
        return '0 * * * *';
    }

     start = async (page =  1, perPage = 10) => {
         const {data: {data}} = await axios.get('https://api.twitter.com/2/tweets/search/recent?query=from:HackSquadDev+-is:retweet&tweet.fields=created_at', {
             headers: {
                 // 'Content-Type': 'application/x-www-form-urlencoded',
                 Authorization: `Bearer ${process.env.TWITTER_AUTH}`,
             },
         });

         const tweets = data.filter((f: any) => {
             return moment().subtract(1, 'hour').isBefore(moment(f.created_at));
         }).map((p: any) => p.id);

        const list = await prisma.social.findMany({
        });

        list.map(l => this.pushQueue({id: l.id, tweets}));
    }

    async handle() {
        await this.start();
    }
}