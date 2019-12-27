#!/usr/bin/env node

const args = process.argv.splice(process.execArgv.length + 2);
let ledger = args[0];

const { getTables, queryExecute } = require('../lib/index');
// console.log("ledger=> ", ledger);
// async () => console.log(await getTables(ledger));