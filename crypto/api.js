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

exports.handler = async (event) => {
    let id;
    let info = false;
    let day = '';
    let responseCode = 200;
    console.log("request: " + JSON.stringify(event));

    if (event.queryStringParameters && event.queryStringParameters.id) {
        const coinPrice = await knex.select('*').from('coin_price').where('coin_id', event.queryStringParameters.id).orderBy('created_date', 'desc')
        id = coinPrice;
    }

    if (event.queryStringParameters && event.queryStringParameters.info) {
        const coinInfo = await knex.select('*').from('coin_info').where('coin_id', event.queryStringParameters.id)
        info = coinInfo;
    }

    if (event.headers && event.headers['day']) {
        console.log("Received day: " + event.headers.day);
        day = event.headers.day;
    }

    // if (event.body) {
    //     let body = JSON.parse(event.body)
    //     if (body.time)
    //         time = body.time;
    // }

    let responseBody = {
        data: id,
        coinInfo: info
    };
    // The output from a Lambda proxy integration must be
    // in the following JSON object. The 'headers' property
    // is for custom response headers in addition to standard
    // ones. The 'body' property  must be a JSON string. For
    // base64-encoded payload, you must also set the 'isBase64Encoded'
    // property to 'true'.
    let response = {
        statusCode: responseCode,
        headers: {
            "x-custom-header": "my custom header value"
        },
        body: JSON.stringify(responseBody)
    };
    console.log("response: " + JSON.stringify(response))
    return response;
};