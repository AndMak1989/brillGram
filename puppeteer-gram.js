const puppeteer = require('puppeteer');
const fs = require('fs');
const mysql = require('mysql2');
// const pool = mysql.createPool({
//     connectionLimit: 10,
//     host: "bri.mysql.tools",
//     user: "bri_brillgram",
//     database: "bri_brillgram",
//     password: "P2pYxvC36g4P"
// }).promise();
const pool = mysql.createPool({
    connectionLimit: 10,
    host: "localhost",
    user: "root",
    database: "fake_brill_gram",
    password: ""
}).promise();

const accounts = [
    'luce_sposa',
    //'elena.vasylkova_official',
];
(async () => {
    const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
    const page = await browser.newPage();

    for await (let account_item of accounts) {

        try {
            await page.goto('http://www.google.com/', {waitUntil: 'networkidle2'});

            await page.type('[name="q"]', `instagram ${account_item}`);

            await page.keyboard.press(String.fromCharCode(13));

            await page.waitForSelector('#search');

            await page.click('#search a');

            await page.waitForSelector('#fb-root');

            const sharedData = await page.evaluate(() => {
                return window._sharedData
            });

            const mediasObject = sharedData['entry_data']['ProfilePage'][0]['graphql']['user']['edge_owner_to_timeline_media']['edges'];

            const mediaAll = [];

            for (let mediaItem of mediasObject) {
                let media = {
                    'thumbnail_src': mediaItem['node']['thumbnail_src'],
                    'link': mediaItem['node']['shortcode'],
                    'is_video': mediaItem['node']['is_video']
                };
                mediaAll.push(media)
            }

            console.log(mediaAll);
            await insertMediaData(account_item, mediaAll);


        } catch (e) {

            console.warn(e.message);
            fs.appendFileSync("error-log.txt", e.message)
        }


    }
    await browser.close();
    pool.end();
})();

async function insertMediaData(accountName, medias) {
    //pool.execute("INSERT INTO account_content SET age=age+1 WHERE name=?", ["Stan"])
    const mediasSerialized = JSON.stringify(medias);

    await pool.execute("UPDATE account_table SET account_table.account_content=? WHERE account_table.account_name = ? ", [mediasSerialized, accountName]) // изменение объектов
        .catch(function (err) {
            console.warn(e.message);
            fs.writeFileSync("error-log.txt", err.message)
        });
}
