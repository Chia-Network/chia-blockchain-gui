import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Button } from '@mui/material';

const theme = createTheme({});

describe('<Button>', () => {
  it('mounts', () => {
    cy.mount(
      <ThemeProvider theme={theme}>
        <Button data-testid="button">My Test Text</Button>
      </ThemeProvider>
    );

    cy.contains('[data-testid=button]', 'My Test Text');
  });

  it('use variant contained', () => {
    cy.mount(
      <ThemeProvider theme={theme}>
        <Button data-testid="button" variant="contained">
          Variant Contained
        </Button>
      </ThemeProvider>
    );

    cy.contains('[data-testid=button]', 'Variant Contained');
  });

  it('call click event', () => {
    const onClickSpy = cy.spy().as('onClickSpy');

    cy.mount(
      <ThemeProvider theme={theme}>
        <Button data-testid="button" onClick={onClickSpy}>
          Click on meeeeee
        </Button>
      </ThemeProvider>
    );

    cy.contains('[data-testid=button]', 'Click on me');
    cy.get('[data-testid=button]').click();
    cy.get('@onClickSpy').should('have.been.calledWith');
  });

  it('should throw error', () => {
    cy.mount(
      <ThemeProvider theme={theme}>
        <Button data-testid="button">Error</Button>
      </ThemeProvider>
    );

    cy.contains('[data-testid=button]', 'Success');
  });
});
