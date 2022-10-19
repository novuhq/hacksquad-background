import {CronAbstract} from "../runners.interface";
import {prisma} from "../../services/database/connection";
import axios from "axios";
import moment from "moment";

export class DevToArticlesCron extends CronAbstract<string> {
    name() {
        return "Dev To Article";
    }

    autostart(): boolean {
        return true;
    }

    schedule() {
        return '0 * * * *';
    }

    async handle() {
        const {data} = await axios.get('https://dev.to/api/articles?username=novu');

        const articles = data.filter((f: any) => moment(f.published_timestamp).isAfter(moment().subtract(7, "day")))
        await Promise.all(articles.map(async (article: any) => {
            try {
                await prisma.articles.create({
                    data: {
                        createdAt: moment(article.published_timestamp).toDate(),
                        articleId: article.id,
                        articleTitle: article.title,
                        articleLink: article.url,
                    }
                })
            }
            catch (err) {}
        }));
    }
}