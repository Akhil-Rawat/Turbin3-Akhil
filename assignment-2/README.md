# Assignment 2

This project mints both of the Week 2 deliverables from scratch:

1. An SPL token mint on Solana devnet.
2. An MPL Core NFT with a core plugin attached.

The NFT uses the `FreezeDelegate` core plugin so the asset is created with a real MPL Core plugin, not a placeholder.

# Result Achieved 

SPL token minted successfully

Mint: HigWza6kwM83RiQL9ksPzXqqREDfmDoAhHtSrkXn4c7d

Associated token account: B61FoBte3iud2SBHsEZyjsW9MuYSp531bMDLDWSHs2an

Amount minted: 100 tokens (100000000000 base units)

MPL Core NFT minted successfully

Asset: CbHqmEGBmXC6zoDkr7KnhPc3HvakPkgar8vMi5rMkvhh

Name: Turbin3 Core NFT

URI: https://example.com/metadata.json

Plugin: FreezeDelegate (frozen=false) 


## Stack

- TypeScript
- `@solana/web3.js`
- `@solana/spl-token`
- `@metaplex-foundation/mpl-core`
- Umi + web3.js adapters

## Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy the example environment file and fill in your wallet path:

   ```sh
   cp .env.example .env
   ```

3. Make sure the wallet in `KEYPAIR_PATH` has devnet SOL. The script will try a small devnet airdrop automatically if the balance is low.

## Environment

| Variable | Description | Default |
| --- | --- | --- |
| `SOLANA_RPC_URL` | RPC endpoint to use | `https://api.devnet.solana.com` |
| `KEYPAIR_PATH` | Path to your Solana keypair JSON file | required |
| `SPL_AMOUNT` | Whole-token amount to mint | `100` |
| `SPL_DECIMALS` | Decimals for the mint | `9` |
| `NFT_NAME` | MPL Core asset name | `Turbin3 Core NFT` |
| `NFT_URI` | MPL Core metadata URI | `https://example.com/metadata.json` |
| `NFT_PLUGIN_FROZEN` | `true` to mint the NFT frozen, `false` to mint it unfrozen | `false` |

## Run

Mint both assets:

```sh
npm run mint:all
```

Mint only the SPL token:

```sh
npm run mint:spl
```

Mint only the MPL Core NFT:

```sh
npm run mint:nft
```

## What the script does

- Reads your wallet keypair from `KEYPAIR_PATH`.
- Creates a fresh SPL mint and mints the configured supply to your associated token account.
- Mints a new MPL Core asset and attaches the `FreezeDelegate` plugin during creation.

## Notes

- Use devnet for the assignment unless your course instructions say otherwise.
- The `NFT_URI` should point to valid JSON metadata if you want to open the asset in a marketplace or explorer.
- If you want the NFT to start frozen, set `NFT_PLUGIN_FROZEN=true`.
