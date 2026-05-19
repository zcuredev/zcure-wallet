import { describe, expect, it } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import { TreeType, type TreeInfo } from '@lightprotocol/stateless.js';
import { ZcureClient } from './index';

const treeInfo: TreeInfo = {
  tree: new PublicKey('11111111111111111111111111111111'),
  queue: new PublicKey('11111111111111111111111111111111'),
  treeType: TreeType.StateV1,
  nextTreeInfo: null,
};

describe('ZcureClient', () => {
  it('accepts explicit Light state tree configuration', () => {
    const client = ZcureClient.init({
      rpcUrl: 'http://localhost:8899',
      outputStateTreeInfo: treeInfo,
    });

    expect(client.getOutputStateTreeInfo()).toBe(treeInfo);
  });
});
