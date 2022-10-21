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

const coinsPath = '/coins';
const coinPath = '/coin';
const infoPath = '/coin/info';
const portfolioPath = '/portfolio';


exports.handler = async (event) => {
    let response;
    // console.log("request: " + JSON.stringify(event));
    switch (true) {
        case event.httpMethod === 'GET' && event.path === coinPath:
            response = await getCoin(event.queryStringParameters.id);
            break;
        case event.httpMethod === 'GET' && event.path === coinsPath:
            response = await getCoins();
            break;
        case event.httpMethod === 'GET' && event.path === infoPath:
            response = await getCoinInfo();
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
}


async function getCoin(id) {
    const coinPrice = await knex.select('*').from('coin_price').where('coin_id', id).orderBy('created_date', 'desc');
    return buildResponse(200, coinPrice)
}

// handle the coins path. Return all coin price data
async function getCoins() {
    const allCoins = await knex.select('*').from('coin_price').orderBy([
        { column: 'created_date', order: 'desc' },
        { column: 'price_usd', order: 'desc' }
    ])
    return buildResponse(200, allCoins);
}

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

    portfolio = {
        activity: activity,
        holdings: holdings
    }
    return buildResponse(200, portfolio);
}

async function getCoinInfo() {
    const info = await knex.select('*').from('coin_info');
    return buildResponse(200, info);
}
