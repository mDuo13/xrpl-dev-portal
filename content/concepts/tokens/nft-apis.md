---
html: nft-apis.html
parent: non-fungible-tokens.html
blurb: Specialized APIs let you access useful NFT metadata.
labels:
 - Non-fungible Tokens, NFTs
---
# NFT APIs

This page lists the transactions and requests associated with NFTs as a handy reference.

## NFT Objects

- [NFToken](../../references/protocol-reference/data-types/nftoken.md) data type - The NFT object stored on the ledger.
- Ledger Objects
    - [NFTokenOffer object](../../references/protocol-reference/ledger-data/ledger-entry-types/nftokenoffer.md) - An offer to buy or sell an NFT.
    - [NFTokenPage object](../../references/protocol-reference/ledger-data/ledger-entry-types/nftokenpage.md) - An NFT page holds a maximum of 32 NFT objects. In practice, each NFT page typically holds 16-24 NFTs.

## NFT Transactions

- [NFTokenMint](../../references/protocol-reference/transactions/transaction-types/nftokenmint.md) - Create an NFT.

- [NFTokenCreateOffer](../../references/protocol-reference/transactions/transaction-types/nftokencreateoffer.md) - Create an offer to buy or sell an NFT.

- [NFTokenCancelOffer](../../references/protocol-reference/transactions/transaction-types/nftokencanceloffer.md) - Cancel an offer to buy or sell an NFT.

- [NFTokenAcceptOffer](../../references/protocol-reference/transactions/transaction-types/nftokenacceptoffer.md) - Accept an offer to buy or sell an NFT.

- [NFTokenBurn](../../references/protocol-reference/transactions/transaction-types/nftokenburn.md) - Permanently destroy an NFT.

## NFT requests

- [account_nfts method](../../references/http-websocket-apis/public-api-methods/account-methods/account_nfts.md) - Get a list of non-fungible tokens owned by an account.
- [nft_buy_offers method](../../references/http-websocket-apis/public-api-methods/path-and-order-book-methods/nft_buy_offers.md) - Get a list of buy offers for a specified NFToken object.
- [nft_sell_offers method](../../references/http-websocket-apis/public-api-methods/path-and-order-book-methods/nft_sell_offers.md) - Get a list of sell offers for a specified NFToken object.
- [subscribe method](../../references/http-websocket-apis/public-api-methods/subscription-methods/subscribe.md) - Listen for updates about a particular subject. For example, a marketplace can publish real-time updates on the status of NFTs listed on their platform.
- [unsubscribe method](../../references/http-websocket-apis/public-api-methods/subscription-methods/unsubscribe.md) - Stop listening for updates about an NFT.

## Clio

Clio servers enhance overall network performance by handling requests for information based on cached information, freeing up validators on the XRP Ledger to focus on processing transactions. In addition to all of the common XRP Ledger request types, the Clio server handles additional request types that provide more detailed responses.

### Clio-specific NFT requests

- [nft_info](../../references/http-websocket-apis/public-api-methods/clio-methods/nft_info.md) - Get current status information about the specified NFT.
- [nft_history](../../references/http-websocket-apis/public-api-methods/clio-methods/nft_history.md) - Get past transaction metadata for the specified NFT.

<!-- 
[nfts_by_issuer](nfts_by_issuer.html) - Get a list of all NFTs created by the specified issuer.
-->

You can access a public Clio server by sending a request to its URL and Clio port (typically 51233). Public Clio API servers come with no SLAs nor any responsibility to be fixed on priority. If your business use case requires continual monitoring and information requests, consider setting up your own Clio server instance. See [install-clio-on-ubuntu](../../infrastructure/clio/install-clio-on-ubuntu.md).

<!--{# common link defs #}-->
{% include '_snippets/rippled-api-links.md' %}			
{% include '_snippets/tx-type-links.md' %}			
{% include '_snippets/rippled_versions.md' %}