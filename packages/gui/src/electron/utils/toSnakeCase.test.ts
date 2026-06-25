import toSnakeCase from './toSnakeCase';

describe('toSnakeCase', () => {
  it('converts nested object keys by default', () => {
    expect(
      toSnakeCase({
        driverDict: {
          assetId: {
            innerPuzzleHash: '0x1234',
          },
        },
      }),
    ).toEqual({
      driver_dict: {
        asset_id: {
          inner_puzzle_hash: '0x1234',
        },
      },
    });
  });

  it('converts only root object keys when deep is false', () => {
    const assetId = '0fbdb7f21392f248f4ce3f8b1497496f056db6eb3856990ea3f697e28ec082c4';

    expect(
      toSnakeCase(
        {
          offer: {
            1: '-10000',
            6: '2323000',
            [assetId]: '1',
          },
          driverDict: {
            [assetId]: {
              innerPuzzleHash: '0x1234',
              nestedDriverInfo: {
                proofHash: '0xabcd',
              },
              alsoPreserveArrayItems: [
                {
                  arrayInnerKey: 'value',
                },
              ],
            },
          },
        },
        { deep: false },
      ),
    ).toEqual({
      offer: {
        1: '-10000',
        6: '2323000',
        [assetId]: '1',
      },
      driver_dict: {
        [assetId]: {
          innerPuzzleHash: '0x1234',
          nestedDriverInfo: {
            proofHash: '0xabcd',
          },
          alsoPreserveArrayItems: [
            {
              arrayInnerKey: 'value',
            },
          ],
        },
      },
    });
  });
});
