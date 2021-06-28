const csv = require('csv-parser')
const fs = require('fs')

// ! Global variables
// * Variables for storing CSV data
let AccountID, AccountType, InitiatorType, DateTime, TransactionValue;
// Used to convert string CSV data to floating point number
let value_conversion;
// Formatted Ledger for csv-writer
const records = [];


// * Challenge function variables
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
let temp_value;

// Used in creating correct AccountIDs for amendment ledger entries
let ID_array = [];
let amendmentID;

// Used in creating correct AccountIDs for amendment ledger entries at file end
let ID_array2 = [];
let ID_tracker2 = 0;
let amendmentID_2;

// Used to notify when a new date has been received
const date_tracker = [];
// Used to substr date information from DateTime for amendment ledger entries
let date_only;



// CSV PARSER
// ? CHANGE INPUT
fs.createReadStream('csv_input/test_1.csv')

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



        // ! PARENT FUNCTION
        function challenge(AccountID, AccountType, InitiatorType, DateTime, TransactionValue) {

            // ! ACCOUNT MAKER - Checks if ID is new, creates account if needed
            function account_maker(AccountID) {

                // toString: used in comparison as Accounts data is a string, whereas input data is a number
                if (!Object.keys(Accounts).includes(AccountID.toString())) {
                    Accounts[AccountID] = new AccountInfo();
                }
            }
            account_maker(AccountID);

            // ! AMENDMENT TRANSFERS AND LEDGER ENTRIES
            // If date is new, transfers from SAVINGS to CURRENT where possible and creates a ledger entry
            function auto_transfer() {

                // Checks to see if the date is new and if so adds to date_tracker array
                date_only = DateTime.substr(0, 10);
                if (!date_tracker.includes(date_only)) {
                    date_tracker.push(date_only);

                    let ID_tracker = -1;
                    // Completes auto_transfers before CSV input if date_only is new
                    for (const key in Accounts) {

                        // Used to apply correct AccountID to amendment ledger entries
                        ID_array = Object.keys(Accounts);

                        ID_tracker++;
                        amendmentID = Number(ID_array[ID_tracker]);

                        // * Transfers SAVINGS to CURRENT if sum to black is available
                        if (Accounts[key].current < 0 && Accounts[key].savings > Math.abs(Accounts[key].current)) {

                            // Finds the sum needed to bring CURRENT into the black 
                            temp_value = Math.abs(Accounts[key].current);

                            // * Deducts SAVINGS
                            Accounts[key].savings -= temp_value;
                            // Rounds SAVINGS to 2decimal places
                            let savings_round = Accounts[key].savings;
                            Accounts[key].savings = parseFloat(savings_round.toFixed(2));
                            // * Increments CURRENT
                            Accounts[key].current += temp_value;
                            // Rounds CURRENT to 2decimal places
                            let current_round = Accounts[key].current;
                            Accounts[key].current = parseFloat(current_round.toFixed(2));

                            // Solves LedgerEntry being made when a 0 transaction occurs
                            if (temp_value > 0) {


                                // * Creates new ledger entry: deduction to SAVINGS
                                ledger_tracker++;
                                Ledger[ledger_tracker] = new LedgerEntry(amendmentID, "SAVINGS", "SYSTEM", DateTime.substr(0, 10) + "T00:00:00Z", -temp_value);

                                // * Creates new ledger entry: increment to CURRENT
                                ledger_tracker++;
                                Ledger[ledger_tracker] = new LedgerEntry(amendmentID, "CURRENT", "SYSTEM", DateTime.substr(0, 10) + "T00:00:00Z", temp_value);
                            }

                            // * Transfers SAVINGS to CURRENT if SAVINGS has £ but not enough for sum to black  
                            } else if (Accounts[key].current < 0 && Accounts[key].savings < Math.abs(Accounts[key].current)) {

                            temp_value = Accounts[key].savings;

                            // * Deducts SAVINGS
                            Accounts[key].savings -= temp_value;
                            // Rounds SAVINGS to 2decimal places
                            let savings_round = Accounts[key].savings;
                            Accounts[key].savings = parseFloat(savings_round.toFixed(2));
                            // * Increments CURRENT
                            Accounts[key].current += temp_value;
                            // Rounds CURRENT to 2decimal places
                            let current_round = Accounts[key].current;
                            Accounts[key].current = parseFloat(current_round.toFixed(2));

                            // Fixes LedgerEntrys being made with a 0 transaction
                                if (temp_value > 0) {


                                    // * Creates new ledger entry: deduction to SAVINGS
                                    ledger_tracker++;
                                    Ledger[ledger_tracker] = new LedgerEntry(amendmentID, "SAVINGS", "SYSTEM", DateTime.substr(0, 10) + "T00:00:00Z", -temp_value);

                                    // * Creates new ledger entry: increment to CURRENT
                                    ledger_tracker++;
                                    Ledger[ledger_tracker] = new LedgerEntry(amendmentID, "CURRENT", "SYSTEM", DateTime.substr(0, 10) + "T00:00:00Z", temp_value);
                                }
                        }
                        temp_value = 0;
                    }
                }
            }
            auto_transfer();

            // ! LEDGER - Creates a ledger entry for CSV input entries
            function ledger_entry(AccountID, AccountType, InitiatorType, DateTime, TransactionValue) {
                ledger_tracker++;
                // * SAVINGS EDGE CASE LEDGER ENTRIES
                // If SAVINGS withdrawal is attempted but SAVINGS === 0, ledger entry removed
                if (AccountType === "SAVINGS" && TransactionValue < 0 && Accounts[AccountID].savings === 0) {
                    ledger_tracker--;
                    return;
                // If SAVINGS does not have enough for full withdrawal, ledger entry reflects amendment
                } else if (AccountType === "SAVINGS" && TransactionValue < 0 && Math.abs(TransactionValue) > Accounts[AccountID].savings) {
                    Ledger[ledger_tracker] = new LedgerEntry(AccountID, AccountType, InitiatorType, DateTime, -Accounts[AccountID].savings);

                // * REGULAR LEDGER ENTRIES
                // Replicated ledger entry if no problem with transaction
                } else {
                    Ledger[ledger_tracker] = new LedgerEntry(AccountID, AccountType, InitiatorType, DateTime, TransactionValue);
                }
            }
            ledger_entry(AccountID, AccountType, InitiatorType, DateTime, TransactionValue);


            // ! TRANSACTION - Performs transacations from CSV input
            function transaction(AccountType, TransactionValue) {
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
            transaction(AccountType, TransactionValue);

            // Rounds account values to 2decimal places
            let current_check = Accounts[AccountID].current
            Accounts[AccountID].current = parseFloat(current_check.toFixed(2));
            let savings_check = Accounts[AccountID].savings
            Accounts[AccountID].savings = parseFloat(savings_check.toFixed(2));

            return;
        }
        // ! END PARENT FUNCTION   

        challenge(AccountID, AccountType, InitiatorType, DateTime, TransactionValue);
    })

    // Post CSV input
    .on('end', () => {

        // ! FINAL CHECK FOR POSSIBLE SAVINGS TO CURRENT TRANSFERS AT FILE END
        function finalAmendments() {
            for (const key in Accounts) {

                // Used to apply correct AccountID to amendment ledger entries at file end
                ID_array2 = Object.keys(Accounts);
                amendmentID_2 = Number(ID_array2[ID_tracker2]);

                // * Transfers SAVINGS to CURRENT if sum to black is available
                if (Accounts[key].current < 0 && Accounts[key].savings > Math.abs(Accounts[key].current)) {

                    // Finds the sum needed to bring CURRENT into the black 
                    temp_value = Math.abs(Accounts[key].current);

                    // * Deducts SAVINGS
                    Accounts[key].savings -= temp_value;
                    // Rounds SAVINGS to 2decimal places
                    let savings_round = Accounts[key].savings;
                    Accounts[key].savings = parseFloat(savings_round.toFixed(2));
                    // * Increments CURRENT
                    Accounts[key].current += temp_value;
                    // Rounds CURRENT to 2decimal places
                    let current_round = Accounts[key].current;
                    Accounts[key].current = parseFloat(current_round.toFixed(2));

                    // Solves LedgerEntry being made when a 0 transaction occurs
                    if (temp_value > 0) {


                        // DateTime used as correct dayend date is unknown
                        // * Creates new ledger entry: deduction to SAVINGS
                        ledger_tracker++;
                        Ledger[ledger_tracker] = new LedgerEntry(amendmentID_2, "SAVINGS", "SYSTEM", DateTime, -temp_value);

                        // * Creates new ledger entry: increment to CURRENT
                        ledger_tracker++;
                        Ledger[ledger_tracker] = new LedgerEntry(amendmentID_2, "CURRENT", "SYSTEM", DateTime, temp_value);
                    }

                    // * Transfers SAVINGS to CURRENT if SAVINGS has £ but not enough for sum to black  
                    } else if (Accounts[key].current < 0 && Accounts[key].savings < Math.abs(Accounts[key].current)) {

                    temp_value = Accounts[key].savings;

                    // * Deducts SAVINGS
                    Accounts[key].savings -= temp_value;
                    // Rounds SAVINGS to 2decimal places
                    let savings_round = Accounts[key].savings;
                    Accounts[key].savings = parseFloat(savings_round.toFixed(2));
                    // * Increments CURRENT
                    Accounts[key].current += temp_value;
                    // Rounds CURRENT to 2decimal places
                    let current_round = Accounts[key].current;
                    Accounts[key].current = parseFloat(current_round.toFixed(2));

                        // Fixes LedgerEntrys being made with a 0 transaction
                        if (temp_value > 0) {


                            // * Creates new ledger entry: deduction to SAVINGS
                            // DateTime used as correct dayend date is unknown
                            ledger_tracker++;
                            Ledger[ledger_tracker] = new LedgerEntry(amendmentID_2, "SAVINGS", "SYSTEM", DateTime, -temp_value);

                            // * Creates new ledger entry: increment to CURRENT
                            ledger_tracker++;
                            Ledger[ledger_tracker] = new LedgerEntry(amendmentID_2, "CURRENT", "SYSTEM", DateTime, temp_value);
                        }
                }
                ID_tracker2++;
            }
        }
        finalAmendments();

        // ! Turns all AccountIDs to numbers and TransactionValues into 2decimal strings
        function valueFunction() {
            for (const key in Ledger) {
                // AccountIDs to Number
                let IDvalue = Ledger[key].AccountID;
                IDvalue = Number(IDvalue);
                Ledger[key].AccountID = IDvalue;

                // TransactionValues to 2decimal strings
                let decimalValue = Ledger[key].TransactionValue;
                decimalValue = decimalValue.toFixed(2);
                Ledger[key].TransactionValue = decimalValue;
            }
        }
        valueFunction();

        // ! Pushes Ledger into correct format for the CSV writer
        function recordsMaker() {
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
        recordsMaker();

        // CSV WRITER
        const createCsvWriter = require('csv-writer').createObjectCsvWriter;
        const csvWriter = createCsvWriter({

            // ? CHANGE OUTPUT
            path: 'csv_output/test_1_update.csv',
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