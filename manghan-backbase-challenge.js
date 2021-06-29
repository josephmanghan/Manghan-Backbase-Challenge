const csv = require('csv-parser')
const fs = require('fs')

// ! Global variables
// * CLI interface variables
const csv_input = 'csv_input/' + process.argv.slice(2, 3);
const csv_output = 'csv_output/' + process.argv.slice(3, 4);

// * Variables for storing CSV data
let AccountID, AccountType, InitiatorType, DateTime, TransactionValue;
// Used to convert string CSV data to floating point number
let value_conversion;
// Formatted Ledger for csv-writer
const records = [];

// * CSV_input_function variables
// Account creation
const Accounts = {};
// Ledger entries
const Ledger = {};


// Ledger Entry Template
class LedgerEntry {
    constructor(AccountID, AccountType, InitiatorType, DateTime, TransactionValue) {
        this.AccountID = AccountID;
        this.AccountType = AccountType;
        this.InitiatorType = InitiatorType;
        this.DateTime = DateTime;
        this.TransactionValue = TransactionValue;
    }
}

// Account Template
class AccountInfo {
    constructor() {
        this.current = 0;
        this.savings = 0;
    }
}

// Used to number entries in the ledger
let ledger_tracker = -1;

// Stores values used in automatic transferrals & new ledger entries
let transfer_value;

// Used in creating correct AccountIDs for amendment ledger entries
let ID_array = [];
let amendment_ID;

// Used to notify when a new date has been received
const date_tracker = [];
// Used to substr date information from DateTime for amendment ledger entries
let date_only;

// ! AMENDMENT TRANSFERS AND LEDGER ENTRIES
// file_end_check - boolean argument instructing function of day-end/file-end condition
function amendment_check(file_end_check) {
    let ID_tracker = -1;
    for (const key in Accounts) {

        // Used to apply correct AccountID to amendment ledger entries
        ID_array = Object.keys(Accounts);

        ID_tracker++;
        amendment_ID = Number(ID_array[ID_tracker]);

        // * SAVINGS to CURRENT if sum to black is available
        if (Accounts[key].current < 0 && Accounts[key].savings > Math.abs(Accounts[key].current)) {

            // Finds the sum needed to bring CURRENT into the black 
            transfer_value = Math.abs(Accounts[key].current);

            amendment_function();

        // * SAVINGS to CURRENT if SAVINGS has £ but not enough for sum to black  
        } else if (Accounts[key].current < 0 && Accounts[key].savings < Math.abs(Accounts[key].current)) {

            transfer_value = Accounts[key].savings;

            amendment_function();
        }

        function amendment_function() {
            // ! TRANSFER
            // * Deducts SAVINGS
            Accounts[key].savings -= transfer_value;
            // Rounds SAVINGS to 2decimal places
            let savings_round = Accounts[key].savings;
            Accounts[key].savings = parseFloat(savings_round.toFixed(2));
            // * Increments CURRENT
            Accounts[key].current += transfer_value;
            // Rounds CURRENT to 2decimal places
            let current_round = Accounts[key].current;
            Accounts[key].current = parseFloat(current_round.toFixed(2));

            ledger_function();

            // ! LEDGER
            function ledger_function() {
                // Solves LedgerEntry being made with a 0 transaction
                if (transfer_value > 0) {

                    let new_DateTime;
                    if (file_end_check === false) {
                        // new_DateTime reflects latest date with a time of 00:00:00
                        new_DateTime = DateTime.substr(0, 10) + "T00:00:00Z";
                    } else {
                        // new_DateTime utilises final input as successive DateTime is unknown at file-end
                        new_DateTime = DateTime;
                    }

                    // * Creates new ledger entry: deduction to SAVINGS
                    ledger_tracker++;
                    Ledger[ledger_tracker] = new LedgerEntry(amendment_ID, "SAVINGS", "SYSTEM", new_DateTime, -transfer_value);

                    // * Creates new ledger entry: increment to CURRENT
                    ledger_tracker++;
                    Ledger[ledger_tracker] = new LedgerEntry(amendment_ID, "CURRENT", "SYSTEM", new_DateTime, transfer_value);
                }
            }
        }

        transfer_value = 0;
    }
}


// CSV PARSER
fs.createReadStream(csv_input)

    .pipe(csv())
    .on('data', function (data) {

        // Receives CSV data
        AccountID = data.AccountID;
        AccountType = data.AccountType;
        InitiatorType = data.InitiatorType;
        DateTime = data.DateTime;
        TransactionValue = data.TransactionValue;

        // Used to convert TransactionValue strings to floating point
        value_conversion = data.TransactionValue;
        TransactionValue = parseFloat(value_conversion);


        // ! Handles data inputted from CSV
        function CSV_input_function(AccountID, AccountType, InitiatorType, DateTime, TransactionValue) {

            // ! ACCOUNT MAKER - Checks if ID is new, creates account if needed
            function account_maker() {
                // toString: used in comparison as Accounts data is a string, whereas input data is an integer
                if (!Object.keys(Accounts).includes(AccountID.toString())) {
                    Accounts[AccountID] = new AccountInfo();
                }
            }
            account_maker();

            // * Checks to see if date is new
            function date_checker() {
                // If date is new, added to date_tracker array
                date_only = DateTime.substr(0, 10);
                if (!date_tracker.includes(date_only)) {
                    date_tracker.push(date_only);

                    // Completes auto_transfers before CSV input transactions if date_only is new
                    amendment_check(false);
                }
            }
            date_checker();

            // ! LEDGER - Creates a ledger entry for CSV input entries
            function ledger_entry() {
                ledger_tracker++;
                // * SAVINGS EDGE CASE LEDGER ENTRIES
                // (1) If SAVINGS withdrawal is attempted but SAVINGS === 0, ledger entry removed
                if (AccountType === "SAVINGS" && TransactionValue < 0 && Accounts[AccountID].savings === 0) {
                    ledger_tracker--;
                    return;
                // (2) If SAVINGS does not have enough for full withdrawal, ledger entry reflects amendment
                } else if (AccountType === "SAVINGS" && TransactionValue < 0 && Math.abs(TransactionValue) > Accounts[AccountID].savings) {
                    Ledger[ledger_tracker] = new LedgerEntry(AccountID, AccountType, InitiatorType, DateTime, -Accounts[AccountID].savings);

                // * REGULAR LEDGER ENTRIES
                // Replicated ledger entry if no problem with transaction
                } else {
                    Ledger[ledger_tracker] = new LedgerEntry(AccountID, AccountType, InitiatorType, DateTime, TransactionValue);
                }
            }
            ledger_entry();

            // ! TRANSACTION - Performs transacations from CSV input
            function transaction() {
                // * CURRENT transaction
                if (AccountType === "CURRENT") {
                    Accounts[AccountID].current += TransactionValue;

                // * SAVINGS transaction
                } else if (AccountType === "SAVINGS") {
                    // (1) - if withdrawal is made from SAVINGS but the required sum does not exist, only the total available amount is transferred
                    // i.e. SAVINGS does not drop below 0
                    if (TransactionValue < 0 && Accounts[AccountID].savings < Math.abs(TransactionValue)) {
                        Accounts[AccountID].savings -= Accounts[AccountID].savings;
                    // (2) - regular SAVINGS transaction
                    } else {
                        Accounts[AccountID].savings += TransactionValue;
                    }
                }
            }
            transaction();

            // Rounds account values to 2decimal places
            let current_check = Accounts[AccountID].current
            Accounts[AccountID].current = parseFloat(current_check.toFixed(2));
            let savings_check = Accounts[AccountID].savings
            Accounts[AccountID].savings = parseFloat(savings_check.toFixed(2));

            return;
        } 

        CSV_input_function(AccountID, AccountType, InitiatorType, DateTime, TransactionValue);
    })

    // Post CSV input
    .on('end', () => {

        // ! Calls final amendment checks
        // Boolean passed instructing the function of a file-end state
        amendment_check(true);

        // ! Turns all AccountIDs to integers and TransactionValues into 2decimal strings
        function conversion_function() {
            for (const key in Ledger) {
                // AccountIDs to integer
                let ID_value = Ledger[key].AccountID;
                ID_value = Number(ID_value);
                Ledger[key].AccountID = ID_value;

                // TransactionValues to 2decimal strings
                let decimal_value = Ledger[key].TransactionValue;
                decimal_value = decimal_value.toFixed(2);
                Ledger[key].TransactionValue = decimal_value;
            }
        }
        conversion_function();

        // ! Pushes Ledger into correct format for the CSV writer
        function records_maker() {
            for (const key in Ledger) {
                const LedgerItems = Ledger[key];
                records.push({
                    accountid: LedgerItems.AccountID,
                    accounttype: LedgerItems.AccountType,
                    initiatortype: LedgerItems.InitiatorType,
                    datetime: LedgerItems.DateTime,
                    transactionvalue: LedgerItems.TransactionValue
                })
            }
        }
        records_maker();

        // CSV WRITER
        const createCsvWriter = require('csv-writer').createObjectCsvWriter;
        const csvWriter = createCsvWriter({

            path: csv_output,
            header: [{
                    id: 'accountid',
                    title: 'AccountID'
                },
                {
                    id: 'accounttype',
                    title: 'AccountType'
                },
                {
                    id: 'initiatortype',
                    title: 'InitiatorType'
                },
                {
                    id: 'datetime',
                    title: 'DateTime'
                },
                {
                    id: 'transactionvalue',
                    title: 'TransactionValue'
                }
            ]
        });

        csvWriter.writeRecords(records)
            .then(() => {
                console.log('...Done');
            });
    });