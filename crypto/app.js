const axios = require('axios');
// create a connection to the db
const knex = require('knex')({
    client: 'mysql',
    connection: {
        host: process.env.MySqlHost,
        port: 3306,
        user: process.env.DbUser,
        password: process.env.DbPw,
        database: process.env.DbName
    }
});

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

// get market data on 100 coins with top market cap
async function getCoinMarketData() {
    const url = `https://api.coingecko.com/api/v3/coins/markets`;

    let config = {
        params: {
            vs_currency: "usd",
            order: "market_cap_desc",
            per_page: "100",
            page: 1,
            sparkline: false
        }
    }

    return axios.get(url, config)

}

// get data on specifc coins
async function getCoinData(coin) {
    const url = `https://api.coingecko.com/api/v3/coins/${coin}`;

    let config = {
        params: {
            localization: false,
            sparkline: true,
            community_data: true,
            developer_data: false
        }
    }
    return axios.get(url, config)
}

// get all data and modify for use
async function getAllData() {
    let allData;
    try {
        await Promise.all([getCoinData('bitcoin'), getCoinData('ethereum'), getCoinData('tether'), getCoinData('cardano'), getCoinData('ontology'), getCoinData('ripple'), getCoinData('dai'), getCoinData('litecoin')])
            .then((results => {
                allData = [
                    results[0].data,
                    results[1].data,
                    results[2].data,
                    results[3].data,
                    results[4].data,
                    results[5].data,
                    results[6].data,
                    results[7].data,
                ]
            }))

    } catch (error) {
        console.error(error)
    }
    return allData;
}

exports.lambdaHandler = async (event, context) => {

    try {
        let d = new Date()
        const data = await getAllData();
        // loop through coins and insert into db
        for (const coin of data) {
            await knex('coins').insert({
                id: coin.id,
                symbol: coin.symbol,
                block_time_in_minutes: coin.block_time_in_minutes,
                description: coin.description.en,
                image: coin.image.small,
                market_cap_rank: coin.market_cap_rank,
                cg_liquidity_score: coin.liquidity_score,
                genesis_date: coin.genesis_date,
                last_updated: coin.last_updated,
                created_date: d.toISOString()
            });
        }

        const res = await knex('coins').select('created_date');
        console.log(res)
    } catch (error) {
        console.error(error)
    }

};
