# Pharos Agent Arena: Read Contract State

Read-only ERC-20 state queries against the LINK token on Pharos Mainnet, performed through the Pharos MCP server. No transactions were sent and no private key was used.

## Run the actual MCP reader

The website is a static snapshot. The included [read-contract.js](./read-contract.js) is the reproducible, **executable** component that connects directly to the official hosted Pharos MCP endpoint using Streamable HTTP and performs four read-only `eth_call` requests.

Requirements: Node.js 20+.

```bash
npm install
npm run check
npm start
```

`npm start` reads the archived snapshot block `0x1348ad4` (20220628), making the results comparable with this README. For the current on-chain state:

```bash
npm run latest
```

The script calls `get_chain_info`, verifies Chain ID 1672, invokes `eth_call` for `name()`, `symbol()`, `decimals()` and `totalSupply()`, decodes responses using an ERC-20 ABI, formats the supply with exact integer arithmetic, then outputs JSON with selectors, raw hex and decoded values. No wallet, transaction, gas payment, API key, or private key is required.

A successful run prints JSON including `"humanReadableSupply": "2.972781885597664963 LINK"` for the pinned historical block. Network access and an operational Pharos MCP endpoint are required. If historical RPC state is unavailable, the pinned run may fail; `npm run latest` can query the latest state instead, but its numbers can differ.

Website: https://trantanlong2411-droid.github.io/pharos-read-contract-state/

---

## Target

| Field | Value |
|---|---|
| Network | Pharos Mainnet |
| Chain ID | 1672 (`0x688`) |
| RPC | https://rpc.pharos.xyz |
| Contract | `0x51e2A24742Db77604B881d6781Ee16B5b8fcBE29` (LINK token) |
| Pinned block | 20220628 (`0x1348ad4`) |

## How to reproduce

All calls use Pharos MCP tools, and every `eth_call` is pinned to the same block.

1. `get_chain_info` — confirm `chainId` is 1672 and `chainIdMatches` is `true`.
2. `get_block_number` — record the block (here `0x1348ad4`).
3. `eth_call` with `to` = the contract, `block` = `0x1348ad4`, and one `data` selector per call:

| Function | Selector |
|---|---|
| `name()` | `0x06fdde03` |
| `symbol()` | `0x95d89b41` |
| `decimals()` | `0x313ce567` |
| `totalSupply()` | `0x18160ddd` |

Example request:

```json
{
  "transaction": {
    "to": "0x51e2A24742Db77604B881d6781Ee16B5b8fcBE29",
    "data": "0x313ce567"
  },
  "block": "0x1348ad4"
}
```

## Actual sample output

| Function | Decoded value | Raw response |
|---|---|---|
| `name()` | `ChainLink Token` | `0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000f436861696e4c696e6b20546f6b656e0000000000000000000000000000000000` |
| `symbol()` | `LINK` | `0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000044c494e4b00000000000000000000000000000000000000000000000000000000` |
| `decimals()` | `18` | `0x0000000000000000000000000000000000000000000000000000000000000012` |
| `totalSupply()` | `2972781885597664963` (raw) | `0x0000000000000000000000000000000000000000000000002941715fddc3c6c3` |

Decoding notes:

- `name()` and `symbol()` return ABI-encoded dynamic strings: a 32-byte offset (`0x20`), a 32-byte length (15 and 4), then the UTF-8 bytes.
- `decimals()` and `totalSupply()` return a single `uint256` word.

### Formatted total supply

```
totalSupply / 10^decimals = 2972781885597664963 / 10^18 = 2.972781885597664963 LINK
```

## Notes

- All four calls succeeded; there were no failures or retries on the contract reads.
- The values are reported exactly as returned at block 20220628 and may differ at other blocks.
