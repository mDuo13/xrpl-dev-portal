// Prerequisite: Generate
// 1. Connect
// The code for these steps is handled by interactive-tutorial.js

// 2. Prepare Transaction ------------------------------------------------------
$("#prepare-button").click( async function() {
  // Wipe existing results
  $("#prepare-output").html("")

  const sender = $("#use-address").text() || "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe"
  const preparedTx = await api.prepareTransaction({
    "TransactionType": "Payment",
    "Account": sender,
    "Amount": api.xrpToDrops("22"), // Same as "Amount": "22000000"
    "Destination": "rUCzEr6jrEyMpjhs4wSdQdz4g8Y382NxfM"
  }, {
    // Expire this transaction if it doesn't execute within ~5 minutes:
    "maxLedgerVersionOffset": 75
  })
  const maxLedgerVersion = preparedTx.instructions.maxLedgerVersion
  $("#tx-lls").text(maxLedgerVersion) //for the table in the later step

  $("#prepare-output").html(
    "<div><strong>Prepared transaction instructions:</strong> <pre><code id='prepared-tx-json'>" +
    pretty_print(preparedTx.txJSON) + "</code></pre></div>" +
    "<div><strong>Transaction cost:</strong> " +
    preparedTx.instructions.fee + " XRP</div>" +
    "<div><strong>Transaction expires after ledger:</strong> " +
    maxLedgerVersion + "</div>"
  )

  // Update breadcrumbs & active next step
  complete_step("Prepare")
  $("#interactive-sign button").prop("disabled", false)
  $("#interactive-sign button").prop("title", "")
})


// 3. Sign the transaction -----------------------------------------------------
$("#sign-button").click( function() {
  // Wipe previous output
  $("#sign-output").html("")

  const preparedTxJSON = $("#prepared-tx-json").text()
  const secret = $("#use-secret").text()

  if (!secret) {
    alert("Can't sign transaction without a real secret. Generate credentials first.")
    return
  }

  signResponse = api.sign(preparedTxJSON, secret)

  $("#sign-output").html(
    "<div><strong>Signed Transaction blob:</strong> <code id='signed-tx-blob' style='overflow-wrap: anywhere; word-wrap: anywhere'>" +
    signResponse.signedTransaction + "</code></div>" +
    "<div><strong>Identifying hash:</strong> <span id='signed-tx-hash'>" +
    signResponse.id + "</span></div>"
  )

  // Update all breadcrumbs & activate next step
  complete_step("Sign")
  $("#interactive-submit button").prop("disabled", false)
})

// 4. Submit the signed transaction --------------------------------------------
$("#submit-button").click( async function(event) {
  const block = $(event.target).closest(".interactive-block")
  block.find(".output-area").html("")
  block.find(".loader").show()

  const txBlob = $("#signed-tx-blob").text()
  const earliestLedgerVersion = await api.getLedgerVersion()
  $("#earliest-ledger-version").text(earliestLedgerVersion)

  try {
    const result = await api.submit(txBlob)
    block.find(".loader").hide()
    block.find(".output-area").html(
      "<div><strong>Tentative result:</strong> " +
      result.resultCode + " - " +
      result.resultMessage +
      "</div>"
    )

    // Update breadcrumbs & active next step
    complete_step("Submit")
  }
  catch(error) {
    block.find(".loader").hide()
    block.find(".output-area").html(
      `<p class="devportal-callout warning"><strong>Error:</strong> ${error}`)
  }

})

// 5. Wait for Validation ------------------------------------------------------
api.on('ledger', ledger => {
  $("#current-ledger-version").text(ledger.ledgerVersion)

  if ( $(".breadcrumb-item.bc-wait").hasClass("active") ) {
    // Advance to "Check" as soon as we see a ledger close
    complete_step("Wait")
    $("#get-tx-button").prop("disabled", false)
  }
})

// 6. Check transaction status -------------------------------------------------
$("#get-tx-button").click( async function(event) {
  const block = $(event.target).closest(".interactive-block")
  // Wipe previous output
  block.find(".output-area").html("")

  const txID = $("#signed-tx-hash").text()
  const earliestLedgerVersion = parseInt($("#earliest-ledger-version").text(), 10)

  try {
    const tx = await api.getTransaction(txID, {minLedgerVersion: earliestLedgerVersion})

    block.find(".output-area").html(
      "<div><strong>Transaction result:</strong> " +
      tx.outcome.result + "</div>" +
      "<div><strong>Balance changes:</strong> <pre><code>" +
      pretty_print(tx.outcome.balanceChanges) +
      "</pre></code></div>"
    )

    complete_step("Check")
  } catch(error) {
    block.find(".output-area").text("Couldn't get transaction outcome:" + error)
  }

})
