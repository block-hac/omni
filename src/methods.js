const express = require('express');
const router = express.Router();
const conf = require('./conf');
const axios = require('axios');
const request = require('request');
var core_host = `http://${conf.rpc_user}:${conf.rpc_pwd}@${conf.rpc_url}:${conf.rpc_port}`;
var wallet_host = core_host + `/wallet/${conf.wallet_name}`;
const headers = {
    'Content-Type': 'text/plain'
};
router.post('/getblockcount', (req, res) =>{
    var body = JSON.stringify({jsonrpc:'1.0', id: 'curltext', method: 'getblockcount', params: []});
    axios.post(core_host, body, headers)
        .then(result => {
            res.json(result.data);
        })
        .catch(err => {
            console.error(err);
            res.json(err);
        })
});
router.post('/getblock', (req, res) =>{
    var body = JSON.stringify({jsonrpc:'1.0', id: 'curltext', method: 'getblock', params: [req.body.blockhash]});
    axios.post(core_host, body, headers)
        .then(result => {
            res.json(result.data);
        })
        .catch(err => {
            console.error(err);
            res.json(err);
        })
});
router.post('/getblockchaininfo', (req, res) => {
    var body = JSON.stringify({jsonrpc:'1.0', id: 'curltext', method: 'getblockchaininfo', params: []});
    axios.post(core_host, body, headers)
        .then(result => {
            res.json(result.data);
        })
        .catch(err => {
            console.error(err);
            res.json(err);
        });
});

router.post('/getblockhash', (req, res) => {
    var body = JSON.stringify({jsonrpc:'1.0', id: 'curltext', method: 'getblockhash', params: [req.body.blocknumber]});
    axios.post(core_host, body, headers)
        .then(result => {
            res.json(result.data);
        })
        .catch(err => {
            console.error(err);
            res.json(err);
        });
});

router.post('/getrawtransaction', (req, res) => {
    var body = JSON.stringify({jsonrpc:'1.0', id: 'curltext', method: 'getrawtransaction', params: [req.body.txhash, true]});
    axios.post(core_host, body, headers)
        .then(result => {
            res.json(result.data.result.vout);
        })
        .catch(err => {
            console.error(err);
            res.json(err);
        });
});

router.post('/getrawtransactionsfromblock', (req, res) => {
    var body_tx = JSON.stringify({jsonrpc:'1.0', id: 'curltext', method: 'getblock', params: [req.body.blockhash, true]});
    axios.post(core_host, body_tx, headers)
        .then(async(data_blk) => {
            var trxs = data_blk.data.result.tx;
            var transactions = [];
            for(var trx of trxs){
                var body_rawtrx = JSON.stringify({jsonrpc:'1.0', id: 'curltext', method: 'getrawtransaction', params: [trx, true]});
                var rawtrx = await axios.post(core_host, body_rawtrx).then(data_raw => {
                    var raws = data_raw.data.result.vout;
                    var raw_data = [];
                    for (var raw of raws) {
                        if(raw.value > 0 && raw.scriptPubKey.addresses){
                            var transaction = {};
                            transaction.address = raw.scriptPubKey.addresses[0];
                            transaction.value = raw.value;
                            raw_data.push(transaction);
                        }
                    }
                    return raw_data;
                });
                for(var el of rawtrx) transactions.push(el);
            }
            return res.send(transactions);
        })
        .catch(err => {
            console.error(err);
            res.json(err);
        });
})

router.post('/generate_new_address', (req, res) => {
    var body = JSON.stringify({jsonrpc: "1.0", id: "curltext", method:"getnewaddress", params: []});
    axios.post(wallet_host, body, headers)
        .then(result => {
            body = JSON.stringify({jsonrpc: "1.0", id: "curltext", method:"dumpprivkey", params: [result.data.result]});  
            axios.post(wallet_host, body, headers)
                .then(res_privKey => {
                    var res_data = {
                        address: result.data.result,
                        privateKey: res_privKey.data.result
                    };
                    res.json(res_data);
                })
                .catch(err => {
                    console.error(err);
                    res.json(err);
                })
        })
        .catch(err => {
            console.error(err);
            res.json(err);
        })
});

router.post('/getbalances', (req, res) => {
    var body = JSON.stringify({jsonrpc: "1.0", id: "curltext", method:"getbalances", params: []})
    axios.post(wallet_host, body, headers)
        .then(result => {
            res.json(result.data);
        })
        .catch(err => {
            console.error(err);
            res.json(err);
        });
});

router.post('/getbalance', (req, res) => {
    var body = JSON.stringify({jsonrpc: "1.0", id: "curltext", method: "getbalance", params: []});
    axios.post(wallet_host, body, headers)
        .then(result => {
            res.json(result.data);
        })
        .catch(err => {
            console.error(err);
            res.json(err);
        });
});

router.post('/sendtoaddress', (req, res) => {
    var options = {
        url: wallet_host,
        method: "POST",
        headers: headers,
      };
    options.body = JSON.stringify({jsonrpc: "1.0", id: "curltext", method: "sendtoaddress", params: [req.body.address, parseFloat(req.body.amount), " ", "seans outpost"]});
    callback = (error, response, body) => {
        if (!error && response.statusCode == 200) {
          const data = JSON.parse(body);
          res.send(JSON.parse(body));
        }
        if (!error && response.statusCode != 200) {
          res.status(500).json(JSON.parse(body));
        }
        if (error) {
          console.error(error);
          res.status(500);
        }
      };
      request(options, callback);
});

router.post('/getaddressinfo', (req, res) => {
    var body = JSON.stringify({jsonrpc: "1.0", id: "curltext", method: "getaddressinfo", params: [req.body.address]});
    axios.post(wallet_host, body, headers)
        .then(result => {
            res.json(result.data);
        })
        .catch(err => {
            console.error(err);
            res.json(err);
        });
});

router.post('/getwalletinfo', (req, res) => {
    var body = JSON.stringify({jsonrpc: "1.0", id: "curltext", method: "getwalletinfo", params: []});
    axios.post(wallet_host, body, headers)
        .then(result => {
            res.json(result.data);
        })
        .catch(err => {
            console.error(err);
            res.json(err);
        });
});
router.post('/validateaddress', (req, res) => {
    var body = JSON.stringify({jsonrpc: "1.0", id: "curltext", method: "validateaddress", params: [req.body.address]});
    axios.post(wallet_host, body, headers)
        .then(result => {
            res.json(result.data);
        })
        .catch(err => {
            console.error(err);
            res.json(err);
        });
});

router.post('/getrawtransaction_deposit', (req, res) => {
    var body = JSON.stringify({jsonrpc:'1.0', id: 'curltext', method: 'getrawtransaction', params: [req.body.txhash, true]});
    axios.post(core_host, body, headers)
        .then(result => {
            // res.json(result.data.result.vout);
            if(result.data.result.vout.length > 0) {
                var addr_val_list = [];
                for(var trx of result.data.result.vout) {
                    if(trx.value > 0) {
                        var addr_value = {
                            address: trx.scriptPubKey.addresses[0],
                            value: trx.value
                        }
                        addr_val_list.push(addr_value);
                    }
                }
                res.send(addr_val_list);
            } else {res.send([]);}
        })
        .catch(err => {
            console.error(err);
            res.json(err);
        });
});

router.post('/withdraw', (req, res) => {
    var options = {
        url: wallet_host,
        method: "POST",
        headers: headers,
      };
    options.body = JSON.stringify({jsonrpc: "1.0", id: "curltext", method: "sendtoaddress", params: [req.body.address, parseFloat(req.body.amount), " ", "seans outpost"]});
    callback = (error, response, body) => {
        if (!error && response.statusCode == 200) {
          const data = JSON.parse(body);
          res.send(JSON.parse(body));
        }
        if (!error && response.statusCode != 200) {
          res.status(500).json(JSON.parse(body));
        }
        if (error) {
          console.error(error);
          res.status(500);
        }
      };
      request(options, callback);
})

module.exports = router;