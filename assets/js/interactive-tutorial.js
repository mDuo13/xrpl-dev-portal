// Helper functions for interactive tutorials

function slugify(s) {
  const unacceptable_chars = /[^A-Za-z0-9._ ]+/g
  const whitespace_regex = /\s+/g
  s = s.replace(unacceptable_chars, "")
  s = s.replace(whitespace_regex, "_")
  s = s.toLowerCase()
  if (!s) {
    s = "_"
  }
  return s
}

function complete_step(step_name) {
  const step_id = slugify(step_name)
  $(".bc-"+step_id).removeClass("active").addClass("done")
  $(".bc-"+step_id).next().removeClass("disabled").addClass("active")

  // Enable follow-up steps that require this step to be done first
  const next_ui = $(`#interactive-${step_id}`).nextAll(
                    ".interactive-block").eq(0).find(".previous-steps-required")
  next_ui.prop("title", "")
  next_ui.prop("disabled", false)
}

function pretty_print(j) {
  try {
    return JSON.stringify(JSON.parse(j),null,2)
  } catch (e) {
    // probably already decoded JSON
    return JSON.stringify(j,null,2)
  }
}

function disable_followup_steps() {
  $(".previous-steps-required").prop("title", "Complete all previous steps first")
  $(".previous-steps-required").prop("disabled", true)
}

function handle_generate_step() {
  const EXAMPLE_ADDR = "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe"
  const EXAMPLE_SECRET = "s████████████████████████████"

  $("#generate-creds-button").click( (event) => {
    const block = $(event.target).closest(".interactive-block")
    block.find(".output-area").html("")
    block.find(".loader").show()
    // Get faucet URL (Testnet/Devnet/etc.)
    const faucet_url = $("#generate-creds-button").data("fauceturl")

    $.ajax({
      url: faucet_url,
      type: 'POST',
      dataType: 'json',
      success: function(data) {
        block.find(".loader").hide()
        block.find(".output-area").html(`<div><strong>Address:</strong>
            <span id="use-address">${data.account.address}</span></div>
            <div><strong>Secret:</strong>
            <span id="use-secret">${data.account.secret}</span></div>
            <strong>Balance:</strong>
            ${Number(data.balance).toLocaleString('en')} XRP`)

        // Automatically populate all examples in the page with the
        // generated credentials...
        $("code span:contains('"+EXAMPLE_ADDR+"')").each( function() {
          let eltext = $(this).text()
          $(this).text( eltext.replace(EXAMPLE_ADDR, data.account.address) )
        })
        $("code span:contains('"+EXAMPLE_SECRET+"')").each( function() {
          let eltext = $(this).text()
          $(this).text( eltext.replace(EXAMPLE_SECRET, data.account.secret) )
        })

        block.find(".output-area").append("<p>Populated this page's examples with these credentials.</p>")

        complete_step("Generate")
      },
      error: function() {
        block.find(".loader").hide()
        block.find(".output-area").html(
          `<p class="devportal-callout warning"><strong>Error:</strong>
          There was an error connecting to the Faucet. Please
          try again.</p>`)
        return;
      }
    })
  })
}

function handle_connect_step() {
  // Handle the "Connect" step (_snippets/interactive-tutorials/connect-step.md)
  const ws_url = $("#connect-button").data("wsurl")
  if (!ws_url) {
    console.error("Interactive Tutorial: WS URL not found. Did you set use_network?")
    return
  }
  api = new ripple.RippleAPI({server: ws_url})
  api.on('connected', async function() {
    $("#connection-status").text("Connected")
    $("#connect-button").prop("disabled", true)
    $("#loader-connect").hide()

    // Update breadcrumbs & activate next step
    complete_step("Connect")
    $("#check-sequence").prop("disabled", false)
    $("#check-sequence").prop("title", "")
  })
  api.on('disconnected', (code) => {
    $("#connection-status").text( "Disconnected ("+code+")" )
    $("#connect-button").prop("disabled", false)
    $(".connection-required").prop("disabled", true)
    $(".connection-required").prop("title", "Connection required")

    disable_followup_steps()
  })
  $("#connect-button").click(() => {
    $("#connection-status").text( "Connecting..." )
    $("#loader-connect").show()
    api.connect()
  })
}

$(document).ready(() => {
  disable_followup_steps()
  handle_generate_step()
  handle_connect_step()
})
