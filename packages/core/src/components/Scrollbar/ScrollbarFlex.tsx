import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import React from 'react';

import Flex, { type FlexProps } from '../Flex';

export type ScrollbarFlexProps = FlexProps & {};

export default function ScrollbarFlex(props: ScrollbarFlexProps) {
  const { children, ...rest } = props;

  return (
    <Flex component={OverlayScrollbarsComponent} {...rest}>
      {children}
    </Flex>
  );
}
