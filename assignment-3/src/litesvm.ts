export type Account = {
  pubkey: string;
  owner: string;
  data: any;
  lamports: number;
};

export type Instruction = {
  programId: string;
  accounts: string[]; // account pubkeys
  data: any;
};

export type Program = (accounts: Map<string, Account>, ix: Instruction) => void | Promise<void>;

export async function run(program: Program, accounts: Account[], ix: Instruction) {
  const map = new Map<string, Account>();
  for (const a of accounts) map.set(a.pubkey, JSON.parse(JSON.stringify(a)));
  await program(map, ix);
  return Array.from(map.values());
}
