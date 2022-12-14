import {CronAbstract} from "../runners.interface";
import {prisma} from "../../services/database/connection";
import axios from "axios";
import moment from "moment";
import {chunk, shuffle} from 'lodash';
export class LikeRetweetCron extends CronAbstract<{id: string, tweets: string[]}> {
    name() {
        return "Like and Retweet Now";
    }

    schedule() {
        return '0 * * * *';
    }

    autostart(): boolean {
        return false;
    }

    start = async (page =  1, perPage = 10) => {
         const {data: {data}} = await axios.get('https://api.twitter.com/2/tweets/search/recent?query=from:HackSquadDev+-is:reply&tweet.fields=created_at', {
             headers: {
                 // 'Content-Type': 'application/x-www-form-urlencoded',
                 Authorization: `Bearer ${process.env.TWITTER_AUTH}`,
             },
         });

         const tweets = data.filter((f: any) => {
             return moment().subtract(1, 'hour').isBefore(moment(f.created_at));
         }).map((p: any) => p.id);

        const all = await prisma.social.findMany({
        });


        const list = shuffle(all).slice(0, 20);

        const chunkIt = chunk(list, 49);
        let delay = 0;
        for (let c of chunkIt) {
            await Promise.all(c.map(l => this.pushQueue({id: l.id, tweets}, delay)));
            delay += 1200000;
        }
    }

    async handle() {
        await this.start();
    }
}