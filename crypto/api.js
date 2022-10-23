// update the env vars for the knex function
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

const coinPath = '/coin';
const coinsPath = '/coins';
const infoPath = '/coin/info';
const portfolioPath = '/portfolio';



exports.handler = async (event) => {
    let response;
    switch (true) {
        case event.httpMethod === 'GET' && event.path === coinPath:
            response = await getCoin(event.queryStringParameters.id);
            break;
        case event.httpMethod === 'GET' && event.path === coinsPath:
            response = await getCoins();
            break;
        case event.httpMethod === 'GET' && event.path === infoPath:
            response = await getCoinInfo(event.queryStringParameters.id);
            break;
        case event.httpMethod === 'GET' && event.path === portfolioPath:
            response = await getPortfolio();
    }
    return response;
};

function buildResponse(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            "x-custom-header": "my custom header value",
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    }
};

// handle the coin route. return single coin information
async function getCoin(id) {
    const coinPrice = await knex.select('*').from('coin_price').limit(48).where('coin_id', id).orderBy('created_date', 'asc');
    return buildResponse(200, coinPrice)
};

// handle the coins path. Return all coin price data
async function getCoins() {
    let data;
    const allCoins = await knex.select('*').from('coin_price').orderBy([
        { column: 'created_date', order: 'desc' },
        { column: 'price_usd', order: 'desc' }
    ]).limit(50);
    const allPrices = await knex.select('price_usd', 'coin_id', 'created_date').from('coin_price').limit(48).orderBy('created_date', 'desc');
    data = {
        coins: allCoins,
        prices: allPrices
    }
    return buildResponse(200, data);
};

// handle portfolio route.
async function getPortfolio() {
    let portfolio;
    const activity = await knex.select('*').from('holdings').orderBy([
        { column: 'purchase_date', order: 'desc' }
    ])
    // Group and sum current holdings & purchase price
    const holdings = await knex('holdings')
        .select({ name: 'coin_id' })
        .sum({ amount: 'purchase_amount' })
        .groupBy('coin_id')

    const currentPrice = await knex.select('*').from('coin_price').orderBy([
        { column: 'created_date', order: 'desc' }
    ]).limit(10);

    portfolio = {
        activity: activity,
        holdings: holdings,
        currentPrice: currentPrice
    }
    return buildResponse(200, portfolio);
};

// handle the coin/info route
async function getCoinInfo(id) {
    let info;
    const coinInfo = await knex.select('*').from('coin_info').where('coin_id', id);
    const price = await knex.select('*').from('coin_price').limit(48).where('coin_id', id).orderBy('created_date', 'asc');

    info = {
        info: coinInfo,
        price: price,
    }
    return buildResponse(200, info);
};
