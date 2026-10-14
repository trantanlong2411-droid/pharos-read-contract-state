import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Interface, formatUnits } from 'ethers';

const MCP_URL = process.env.PHAROS_MCP_URL || 'https://mcp.pharos.xyz/mcp';
const CONTRACT = '0x51e2A24742Db77604B881d6781Ee16B5b8fcBE29';
const FIXED_BLOCK = '0x1348ad4';
const functions = ['name', 'symbol', 'decimals', 'totalSupply'];
const abi = new Interface([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
]);

function decodeToolResult(result) {
  if (result?.isError) throw new Error(JSON.stringify(result.content ?? result));
  const queue = [result?.structuredContent, ...(result?.content ?? [])];
  while (queue.length) {
    const next = queue.shift();
    if (next == null) continue;
    if (typeof next === 'string') {
      const trimmed = next.trim();
      if (/^0x[0-9a-fA-F]+$/.test(trimmed)) return trimmed;
      try { queue.unshift(JSON.parse(trimmed)); } catch { /* not JSON */ }
    } else if (Array.isArray(next)) queue.unshift(...next);
    else if (typeof next === 'object') {
      for (const key of ['result', 'output', 'data', 'value', 'hex', 'text', 'content', 'response']) {
        if (next[key] != null) queue.unshift(next[key]);
      }
    }
  }
  throw new Error('MCP returned no recognizable hex result: ' + JSON.stringify(result).slice(0, 800));
}

async function main() {
  const block = process.argv.includes('--latest') ? 'latest' : FIXED_BLOCK;
  const client = new Client({ name: 'pharos-read-contract-state', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
  try {
    await client.connect(transport);
    const network = await client.callTool({ name: 'get_chain_info', arguments: {} });
    const networkText = JSON.stringify(network);
    if (!networkText.includes('1672') && !networkText.toLowerCase().includes('688')) {
      throw new Error('Could not verify Pharos Chain ID 1672: ' + networkText.slice(0, 400));
    }
    const outputs = {};
    for (const fn of functions) {
      const calldata = abi.encodeFunctionData(fn);
      const result = await client.callTool({
        name: 'eth_call',
        arguments: { transaction: { to: CONTRACT, data: calldata }, block },
      });
      const raw = decodeToolResult(result);
      const decoded = abi.decodeFunctionResult(fn, raw)[0];
      outputs[fn] = { selector: calldata, raw, decoded: decoded.toString() };
    }
    const supply = formatUnits(BigInt(outputs.totalSupply.decoded), Number(outputs.decimals.decoded));
    console.log(JSON.stringify({
      network: 'Pharos Mainnet', chainId: 1672, contract: CONTRACT,
      block, values: outputs, humanReadableSupply: `${supply} ${outputs.symbol.decoded}`,
      readOnly: true,
    }, null, 2));
  } finally {
    await client.close();
  }
}
main().catch(e => { console.error('Query failed:', e.message); process.exitCode = 1; });
