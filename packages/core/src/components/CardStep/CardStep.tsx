import { Avatar, Card, CardContent, CardHeader, Divider, Grid, Typography } from '@mui/material';
import React, { ReactNode } from 'react';

import Flex from '../Flex';

type Props = {
  children: ReactNode;
  title: ReactNode;
  step?: ReactNode;
  action?: ReactNode;
};

export default function CardStep(props: Props) {
  const { children, step, title, action } = props;
  const avatar = React.useMemo(() => {
    if (step === undefined) {
      return undefined;
    }
    return (
      <Avatar aria-label="step" sx={{ width: '2rem', height: '2rem' }}>
        {step}
      </Avatar>
    );
  }, [step]);

  return (
    <Card>
      <CardHeader avatar={avatar} title={<Typography variant="h6">{title}</Typography>} action={action} />
      <Divider />
      <CardContent sx={{ paddingLeft: '72px' }}>
        <Grid container>
          <Grid md={10} lg={8} item>
            <Flex flexDirection="column" gap={2}>
              {children}
            </Flex>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
