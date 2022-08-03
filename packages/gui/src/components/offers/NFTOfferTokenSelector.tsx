import React from 'react';

export default function NFTOfferTokenSelector() {
  return <div>NFTOfferTokenSelector</div>;
}

// [
//   {
//       "assetId": "a628c1c2c6fcb74d53746157e438e108eab5c0bb3e5c80ff9b1910b3e4832913",
//       "name": "Spacebucks",
//       "symbol": "SBX"
//   },
//   {
//       "assetId": "8ebf855de6eb146db5602f0456d2f0cbe750d57f821b6f91a8592ee9f1d4cf31",
//       "name": "Marmot",
//       "symbol": "MRMT"
//   },
//   {
//       "assetId": "6d95dae356e32a71db5ddcb42224754a02524c615c5fc35f568c2af04774e589",
//       "name": "Stably USD",
//       "symbol": "USDS"
//   },
//   {
//       "assetId": "509deafe3cd8bbfbb9ccce1d930e3d7b57b40c964fa33379b18d628175eb7a8f",
//       "name": "Chia Holiday 2021 Token",
//       "symbol": "CH21"
//   }
// ]

// [
//   {
//       "data": "",
//       "id": 1,
//       "name": "Chia Wallet",
//       "type": 0,
//       "meta": {}
//   },
//   {
//       "data": "{\"did_id\": null}",
//       "id": 2,
//       "name": "NFT Wallet",
//       "type": 10,
//       "meta": {}
//   },
//   {
//       "data": "{\"did_id\": \"0x7c7e539a7e9b42ab4715073ca6eb5610ef0513a5046990b86180b92dad322efd\"}",
//       "id": 3,
//       "name": "NFT Wallet",
//       "type": 10,
//       "meta": {}
//   },
//   {
//       "data": "a628c1c2c6fcb74d53746157e438e108eab5c0bb3e5c80ff9b1910b3e483291300",
//       "id": 4,
//       "name": "Spacebucks",
//       "type": 6,
//       "meta": {
//           "assetId": "a628c1c2c6fcb74d53746157e438e108eab5c0bb3e5c80ff9b1910b3e4832913",
//           "name": "Spacebucks"
//       }
//   },
//   {
//       "data": "",
//       "id": 5,
//       "name": "Pool wallet",
//       "type": 9,
//       "meta": {}
//   },
//   {
//       "data": "{\"origin_coin\": {\"parent_coin_info\": \"0xf6404393e9dc0b96ea0028746b60c420f77b5dcb29a040dbb35c6c3f0fb642c7\", \"puzzle_hash\": \"0xeff07522495060c066f66f32acc2a77e3a3e737aca8baea4d1a64ea4cdc13da9\", \"amount\": 1}, \"backup_ids\": [], \"num_of_backup_ids_needed\": 0, \"parent_info\": [[\"0xff0420bff87f44dacbfeeae45eb2019d09986ab966142ad6d4217929c4a85833\", {\"parent_name\": \"0x7c7e539a7e9b42ab4715073ca6eb5610ef0513a5046990b86180b92dad322efd\", \"inner_puzzle_hash\": \"0x8784fe053be6b4786f511818b7c5e3ad7809ec05b2d0413559c0b178995ef78a\", \"amount\": 1}], [\"0x61fbdb94171aa566097771fd2b4eeaa26d95d1b1a94aab286dbf2e58852ee112\", {\"parent_name\": \"0xff0420bff87f44dacbfeeae45eb2019d09986ab966142ad6d4217929c4a85833\", \"inner_puzzle_hash\": \"0x8784fe053be6b4786f511818b7c5e3ad7809ec05b2d0413559c0b178995ef78a\", \"amount\": 1}], [\"0xff0420bff87f44dacbfeeae45eb2019d09986ab966142ad6d4217929c4a85833\", {\"parent_name\": \"0x7c7e539a7e9b42ab4715073ca6eb5610ef0513a5046990b86180b92dad322efd\", \"inner_puzzle_hash\": \"0x8784fe053be6b4786f511818b7c5e3ad7809ec05b2d0413559c0b178995ef78a\", \"amount\": 1}], [\"0xeb96a1e8894d137e1e5afe03157fc4218628e11a6cdbbc94920b60aa152917f2\", {\"parent_name\": \"0x61fbdb94171aa566097771fd2b4eeaa26d95d1b1a94aab286dbf2e58852ee112\", \"inner_puzzle_hash\": \"0x8784fe053be6b4786f511818b7c5e3ad7809ec05b2d0413559c0b178995ef78a\", \"amount\": 1}], [\"0x61fbdb94171aa566097771fd2b4eeaa26d95d1b1a94aab286dbf2e58852ee112\", {\"parent_name\": \"0xff0420bff87f44dacbfeeae45eb2019d09986ab966142ad6d4217929c4a85833\", \"inner_puzzle_hash\": \"0x8784fe053be6b4786f511818b7c5e3ad7809ec05b2d0413559c0b178995ef78a\", \"amount\": 1}], [\"0x63fe5178a728ce3ef3b39aa5824b74f2830d1a149ed017857442a9c0e6ada941\", {\"parent_name\": \"0xeb96a1e8894d137e1e5afe03157fc4218628e11a6cdbbc94920b60aa152917f2\", \"inner_puzzle_hash\": \"0x8784fe053be6b4786f511818b7c5e3ad7809ec05b2d0413559c0b178995ef78a\", \"amount\": 1}], [\"0xeb96a1e8894d137e1e5afe03157fc4218628e11a6cdbbc94920b60aa152917f2\", {\"parent_name\": \"0x61fbdb94171aa566097771fd2b4eeaa26d95d1b1a94aab286dbf2e58852ee112\", \"inner_puzzle_hash\": \"0x8784fe053be6b4786f511818b7c5e3ad7809ec05b2d0413559c0b178995ef78a\", \"amount\": 1}], [\"0xd90b951a15019686f83bf60eb07a4e7fd81d0c5604417d27cc6f28decff599c7\", {\"parent_name\": \"0x63fe5178a728ce3ef3b39aa5824b74f2830d1a149ed017857442a9c0e6ada941\", \"inner_puzzle_hash\": \"0x8784fe053be6b4786f511818b7c5e3ad7809ec05b2d0413559c0b178995ef78a\", \"amount\": 1}], [\"0x63fe5178a728ce3ef3b39aa5824b74f2830d1a149ed017857442a9c0e6ada941\", {\"parent_name\": \"0xeb96a1e8894d137e1e5afe03157fc4218628e11a6cdbbc94920b60aa152917f2\", \"inner_puzzle_hash\": \"0x8784fe053be6b4786f511818b7c5e3ad7809ec05b2d0413559c0b178995ef78a\", \"amount\": 1}], [\"0xd90b951a15019686f83bf60eb07a4e7fd81d0c5604417d27cc6f28decff599c7\", {\"parent_name\": \"0x63fe5178a728ce3ef3b39aa5824b74f2830d1a149ed017857442a9c0e6ada941\", \"inner_puzzle_hash\": \"0x8784fe053be6b4786f511818b7c5e3ad7809ec05b2d0413559c0b178995ef78a\", \"amount\": 1}]], \"current_inner\": \"0xff02ffff01ff02ffff01ff02ffff03ff81bfffff01ff02ff05ff82017f80ffff01ff02ffff03ffff22ffff09ffff02ff7effff04ff02ffff04ff8217ffff80808080ff0b80ffff15ff17ff808080ffff01ff04ffff04ff28ffff04ff82017fff808080ffff04ffff04ff34ffff04ff8202ffffff04ff82017fffff04ffff04ff8202ffff8080ff8080808080ffff04ffff04ff38ffff04ff822fffff808080ffff02ff26ffff04ff02ffff04ff2fffff04ff17ffff04ff8217ffffff04ff822fffffff04ff8202ffffff04ff8205ffffff04ff820bffffff01ff8080808080808080808080808080ffff01ff088080ff018080ff0180ffff04ffff01ffffffff313dff4946ffff0233ff3c04ffffff0101ff02ff02ffff03ff05ffff01ff02ff3affff04ff02ffff04ff0dffff04ffff0bff2affff0bff22ff3c80ffff0bff2affff0bff2affff0bff22ff3280ff0980ffff0bff2aff0bffff0bff22ff8080808080ff8080808080ffff010b80ff0180ffffff02ffff03ff17ffff01ff02ffff03ff82013fffff01ff04ffff04ff30ffff04ffff0bffff0bffff02ff36ffff04ff02ffff04ff05ffff04ff27ffff04ff82023fffff04ff82053fffff04ff820b3fff8080808080808080ffff02ff7effff04ff02ffff04ffff02ff2effff04ff02ffff04ff2fffff04ff5fffff04ff82017fff808080808080ff8080808080ff2f80ff808080ffff02ff26ffff04ff02ffff04ff05ffff04ff0bffff04ff37ffff04ff2fffff04ff5fffff04ff8201bfffff04ff82017fffff04ffff10ff8202ffffff010180ff808080808080808080808080ffff01ff02ff26ffff04ff02ffff04ff05ffff04ff37ffff04ff2fffff04ff5fffff04ff8201bfffff04ff82017fffff04ff8202ffff8080808080808080808080ff0180ffff01ff02ffff03ffff15ff8202ffffff11ff0bffff01018080ffff01ff04ffff04ff20ffff04ff82017fffff04ff5fff80808080ff8080ffff01ff088080ff018080ff0180ff0bff17ffff02ff5effff04ff02ffff04ff09ffff04ff2fffff04ffff02ff7effff04ff02ffff04ffff04ff09ffff04ff0bff1d8080ff80808080ff808080808080ff5f80ffff04ffff0101ffff04ffff04ff2cffff04ff05ff808080ffff04ffff04ff20ffff04ff17ffff04ff0bff80808080ff80808080ffff0bff2affff0bff22ff2480ffff0bff2affff0bff2affff0bff22ff3280ff0580ffff0bff2affff02ff3affff04ff02ffff04ff07ffff04ffff0bff22ff2280ff8080808080ffff0bff22ff8080808080ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff7effff04ff02ffff04ff09ff80808080ffff02ff7effff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01ff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b0add5529a7ebd1b6b0cdb9b2d1003ab518db8b25346cbe717639681ca11232bbc67535567f0e5fbb54adff57fb1819035ff018080ffff04ffff01a04bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459affff04ffff0180ffff04ffff01ffa07faa3253bfddd1e0decb0906b2dc6247bbc4cf608f58345d173adb63e8b47c9fffa07c7e539a7e9b42ab4715073ca6eb5610ef0513a5046990b86180b92dad322efda0eff07522495060c066f66f32acc2a77e3a3e737aca8baea4d1a64ea4cdc13da9ffff04ffff0180ff01808080808080\", \"temp_coin\": null, \"temp_puzhash\": null, \"temp_pubkey\": null, \"sent_recovery_transaction\": false, \"metadata\": \"{}\"}",
//       "id": 6,
//       "name": "DID did:chia:103l98xn7ndp2k3c4qu72d66kzrhs2ya9q35epwrpszujmtfj9m7saanqyf",
//       "type": 8,
//       "meta": {}
//   }
// ]
