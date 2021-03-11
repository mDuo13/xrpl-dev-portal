// 1. Generate
// 2. Connect
// The code for these steps is handled by interactive-tutorial.js
$(document).ready(() => {

// 3. Check Sequence Number
$("#check-sequence").click( async function(event) {
  const block = $(event.target).closest(".interactive-block")
  const address = $("#use-address").text()

  if (!address) {
    block.find(".output-area").html(
      `<p class="devportal-callout warning"><strong>Error:</strong>
      No address. Make sure you <a href="#1-get-credentials">Get Credentials</a> first.</p>`)
    return;
  }

  // Wipe previous output
  block.find(".output-area").html("")
  block.find(".loader").show()
  const account_info = await api.request("account_info", {"account": address})
  block.find(".loader").hide()

  block.find(".output-area").append(
    `<p>Current sequence:
    <code id="current_sequence">${account_info.account_data.Sequence}</code>
    </p>`)

  complete_step("Check Sequence")
})

// 4. Prepare and Sign TicketCreate --------------------------------------------
$("#prepare-and-sign").click( function(event) {
  const block = $(event.target).closest(".interactive-block")
  const address = $("#use-address").text()
  const secret = $("#use-secret").text()
  let current_sequence;
  try {
    current_sequence = parseInt($("#current_sequence").text())
  } catch (e) {
    current_sequence = null
  }

  // Wipe previous output
  block.find(".output-area").html("")

  if (!address || !secret || !current_sequence) {
    block.find(".output-area").html(
      `<p class="devportal-callout warning"><strong>Error:</strong>
      Couldn't get a valid address/secret/sequence value. Check that the
      previous steps were completed successfully.</p>`)
    return;
  }

  let prepared = await api.prepareTransaction({
    "TransactionType": "TicketCreate",
    "Account": address,
    "TicketCount": 10,
    "Sequence": current_sequence
  }, {
    maxLedgerVersionOffset: 20
  })

  block.find(".output-area").append(
    `<p>Prepared transaction:</p>
    <pre><code>${pretty_print(prepared.txJSON)}</code></pre>`)
  $("#lastledgersequence").html(
    `<code>${prepared.instructions.maxLedgerVersion}</code>`)

  let signed = api.sign(prepared.txJSON, secret)
  block.find(".output-area").append(
    `<p>Transaction hash: <code id="tx_id">${signed.id}</code></p>`)
  $("#waiting-for-tx").text(signed.id)

  // Reset the "Wait" step to prevent mixups
  $("#earliest-ledger-version").text("(Not submitted)")
  $("#tx-validation-status").html("<th>Final Result:</th><td></td>")

  let tx_blob = signed.signedTransaction
  block.find(".output-area").append(
    `<pre style="visibility: none"><code id="tx_blob">${tx_blob}</code></pre>`)

  complete_step("Prepare & Sign")

})

// 5. Submit TicketCreate ------------------------------------------------------
$("#ticketcreate-submit").click( async function(event) {
  const block = $(event.target).closest(".interactive-block")
  const tx_blob = $("#tx_blob").text()
  // Wipe previous output
  block.find(".output-area").html("")

  waiting_for_tx = $("#tx_id").text() // next step uses this
  let prelim_result = await api.request("submit", {"tx_blob": tx_blob})
  block.find(".output-area").append(
    `<p>Preliminary result:</p>
    <pre><code>${pretty_print(prelim_result)}</code></pre>`)

  if ( $("#earliest-ledger-version").text() == "(Not submitted)" ) {
    // This is the first time we've submitted this transaction, so set the
    // minimum ledger index for this transaction. Don't overwrite this if this
    // isn't the first time the transaction has been submitted!
    $("#earliest-ledger-version").text(prelim_result.validated_ledger_index)
  }

  complete_step("Submit")
})


// 6. Wait for Validation
let waiting_for_tx = null;
api.on('ledger', async (ledger) => {
  $("#current-ledger-version").text(ledger.ledgerVersion)

  let tx_result;
  let min_ledger = parseInt($("#earliest-ledger-version").text())
  let max_ledger = parseInt($("#lastledgersequence").text())
  if (min_ledger > max_ledger) {
    console.warn("min_ledger > max_ledger")
    min_ledger = 1
  }
  if (waiting_for_tx) {
    try {
      tx_result = await api.request("tx", {
          "transaction": waiting_for_tx,
          "min_ledger": min_ledger,
          "max_ledger": max_ledger
      })
      if (tx_result.validated) {
        $("#tx-validation-status").html(
          `<th>Final Result:</th><td>${tx_result.meta.TransactionResult}
          (<a href="https://devnet.xrpl.org/transactions/${waiting_for_tx}"
          target="_blank">Validated</a>)</td>`)
        waiting_for_tx = null;

        if ( $(".breadcrumb-item.bc-wait").hasClass("active") ) {
          complete_step("Wait")
        }
      }
    } catch(e) {
      if (e.data.error == "txnNotFound" && e.data.searched_all) {
        $("#tx-validation-status").html(
          `<th>Final Result:</th><td>Failed to achieve consensus (final)</td>`)
        waiting_for_tx = null;
      } else {
        $("#tx-validation-status").html(
          `<th>Final Result:</th><td>Unknown</td>`)
      }
    }
  }

})

// Intermission ----------------------------------------------------------------
async function intermission_submit(tx_json) {
  const secret = $("#use-secret").text()
  let prepared = await api.prepareTransaction(tx_json)
  let signed = api.sign(prepared.txJSON, secret)
  let prelim_result = await api.request("submit",
                                        {"tx_blob": signed.signedTransaction})

  $("#intermission-output").append(`<p>${tx_json.TransactionType}
    ${prepared.instructions.sequence}:
    <a href="https://devnet.xrpl.org/transactions/${signed.id}"
    target="_blank">${prelim_result.engine_result}</a></p>`)
}

$("#intermission-payment").click( async function() {
  const address = $("#use-address").text()

  intermission_submit({
    "TransactionType": "Payment",
    "Account": address,
    "Destination": "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe", // TestNet Faucet
    "Amount": api.xrpToDrops("201")
  })

  complete_step("Intermission")
})

$("#intermission-escrowcreate").click( async function() {
  const address = $("#use-address").text()

  intermission_submit({
    "TransactionType": "EscrowCreate",
    "Account": address,
    "Destination": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh", // Genesis acct
    "Amount": api.xrpToDrops("0.13"), // Arbitrary amount
    "FinishAfter": api.iso8601ToRippleTime(Date()) + 30 // 30 seconds from now
  })

  complete_step("Intermission")
})

$("#intermission-accountset").click( async function() {
  const address = $("#use-address").text()

  intermission_submit({
    "TransactionType": "AccountSet",
    "Account": address
  })

  complete_step("Intermission")
})

// 7. Check Available Tickets --------------------------------------------------
$("#check-tickets").click( async function(event) {
  const block = $(event.target).closest(".interactive-block")
  const address = $("#use-address").text()
  // Wipe previous output
  $("#check-tickets-output").html("")

  let response = await api.request("account_objects", {
      "account": address,
      "type": "ticket"
    })
  $("#check-tickets-output").html(
    `<pre><code>${pretty_print(response)}</code></pre>`)

  // Reset the next step's form & add these tickets
  $("#ticket-selector .form-area").html("")
  response.account_objects.forEach((ticket, i) => {
      $("#ticket-selector .form-area").append(
        `<div class="form-check form-check-inline">
        <input class="form-check-input" type="radio" id="ticket${i}"
        name="ticket-radio-set" value="${ticket.TicketSequence}">
        <label class="form-check-label"
        for="ticket${i}">${ticket.TicketSequence}</label></div>`)
    })

  complete_step("Check Tickets")
})

// 8. Prepare Ticketed Transaction ---------------------------------------------
$("#prepare-ticketed-tx").click(async function(event) {
  const block = $(event.target).closest(".interactive-block")
  block.find(".output-area").html("")
  const use_ticket = parseInt($('input[name="ticket-radio-set"]:checked').val())
  if (!use_ticket) {
    block.find(".output-area").append(
      `<p class="devportal-callout warning"><strong>Error</strong>
      You must choose a ticket first.</p>`)
    return
  }

  const address = $("#use-address").text()
  const secret = $("#use-secret").text()

  let prepared_t = await api.prepareTransaction({
    "TransactionType": "AccountSet",
    "Account": address,
    "TicketSequence": use_ticket,
    "Sequence": 0
  }, {
    maxLedgerVersionOffset: 20
  })

  block.find(".output-area").append(
    `<p>Prepared transaction:</p>
    <pre><code>${pretty_print(prepared_t.txJSON)}</code></pre>`)
  $("#lastledgersequence_t").html( //REMEMBER
    `<code>${prepared_t.instructions.maxLedgerVersion}</code>`)

  let signed_t = api.sign(prepared_t.txJSON, secret)
  block.find(".output-area").append(
    `<p>Transaction hash: <code id="tx_id_t">${signed_t.id}</code></p>`)

  let tx_blob_t = signed_t.signedTransaction
  block.find(".output-area").append(
    `<pre style="visibility: none">
    <code id="tx_blob_t">${tx_blob_t}</code></pre>`)

  // Update breadcrumbs & activate next step
  complete_step("Prepare Ticketed Tx")
})

// 9. Submit Ticketed Transaction ----------------------------------------------
$("#ticketedtx-submit").click( async function(event) {
  const block = $(event.target).closest(".interactive-block")
  const tx_blob = $("#tx_blob_t").text()
  // Wipe previous output
  block.find(".output-area").html("")

  waiting_for_tx_t = $("#tx_id_t").text() // next step uses this
  let prelim_result = await api.request("submit", {"tx_blob": tx_blob})
  block.find(".output-area").append(
    `<p>Preliminary result:</p>
    <pre><code>${pretty_print(prelim_result)}</code></pre>`)
  $("#earliest-ledger-version_t").text(prelim_result.validated_ledger_index)

  complete_step("Submit Ticketed Tx")
})

// 10. Wait for Validation (again) ---------------------------------------------
let waiting_for_tx_t = null;
api.on('ledger', async (ledger) => {
  $("#current-ledger-version_t").text(ledger.ledgerVersion)

  let tx_result;
  if (waiting_for_tx_t) {
    try {
      tx_result = await api.request("tx", {
          "transaction": waiting_for_tx_t,
          "min_ledger": parseInt($("#earliest-ledger-version_t").text()),
          "max_ledger": parseInt($("#lastledgersequence_t").text())
      })
      console.log(tx_result)
      if (tx_result.validated) {
        $("#tx-validation-status_t").html(
          `<th>Final Result:</th><td>${tx_result.meta.TransactionResult}
          (<a href="https://devnet.xrpl.org/transactions/${waiting_for_tx_t}"
          target="_blank">Validated</a>)</td>`)
        waiting_for_tx_t = null;

        if ( $(".breadcrumb-item.bc-wait_again").hasClass("active") ) {
          complete_step("Wait Again")
        }
      }
    } catch(e) {
      if (e.data.error == "txnNotFound" && e.data.searched_all) {
        $("#tx-validation-status_t").html(
          `<th>Final Result:</th><td>Failed to achieve consensus (final)</td>`)
        waiting_for_tx_t = null;
      } else {
        $("#tx-validation-status_t").html(
          `<th>Final Result:</th><td>Unknown</td>`)
      }
    }
  }
})
})
