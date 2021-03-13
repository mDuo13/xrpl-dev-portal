function lookup_tx_final_w_resubmit(tx_id, max_ledger, min_ledger, tx_blob) {
  if (typeof min_ledger == "undefined") {
    min_ledger = -1
  }
  if (typeof max_ledger == "undefined") {
    max_ledger = -1
  }

  return new Promise((resolve, reject) => {
    api.on('ledger', async (ledger) => {
      try {
        tx_result = await api.request("tx", {
            "transaction": tx_id,
            "min_ledger": min_ledger,
            "max_ledger": max_ledger
        })

        if (tx_result.validated) {
          resolve(tx_result.meta.TransactionResult)
        } else {
          // Transaction found, but not yet validated. Resubmit to be sure.
          api.request("submit", {"tx_blob": tx_blob})
        }
      } catch(e) {
        if (e.data.error == "txnNotFound") {
          if (e.data.searched_all) {
            reject(`Tx not found in ledgers ${min_ledger}-${max_ledger}. This result is final if this ledger is correct.`)
          } else {
            if (max_ledger > ledger.ledgerVersion) {
              // Transaction may yet be confirmed. Resubmit to be sure.
              api.request("submit", {"tx_blob": tx_blob})
            } else {
              reject("Can't get final result. Check a full history server.")
            }
          }
        } else {
          // Unknown error; pass it back up
          reject(`Unknown Error: ${e}`)
        }
      }
    }) // end ledger event handler
  }) // end promise def
}

function verifyTransaction(hash, options) {
  console.log('Verifying Transaction');
  return api.getTransaction(hash, options).then(data => {
    console.log('Final Result: ', data.outcome.result);
    console.log('Validated in Ledger: ', data.outcome.ledgerVersion);
    console.log('Sequence: ', data.sequence);
    return data.outcome.result === 'tesSUCCESS';
  }).catch(error => {
    /* If transaction not in latest validated ledger,
       try again until max ledger hit */
    if (error instanceof api.errors.PendingLedgerVersionError) {
      return new Promise((resolve, reject) => {
        setTimeout(() => verifyTransaction(hash, options)
		.then(resolve, reject), INTERVAL);
      });
    }
    return error;
  });
}
