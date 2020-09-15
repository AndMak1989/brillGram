const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const mysql = require('mysql2');
const moment = require('moment');
puppeteer.use(StealthPlugin());

const format = "YYYY-MM-DD HH:mm:ss";


const pool = mysql.createPool({
    connectionLimit: 10,
    host: "185.69.155.15",
    user: "makand",
    database: "brill_gram_db",
    password: "And#rew#123#"
}).promise();

const accounts = [
    'luce_sposa',
    'elena.vasylkova_official',
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
    headless: false,
    ignoreHTTPSErrors: true
};

(async () => {
    const browser = await puppeteer.launch(options);

    const page = await browser.newPage();

    await page.evaluateOnNewDocument(preloadFile);

    await page.goto('https://www.instagram.com/accounts/login/', {waitUntil: 'networkidle2'});

    await page.screenshot({path: 'last-photo.png'});

    await page.type('[name="username"]', `flook_che`);

    await page.type('[name="password"]', `Qqwerty2121`);

    await page.keyboard.press(String.fromCharCode(13));

    await page.waitForSelector('#react-root');

    await page.keyboard.press(String.fromCharCode(13));

    await page.waitForNavigation({waitUntil: 'networkidle0'});

    await page.keyboard.press("Tab");

    await page.keyboard.press(String.fromCharCode(13));

    await page.waitForNavigation({waitUntil: 'networkidle0'});

    await page.keyboard.press("Tab");

    await page.keyboard.press(String.fromCharCode(13));

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
            await page.screenshot({path: 'buddy-screenshot.png'});
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
            const dateTime = moment(Date.now()).format(format);
            await insertMediaData(account_item, mediaAll, dateTime);

        } catch (e) {

            console.warn(e.message);
            fs.appendFileSync("error-log.txt", `\n ${e.message}`)
        }

    }
    await page.close();
    await browser.close();
    await pool.end();
    process.kill(process.pid);
    process.exit(0);
})();

async function insertMediaData(accountName, medias, dateTime) {
    //pool.execute("INSERT INTO account_content SET age=age+1 WHERE name=?", ["Stan"])
    const mediasSerialized = JSON.stringify(medias);

    await pool.execute("UPDATE account_table SET account_table.account_content=?, account_table.last_update = ? WHERE account_table.account_name = ? ", [mediasSerialized, dateTime, accountName]) // изменение объектов
        .catch(function (err) {
            console.warn(err.message);
            fs.writeFileSync("error-log.txt", `\n err.message`)
        });
}

