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

    config = {
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

    config = {
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
        await Promise.all([getCoinData('bitcoin'), getCoinData('ethereum'), getCoinData('tether'), getCoinData('cardano'), getCoinData('ontology'), getCoinData('ripple'), getCoinData('dai'), getCoinData('litecoin'), getCoinMarketData()])
            .then((results => {
                allData = {
                    bitcoin: results[0].data,
                    ethereum: results[1].data,
                    tether: results[2].data,
                    cardano: results[3].data,
                    ontology: results[4].data,
                    ripple: results[5].data,
                    dai: results[6].data,
                    litecoin: results[7].data,
                    marketData: results[8].data
                }
            }))

    } catch (error) {
        console.error(error)
    }
    return allData;
}

// test the connection
let counter = 0;


exports.lambdaHandler = async (event, context) => {

    try {
        const data = await getAllData()
        console.log(data.bitcoin.market_data.current_price.cad)
        counter++
        await knex('vals').insert({
            key: `coin: ${data.bitcoin.id}`,
            val: data.bitcoin.market_data.current_price.cad,
        });
        const res = await knex('vals').select();
        console.log(res)
    } catch (error) {
        console.error(error)
    }

};
