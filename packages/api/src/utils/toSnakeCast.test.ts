import toSnakeCase from './toSnakeCase';

describe('toSnakeCase', () => {
  it('converts object keys to snake case', () => {
    const input = {
      firstName: 'John',
      lastName: 'Doe',
      address: {
        streetAddress: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
      },
    };
    const expectedOutput = {
      first_name: 'John',
      last_name: 'Doe',
      address: {
        street_address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip_code: '12345',
      },
    };
    expect(toSnakeCase(input)).toEqual(expectedOutput);
  });

  it('handles arrays', () => {
    const input = [
      {
        firstName: 'John',
        lastName: 'Doe',
      },
      {
        firstName: 'Jane',
        lastName: 'Doe',
      },
    ];
    const expectedOutput = [
      {
        first_name: 'John',
        last_name: 'Doe',
      },
      {
        first_name: 'Jane',
        last_name: 'Doe',
      },
    ];
    expect(toSnakeCase(input)).toEqual(expectedOutput);
  });

  it('handles null and undefined values', () => {
    const input = {
      firstName: null,
      lastName: undefined,
    };
    const expectedOutput = {
      first_name: null,
      last_name: undefined,
    };
    expect(toSnakeCase(input)).toEqual(expectedOutput);
  });
});
