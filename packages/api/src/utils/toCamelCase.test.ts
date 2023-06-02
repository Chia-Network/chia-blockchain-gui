import toCamelCase from './toCamelCase';

describe('toCamelCase', () => {
  it('converts object keys to camel case', () => {
    const input = {
      snake_case: 'value',
      nested_object: {
        another_snake_case: 'another_value',
      },
    };
    const expectedOutput = {
      snakeCase: 'value',
      nestedObject: {
        anotherSnakeCase: 'another_value',
      },
    };
    expect(toCamelCase(input)).toEqual(expectedOutput);
  });

  it('converts object keys in from an array of objects to camel case', () => {
    const input = [
      {
        snake_case: 'value',
      },
    ];
    const expectedOutput = [
      {
        snakeCase: 'value',
      },
    ];
    expect(toCamelCase(input)).toEqual(expectedOutput);
  });

  it('does not convert keys without underscores to camel case', () => {
    const input = {
      keyWithoutUnderscores: 'value',
      TitleCaseKey: 'value',
    };
    const expectedOutput = {
      keyWithoutUnderscores: 'value',
      TitleCaseKey: 'value',
    };
    expect(toCamelCase(input)).toEqual(expectedOutput);
  });

  it('handles null input by returning empty object', () => {
    const input = null;
    const expectedOutput = {};
    expect(toCamelCase(input as any)).toEqual(expectedOutput);
  });

  it('handles undefined input by returning empty object', () => {
    const input = undefined;
    const expectedOutput = {};
    expect(toCamelCase(input as any)).toEqual(expectedOutput);
  });

  it('handles non-object input', () => {
    const input = 'not an object';
    const expectedOutput = {
      '0': 'n',
      '1': 'o',
      '10': 'e',
      '11': 'c',
      '12': 't',
      '2': 't',
      '3': ' ',
      '4': 'a',
      '5': 'n',
      '6': ' ',
      '7': 'o',
      '8': 'b',
      '9': 'j',
    };
    expect(toCamelCase(input)).toEqual(expectedOutput);
  });
});
