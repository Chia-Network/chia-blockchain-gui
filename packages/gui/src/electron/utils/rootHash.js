// const crypto = require('crypto');
// const { strict: assert } = require('node:assert');

// const std_hash = (s) => crypto.createHash('sha256').update(s).digest('hex');

// const sort_pairs = (pairs) =>
//   pairs.sort(([a], [b]) => {
//     if (a < b) {
//       return 1;
//     }
//     if (a > b) {
//       return -1;
//     }
//     return 0;
//   });

// const CHIA_TREE_HASH_ATOM_PREFIX = '01';
// const CHIA_TREE_HASH_PAIR_PREFIX = '02';

// const tree_hash = (node) => {
//   if (Array.isArray(node)) {
//     // Only supporting pairs and utf-8 string/boolean atoms
//     assert.equal(node.length, 2);

//     const left_hash = tree_hash(node[0]);
//     const right_hash = tree_hash(node[1]);

//     // Hashes pair
//     return std_hash(
//       Buffer.concat([
//         Buffer.from(CHIA_TREE_HASH_PAIR_PREFIX, 'hex'),
//         Buffer.from(left_hash, 'hex'),
//         Buffer.from(right_hash, 'hex'),
//       ])
//     );
//   }
//   // Hashes string key
//   if (typeof node === 'string') {
//     return std_hash(Buffer.concat([Buffer.from(CHIA_TREE_HASH_ATOM_PREFIX, 'hex'), Buffer.from(node, 'utf-8')]));
//   }

//   // Hashes boolean value
//   if (typeof node === 'boolean') {
//     return std_hash(
//       Buffer.concat([Buffer.from(CHIA_TREE_HASH_ATOM_PREFIX, 'hex'), Buffer.from(node ? '01' : '', 'hex')])
//     );
//   }

//   // Only supporting pairs containing string keys and boolean values
//   throw new Error('Unsupported type passed to hash function');
// };

// // Convert sorted listed to binary tree to be hashed
// const list_to_binary_tree = (objects) => {
//   if (objects.length == 1) {
//     return objects[0];
//   }

//   const mid = Math.floor(objects.length / 2);
//   const first_half = objects.slice(0, mid);
//   const second_half = objects.slice(mid, objects.length);

//   return [list_to_binary_tree(first_half), list_to_binary_tree(second_half)];
// };

// export function calculateRootHash(proofs) {
//   const kv_pairs = Object.entries(proofs);
//   const sorted = sort_pairs(kv_pairs);
//   const binary_tree = list_to_binary_tree(sorted);
//   const result = tree_hash(binary_tree);
//   return result;
// }
