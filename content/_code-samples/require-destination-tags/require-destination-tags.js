async function main() {
  // Connect -------------------------------------------------------------------
  api = new ripple.RippleAPI({server: 'wss://s.altnet.rippletest.net:51233'})
  await api.connect()

  // Get Testnet creds
  const response = await fetch("https://faucet.altnet.rippletest.net/accounts", {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: "{}"
  })
  const data = await response.json()
  const address = data.account.address
  const secret = data.account.secret

  // console.log("Waiting until we have a validated starting sequence number...")
  // If you go too soon, the funding transaction might slip back a ledger and
  // then your starting Sequence number will be +1.
  // while (true) {
  //   try {
  //     await api.request("account_info", {account: address, ledger_index: "validated"})
  //     break
  //   } catch(e) {}
  // }

  console.log(await api.request("account_info", {account: address}))


  // Send AccountSet transaction -----------------------------------------------
  const prepared = await api.prepareTransaction({
    "TransactionType": "AccountSet",
    "Account": address,
    "SetFlag": 1 // RequireDest
  })
  console.log("Prepared transaction:", prepared.txJSON)
  const max_ledger = prepared.instructions.maxLedgerVersion

  const signed = api.sign(prepared.txJSON, secret)
  console.log("Transaction hash:", signed.id)
  const tx_id = signed.id
  const tx_blob = signed.signedTransaction

  const prelim_result = await api.request("submit", {"tx_blob": tx_blob})
  console.log("Preliminary result:", prelim_result)
  const min_ledger = prelim_result.validated_ledger_index

  // (Semi-)reliable Transaction Submission ------------------------------------
  console.log(`Begin final outcome lookup.
    tx_id: ${tx_id}
    max_ledger: ${max_ledger}
    min_ledger: ${min_ledger}`)
  let tx_status
  try {
    tx_status = await lookup_tx_final_w_resubmit(tx_id, max_ledger, min_ledger, tx_blob)
  } catch(err) {
    tx_status = err
  }
  console.log("Final transaction status:", tx_status)

  // Confirm Account Settings --------------------------------------------------
  let account_info = await api.request("account_info", {
      "account": address
  })
  const flags = api.parseAccountFlags(account_info.account_data.Flags)
  console.log(JSON.stringify(flags, null, 2))
  if (flags.requireDestinationTag) {
    console.log("Require Destination Tag is enabled.")
  } else {
    console.log("Require Destination Tag is DISABLED.")
  }
}

main()
