import React from 'react';

import Flex, { type FlexProps } from '../Flex';

import Scrollbar from './Scrollbar';

export type ScrollbarFlexProps = FlexProps & {};

export default function ScrollbarFlex(props: ScrollbarFlexProps) {
  const { children, className = '', ...rest } = props;

  return (
    <Flex component={Scrollbar} className={`os-host-flexbox ${className}`} {...rest}>
      {children}
    </Flex>
  );
}
