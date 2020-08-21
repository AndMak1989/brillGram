const {Builder, By, Key, until} = require('selenium-webdriver');
const fs = require('fs');
const mysql = require('mysql2');
const pool = mysql.createPool({
    connectionLimit: 10,
    host: "bri.mysql.tools",
    user: "bri_brillgram",
    database: "bri_brillgram",
    password: "P2pYxvC36g4P"
}).promise();
const accounts = [
    'luce_sposa',
    //'elena.vasylkova_official',
];



(async function example() {
    let driver = await new Builder().forBrowser('chrome').build();

    for await (let account_item of accounts) {

        try {
            await driver.get('http://www.google.com/');
            await driver.findElement(By.name('q')).sendKeys(`instagram ${account_item}`, Key.RETURN);
            await driver.wait(until.elementLocated(By.css('#search')));
            const firstLink = await driver.findElement(By.css('#search a'));
            firstLink.click();
            await driver.wait(until.elementLocated(By.css('#react-root')));
            const mediasObject = await driver.executeScript("return window._sharedData['entry_data']['ProfilePage'][0]['graphql']['user']['edge_owner_to_timeline_media']['edges']");
            const mediaAll = [];

            for (let mediaItem of mediasObject) {
                let media = {
                    'thumbnail_src': mediaItem['node']['thumbnail_src'],
                    'link': mediaItem['node']['shortcode'],
                    'is_video': mediaItem['node']['is_video']
                };
                mediaAll.push(media)
            }
            await insertMediaData(account_item, mediaAll);
            await driver.executeScript("window.scrollBy(0,1000)");
            const anyLinkClick = await driver.findElement(By.css('#react-root a'));
            anyLinkClick.click();
            await driver.wait(until.elementLocated(By.css('body')));
        } catch (e) {

            console.warn(e.message);
            fs.appendFileSync("error-log.txt", e.message)
        }
    }
})();


async function insertMediaData(accountName, medias) {
    //pool.execute("INSERT INTO account_content SET age=age+1 WHERE name=?", ["Stan"])
    const  mediasSerialized = JSON.stringify(medias);
    await pool.execute("UPDATE account_table SET account_table.account_content=? WHERE account_table.account_name = ? ", [mediasSerialized, accountName]) // изменение объектов
        .catch(function (err) {
            fs.writeFileSync("error-log.txt", err.message)
        });
}
