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
const preloadFile = fs.readFileSync('./preload.js', 'utf8');

const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--window-position=0,0',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-spki-list',
    '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'
];

const options = {
    args,
    headless: true,
    ignoreHTTPSErrors: true
};
(async () => {
    const browser = await puppeteer.launch(options);

    const page = await browser.newPage();

    await page.evaluateOnNewDocument(preloadFile);

    await page.goto('https://www.instagram.com/accounts/login/', {waitUntil: 'networkidle2'});

    await page.type('[name="username"]', `u.food_9708`);

    await page.type('[name="password"]', `Qqwerty2121`);

    await page.keyboard.press(String.fromCharCode(13));

    await page.waitForSelector('#react-root');

    await page.keyboard.press(String.fromCharCode(13));
    // await page.evaluate(() => {
    //     const rest = document.querySelector("button");
    //     console.log(rest);
    //     rest.click()
    // });
    await page.waitForNavigation({waitUntil: 'networkidle0'});
    await page.keyboard.press("Tab");

    await page.keyboard.press(String.fromCharCode(13));

    await page.waitForNavigation({waitUntil: 'networkidle0'});
    await page.keyboard.press("Tab");

    await page.keyboard.press(String.fromCharCode(13));
    await page.screenshot({path: 'insta-' + Math.random() + ".png"});
    // await browser.close();

    await page.waitForSelector('#react-root');


    ////////////////////////////////////////////////////////////////
    for await (let account_item of accounts) {

        try {
            ////////////////////////////////////////////

            await page.goto('http://www.google.com/', {waitUntil: 'networkidle2'});

            await page.type('[name="q"]', `instagram ${account_item}`);

            await page.keyboard.press(String.fromCharCode(13));

            await page.waitForSelector('#search');

            await page.click('#search a');
            await page.waitForNavigation({waitUntil: 'networkidle0'});

            const sharedData = await page.evaluate(() => {
                return window._sharedData
            });


            await page.screenshot({path: 'buddy-' + Math.random() + ".png"});

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
