const { XrplClient } = require('xrpl-client')
const client = new XrplClient()

const calculateFees = feeDataset => {
    const queue_pct = Number(feeDataset.current_queue_size) / Number(feeDataset.max_queue_size)
    const fee_suggested = queue_pct === 1
        ? 'fee_high'
        : queue_pct === 0
            ? 'fee_low'
            : 'fee_medium'

    const {minimum_fee, median_fee, open_ledger_fee} = Object.keys(feeDataset.drops)
        .reduce((a, b) => Object.assign(a, { [b]: Number(feeDataset.drops[b]) }), {})
    
    const fee_medium = Math.min(
        queue_pct > .1
            ? Math.round((minimum_fee + median_fee + open_ledger_fee) / 3)
            : queue_pct === 0
                ? Math.max(10 * minimum_fee, Math.min(minimum_fee, open_ledger_fee))
                : Math.max(10 * minimum_fee, Math.round((minimum_fee + median_fee) / 2)),
        10_000
    )

    const fee_high = Math.min(
        Math.max(10 * minimum_fee, Math.round(Math.max(median_fee, open_ledger_fee) * 1.1)),
        100_000
    )

    const fee_low = Math.min(
        Math.max(minimum_fee, Math.round(Math.max(median_fee, open_ledger_fee) / 500)),
        1_000
    )

    return {
        current_queue_size: feeDataset.current_queue_size,
        max_queue_size: feeDataset.max_queue_size,
        queue_pct,
        fee_low,
        fee_medium,
        fee_high,
        fee_suggested
    }

}

const main = async () => {
    setInterval(async () => {
        console.log(calculateFees(await client.send({ command: 'fee' })))
    }, 4000)
}

main()
