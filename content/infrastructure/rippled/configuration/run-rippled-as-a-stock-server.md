---
html: run-rippled-as-a-stock-server.html
parent: server-modes.html
blurb: A multipurpose configuration for anyone integrating XRP.
labels:
  - Core Server
---
# Run rippled as a Stock Server

A stock server is a multipurpose configuration for `rippled`. With a stock server, you can submit transactions to the XRP Ledger, access ledger history, and use the latest [tools](../../../concepts/introduction/software-ecosystem.md) to integrate with XRP and the XRP Ledger. You can connect client applications to the XRP Ledger using this server.


A stock server does all of the following:

- Connects to a [network of peers](../../../concepts/networks-and-servers/peer-protocol.md)

- Relays cryptographically signed [transactions](../../../concepts/transactions/transactions.md)

- Maintains a local copy of the complete shared global [ledger](../../../concepts/ledgers/ledgers.md)


To participate in the [consensus process](../../../concepts/consensus-protocol/consensus.md) as a validator, [run rippled as a validator](run-rippled-as-a-validator.md) instead.


## Install and run `rippled`

The default package installation installs a stock server with a small amount of transaction history. For installation steps, see [Install `rippled`](install-rippled.html).

After installation, you can adjust how much history your server stores at a time. For steps on how to do this, see [Configure Online Deletion](configure-online-deletion.md).

## Troubleshooting

For more information, see [Troubleshooting `rippled`](troubleshoot-the-rippled-server.html)


## See Also

- **Concepts:**
    - [XRP Ledger Overview](xrp-ledger-overview.html)
    - [The `rippled` Server](xrpl-servers.html)
- **Tutorials:**
    - [Cluster rippled Servers](../configure-peering/cluster-rippled-servers.md)
    - [Install `rippled`](install-rippled.html)
    - [Capacity Planning](../installation/capacity-planning.md)
- **References:**
    - [Validator Keys Tool Guide](https://github.com/ripple/validator-keys-tool/blob/master/doc/validator-keys-tool-guide.md)
    - [consensus_info method](../../../references/http-websocket-apis/admin-api-methods/status-and-debugging-methods/consensus_info.md)
    - [validator_list_sites method](../../../references/http-websocket-apis/admin-api-methods/status-and-debugging-methods/validator_list_sites.md)
    - [validators method](../../../references/http-websocket-apis/admin-api-methods/status-and-debugging-methods/validators.md)


<!--{# common link defs #}-->
{% include '_snippets/rippled-api-links.md' %}			
{% include '_snippets/tx-type-links.md' %}			
{% include '_snippets/rippled_versions.md' %}
