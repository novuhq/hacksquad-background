import axios from "axios";

export const loadSheet = async (): Promise<string[]> => {
    try {
        const {data} = await axios.get('https://docs.google.com/spreadsheets/d/1T8wzktxoPuQgaw9365q11FYK0KDXJ6xyIj4z9Bk6mrs/gviz/tq?tqx=out:csv&gid=0');
        const sheet = await data.split("\n").map((row: string) => {
            return row.split('"')[1].split('"')[0];
        });

        return sheet.slice(2);
    }
    catch (err) {
        return [];
    }
}