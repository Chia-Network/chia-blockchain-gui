import { useGetOfferSummaryMutation } from '@chia-network/api-react';
import { Dropzone, Flex, useSerializedNavigationState, useShowError, useThemeAssets } from '@chia-network/core';
import { Trans, t } from '@lingui/macro';
import { Box, Card, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

function Background(props: { children: React.ReactNode }) {
  const { children } = props;
  return (
    <Box position="relative" p={3}>
      {children}
    </Box>
  );
}

export default function OfferBuilderImport() {
  const { offerFileIcon: OfferFileIcon } = useThemeAssets();
  const theme = useTheme();
  const { navigate } = useSerializedNavigationState();
  const [getOfferSummary] = useGetOfferSummaryMutation();
  // const openDialog = useOpenDialog();
  const showError = useShowError();
  const [isParsing, setIsParsing] = React.useState<boolean>(false);

  function parseOfferData(
    data: string,
  ): [offerData: string | undefined, leadingText: string | undefined, trailingText: string | undefined] {
    // Parse raw offer data looking for the bech32-encoded offer data and any surrounding text.
    const matches = data.match(/(?<leading>.*)(?<offer>offer1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)(?<trailing>.*)/s);
    return [matches?.groups?.offer, matches?.groups?.leading, matches?.groups?.trailing];
  }

  async function parseOfferSummary(rawOfferData: string) {
    const [offerData] = parseOfferData(rawOfferData);
    if (!offerData) {
      throw new Error(t`Could not parse offer data`);
    }

    const { summary } = await getOfferSummary({ offerData }).unwrap();

    if (summary) {
      navigate('/dashboard/offers/view', {
        state: {
          offerData,
          offerSummary: summary,
          imported: true,
          referrerPath: '/dashboard/offers',
        },
      });
    } else {
      console.warn('Unable to parse offer data');
    }
  }

  async function handleOpen(file: File) {
    if (file.size > 1024 * 1024) {
      showError(new Error(t`Offer file is too large (> 1MB)`));
      return;
    }

    setIsParsing(true);

    const reader = new FileReader();

    reader.onload = async () => {
      const offerData = reader.result as string;

      try {
        await parseOfferSummary(offerData);
      } catch (e) {
        showError(e);
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsText(file, 'utf8');
  }

  async function handleDrop(acceptedFiles: [File]) {
    if (acceptedFiles.length !== 1) {
      showError(new Error('Please drop one offer file at a time'));
    } else {
      handleOpen(acceptedFiles[0]);
    }
  }

  async function pasteParse(text: string) {
    try {
      await parseOfferSummary(text);
    } catch (e) {
      showError(e);
    } finally {
      setIsParsing(false);
    }
  }

  const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
  const hotKey = isMac ? 'meta+v' : 'ctrl+v';

  useHotkeys(hotKey, () => {
    navigator.clipboard
      .readText()
      .then((text) => {
        pasteParse(text);
      })
      .catch((err) => {
        console.error('Error during paste from clipboard', err);
      });
  });

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        borderColor: alpha(theme.palette.primary.main, 0.68),
        backgroundColor: alpha(theme.palette.background.paper, 0.78),
        '&:hover': {
          borderColor: theme.palette.primary.main,
          boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.22)}, 0 18px 48px ${alpha(
            theme.palette.text.primary,
            0.1,
          )}`,
        },
      }}
    >
      <Dropzone maxFiles={1} onDrop={handleDrop} processing={isParsing} background={Background}>
        <Flex flexDirection="column" alignItems="center">
          <OfferFileIcon />
          <Typography color="textSecondary" variant="h6" textAlign="center">
            <Trans>Drag & Drop an Offer File, Paste </Trans>
            {isMac ? <Trans>(⌘V) a blob</Trans> : <Trans>(Ctrl-V) a blob</Trans>}
          </Typography>
          <Typography color="textSecondary" textAlign="center">
            <Trans>
              or <span style={{ color: theme.palette.primary.main }}>browse</span> on your computer
            </Trans>
          </Typography>
        </Flex>
      </Dropzone>
    </Card>
  );
}
