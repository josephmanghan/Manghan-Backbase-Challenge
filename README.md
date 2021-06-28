<div align="center">
  <a href="https://www.josephmanghan.com/">
    <img src="https://svgshare.com/i/Y_7.svg" alt="Logo" width="120" height="120">
  </a>
  <h1> Joseph Manghan - Backbase Coding Challenge</h1>
  <p>
    <em>manghan-backbase-challenge.js</em> automatically transfers funds <br>from a customer's savings account to their current account <br>if an overdraft is in use       and if funds are available. 
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about">About</a></li>
    <li><a href="#Prerequisites">Prerequisites</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#assumptions">Assumptions</a></li>
    <li><a href="#testing">Testing</a></li>
    <li><a href="#missing-features">Missing Features</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

## About

The goal of the challenge is to save customers money by minimising their overdraft fees. 

The script receives data from an input CSV file containing a ledger of transactions. It processes this data, making automatic transferrals where possible at the end of each day. Finally, it produces a new CSV file containing both the input and amendment ledger entries.

<div align="center">
  <img src="https://i.ibb.co/YZnSQXy/csv-update-illustration.png" alt="CSV update illustration">
</div>

### Constraints

- Both accounts start at £0.00
- The overdraft of the current account is unlimited 
- The savings account balance cannot drop below zero

## Prerequisites

[Node.js](https://nodejs.org/en/download/) (v8.16.0 or higher)

Install all dependencies using npm:
```console
$ npm install
```
[csv-parser](https://github.com/mafintosh/csv-parser)

[csv-writer](https://www.npmjs.com/package/csv-writer)

- - -

[Better Comments](https://marketplace.visualstudio.com/items?itemName=aaron-bond.better-comments)

Not required, but this extension (available in both VS Code and Atom) can be installed to view comments with intended formatting. 

## Usage 
1. Open the relevant directory within the terminal
2. Run the following command in the terminal, editing input_file.csv and output_file.csv as appropriate:
```console
$ node manghan-backbase-challenge.js input_file.csv output_file.csv
```

## Assumptions
Several assumptions have been made with regards to input data and how that data is processed:
- Input CSV file data is ordered chronologically.
- The less overdraft used, the better - funds are transferred to a current account even if total sum to black is unavailable.
- If a customer attempts to make a savings account withdrawal, but the requested amount is unavailable, the customer wishes to receive the greatest amount possible. This will be reflected in the ledger.
- If a customer attempts to make a savings account withdrawal, but no funds are available, the card is "declined" and the transaction is removed from the ledger.

As a final note, I was able to make the script more robust by enabling it to handle numerous accounts. *AccountID* now tracks individual customers, with both a current and savings account attached to an ID. This means that testing does not need to be limited to 1 file per customer.

## Testing

CSV files have been provided for testing, a rundown of which is given below, but you may input your own CSV files by following the instructions under **Usage**. 
- Test_1: a copy of the CSV file provided in the task brief
- Test_2: simplified brief CSV file, for single account testing (script can now handle multiple accounts)
- Test_3: day-end automatic transfers test
- Test_4: savings withdrawal test - requested funds unavailable, maximum amount withdrawn
- Test_5: automatic transfer test - maximum possible transfer from savings to current account when total sum to black in unavailable
- Test_6: combined above
- Test_7: large randomised test

## Missing Features

The following features were unable to be addressed within the scope of the project:
- **Card decline** - when a withdrawal is attempted from a savings account with £0.00, the transaction is removed from the ledger as a transaction was not completed. However, ideally the data would reflect a “declined” withdrawal. I felt the removal of the entry was more appropriate than adding a £0.00 transaction to the ledger.
- **Day-end *DateTime*** - the function for making automatic transfer ledger entries involves taking the date from the inputted *DateTime* when a new date has been recognised in the input CSV file. 00:00:00 is appended to this, which signifies the end of one day and the beginning of another. Unfortunately this does not translate to the final check at file-end as the subsequent date is unknown to the script, and so *DateTime* in this case mirrors the *DateTime* of the final transaction of the input CSV. Ideally this entry would reflect a subsequent date with a time of 00:00:00, as with previous day-end amendments.

## Contact
Dr Joseph Manghan - josephmanghan@gmail.com

[Personal website & portfolio](https://www.josephmanghan.com/)
