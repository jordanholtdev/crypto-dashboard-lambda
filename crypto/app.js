const axios = require('axios');
// create a connection to the db
const knex = require('knex')({
    client: 'mysql',
    connection: {
        host: process.env.MySqlHost,
        port: 3306,
        user: process.env.DbUser,
        password: process.env.DbPw,
        database: process.env.DbName,
    },
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

// get data on specifc coins
async function getCoinData(coin) {
    const url = `https://api.coingecko.com/api/v3/coins/${coin}`;

    let config = {
        params: {
            localization: false,
            sparkline: true,
            community_data: true,
            developer_data: false,
        },
    };
    return axios.get(url, config);
}

// get all data and modify for use
async function getAllData() {
    let allData;
    try {
        await Promise.all([
            getCoinData('bitcoin'),
            getCoinData('ethereum'),
            getCoinData('tether'),
            getCoinData('usd-coin'),
            getCoinData('binancecoin'),
            getCoinData('ripple'),
            getCoinData('binance-usd'),
            getCoinData('cardano'),
            getCoinData('solana'),
            getCoinData('dogecoin'),
        ]).then((results) => {
            allData = [
                results[0].data,
                results[1].data,
                results[2].data,
                results[3].data,
                results[4].data,
                results[5].data,
                results[6].data,
                results[7].data,
                results[8].data,
                results[9].data,
            ];
        });
    } catch (error) {
        console.error(error);
    }
    return allData;
}

exports.lambdaHandler = async (event, context) => {
    try {
        const data = await getAllData();
        // loop through coins and insert into db
        for (const coin of data) {
            await knex('coin_price').insert({
                coin_id: coin.id,
                name: coin.name,
                image: coin.image.thumb,
                cg_liquidity_score: coin.liquidity_score,
                market_cap: coin.market_data.market_cap.usd,
                total_volume: coin.market_data.total_volume.usd,
                price_usd: coin.market_data.current_price.usd,
                price_change_percentage_24h: coin.market_data.price_change_percentage_24h,
                price_change_24h: coin.market_data.price_change_24h,
                last_updated: coin.market_data.last_updated,
            });
        }
        return 'complete';
    } catch (error) {
        console.error(error);
    }
};
