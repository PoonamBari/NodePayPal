const express = require('express');
const paypal = require('paypal-rest-sdk');
// var bodyParser = require('body-parser');
// var db = require('./database');

const app = express();

// middlewares to parse the incoming data
app.use(express.json());
app.use(express.urlencoded());

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AfffSpQVI8i5VaSRSCztofru5nLElY_6HZdPH5moskZopA5ESSP2qRPpuAiIo8OBxNxqvg_tpQzZI8mB',
    'client_secret': 'EHE4Rw5NQcFIhpimKwv1Lo8BXipkkyvAsiCY6VIYpU1Ra4XmH612iJ6QG07L3QkOoa13Unnm8Ho3yyZ0'
});

const mysql = require('mysql2');
const db_connection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'paypaldbnode',
    password: ''
});


app.get('/', (req, res) => res.sendFile(__dirname + "/index.html"));

app.post('/pay', (req, res) => {

    var price = req.body.price;
    var currency = req.body.currency;
    var name = req.body.fullname;

    var sql = `INSERT INTO order_details (price, currency, name) VALUES ("${price}", "${currency}", "${name}")`;
    db_connection.query(sql, function(err, result) {
        if (err) throw err;
        console.log('record inserted');
        // res.redirect('/');
        // res.send('Insert successful')
    });

    // let _price = 10;
    // let _currency = 'INR';
    // let _name = 'PC';

    // db_connection.promise()
    //     .execute("INSERT INTO `order_details`(`price`,`currency`,`name`) VALUES(?, ?, ?)", [_price, _currency, _name])
    //     .then(([result]) => {
    //         // console.log(result);
    //         if (result.affectedRows === 1) {
    //             console.log("User Inserted");
    //         }
    //     }).catch(err => {
    //         console.log(err);
    //     });

    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3000/success",
            "cancel_url": "http://localhost:3000/cancel"
        },
        "transactions": [{
            "amount": {
                "currency": "INR",
                "total": "1.00"
            },
            "description": ""
        }]
    };

    app.get('/success', (req, res) => {
        const payerId = req.query.PayerID;
        const paymentId = req.query.paymentId;

        const execute_payment_json = {
            "payer_id": payerId,
            "transactions": [{
                "amount": {
                    "currency": "INR",
                    "total": "1.00"
                }
            }]
        };

        paypal.payment.execute(paymentId, execute_payment_json, function(error, payment) {
            if (error) {
                console.log(error.response);
                throw error;
            } else {
                console.log(JSON.stringify(payment));
                res.send('Success');
            }
        });
    });

    paypal.payment.create(create_payment_json, function(error, payment) {
        if (error) {
            throw error;
        } else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === 'approval_url') {
                    res.redirect(payment.links[i].href);
                }
            }
        }
    });

});

app.get('/cancel', (req, res) => res.send('Cancelled'));

app.listen(3000, () => console.log(`Server Started on 3000`));