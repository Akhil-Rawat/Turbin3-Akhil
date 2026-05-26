import { run } from '../src/litesvm';
import { vaultProgram, createVaultAccount } from '../src/vault';

describe('Vault program', () => {
  it('initializes vault', async () => {
    const acct = createVaultAccount('vault1');
    const result = await run(vaultProgram, [acct], {
      programId: 'vault_program',
      accounts: [acct.pubkey],
      data: { cmd: 'initialize', authority: 'auth1' },
    });
    const updated = result[0];
    expect(updated.data.isInitialized).toBe(true);
    expect(updated.data.authority).toBe('auth1');
    expect(updated.data.balance).toBe(0);
  });

  it('deposits funds', async () => {
    const acct = createVaultAccount('vault2');
    // init first
    await run(vaultProgram, [acct], { programId: 'vault_program', accounts: [acct.pubkey], data: { cmd: 'initialize', authority: 'auth2' } });
    const after = await run(vaultProgram, [acct], { programId: 'vault_program', accounts: [acct.pubkey], data: { cmd: 'deposit', amount: 100 } });
    const updated = after[0];
    expect(updated.data.balance).toBe(100);
    expect(updated.lamports).toBe(100);
  });

  it('withdraws funds by authority', async () => {
    const acct = createVaultAccount('vault3', 'vault_program', 0);
    await run(vaultProgram, [acct], { programId: 'vault_program', accounts: [acct.pubkey], data: { cmd: 'initialize', authority: 'owner3' } });
    await run(vaultProgram, [acct], { programId: 'vault_program', accounts: [acct.pubkey], data: { cmd: 'deposit', amount: 200 } });
    const after = await run(vaultProgram, [acct], { programId: 'vault_program', accounts: [acct.pubkey], data: { cmd: 'withdraw', amount: 80, requester: 'owner3' } });
    const updated = after[0];
    expect(updated.data.balance).toBe(120);
    expect(updated.lamports).toBe(120);
  });

  it('prevents unauthorized withdraw', async () => {
    const acct = createVaultAccount('vault4');
    await run(vaultProgram, [acct], { programId: 'vault_program', accounts: [acct.pubkey], data: { cmd: 'initialize', authority: 'owner4' } });
    await run(vaultProgram, [acct], { programId: 'vault_program', accounts: [acct.pubkey], data: { cmd: 'deposit', amount: 50 } });
    await expect(run(vaultProgram, [acct], { programId: 'vault_program', accounts: [acct.pubkey], data: { cmd: 'withdraw', amount: 10, requester: 'hacker' } })).rejects.toThrow('Unauthorized');
  });

  it('sets new authority', async () => {
    const acct = createVaultAccount('vault5');
    await run(vaultProgram, [acct], { programId: 'vault_program', accounts: [acct.pubkey], data: { cmd: 'initialize', authority: 'owner5' } });
    await run(vaultProgram, [acct], { programId: 'vault_program', accounts: [acct.pubkey], data: { cmd: 'setAuthority', requester: 'owner5', newAuthority: 'owner5b' } });
    const after = await run(vaultProgram, [acct], { programId: 'vault_program', accounts: [acct.pubkey], data: { cmd: 'deposit', amount: 10 } });
    const updated = after[0];
    expect(updated.data.authority).toBe('owner5b');
  });
});
