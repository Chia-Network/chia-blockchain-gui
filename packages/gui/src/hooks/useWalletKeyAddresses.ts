import { toBech32m } from '@chia-network/api';
import { useGetKeysQuery } from '@chia-network/api-react';
import { useCurrencyCode } from '@chia-network/core';
import { AugSchemeMPL, JacobianPoint } from 'chia-bls';
import { Program } from 'clvm-lib';
import { useMemo } from 'react';

const standardTransaction = Program.deserializeHex(
  'ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080'
);
const syntheticPublicKey = Program.deserializeHex('ff1dff02ffff1effff0bff02ff05808080');
const defaultHiddenPuzzleHash = Program.deserializeHex('ff0980').hash();

export function getWalletPuzzle(publicKey: JacobianPoint, index: number): Program {
  return standardTransaction.curry([
    Program.fromJacobianPoint(calculateSyntheticPublicKey(derivePublicKey(publicKey, index))),
  ]);
}

export function calculateSyntheticPublicKey(
  publicKey: JacobianPoint,
  hiddenPuzzleHash: Uint8Array = defaultHiddenPuzzleHash
): JacobianPoint {
  return JacobianPoint.fromBytes(
    syntheticPublicKey.run(
      Program.fromList([Program.fromJacobianPoint(publicKey), Program.fromBytes(hiddenPuzzleHash)])
    ).value.atom,
    false
  );
}

export function derivePublicKeyPath(publicKey: JacobianPoint, path: number[]): JacobianPoint {
  let derivedPublicKey = publicKey;
  for (const index of path) derivedPublicKey = AugSchemeMPL.deriveChildPkUnhardened(derivedPublicKey, index);
  return derivedPublicKey;
}

export function derivePublicKey(masterPublicKey: JacobianPoint, index: number): JacobianPoint {
  return derivePublicKeyPath(masterPublicKey, [12_381, 8444, 2, index]);
}

export default function useWalletKeyAddresses() {
  const currencyCode = useCurrencyCode();
  const { data: keys, isLoading } = useGetKeysQuery({});

  const addresses = useMemo(() => {
    if (isLoading || !keys || !currencyCode) {
      return [];
    }

    return keys.map((keyInfo) => {
      const publicKey = JacobianPoint.fromHexG1(
        keyInfo.publicKey.startsWith('0x') ? keyInfo.publicKey.substring(2) : keyInfo.publicKey
      );

      const walletPuzzle = getWalletPuzzle(publicKey, 0);
      const walletPuzzleHash = walletPuzzle.hashHex();
      const walletAddress = toBech32m(walletPuzzleHash, currencyCode);

      return walletAddress;
    });
  }, [keys, isLoading, currencyCode]);

  return { addresses, isLoading };
}
