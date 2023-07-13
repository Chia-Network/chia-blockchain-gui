import { Search as SearchIcon } from '@chia-network/icons';
import data from '@emoji-mart/data';
import { t, Trans } from '@lingui/macro';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import { alpha, InputBase /* , InputBaseProps */, Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { init, SearchIndex } from 'emoji-mart';
import React, { useCallback } from 'react';

import Flex from '../../components/Flex';
import Color from '../../constants/Color';

init({ data });

const { emojis: allEmojis } = data;

type EmojiAndColorPickerType = {
  onSelect: (result: any) => void;
  onClickOutside?: () => void;
  currentColor?: string;
  currentEmoji?: string;
  themeColors: any;
  isDark: boolean;
};

const colorCircleStyle: any = {
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  position: 'relative',
  zIndex: 10,
  cursor: 'pointer',
};

export function randomEmoji() {
  const peopleAndNatureEmojisWords = (data as any).originalCategories
    .filter((category: any) => ['people', 'nature'].indexOf(category.id) > -1)
    .map((category: any) => category.emojis)
    .flat();
  const emojiName = peopleAndNatureEmojisWords[Math.floor(peopleAndNatureEmojisWords.length * Math.random())];
  return allEmojis[emojiName].skins[0].native;
}

export default function EmojiAndColorPicker(props: EmojiAndColorPickerType) {
  const { onSelect = () => {}, onClickOutside = () => {}, currentColor, currentEmoji, themeColors, isDark } = props;
  const cmpRef = React.useRef(null);
  const [emojiFilter, setEmojiFilter] = React.useState<string[]>([]);
  const theme: any = useTheme();

  const pickerStyle: any = {
    backgroundColor: isDark ? Color.Neutral[800] : Color.Neutral[50],
    border: `1px solid ${isDark ? theme.palette.border.dark : theme.palette.border.main}`,
    boxShadow: `0px 6px 19px ${alpha(Color.Neutral[800], 0.28)}, 0px 27px 65px ${alpha(Color.Neutral[500], 0.39)}`,
    borderRadius: '8px',
    padding: '0px',
    position: 'absolute',
    top: '30px',
    left: '25px',
  };

  const outsideClickListener = useCallback(
    (e: any) => {
      if (cmpRef.current && !(cmpRef.current as HTMLElement).contains(e.target)) {
        onClickOutside();
      }
    },
    [onClickOutside]
  );

  React.useEffect(() => {
    document.addEventListener('mousedown', outsideClickListener);
    return () => {
      document.removeEventListener('mousedown', outsideClickListener);
    };
  }, [outsideClickListener]);

  const isRetina = window.matchMedia('(-webkit-min-device-pixel-ratio: 2),(min-resolution: 192dpi)').matches;

  function renderColorPicker() {
    const colorNodes = Object.keys(themeColors)
      .filter((colorKey) => colorKey !== 'default')
      .map((colorKey) => {
        const style = { ...colorCircleStyle, background: themeColors[colorKey].border };
        return (
          <div
            style={style}
            onClick={() => {
              onSelect(colorKey);
            }}
          >
            {colorKey === currentColor ? (
              <div
                style={{
                  position: 'absolute',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  border: `2px solid ${themeColors[colorKey].border}`,
                  zIndex: 11,
                  top: '-4px',
                  left: '-4px',
                }}
              />
            ) : null}
          </div>
        );
      });
    return (
      <Flex
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          columnGap: '8px',
          rowGap: '8px',
          width: '262px',
          padding: '15px 15px 0 15px',
        }}
      >
        {colorNodes}
      </Flex>
    );
  }

  function renderSearch() {
    return (
      <Flex sx={{ padding: '0 15px' }}>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            border: `1px solid ${isDark ? theme.palette.border.dark : theme.palette.border.main}`,
            borderRadius: '8px',
            marginTop: '15px',
            input: {
              paddingLeft: '30px',
              fontSize: '14px',
            },
            '> div': {
              display: 'block',
            },
            padding: '5px 0 0 0',
          }}
        >
          <SearchIcon
            sx={{
              position: 'absolute',
              left: '8px',
              top: '8px',
              width: '17px',
              height: '17px',
              path: {
                stroke: isDark ? Color.Neutral[100] : Color.Neutral[400],
                fill: 'none',
              },
            }}
            color="secondary"
          />
          <InputBase
            autoFocus
            onChange={async (e: any) => {
              if (e.target.value !== '') {
                const emojis = await SearchIndex.search(e.target.value);
                if (Array.isArray(emojis) && emojis.length) {
                  setEmojiFilter(emojis.map((emoji: any) => emoji.skins[0].native));
                }
              } else {
                setEmojiFilter([]);
              }
            }}
            size="small"
            placeholder={t`Search`}
          />
        </Box>
      </Flex>
    );
  }

  function renderEmojis() {
    const style: any = {
      display: 'flex',
      maxHeight: '171px',
      overflowY: 'auto',
      scrollBehavior: 'auto',
      fontSize: '14px',
      width: '246px',
      gap: '3px',
      marginTop: '10px',
      flexWrap: 'wrap',
      padding: '5px',
      '>div': {
        fontSize: '18px',
        textAlign: 'center',
      },
      '::-webkit-scrollbar': {
        background: 'transparent',
      },
      '::-webkit-scrollbar-thumb': {
        background: theme.palette.border,
        height: '50px',
        borderRadius: '10px',
        width: '2px',
        border: '3px solid transparent',
        backgroundClip: 'content-box',
      },
    };
    const emojiList = Object.keys(allEmojis)
      .filter((emojiName: string) => {
        if (emojiFilter.length) {
          return emojiFilter.indexOf(allEmojis[emojiName].skins[0].native) > -1;
        }
        return true;
      })
      .map((emojiName: string) => (
        <div
          onClick={() => {
            onSelect(allEmojis[emojiName].skins[0].native);
          }}
          style={{
            position: 'relative',
            borderRadius: '4px',
            background: `${
              allEmojis[emojiName].skins[0].native === currentEmoji
                ? themeColors[currentColor || 'default'].main
                : 'inherit'
            }`,
            width: '25px',
            height: '25px',
            zIndex: 9,
            paddingTop: '2px',
            cursor: 'pointer',
            fontSize: isRetina ? '19px' : '15px',
            lineHeight: '22px',
            fontFamily: 'none',
          }}
        >
          {allEmojis[emojiName].skins[0].native}
        </div>
      ));
    return (
      <Flex sx={{ padding: '0 0 10px 7px' }}>
        <Flex sx={style}>{emojiList}</Flex>
      </Flex>
    );
  }

  function renderAddRemoveRandom() {
    return (
      <Flex sx={{ padding: '17px 13px 0 17px' }} justifyContent="space-between">
        <Typography
          variant="body2"
          sx={{
            fontWeight: 'bold',
            lineHeight: '23px',
            cursor: currentEmoji === '' ? 'default' : 'pointer',
            color: theme.palette.colors.default.border,
          }}
          onClick={() => currentEmoji && onSelect('')}
        >
          {currentEmoji === '' ? <Trans>Add Icon</Trans> : <Trans>Remove Icon</Trans>}
        </Typography>
        <Flex
          sx={{
            cursor: 'pointer',
            svg: {
              fill: theme.palette.colors.default.border,
            },
          }}
          onClick={() => onSelect(randomEmoji())}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 'bold',
              lineHeight: '23px',
              color: theme.palette.colors.default.border,
            }}
          >
            <Trans>Random</Trans>
          </Typography>

          <ShuffleIcon />
        </Flex>
      </Flex>
    );
  }

  return (
    <Box style={pickerStyle} ref={cmpRef}>
      {renderColorPicker()}
      {renderAddRemoveRandom()}
      {renderSearch()}
      {renderEmojis()}
    </Box>
  );
}
