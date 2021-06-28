<div align="center">
  <a href="https://www.josephmanghan.com/">
    <img src="https://svgshare.com/i/Y_7.svg" alt="Logo" width="120" height="120">
  </a>
  <h1> Joseph Manghan - Backbase Coding Challenge</h1>
  <p>
    <em>Manghan-Backbase-Challenge.js</em> automatically transfers funds <br>from a customer's savings account to their current account <br>if an overdraft is in use       and if funds are available. 
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
    <li><a href="#license">License</a></li>
    <li><a href="#missing-features">Missing Features</a></li>
  </ol>
</details>

## About

The goal of the challenge is to save customers money by minimising their overdraft fees. 

The script receives data from an input CSV file containing a ledger of transactions. It processes this data, making automatic transferrals where possible at the end of each day. Finally, it produces a new CSV file containing both the input and amendment ledger entries.

<div align="center">
  <img src="https://i.ibb.co/YZnSQXy/csv-update-illustration.png" alt="CSV update illustration">
</div>

## Prerequisites

[Node.js](https://nodejs.org/en/download/) (v8.16.0 or higher)

[csv-parser](https://github.com/mafintosh/csv-parser)

Using npm:
```console
$ npm install csv-parser
```
[csv-writer](https://www.npmjs.com/package/csv-writer)

Using npm:
```console
$ npm i csv-writer
```
[Better Comments](https://marketplace.visualstudio.com/items?itemName=aaron-bond.better-comments)

Not required, but this extension (available in both VS Code and Atom) can be installed to view comments with intended formatting. 

## Usage 
1. Search for ‘CHANGE INPUT’ in the js file to edit the input CSV file path
2. Search for ‘CHANGE OUTPUT' in the js file to edit the output CSV file path
3. Run the following in the terminal:
```console
$ node manghan-backbase-challenge.js
```

## Assumptions
Several assumption have been made with regards to input data and how that data is processed:
- Input CSV file data is ordered chronologically.
- The less overdraft used, the better - funds are transferred to a current account even if total sum to black is unavailable.
- If a customer attempts to make a savings account withdrawal, but the requested amount is unavailable, the customer wishes to receive the greatest amount possible. This will be reflected in the ledger.
- If a customer attempts to make a savings account withdrawal, but no funds are available, the card is "declined" and the transaction is removed from the ledger.

## Testing

CSV files have been provided for testing, a rundown of which is given below, but you may input your own CSV by following the instructions above. 
- Test_1: a copy of the CSV file provided in the task brief
- Test_2: automatic transfer test for day-end and file-end
- Test_3: savings withdrawal - requested funds unavailable, maximum amount withdrawn
- Test_4: automatic transfer test for maximum possible transfer from savings to current account, when total sum to black in unavailable
- Test_5: combined above
- Test_6: large randomised test

## Missing Features
- **Card decline** - when a withdrawal is attempted from a savings account that has £0 available, the transaction is removed from the ledger as no transaction was completed. However, ideally this data would reflect a “declined” withdrawal. I felt the removal of the entry was more appropriate than adding a £0.00 transaction to the ledger.
- **Day-end DateTime** - the function for making automatic transfer ledger entries involves taking the date from the inputted DateTime when a new data has been recognised in the CSV file. Unfortunately this does not translate to the final check at file-end, and so the DateTime in this case mirrors the DateTime of the final transaction in the input CSV. Ideally this entry would reflect a subsequent date with a time of 00:00:00, as with previous day-end amendments.

- - -

## Process
