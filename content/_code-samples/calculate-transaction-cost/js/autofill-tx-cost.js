const xrpl = require("xrpl")
async function main() {
  const client = new xrpl.Client("wss://s1.ripple.com/")
  await client.connect()

  const tx_json = {
    "TransactionType": "AccountSet",
    "Account": "rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn"
  }
  const tx_autofilled = await client.autofill(tx_json)
  console.log("Autofilled tx cost:", xrpl.dropsToXrp(tx_autofilled.Fee), "XRP")
  // example: "Autofilled tx cost: 0.007101 XRP"

  client.disconnect()
}
main()
