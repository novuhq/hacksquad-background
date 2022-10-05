import {QueueInterface} from "../runners.interface";
import axios from "axios";
import {prisma} from "../../services/database/connection";

export class LikeRetweetQueue implements QueueInterface<{id: string, tweets: string[]}> {
    name() {
        return "Like and Retweetz";
    }

    numWorkers() {
        return 5;
    }

    async handle(arg: {id: string, tweets: string[]}) {
        const social = await prisma.social.findFirst({
            where: {
                type: 'TWITTER',
                id: arg.id
            }
        });

        if (!social) {
            return ;
        }


        const {
            data: { id },
        } = await axios.get(`https://api.twitter.com/2/users/me`, {
                headers: {
                    Authorization: `Bearer ${social.accessToken}`,
                },
            });

        await Promise.all(arg.tweets.map(async tweet => {
            try {
                await axios.post(`https://api.twitter.com/2/users/${id}/likes`, {
                    "tweet_id": tweet
                }, {
                    headers: {
                        // 'Content-Type': 'application/x-www-form-urlencoded',
                        Authorization: `Bearer ${process.env.TWITTER_AUTH}`,
                    },
                });
            }
            catch (err) {
                console.log(err);
            }
            try {
                await axios.post(`https://api.twitter.com/2/users/${id}/retweets`, {
                    "tweet_id": tweet
                }, {
                    headers: {
                        // 'Content-Type': 'application/x-www-form-urlencoded',
                        Authorization: `Bearer ${process.env.TWITTER_AUTH}`,
                    },
                });
            }
            catch (err) {
                console.log(err);
            }
        }));
    }
}