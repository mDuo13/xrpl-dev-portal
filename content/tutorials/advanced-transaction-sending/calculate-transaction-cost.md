---
html: calculate-transaction-cost.html
parent: advanced-transaction-sending.html
blurb: Follow these best practices to send a transactions reliably even when the network is under load, without burning too much XRP.
labels:
  - Security
---
# Calculate Transaction Cost

To discourage spam, each transaction must destroy some XRP as the [transaction cost](transaction-cost.html), which rises when the network is under high load. Every transaction destroys the exact amount of XRP it specifies, so it's important not to specify too much or too little. This document demonstrates best practices for choosing the right transaction cost when sending a transaction.

## Autofilling with Client Libraries

Most [client libraries](client-libraries.html) provide a function to automatically fill in a reasonable setting for the transaction cost. This value is likely to get your transaction confirmed within a ledger or two (about 10 or 15 seconds) with a low chance of failure. The library may also provide a safety feature to reject transaction costs over a configurable maximum (typically 1 or 2 XRP), even under high load—with an exception for the [AccountDelete transaction][], whose transaction cost is higher by design.

You can auto-fill the transaction cost as follows:

<!-- MULTICODE_BLOCK_START -->

_Java_

```java
TODO
```

_JavaScript_

```js
{% include '_code-samples/calculate-transaction-cost/js/autofill-tx-cost.js' %}
```

_Python_

```py
{% include '_code-samples/calculate-transaction-cost/py/autofill-tx-cost.py' %}
```

<!-- MULTICODE_BLOCK_END -->

## Manually Filling Using the HTTP / WebSocket APIs

You can use the [server_info method][] or [fee method][] to get information about a server's current load and transaction cost settings, then use that information to choose an appropriate transaction cost. There are many ways to do this with different tradeoffs between low cost and high speed. (Paying a higher cost gives the transaction a higher chance of being confirmed faster.)

One approach is to estimate "low", "medium", and "high" transaction costs based on how full the [transaction queue](transaction-queue.html) is, then select one based on the priority of the transaction. (The more urgent the transaction, the higher cost you choose.) The following steps demonstrate one way of calculating such values:

{% set n = cycler(* range(1,99)) %}

### {{n.next()}}. Get Info on Transaction Queue and Cost

Call the [fee method][], and take note of the following values from the response:

- `current_queue_size`
- `max_queue_size`
- `drops.minimum_fee`
- `drops.median_fee`
- `drops.open_ledger_fee`

TODO: code sample, interactive block

### {{n.next()}}. Determine How Full the Transaction Queue Is

Using the values from the previous step, calculate the percent of the queue that is full from the `current_queue_size` and `max_queue_size` parameters. For example:

```js
const queue_pct = Number(feeDataset.current_queue_size) / Number(feeDataset.max_queue_size)
```


### {{n.next()}}. Calculate "Low", "Medium", and "High" Cost Suggestions

All of the calculations return a value in drops of XRP, so be sure to round the results to the nearest integer if necessary.

1. For **low cost**, choose whichever of the following is _highest_:

    - `drops.minimum_fee` × 1.5
    - `drops.median_fee` ÷ 500
    - `drops.open_ledger_fee` ÷ 500

2. For **medium cost**, choose whichever of the following is _lowest_:

    - The **low cost** value × 15
    - 10000
    - A variable cost based on the size of the queue:
        - If the queue is more than 10% full,


<!--{# common link defs #}-->
{% include '_snippets/rippled-api-links.md' %}			
{% include '_snippets/tx-type-links.md' %}			
{% include '_snippets/rippled_versions.md' %}
