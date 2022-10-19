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
            response = await getCoinInfo(event.queryStringParameters.id)
            break;
        case event.httpMethod === 'GET' && event.path === portfolioPath:
            response = await getPortfolio();
    }
    // console.log("response: " + JSON.stringify(response))
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

async function getCoins() {
    const allCoins = await knex.select('*').from('coin_price').orderBy([
        { column: 'created_date', order: 'desc' },
        { column: 'price_usd', order: 'desc' }
    ])
    return buildResponse(200, allCoins);
}

async function getPortfolio() {
    const holdings = await knex.select('*').from('holdings').orderBy([
        { column: 'purchase_date', order: 'desc' }
    ])
    return buildResponse(200, holdings);
}

async function getCoinInfo(id) {
    const info = await knex.select('*').from('coin_info').where('coin_id', id);
    return buildResponse(200, info);
}
