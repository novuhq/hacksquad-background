import {QueueInterface} from "../runners.interface";
import axios from "axios";
import {prisma} from "../../services/database/connection";
import {stringify} from "querystring";

export class LikeRetweetQueue implements QueueInterface<{id: string, tweets: string[]}> {
    name() {
        return "Like and Retweet Nowz";
    }

    numWorkers() {
        return 5;
    }

    async getMe(accessToken: string) {
        const {
            data: {data: {id}},
        } = await axios.get(`https://api.twitter.com/2/users/me`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return id;
    }

    async getRefreshToken(refreshToken: string) {
        try {
            const {
                data: {
                    access_token,
                    refresh_token
                }
            }
             = await axios.post(`https://api.twitter.com/2/oauth2/token`,
                stringify({
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token',
                    client_id: process.env.TWITTER_CLIENT
                }), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Authorization: `Basic ${Buffer.from(process.env.TWITTER_USER_AUTH!).toString('base64')}`,
                    }
                });
            return {access_token, refresh_token};
        }
        catch (err) {
            console.log(err);
            return {access_token: '', refresh_token: ''};
        }
    }

    async handle(arg: {id: string, tweets: string[]}) {
        const social = await prisma.social.findFirst({
            where: {
                type: 'TWITTER',
                id: arg.id
            }
        });

        if (!social) {
            console.log('no social');
            return ;
        }


        const id = await (async () => {
            try {
                const id = await this.getMe(social.accessToken);
                return id;
            }
            catch (err) {
                const {access_token, refresh_token} = await this.getRefreshToken(social.refreshToken);
                if (access_token) {
                    console.log('Got new access token');
                    await prisma.social.update({
                        where: {
                            id: arg.id
                        },
                        data: {
                            accessToken: access_token,
                            refreshToken: refresh_token
                        }
                    })
                    social.accessToken = access_token;
                    const id = await this.getMe(social.accessToken);
                    return id;
                }
            }
        })();

        if (!id) {
            return ;
        }

        await Promise.all(arg.tweets.map(async tweet => {
            try {
                await axios.post(`https://api.twitter.com/2/users/${id}/likes`, {
                    "tweet_id": tweet
                }, {
                    headers: {
                        // 'Content-Type': 'application/x-www-form-urlencoded',
                        Authorization: `Bearer ${social.accessToken}`,
                    },
                });
            }
            catch (err) {

            }
            try {
                await axios.post(`https://api.twitter.com/2/users/${id}/retweets`, {
                    "tweet_id": tweet
                }, {
                    headers: {
                        // 'Content-Type': 'application/x-www-form-urlencoded',
                        Authorization: `Bearer ${social.accessToken}`,
                    },
                });
            }
            catch (err) {
                console.log(err);
            }
        }));
    }
}