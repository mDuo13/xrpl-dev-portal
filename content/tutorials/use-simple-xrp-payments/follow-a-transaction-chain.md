# Follow a Transaction Chain

**Warning:** DRAFT PAGE. The contents of this file are not complete and should not be trusted at this time.

This guide explains how to detect when you have missed one or more transactions that affected an [account](accounts.html), or another [type of object in the XRP Ledger](ledger-data-types.html), and how to find the missing transactions. This is possible because each object has a secure cryptographic reference to the last [transaction](transaction-basics.html) to modify that object. You can also use a similar technique to trace and report the history of an object, starting at its latest state and going back to its creation.

## Background

The XRP Ledger is a [_blockchain_](https://www.distributedagreement.com/2018/09/24/what-is-a-blockchain/), meaning that each state has a _secure reference to the prior state_. This applies at the level of [entire ledger versions](ledgers.html) but it also applies to many individual objects within the ledger's [state data](ledger-object-types.html). Each object tracks the last transaction to modify it, and each transaction's [metadata](transaction-metadata.html) tracks the exact changes that were made to each object in the ledger when processing the transaction. Taken together, these form a "cryptographic chain of evidence" that makes it possible to prove with a high degree of confidence that a particular set of follows the rules of the XRP Ledger, and that no changes are omitted from that set.

The internet is sometimes unreliable. If your software loses connectivity or other unexpected situations occur, the message that would normally notify your software of a new transaction could be delayed, or might arrive in the wrong order. With the history chaining technique described in this tutorial, you can recognize when such a situation has occurred, find any missing transactions, and process all of them in the correct order. This technique cannot detect when you are totally disconnected from the network, but you can use it to find out what you missed when you recover from an outage.

## Requirements

At the level of individual objects, the following two fields provide a secure cryptographic reference to the last transaction to modify the object:

- The `PreviousTxnID` field of an object tells you the [identifying hash][] of the last transaction to modify the object.
- The `PreviousTxnLgrSeq` field tells you what [ledger index][] has the transaction identified by `PreviousTxnID`, so you know how far back to go in the [ledger history](ledger-history.html) to find the transaction.

To follow the history of an object, it must be an object type that has these fields. The following table shows which types do and do not have these fields:

| History chaining possible | History chaining impossible |
|---|---|
| [AccountRoot object][] | [Amendments object][] - Special object not modified by normal transactions. |
| [Check object][] :not_enabled: | [DirectoryNode][] - Special object type for tracking other objects. |
| [DepositPreauth object][] | [FeeSettings][] - Special object not modified by normal transactions. |
| [Escrow object][] | [LedgerHashes object][] - Special object type not modified by normal transactions. |
| [Offer object][] | |
| [PayChannel object][] | |
| [RippleState object][] | |
| [SignerList object][] | |

## Steps

To look for gaps that might affect a transaction's XRP balance, you can use this technique on the `AccountRoot` object for the account as follows:

### 1. Establish a starting point

When your software starts up or connects to the XRP Ledger, establish a starting point by calling the [account_info method][] to look up the latest `PreviousTxnID` value and save it.


### 2. Find the changes made by each new transaction

Whenever you see a new transaction, look through the modified ledger objects to see if the account in question was modified.

For example, to find whether an account was modified, look in the `meta.AffectedNodes` array for a `ModifiedNode` object of ledger entry type `AccountRoot` whose the `FinalFields.Account` value matches the address of the account. If no such object exists, the account was not directly modified by the transaction. Since the XRP Ledger tracks XRP balances in this object, you know that the account's XRP balance did not change.[¹](#footnote-1) <a id="from-footnote-1"></a>

**Tip:** The [account_tx method][] and the `accounts` [subscription stream](subscribe.html) include several types of transactions that _indirectly_ affect an account without modifying the `AccountRoot` object itself. These transactions can affect an account's [issued currency](issued-currencies.html) balances or settings, but they cannot change its balance.

### 3. Compare PreviousTxnID to the expected value

If the account _was_ modified, compare the `ModifiedNode` object's `PreviousTxnID` field to the value you have saved.

If they match, you did not miss any changes to that account's XRP balance. Update your saved `PreviousTxnID` to the identifying hash of the new transaction (the `transaction.hash` field in `transaction`-type subscription messages). **Continue processing transactions normally.**

If they do not match, you have a gap.

### 4. Fill in gaps

If the account was modified _and_ the `PreviousTxnID` value did not match the hash you were expecting, use the [tx method][] to look up the missing transaction, using the `PreviousTxnID` value from the new transaction to identify the missing transaction.

We'll call this the "gap" transaction.

If the `tx` method returns a "not found" error, make sure your server has the ledger in its history. Look at the range of `complete_ledgers` reported by the [server_info method][] and confirm that the `PreviousTxnLgrSeq` value is within the specified range. If necessary, use a [full history server](full-history-server.html) to look up old transaction history.

### 5. Compare the new PreviousTxnID to the expected value

In the "gap" transaction, find the modified account in the `meta.AffectedNodes` array (as in step 2) and compare its `PreviousTxnID` field to the value you were originally expecting.

If the value matches, you have successfully closed the gap. Save the identifying hash of the newest transaction, and resume processing new transactions as normal. (Don't use the transaction you looked up last; use the transaction that caused you to realize you had a gap.) **Resume processing transactions normally.**

### 6. Dig deeper, if necessary

If the `PreviousTxnID` of the "gap" transaction does not match the value you were expecting, there are multiple "gap" transactions. Repeat steps 4 and 5 until you close the gap.

If you find a transaction where the account (or other object) appears as a `CreatedNode` entry instead of a `ModifiedNode` entry, you have reached the creation of the account, which is the beginning of the chain. If you were expecting to see a transaction hash that you haven't seen yet, something has gone wrong. Perhaps you have a bug and you skipped the transaction in question, or are looking for the wrong hash. Another possibility is that you are querying a server that is following a different chain of [ledger history](ledger-history.html), also called a [parallel network](parallel-networks.html).

## Example Code

```js
{% include '_code-samples/history-chaining/chaining.js' %}
```

## Footnotes

[1.](#from-footnote-1) <a id="footnote-1"></a> The `Balance` field of an account tracks the XRP held directly by the account. This does not include XRP set aside in [payment channels](payment-channels.html) or [escrows](escrow.html). Additionally, some portion of that `Balance` is set aside for [reserves](reserves.html) and cannot be spent normally.



<!--{# common link defs #}-->
{% include '_snippets/rippled-api-links.md' %}			
{% include '_snippets/tx-type-links.md' %}			
{% include '_snippets/rippled_versions.md' %}
