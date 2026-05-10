import 'dotenv/config';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { generateSigner, keypairIdentity } from '@metaplex-foundation/umi';
import { create as createCoreAsset, mplCore } from '@metaplex-foundation/mpl-core';
import { createUmi as createUmiFromBundle } from '@metaplex-foundation/umi-bundle-defaults';
import { fromWeb3JsKeypair } from '@metaplex-foundation/umi-web3js-adapters';

type MintMode = 'spl' | 'nft' | 'all';

type AppConfig = {
  rpcUrl: string;
  keypairPath: string;
  splAmount: bigint;
  splDecimals: number;
  nftName: string;
  nftUri: string;
  nftPluginFrozen: boolean;
};

const parseMode = (value: string | undefined): MintMode => {
  if (value === 'spl' || value === 'nft' || value === 'all') {
    return value;
  }

  return 'all';
};

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const loadConfig = (): AppConfig => {
  const rpcUrl = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
  const keypairPath = process.env.KEYPAIR_PATH;

  if (!keypairPath) {
    throw new Error('KEYPAIR_PATH is required. Set it in .env or your shell environment.');
  }

  const splAmountRaw = process.env.SPL_AMOUNT ?? '100';
  const splDecimalsRaw = process.env.SPL_DECIMALS ?? '9';
  const nftName = process.env.NFT_NAME ?? 'Turbin3 Core NFT';
  const nftUri = process.env.NFT_URI ?? 'https://example.com/metadata.json';

  const splDecimals = Number.parseInt(splDecimalsRaw, 10);
  if (!Number.isInteger(splDecimals) || splDecimals < 0 || splDecimals > 9) {
    throw new Error('SPL_DECIMALS must be an integer between 0 and 9.');
  }

  const splAmount = BigInt(splAmountRaw);

  return {
    rpcUrl,
    keypairPath,
    splAmount,
    splDecimals,
    nftName,
    nftUri,
    nftPluginFrozen: parseBoolean(process.env.NFT_PLUGIN_FROZEN, false),
  };
};

const loadKeypair = async (keypairPath: string): Promise<Keypair> => {
  const absolutePath = path.resolve(keypairPath);
  const secretKeyBytes = JSON.parse(await readFile(absolutePath, 'utf8')) as number[];

  return Keypair.fromSecretKey(Uint8Array.from(secretKeyBytes));
};

const maybeAirdrop = async (connection: Connection, publicKey: Keypair['publicKey']): Promise<void> => {
  const balance = await connection.getBalance(publicKey, 'confirmed');
  const rpcUrl = connection.rpcEndpoint;

  if (balance >= 0.01 * LAMPORTS_PER_SOL) {
    return;
  }

  if (!rpcUrl.includes('devnet') && !rpcUrl.includes('localhost')) {
    return;
  }

  try {
    const signature = await connection.requestAirdrop(publicKey, 2 * LAMPORTS_PER_SOL);
    const latestBlockhash = await connection.getLatestBlockhash('confirmed');
    await connection.confirmTransaction(
      {
        signature,
        ...latestBlockhash,
      },
      'confirmed'
    );
  } catch (error) {
    console.warn(
      `Airdrop skipped: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

const mintSplToken = async (connection: Connection, payer: Keypair, config: AppConfig): Promise<void> => {
  const mintAuthority = payer.publicKey;
  const freezeAuthority = payer.publicKey;
  const mint = await createMint(
    connection,
    payer,
    mintAuthority,
    freezeAuthority,
    config.splDecimals
  );

  const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  );

  const amount = config.splAmount * 10n ** BigInt(config.splDecimals);
  await mintTo(connection, payer, mint, associatedTokenAccount.address, mintAuthority, amount);

  console.log('SPL token minted successfully');
  console.log(`Mint: ${mint.toBase58()}`);
  console.log(`Associated token account: ${associatedTokenAccount.address.toBase58()}`);
  console.log(`Amount minted: ${config.splAmount.toString()} tokens (${amount.toString()} base units)`);
};

const mintMplCoreNft = async (payer: Keypair, config: AppConfig): Promise<void> => {
  const umi = createUmiFromBundle(config.rpcUrl)
    .use(mplCore())
    .use(keypairIdentity(fromWeb3JsKeypair(payer)));

  const assetSigner = generateSigner(umi);
  const builder = createCoreAsset(umi, {
    asset: assetSigner,
    name: config.nftName,
    uri: config.nftUri,
    plugins: [
      {
        type: 'FreezeDelegate',
        frozen: config.nftPluginFrozen,
      },
    ],
  });

  await builder.sendAndConfirm(umi);

  console.log('MPL Core NFT minted successfully');
  console.log(`Asset: ${assetSigner.publicKey}`);
  console.log(`Name: ${config.nftName}`);
  console.log(`URI: ${config.nftUri}`);
  console.log(`Plugin: FreezeDelegate (frozen=${String(config.nftPluginFrozen)})`);
};

const main = async (): Promise<void> => {
  const mode = parseMode(process.argv[2]);
  const config = loadConfig();
  const payer = await loadKeypair(config.keypairPath);
  const connection = new Connection(config.rpcUrl, 'confirmed');

  await maybeAirdrop(connection, payer.publicKey);

  if (mode === 'spl' || mode === 'all') {
    await mintSplToken(connection, payer, config);
  }

  if (mode === 'nft' || mode === 'all') {
    await mintMplCoreNft(payer, config);
  }
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});