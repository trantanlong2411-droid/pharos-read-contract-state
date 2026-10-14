# Pharos Agent Arena: Read Contract State

Read-only ERC-20 state queries against the LINK token on Pharos Mainnet, performed through the Pharos MCP server. No transactions were sent and no private key was used.

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
