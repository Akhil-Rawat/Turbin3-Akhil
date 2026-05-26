import { Account, Instruction, Program } from './litesvm';

export type VaultData = {
  isInitialized: boolean;
  authority: string | null;
  balance: number;
};

export const VAULT_PROGRAM_ID = 'vault_program';

export const vaultProgram: Program = (accounts, ix) => {
  const acctPub = ix.accounts[0];
  const acct = accounts.get(acctPub);
  if (!acct) throw new Error('Account not found');

  // ensure data shape
  if (!acct.data) acct.data = { isInitialized: false, authority: null, balance: 0 } as VaultData;
  const data = acct.data as VaultData;

  const cmd = ix.data?.cmd;
  switch (cmd) {
    case 'initialize': {
      const authority = ix.data.authority as string;
      if (data.isInitialized) throw new Error('Already initialized');
      data.isInitialized = true;
      data.authority = authority;
      data.balance = 0;
      break;
    }
    case 'deposit': {
      const amount = Number(ix.data.amount || 0);
      if (!data.isInitialized) throw new Error('Not initialized');
      if (amount <= 0) throw new Error('Invalid amount');
      data.balance += amount;
      acct.lamports += amount;
      break;
    }
    case 'withdraw': {
      const amount = Number(ix.data.amount || 0);
      const requester = ix.data.requester as string;
      if (!data.isInitialized) throw new Error('Not initialized');
      if (requester !== data.authority) throw new Error('Unauthorized');
      if (amount <= 0 || amount > data.balance) throw new Error('Invalid amount');
      data.balance -= amount;
      acct.lamports -= amount;
      break;
    }
    case 'setAuthority': {
      const newAuth = ix.data.newAuthority as string;
      const requester = ix.data.requester as string;
      if (!data.isInitialized) throw new Error('Not initialized');
      if (requester !== data.authority) throw new Error('Unauthorized');
      data.authority = newAuth;
      break;
    }
    default:
      throw new Error('Unknown instruction');
  }
};

export function createVaultAccount(pubkey: string, owner = VAULT_PROGRAM_ID, lamports = 0) {
  return {
    pubkey,
    owner,
    data: { isInitialized: false, authority: null, balance: 0 } as VaultData,
    lamports,
  };
}
