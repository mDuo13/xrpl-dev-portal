---
html: look-up-escrows.html
parent: use-escrows.html
blurb: Look up pending escrows by sender or destination address.
labels:
  - Escrow
  - Smart Contracts
---
# Look up Escrows

All pending escrows are stored in the ledger as [Escrow objects](../../../concepts/payment-types/escrow.md). You can look them up by the sender's address or the destination address.

**Note:** You can only look up pending escrow objects by destination address if those escrows were created after the [fix1523 amendment](known-amendments.html#fix1523) was enabled on 2017-11-14.

Use the [account_objects method](../../../references/http-websocket-apis/public-api-methods/account-methods/account_objects.md), where the sender or destination address is the `account` value.

Request:

<!-- MULTICODE_BLOCK_START -->

_Websocket_

```json
{% include '_code-samples/escrow/websocket/account_objects-request.json' %}
```

<!-- MULTICODE_BLOCK_END -->

The response includes all pending escrow objects with `rfztBskAVszuS3s5Kq7zDS74QtHrw893fm`, where the sender address is the `Account` value, or the destination address is the `Destination` value.

Response:

<!-- MULTICODE_BLOCK_START -->

_Websocket_

```json
{% include '_code-samples/escrow/websocket/account_objects-response.json' %}
```

<!-- MULTICODE_BLOCK_END -->



## See Also

- **Concepts:**
    - [What is XRP?](../../../concepts/introduction/what-is-xrp.md)
    - [Payment Types](payment-types.html)
        - [Escrow](../../../concepts/payment-types/escrow.md)
- **Tutorials:**
    - [Send XRP](../../get-started/send-xrp.md)
    - [Look Up Transaction Results](../../../concepts/transactions/look-up-transaction-results.md)
    - [Reliable Transaction Submission](../../../concepts/transactions/reliable-transaction-submission.md)
- **References:**
    - [EscrowCancel transaction](../../../references/protocol-reference/transactions/transaction-types/escrowcancel.md)
    - [EscrowCreate transaction](../../../references/protocol-reference/transactions/transaction-types/escrowcreate.md)
    - [EscrowFinish transaction](../../../references/protocol-reference/transactions/transaction-types/escrowfinish.md)
    - [account_objects method](../../../references/http-websocket-apis/public-api-methods/account-methods/account_objects.md)
    - [tx method](../../../references/http-websocket-apis/public-api-methods/transaction-methods/tx.md)
    - [Escrow ledger object](../../../references/protocol-reference/ledger-data/ledger-entry-types/escrow.md)


<!--{# common link defs #}-->
{% include '_snippets/rippled-api-links.md' %}			
{% include '_snippets/tx-type-links.md' %}			
{% include '_snippets/rippled_versions.md' %}
