import type { AddressContact } from '@chia-network/core';
import { AddressBookContext } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Autocomplete as MaterialAutocomplete, FormControl, TextField, TextFieldProps } from '@mui/material';
import React, { useEffect, useState, useContext } from 'react';
import { useController, useFormContext } from 'react-hook-form';

type Props = TextFieldProps &
  AddressBookAutocompleteProps<string, false, false, true> & {
    name: string;
    fullWidth?: boolean;
    freeSolo?: boolean;
    renderInput?: any;
  };

export default function AddressBookAutocomplete(props: Props) {
  const { name, required, fullWidth, freeSolo, disableClearable, ...rest } = props;
  const [addressBook, ,] = useContext(AddressBookContext);
  const [options, setOptions] = useState([]);
  const { control } = useFormContext();

  const {
    field: { onChange, onBlur },
  } = useController({
    name,
    control,
  });

  function handleChange(newValue: any) {
    const updatedValue = newValue || '';
    updatedValue.id ? onChange(updatedValue.id) : onChange(updatedValue);
  }

  useEffect(() => {
    const contactList = [];
    addressBook.map((contact: AddressContact) =>
      contact.addresses.forEach((addressInfo) => {
        const nameStr = JSON.stringify(contact.name).slice(1, -1);
        const addNameStr = JSON.stringify(addressInfo.name).slice(1, -1);
        const optionStr = `${nameStr} | ${addNameStr}`;
        contactList.push({ label: optionStr, id: addressInfo.address });
      })
    );
    setOptions(contactList);
  }, [addressBook]);

  return (
    <FormControl variant="filled" fullWidth>
      <MaterialAutocomplete
        autoComplete
        autoSelect
        blurOnSelect
        options={options}
        onChange={(_e, newValue) => handleChange(newValue)}
        name={name}
        renderInput={(params) => (
          <TextField
            autoComplete="off"
            label={<Trans>Address / Puzzle hash or Address Book Contact</Trans>}
            required={required}
            onBlur={onBlur}
            {...rest}
            {...params}
          />
        )}
        freeSolo={freeSolo}
        fullWidth={fullWidth}
        disableClearable={disableClearable}
      />
    </FormControl>
  );
}
